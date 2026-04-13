import { Controller, Get, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { ReportService } from './report.service';
import { ReportAuditLogInterceptor } from './report-audit-log.interceptor';
import type {
  ApiSuccessResponse,
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

@Controller('reports')
@UseGuards(JwtAuthGuard)
@UseInterceptors(ReportAuditLogInterceptor)
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('executive-summary')
  async getExecutiveSummary(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('period') period?: string,
  ): Promise<ApiSuccessResponse<ExecutiveSummaryResponse>> {
    const data = await this.reportService.getExecutiveSummary({ startDate, endDate, period });
    return { success: true, message: 'Yönetici özeti başarıyla getirildi', data };
  }

  @Get('fair-performance')
  async getFairPerformance(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: string,
    @Query('createdById') createdById?: string,
  ): Promise<ApiSuccessResponse<FairPerformanceResponse>> {
    const data = await this.reportService.getFairPerformance({ startDate, endDate, status, createdById });
    return { success: true, message: 'Fuar performans raporu başarıyla getirildi', data };
  }

  @Get('fair-comparison')
  async getFairComparison(
    @Query('fairIds') fairIds?: string,
  ): Promise<ApiSuccessResponse<FairComparisonResponse>> {
    const ids = fairIds ? fairIds.split(',') : [];
    const data = await this.reportService.getFairComparison(ids);
    return { success: true, message: 'Fuar karşılaştırma raporu başarıyla getirildi', data };
  }

  @Get('fair-targets')
  async getFairTargets(
    @Query('fairIds') fairIds?: string,
    @Query('status') status?: string,
  ): Promise<ApiSuccessResponse<FairTargetsResponse>> {
    const ids = fairIds ? fairIds.split(',') : [];
    const data = await this.reportService.getFairTargets(ids, status);
    return { success: true, message: 'Fuar hedef takibi raporu başarıyla getirildi', data };
  }

  @Get('pipeline-overview')
  async getPipelineOverview(
    @Query('fairIds') fairIds?: string,
    @Query('conversionRate') conversionRate?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<ApiSuccessResponse<PipelineOverviewResponse>> {
    const ids = fairIds ? fairIds.split(',') : [];
    const data = await this.reportService.getPipelineOverview({ fairIds: ids, conversionRate, startDate, endDate });
    return { success: true, message: 'Pipeline genel bakış raporu başarıyla getirildi', data };
  }

  @Get('pipeline-velocity')
  async getPipelineVelocity(
    @Query('fairIds') fairIds?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('finalStatus') finalStatus?: string,
  ): Promise<ApiSuccessResponse<PipelineVelocityResponse>> {
    const ids = fairIds ? fairIds.split(',') : [];
    const data = await this.reportService.getPipelineVelocity({ fairIds: ids, startDate, endDate, finalStatus });
    return { success: true, message: 'Pipeline hız analizi raporu başarıyla getirildi', data };
  }

  @Get('win-loss')
  async getWinLoss(
    @Query('fairIds') fairIds?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('lossReasons') lossReasons?: string,
    @Query('conversionRate') conversionRate?: string,
  ): Promise<ApiSuccessResponse<WinLossResponse>> {
    const ids = fairIds ? fairIds.split(',') : [];
    const reasons = lossReasons ? lossReasons.split(',') : [];
    const data = await this.reportService.getWinLoss({ fairIds: ids, startDate, endDate, lossReasons: reasons, conversionRate });
    return { success: true, message: 'Kazanma/kaybetme analizi raporu başarıyla getirildi', data };
  }

  @Get('revenue')
  async getRevenue(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('fairIds') fairIds?: string,
    @Query('currency') currency?: string,
    @Query('products') products?: string,
  ): Promise<ApiSuccessResponse<RevenueResponse>> {
    const ids = fairIds ? fairIds.split(',') : [];
    const productList = products ? products.split(',') : [];
    const data = await this.reportService.getRevenue({ startDate, endDate, fairIds: ids, currency, products: productList });
    return { success: true, message: 'Gelir analizi raporu başarıyla getirildi', data };
  }

  @Get('forecast')
  async getForecast(
    @Query('fairIds') fairIds?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<ApiSuccessResponse<ForecastResponse>> {
    const ids = fairIds ? fairIds.split(',') : [];
    const data = await this.reportService.getForecast({ fairIds: ids, startDate, endDate });
    return { success: true, message: 'Bütçe tahmini raporu başarıyla getirildi', data };
  }

  @Get('customer-overview')
  async getCustomerOverview(
    @Query('fairIds') fairIds?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('conversionRate') conversionRate?: string,
  ): Promise<ApiSuccessResponse<CustomerOverviewResponse>> {
    const ids = fairIds ? fairIds.split(',') : [];
    const data = await this.reportService.getCustomerOverview({ fairIds: ids, startDate, endDate, conversionRate });
    return { success: true, message: 'Müşteri genel bakış raporu başarıyla getirildi', data };
  }

  @Get('customer-segmentation')
  async getCustomerSegmentation(
    @Query('fairIds') fairIds?: string,
    @Query('criterion') criterion?: string,
  ): Promise<ApiSuccessResponse<CustomerSegmentationResponse>> {
    const ids = fairIds ? fairIds.split(',') : [];
    const data = await this.reportService.getCustomerSegmentation({ fairIds: ids, criterion });
    return { success: true, message: 'Müşteri segmentasyonu raporu başarıyla getirildi', data };
  }

  @Get('customer-lifecycle')
  async getCustomerLifecycle(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: string,
    @Query('fairIds') fairIds?: string,
  ): Promise<ApiSuccessResponse<CustomerLifecycleResponse>> {
    const ids = fairIds ? fairIds.split(',') : [];
    const data = await this.reportService.getCustomerLifecycle({ startDate, endDate, status, fairIds: ids });
    return { success: true, message: 'Müşteri yaşam döngüsü raporu başarıyla getirildi', data };
  }

  @Get('product-analysis')
  async getProductAnalysis(
    @Query('fairIds') fairIds?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('stageFilter') stageFilter?: string,
  ): Promise<ApiSuccessResponse<ProductAnalysisResponse>> {
    const ids = fairIds ? fairIds.split(',') : [];
    const data = await this.reportService.getProductAnalysis({ fairIds: ids, startDate, endDate, stageFilter });
    return { success: true, message: 'Ürün talep analizi raporu başarıyla getirildi', data };
  }

  @Get('product-fair-matrix')
  async getProductFairMatrix(
    @Query('fairIds') fairIds?: string,
    @Query('products') products?: string,
    @Query('metric') metric?: string,
  ): Promise<ApiSuccessResponse<ProductFairMatrixResponse>> {
    const fairIdList = fairIds ? fairIds.split(',') : [];
    const productList = products ? products.split(',') : [];
    const data = await this.reportService.getProductFairMatrix({ fairIds: fairIdList, products: productList, metric });
    return { success: true, message: 'Ürün-fuar matrisi raporu başarıyla getirildi', data };
  }

  @Get('team-performance')
  async getTeamPerformance(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('teamIds') teamIds?: string,
    @Query('fairIds') fairIds?: string,
  ): Promise<ApiSuccessResponse<TeamPerformanceResponse>> {
    const tIds = teamIds ? teamIds.split(',') : [];
    const fIds = fairIds ? fairIds.split(',') : [];
    const data = await this.reportService.getTeamPerformance({ startDate, endDate, teamIds: tIds, fairIds: fIds });
    return { success: true, message: 'Ekip performans raporu başarıyla getirildi', data };
  }

  @Get('individual-performance')
  async getIndividualPerformance(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('teamIds') teamIds?: string,
    @Query('fairIds') fairIds?: string,
    @Query('sortBy') sortBy?: string,
  ): Promise<ApiSuccessResponse<IndividualPerformanceResponse>> {
    const tIds = teamIds ? teamIds.split(',') : [];
    const fIds = fairIds ? fairIds.split(',') : [];
    const data = await this.reportService.getIndividualPerformance({ startDate, endDate, teamIds: tIds, fairIds: fIds, sortBy });
    return { success: true, message: 'Bireysel performans raporu başarıyla getirildi', data };
  }

  @Get('activity-analysis')
  async getActivityAnalysis(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('userIds') userIds?: string,
    @Query('teamIds') teamIds?: string,
    @Query('activityType') activityType?: string,
  ): Promise<ApiSuccessResponse<ActivityAnalysisResponse>> {
    const uIds = userIds ? userIds.split(',') : [];
    const tIds = teamIds ? teamIds.split(',') : [];
    const data = await this.reportService.getActivityAnalysis({ startDate, endDate, userIds: uIds, teamIds: tIds, activityType });
    return { success: true, message: 'Aktivite analizi raporu başarıyla getirildi', data };
  }
}
