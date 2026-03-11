-- AlterTable
ALTER TABLE "Opportunity" ADD COLUMN     "currentStage" TEXT NOT NULL DEFAULT 'tanisma',
ADD COLUMN     "lossReason" TEXT;

-- CreateTable
CREATE TABLE "OpportunityStageLog" (
    "id" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "note" TEXT,
    "lossReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "opportunityId" TEXT NOT NULL,
    "changedById" TEXT NOT NULL,

    CONSTRAINT "OpportunityStageLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OpportunityStageLog_opportunityId_idx" ON "OpportunityStageLog"("opportunityId");

-- CreateIndex
CREATE INDEX "OpportunityStageLog_changedById_idx" ON "OpportunityStageLog"("changedById");

-- CreateIndex
CREATE INDEX "Opportunity_currentStage_idx" ON "Opportunity"("currentStage");

-- AddForeignKey
ALTER TABLE "OpportunityStageLog" ADD CONSTRAINT "OpportunityStageLog_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpportunityStageLog" ADD CONSTRAINT "OpportunityStageLog_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
