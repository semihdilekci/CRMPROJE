-- AlterTable: Add cardImage to Customer
ALTER TABLE "Customer" ADD COLUMN "cardImage" TEXT;

-- Migrate existing Opportunity.cardImage to Customer
-- For each customer, use the first (most recent) opportunity's cardImage
UPDATE "Customer" c
SET "cardImage" = sub."cardImage"
FROM (
  SELECT DISTINCT ON ("customerId") "customerId", "cardImage"
  FROM "Opportunity"
  WHERE "cardImage" IS NOT NULL
  ORDER BY "customerId", "createdAt" DESC
) sub
WHERE c.id = sub."customerId";

-- AlterTable: Remove cardImage from Opportunity
ALTER TABLE "Opportunity" DROP COLUMN "cardImage";
