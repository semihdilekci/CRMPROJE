import {
  Injectable,
  BadRequestException,
  ForbiddenException,
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
import {
  AI_LOG_EVENTS,
  LOG_CATEGORIES,
} from '@crm/shared';
import { StructuredLogService } from '@common/logging/structured-log.service';

const EXPORT_DIR = path.join(process.cwd(), 'exports');
const EXPORT_TTL_MS = 60 * 60 * 1000;
const CLAUDE_MODEL = 'claude-sonnet-4-20250514';
/** Gemini/proxy istek gövdesi sınırını aşmaması için bağlam JSON üst sınırı (karakter). */
const MAX_SYSTEM_CONTEXT_JSON_CHARS = 700_000;
/** AI bağlamında işlenecek en fazla fırsat (en yeni önce). */
const MAX_OPPORTUNITIES_FOR_AI_CONTEXT = 1200;
/** Fırsat başına AI’ya gönderilecek en fazla aşama kaydı (zaman çizelgesi). */
const MAX_STAGE_LOGS_PER_OPPORTUNITY = 35;
/** Müşteri bazlı kıyas soruları için bağlamda sunulan en fazla müşteri (tüm DB’den özet). */
const TOP_CUSTOMERS_IN_CONTEXT = 25;
/** Aşırı büyük model çıktısı nedeniyle 500 / proxy hatalarını önlemek için üst sınırlar. */
const MAX_RESPONSE_TEXT_CHARS = 96_000;
const MAX_CHARTS_IN_RESPONSE = 12;
const MAX_TABLES_IN_RESPONSE = 8;
const MAX_ROWS_PER_TABLE = 60;

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly exportCache = new Map<
    string,
    { filePath: string; createdAt: number; userId: string }
  >();

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly structuredLog: StructuredLogService,
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
    const started = Date.now();
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

      let result: ChatQueryResponse;
      if (provider === 'ollama') {
        result = await this.queryOllama(
          userId,
          systemPrompt,
          messages,
          wantsExport,
          input.ollamaModel,
        );
      } else if (provider === 'gemini') {
        result = await this.queryGemini(userId, systemPrompt, messages, wantsExport);
      } else {
        result = await this.queryClaude(userId, systemPrompt, messages, wantsExport);
      }

      this.writeAiChatLine({
        userId,
        provider,
        durationMs: Date.now() - started,
        outcome: 'success',
      });
      return result;
    } catch (error) {
      this.writeAiChatLine({
        userId,
        provider,
        durationMs: Date.now() - started,
        outcome: 'failure',
      });
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

  private writeAiChatLine(opts: {
    userId: string;
    provider: string;
    durationMs: number;
    outcome: 'success' | 'failure';
  }): void {
    this.structuredLog.writeLine({
      ...this.structuredLog.baseFields(),
      level: opts.outcome === 'success' ? 'info' : 'warn',
      logCategory: LOG_CATEGORIES.ai,
      event: AI_LOG_EVENTS.CHAT_QUERY,
      outcome: opts.outcome,
      userId: opts.userId,
      aiProvider: opts.provider,
      durationMs: opts.durationMs,
      message: `ai chat ${opts.outcome}`,
    });
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
      const clamped = this.clampChatResponse(result);
      if (wantsExport && clamped.tables?.length) {
        const exportId = await this.createExcelExport(clamped.tables, userId);
        clamped.exportId = exportId;
        clamped.exportDescription = 'Analiz verisi Excel dosyası';
      }
      return clamped;
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
        maxOutputTokens: 12288,
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

    const geminiTimeoutMs = 120_000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), geminiTimeoutMs);

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: controller.signal,
        },
      );
      clearTimeout(timeoutId);

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
      const clamped = this.clampChatResponse(result);
      if (wantsExport && clamped.tables?.length) {
        const exportId = await this.createExcelExport(clamped.tables, userId);
        clamped.exportId = exportId;
        clamped.exportDescription = 'Analiz verisi Excel dosyası';
      }
      return clamped;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      if (error instanceof BadRequestException) {
        throw error;
      }
      if (error instanceof Error && error.name === 'AbortError') {
        this.logger.error(`Gemini zaman aşımı (${geminiTimeoutMs}ms)`);
        throw new InternalServerErrorException(
          `Gemini yanıtı ${geminiTimeoutMs / 1000} saniye içinde gelmedi. Daha kısa bir soru deneyin veya bir süre sonra tekrarlayın.`,
        );
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
      const clamped = this.clampChatResponse(result);
      if (wantsExport && clamped.tables?.length) {
        const exportId = await this.createExcelExport(clamped.tables, userId);
        clamped.exportId = exportId;
        clamped.exportDescription = 'Analiz verisi Excel dosyası';
      }
      return clamped;
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

  /** İlk { ile eşleşen köşeli JSON nesnesini string içi süslü parantezleri saymadan keser. */
  private sliceBalancedJsonObject(text: string, startIndex: number): string | null {
    if (text[startIndex] !== '{') return null;
    let depth = 0;
    let inString = false;
    let escape = false;
    for (let i = startIndex; i < text.length; i++) {
      const c = text[i]!;
      if (inString) {
        if (escape) {
          escape = false;
          continue;
        }
        if (c === '\\') {
          escape = true;
          continue;
        }
        if (c === '"') inString = false;
        continue;
      }
      if (c === '"') {
        inString = true;
        continue;
      }
      if (c === '{') depth++;
      else if (c === '}') {
        depth--;
        if (depth === 0) return text.slice(startIndex, i + 1);
      }
    }
    return null;
  }

  private parseAiResponse(text: string): {
    text?: string;
    charts?: ChartData[];
    tables?: TableData[];
  } {
    const trimmed = text.trim();

    const tryBranch = (
      candidate: string,
    ): { text?: string; charts?: ChartData[]; tables?: TableData[] } | null =>
      this.tryParseStructuredJson(candidate);

    // 1) Tüm yanıt tek ```json ... ``` bloğu
    const blockMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
    if (blockMatch) {
      const ok = tryBranch(blockMatch[1]!.trim());
      if (ok) return ok;
    }

    // 2) Metin içinde ilk ```json ... ``` bloğu (önce/sonra açıklama olabilir)
    const looseFence = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (looseFence?.[1]) {
      const inner = looseFence[1].trim();
      const ok = tryBranch(inner);
      if (ok) return ok;
    }

    // 3) Şema anahtarıyla başlayan nesne + dengeli kesit (JSON sonrası ek metin güvenli)
    const rawMatch = text.match(/\{\s*"(?:text|charts|tables)"\s*:/);
    if (rawMatch && rawMatch.index !== undefined) {
      const balanced = this.sliceBalancedJsonObject(text, rawMatch.index);
      if (balanced) {
        const ok = tryBranch(balanced);
        if (ok) return ok;
      }
      const ok = tryBranch(text.slice(rawMatch.index));
      if (ok) return ok;
    }

    // 4) Tüm yanıt tek JSON
    let parsed = tryBranch(trimmed);
    if (parsed) return parsed;

    // 5) İlk { ile dengeli nesne (ham JSON + ekstra metin)
    const firstBrace = trimmed.indexOf('{');
    if (firstBrace !== -1) {
      const balanced = this.sliceBalancedJsonObject(trimmed, firstBrace);
      if (balanced) {
        parsed = tryBranch(balanced);
        if (parsed) return parsed;
      }
    }

    return { text };
  }

  private tryParseStructuredJson(jsonStr: string): {
    text?: string;
    charts?: ChartData[];
    tables?: TableData[];
  } | null {
    try {
      const parsed = JSON.parse(jsonStr) as unknown;
      if (Array.isArray(parsed)) {
        return {
          text: 'Grafikler aşağıda.',
          charts: this.normalizeCharts(parsed as ChartData[]),
          tables: undefined,
        };
      }
      if (parsed && typeof parsed === 'object') {
        const obj = parsed as { text?: string; charts?: ChartData[]; tables?: TableData[] };
        if (obj.text || obj.charts || obj.tables) {
          return {
            text: (obj.text ?? '').trim() || 'Analiz sonuçları aşağıda.',
            charts: this.normalizeCharts(obj.charts),
            tables: obj.tables,
          };
        }
      }
    } catch {
      // ignore
    }
    return null;
  }

  private normalizeCharts(charts: ChartData[] | undefined): ChartData[] {
    if (!charts?.length) return [];
    return charts.map((c) => this.normalizeChart(c)).filter(Boolean) as ChartData[];
  }

  private normalizeChart(chart: ChartData): ChartData | null {
    if (!chart?.chartType || !chart.title) return null;
    // stackedBar: AI bazen data: [{ label, values }] formatında döner
    if (chart.chartType === 'stackedBar' && Array.isArray(chart.data)) {
      const arr = chart.data as Array<{ label?: string; values?: number[] }>;
      if (arr.length > 0 && 'label' in (arr[0] ?? {})) {
        const obj: Record<string, number[]> = {};
        for (const item of arr) {
          const label = item?.label ?? '';
          const values = item?.values ?? [];
          if (label) obj[label] = values;
        }
        return { ...chart, data: obj };
      }
    }
    return chart;
  }

  private parseBudgetRawToNumber(raw: string | null | undefined): number {
    if (!raw) return 0;
    const num = parseFloat(String(raw).replace(/[^\d.,]/g, '').replace(',', '.'));
    return Number.isNaN(num) ? 0 : num;
  }

  /** Model çıktısı çok büyüdüğünde HTTP 500 / serileştirme hatalarını önler. */
  private clampChatResponse(result: ChatQueryResponse): ChatQueryResponse {
    let text = result.text ?? '';
    if (text.length > MAX_RESPONSE_TEXT_CHARS) {
      text =
        text.slice(0, MAX_RESPONSE_TEXT_CHARS) +
        '\n\n[… yanıt uzunluk sınırı nedeniyle kesildi]';
    }
    const charts = result.charts?.slice(0, MAX_CHARTS_IN_RESPONSE);
    const tables = result.tables
      ?.slice(0, MAX_TABLES_IN_RESPONSE)
      .map((t) => ({
        columns: t.columns,
        rows: t.rows.slice(0, MAX_ROWS_PER_TABLE),
      }));
    return {
      ...result,
      text,
      charts,
      tables,
    };
  }

  /**
   * Tüm veritabanından müşteri bazlı özet (müşteri sıralaması / kıyas soruları için).
   * opportunities dizisi 1200 ile sınırlı olduğundan bu blok ayrı tutulur.
   */
  private async buildCustomerLeaderboard(
    customerCounts: Array<{ customerId: string; _count: { id: number } }>,
  ): Promise<
    Array<{
      rank: number;
      customerId: string;
      company: string;
      name: string;
      opportunityCount: number;
      budgetTotalApprox: number;
      byStage: Record<string, number>;
      satisaDonustuCount: number;
      olumsuzCount: number;
      satisDonusumOraniYuzde: number;
    }>
  > {
    const sorted = [...customerCounts].sort((a, b) => b._count.id - a._count.id);
    const topIds = sorted.slice(0, TOP_CUSTOMERS_IN_CONTEXT).map((x) => x.customerId);
    if (topIds.length === 0) return [];

    const [customers, opps] = await Promise.all([
      this.prisma.customer.findMany({
        where: { id: { in: topIds } },
        select: { id: true, company: true, name: true },
      }),
      this.prisma.opportunity.findMany({
        where: { customerId: { in: topIds } },
        select: { customerId: true, currentStage: true, budgetRaw: true },
      }),
    ]);

    const customerById = new Map(customers.map((c) => [c.id, c]));
    const entries: Array<{
      rank: number;
      customerId: string;
      company: string;
      name: string;
      opportunityCount: number;
      budgetTotalApprox: number;
      byStage: Record<string, number>;
      satisaDonustuCount: number;
      olumsuzCount: number;
      satisDonusumOraniYuzde: number;
    }> = [];

    let rank = 1;
    for (const cid of topIds) {
      const c = customerById.get(cid);
      if (!c) continue;
      const rows = opps.filter((o) => o.customerId === cid);
      const byStage: Record<string, number> = {};
      let budgetTotalApprox = 0;
      let satisaDonustuCount = 0;
      let olumsuzCount = 0;
      for (const o of rows) {
        byStage[o.currentStage] = (byStage[o.currentStage] ?? 0) + 1;
        budgetTotalApprox += this.parseBudgetRawToNumber(o.budgetRaw);
        if (o.currentStage === 'satisa_donustu') satisaDonustuCount++;
        if (o.currentStage === 'olumsuz') olumsuzCount++;
      }
      const n = rows.length;
      const satisDonusumOraniYuzde =
        n > 0 ? Math.round((satisaDonustuCount / n) * 10000) / 100 : 0;
      entries.push({
        rank: rank++,
        customerId: cid,
        company: c.company,
        name: c.name,
        opportunityCount: n,
        budgetTotalApprox,
        byStage,
        satisaDonustuCount,
        olumsuzCount,
        satisDonusumOraniYuzde,
      });
    }
    return entries;
  }

  async getExport(exportId: string, userId: string): Promise<{
    filePath: string;
    fileName: string;
  }> {
    const cached = this.exportCache.get(exportId);
    if (!cached) {
      throw new BadRequestException('Export bulunamadı veya süresi dolmuş');
    }
    if (cached.userId !== userId) {
      throw new ForbiddenException('Bu dosyaya erişim yetkiniz bulunmamaktadır');
    }
    if (Date.now() - cached.createdAt > EXPORT_TTL_MS) {
      this.exportCache.delete(exportId);
      if (fs.existsSync(cached.filePath)) fs.unlinkSync(cached.filePath);
      throw new BadRequestException('Export süresi dolmuş');
    }
    this.structuredLog.writeLine({
      ...this.structuredLog.baseFields(),
      level: 'info',
      logCategory: LOG_CATEGORIES.ai,
      event: AI_LOG_EVENTS.EXPORT_DOWNLOAD,
      outcome: 'success',
      userId,
      exportId,
      message: 'ai export download',
    });
    return {
      filePath: cached.filePath,
      fileName: `analiz-${exportId}.xlsx`,
    };
  }

  private async gatherContextData() {
    const [fairs, opportunities, stageLogsGroup, customerTotal, customerCounts] =
      await Promise.all([
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
          take: MAX_OPPORTUNITIES_FOR_AI_CONTEXT,
          include: {
            fair: { select: { id: true, name: true } },
            customer: { select: { id: true, company: true, name: true } },
            opportunityProducts: {
              include: { product: { select: { name: true } } },
            },
            stageLogs: {
              orderBy: { createdAt: 'asc' },
              take: MAX_STAGE_LOGS_PER_OPPORTUNITY,
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
        this.prisma.customer.count(),
        this.prisma.opportunity.groupBy({
          by: ['customerId'],
          _count: { id: true },
        }),
      ]);

    const customerLeaderboardTop = await this.buildCustomerLeaderboard(customerCounts);

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
        budgetTotal += this.parseBudgetRawToNumber(opp.budgetRaw);
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
      total: customerTotal,
      byProduct: {} as Record<string, number>,
    };

    for (const opp of opportunities) {
      for (const op of opp.opportunityProducts) {
        customerSummary.byProduct[op.product.name] =
          (customerSummary.byProduct[op.product.name] ?? 0) + 1;
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
      customerLeaderboard: {
        topByOpportunityCount: customerLeaderboardTop,
        note:
          'Tüm Opportunity kayıtları üzerinden hesaplanmıştır. Müşteri sıralaması ve kıyas (satışa dönüşüm, bütçe, pipeline) sorularında öncelikle bu diziyi kullan; opportunities dizisi yalnızca son kayıtların örneklemesidir.',
      },
    };
  }

  private buildSystemPrompt(
    contextData: Awaited<ReturnType<typeof this.gatherContextData>>,
    wantsExport: boolean,
  ): string {
    let dataJson = JSON.stringify(contextData, null, 2);
    if (dataJson.length > MAX_SYSTEM_CONTEXT_JSON_CHARS) {
      this.logger.warn(
        `AI analiz bağlamı çok büyük (${dataJson.length} karakter), ${MAX_SYSTEM_CONTEXT_JSON_CHARS} ile kısaltılıyor`,
      );
      dataJson =
        dataJson.slice(0, MAX_SYSTEM_CONTEXT_JSON_CHARS) +
        '\n\n[... veri boyut sınırı nedeniyle kesildi; özet ve sayımlar yine de güvenilirdir]';
    }
    return `Sen bir Fuar CRM Veri Analisti olarak çalışıyorsun. Görevin, kullanıcının sorduğu soruyu yanıtlamak ve verilen JSON veriyi kullanarak profesyonel, sayısal ve eyleme geçirilebilir analiz sunmaktır.

VERİ KAPSAMI: opportunities dizisi en fazla ${MAX_OPPORTUNITIES_FOR_AI_CONTEXT} güncel fırsat kaydı içerir; fuar bazlı toplam fırsat sayıları için fairs[].opportunityCount ve opportunitySummary kullan. Uzun geçmiş için stageLogs fırsat başına kısaltılmış olabilir.

MÜŞTERİ SIRALAMASI / KIYAS: "En çok fırsat", "ilk N müşteri", "satışa dönüşüm oranı", "bütçe ve pipeline kıyas" gibi sorularda yanıtı customerLeaderboard.topByOpportunityCount üzerinden kur; bu alan tüm veritabanından türetilmiş özet içerir (rank, opportunityCount, budgetTotalApprox, byStage, satisDonusumOraniYuzde). Grafik ve tabloları mümkün olduğunca küçük tut (en fazla 5 müşteri satırı).

KURALLAR:
1. Sadece veride mevcut olan bilgileri kullan. Veride olmayan konularda tahmin veya varsayım yapma.
2. Profesyonel, net ve tutarlı dil kullan. Veri analisti tonunda yaz.
3. Metin yorumunda mutlaka sayısal değerlerle destekle (örn: "5 fuar", "%23 artış", "12 fırsat").
4. Kullanıcının sorusuyla doğrudan ilgili ol. Soru dışına taşma.

VERİ (JSON):
${dataJson}

YANIT STRATEJİSİ:
a) text: Veriyi yorumlayarak ana bulguları, trendleri profesyonel Türkçe ile yaz. Sayısal değerlerle destekle. Tahmin yapma. Proaktif önerileri de bu metne dahil et.
b) charts: Soruya uygun grafik türleri: bar, line, pie, donut, stackedBar, area, composed. Her grafik: { chartType, title, labels, data, description }.
c) tables: Kullanıcının sorusuyla alakalı veriyi tablo halinde sun. columns: sütun adları, rows: satır dizisi.

YANIT FORMATI — ZORUNLU:
Yanıtının TAMAMINI sadece aşağıdaki JSON yapısında döndür. Markdown, başlık, tablo veya grafik metin formatı KULLANMA. Sadece geçerli JSON döndür.

{
  "text": "Profesyonel metin yorumu (sayısal değerlerle, proaktif öneriler dahil)",
  "charts": [{ "chartType": "bar", "title": "...", "labels": ["a","b"], "data": [1,2], "description": "..." }],
  "tables": [{ "columns": ["Sütun1", "Sütun2"], "rows": [["değer1","değer2"]] }]
}

stackedBar için data formatı: { "Seri1": [1,2,3], "Seri2": [4,5,6] } — labels x ekseni için.

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
      userId,
    });

    setTimeout(() => {
      this.exportCache.delete(exportId);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }, EXPORT_TTL_MS);

    return exportId;
  }
}
