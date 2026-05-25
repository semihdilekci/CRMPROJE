-- AlterTable
ALTER TABLE "CustomerContact" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "SystemSecret" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "ciphertext" TEXT NOT NULL,
    "keyVersion" INTEGER NOT NULL DEFAULT 1,
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,

    CONSTRAINT "SystemSecret_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SystemSecret_key_key" ON "SystemSecret"("key");

-- CreateIndex
CREATE INDEX "SystemSecret_updatedById_idx" ON "SystemSecret"("updatedById");

-- AddForeignKey
ALTER TABLE "SystemSecret" ADD CONSTRAINT "SystemSecret_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
