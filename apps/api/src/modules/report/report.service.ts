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

  async getFairPerformance(_params: {
    startDate?: string;
    endDate?: string;
    status?: string;
    createdById?: string;
  }): Promise<FairPerformanceResponse> {
    return {
      kpis: { totalFairs: 0, totalOpportunities: 0, totalWonRevenue: 0, avgConversionRate: 0 },
      fairOpportunityCounts: [],
      fairPipelineValues: [],
      fairConversionRates: [],
      scatterData: [],
      tableData: [],
    };
  }

  async getFairComparison(_fairIds: string[]): Promise<FairComparisonResponse> {
    return { fairs: [], stageMatrix: [], productMatrix: [] };
  }

  async getFairTargets(_fairIds: string[], _status?: string): Promise<FairTargetsResponse> {
    return { allFairTargets: [], avgTargetCompletion: 0 };
  }

  async getPipelineOverview(_params: {
    fairIds: string[];
    conversionRate?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<PipelineOverviewResponse> {
    return {
      kpis: { openOpportunities: 0, pipelineValue: 0, avgDealValue: 0, proposalStageCount: 0 },
      funnel: [],
      stageValues: [],
      stageDistributionPie: [],
      conversionRatePie: [],
      treemapData: [],
      tableData: [],
    };
  }

  async getPipelineVelocity(_params: {
    fairIds: string[];
    startDate?: string;
    endDate?: string;
    finalStatus?: string;
  }): Promise<PipelineVelocityResponse> {
    return {
      kpis: {
        avgCycleDays: 0,
        medianCycleDays: 0,
        longestWaiting: { opportunityId: '', customerCompany: '', days: 0 },
      },
      stageAvgDays: [],
      monthlyCycleTrend: [],
      scatterData: [],
      fairStageHeatmap: [],
      slowOpportunities: [],
    };
  }

  async getWinLoss(_params: {
    fairIds: string[];
    startDate?: string;
    endDate?: string;
    lossReasons: string[];
    conversionRate?: string;
  }): Promise<WinLossResponse> {
    return {
      kpis: { winRate: 0, wonCount: 0, lostCount: 0, lostValue: 0 },
      winLossDonut: { won: 0, lost: 0 },
      lossReasons: [],
      monthlyWinRateTrend: [],
      fairWinLoss: [],
      conversionRateSuccess: [],
      lostValueByReason: [],
      lostOpportunities: [],
      wonOpportunities: [],
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
