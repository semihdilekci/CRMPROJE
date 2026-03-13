/**
 * Raporlama için anlamlı veri oluşturan seed script.
 * Fuar, fırsat, bütçe, pipeline, satışa dönüşme, ürünler ve tonajlar dahil
 * tüm raporlama metrikleri için zengin veri seti üretir.
 *
 * Çalıştırma: cd apps/api && npx prisma db seed
 */
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

const PIPELINE_STAGES = [
  'tanisma',
  'toplanti',
  'teklif',
  'sozlesme',
  'satisa_donustu',
  'olumsuz',
] as const;

const CONVERSION_RATES = ['very_high', 'high', 'medium', 'low', 'very_low'] as const;
const CURRENCIES = ['USD', 'EUR', 'TRY', 'GBP'] as const;
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

function pickRandomMultiple<T>(arr: readonly T[], min: number, max: number): T[] {
  const count = min + Math.floor(Math.random() * (max - min + 1));
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, arr.length));
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
  console.log('🗑️  Mevcut veriler siliniyor...');

  await prisma.opportunityStageLog.deleteMany();
  await prisma.opportunityProduct.deleteMany();
  await prisma.opportunity.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.fair.deleteMany();
  await prisma.product.deleteMany();
  // User ve Team silinmiyor - mevcut kullanıcılar korunuyor

  console.log('👤 Kullanıcılar oluşturuluyor...');

  const password = await argon2.hash('Test1234!');

  const admin = await prisma.user.upsert({
    where: { email: 'admin@crm.com' },
    update: {},
    create: {
      email: 'admin@crm.com',
      password,
      role: 'admin',
      name: 'Ahmet Yılmaz',
    },
  });

  const user1 = await prisma.user.upsert({
    where: { email: 'elif@crm.com' },
    update: {},
    create: {
      email: 'elif@crm.com',
      password,
      role: 'user',
      name: 'Elif Kaya',
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'mehmet@crm.com' },
    update: {},
    create: {
      email: 'mehmet@crm.com',
      password,
      role: 'user',
      name: 'Mehmet Demir',
    },
  });

  const users = [admin, user1, user2];
  console.log(`   ✓ ${users.length} kullanıcı hazır`);

  // --- ÜRÜNLER ---
  const productNames = [
    'Everwell Gıda Takviyesi',
    'Everwell Force',
    'Oneo - Sakız',
    'Yıldız - Sakız',
    'Yupo - Sakız',
    'Yupo - Jelly',
    'Yupo - Licorice',
    'Kremini - Yumuşak Şeker',
    'Bonbon - Sert Şeker',
    'Yupo - Sert Şeker',
    'Pastil - Sert Şeker Şekersiz',
    'Bonbon - İkramlık',
    'Toffe - İkramlık',
    'Lokumcuk - İkramlık',
  ];

  const products: { id: string; name: string }[] = [];
  for (const name of productNames) {
    const p = await prisma.product.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    products.push(p);
  }
  console.log(`   ✓ ${products.length} ürün`);

  // --- FUARLAR (geçmiş + gelecek, farklı dönemler) ---
  const fairsData = [
    {
      name: 'ISK-SODEX Istanbul 2024',
      address: 'Tüyap Fuar ve Kongre Merkezi, Büyükçekmece, İstanbul',
      startDate: new Date('2024-10-09'),
      endDate: new Date('2024-10-12'),
      createdById: admin.id,
    },
    {
      name: 'WIN Eurasia 2024',
      address: 'Tüyap Fuar ve Kongre Merkezi, Büyükçekmece, İstanbul',
      startDate: new Date('2024-06-12'),
      endDate: new Date('2024-06-15'),
      createdById: admin.id,
    },
    {
      name: 'MOTEK Mediterranean 2024',
      address: 'İstanbul Fuar Merkezi (İFM), Yeşilköy, İstanbul',
      startDate: new Date('2024-09-25'),
      endDate: new Date('2024-09-28'),
      createdById: user1.id,
    },
    {
      name: 'Chillventa Nürnberg 2024',
      address: 'NürnbergMesse, Nürnberg, Germany',
      startDate: new Date('2024-10-15'),
      endDate: new Date('2024-10-17'),
      createdById: user2.id,
    },
    {
      name: 'ISK-SODEX Istanbul 2025',
      address: 'Tüyap Fuar ve Kongre Merkezi, Büyükçekmece, İstanbul',
      startDate: new Date('2025-10-08'),
      endDate: new Date('2025-10-11'),
      createdById: admin.id,
    },
    {
      name: 'WIN Eurasia 2025',
      address: 'Tüyap Fuar ve Kongre Merkezi, Büyükçekmece, İstanbul',
      startDate: new Date('2025-06-12'),
      endDate: new Date('2025-06-15'),
      createdById: admin.id,
    },
    {
      name: 'MOTEK Mediterranean 2025',
      address: 'İstanbul Fuar Merkezi (İFM), Yeşilköy, İstanbul',
      startDate: new Date('2025-09-24'),
      endDate: new Date('2025-09-27'),
      createdById: user1.id,
    },
    {
      name: 'Hannover Messe 2025',
      address: 'Deutsche Messe, Hannover, Germany',
      startDate: new Date('2025-04-21'),
      endDate: new Date('2025-04-25'),
      createdById: admin.id,
    },
    {
      name: 'Chillventa Nürnberg 2025',
      address: 'NürnbergMesse, Nürnberg, Germany',
      startDate: new Date('2025-10-14'),
      endDate: new Date('2025-10-16'),
      createdById: user2.id,
    },
    {
      name: 'Aqua-Therm Moscow 2026',
      address: 'Crocus Expo, Moscow, Russia',
      startDate: new Date('2026-02-10'),
      endDate: new Date('2026-02-13'),
      createdById: user2.id,
    },
    {
      name: 'MCE Expocomfort Milano 2026',
      address: 'Fiera Milano, Rho, Milan, Italy',
      startDate: new Date('2026-03-17'),
      endDate: new Date('2026-03-20'),
      createdById: admin.id,
    },
    {
      name: 'IFH/Intherm 2026',
      address: 'NürnbergMesse, Nürnberg, Germany',
      startDate: new Date('2026-04-08'),
      endDate: new Date('2026-04-11'),
      createdById: user1.id,
    },
  ];

  const fairs = await Promise.all(
    fairsData.map((d) =>
      prisma.fair.create({
        data: d,
      })
    )
  );
  console.log(`   ✓ ${fairs.length} fuar`);

  // --- MÜŞTERİLER ---
  const customerTemplates = [
    { company: 'Atlas Mühendislik A.Ş.', name: 'Can Öztürk', phone: '+905551234567', email: 'can@atlasmuh.com' },
    { company: 'Meridyen Tesisat Ltd.', name: 'Zeynep Arslan', phone: '+905559876543', email: 'zeynep@meridyen.com.tr' },
    { company: 'Nordic HVAC Solutions', name: 'Erik Lindqvist', phone: '+46701234567', email: 'erik@nordichvac.se' },
    { company: 'Ankara Isı Sistemleri', name: 'Burak Çelik', phone: '+905327654321', email: 'burak@ankaraisi.com.tr' },
    { company: 'GreenTech Industries GmbH', name: 'Hans Weber', phone: '+491761234567', email: 'h.weber@greentech.de' },
    { company: 'İzmir Soğutma A.Ş.', name: 'Selin Yıldız', phone: '+905441239876', email: 'selin@izmirsoğutma.com' },
    { company: 'ThermoFlow BV', name: 'Jan de Vries', phone: '+31612345678', email: 'jan@thermoflow.nl' },
    { company: 'Bosphorus Valve Co.', name: 'Emre Aktaş', phone: '+905369871234', email: 'emre@bosphorusvalve.com' },
    { company: 'Clima Italia S.r.l.', name: 'Marco Rossi', phone: '+393481234567', email: 'marco@climaitalia.it' },
    { company: 'Antalya Pompa San.', name: 'Derya Koç', phone: '+905071236789', email: 'derya@antalyapompa.com.tr' },
    { company: 'EcoHeat Systems Plc', name: 'James Clark', phone: '+447912345678', email: 'j.clark@ecoheat.co.uk' },
    { company: 'Sakarya Otomasyon', name: 'Hakan Şahin', phone: '+905531237890', email: 'hakan@sakaryaoto.com.tr' },
    { company: 'PipeMaster AG', name: 'Thomas Müller', phone: '+41791234567', email: 'thomas@pipemaster.ch' },
    { company: 'Karadeniz HVAC Ltd.', name: 'Ayşe Yılmaz', phone: '+905421234567', email: 'ayse@karadenizhvac.com' },
    { company: 'FrostLine Oy', name: 'Mikko Virtanen', phone: '+358401234567', email: 'mikko@frostline.fi' },
    { company: 'Marmara Filtre San.', name: 'Oğuz Erdoğan', phone: '+905351234567', email: 'oguz@marmarafiltre.com.tr' },
    { company: 'AquaPure Systems', name: 'Sarah Johnson', phone: '+12125551234', email: 'sarah@aquapure.com' },
    { company: 'Trakya Kazan A.Ş.', name: 'Serkan Aydın', phone: '+905461239876', email: 'serkan@trakyakazan.com.tr' },
    { company: 'SolTech Energy AB', name: 'Anna Svensson', phone: '+46731234567', email: 'anna@soltech.se' },
    { company: 'Ege Pompa Sistemleri', name: 'Metin Aksoy', phone: '+905381234567', email: 'metin@egepompa.com.tr' },
    { company: 'Delta Klima A.Ş.', name: 'Fatma Korkmaz', phone: '+905321234567', email: 'fatma@deltaklima.com.tr' },
    { company: 'RusKlima LLC', name: 'Ivan Petrov', phone: '+74951234567', email: 'ivan@rusklima.ru' },
    { company: 'Gulf HVAC WLL', name: 'Omar Al-Hassan', phone: '+97312345678', email: 'omar@gulfhvac.bh' },
    { company: 'Polska Chlodnictwo', name: 'Katarzyna Nowak', phone: '+48123456789', email: 'k.nowak@polskachlod.pl' },
    { company: 'Mediterranean Cooling', name: 'Nikos Papadopoulos', phone: '+302101234567', email: 'nikos@medcool.gr' },
  ];

  const customers = await Promise.all(
    customerTemplates.map((t) =>
      prisma.customer.create({
        data: t,
      })
    )
  );
  console.log(`   ✓ ${customers.length} müşteri`);

  // --- FIRSATLAR (raporlama için zengin dağılım) ---
  // Pipeline dağılımı: tanisma, toplanti, teklif, sozlesme, satisa_donustu, olumsuz
  const stageDistribution: Record<string, number> = {
    tanisma: 35,
    toplanti: 40,
    teklif: 30,
    sozlesme: 20,
    satisa_donustu: 45,
    olumsuz: 25,
  };

  const budgetRanges: Record<string, [number, number]> = {
    USD: [25000, 850000],
    EUR: [22000, 750000],
    TRY: [800000, 28000000],
    GBP: [20000, 650000],
  };

  let oppCount = 0;
  const stageLogsToCreate: Array<{
    opportunityId: string;
    stage: string;
    note: string | null;
    lossReason: string | null;
    createdAt: Date;
    changedById: string;
  }> = [];

  for (const stage of PIPELINE_STAGES) {
    const count = stageDistribution[stage] ?? 15;
    for (let i = 0; i < count; i++) {
      const fair = pickRandom(fairs);
      const customer = pickRandom(customers);
      const currency = pickRandom(CURRENCIES);
      const [minB, maxB] = budgetRanges[currency] ?? [10000, 500000];
      const budgetRaw = String(randomBetween(minB, maxB));
      const conversionRate = pickRandom(CONVERSION_RATES);
      const selectedProducts = pickRandomMultiple(
        products,
        1,
        4
      );
      const productNamesForOpp = selectedProducts.map((p) => p.name);

      const opp = await prisma.opportunity.create({
        data: {
          fairId: fair.id,
          customerId: customer.id,
          budgetRaw,
          budgetCurrency: currency,
          conversionRate,
          products: productNamesForOpp,
          currentStage: stage,
          lossReason: stage === 'olumsuz' ? pickRandom(LOSS_REASONS) : null,
        },
      });

      // OpportunityProduct - tonajlar
      for (const prod of selectedProducts) {
        const quantity = Math.round((Math.random() * 95 + 5) * 10) / 10; // 5-100 ton
        await prisma.opportunityProduct.create({
          data: {
            opportunityId: opp.id,
            productId: prod.id,
            quantity,
            unit: 'ton',
            note: quantity > 50 ? 'Büyük sipariş - öncelikli' : null,
          },
        });
      }

      // Stage log - fırsatın geçmişi
      const baseDate = new Date(fair.startDate);
      const logDate = addDays(baseDate, randomBetween(0, 60));
      stageLogsToCreate.push({
        opportunityId: opp.id,
        stage,
        note: stage === 'olumsuz' ? 'Müşteri ile anlaşılamadı.' : `Aşama güncellendi: ${stage}`,
        lossReason: stage === 'olumsuz' ? opp.lossReason : null,
        createdAt: logDate,
        changedById: pickRandom(users).id,
      });

      oppCount++;
    }
  }

  // Stage log'ları ekle (OpportunityStageLog changedById User'a bağlı)
  for (const log of stageLogsToCreate) {
    await prisma.opportunityStageLog.create({
      data: log,
    });
  }

  console.log(`   ✓ ${oppCount} fırsat (pipeline dağılımlı)`);
  console.log(`   ✓ ${stageLogsToCreate.length} aşama geçiş kaydı`);
  console.log('');
  console.log('✅ Raporlama için anlamlı veri seti oluşturuldu.');
  console.log('');
  console.log('Özet:');
  console.log(`   - ${fairs.length} fuar (geçmiş + gelecek)`);
  console.log(`   - ${customers.length} müşteri`);
  console.log(`   - ${oppCount} fırsat`);
  console.log(`   - Pipeline: tanışma, toplantı, teklif, sözleşme, satışa dönüşme, olumsuz`);
  console.log(`   - Bütçe: USD, EUR, TRY, GBP`);
  console.log(`   - Dönüşüm oranları: very_high → very_low`);
  console.log(`   - Ürün tonajları (OpportunityProduct)`);
}

main()
  .catch((e) => {
    console.error('Seed hatası:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
