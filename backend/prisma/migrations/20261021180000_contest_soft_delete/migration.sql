-- AlterTable
ALTER TABLE "contests" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "contests_deletedAt_idx" ON "contests"("deletedAt");
