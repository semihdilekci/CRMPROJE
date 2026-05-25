import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { SecretsModule } from '@modules/secrets/secrets.module';
import { PermissionModule } from '@modules/permission/permission.module';

@Module({
  imports: [SecretsModule, PermissionModule],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}
