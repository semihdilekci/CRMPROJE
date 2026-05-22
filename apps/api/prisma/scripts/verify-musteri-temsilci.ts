import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verify(): Promise<void> {
  console.log('Müşteri/Temsilci migration doğrulama başlıyor...\n');

  const customerCount = await prisma.customer.count();
  const contactCount = await prisma.customerContact.count();
  const opportunityNullContact = await prisma.opportunity.count({
    where: { contactId: null },
  });

  console.log(`Müşteri (firma) sayısı      : ${customerCount}`);
  console.log(`Temsilci sayısı             : ${contactCount}`);
  console.log(`contactId=null fırsat sayısı: ${opportunityNullContact}`);

  const errors: string[] = [];

  if (contactCount < customerCount) {
    errors.push(
      `HATA: Temsilci sayısı (${contactCount}) müşteri sayısından (${customerCount}) az!`
    );
  }

  if (opportunityNullContact > 0) {
    errors.push(
      `HATA: ${opportunityNullContact} fırsatın contactId'si NULL — beklenen: 0`
    );
  }

  if (errors.length > 0) {
    console.error('\n' + errors.join('\n'));
    process.exit(1);
  }

  console.log('\n✓ Doğrulama başarılı — migration beklenen şekilde tamamlandı.');
}

verify()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
