-- CreateEnum
CREATE TYPE "RecurrenceType" AS ENUM ('Daily', 'Weekly', 'Monthly', 'Yearly', 'Custom');

-- AlterTable
ALTER TABLE "tasks" ADD COLUMN "isRecurring" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "recurrencePattern" TEXT,
ADD COLUMN "nextRecurrenceDate" TIMESTAMPTZ,
ADD COLUMN "originalTaskId" TEXT;

-- CreateIndex
CREATE INDEX "tasks_isRecurring_idx" ON "tasks"("isRecurring");
CREATE INDEX "tasks_nextRecurrenceDate_idx" ON "tasks"("nextRecurrenceDate");
CREATE INDEX "tasks_originalTaskId_idx" ON "tasks"("originalTaskId");
