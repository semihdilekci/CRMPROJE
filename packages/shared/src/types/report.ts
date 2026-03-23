export interface ReportFilterParams {
  startDate?: string;
  endDate?: string;
  fairIds?: string[];
  period?: 'this_month' | 'this_quarter' | 'this_year' | 'custom';
}

export interface KpiItem {
  label: string;
  value: number | string;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
    label?: string;
  };
  format?: 'number' | 'currency' | 'percent' | 'text';
  color?: 'violet' | 'green' | 'cyan' | 'orange' | 'amber' | 'red';
  icon?: string;
  sparkline?: number[];
}

export interface LeaderboardItem {
  rank: number;
  label: string;
  sublabel?: string;
  value: string | number;
  secondary?: string;
  avatarInitials?: string;
  avatarColor?: string;
}

export interface ActivityFeedItem {
  id: string;
  text: string;
  timestamp: string;
  color?: string;
  context?: string;
}

export interface ReportTableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  format?: 'number' | 'currency' | 'percent' | 'date' | 'text';
}

export interface ReportTableData {
  columns: ReportTableColumn[];
  rows: Record<string, unknown>[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ProgressBarItem {
  label: string;
  value: number;
  max: number;
  color?: string;
  sublabel?: string;
}

export interface ReportCatalogItem {
  slug: string;
  name: string;
  description: string;
  icon: string;
  category: string;
}

export interface ReportCategory {
  id: string;
  title: string;
  description: string;
  reports: ReportCatalogItem[];
}

export interface ExecutiveSummaryResponse {
  kpis: {
    activeFairs: number;
    openOpportunities: number;
    pipelineValue: number;
    wonRevenue: number;
    conversionRate: number;
    totalCustomers: number;
    previousPeriod?: {
      activeFairs: number;
      openOpportunities: number;
      pipelineValue: number;
      wonRevenue: number;
      conversionRate: number;
      totalCustomers: number;
    };
  };
  monthlyRevenueTrend: Array<{ month: string; value: number }>;
  pipelineStageDistribution: Array<{ stage: string; label: string; count: number; value: number }>;
  conversionRateDistribution: Array<{ rate: string; label: string; count: number }>;
  newOpportunitySparkline: number[];
  topFairs: Array<{ id: string; name: string; openOpportunities: number }>;
  topCustomers: Array<{ id: string; company: string; name: string; totalValue: number; opportunityCount: number }>;
  recentWonOpportunities: Array<{
    id: string;
    customerCompany: string;
    fairName: string;
    value: number;
    currency: string;
    date: string;
  }>;
}

export interface FairPerformanceResponse {
  kpis: {
    totalFairs: number;
    totalOpportunities: number;
    totalWonRevenue: number;
    avgConversionRate: number;
  };
  fairOpportunityCounts: Array<{
    fairId: string;
    fairName: string;
    total: number;
    won: number;
    lost: number;
    open: number;
  }>;
  fairPipelineValues: Array<{
    fairId: string;
    fairName: string;
    pipelineValue: number;
    wonRevenue: number;
  }>;
  fairConversionRates: Array<{
    fairId: string;
    fairName: string;
    rate: number;
  }>;
  scatterData: Array<{
    fairId: string;
    fairName: string;
    opportunityCount: number;
    wonRevenue: number;
    totalOpportunities: number;
  }>;
  tableData: Array<{
    fairId: string;
    fairName: string;
    startDate: string;
    endDate: string;
    opportunityCount: number;
    won: number;
    lost: number;
    open: number;
    pipelineValue: number;
    wonRevenue: number;
    conversionRate: number;
    totalTonnage: number;
  }>;
}

export interface FairComparisonResponse {
  fairs: Array<{
    fairId: string;
    fairName: string;
    total: number;
    won: number;
    lost: number;
    open: number;
    pipelineValue: number;
    wonRevenue: number;
    totalTonnage: number;
    wonTonnage: number;
    conversionRate: number;
    avgDealValue: number;
  }>;
  stageMatrix: Array<{
    fairId: string;
    fairName: string;
    stages: Record<string, number>;
  }>;
  productMatrix: Array<{
    fairId: string;
    fairName: string;
    products: Record<string, number>;
  }>;
}

export interface FairTargetsResponse {
  selectedFairTargets?: {
    fairId: string;
    fairName: string;
    budgetTarget: number;
    budgetActual: number;
    budgetPercent: number;
    tonnageTarget: number;
    tonnageActual: number;
    tonnagePercent: number;
    leadTarget: number;
    leadActual: number;
    leadPercent: number;
  };
  allFairTargets: Array<{
    fairId: string;
    fairName: string;
    budgetTarget: number;
    budgetActual: number;
    budgetPercent: number;
    tonnageTarget: number;
    tonnageActual: number;
    tonnagePercent: number;
    leadTarget: number;
    leadActual: number;
    leadPercent: number;
  }>;
  avgTargetCompletion: number;
}

export interface PipelineOverviewResponse {
  kpis: {
    openOpportunities: number;
    pipelineValue: number;
    avgDealValue: number;
    proposalStageCount: number;
  };
  funnel: Array<{ stage: string; label: string; count: number }>;
  stageValues: Array<{
    stage: string;
    label: string;
    totalValue: number;
    segments: Array<{ rate: string; value: number }>;
  }>;
  stageDistributionPie: Array<{ stage: string; label: string; count: number }>;
  conversionRatePie: Array<{ rate: string; label: string; count: number }>;
  treemapData: Array<{
    fairName: string;
    stages: Array<{ stage: string; value: number }>;
  }>;
  tableData: Array<{
    id: string;
    customerCompany: string;
    fairName: string;
    stage: string;
    budget: number;
    currency: string;
    conversionRate: string;
    createdAt: string;
    updatedAt: string;
  }>;
}

export interface PipelineVelocityResponse {
  kpis: {
    avgCycleDays: number;
    medianCycleDays: number;
    longestWaiting: { opportunityId: string; customerCompany: string; days: number };
  };
  stageAvgDays: Array<{ stage: string; label: string; avgDays: number }>;
  monthlyCycleTrend: Array<{ month: string; avgDays: number }>;
  scatterData: Array<{
    id: string;
    value: number;
    cycleDays: number;
    won: boolean;
  }>;
  fairStageHeatmap: Array<{
    fairName: string;
    stages: Record<string, number>;
  }>;
  slowOpportunities: Array<{
    id: string;
    customerCompany: string;
    fairName: string;
    stage: string;
    daysSinceLastChange: number;
    value: number;
  }>;
}

export interface WinLossResponse {
  kpis: {
    winRate: number;
    wonCount: number;
    lostCount: number;
    lostValue: number;
  };
  winLossDonut: { won: number; lost: number };
  lossReasons: Array<{ reason: string; label: string; count: number; percent: number }>;
  monthlyWinRateTrend: Array<{ month: string; winRate: number }>;
  fairWinLoss: Array<{
    fairName: string;
    won: number;
    lost: number;
    open: number;
  }>;
  conversionRateSuccess: Array<{
    rate: string;
    label: string;
    winRate: number;
  }>;
  lostValueByReason: Array<{ reason: string; label: string; value: number }>;
  lostOpportunities: Array<{
    id: string;
    customerCompany: string;
    fairName: string;
    value: number;
    lossReason: string;
    lastStage: string;
    date: string;
  }>;
  wonOpportunities: Array<{
    id: string;
    customerCompany: string;
    fairName: string;
    value: number;
    products: string[];
    cycleDays: number;
  }>;
}

export interface RevenueResponse {
  kpis: {
    totalRevenue: number;
    avgDealValue: number;
    largestDeal: { customerCompany: string; value: number };
    monthlyAvgRevenue: number;
  };
  monthlyRevenueTrend: Array<{ month: string; value: number }>;
  revenueByFair: Array<{ fairName: string; revenue: number }>;
  revenueByProduct: Array<{ productName: string; revenue: number }>;
  currencyDistribution: Array<{ currency: string; value: number }>;
  revenueByCustomerTreemap: Array<{ customerCompany: string; revenue: number }>;
  avgDealValueTrend: Array<{ month: string; avgValue: number }>;
  tableData: Array<{
    customerCompany: string;
    fairName: string;
    budget: number;
    currency: string;
    products: string[];
    tonnage: number;
    closedAt: string;
  }>;
}

export interface ForecastResponse {
  kpis: {
    rawPipelineValue: number;
    weightedPipelineValue: number;
    estimatedWinCount: number;
  };
  stageBreakdown: Array<{
    stage: string;
    label: string;
    rawValue: number;
    weightedValue: number;
  }>;
  conversionBreakdown: Array<{
    rate: string;
    label: string;
    rawValue: number;
    weightedValue: number;
  }>;
  tableData: Array<{
    customerCompany: string;
    fairName: string;
    stage: string;
    budget: number;
    conversionRate: string;
    stageWeight: number;
    weightedValue: number;
  }>;
}

export interface CustomerOverviewResponse {
  kpis: {
    totalCustomers: number;
    activeCustomers: number;
    avgOpportunitiesPerCustomer: number;
    customerConversionRate: number;
  };
  monthlyNewCustomerTrend: Array<{ month: string; count: number }>;
  topCustomersByOpportunities: Array<{ company: string; count: number }>;
  customerStatusDistribution: Array<{ status: string; count: number }>;
  portfolioTreemap: Array<{ company: string; totalValue: number; avgConversionRate: string }>;
  tableData: Array<{
    company: string;
    name: string;
    opportunityCount: number;
    won: number;
    lost: number;
    open: number;
    totalBudget: number;
    firstContact: string;
    lastContact: string;
    conversionRate: number;
  }>;
}

export interface CustomerSegmentationResponse {
  scatterData: Array<{
    company: string;
    opportunityCount: number;
    totalValue: number;
    avgConversionRate: string;
  }>;
  topCustomersByValue: Array<{
    company: string;
    wonValue: number;
    openValue: number;
    lostValue: number;
  }>;
  conversionSegments: Array<{ segment: string; count: number }>;
  customersByFair: Array<{ fairName: string; customerCount: number }>;
  customerFairMatrix: Array<{
    company: string;
    fairs: Record<string, number>;
  }>;
  tableData: Array<{
    company: string;
    segment: string;
    totalValue: number;
    opportunityCount: number;
    winRate: number;
    avgCycleDays: number;
  }>;
}

export interface CustomerLifecycleResponse {
  kpis: {
    repeatCustomers: number;
    repeatCustomerRate: number;
    inactiveCustomers: number;
    avgCustomerLifetimeDays: number;
  };
  fairParticipationFrequency: Array<{ fairCount: number; customerCount: number }>;
  lifetimeValueTrend: Array<{ month: string; newRevenue: number; repeatRevenue: number }>;
  loyalCustomers: Array<{
    company: string;
    fairCount: number;
    opportunityCount: number;
    totalValue: number;
  }>;
  inactiveCustomerTable: Array<{
    company: string;
    name: string;
    daysSinceLastActivity: number;
    openOpportunities: number;
    value: number;
  }>;
  recentActivities: ActivityFeedItem[];
}

export interface ProductAnalysisResponse {
  kpis: {
    totalProducts: number;
    mostPopularProduct: { name: string; count: number };
    totalTonnage: number;
    wonTonnage: number;
  };
  productPopularity: Array<{ productName: string; opportunityCount: number }>;
  productTonnage: Array<{ productName: string; tonnage: number }>;
  tonnageDistribution: Array<{ productName: string; percent: number; tonnage: number }>;
  productTreemap: Array<{ productName: string; opportunityCount: number; winRate: number }>;
  productTrend: Array<{ month: string; products: Record<string, number> }>;
  tableData: Array<{
    productName: string;
    opportunityCount: number;
    totalTonnage: number;
    wonTonnage: number;
    winRate: number;
    fairCount: number;
  }>;
}

export interface ProductFairMatrixResponse {
  opportunityMatrix: Array<{
    productName: string;
    fairs: Record<string, number>;
  }>;
  tonnageMatrix: Array<{
    productName: string;
    fairs: Record<string, number>;
  }>;
  topProductsByFair: Array<{
    fairName: string;
    products: Array<{ productName: string; count: number }>;
  }>;
  productFairDistribution: Array<{
    productName: string;
    fairs: Array<{ fairName: string; count: number }>;
  }>;
  tableData: Array<{
    productName: string;
    fairName: string;
    opportunityCount: number;
    tonnage: number;
    wonTonnage: number;
    winRate: number;
  }>;
}

export interface TeamPerformanceResponse {
  kpis: {
    totalTeams: number;
    bestTeam: { name: string; winRate: number };
    mostActiveTeam: { name: string; opportunityCount: number };
  };
  teamOpportunityCounts: Array<{
    teamName: string;
    total: number;
    won: number;
    lost: number;
    open: number;
  }>;
  teamRevenue: Array<{
    teamName: string;
    pipelineValue: number;
    wonRevenue: number;
  }>;
  teamWinRates: Array<{ teamName: string; winRate: number }>;
  leaderboard: Array<{
    teamName: string;
    opportunityCount: number;
    won: number;
    winRate: number;
    totalRevenue: number;
  }>;
  tableData: Array<{
    teamName: string;
    memberCount: number;
    totalOpportunities: number;
    won: number;
    lost: number;
    open: number;
    winRate: number;
    pipelineValue: number;
    wonRevenue: number;
    avgCycleDays: number;
  }>;
}

export interface IndividualPerformanceResponse {
  leaderboard: Array<{
    userId: string;
    name: string;
    teamName: string;
    opportunityCount: number;
    won: number;
    winRate: number;
    revenue: number;
  }>;
  revenueByUser: Array<{ name: string; revenue: number }>;
  pipelineByUser: Array<{
    name: string;
    open: number;
    won: number;
    lost: number;
  }>;
  personalTrends: Array<{
    name: string;
    monthly: Array<{ month: string; wonCount: number }>;
  }>;
  scatterData: Array<{
    name: string;
    opportunityCount: number;
    winRate: number;
    revenue: number;
  }>;
  tableData: Array<{
    name: string;
    teamName: string;
    opportunityCount: number;
    won: number;
    lost: number;
    open: number;
    winRate: number;
    pipelineValue: number;
    wonRevenue: number;
    avgCycleDays: number;
    lastActivity: string;
  }>;
}

export interface ActivityAnalysisResponse {
  kpis: {
    totalActivities: number;
    dailyAvg: number;
    mostActiveUser: { name: string; count: number };
  };
  dailyActivityTrend: Array<{ date: string; count: number }>;
  dayHourHeatmap: Array<{
    day: number;
    hour: number;
    count: number;
  }>;
  activityTypeDistribution: Array<{
    date: string;
    stageChanges: number;
    notes: number;
    opportunityCreations: number;
  }>;
  userActivityCounts: Array<{ name: string; count: number }>;
  recentActivities: ActivityFeedItem[];
  tableData: Array<{
    date: string;
    userName: string;
    activityType: string;
    opportunityId: string;
    customerCompany: string;
    fairName: string;
    detail: string;
  }>;
}
