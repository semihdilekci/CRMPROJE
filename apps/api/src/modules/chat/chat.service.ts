import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import { PrismaService } from '@prisma/prisma.service';
import * as ExcelJS from 'exceljs';
import * as path from 'path';
import * as fs from 'fs';
import type { ChatQueryInput, ChatQueryResponse, ChartData, TableData } from '@crm/shared';

const EXPORT_DIR = path.join(process.cwd(), 'exports');
const EXPORT_TTL_MS = 60 * 60 * 1000; // 1 saat

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly exportCache = new Map<
    string,
    { filePath: string; createdAt: number }
  >();

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    if (!fs.existsSync(EXPORT_DIR)) {
      fs.mkdirSync(EXPORT_DIR, { recursive: true });
    }
  }

  async query(
    userId: string,
    input: ChatQueryInput,
  ): Promise<ChatQueryResponse> {
    const apiKey = this.config.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      throw new BadRequestException(
        'AI analiz servisi yapılandırılmamış. GEMINI_API_KEY tanımlayın.',
      );
    }

    const contextData = await this.gatherContextData(userId);
    const wantsExport = this.detectExportIntent(input.message);

    const systemPrompt = this.buildSystemPrompt(contextData, wantsExport);
    const ai = new GoogleGenAI({ apiKey });

    const userMessage =
      input.messages?.length
        ? [
            ...input.messages.slice(-10).map((m) =>
              m.role === 'user'
                ? { role: 'user' as const, parts: [{ text: m.content }] }
                : { role: 'model' as const, parts: [{ text: m.content }] },
            ),
            { role: 'user' as const, parts: [{ text: input.message }] },
          ]
        : input.message;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
        },
        contents: userMessage,
      });

      const text = response.text;
      if (!text) {
        throw new BadRequestException('AI yanıt üretilemedi');
      }

      let parsed: {
        text?: string;
        charts?: ChartData[];
        tables?: TableData[];
        exportId?: string;
        exportDescription?: string;
      };

      try {
        parsed = JSON.parse(text) as typeof parsed;
      } catch {
        parsed = { text };
      }

      const result: ChatQueryResponse = {
        text: parsed.text ?? text,
        charts: parsed.charts,
        tables: parsed.tables,
      };

      if (wantsExport && parsed.tables?.length) {
        const exportId = await this.createExcelExport(parsed.tables, userId);
        result.exportId = exportId;
        result.exportDescription = 'Analiz verisi Excel dosyası';
      }

      return result;
    } catch (error) {
      this.logger.error('Gemini API hatası', error);
      throw new BadRequestException(
        'AI analiz sırasında bir hata oluştu. Lütfen tekrar deneyin.',
      );
    }
  }

  async getExport(exportId: string, _userId: string): Promise<{
    filePath: string;
    fileName: string;
  }> {
    const cached = this.exportCache.get(exportId);
    if (!cached) {
      throw new BadRequestException('Export bulunamadı veya süresi dolmuş');
    }
    if (Date.now() - cached.createdAt > EXPORT_TTL_MS) {
      this.exportCache.delete(exportId);
      if (fs.existsSync(cached.filePath)) fs.unlinkSync(cached.filePath);
      throw new BadRequestException('Export süresi dolmuş');
    }
    return {
      filePath: cached.filePath,
      fileName: `analiz-${exportId}.xlsx`,
    };
  }

  private async gatherContextData(_userId: string) {
    const fairs = await this.prisma.fair.findMany({
      orderBy: { startDate: 'desc' },
      include: {
        _count: { select: { opportunities: true } },
        opportunities: {
          include: {
            opportunityProducts: { include: { product: true } },
          },
        },
      },
    });

    const fairList = fairs.map((f) => ({
      id: f.id,
      name: f.name,
      startDate: f.startDate.toISOString(),
      endDate: f.endDate.toISOString(),
      opportunityCount: f._count.opportunities,
    }));

    const oppSummary: Record<
      string,
      {
        count: number;
        budgetTotal: number;
        byStage: Record<string, number>;
        products: string[];
      }
    > = {};

    for (const fair of fairs) {
      let budgetTotal = 0;
      const byStage: Record<string, number> = {};
      const products = new Set<string>();

      for (const opp of fair.opportunities) {
        if (opp.budgetRaw) {
          const num = parseFloat(String(opp.budgetRaw).replace(/[^\d.,]/g, '').replace(',', '.'));
          if (!isNaN(num)) budgetTotal += num;
        }
        byStage[opp.currentStage] = (byStage[opp.currentStage] ?? 0) + 1;
        for (const op of opp.opportunityProducts) {
          products.add(op.product.name);
        }
      }

      oppSummary[fair.id] = {
        count: fair.opportunities.length,
        budgetTotal,
        byStage,
        products: Array.from(products),
      };
    }

    const stageLogs = await this.prisma.opportunityStageLog.groupBy({
      by: ['stage'],
      _count: { id: true },
    });

    const stageLogSummary = stageLogs.reduce(
      (acc, r) => {
        acc[r.stage] = r._count.id;
        return acc;
      },
      {} as Record<string, number>,
    );

    const customers = await this.prisma.customer.findMany({
      include: {
        _count: { select: { opportunities: true } },
        opportunities: {
          include: {
            opportunityProducts: { include: { product: true } },
          },
        },
      },
    });

    const customerSummary = {
      total: customers.length,
      byProduct: {} as Record<string, number>,
    };

    for (const c of customers) {
      for (const o of c.opportunities) {
        for (const op of o.opportunityProducts) {
          customerSummary.byProduct[op.product.name] =
            (customerSummary.byProduct[op.product.name] ?? 0) + 1;
        }
      }
    }

    return {
      fairs: fairList,
      opportunitySummary: oppSummary,
      stageLogSummary,
      customerSummary,
    };
  }

  private buildSystemPrompt(
    contextData: Awaited<ReturnType<typeof this.gatherContextData>>,
    wantsExport: boolean,
  ): string {
    const dataJson = JSON.stringify(contextData, null, 2);
    return `Sen bir Fuar CRM Kıdemli Analisti olarak çalışıyorsun. Görevin, kullanıcının sorduğu soruyu yanıtlamak ve verilen JSON veriyi kullanarak zengin, eyleme geçirilebilir analiz sunmaktır.

Veri (JSON):
${dataJson}

Yanıt stratejin:
a) Özet: Soruyu kısa bir cümleyle özetle, neyi analiz ettiğini belirt.
b) Metin yorumu: Veriyi yorumlayarak ana bulguları, trendleri ve dikkat çeken noktaları açık, anlaşılır Türkçe ile yaz. Sayıları ve oranları vurgula.
c) Grafik önerisi: Soruya uygun grafik türlerini düşün: bar, line, pie, donut, stackedBar, area, composed. Her grafik için JSON: { chartType, title, labels, data, description }.
d) Proaktif öneriler: Faydalı ek analizleri öner.
e) Excel: Sadece kullanıcı açıkça excel/xlsx/indir/export/dışa aktar istediğinde response'a exportId ve exportDescription ekle. İstek yoksa ekleme.

Yanıtını MUTLAKA aşağıdaki JSON formatında döndür. Başka metin ekleme.
{
  "text": "Metin yorumu burada",
  "charts": [{ "chartType": "bar", "title": "...", "labels": [...], "data": [...], "description": "..." }],
  "tables": [{ "columns": ["A", "B"], "rows": [["1","2"]] }],
  "exportId": null,
  "exportDescription": null
}

Kullanıcı Excel istedi mi: ${wantsExport}`;
  }

  private detectExportIntent(message: string): boolean {
    const lower = message.toLowerCase();
    const keywords = [
      'excel',
      'xlsx',
      'indir',
      'export',
      'dışa aktar',
      'indirme',
      'download',
    ];
    return keywords.some((k) => lower.includes(k));
  }

  private async createExcelExport(
    tables: TableData[],
    userId: string,
  ): Promise<string> {
    const exportId = `exp-${Date.now()}-${userId.slice(-6)}`;
    const filePath = path.join(EXPORT_DIR, `${exportId}.xlsx`);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Fuar CRM AI';

    for (let i = 0; i < tables.length; i++) {
      const table = tables[i]!;
      const sheet = workbook.addWorksheet(`Sayfa ${i + 1}`, {
        headerFooter: { firstHeader: table.columns.join(' | ') },
      });

      sheet.addRow(table.columns);
      const headerRow = sheet.getRow(1);
      headerRow.font = { bold: true };

      for (const row of table.rows) {
        sheet.addRow(row);
      }
    }

    await workbook.xlsx.writeFile(filePath);

    this.exportCache.set(exportId, {
      filePath,
      createdAt: Date.now(),
    });

    setTimeout(() => {
      this.exportCache.delete(exportId);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }, EXPORT_TTL_MS);

    return exportId;
  }
}
