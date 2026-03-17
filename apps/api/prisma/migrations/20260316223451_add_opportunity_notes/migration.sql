-- CreateTable
CREATE TABLE "OpportunityNote" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "OpportunityNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OpportunityNote_opportunityId_idx" ON "OpportunityNote"("opportunityId");

-- CreateIndex
CREATE INDEX "OpportunityNote_createdById_idx" ON "OpportunityNote"("createdById");

-- AddForeignKey
ALTER TABLE "OpportunityNote" ADD CONSTRAINT "OpportunityNote_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpportunityNote" ADD CONSTRAINT "OpportunityNote_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
