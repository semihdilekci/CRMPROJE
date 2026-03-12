import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { PrismaService } from '@prisma/prisma.service';
import * as ExcelJS from 'exceljs';
import * as path from 'path';
import * as fs from 'fs';
import type { ChatQueryInput, ChatQueryResponse, ChartData, TableData } from '@crm/shared';

const EXPORT_DIR = path.join(process.cwd(), 'exports');
const EXPORT_TTL_MS = 60 * 60 * 1000;
const CLAUDE_MODEL = 'claude-sonnet-4-20250514';

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
    const provider = input.provider ?? 'claude';
    const contextData = await this.gatherContextData();
    const wantsExport = this.detectExportIntent(input.message);
    const systemPrompt = this.buildSystemPrompt(contextData, wantsExport);

    if (provider === 'ollama') {
      return this.queryOllama(userId, input, systemPrompt, wantsExport);
    }
    return this.queryClaude(userId, input, systemPrompt, wantsExport);
  }

  private async queryOllama(
    userId: string,
    input: ChatQueryInput,
    systemPrompt: string,
    wantsExport: boolean,
  ): Promise<ChatQueryResponse> {
    const baseUrl =
      this.config.get<string>('OLLAMA_BASE_URL')?.trim() ?? 'http://localhost:11434';
    const model =
      this.config.get<string>('OLLAMA_MODEL')?.trim() ?? 'qwen2.5-coder:32b';

    this.logger.log(`Ollama isteği: model=${model}, baseUrl=${baseUrl}`);

    const ollamaMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt },
      ...(input.messages?.length
        ? input.messages.slice(-10).map((m) => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          }))
        : []),
      { role: 'user', content: input.message },
    ];

    try {
      const res = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages: ollamaMessages, stream: false }),
      });

      if (!res.ok) {
        const errText = await res.text();
        this.logger.error('Ollama API hatası', res.status, errText);
        throw new Error(`Ollama ${res.status}: ${errText}`);
      }

      const json = (await res.json()) as { message?: { content?: string } };
      const text = json?.message?.content;

      if (!text || typeof text !== 'string') {
        this.logger.warn('Ollama boş yanıt', json);
        throw new InternalServerErrorException('AI yanıt üretilemedi');
      }

      const parsed = this.parseAiResponse(text);
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
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      if (error instanceof BadRequestException) {
        throw error;
      }
      const errStr = String(error);
      this.logger.error('Ollama hatası', errStr, error instanceof Error ? error.stack : undefined);

      if (
        errStr.includes('ECONNREFUSED') ||
        errStr.includes('fetch failed') ||
        errStr.includes('Failed to fetch')
      ) {
        throw new BadRequestException(
          'Ollama çalışmıyor. Lütfen "ollama serve" ile başlatın veya Claude seçin.',
        );
      }

      throw new InternalServerErrorException(
        'AI analiz sırasında bir hata oluştu. Lütfen tekrar deneyin.',
      );
    }
  }

  private async queryClaude(
    userId: string,
    input: ChatQueryInput,
    systemPrompt: string,
    wantsExport: boolean,
  ): Promise<ChatQueryResponse> {
    const apiKey = this.config.get<string>('ANTHROPIC_API_KEY')?.trim();
    if (!apiKey) {
      throw new BadRequestException(
        'AI analiz servisi yapılandırılmamış. apps/api/.env içinde ANTHROPIC_API_KEY=... tanımlayın (console.anthropic.com adresinden key alın).',
      );
    }

    const client = new Anthropic({ apiKey });
    const messages: Array<{ role: 'user' | 'assistant'; content: string }> =
      input.messages?.length
        ? [
            ...input.messages.slice(-10).map((m) => ({
              role: m.role as 'user' | 'assistant',
              content: m.content,
            })),
            { role: 'user' as const, content: input.message },
          ]
        : [{ role: 'user' as const, content: input.message }];

    try {
      const response = await client.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 4096,
        system: systemPrompt,
        messages,
      });

      const textBlock = response.content.find((b) => b.type === 'text');
      const text =
        textBlock && 'text' in textBlock ? (textBlock as { text: string }).text : undefined;

      if (!text || typeof text !== 'string') {
        this.logger.warn('Claude boş veya geçersiz yanıt', { response });
        throw new InternalServerErrorException('AI yanıt üretilemedi');
      }

      const parsed = this.parseAiResponse(text);
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
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      if (error instanceof BadRequestException) {
        throw error;
      }
      const errStr = String(error);
      this.logger.error('Claude API hatası', errStr, error instanceof Error ? error.stack : undefined);

      if (errStr.includes('429') || errStr.includes('overloaded') || errStr.includes('rate')) {
        throw new InternalServerErrorException(
          'Claude API kotası aşıldı. Birkaç dakika bekleyip tekrar deneyin.',
        );
      }
      if (errStr.includes('401') || errStr.includes('API key') || errStr.includes('authentication')) {
        throw new BadRequestException(
          'ANTHROPIC_API_KEY geçersiz. console.anthropic.com adresinden yeni key alın.',
        );
      }
      if (errStr.includes('credit') || errStr.includes('balance') || errStr.includes('too low')) {
        throw new BadRequestException(
          'Anthropic hesabınızda kredi bakiyesi yetersiz. console.anthropic.com → Plans & Billing üzerinden kredi ekleyin veya planı yükseltin.',
        );
      }

      throw new InternalServerErrorException(
        'AI analiz sırasında bir hata oluştu. Lütfen tekrar deneyin.',
      );
    }
  }

  private parseAiResponse(text: string): {
    text?: string;
    charts?: ChartData[];
    tables?: TableData[];
  } {
    const jsonStr = text.replace(/^```(?:json)?\s*|\s*```$/g, '').trim();
    try {
      return JSON.parse(jsonStr) as { text?: string; charts?: ChartData[]; tables?: TableData[] };
    } catch {
      return { text };
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

  private async gatherContextData() {
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
          const num = parseFloat(
            String(opp.budgetRaw).replace(/[^\d.,]/g, '').replace(',', '.'),
          );
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
a) Özet: Soruyu kısa bir cümleyle özetle.
b) Metin yorumu: Veriyi yorumlayarak ana bulguları, trendleri açık Türkçe ile yaz.
c) Grafik önerisi: Soruya uygun grafik türleri: bar, line, pie, donut, stackedBar, area, composed. Her grafik için JSON: { chartType, title, labels, data, description }.
d) Proaktif öneriler: Faydalı ek analizleri öner.
e) Excel: Sadece kullanıcı excel/xlsx/indir/export istediğinde response'a exportId ekle.

Yanıtını MUTLAKA şu JSON formatında döndür:
{
  "text": "Metin yorumu",
  "charts": [{ "chartType": "bar", "title": "...", "labels": [...], "data": [...], "description": "..." }],
  "tables": [{ "columns": ["A", "B"], "rows": [["1","2"]] }]
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
      const sheet = workbook.addWorksheet(`Sayfa ${i + 1}`);
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
