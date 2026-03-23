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

  async getRevenue(_params: {
    startDate?: string;
    endDate?: string;
    fairIds: string[];
    currency?: string;
    products: string[];
  }): Promise<RevenueResponse> {
    return {
      kpis: {
        totalRevenue: 0,
        avgDealValue: 0,
        largestDeal: { customerCompany: '', value: 0 },
        monthlyAvgRevenue: 0,
      },
      monthlyRevenueTrend: [],
      revenueByFair: [],
      revenueByProduct: [],
      currencyDistribution: [],
      revenueByCustomerTreemap: [],
      avgDealValueTrend: [],
      tableData: [],
    };
  }

  async getForecast(_params: {
    fairIds: string[];
    startDate?: string;
    endDate?: string;
  }): Promise<ForecastResponse> {
    return {
      kpis: { rawPipelineValue: 0, weightedPipelineValue: 0, estimatedWinCount: 0 },
      stageBreakdown: [],
      conversionBreakdown: [],
      tableData: [],
    };
  }

  async getCustomerOverview(_params: {
    fairIds: string[];
    startDate?: string;
    endDate?: string;
    conversionRate?: string;
  }): Promise<CustomerOverviewResponse> {
    return {
      kpis: { totalCustomers: 0, activeCustomers: 0, avgOpportunitiesPerCustomer: 0, customerConversionRate: 0 },
      monthlyNewCustomerTrend: [],
      topCustomersByOpportunities: [],
      customerStatusDistribution: [],
      portfolioTreemap: [],
      tableData: [],
    };
  }

  async getCustomerSegmentation(_params: {
    fairIds: string[];
    criterion?: string;
  }): Promise<CustomerSegmentationResponse> {
    return {
      scatterData: [],
      topCustomersByValue: [],
      conversionSegments: [],
      customersByFair: [],
      customerFairMatrix: [],
      tableData: [],
    };
  }

  async getCustomerLifecycle(_params: {
    startDate?: string;
    endDate?: string;
    status?: string;
    fairIds: string[];
  }): Promise<CustomerLifecycleResponse> {
    return {
      kpis: { repeatCustomers: 0, repeatCustomerRate: 0, inactiveCustomers: 0, avgCustomerLifetimeDays: 0 },
      fairParticipationFrequency: [],
      lifetimeValueTrend: [],
      loyalCustomers: [],
      inactiveCustomerTable: [],
      recentActivities: [],
    };
  }

  async getProductAnalysis(_params: {
    fairIds: string[];
    startDate?: string;
    endDate?: string;
    stageFilter?: string;
  }): Promise<ProductAnalysisResponse> {
    return {
      kpis: { totalProducts: 0, mostPopularProduct: { name: '', count: 0 }, totalTonnage: 0, wonTonnage: 0 },
      productPopularity: [],
      productTonnage: [],
      tonnageDistribution: [],
      productTreemap: [],
      productTrend: [],
      tableData: [],
    };
  }

  async getProductFairMatrix(_params: {
    fairIds: string[];
    products: string[];
    metric?: string;
  }): Promise<ProductFairMatrixResponse> {
    return {
      opportunityMatrix: [],
      tonnageMatrix: [],
      topProductsByFair: [],
      productFairDistribution: [],
      tableData: [],
    };
  }

  async getTeamPerformance(_params: {
    startDate?: string;
    endDate?: string;
    teamIds: string[];
    fairIds: string[];
  }): Promise<TeamPerformanceResponse> {
    return {
      kpis: {
        totalTeams: 0,
        bestTeam: { name: '', winRate: 0 },
        mostActiveTeam: { name: '', opportunityCount: 0 },
      },
      teamOpportunityCounts: [],
      teamRevenue: [],
      teamWinRates: [],
      leaderboard: [],
      tableData: [],
    };
  }

  async getIndividualPerformance(_params: {
    startDate?: string;
    endDate?: string;
    teamIds: string[];
    fairIds: string[];
    sortBy?: string;
  }): Promise<IndividualPerformanceResponse> {
    return {
      leaderboard: [],
      revenueByUser: [],
      pipelineByUser: [],
      personalTrends: [],
      scatterData: [],
      tableData: [],
    };
  }

  async getActivityAnalysis(_params: {
    startDate?: string;
    endDate?: string;
    userIds: string[];
    teamIds: string[];
    activityType?: string;
  }): Promise<ActivityAnalysisResponse> {
    return {
      kpis: { totalActivities: 0, dailyAvg: 0, mostActiveUser: { name: '', count: 0 } },
      dailyActivityTrend: [],
      dayHourHeatmap: [],
      activityTypeDistribution: [],
      userActivityCounts: [],
      recentActivities: [],
      tableData: [],
    };
  }
}
