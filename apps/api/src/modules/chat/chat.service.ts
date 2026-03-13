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
    const provider = (input.provider ?? 'ollama') as 'ollama' | 'claude' | 'gemini';
    try {
      const contextData = await this.gatherContextData();
      const wantsExport = this.detectExportIntent(input.message);
      const systemPrompt = this.buildSystemPrompt(contextData, wantsExport);

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

      if (provider === 'ollama') {
        return this.queryOllama(userId, systemPrompt, messages, wantsExport, input.ollamaModel);
      }
      if (provider === 'gemini') {
        return this.queryGemini(userId, systemPrompt, messages, wantsExport);
      }
      return this.queryClaude(userId, systemPrompt, messages, wantsExport);
    } catch (error) {
      if (
        error instanceof InternalServerErrorException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      const errStr = String(error);
      this.logger.error(`Chat hatası (provider=${provider})`, errStr, error instanceof Error ? error.stack : undefined);
      throw new InternalServerErrorException(
        'AI analiz sırasında bir hata oluştu. Lütfen tekrar deneyin. API loglarına bakın.',
      );
    }
  }

  private async queryOllama(
    userId: string,
    systemPrompt: string,
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    wantsExport: boolean,
    ollamaModel?: string,
  ): Promise<ChatQueryResponse> {
    const baseUrl =
      this.config.get<string>('OLLAMA_BASE_URL')?.trim() ?? 'http://localhost:11434';
    const model =
      ollamaModel?.trim() ||
      this.config.get<string>('OLLAMA_MODEL')?.trim() ||
      'qwen2.5-coder:7b';

    this.logger.log(`Ollama isteği: model=${model}, baseUrl=${baseUrl}`);

    const ollamaMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ];

    try {
      const res = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: ollamaMessages,
          stream: false,
        }),
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
      if (errStr.includes('404') || errStr.includes('not found')) {
        throw new BadRequestException(
          `Ollama modeli bulunamadı: ${model}. "ollama pull ${model}" ile indirin.`,
        );
      }

      this.logger.error('Ollama beklenmeyen hata', { error: errStr });
      throw new InternalServerErrorException(
        'AI analiz sırasında bir hata oluştu. Lütfen tekrar deneyin. API loglarına bakın.',
      );
    }
  }

  private async queryGemini(
    userId: string,
    systemPrompt: string,
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    wantsExport: boolean,
  ): Promise<ChatQueryResponse> {
    const apiKey = this.config.get<string>('GEMINI_API_KEY')?.trim();
    if (!apiKey) {
      throw new BadRequestException(
        'AI analiz servisi yapılandırılmamış. apps/api/.env içinde GEMINI_API_KEY=... tanımlayın (aistudio.google.com adresinden key alın).',
      );
    }

    const contents = messages.map((m) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }));

    const model =
      this.config.get<string>('GEMINI_MODEL')?.trim() || 'gemini-2.5-flash';

    const body = {
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents,
      generationConfig: {
        maxOutputTokens: 8192,
        temperature: 0.7,
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
      ],
    };

    this.logger.log(`Gemini isteği: model=${model}`);

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        },
      );

      if (!res.ok) {
        const errText = await res.text();
        this.logger.error('Gemini API hatası', res.status, errText);
        throw new Error(`Gemini ${res.status}: ${errText}`);
      }

      const json = (await res.json()) as {
        candidates?: Array<{
          content?: { parts?: Array<{ text?: string }> };
          finishReason?: string;
        }>;
        promptFeedback?: { blockReason?: string };
      };
      const text =
        json?.candidates?.[0]?.content?.parts?.[0]?.text;
      const finishReason = json?.candidates?.[0]?.finishReason;

      if (!text || typeof text !== 'string') {
        const errDetail = finishReason
          ? `finishReason=${finishReason}`
          : json?.promptFeedback?.blockReason
            ? `blockReason=${json.promptFeedback.blockReason}`
            : 'boş yanıt';
        this.logger.warn('Gemini boş yanıt', { errDetail, json: JSON.stringify(json).slice(0, 500) });
        throw new InternalServerErrorException(
          finishReason === 'SAFETY'
            ? 'Gemini güvenlik filtresi yanıtı engelledi. Soruyu farklı şekilde sorun veya başka model deneyin.'
            : 'AI yanıt üretilemedi',
        );
      }

      const parsed = this.parseAiResponse(text);
      const resultText = (parsed.text ?? text).trim() || text;
      const result: ChatQueryResponse = {
        text: resultText,
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
      this.logger.error('Gemini hatası', errStr, error instanceof Error ? error.stack : undefined);

      if (
        errStr.includes('API key') ||
        errStr.includes('401') ||
        errStr.includes('403')
      ) {
        throw new BadRequestException(
          'GEMINI_API_KEY geçersiz. aistudio.google.com adresinden yeni key alın.',
        );
      }
      if (errStr.includes('404') || errStr.includes('not found')) {
        throw new BadRequestException(
          `Gemini modeli bulunamadı: ${model}. .env içinde GEMINI_MODEL=gemini-2.5-flash veya gemini-2.5-pro deneyin.`,
        );
      }
      if (errStr.includes('429') || errStr.includes('quota') || errStr.includes('rate')) {
        throw new InternalServerErrorException(
          'Gemini API kotası aşıldı. Birkaç dakika bekleyip tekrar deneyin.',
        );
      }
      if (
        errStr.includes('fetch failed') ||
        errStr.includes('ECONNREFUSED') ||
        errStr.includes('Failed to fetch') ||
        errStr.includes('network')
      ) {
        throw new InternalServerErrorException(
          'Gemini API\'ye bağlanılamıyor. İnternet bağlantınızı kontrol edin.',
        );
      }

      this.logger.error('Gemini beklenmeyen hata', { error: errStr });
      throw new InternalServerErrorException(
        'AI analiz sırasında bir hata oluştu. Lütfen tekrar deneyin. API loglarına bakın.',
      );
    }
  }

  private async queryClaude(
    userId: string,
    systemPrompt: string,
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    wantsExport: boolean,
  ): Promise<ChatQueryResponse> {
    const apiKey = this.config.get<string>('ANTHROPIC_API_KEY')?.trim();
    if (!apiKey) {
      throw new BadRequestException(
        'AI analiz servisi yapılandırılmamış. apps/api/.env içinde ANTHROPIC_API_KEY=... tanımlayın (console.anthropic.com adresinden key alın).',
      );
    }

    const client = new Anthropic({ apiKey });

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
      if (
        errStr.includes('fetch failed') ||
        errStr.includes('ECONNREFUSED') ||
        errStr.includes('Failed to fetch') ||
        errStr.includes('network')
      ) {
        throw new InternalServerErrorException(
          'Claude API\'ye bağlanılamıyor. İnternet bağlantınızı kontrol edin.',
        );
      }

      this.logger.error('Claude beklenmeyen hata', { error: errStr });
      throw new InternalServerErrorException(
        'AI analiz sırasında bir hata oluştu. Lütfen tekrar deneyin. API loglarına bakın.',
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
    const [fairs, opportunities, stageLogsGroup, customers] = await Promise.all([
      this.prisma.fair.findMany({
        orderBy: { startDate: 'desc' },
        select: {
          id: true,
          name: true,
          startDate: true,
          endDate: true,
          _count: { select: { opportunities: true } },
        },
      }),
      this.prisma.opportunity.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          fair: { select: { id: true, name: true } },
          customer: { select: { id: true, company: true, name: true } },
          opportunityProducts: {
            include: { product: { select: { name: true } } },
          },
          stageLogs: {
            orderBy: { createdAt: 'asc' },
            include: {
              changedBy: {
                select: {
                  name: true,
                  team: { select: { name: true } },
                },
              },
            },
          },
        },
      }),
      this.prisma.opportunityStageLog.groupBy({
        by: ['stage'],
        _count: { id: true },
      }),
      this.prisma.customer.findMany({
        include: {
          opportunities: {
            include: {
              opportunityProducts: { include: { product: true } },
            },
          },
        },
      }),
    ]);

    const fairList = fairs.map((f) => ({
      id: f.id,
      name: f.name,
      startDate: f.startDate.toISOString(),
      endDate: f.endDate.toISOString(),
      opportunityCount: f._count.opportunities,
    }));

    const oppSummary: Record<
      string,
      { count: number; budgetTotal: number; byStage: Record<string, number>; products: string[] }
    > = {};

    for (const f of fairs) {
      const fairOpps = opportunities.filter((o) => o.fairId === f.id);
      let budgetTotal = 0;
      const byStage: Record<string, number> = {};
      const products = new Set<string>();

      for (const opp of fairOpps) {
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

      oppSummary[f.id] = {
        count: fairOpps.length,
        budgetTotal,
        byStage,
        products: Array.from(products),
      };
    }

    const stageLogSummary = stageLogsGroup.reduce(
      (acc, r) => {
        acc[r.stage] = r._count.id;
        return acc;
      },
      {} as Record<string, number>,
    );

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

    const opportunitiesForAi = opportunities.map((opp) => {
      const firstLog = opp.stageLogs[0];
      const creator = firstLog?.changedBy
        ? {
            name: firstLog.changedBy.name,
            teamName: firstLog.changedBy.team?.name ?? null,
          }
        : null;

      return {
        id: opp.id,
        fairId: opp.fairId,
        fairName: opp.fair.name,
        customer: {
          company: opp.customer.company,
          name: opp.customer.name,
        },
        budgetRaw: opp.budgetRaw,
        budgetCurrency: opp.budgetCurrency,
        conversionRate: opp.conversionRate,
        lossReason: opp.lossReason,
        currentStage: opp.currentStage,
        products: opp.products,
        opportunityProducts: opp.opportunityProducts.map((op) => ({
          productName: op.product.name,
          quantity: op.quantity,
          unit: op.unit,
        })),
        stageLogs: opp.stageLogs.map((log) => ({
          stage: log.stage,
          createdAt: log.createdAt.toISOString(),
          note: log.note,
          lossReason: log.lossReason,
          changedBy: {
            name: log.changedBy.name,
            teamName: log.changedBy.team?.name ?? null,
          },
        })),
        creator,
      };
    });

    return {
      fairs: fairList,
      opportunitySummary: oppSummary,
      opportunities: opportunitiesForAi,
      stageLogSummary,
      customerSummary,
    };
  }

  private buildSystemPrompt(
    contextData: Awaited<ReturnType<typeof this.gatherContextData>>,
    wantsExport: boolean,
  ): string {
    const dataJson = JSON.stringify(contextData, null, 2);
    return `Sen bir Fuar CRM Veri Analisti olarak çalışıyorsun. Görevin, kullanıcının sorduğu soruyu yanıtlamak ve verilen JSON veriyi kullanarak profesyonel, sayısal ve eyleme geçirilebilir analiz sunmaktır.

KURALLAR:
1. Sadece veride mevcut olan bilgileri kullan. Veride olmayan konularda tahmin veya varsayım yapma.
2. Profesyonel, net ve tutarlı dil kullan. Veri analisti tonunda yaz.
3. Metin yorumunda mutlaka sayısal değerlerle destekle (örn: "5 fuar", "%23 artış", "12 fırsat").
4. Kullanıcının sorusuyla doğrudan ilgili ol. Soru dışına taşma.

VERİ (JSON):
${dataJson}

YANIT STRATEJİSİ:
a) Metin yorumu: Veriyi yorumlayarak ana bulguları, trendleri profesyonel Türkçe ile yaz. Sayısal değerlerle destekle. Tahmin yapma.
b) Grafik önerisi: Soruya uygun grafik türleri: bar, line, pie, donut, stackedBar, area, composed. Her grafik için JSON: { chartType, title, labels, data, description }. Grafikler soruyla alakalı olmalı.
c) Proaktif öneriler: Faydalı ek analizleri öner.
d) Tablo (zorunlu): Kullanıcının sorusuyla alakalı veriyi tablo halinde en altta sun.

YANIT FORMATI — MUTLAKA şu JSON yapısında döndür:
{
  "text": "Profesyonel metin yorumu (sayısal değerlerle, tahmin yok)",
  "charts": [{ "chartType": "bar", "title": "...", "labels": [...], "data": [...], "description": "..." }],
  "tables": [{ "columns": ["Sütun1", "Sütun2"], "rows": [["değer1","değer2"]] }]
}

EXCEL: Kullanıcı excel/xlsx/indir/export istediğinde response'a exportId ekle. Excel istedi mi: ${wantsExport}`;
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
