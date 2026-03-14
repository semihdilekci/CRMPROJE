/**
 * admin@crm.com şifresini Test1234! olarak sıfırlar.
 * Çalıştırma: cd apps/api && npx ts-node -r tsconfig-paths/register prisma/scripts/reset-admin-password.ts
 */
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const password = await argon2.hash('Test1234!');
  const updated = await prisma.user.updateMany({
    where: { email: 'admin@crm.com' },
    data: { password },
  });
  console.log(updated.count > 0 ? '✅ admin@crm.com şifresi Test1234! olarak güncellendi.' : '⚠️ admin@crm.com bulunamadı.');
}

main()
  .catch((e) => {
    console.error('Hata:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
