import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { createWorker } from 'tesseract.js';
import { parseBusinessCardText, type ParsedBusinessCard } from '@crm/shared';

const OFFER_TEMPLATE_DIR = 'uploads/teklif-templates';
const DEFAULT_TEMPLATE_PATH = 'assets/teklif-templates/default-teklif-template.docx';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const TEKLIF_TEMPLATE_MAX_SIZE = 2 * 1024 * 1024; // 2MB
const TEKLIF_TEMPLATE_MIME = [
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly uploadDir: string;

  constructor() {
    this.uploadDir = path.join(process.cwd(), 'uploads', 'card-images');
    this.ensureUploadDir();
  }

  async uploadCardImage(file: Express.Multer.File): Promise<string> {
    this.validateFile(file);

    const ext = path.extname(file.originalname) || '.jpg';
    const filename = `${crypto.randomUUID()}${ext}`;
    const filePath = path.join(this.uploadDir, filename);

    fs.writeFileSync(filePath, file.buffer);
    this.logger.log(`Card image uploaded: ${filename}`);

    return `/uploads/card-images/${filename}`;
  }

  async uploadCardImageWithOcr(
    file: Express.Multer.File,
  ): Promise<{ url: string; parsed: ParsedBusinessCard }> {
    this.validateFile(file);

    const ext = path.extname(file.originalname) || '.jpg';
    const filename = `${crypto.randomUUID()}${ext}`;
    const filePath = path.join(this.uploadDir, filename);

    fs.writeFileSync(filePath, file.buffer);
    this.logger.log(`Card image uploaded for OCR: ${filename}`);

    const url = `/uploads/card-images/${filename}`;

    let worker = null;
    try {
      worker = await createWorker('tur+eng');
      const {
        data: { text },
      } = await worker.recognize(filePath);
      const parsed = parseBusinessCardText(text);
      return { url, parsed };
    } finally {
      if (worker) {
        await worker.terminate();
      }
    }
  }

  private validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('Dosya zorunludur');
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException('Dosya boyutu en fazla 5MB olabilir');
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('Sadece JPEG, PNG, WebP ve GIF formatları desteklenmektedir');
    }
  }

  private ensureUploadDir(): void {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
      this.logger.log(`Upload directory created: ${this.uploadDir}`);
    }
  }

  getTeklifTemplateDir(): string {
    return path.join(process.cwd(), OFFER_TEMPLATE_DIR);
  }

  getDefaultTeklifTemplateBuffer(): Buffer | null {
    const baseDir = path.join(process.cwd(), 'apps', 'api');
    const rootDir = process.cwd();
    const candidates = [
      path.join(baseDir, DEFAULT_TEMPLATE_PATH),
      path.join(rootDir, DEFAULT_TEMPLATE_PATH),
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) {
        return fs.readFileSync(p);
      }
    }
    return null;
  }

  async uploadTeklifTemplate(file: Express.Multer.File): Promise<string> {
    if (!file) {
      throw new BadRequestException('Dosya zorunludur');
    }
    if (file.size > TEKLIF_TEMPLATE_MAX_SIZE) {
      throw new BadRequestException('Teklif template en fazla 2MB olabilir');
    }
    if (!TEKLIF_TEMPLATE_MIME.includes(file.mimetype)) {
      throw new BadRequestException(
        'Sadece Word (.docx) formatı desteklenmektedir',
      );
    }
    const dir = this.getTeklifTemplateDir();
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const filename = `teklif-template-${crypto.randomUUID()}.docx`;
    const filePath = path.join(dir, filename);
    fs.writeFileSync(filePath, file.buffer);
    this.logger.log(`Teklif template uploaded: ${filename}`);
    return `${OFFER_TEMPLATE_DIR}/${filename}`;
  }
}
