import { Injectable } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import type {
  ExecutiveSummaryResponse,
  FairPerformanceResponse,
  FairComparisonResponse,
  FairTargetsResponse,
  PipelineOverviewResponse,
  PipelineVelocityResponse,
  WinLossResponse,
  RevenueResponse,
  ForecastResponse,
  CustomerOverviewResponse,
  CustomerSegmentationResponse,
  CustomerLifecycleResponse,
  ProductAnalysisResponse,
  ProductFairMatrixResponse,
  TeamPerformanceResponse,
  IndividualPerformanceResponse,
  ActivityAnalysisResponse,
} from '@crm/shared';
import {
  budgetToNumber,
  generateMonthLabels,
  safePercent,
  daysBetween,
  median,
  calculateWeightedValue,
} from './report.helpers';

const OPEN_STAGES = ['tanisma', 'toplanti', 'teklif', 'sozlesme'];
const TERMINAL_STAGES = ['satisa_donustu', 'olumsuz'];
const ALL_STAGES: Array<{ key: string; label: string }> = [
  { key: 'tanisma', label: 'Tanışma' },
  { key: 'toplanti', label: 'Toplantı' },
  { key: 'teklif', label: 'Teklif' },
  { key: 'sozlesme', label: 'Sözleşme' },
  { key: 'satisa_donustu', label: 'Satışa Dönüştü' },
  { key: 'olumsuz', label: 'Olumsuz' },
];
const CONVERSION_RATE_LABELS: Record<string, string> = {
  very_high: 'Çok Yüksek',
  high: 'Yüksek',
  medium: 'Orta',
  low: 'Düşük',
  very_low: 'Çok Düşük',
};

function resolvePeriodDates(params: {
  startDate?: string;
  endDate?: string;
  period?: string;
}): { start: Date | null; end: Date | null; prevStart: Date | null; prevEnd: Date | null } {
  const now = new Date();

  if (params.startDate && params.endDate) {
    const start = new Date(params.startDate);
    const end = new Date(params.endDate);
    const durationMs = end.getTime() - start.getTime();
    return {
      start,
      end,
      prevStart: new Date(start.getTime() - durationMs),
      prevEnd: new Date(start.getTime() - 1),
    };
  }

  switch (params.period) {
    case 'this_month': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const prevEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return { start, end, prevStart, prevEnd };
    }
    case 'this_quarter': {
      const q = Math.floor(now.getMonth() / 3);
      const start = new Date(now.getFullYear(), q * 3, 1);
      const end = new Date(now.getFullYear(), q * 3 + 3, 0, 23, 59, 59, 999);
      const prevStart = new Date(now.getFullYear(), q * 3 - 3, 1);
      const prevEnd = new Date(now.getFullYear(), q * 3, 0, 23, 59, 59, 999);
      return { start, end, prevStart, prevEnd };
    }
    case 'this_year': {
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      const prevStart = new Date(now.getFullYear() - 1, 0, 1);
      const prevEnd = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
      return { start, end, prevStart, prevEnd };
    }
    default:
      return { start: null, end: null, prevStart: null, prevEnd: null };
  }
}

@Injectable()
export class ReportService {
  constructor(readonly prisma: PrismaService) {}

  async getExecutiveSummary(params: {
    startDate?: string;
    endDate?: string;
    period?: string;
  }): Promise<ExecutiveSummaryResponse> {
    const { start, end, prevStart, prevEnd } = resolvePeriodDates(params);
    const now = new Date();
    const dateFilter = start && end ? { createdAt: { gte: start, lte: end } } : {};

    const [activeFairs, totalCustomers, opportunities, prevOpportunities] =
      await Promise.all([
        this.prisma.fair.count({
          where: { startDate: { lte: now }, endDate: { gte: now } },
        }),
        this.prisma.customer.count(),
        this.prisma.opportunity.findMany({
          where: dateFilter,
          select: {
            id: true,
            budgetRaw: true,
            budgetCurrency: true,
            conversionRate: true,
            currentStage: true,
            createdAt: true,
            fairId: true,
            customerId: true,
            customer: { select: { id: true, company: true, name: true } },
            fair: { select: { id: true, name: true } },
          },
        }),
        prevStart && prevEnd
          ? this.prisma.opportunity.findMany({
              where: { createdAt: { gte: prevStart, lte: prevEnd } },
              select: {
                budgetRaw: true,
                currentStage: true,
                conversionRate: true,
              },
            })
          : Promise.resolve([]),
      ]);

    const openOpps = opportunities.filter((o) => OPEN_STAGES.includes(o.currentStage));
    const wonOpps = opportunities.filter((o) => o.currentStage === 'satisa_donustu');
    const closedOpps = opportunities.filter((o) => TERMINAL_STAGES.includes(o.currentStage));

    const pipelineValue = openOpps.reduce((s, o) => s + budgetToNumber(o.budgetRaw), 0);
    const wonRevenue = wonOpps.reduce((s, o) => s + budgetToNumber(o.budgetRaw), 0);
    const conversionRate = safePercent(wonOpps.length, closedOpps.length);

    let previousPeriod: ExecutiveSummaryResponse['kpis']['previousPeriod'];
    if (prevOpportunities.length > 0) {
      const prevOpen = prevOpportunities.filter((o) => OPEN_STAGES.includes(o.currentStage));
      const prevWon = prevOpportunities.filter((o) => o.currentStage === 'satisa_donustu');
      const prevClosed = prevOpportunities.filter((o) => TERMINAL_STAGES.includes(o.currentStage));
      const prevActiveFairs = await this.prisma.fair.count({
        where: prevStart && prevEnd
          ? { startDate: { lte: prevEnd }, endDate: { gte: prevStart } }
          : undefined,
      });
      const prevTotalCustomers = await this.prisma.customer.count({
        where: prevEnd ? { createdAt: { lte: prevEnd } } : undefined,
      });
      previousPeriod = {
        activeFairs: prevActiveFairs,
        openOpportunities: prevOpen.length,
        pipelineValue: prevOpen.reduce((s, o) => s + budgetToNumber(o.budgetRaw), 0),
        wonRevenue: prevWon.reduce((s, o) => s + budgetToNumber(o.budgetRaw), 0),
        conversionRate: safePercent(prevWon.length, prevClosed.length),
        totalCustomers: prevTotalCustomers,
      };
    }

    // Monthly revenue trend (last 12 months)
    const monthLabels = generateMonthLabels(12);
    const allWonOpps = await this.prisma.opportunity.findMany({
      where: {
        currentStage: 'satisa_donustu',
        updatedAt: { gte: monthLabels[0]!.start },
      },
      select: { budgetRaw: true, updatedAt: true },
    });
    const monthlyRevenueTrend = monthLabels.map((m) => {
      const monthWon = allWonOpps.filter(
        (o) => o.updatedAt >= m.start && o.updatedAt <= m.end,
      );
      return { month: m.label, value: monthWon.reduce((s, o) => s + budgetToNumber(o.budgetRaw), 0) };
    });

    // Pipeline stage distribution
    const pipelineStageDistribution = ALL_STAGES.map((s) => {
      const stageOpps = opportunities.filter((o) => o.currentStage === s.key);
      return {
        stage: s.key,
        label: s.label,
        count: stageOpps.length,
        value: stageOpps.reduce((sum, o) => sum + budgetToNumber(o.budgetRaw), 0),
      };
    });

    // Conversion rate distribution
    const conversionRateDistribution = Object.entries(CONVERSION_RATE_LABELS).map(
      ([rate, label]) => ({
        rate,
        label,
        count: opportunities.filter((o) => o.conversionRate === rate).length,
      }),
    );

    // New opportunity sparkline (daily for current month)
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const currentDayOfMonth = now.getDate();
    const sparkline: number[] = [];
    for (let d = 1; d <= Math.min(currentDayOfMonth, daysInMonth); d++) {
      const dayStart = new Date(now.getFullYear(), now.getMonth(), d);
      const dayEnd = new Date(now.getFullYear(), now.getMonth(), d, 23, 59, 59, 999);
      sparkline.push(
        opportunities.filter((o) => o.createdAt >= dayStart && o.createdAt <= dayEnd).length,
      );
    }

    // Top 5 fairs by open opportunity count
    const fairMap = new Map<string, { id: string; name: string; count: number }>();
    for (const opp of openOpps) {
      const entry = fairMap.get(opp.fairId) ?? {
        id: opp.fair.id,
        name: opp.fair.name,
        count: 0,
      };
      entry.count++;
      fairMap.set(opp.fairId, entry);
    }
    const topFairs = [...fairMap.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map((f) => ({ id: f.id, name: f.name, openOpportunities: f.count }));

    // Top 5 customers by total budget value
    const custMap = new Map<
      string,
      { id: string; company: string; name: string; totalValue: number; count: number }
    >();
    for (const opp of opportunities) {
      const entry = custMap.get(opp.customerId) ?? {
        id: opp.customer.id,
        company: opp.customer.company,
        name: opp.customer.name,
        totalValue: 0,
        count: 0,
      };
      entry.totalValue += budgetToNumber(opp.budgetRaw);
      entry.count++;
      custMap.set(opp.customerId, entry);
    }
    const topCustomers = [...custMap.values()]
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 5)
      .map((c) => ({
        id: c.id,
        company: c.company,
        name: c.name,
        totalValue: c.totalValue,
        opportunityCount: c.count,
      }));

    // Recent won opportunities (last 10)
    const recentWon = await this.prisma.opportunity.findMany({
      where: { currentStage: 'satisa_donustu' },
      orderBy: { updatedAt: 'desc' },
      take: 10,
      select: {
        id: true,
        budgetRaw: true,
        budgetCurrency: true,
        updatedAt: true,
        customer: { select: { company: true } },
        fair: { select: { name: true } },
      },
    });
    const recentWonOpportunities = recentWon.map((o) => ({
      id: o.id,
      customerCompany: o.customer.company,
      fairName: o.fair.name,
      value: budgetToNumber(o.budgetRaw),
      currency: o.budgetCurrency ?? 'TRY',
      date: o.updatedAt.toISOString(),
    }));

    return {
      kpis: {
        activeFairs,
        openOpportunities: openOpps.length,
        pipelineValue,
        wonRevenue,
        conversionRate,
        totalCustomers,
        previousPeriod,
      },
      monthlyRevenueTrend,
      pipelineStageDistribution,
      conversionRateDistribution,
      newOpportunitySparkline: sparkline,
      topFairs,
      topCustomers,
      recentWonOpportunities,
    };
  }

