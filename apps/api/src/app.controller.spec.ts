import { Test, TestingModule } from '@nestjs/testing';
import { ServiceUnavailableException } from '@nestjs/common';
import { AppController } from './app.controller';
import { HealthService } from './health/health.service';

describe('AppController', () => {
  let controller: AppController;
  let healthService: { checkDatabaseConnection: jest.Mock };

  beforeEach(async () => {
    healthService = { checkDatabaseConnection: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [{ provide: HealthService, useValue: healthService }],
    }).compile();

    controller = module.get<AppController>(AppController);
  });

  describe('getHealth', () => {
    it('returns ok status without database call', () => {
      const result = controller.getHealth();
      expect(result).toEqual({
        success: true,
        message: 'API is running',
        data: { status: 'ok' },
      });
      expect(healthService.checkDatabaseConnection).not.toHaveBeenCalled();
    });
  });

  describe('getHealthReady', () => {
    it('returns ready when database responds', async () => {
      healthService.checkDatabaseConnection.mockResolvedValueOnce(undefined);
      await expect(controller.getHealthReady()).resolves.toEqual({
        success: true,
        message: 'API is ready',
        data: { status: 'ready' },
      });
      expect(healthService.checkDatabaseConnection).toHaveBeenCalledTimes(1);
    });

    it('propagates ServiceUnavailableException when database is unreachable', async () => {
      healthService.checkDatabaseConnection.mockRejectedValueOnce(
        new ServiceUnavailableException(
          'Veritabanına şu an bağlanılamıyor. Lütfen daha sonra tekrar deneyin.',
        ),
      );
      await expect(controller.getHealthReady()).rejects.toThrow(
        ServiceUnavailableException,
      );
    });
  });
});
