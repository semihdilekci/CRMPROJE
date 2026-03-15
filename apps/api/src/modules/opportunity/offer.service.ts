import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as zlib from 'zlib';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { PrismaService } from '@prisma/prisma.service';
import { SettingsService } from '@modules/settings/settings.service';
import { parseBudgetToNumber } from '@crm/shared';
import type { CreateOfferInput } from '@crm/shared';

@Injectable()
export class OfferService {
  private readonly logger = new Logger(OfferService.name);
  private templateCache: { path: string; buffer: Buffer } | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly settingsService: SettingsService,
  ) {}

  invalidateTemplateCache(): void {
    this.templateCache = null;
  }

  private async getTemplateBuffer(): Promise<Buffer> {
    const templatePath = await this.settingsService.get('TEKLIF_TEMPLATE_URL');
    if (this.templateCache?.path === templatePath && this.templateCache.buffer) {
      return this.templateCache.buffer;
    }
    const rootDir = process.cwd();
    const baseDir = path.join(rootDir, 'apps', 'api');
    const apiDir = path.resolve(__dirname, '..', '..', '..');
    const defaultPath = 'assets/teklif-templates/default-teklif-template.docx';
    const effectivePath = templatePath?.trim() || defaultPath;
    const candidates = [
      path.join(apiDir, effectivePath),
      path.join(rootDir, effectivePath),
      path.join(baseDir, effectivePath),
    ];
    for (const fullPath of candidates) {
      if (fs.existsSync(fullPath)) {
        const buffer = fs.readFileSync(fullPath);
        this.templateCache = { path: fullPath, buffer };
        return buffer;
      }
    }
    const defaultBuffer = await this.createDefaultTemplate();
    this.templateCache = { path: '__default__', buffer: defaultBuffer };
    return defaultBuffer;
  }

  private async createDefaultTemplate(): Promise<Buffer> {
    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: 'TEKLİF', bold: true, size: 48 }),
              ],
            }),
            new Paragraph({ text: '' }),
            new Paragraph({
              children: [
                new TextRun({ text: 'Müşteri: ', bold: true }),
                new TextRun({ text: '{{customer_name}}' }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: 'Firma: ', bold: true }),
                new TextRun({ text: '{{customer_company}}' }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: 'Adres: ', bold: true }),
                new TextRun({ text: '{{customer_address}}' }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: 'Telefon: ', bold: true }),
                new TextRun({ text: '{{customer_phone}}' }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: 'E-posta: ', bold: true }),
                new TextRun({ text: '{{customer_email}}' }),
              ],
            }),
            new Paragraph({ text: '' }),
            new Paragraph({
              children: [new TextRun({ text: 'Ürün Listesi:', bold: true })],
            }),
            new Paragraph({ text: '{{product_list}}' }),
            new Paragraph({ text: '' }),
            new Paragraph({
              children: [
                new TextRun({ text: 'Toplam Tutar: ', bold: true }),
                new TextRun({ text: '{{total_amount}} {{total_currency}}' }),
              ],
            }),
          ],
        },
      ],
    });
    return Buffer.from(await Packer.toBuffer(doc));
  }

  async createOffer(
    opportunityId: string,
    dto: CreateOfferInput,
  ): Promise<{ buffer: Buffer; format: 'docx' | 'pdf'; filename: string }> {
    const opportunity = await this.prisma.opportunity.findUnique({
      where: { id: opportunityId },
      include: {
        customer: true,
        opportunityProducts: { include: { product: true } },
      },
    });
    if (!opportunity) {
      throw new NotFoundException('Fırsat bulunamadı');
    }

    const { customer } = opportunity;
    const displayConfig = await this.settingsService.getDisplayConfig();
    const defaultCurrency = displayConfig.defaultCurrency;
    const exchangeRates = await this.settingsService.getExchangeRates();

    const formatAmount = (num: number): string =>
      num.toLocaleString('tr-TR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

    const unitDisplayMap: Record<string, string> = {
      ton: 'Ton',
      kg: 'kg',
      adet: 'Adet',
    };

    const products = dto.productItems.map((p, i) => {
      const lineTotalNum = parseBudgetToNumber(p.price);
      const qty = p.qty;
      const unitPriceNum = qty > 0 ? lineTotalNum / qty : 0;
      return {
        row_no: i + 1,
        product_list: p.productName,
        qty,
        unit: unitDisplayMap[p.unit] ?? p.unit,
        unit_price: formatAmount(unitPriceNum),
        line_total: formatAmount(lineTotalNum),
      };
    });

    const rateBase = exchangeRates[defaultCurrency] ?? 1;
    const totalAmountNum = dto.productItems.reduce((sum, p) => {
      const lineTotalNum = parseBudgetToNumber(p.price);
      const rate = exchangeRates[p.currency] ?? 1;
      return sum + lineTotalNum * (rateBase / rate);
    }, 0);

    const teklifNo = `TKL-${new Date().getFullYear()}-${opportunityId.slice(-8)}`;
    const teklifTarihi = new Date().toLocaleDateString('tr-TR');

    const productListText = products
      .map((p) => `${p.row_no}. ${p.product_list} - ${p.qty} ${p.unit} - ${p.line_total}`)
      .join('\n');

    const data = {
      teklif_no: teklifNo,
      teklif_tarihi: teklifTarihi,
      customer_name: customer.name,
      customer_company: customer.company,
      customer_address: customer.address ?? '-',
      customer_phone: customer.phone ?? '-',
      customer_email: customer.email ?? '-',
      products,
      product_list: productListText,
      total_amount: formatAmount(totalAmountNum),
      total_currency: defaultCurrency,
    };

    let templateBuffer: Buffer;
    try {
      templateBuffer = await this.getTemplateBuffer();
    } catch (e) {
      this.logger.error('Template yüklenemedi', e);
      throw new BadRequestException(
        'Teklif template dosyası bulunamadı. Sistem Ayarlarından varsayılan template\'i indirip yükleyin.',
      );
    }

    let filledBuffer: Buffer;
    try {
      const zip = new PizZip(templateBuffer);
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        delimiters: { start: '{{', end: '}}' },
      });
      doc.render(data);
      filledBuffer = Buffer.from(
        doc.getZip().generate({
          type: 'nodebuffer',
          compression: 'DEFLATE',
        }),
      );
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e);
      this.logger.error('Docxtemplater hatası', { message: errMsg, stack: e instanceof Error ? e.stack : undefined });
      throw new BadRequestException(
        'Teklif dokümanı oluşturulurken hata oluştu. Template formatını kontrol edin.',
      );
    }

    if (dto.outputFormat === 'pdf') {
      throw new BadRequestException(
        'PDF çıktısı şu an desteklenmiyor. Lütfen Word (docx) formatını seçin.',
      );
    }

    const compressed = zlib.gzipSync(filledBuffer);

    await this.prisma.$transaction(async (tx) => {
      await tx.opportunityOfferDocument.deleteMany({
        where: { opportunityId },
      });
      await tx.opportunityOfferDocument.create({
        data: {
          opportunityId,
          content: compressed,
          format: 'docx',
        },
      });
    });

    const filename = `teklif-${opportunityId.slice(-8)}.docx`;
    this.logger.log(`Offer created for opportunity ${opportunityId}`);
    return { buffer: filledBuffer, format: 'docx', filename };
  }

  async getOfferDocument(
    opportunityId: string,
  ): Promise<{ buffer: Buffer; format: string; filename: string } | null> {
    const doc = await this.prisma.opportunityOfferDocument.findUnique({
      where: { opportunityId },
    });
    if (!doc) return null;
    const buffer = zlib.gunzipSync(Buffer.from(doc.content));
    const ext = doc.format === 'pdf' ? 'pdf' : 'docx';
    const filename = `teklif-${opportunityId.slice(-8)}.${ext}`;
    return { buffer, format: doc.format, filename };
  }

  async hasOfferDocument(opportunityId: string): Promise<boolean> {
    const doc = await this.prisma.opportunityOfferDocument.findUnique({
      where: { opportunityId },
      select: { id: true },
    });
    return !!doc;
  }
}
