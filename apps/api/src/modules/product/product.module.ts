import { Module } from '@nestjs/common';
import { AuditModule } from '@modules/audit/audit.module';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';

@Module({
  imports: [AuditModule],
  controllers: [ProductController],
  providers: [ProductService],
  exports: [ProductService],
})
export class ProductModule {}