  async getFairPerformance(params: {
    startDate?: string;
    endDate?: string;
    status?: string;
    createdById?: string;
  }): Promise<FairPerformanceResponse> {
    const now = new Date();
    const where: Record<string, unknown> = {};

    if (params.startDate) where.startDate = { ...(where.startDate as object ?? {}), gte: new Date(params.startDate) };
    if (params.endDate) where.startDate = { ...(where.startDate as object ?? {}), lte: new Date(params.endDate) };
    if (params.createdById) where.createdById = params.createdById;
    if (params.status === 'active') {
      where.startDate = { ...(where.startDate as object ?? {}), lte: now };
      where.endDate = { gte: now };
    } else if (params.status === 'past') {
      where.endDate = { lt: now };
    }

    const fairs = await this.prisma.fair.findMany({
      where,
      include: {
        opportunities: {
          select: {
            id: true,
            budgetRaw: true,
            currentStage: true,
            conversionRate: true,
          },
        },
      },
      orderBy: { startDate: 'desc' },
    });

    let totalOpportunities = 0;
    let totalWonRevenue = 0;
    let totalWon = 0;
    let totalClosed = 0;

    const fairOpportunityCounts: FairPerformanceResponse['fairOpportunityCounts'] = [];
    const fairPipelineValues: FairPerformanceResponse['fairPipelineValues'] = [];
    const fairConversionRates: FairPerformanceResponse['fairConversionRates'] = [];
    const scatterData: FairPerformanceResponse['scatterData'] = [];
    const tableData: FairPerformanceResponse['tableData'] = [];

    for (const fair of fairs) {
      const opps = fair.opportunities;
      const won = opps.filter((o) => o.currentStage === 'satisa_donustu');
      const lost = opps.filter((o) => o.currentStage === 'olumsuz');
      const open = opps.filter((o) => OPEN_STAGES.includes(o.currentStage));
      const closed = opps.filter((o) => TERMINAL_STAGES.includes(o.currentStage));
      const wonRev = won.reduce((s, o) => s + budgetToNumber(o.budgetRaw), 0);
      const pipelineVal = open.reduce((s, o) => s + budgetToNumber(o.budgetRaw), 0);
      const rate = safePercent(won.length, closed.length);

      totalOpportunities += opps.length;
      totalWonRevenue += wonRev;
      totalWon += won.length;
      totalClosed += closed.length;

      const totalTonnage = await this.prisma.opportunityProduct.aggregate({
        where: { opportunity: { fairId: fair.id } },
        _sum: { quantity: true },
      });

      fairOpportunityCounts.push({
        fairId: fair.id, fairName: fair.name,
        total: opps.length, won: won.length, lost: lost.length, open: open.length,
      });
      fairPipelineValues.push({ fairId: fair.id, fairName: fair.name, pipelineValue: pipelineVal, wonRevenue: wonRev });
      fairConversionRates.push({ fairId: fair.id, fairName: fair.name, rate });
      scatterData.push({
        fairId: fair.id, fairName: fair.name,
        opportunityCount: opps.length, wonRevenue: wonRev, totalOpportunities: opps.length,
      });
      tableData.push({
        fairId: fair.id, fairName: fair.name,
        startDate: fair.startDate.toISOString(), endDate: fair.endDate.toISOString(),
        opportunityCount: opps.length, won: won.length, lost: lost.length, open: open.length,
        pipelineValue: pipelineVal, wonRevenue: wonRev, conversionRate: rate,
        totalTonnage: totalTonnage._sum.quantity ?? 0,
      });
    }

    return {
      kpis: {
        totalFairs: fairs.length,
        totalOpportunities,
        totalWonRevenue,
        avgConversionRate: safePercent(totalWon, totalClosed),
      },
      fairOpportunityCounts,
      fairPipelineValues,
      fairConversionRates: fairConversionRates.sort((a, b) => b.rate - a.rate),
      scatterData,
      tableData,
    };
  }

  async getFairComparison(fairIds: string[]): Promise<FairComparisonResponse> {
    if (fairIds.length === 0) return { fairs: [], stageMatrix: [], productMatrix: [] };

    const fairs = await this.prisma.fair.findMany({
      where: { id: { in: fairIds } },
      include: {
        opportunities: {
          select: {
            id: true,
            budgetRaw: true,
            currentStage: true,
            conversionRate: true,
            opportunityProducts: {
              select: {
                quantity: true,
                product: { select: { name: true } },
              },
            },
          },
        },
      },
    });

    const fairsData: FairComparisonResponse['fairs'] = [];
    const stageMatrix: FairComparisonResponse['stageMatrix'] = [];
    const productMatrix: FairComparisonResponse['productMatrix'] = [];

    for (const fair of fairs) {
      const opps = fair.opportunities;
      const won = opps.filter((o) => o.currentStage === 'satisa_donustu');
      const lost = opps.filter((o) => o.currentStage === 'olumsuz');
      const open = opps.filter((o) => OPEN_STAGES.includes(o.currentStage));
      const closed = opps.filter((o) => TERMINAL_STAGES.includes(o.currentStage));
      const wonRev = won.reduce((s, o) => s + budgetToNumber(o.budgetRaw), 0);
      const pipelineVal = open.reduce((s, o) => s + budgetToNumber(o.budgetRaw), 0);

      let totalTonnage = 0;
      let wonTonnage = 0;
      const stages: Record<string, number> = {};
      const products: Record<string, number> = {};

      for (const opp of opps) {
        stages[opp.currentStage] = (stages[opp.currentStage] ?? 0) + 1;
        for (const op of opp.opportunityProducts) {
          products[op.product.name] = (products[op.product.name] ?? 0) + (op.quantity ?? 0);
          totalTonnage += op.quantity ?? 0;
          if (opp.currentStage === 'satisa_donustu') wonTonnage += op.quantity ?? 0;
        }
      }

      fairsData.push({
        fairId: fair.id, fairName: fair.name,
        total: opps.length, won: won.length, lost: lost.length, open: open.length,
        pipelineValue: pipelineVal, wonRevenue: wonRev,
        totalTonnage, wonTonnage,
        conversionRate: safePercent(won.length, closed.length),
        avgDealValue: opps.length > 0
          ? opps.reduce((s, o) => s + budgetToNumber(o.budgetRaw), 0) / opps.length
          : 0,
      });

      stageMatrix.push({ fairId: fair.id, fairName: fair.name, stages });
      productMatrix.push({ fairId: fair.id, fairName: fair.name, products });
    }

    return { fairs: fairsData, stageMatrix, productMatrix };
  }

