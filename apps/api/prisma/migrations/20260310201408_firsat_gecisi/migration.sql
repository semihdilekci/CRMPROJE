-- CreateTable: Opportunity tablosunu oluştur (veri aktarımı ÖNCE yapılacak)
CREATE TABLE "Opportunity" (
    "id" TEXT NOT NULL,
    "budgetRaw" TEXT,
    "budgetCurrency" TEXT,
    "conversionRate" TEXT,
    "products" TEXT[],
    "cardImage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "fairId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,

    CONSTRAINT "Opportunity_pkey" PRIMARY KEY ("id")
);

-- DataTransfer: Mevcut Customer verilerinden Opportunity kayıtları oluştur
INSERT INTO "Opportunity" ("id", "fairId", "customerId", "budgetRaw", "budgetCurrency", "conversionRate", "products", "cardImage", "createdAt", "updatedAt")
SELECT
    gen_random_uuid(),
    "fairId",
    "id",
    "budgetRaw",
    "budgetCurrency",
    "conversionRate",
    "products",
    "cardImage",
    "createdAt",
    NOW()
FROM "Customer"
WHERE "fairId" IS NOT NULL;

-- DropForeignKey: Customer-Fair ilişkisini kaldır
ALTER TABLE "Customer" DROP CONSTRAINT "Customer_fairId_fkey";

-- DropIndex: Artık gerekli olmayan Customer index'leri
DROP INDEX "Customer_conversionRate_idx";
DROP INDEX "Customer_fairId_idx";

-- AlterTable: Customer tablosundan fırsat alanlarını kaldır
ALTER TABLE "Customer" DROP COLUMN "budgetCurrency",
DROP COLUMN "budgetRaw",
DROP COLUMN "cardImage",
DROP COLUMN "conversionRate",
DROP COLUMN "fairId",
DROP COLUMN "products";

-- CreateIndex: Opportunity index'leri
CREATE INDEX "Opportunity_fairId_idx" ON "Opportunity"("fairId");
CREATE INDEX "Opportunity_customerId_idx" ON "Opportunity"("customerId");
CREATE INDEX "Opportunity_conversionRate_idx" ON "Opportunity"("conversionRate");

-- AddForeignKey: Opportunity-Fair ilişkisi
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_fairId_fkey" FOREIGN KEY ("fairId") REFERENCES "Fair"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: Opportunity-Customer ilişkisi
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
