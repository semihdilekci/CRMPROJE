/**
 * Mevcut ürün adlarını yeni adlarla değiştirir.
 * Veri silinmez, sadece Product.name ve Opportunity.products güncellenir.
 *
 * Kullanım: cd apps/api && npm run update:product-names
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const NEW_PRODUCT_NAMES = [
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

async function main(): Promise<void> {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: 'asc' },
    select: { id: true, name: true },
  });

  if (products.length === 0) {
    console.log('Ürün bulunamadı.');
    return;
  }

  const updateCount = Math.min(products.length, NEW_PRODUCT_NAMES.length);
  let updated = 0;

  for (let i = 0; i < updateCount; i++) {
    const product = products[i]!;
    const newName = NEW_PRODUCT_NAMES[i]!;

    if (product.name === newName) continue;

    const opportunities = await prisma.opportunity.findMany({
      where: { products: { has: product.name } },
      select: { id: true, products: true },
    });

    await prisma.$transaction([
      prisma.product.update({
        where: { id: product.id },
        data: { name: newName },
      }),
      ...opportunities.map((opp) =>
        prisma.opportunity.update({
          where: { id: opp.id },
          data: {
            products: opp.products.map((p) => (p === product.name ? newName : p)),
          },
        })
      ),
    ]);

    console.log(`   ✓ "${product.name}" → "${newName}"`);
    updated++;
  }

  if (products.length > NEW_PRODUCT_NAMES.length) {
    console.log(
      `   ⚠ ${products.length - NEW_PRODUCT_NAMES.length} ürün eşleşmedi (yeni ad verilmediği için değiştirilmedi).`
    );
  }

  console.log('');
  console.log(`✅ ${updated} ürün adı güncellendi.`);
}

main()
  .catch((e) => {
    console.error('Hata:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