  async getFairTargets(fairIds: string[], status?: string): Promise<FairTargetsResponse> {
    const now = new Date();
    const where: Record<string, unknown> = {};
    if (fairIds.length > 0) where.id = { in: fairIds };
    if (status === 'active') {
      where.startDate = { lte: now };
      where.endDate = { gte: now };
    } else if (status === 'past') {
      where.endDate = { lt: now };
    }

    const fairs = await this.prisma.fair.findMany({
      where,
      include: {
        opportunities: {
          select: {
            id: true,
            budgetRaw: true,
            currentStage: true,
            opportunityProducts: { select: { quantity: true } },
          },
        },
      },
      orderBy: { startDate: 'desc' },
    });

    const allFairTargets: FairTargetsResponse['allFairTargets'] = [];

    for (const fair of fairs) {
      const won = fair.opportunities.filter((o) => o.currentStage === 'satisa_donustu');
      const budgetActual = won.reduce((s, o) => s + budgetToNumber(o.budgetRaw), 0);
      const tonnageActual = won.reduce(
        (s, o) => s + o.opportunityProducts.reduce((ts, p) => ts + (p.quantity ?? 0), 0),
        0,
      );
      const leadActual = fair.opportunities.length;

      const budgetTarget = budgetToNumber(fair.targetBudget);
      const tonnageTarget = fair.targetTonnage ?? 0;
      const leadTarget = fair.targetLeadCount ?? 0;

      allFairTargets.push({
        fairId: fair.id,
        fairName: fair.name,
        budgetTarget,
        budgetActual,
        budgetPercent: safePercent(budgetActual, budgetTarget),
        tonnageTarget,
        tonnageActual,
        tonnagePercent: safePercent(tonnageActual, tonnageTarget),
        leadTarget,
        leadActual,
        leadPercent: safePercent(leadActual, leadTarget),
      });
    }

    const avgTargetCompletion =
      allFairTargets.length > 0
        ? allFairTargets.reduce(
            (s, f) => s + (f.budgetPercent + f.tonnagePercent + f.leadPercent) / 3,
            0,
          ) / allFairTargets.length
        : 0;

    const selectedFairTargets =
      fairIds.length === 1 ? allFairTargets[0] : undefined;

    return { selectedFairTargets, allFairTargets, avgTargetCompletion: Math.round(avgTargetCompletion * 100) / 100 };
  }

