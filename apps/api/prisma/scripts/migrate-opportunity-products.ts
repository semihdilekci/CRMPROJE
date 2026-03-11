/**
 * F32 veri taşıma: Opportunity.products (string[]) → OpportunityProduct tablosu.
 * Her fırsat için products[] içindeki ürün adları Product tablosuyla eşleştirilir,
 * OpportunityProduct kayıtları oluşturulur (quantity: null, unit: 'ton').
 * İdempotent: Zaten OpportunityProduct kaydı varsa atlanır.
 *
 * Kullanım: cd apps/api && npx ts-node -r tsconfig-paths/register prisma/scripts/migrate-opportunity-products.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const opportunities = await prisma.opportunity.findMany({
    where: { products: { isEmpty: false } },
    include: {
      opportunityProducts: { select: { productId: true } },
    },
  });

  let created = 0;
  let skipped = 0;
  const productNameToId = new Map<string, string>();

  for (const opp of opportunities) {
    const existingProductIds = new Set(opp.opportunityProducts.map((op) => op.productId));

    for (const productName of opp.products) {
      if (!productName.trim()) continue;

      let productId = productNameToId.get(productName);
      if (productId === undefined) {
        const product = await prisma.product.findUnique({
          where: { name: productName },
          select: { id: true },
        });
        if (!product) {
          console.warn(`Ürün bulunamadı, atlanıyor: "${productName}" (opportunity ${opp.id})`);
          skipped++;
          continue;
        }
        productId = product.id;
        productNameToId.set(productName, productId);
      }

      if (existingProductIds.has(productId)) continue;

      await prisma.opportunityProduct.create({
        data: {
          opportunityId: opp.id,
          productId,
          quantity: null,
          unit: 'ton',
          note: null,
        },
      });
      existingProductIds.add(productId);
      created++;
    }
  }

  console.log(`OpportunityProduct: ${created} kayıt oluşturuldu, ${skipped} ürün adı eşleşmedi (atlandı).`);
}

main()
  .catch((e) => {
    console.error('Migration error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
