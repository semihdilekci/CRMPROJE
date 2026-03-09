import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly uploadDir: string;

  constructor(private readonly configService: ConfigService) {
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

    const port = this.configService.get<string>('PORT', '3001');
    return `http://localhost:${port}/uploads/card-images/${filename}`;
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
}
