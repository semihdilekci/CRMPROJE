-- ============================================================
-- Migration: musteri_temsilci
-- Adds CustomerContact model, Opportunity.contactId field,
-- and performs data migration from old Customer columns.
-- ============================================================

-- Step 1: Create CustomerContact table
CREATE TABLE "CustomerContact" (
  "id"          TEXT NOT NULL,
  "customerId"  TEXT NOT NULL,
  "name"        TEXT NOT NULL,
  "phone"       TEXT,
  "email"       TEXT,
  "cardImage"   TEXT,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);

CREATE INDEX "CustomerContact_customerId_idx" ON "CustomerContact"("customerId");
CREATE INDEX "CustomerContact_email_idx"      ON "CustomerContact"("email");

ALTER TABLE "CustomerContact"
  ADD CONSTRAINT "CustomerContact_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES "Customer"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 2: Add contactId column to Opportunity (nullable)
ALTER TABLE "Opportunity" ADD COLUMN "contactId" TEXT;
CREATE INDEX "Opportunity_contactId_idx" ON "Opportunity"("contactId");

-- Step 3: Data migration - create one CustomerContact per Customer
-- (Each existing Customer row produces exactly one CustomerContact)
INSERT INTO "CustomerContact" ("id", "customerId", "name", "phone", "email", "cardImage", "createdAt", "updatedAt")
SELECT
  'cnt_' || replace(gen_random_uuid()::text, '-', ''),
  c."id",
  c."name",
  c."phone",
  c."email",
  c."cardImage",
  NOW(),
  NOW()
FROM "Customer" c;

-- Step 4: Assign Opportunity.contactId to the newly created contacts
UPDATE "Opportunity" o
SET "contactId" = cc."id"
FROM "CustomerContact" cc
WHERE cc."customerId" = o."customerId";

-- Step 5: Add foreign key constraint on Opportunity.contactId (SET NULL on delete)
ALTER TABLE "Opportunity"
  ADD CONSTRAINT "Opportunity_contactId_fkey"
  FOREIGN KEY ("contactId") REFERENCES "CustomerContact"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Step 6: Drop obsolete columns from Customer
ALTER TABLE "Customer" DROP COLUMN "name";
ALTER TABLE "Customer" DROP COLUMN "phone";
ALTER TABLE "Customer" DROP COLUMN "email";
ALTER TABLE "Customer" DROP COLUMN "cardImage";
