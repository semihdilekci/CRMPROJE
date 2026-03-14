/**
 * Teklif template (.docx) dosyasını oluşturur.
 * Placeholder'lar: {{customer_name}}, {{customer_company}}, {{customer_address}},
 * {{customer_phone}}, {{customer_email}}, {{product_list}}, {{total_amount}}, {{total_currency}}
 *
 * Çalıştırma: npx ts-node -r tsconfig-paths/register scripts/generate-teklif-template.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { Document, Packer, Paragraph, TextRun } from 'docx';

const OUTPUT_DIR = path.join(__dirname, '..', 'assets', 'teklif-templates');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'default-teklif-template.docx');

async function main() {
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            children: [new TextRun({ text: 'TEKLİF', bold: true, size: 48 })],
          }),
          new Paragraph({ text: '' }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Sayın ', bold: false }),
              new TextRun({ text: '{{customer_name}}', bold: true }),
              new TextRun({ text: ',' }),
            ],
          }),
          new Paragraph({ text: '' }),
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
            children: [
              new TextRun({
                text: 'Aşağıda talep ettiğiniz ürünlere ait teklifimiz yer almaktadır.',
                bold: false,
              }),
            ],
          }),
          new Paragraph({ text: '' }),
          new Paragraph({
            children: [new TextRun({ text: 'ÜRÜN LİSTESİ', bold: true, size: 28 })],
          }),
          new Paragraph({ text: '{{product_list}}' }),
          new Paragraph({ text: '' }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Toplam Tutar: ', bold: true }),
              new TextRun({ text: '{{total_amount}} {{total_currency}}', bold: true }),
            ],
          }),
          new Paragraph({ text: '' }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Bu teklif 30 gün geçerlidir. Sorularınız için bizimle iletişime geçebilirsiniz.',
                bold: false,
              }),
            ],
          }),
          new Paragraph({ text: '' }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Saygılarımızla,',
                bold: false,
              }),
            ],
          }),
        ],
      },
    ],
  });

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const buffer = Buffer.from(await Packer.toBuffer(doc));
  fs.writeFileSync(OUTPUT_FILE, buffer);
  console.log(`Template oluşturuldu: ${OUTPUT_FILE}`);
}

main().catch(console.error);
