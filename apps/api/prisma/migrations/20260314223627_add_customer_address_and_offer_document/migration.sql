-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "address" TEXT;

-- CreateTable
CREATE TABLE "OpportunityOfferDocument" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "content" BYTEA NOT NULL,
    "format" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OpportunityOfferDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OpportunityOfferDocument_opportunityId_key" ON "OpportunityOfferDocument"("opportunityId");

-- CreateIndex
CREATE INDEX "OpportunityOfferDocument_opportunityId_idx" ON "OpportunityOfferDocument"("opportunityId");

-- AddForeignKey
ALTER TABLE "OpportunityOfferDocument" ADD CONSTRAINT "OpportunityOfferDocument_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
