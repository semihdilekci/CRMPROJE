/**
 * OpportunityStageLog tablosunu boşaltıp yeniden doldurur.
 *
 * Kurallar:
 * - Her fırsat rastgele 1-5 arası bir stage'de (tanisma, toplanti, teklif, sozlesme, satisa_donustu)
 * - Fırsatların %5'i olumsuz
 * - Olumsuz fırsatlar: 1-4 aşama geçtikten sonra olumsuz
 * - Olumsuz olmayan fırsatlar: mevcut stage'e kadar sırayla log (örn: stage 3 ise 1,2,3 logları)
 * - Aşama loglarındaki createdAt öncül-ardıl sırasına göre (ilk aşama en erken tarih)
 *
 * Kullanım: cd apps/api && npm run seed:stage-logs
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const STAGES_1_TO_5 = ['tanisma', 'toplanti', 'teklif', 'sozlesme', 'satisa_donustu'] as const;
const LOSS_REASONS = [
  'price_high',
  'competitor',
  'need_gone',
  'timing',
  'communication_lost',
  'budget_not_approved',
  'other',
] as const;

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function randomBetween(min: number, max: number): number {
  return Math.floor(min + Math.random() * (max - min + 1));
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

async function main(): Promise<void> {
  console.log('🗑️  OpportunityStageLog tablosu boşaltılıyor...');
  await prisma.opportunityStageLog.deleteMany();
  console.log('   ✓ Tablo boşaltıldı.');

  const opportunities = await prisma.opportunity.findMany({
    orderBy: { createdAt: 'asc' },
    include: { fair: { select: { startDate: true } } },
  });

  const users = await prisma.user.findMany({ select: { id: true } });
  if (users.length === 0) {
    throw new Error('En az bir kullanıcı olmalı');
  }

  if (opportunities.length === 0) {
    console.log('⚠️  Fırsat bulunamadı. Önce seed çalıştırın: npm run db:seed');
    return;
  }

  const olumsuzCount = Math.max(1, Math.floor(opportunities.length * 0.05));
  const olumsuzIndices = new Set<number>();
  while (olumsuzIndices.size < olumsuzCount) {
    olumsuzIndices.add(Math.floor(Math.random() * opportunities.length));
  }

  let totalLogs = 0;

  for (let i = 0; i < opportunities.length; i++) {
    const opp = opportunities[i]!;
    const isOlumsuz = olumsuzIndices.has(i);

    let currentStage: string;
    let stagesToLog: string[];
    let lossReason: string | null = null;

    if (isOlumsuz) {
      currentStage = 'olumsuz';
      lossReason = pickRandom(LOSS_REASONS);
      const stagesBeforeOlumsuz = randomBetween(1, 4); // tanisma..sozlesme arası, satisa_donustu olmadan
      stagesToLog = [...STAGES_1_TO_5.slice(0, stagesBeforeOlumsuz), 'olumsuz'];
    } else {
      const stageIndex = randomBetween(0, 4);
      currentStage = STAGES_1_TO_5[stageIndex]!;
      stagesToLog = STAGES_1_TO_5.slice(0, stageIndex + 1);
    }

    const baseDate = new Date(opp.fair.startDate);
    const changedById = pickRandom(users).id;

    const logsToCreate: Array<{
      opportunityId: string;
      stage: string;
      note: string | null;
      lossReason: string | null;
      createdAt: Date;
      changedById: string;
    }> = [];

    let runningDate = new Date(baseDate);
    for (const stage of stagesToLog) {
      logsToCreate.push({
        opportunityId: opp.id,
        stage,
        note: stage === 'olumsuz' ? 'Müşteri ile anlaşılamadı.' : `Aşama güncellendi: ${stage}`,
        lossReason: stage === 'olumsuz' ? lossReason : null,
        createdAt: new Date(runningDate),
        changedById,
      });
      runningDate = addDays(runningDate, randomBetween(1, 5));
    }

    await prisma.$transaction([
      prisma.opportunity.update({
        where: { id: opp.id },
        data: { currentStage, lossReason },
      }),
      prisma.opportunityStageLog.createMany({ data: logsToCreate }),
    ]);

    totalLogs += logsToCreate.length;
  }

  console.log(`   ✓ ${opportunities.length} fırsat güncellendi`);
  console.log(`   ✓ ${totalLogs} aşama geçiş kaydı oluşturuldu`);
  console.log(`   ✓ Olumsuz fırsat: ${olumsuzCount} (%${((olumsuzCount / opportunities.length) * 100).toFixed(1)})`);
  console.log('');
  console.log('✅ OpportunityStageLog yeniden dolduruldu.');
}

main()
  .catch((e) => {
    console.error('Hata:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
