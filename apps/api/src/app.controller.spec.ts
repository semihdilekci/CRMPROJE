import { Test, TestingModule } from '@nestjs/testing';
import { ServiceUnavailableException } from '@nestjs/common';
import { AppController } from './app.controller';
import { PrismaService } from '@prisma/prisma.service';

describe('AppController', () => {
  let controller: AppController;
  let prisma: { $queryRaw: jest.Mock };

  beforeEach(async () => {
    prisma = { $queryRaw: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [{ provide: PrismaService, useValue: prisma }],
    }).compile();

    controller = module.get<AppController>(AppController);
  });

  describe('getHealthReady', () => {
    it('returns success when database responds', async () => {
      prisma.$queryRaw.mockResolvedValueOnce(undefined);
      await expect(controller.getHealthReady()).resolves.toEqual({
        success: true,
        message: 'API is ready',
        data: { status: 'ready' },
      });
      expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
    });

    it('throws ServiceUnavailableException when database query fails', async () => {
      prisma.$queryRaw.mockRejectedValueOnce(new Error('ECONNREFUSED'));
      await expect(controller.getHealthReady()).rejects.toThrow(
        ServiceUnavailableException,
      );
    });
  });
});
