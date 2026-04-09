import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { FairService } from './fair.service';
import { PrismaService } from '@prisma/prisma.service';
import { AuditService } from '@modules/audit/audit.service';
import { SettingsService } from '@modules/settings/settings.service';

describe('FairService', () => {
  let service: FairService;
  let prisma: { fair: { findUnique: jest.Mock } };
  let getExchangeRates: jest.Mock;

  beforeEach(async () => {
    prisma = {
      fair: { findUnique: jest.fn() },
    };
    getExchangeRates = jest.fn().mockResolvedValue({
      TRY: 1,
      USD: 35,
      EUR: 40,
      GBP: 45,
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FairService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: AuditService,
          useValue: { log: jest.fn() },
        },
        {
          provide: SettingsService,
          useValue: { getExchangeRates },
        },
      ],
    }).compile();

    service = module.get(FairService);
  });

  describe('getMetrics', () => {
    it('should sum won and open pipeline in TRY using budgetCurrency', async () => {
      prisma.fair.findUnique.mockResolvedValue({
        id: 'fair-1',
        opportunities: [
          {
            budgetRaw: '10000',
            budgetCurrency: 'USD',
            currentStage: 'satisa_donustu',
            opportunityProducts: [],
          },
          {
            budgetRaw: '500000',
            budgetCurrency: 'TRY',
            currentStage: 'teklif',
            opportunityProducts: [],
          },
        ],
      });

      const m = await service.getMetrics('fair-1');

      expect(getExchangeRates).toHaveBeenCalled();
      expect(m.wonPipelineValue).toBe(350000);
      expect(m.totalPipelineValue).toBe(500000);
    });

    it('should throw when fair not found', async () => {
      prisma.fair.findUnique.mockResolvedValue(null);
      await expect(service.getMetrics('missing')).rejects.toThrow(NotFoundException);
    });
  });
});