  async getPipelineOverview(params: {
    fairIds: string[];
    conversionRate?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<PipelineOverviewResponse> {
    const where: Record<string, unknown> = {};
    if (params.fairIds.length) where.fairId = { in: params.fairIds };
    if (params.conversionRate) where.conversionRate = params.conversionRate;
    if (params.startDate || params.endDate) {
      const dateFilter: Record<string, unknown> = {};
      if (params.startDate) dateFilter.gte = new Date(params.startDate);
      if (params.endDate) dateFilter.lte = new Date(params.endDate);
      where.createdAt = dateFilter;
    }

    const opps = await this.prisma.opportunity.findMany({
      where,
      select: {
        id: true, budgetRaw: true, budgetCurrency: true, conversionRate: true,
        currentStage: true, createdAt: true, updatedAt: true,
        customer: { select: { company: true } },
        fair: { select: { name: true } },
      },
    });

    const openOpps = opps.filter((o) => OPEN_STAGES.includes(o.currentStage));
    const pipelineValue = openOpps.reduce((s, o) => s + budgetToNumber(o.budgetRaw), 0);

    const funnel = ALL_STAGES.filter((s) => OPEN_STAGES.includes(s.key)).map((s) => ({
      stage: s.key, label: s.label,
      count: opps.filter((o) => o.currentStage === s.key).length,
    }));

    const stageValues = ALL_STAGES.map((s) => {
      const stageOpps = opps.filter((o) => o.currentStage === s.key);
      const rates = ['very_high', 'high', 'medium', 'low', 'very_low'];
      return {
        stage: s.key, label: s.label,
        totalValue: stageOpps.reduce((sum, o) => sum + budgetToNumber(o.budgetRaw), 0),
        segments: rates.map((r) => ({
          rate: r,
          value: stageOpps.filter((o) => o.conversionRate === r).reduce((sum, o) => sum + budgetToNumber(o.budgetRaw), 0),
        })),
      };
    });

    const stageDistributionPie = ALL_STAGES.filter((s) => OPEN_STAGES.includes(s.key)).map((s) => ({
      stage: s.key, label: s.label,
      count: opps.filter((o) => o.currentStage === s.key).length,
    }));

    const conversionRatePie = Object.entries(CONVERSION_RATE_LABELS).map(([rate, label]) => ({
      rate, label, count: openOpps.filter((o) => o.conversionRate === rate).length,
    }));

    const fairMap = new Map<string, { fairName: string; stages: Map<string, number> }>();
    for (const opp of opps) {
      let entry = fairMap.get(opp.fair.name);
      if (!entry) { entry = { fairName: opp.fair.name, stages: new Map() }; fairMap.set(opp.fair.name, entry); }
      const val = entry.stages.get(opp.currentStage) ?? 0;
      entry.stages.set(opp.currentStage, val + budgetToNumber(opp.budgetRaw));
    }
    const treemapData = [...fairMap.values()].map((f) => ({
      fairName: f.fairName,
      stages: [...f.stages.entries()].map(([stage, value]) => ({ stage, value })),
    }));

    const tableData = opps.map((o) => ({
      id: o.id, customerCompany: o.customer.company, fairName: o.fair.name,
      stage: o.currentStage, budget: budgetToNumber(o.budgetRaw),
      currency: o.budgetCurrency ?? 'TRY', conversionRate: o.conversionRate ?? 'medium',
      createdAt: o.createdAt.toISOString(), updatedAt: o.updatedAt.toISOString(),
    }));

    return {
      kpis: {
        openOpportunities: openOpps.length,
        pipelineValue,
        avgDealValue: openOpps.length > 0 ? pipelineValue / openOpps.length : 0,
        proposalStageCount: opps.filter((o) => o.currentStage === 'teklif').length,
      },
      funnel, stageValues, stageDistributionPie, conversionRatePie, treemapData, tableData,
    };
  }

  async getPipelineVelocity(params: {
    fairIds: string[];
    startDate?: string;
    endDate?: string;
    finalStatus?: string;
  }): Promise<PipelineVelocityResponse> {
    const where: Record<string, unknown> = {};
    if (params.fairIds.length) where.fairId = { in: params.fairIds };
    if (params.finalStatus && params.finalStatus !== 'all') where.currentStage = params.finalStatus === 'won' ? 'satisa_donustu' : params.finalStatus === 'lost' ? 'olumsuz' : undefined;
    if (params.startDate || params.endDate) {
      const df: Record<string, unknown> = {};
      if (params.startDate) df.gte = new Date(params.startDate);
      if (params.endDate) df.lte = new Date(params.endDate);
      where.createdAt = df;
    }

    const opps = await this.prisma.opportunity.findMany({
      where,
      select: {
        id: true, budgetRaw: true, currentStage: true, createdAt: true, updatedAt: true,
        customer: { select: { company: true } },
        fair: { select: { name: true } },
        stageLogs: { select: { stage: true, createdAt: true }, orderBy: { createdAt: 'asc' } },
      },
    });

    const cycleDays: number[] = [];
    const stageTimesMap = new Map<string, number[]>();
    const fairStageTimes = new Map<string, Map<string, number[]>>();

    for (const opp of opps) {
      if (opp.stageLogs.length < 2) continue;
      const logs = opp.stageLogs;
      const totalDays = daysBetween(logs[0]!.createdAt, logs[logs.length - 1]!.createdAt);
      if (TERMINAL_STAGES.includes(opp.currentStage)) cycleDays.push(totalDays);

      for (let i = 0; i < logs.length - 1; i++) {
        const days = daysBetween(logs[i]!.createdAt, logs[i + 1]!.createdAt);
        const stage = logs[i]!.stage;
        if (!stageTimesMap.has(stage)) stageTimesMap.set(stage, []);
        stageTimesMap.get(stage)!.push(days);

        const fairName = opp.fair.name;
        if (!fairStageTimes.has(fairName)) fairStageTimes.set(fairName, new Map());
        const fm = fairStageTimes.get(fairName)!;
        if (!fm.has(stage)) fm.set(stage, []);
        fm.get(stage)!.push(days);
      }
    }

    const stageAvgDays = ALL_STAGES.filter((s) => OPEN_STAGES.includes(s.key)).map((s) => {
      const times = stageTimesMap.get(s.key) ?? [];
      return { stage: s.key, label: s.label, avgDays: times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0 };
    });

    const monthLabels = generateMonthLabels(12);
    const terminalOpps = opps.filter((o) => TERMINAL_STAGES.includes(o.currentStage) && o.stageLogs.length >= 2);
    const monthlyCycleTrend = monthLabels.map((m) => {
      const monthOpps = terminalOpps.filter((o) => o.updatedAt >= m.start && o.updatedAt <= m.end);
      const days = monthOpps.map((o) => daysBetween(o.stageLogs[0]!.createdAt, o.stageLogs[o.stageLogs.length - 1]!.createdAt));
      return { month: m.label, avgDays: days.length > 0 ? Math.round(days.reduce((a, b) => a + b, 0) / days.length) : 0 };
    });

    const scatterData = terminalOpps.map((o) => ({
      id: o.id,
      value: budgetToNumber(o.budgetRaw),
      cycleDays: daysBetween(o.stageLogs[0]!.createdAt, o.stageLogs[o.stageLogs.length - 1]!.createdAt),
      won: o.currentStage === 'satisa_donustu',
    }));

    const fairStageHeatmap = [...fairStageTimes.entries()].map(([fairName, stageMap]) => ({
      fairName,
      stages: Object.fromEntries([...stageMap.entries()].map(([stage, times]) => [stage, Math.round(times.reduce((a, b) => a + b, 0) / times.length)])),
    }));

    const now = new Date();
    const slowOpps = opps
      .filter((o) => OPEN_STAGES.includes(o.currentStage))
      .map((o) => {
        const lastLog = o.stageLogs[o.stageLogs.length - 1];
        const daysSince = lastLog ? daysBetween(lastLog.createdAt, now) : daysBetween(o.createdAt, now);
        return {
          id: o.id, customerCompany: o.customer.company, fairName: o.fair.name,
          stage: o.currentStage, daysSinceLastChange: daysSince, value: budgetToNumber(o.budgetRaw),
        };
      })
      .filter((o) => o.daysSinceLastChange >= 30)
      .sort((a, b) => b.daysSinceLastChange - a.daysSinceLastChange);

    let longestWaiting: PipelineVelocityResponse['kpis']['longestWaiting'] = { opportunityId: '', customerCompany: '', days: 0 };
    if (slowOpps.length > 0) {
      const longest = slowOpps[0]!;
      longestWaiting = { opportunityId: longest.id, customerCompany: longest.customerCompany, days: longest.daysSinceLastChange };
    }

    return {
      kpis: {
        avgCycleDays: cycleDays.length > 0 ? Math.round(cycleDays.reduce((a, b) => a + b, 0) / cycleDays.length) : 0,
        medianCycleDays: median(cycleDays),
        longestWaiting,
      },
      stageAvgDays, monthlyCycleTrend, scatterData, fairStageHeatmap, slowOpportunities: slowOpps,
    };
  }

  async getWinLoss(params: {
    fairIds: string[];
    startDate?: string;
    endDate?: string;
    lossReasons: string[];
    conversionRate?: string;
  }): Promise<WinLossResponse> {
    const where: Record<string, unknown> = { currentStage: { in: ['satisa_donustu', 'olumsuz'] } };
    if (params.fairIds.length) where.fairId = { in: params.fairIds };
    if (params.conversionRate) where.conversionRate = params.conversionRate;
    if (params.lossReasons?.length) where.lossReason = { in: params.lossReasons };
    if (params.startDate || params.endDate) {
      const df: Record<string, unknown> = {};
      if (params.startDate) df.gte = new Date(params.startDate);
      if (params.endDate) df.lte = new Date(params.endDate);
      where.updatedAt = df;
    }

    const opps = await this.prisma.opportunity.findMany({
      where,
      select: {
        id: true, budgetRaw: true, budgetCurrency: true, currentStage: true,
        conversionRate: true, lossReason: true, updatedAt: true, createdAt: true,
        products: true,
        customer: { select: { company: true } },
        fair: { select: { name: true } },
        stageLogs: { select: { stage: true, createdAt: true }, orderBy: { createdAt: 'asc' } },
      },
    });

    const won = opps.filter((o) => o.currentStage === 'satisa_donustu');
    const lost = opps.filter((o) => o.currentStage === 'olumsuz');
    const lostValue = lost.reduce((s, o) => s + budgetToNumber(o.budgetRaw), 0);
    const winRate = safePercent(won.length, won.length + lost.length);

    const reasonMap = new Map<string, number>();
    const reasonValueMap = new Map<string, number>();
    for (const o of lost) {
      const reason = o.lossReason || 'Belirtilmemiş';
      reasonMap.set(reason, (reasonMap.get(reason) ?? 0) + 1);
      reasonValueMap.set(reason, (reasonValueMap.get(reason) ?? 0) + budgetToNumber(o.budgetRaw));
    }
    const lossReasons = [...reasonMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([reason, count]) => ({
        reason, label: reason, count, percent: safePercent(count, lost.length),
      }));
    const lostValueByReason = [...reasonValueMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([reason, value]) => ({ reason, label: reason, value }));

    const monthLabels = generateMonthLabels(12);
    const allTerminal = await this.prisma.opportunity.findMany({
      where: { currentStage: { in: ['satisa_donustu', 'olumsuz'] }, updatedAt: { gte: monthLabels[0]!.start } },
      select: { currentStage: true, updatedAt: true },
    });
    const monthlyWinRateTrend = monthLabels.map((m) => {
      const monthOpps = allTerminal.filter((o) => o.updatedAt >= m.start && o.updatedAt <= m.end);
      const monthWon = monthOpps.filter((o) => o.currentStage === 'satisa_donustu').length;
      return { month: m.label, winRate: safePercent(monthWon, monthOpps.length) };
    });

    const fairWinLossMap = new Map<string, { won: number; lost: number; open: number }>();
    for (const o of opps) {
      const entry = fairWinLossMap.get(o.fair.name) ?? { won: 0, lost: 0, open: 0 };
      if (o.currentStage === 'satisa_donustu') entry.won++;
      else if (o.currentStage === 'olumsuz') entry.lost++;
      else entry.open++;
      fairWinLossMap.set(o.fair.name, entry);
    }
    const fairWinLoss = [...fairWinLossMap.entries()].map(([fairName, v]) => ({ fairName, ...v }));

    const conversionRateSuccess = Object.entries(CONVERSION_RATE_LABELS).map(([rate, label]) => {
      const rateOpps = opps.filter((o) => o.conversionRate === rate);
      const rateWon = rateOpps.filter((o) => o.currentStage === 'satisa_donustu').length;
      return { rate, label, winRate: safePercent(rateWon, rateOpps.length) };
    });

    const lostOpportunities = lost.slice(0, 20).map((o) => ({
      id: o.id, customerCompany: o.customer.company, fairName: o.fair.name,
      value: budgetToNumber(o.budgetRaw), lossReason: o.lossReason ?? 'Belirtilmemiş',
      lastStage: o.stageLogs.length > 1 ? o.stageLogs[o.stageLogs.length - 2]?.stage ?? 'tanisma' : 'tanisma',
      date: o.updatedAt.toISOString(),
    }));

    const wonOpportunities = won.slice(0, 20).map((o) => {
      const cycleDays = o.stageLogs.length >= 2
        ? daysBetween(o.stageLogs[0]!.createdAt, o.stageLogs[o.stageLogs.length - 1]!.createdAt)
        : daysBetween(o.createdAt, o.updatedAt);
      return {
        id: o.id, customerCompany: o.customer.company, fairName: o.fair.name,
        value: budgetToNumber(o.budgetRaw), products: o.products, cycleDays,
      };
    });

    return {
      kpis: { winRate, wonCount: won.length, lostCount: lost.length, lostValue },
      winLossDonut: { won: won.length, lost: lost.length },
      lossReasons, monthlyWinRateTrend, fairWinLoss, conversionRateSuccess,
      lostValueByReason, lostOpportunities, wonOpportunities,
    };
  }

  async getRevenue(params: {
    startDate?: string; endDate?: string; fairIds: string[]; currency?: string; products: string[];
  }): Promise<RevenueResponse> {
    const where: Record<string, unknown> = { currentStage: 'satisa_donustu' };
    if (params.fairIds.length) where.fairId = { in: params.fairIds };
    if (params.currency) where.budgetCurrency = params.currency;
    if (params.startDate || params.endDate) {
      const df: Record<string, unknown> = {};
      if (params.startDate) df.gte = new Date(params.startDate);
      if (params.endDate) df.lte = new Date(params.endDate);
      where.updatedAt = df;
    }
    const opps = await this.prisma.opportunity.findMany({
      where,
      select: {
        id: true, budgetRaw: true, budgetCurrency: true, updatedAt: true, products: true,
        customer: { select: { company: true } },
        fair: { select: { name: true } },
        opportunityProducts: { select: { quantity: true, product: { select: { name: true } } } },
      },
    });
    const totalRevenue = opps.reduce((s, o) => s + budgetToNumber(o.budgetRaw), 0);
    const avgDealValue = opps.length > 0 ? totalRevenue / opps.length : 0;
    let largestDeal = { customerCompany: '', value: 0 };
    for (const o of opps) { const v = budgetToNumber(o.budgetRaw); if (v > largestDeal.value) largestDeal = { customerCompany: o.customer.company, value: v }; }

    const ml = generateMonthLabels(12);
    const monthlyRevenueTrend = ml.map((m) => {
      const mo = opps.filter((o) => o.updatedAt >= m.start && o.updatedAt <= m.end);
      return { month: m.label, value: mo.reduce((s, o) => s + budgetToNumber(o.budgetRaw), 0) };
    });
    const monthlyAvgRevenue = monthlyRevenueTrend.reduce((s, m) => s + m.value, 0) / Math.max(ml.length, 1);

    const fairRevMap = new Map<string, number>();
    const prodRevMap = new Map<string, number>();
    const currMap = new Map<string, number>();
    const custMap = new Map<string, number>();
    for (const o of opps) {
      const v = budgetToNumber(o.budgetRaw);
      fairRevMap.set(o.fair.name, (fairRevMap.get(o.fair.name) ?? 0) + v);
      custMap.set(o.customer.company, (custMap.get(o.customer.company) ?? 0) + v);
      currMap.set(o.budgetCurrency ?? 'TRY', (currMap.get(o.budgetCurrency ?? 'TRY') ?? 0) + v);
      for (const op of o.opportunityProducts) prodRevMap.set(op.product.name, (prodRevMap.get(op.product.name) ?? 0) + v);
    }

    const avgDealValueTrend = ml.map((m) => {
      const mo = opps.filter((o) => o.updatedAt >= m.start && o.updatedAt <= m.end);
      return { month: m.label, avgValue: mo.length > 0 ? mo.reduce((s, o) => s + budgetToNumber(o.budgetRaw), 0) / mo.length : 0 };
    });

    const tableData = opps.map((o) => ({
      customerCompany: o.customer.company, fairName: o.fair.name,
      budget: budgetToNumber(o.budgetRaw), currency: o.budgetCurrency ?? 'TRY',
      products: o.products, tonnage: o.opportunityProducts.reduce((s, p) => s + (p.quantity ?? 0), 0),
      closedAt: o.updatedAt.toISOString(),
    }));

    return {
      kpis: { totalRevenue, avgDealValue, largestDeal, monthlyAvgRevenue },
      monthlyRevenueTrend,
      revenueByFair: [...fairRevMap.entries()].sort((a, b) => b[1] - a[1]).map(([fairName, revenue]) => ({ fairName, revenue })),
      revenueByProduct: [...prodRevMap.entries()].sort((a, b) => b[1] - a[1]).map(([productName, revenue]) => ({ productName, revenue })),
      currencyDistribution: [...currMap.entries()].map(([currency, value]) => ({ currency, value })),
      revenueByCustomerTreemap: [...custMap.entries()].sort((a, b) => b[1] - a[1]).map(([customerCompany, revenue]) => ({ customerCompany, revenue })),
      avgDealValueTrend, tableData,
    };
  }

  async getForecast(params: {
    fairIds: string[]; startDate?: string; endDate?: string;
  }): Promise<ForecastResponse> {
    const where: Record<string, unknown> = { currentStage: { in: OPEN_STAGES } };
    if (params.fairIds.length) where.fairId = { in: params.fairIds };
    const opps = await this.prisma.opportunity.findMany({
      where,
      select: { budgetRaw: true, currentStage: true, conversionRate: true, customer: { select: { company: true } }, fair: { select: { name: true } } },
    });
    let rawPipelineValue = 0; let weightedPipelineValue = 0;
    const stageMap = new Map<string, { raw: number; weighted: number }>();
    const convMap = new Map<string, { raw: number; weighted: number }>();
    const tbl: ForecastResponse['tableData'] = [];

    for (const o of opps) {
      const budget = budgetToNumber(o.budgetRaw);
      const wv = calculateWeightedValue(o.budgetRaw, o.currentStage, o.conversionRate);
      rawPipelineValue += budget;
      weightedPipelineValue += wv;
      const se = stageMap.get(o.currentStage) ?? { raw: 0, weighted: 0 };
      se.raw += budget; se.weighted += wv; stageMap.set(o.currentStage, se);
      const cr = o.conversionRate ?? 'medium';
      const ce = convMap.get(cr) ?? { raw: 0, weighted: 0 };
      ce.raw += budget; ce.weighted += wv; convMap.set(cr, ce);
      tbl.push({
        customerCompany: o.customer.company, fairName: o.fair.name,
        stage: o.currentStage, budget, conversionRate: cr,
        stageWeight: (await import('@crm/shared')).STAGE_WEIGHTS[o.currentStage] ?? 0,
        weightedValue: wv,
      });
    }
    const estimatedWinCount = opps.length > 0 ? Math.round(weightedPipelineValue / (rawPipelineValue / opps.length || 1)) : 0;

    return {
      kpis: { rawPipelineValue, weightedPipelineValue, estimatedWinCount },
      stageBreakdown: ALL_STAGES.filter((s) => OPEN_STAGES.includes(s.key)).map((s) => {
        const e = stageMap.get(s.key) ?? { raw: 0, weighted: 0 };
        return { stage: s.key, label: s.label, rawValue: e.raw, weightedValue: e.weighted };
      }),
      conversionBreakdown: Object.entries(CONVERSION_RATE_LABELS).map(([rate, label]) => {
        const e = convMap.get(rate) ?? { raw: 0, weighted: 0 };
        return { rate, label, rawValue: e.raw, weightedValue: e.weighted };
      }),
      tableData: tbl,
    };
  }

  async getCustomerOverview(params: {
    fairIds: string[]; startDate?: string; endDate?: string; conversionRate?: string;
  }): Promise<CustomerOverviewResponse> {
    const oppWhere: Record<string, unknown> = {};
    if (params.fairIds.length) oppWhere.fairId = { in: params.fairIds };
    if (params.conversionRate) oppWhere.conversionRate = params.conversionRate;
    if (params.startDate || params.endDate) { const df: Record<string, unknown> = {}; if (params.startDate) df.gte = new Date(params.startDate); if (params.endDate) df.lte = new Date(params.endDate); oppWhere.createdAt = df; }

    const customers = await this.prisma.customer.findMany({
      include: { opportunities: { where: oppWhere, select: { id: true, budgetRaw: true, currentStage: true, conversionRate: true, createdAt: true, updatedAt: true } } },
    });
    const active = customers.filter((c) => c.opportunities.length > 0);
    const totalOpps = active.reduce((s, c) => s + c.opportunities.length, 0);
    const totalWon = active.reduce((s, c) => s + c.opportunities.filter((o) => o.currentStage === 'satisa_donustu').length, 0);
    const totalClosed = active.reduce((s, c) => s + c.opportunities.filter((o) => TERMINAL_STAGES.includes(o.currentStage)).length, 0);

    const ml = generateMonthLabels(12);
    const monthlyNewCustomerTrend = ml.map((m) => ({
      month: m.label, count: customers.filter((c) => c.createdAt >= m.start && c.createdAt <= m.end).length,
    }));

    const topByOpps = active.sort((a, b) => b.opportunities.length - a.opportunities.length).slice(0, 10).map((c) => ({ company: c.company, count: c.opportunities.length }));
    const statusDist = [
      { status: 'Aktif (Açık Fırsatı Var)', count: active.filter((c) => c.opportunities.some((o) => OPEN_STAGES.includes(o.currentStage))).length },
      { status: 'Kazanılan', count: active.filter((c) => c.opportunities.some((o) => o.currentStage === 'satisa_donustu')).length },
      { status: 'Pasif', count: customers.filter((c) => c.opportunities.length === 0).length },
    ];
    const portfolioTreemap = active.slice(0, 30).map((c) => ({
      company: c.company, totalValue: c.opportunities.reduce((s, o) => s + budgetToNumber(o.budgetRaw), 0),
      avgConversionRate: c.opportunities[0]?.conversionRate ?? 'medium',
    }));
    const tableData = active.map((c) => {
      const won = c.opportunities.filter((o) => o.currentStage === 'satisa_donustu');
      const lost = c.opportunities.filter((o) => o.currentStage === 'olumsuz');
      const open = c.opportunities.filter((o) => OPEN_STAGES.includes(o.currentStage));
      const closed = c.opportunities.filter((o) => TERMINAL_STAGES.includes(o.currentStage));
      return {
        company: c.company, name: c.name, opportunityCount: c.opportunities.length,
        won: won.length, lost: lost.length, open: open.length,
        totalBudget: c.opportunities.reduce((s, o) => s + budgetToNumber(o.budgetRaw), 0),
        firstContact: c.createdAt.toISOString(), lastContact: c.updatedAt.toISOString(),
        conversionRate: safePercent(won.length, closed.length),
      };
    });
    return {
      kpis: {
        totalCustomers: customers.length, activeCustomers: active.length,
        avgOpportunitiesPerCustomer: active.length > 0 ? Math.round((totalOpps / active.length) * 10) / 10 : 0,
        customerConversionRate: safePercent(totalWon, totalClosed),
      },
      monthlyNewCustomerTrend, topCustomersByOpportunities: topByOpps,
      customerStatusDistribution: statusDist, portfolioTreemap, tableData,
    };
  }

  async getCustomerSegmentation(params: {
    fairIds: string[]; criterion?: string;
  }): Promise<CustomerSegmentationResponse> {
    const oppWhere: Record<string, unknown> = {};
    if (params.fairIds.length) oppWhere.fairId = { in: params.fairIds };
    const customers = await this.prisma.customer.findMany({
      include: { opportunities: { where: oppWhere, select: { id: true, budgetRaw: true, currentStage: true, conversionRate: true, fairId: true, fair: { select: { name: true } } } } },
    });
    const active = customers.filter((c) => c.opportunities.length > 0);
    const scatterData = active.map((c) => ({
      company: c.company, opportunityCount: c.opportunities.length,
      totalValue: c.opportunities.reduce((s, o) => s + budgetToNumber(o.budgetRaw), 0),
      avgConversionRate: c.opportunities[0]?.conversionRate ?? 'medium',
    }));
    const topByValue = active.map((c) => ({
      company: c.company,
      wonValue: c.opportunities.filter((o) => o.currentStage === 'satisa_donustu').reduce((s, o) => s + budgetToNumber(o.budgetRaw), 0),
      openValue: c.opportunities.filter((o) => OPEN_STAGES.includes(o.currentStage)).reduce((s, o) => s + budgetToNumber(o.budgetRaw), 0),
      lostValue: c.opportunities.filter((o) => o.currentStage === 'olumsuz').reduce((s, o) => s + budgetToNumber(o.budgetRaw), 0),
    })).sort((a, b) => (b.wonValue + b.openValue) - (a.wonValue + a.openValue)).slice(0, 10);

    const convSegments = Object.entries(CONVERSION_RATE_LABELS).map(([, label]) => ({
      segment: label, count: active.filter((c) => c.opportunities.some((o) => (CONVERSION_RATE_LABELS[o.conversionRate ?? 'medium'] ?? 'Orta') === label)).length,
    }));
    const fairCustMap = new Map<string, Set<string>>();
    for (const c of active) for (const o of c.opportunities) {
      if (!fairCustMap.has(o.fair.name)) fairCustMap.set(o.fair.name, new Set());
      fairCustMap.get(o.fair.name)!.add(c.id);
    }
    const customersByFair = [...fairCustMap.entries()].map(([fairName, set]) => ({ fairName, customerCount: set.size }));
    const customerFairMatrix = active.slice(0, 20).map((c) => {
      const fairs: Record<string, number> = {};
      for (const o of c.opportunities) fairs[o.fair.name] = (fairs[o.fair.name] ?? 0) + 1;
      return { company: c.company, fairs };
    });
    const tableData = active.map((c) => {
      const won = c.opportunities.filter((o) => o.currentStage === 'satisa_donustu').length;
      const closed = c.opportunities.filter((o) => TERMINAL_STAGES.includes(o.currentStage)).length;
      return {
        company: c.company, segment: CONVERSION_RATE_LABELS[c.opportunities[0]?.conversionRate ?? 'medium'] ?? 'Orta',
        totalValue: c.opportunities.reduce((s, o) => s + budgetToNumber(o.budgetRaw), 0),
        opportunityCount: c.opportunities.length, winRate: safePercent(won, closed), avgCycleDays: 0,
      };
    });
    return { scatterData, topCustomersByValue: topByValue, conversionSegments: convSegments, customersByFair, customerFairMatrix, tableData };
  }

  async getCustomerLifecycle(params: {
    startDate?: string; endDate?: string; status?: string; fairIds: string[];
  }): Promise<CustomerLifecycleResponse> {
    const oppWhere: Record<string, unknown> = {};
    if (params.fairIds.length) oppWhere.fairId = { in: params.fairIds };
    const customers = await this.prisma.customer.findMany({
      include: { opportunities: { where: oppWhere, select: { id: true, budgetRaw: true, currentStage: true, createdAt: true, updatedAt: true, fairId: true }, orderBy: { createdAt: 'desc' } } },
    });
    const now = new Date();
    const active = customers.filter((c) => c.opportunities.length > 0);
    const fairSets = active.map((c) => new Set(c.opportunities.map((o) => o.fairId)));
    const repeatCustomers = fairSets.filter((s) => s.size > 1).length;
    const inactiveDays = 90;
    const inactiveCustomers = active.filter((c) => {
      const last = c.opportunities[0];
      return last && daysBetween(last.updatedAt, now) > inactiveDays;
    });
    const avgLifetime = active.length > 0
      ? Math.round(active.reduce((s, c) => s + daysBetween(c.createdAt, c.opportunities[0]?.updatedAt ?? now), 0) / active.length)
      : 0;

    const freqMap = new Map<number, number>();
    for (const s of fairSets) { freqMap.set(s.size, (freqMap.get(s.size) ?? 0) + 1); }
    const fairParticipationFrequency = [...freqMap.entries()].sort((a, b) => a[0] - b[0]).map(([fairCount, customerCount]) => ({ fairCount, customerCount }));

    const loyalCustomers = active
      .map((c) => ({
        company: c.company, fairCount: new Set(c.opportunities.map((o) => o.fairId)).size,
        opportunityCount: c.opportunities.length, totalValue: c.opportunities.reduce((s, o) => s + budgetToNumber(o.budgetRaw), 0),
      }))
      .sort((a, b) => b.fairCount - a.fairCount).slice(0, 10);

    const inactiveCustomerTable = inactiveCustomers.slice(0, 20).map((c) => ({
      company: c.company, name: c.name,
      daysSinceLastActivity: daysBetween(c.opportunities[0]?.updatedAt ?? c.updatedAt, now),
      openOpportunities: c.opportunities.filter((o) => OPEN_STAGES.includes(o.currentStage)).length,
      value: c.opportunities.reduce((s, o) => s + budgetToNumber(o.budgetRaw), 0),
    }));

    return {
      kpis: { repeatCustomers, repeatCustomerRate: safePercent(repeatCustomers, active.length), inactiveCustomers: inactiveCustomers.length, avgCustomerLifetimeDays: avgLifetime },
      fairParticipationFrequency, lifetimeValueTrend: [], loyalCustomers, inactiveCustomerTable, recentActivities: [],
    };
  }

  async getProductAnalysis(params: {
    fairIds: string[]; startDate?: string; endDate?: string; stageFilter?: string;
  }): Promise<ProductAnalysisResponse> {
    const oppWhere: Record<string, unknown> = {};
    if (params.fairIds.length) oppWhere.fairId = { in: params.fairIds };
    if (params.stageFilter) oppWhere.currentStage = params.stageFilter;
    if (params.startDate || params.endDate) { const df: Record<string, unknown> = {}; if (params.startDate) df.gte = new Date(params.startDate); if (params.endDate) df.lte = new Date(params.endDate); oppWhere.createdAt = df; }

    const oppProducts = await this.prisma.opportunityProduct.findMany({
      where: { opportunity: oppWhere },
      select: { quantity: true, product: { select: { name: true } }, opportunity: { select: { id: true, currentStage: true, fairId: true } } },
    });
    const products = await this.prisma.product.findMany({ select: { name: true } });
    const prodMap = new Map<string, { count: number; tonnage: number; wonTonnage: number; oppIds: Set<string>; fairIds: Set<string>; wonCount: number }>();
    for (const op of oppProducts) {
      const e = prodMap.get(op.product.name) ?? { count: 0, tonnage: 0, wonTonnage: 0, oppIds: new Set(), fairIds: new Set(), wonCount: 0 };
      if (!e.oppIds.has(op.opportunity.id)) { e.count++; e.oppIds.add(op.opportunity.id); }
      e.tonnage += op.quantity ?? 0;
      e.fairIds.add(op.opportunity.fairId);
      if (op.opportunity.currentStage === 'satisa_donustu') { e.wonTonnage += op.quantity ?? 0; e.wonCount++; }
      prodMap.set(op.product.name, e);
    }
    const totalTonnage = [...prodMap.values()].reduce((s, p) => s + p.tonnage, 0);
    const wonTonnage = [...prodMap.values()].reduce((s, p) => s + p.wonTonnage, 0);
    let most = { name: '', count: 0 };
    for (const [name, v] of prodMap) if (v.count > most.count) most = { name, count: v.count };

    return {
      kpis: { totalProducts: products.length, mostPopularProduct: most, totalTonnage, wonTonnage },
      productPopularity: [...prodMap.entries()].sort((a, b) => b[1].count - a[1].count).map(([productName, v]) => ({ productName, opportunityCount: v.count })),
      productTonnage: [...prodMap.entries()].sort((a, b) => b[1].tonnage - a[1].tonnage).map(([productName, v]) => ({ productName, tonnage: v.tonnage })),
      tonnageDistribution: [...prodMap.entries()].map(([productName, v]) => ({ productName, percent: safePercent(v.tonnage, totalTonnage), tonnage: v.tonnage })),
      productTreemap: [...prodMap.entries()].map(([productName, v]) => ({ productName, opportunityCount: v.count, winRate: safePercent(v.wonCount, v.count) })),
      productTrend: [],
      tableData: [...prodMap.entries()].map(([productName, v]) => ({
        productName, opportunityCount: v.count, totalTonnage: v.tonnage, wonTonnage: v.wonTonnage,
        winRate: safePercent(v.wonCount, v.count), fairCount: v.fairIds.size,
      })),
    };
  }

  async getProductFairMatrix(params: {
    fairIds: string[]; products: string[]; metric?: string;
  }): Promise<ProductFairMatrixResponse> {
    const oppWhere: Record<string, unknown> = {};
    if (params.fairIds.length) oppWhere.fairId = { in: params.fairIds };
    const ops = await this.prisma.opportunityProduct.findMany({
      where: { opportunity: oppWhere, ...(params.products.length ? { product: { name: { in: params.products } } } : {}) },
      select: { quantity: true, product: { select: { name: true } }, opportunity: { select: { id: true, currentStage: true, fair: { select: { name: true } } } } },
    });

    const oppMatrix = new Map<string, Map<string, number>>();
    const tonMatrix = new Map<string, Map<string, number>>();
    const fairProdMap = new Map<string, Map<string, number>>();
    const prodFairMap = new Map<string, Map<string, number>>();
    const tdMap = new Map<string, { opp: number; ton: number; wonTon: number; won: number; total: number }>();

    for (const op of ops) {
      const prod = op.product.name; const fair = op.opportunity.fair.name;
      if (!oppMatrix.has(prod)) oppMatrix.set(prod, new Map());
      oppMatrix.get(prod)!.set(fair, (oppMatrix.get(prod)!.get(fair) ?? 0) + 1);
      if (!tonMatrix.has(prod)) tonMatrix.set(prod, new Map());
      tonMatrix.get(prod)!.set(fair, (tonMatrix.get(prod)!.get(fair) ?? 0) + (op.quantity ?? 0));
      if (!fairProdMap.has(fair)) fairProdMap.set(fair, new Map());
      fairProdMap.get(fair)!.set(prod, (fairProdMap.get(fair)!.get(prod) ?? 0) + 1);
      if (!prodFairMap.has(prod)) prodFairMap.set(prod, new Map());
      prodFairMap.get(prod)!.set(fair, (prodFairMap.get(prod)!.get(fair) ?? 0) + 1);
      const key = `${prod}|${fair}`;
      const e = tdMap.get(key) ?? { opp: 0, ton: 0, wonTon: 0, won: 0, total: 0 };
      e.opp++; e.ton += op.quantity ?? 0; e.total++;
      if (op.opportunity.currentStage === 'satisa_donustu') { e.wonTon += op.quantity ?? 0; e.won++; }
      tdMap.set(key, e);
    }

    return {
      opportunityMatrix: [...oppMatrix.entries()].map(([productName, fairs]) => ({ productName, fairs: Object.fromEntries(fairs) })),
      tonnageMatrix: [...tonMatrix.entries()].map(([productName, fairs]) => ({ productName, fairs: Object.fromEntries(fairs) })),
      topProductsByFair: [...fairProdMap.entries()].map(([fairName, prods]) => ({
        fairName, products: [...prods.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([productName, count]) => ({ productName, count })),
      })),
      productFairDistribution: [...prodFairMap.entries()].map(([productName, fairs]) => ({
        productName, fairs: [...fairs.entries()].map(([fairName, count]) => ({ fairName, count })),
      })),
      tableData: [...tdMap.entries()].map(([key, v]) => {
        const [productName, fairName] = key.split('|');
        return { productName: productName!, fairName: fairName!, opportunityCount: v.opp, tonnage: v.ton, wonTonnage: v.wonTon, winRate: safePercent(v.won, v.total) };
      }),
    };
  }

  async getTeamPerformance(params: {
    startDate?: string; endDate?: string; teamIds: string[]; fairIds: string[];
  }): Promise<TeamPerformanceResponse> {
    const teamWhere: Record<string, unknown> = { active: true };
    if (params.teamIds.length) teamWhere.id = { in: params.teamIds };
    const teams = await this.prisma.team.findMany({
      where: teamWhere,
      include: {
        users: {
          select: {
            id: true, name: true,
            fairs: { select: { opportunities: { select: { budgetRaw: true, currentStage: true } } } },
          },
        },
      },
    });

    const data: TeamPerformanceResponse['tableData'] = [];
    let bestTeam = { name: '', winRate: 0 };
    let mostActiveTeam = { name: '', opportunityCount: 0 };

    for (const team of teams) {
      const allOpps = team.users.flatMap((u) => u.fairs.flatMap((f) => f.opportunities));
      const won = allOpps.filter((o) => o.currentStage === 'satisa_donustu');
      const lost = allOpps.filter((o) => o.currentStage === 'olumsuz');
      const open = allOpps.filter((o) => OPEN_STAGES.includes(o.currentStage));
      const closed = allOpps.filter((o) => TERMINAL_STAGES.includes(o.currentStage));
      const winRate = safePercent(won.length, closed.length);
      if (winRate > bestTeam.winRate) bestTeam = { name: team.name, winRate };
      if (allOpps.length > mostActiveTeam.opportunityCount) mostActiveTeam = { name: team.name, opportunityCount: allOpps.length };
      data.push({
        teamName: team.name, memberCount: team.users.length,
        totalOpportunities: allOpps.length, won: won.length, lost: lost.length, open: open.length,
        winRate, pipelineValue: open.reduce((s, o) => s + budgetToNumber(o.budgetRaw), 0),
        wonRevenue: won.reduce((s, o) => s + budgetToNumber(o.budgetRaw), 0), avgCycleDays: 0,
      });
    }

    return {
      kpis: { totalTeams: teams.length, bestTeam, mostActiveTeam },
      teamOpportunityCounts: data.map((d) => ({ teamName: d.teamName, total: d.totalOpportunities, won: d.won, lost: d.lost, open: d.open })),
      teamRevenue: data.map((d) => ({ teamName: d.teamName, pipelineValue: d.pipelineValue, wonRevenue: d.wonRevenue })),
      teamWinRates: data.map((d) => ({ teamName: d.teamName, winRate: d.winRate })),
      leaderboard: data.sort((a, b) => b.wonRevenue - a.wonRevenue).map((d) => ({
        teamName: d.teamName, opportunityCount: d.totalOpportunities, won: d.won, winRate: d.winRate, totalRevenue: d.wonRevenue,
      })),
      tableData: data,
    };
  }

  async getIndividualPerformance(params: {
    startDate?: string; endDate?: string; teamIds: string[]; fairIds: string[]; sortBy?: string;
  }): Promise<IndividualPerformanceResponse> {
    const userWhere: Record<string, unknown> = {};
    if (params.teamIds.length) userWhere.teamId = { in: params.teamIds };
    const users = await this.prisma.user.findMany({
      where: userWhere,
      select: {
        id: true, name: true,
        team: { select: { name: true } },
        fairs: { select: { opportunities: { select: { budgetRaw: true, currentStage: true, updatedAt: true } } } },
      },
    });

    const leaderboard: IndividualPerformanceResponse['leaderboard'] = [];
    for (const user of users) {
      const opps = user.fairs.flatMap((f) => f.opportunities);
      if (opps.length === 0) continue;
      const won = opps.filter((o) => o.currentStage === 'satisa_donustu');
      const closed = opps.filter((o) => TERMINAL_STAGES.includes(o.currentStage));
      leaderboard.push({
        userId: user.id, name: user.name, teamName: user.team?.name ?? '',
        opportunityCount: opps.length, won: won.length,
        winRate: safePercent(won.length, closed.length),
        revenue: won.reduce((s, o) => s + budgetToNumber(o.budgetRaw), 0),
      });
    }
    leaderboard.sort((a, b) => b.revenue - a.revenue);

    return {
      leaderboard,
      revenueByUser: leaderboard.map((u) => ({ name: u.name, revenue: u.revenue })),
      pipelineByUser: users.filter((u) => u.fairs.some((f) => f.opportunities.length > 0)).map((u) => {
        const opps = u.fairs.flatMap((f) => f.opportunities);
        return { name: u.name, open: opps.filter((o) => OPEN_STAGES.includes(o.currentStage)).length, won: opps.filter((o) => o.currentStage === 'satisa_donustu').length, lost: opps.filter((o) => o.currentStage === 'olumsuz').length };
      }),
      personalTrends: [], scatterData: leaderboard.map((u) => ({ name: u.name, opportunityCount: u.opportunityCount, winRate: u.winRate, revenue: u.revenue })),
      tableData: leaderboard.map((u) => ({ name: u.name, teamName: u.teamName, opportunityCount: u.opportunityCount, won: u.won, lost: 0, open: 0, winRate: u.winRate, pipelineValue: 0, wonRevenue: u.revenue, avgCycleDays: 0, lastActivity: '' })),
    };
  }

  async getActivityAnalysis(params: {
    startDate?: string; endDate?: string; userIds: string[]; teamIds: string[]; activityType?: string;
  }): Promise<ActivityAnalysisResponse> {
    const dateFilter: Record<string, unknown> = {};
    if (params.startDate) dateFilter.gte = new Date(params.startDate);
    if (params.endDate) dateFilter.lte = new Date(params.endDate);
    const where: Record<string, unknown> = {};
    if (Object.keys(dateFilter).length > 0) where.createdAt = dateFilter;
    if (params.userIds.length) where.changedById = { in: params.userIds };

    const stageLogs = await this.prisma.opportunityStageLog.findMany({
      where, orderBy: { createdAt: 'desc' }, take: 500,
      select: { id: true, stage: true, createdAt: true, changedBy: { select: { name: true } }, opportunity: { select: { id: true, customer: { select: { company: true } }, fair: { select: { name: true } } } } },
    });

    const userCounts = new Map<string, number>();
    for (const log of stageLogs) userCounts.set(log.changedBy.name, (userCounts.get(log.changedBy.name) ?? 0) + 1);
    let mostActive = { name: '', count: 0 };
    for (const [name, count] of userCounts) if (count > mostActive.count) mostActive = { name, count };

    const days = new Set(stageLogs.map((l) => l.createdAt.toISOString().split('T')[0]));
    const dailyAvg = days.size > 0 ? Math.round(stageLogs.length / days.size) : 0;

    const dailyActivityTrend = [...days].sort().map((date) => ({
      date: date!, count: stageLogs.filter((l) => l.createdAt.toISOString().startsWith(date!)).length,
    }));

    return {
      kpis: { totalActivities: stageLogs.length, dailyAvg, mostActiveUser: mostActive },
      dailyActivityTrend, dayHourHeatmap: [], activityTypeDistribution: [],
      userActivityCounts: [...userCounts.entries()].sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count })),
      recentActivities: stageLogs.slice(0, 20).map((l) => ({
        id: l.id, text: `${l.changedBy.name} → ${l.stage}`, timestamp: l.createdAt.toISOString(),
        context: `${l.opportunity.customer.company} | ${l.opportunity.fair.name}`,
      })),
      tableData: stageLogs.slice(0, 100).map((l) => ({
        date: l.createdAt.toISOString(), userName: l.changedBy.name, activityType: 'Aşama Değişikliği',
        opportunityId: l.opportunity.id, customerCompany: l.opportunity.customer.company,
        fairName: l.opportunity.fair.name, detail: `→ ${l.stage}`,
      })),
    };
  }
}
