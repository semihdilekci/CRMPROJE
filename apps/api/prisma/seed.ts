import { PrismaClient, Fair } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('Seeding database...');

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

  console.log(`Users seeded: ${admin.name}, ${user1.name}, ${user2.name}`);

  const fairsData = [
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
      name: 'Hannover Messe 2026',
      address: 'Deutsche Messe, Hannover, Germany',
      startDate: new Date('2026-04-20'),
      endDate: new Date('2026-04-24'),
      createdById: admin.id,
    },
    {
      name: 'Automechanika Frankfurt 2026',
      address: 'Messe Frankfurt, Frankfurt am Main, Germany',
      startDate: new Date('2026-09-08'),
      endDate: new Date('2026-09-12'),
      createdById: user1.id,
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
      name: 'Chillventa Nürnberg 2025',
      address: 'NürnbergMesse, Nürnberg, Germany',
      startDate: new Date('2025-10-14'),
      endDate: new Date('2025-10-16'),
      createdById: user2.id,
    },
    {
      name: 'IFH/Intherm 2026',
      address: 'NürnbergMesse, Nürnberg, Germany',
      startDate: new Date('2026-04-08'),
      endDate: new Date('2026-04-11'),
      createdById: user1.id,
    },
    {
      name: 'ACREX India 2026',
      address: 'Bangalore International Exhibition Centre, Bangalore, India',
      startDate: new Date('2026-02-26'),
      endDate: new Date('2026-02-28'),
      createdById: admin.id,
    },
  ];

  const fairs: Fair[] = [];
  for (let i = 0; i < fairsData.length; i++) {
    const data = fairsData[i]!;
    const fair = await prisma.fair.upsert({
      where: { id: `seed-fair-${i + 1}` },
      update: {},
      create: { ...data, id: `seed-fair-${i + 1}` },
    });
    fairs.push(fair);
  }

  console.log(`Fairs seeded: ${fairs.length}`);

  const conversionRates = ['very_high', 'high', 'medium', 'low', 'very_low'];
  const currencies = ['USD', 'EUR', 'TRY', 'GBP'];
  const productPool = [
    'Endüstriyel Pompalar',
    'Vana Sistemleri',
    'Kompresörler',
    'Filtre Üniteleri',
    'Otomasyon Yazılımı',
    'Sensörler & Ölçüm',
    'Boru & Fitting',
    'Isı Eşanjörleri',
    'Proses Ekipmanları',
    'Kontrol Panelleri',
  ];

  for (const name of productPool) {
    await prisma.product.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log(`Products seeded: ${productPool.length}`);

  const customerTemplates = [
    {
      company: 'Atlas Mühendislik A.Ş.',
      name: 'Can Öztürk',
      phone: '+905551234567',
      email: 'can@atlasmuh.com',
    },
    {
      company: 'Meridyen Tesisat Ltd.',
      name: 'Zeynep Arslan',
      phone: '+905559876543',
      email: 'zeynep@meridyen.com.tr',
    },
    {
      company: 'Nordic HVAC Solutions',
      name: 'Erik Lindqvist',
      phone: '+46701234567',
      email: 'erik@nordichvac.se',
    },
    {
      company: 'Ankara Isı Sistemleri',
      name: 'Burak Çelik',
      phone: '+905327654321',
      email: 'burak@ankaraisi.com.tr',
    },
    {
      company: 'GreenTech Industries GmbH',
      name: 'Hans Weber',
      phone: '+491761234567',
      email: 'h.weber@greentech.de',
    },
    {
      company: 'İzmir Soğutma A.Ş.',
      name: 'Selin Yıldız',
      phone: '+905441239876',
      email: 'selin@izmirsoğutma.com',
    },
    {
      company: 'ThermoFlow BV',
      name: 'Jan de Vries',
      phone: '+31612345678',
      email: 'jan@thermoflow.nl',
    },
    {
      company: 'Bosphorus Valve Co.',
      name: 'Emre Aktaş',
      phone: '+905369871234',
      email: 'emre@bosphorusvalve.com',
    },
    {
      company: 'Clima Italia S.r.l.',
      name: 'Marco Rossi',
      phone: '+393481234567',
      email: 'marco@climaitalia.it',
    },
    {
      company: 'Antalya Pompa San.',
      name: 'Derya Koç',
      phone: '+905071236789',
      email: 'derya@antalyapompa.com.tr',
    },
    {
      company: 'EcoHeat Systems Plc',
      name: 'James Clark',
      phone: '+447912345678',
      email: 'j.clark@ecoheat.co.uk',
    },
    {
      company: 'Sakarya Otomasyon',
      name: 'Hakan Şahin',
      phone: '+905531237890',
      email: 'hakan@sakaryaoto.com.tr',
    },
    {
      company: 'PipeMaster AG',
      name: 'Thomas Müller',
      phone: '+41791234567',
      email: 'thomas@pipemaster.ch',
    },
    {
      company: 'Karadeniz HVAC Ltd.',
      name: 'Ayşe Yılmaz',
      phone: '+905421234567',
      email: 'ayse@karadenizhvac.com',
    },
    {
      company: 'FrostLine Oy',
      name: 'Mikko Virtanen',
      phone: '+358401234567',
      email: 'mikko@frostline.fi',
    },
    {
      company: 'Marmara Filtre San.',
      name: 'Oğuz Erdoğan',
      phone: '+905351234567',
      email: 'oguz@marmarafiltre.com.tr',
    },
    {
      company: 'AquaPure Systems',
      name: 'Sarah Johnson',
      phone: '+12125551234',
      email: 'sarah@aquapure.com',
    },
    {
      company: 'Trakya Kazan A.Ş.',
      name: 'Serkan Aydın',
      phone: '+905461239876',
      email: 'serkan@trakyakazan.com.tr',
    },
    {
      company: 'SolTech Energy AB',
      name: 'Anna Svensson',
      phone: '+46731234567',
      email: 'anna@soltech.se',
    },
    {
      company: 'Ege Pompa Sistemleri',
      name: 'Metin Aksoy',
      phone: '+905381234567',
      email: 'metin@egepompa.com.tr',
    },
  ];

  function pickRandom<T>(arr: T[], count: number): T[] {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  let customerCount = 0;
  for (let fi = 0; fi < fairs.length; fi++) {
    const fair = fairs[fi]!;
    const startIdx = (fi * 5) % customerTemplates.length;

    for (let ci = 0; ci < 5; ci++) {
      const tpl = customerTemplates[(startIdx + ci) % customerTemplates.length]!;
      const custId = `seed-cust-${fi + 1}-${ci + 1}`;
      const rate = conversionRates[(fi + ci) % conversionRates.length]!;
      const currency = currencies[(fi + ci) % currencies.length]!;
      const budget = String((fi + ci + 1) * 15000 + ci * 3000);
      const products = pickRandom(productPool, 2 + (ci % 3));

      await prisma.customer.upsert({
        where: { id: custId },
        update: {},
        create: {
          id: custId,
          company: tpl.company,
          name: tpl.name,
          phone: tpl.phone,
          email: tpl.email,
          budgetRaw: budget,
          budgetCurrency: currency,
          conversionRate: rate,
          products,
          fairId: fair.id,
        },
      });
      customerCount++;
    }
  }

  console.log(`Customers seeded: ${customerCount}`);
  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
