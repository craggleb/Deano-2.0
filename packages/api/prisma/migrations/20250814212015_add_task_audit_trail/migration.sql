-- CreateTable
CREATE TABLE "task_audits" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "fieldName" VARCHAR(50) NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "changedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT "task_audits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "task_audits_taskId_idx" ON "task_audits"("taskId");

-- CreateIndex
CREATE INDEX "task_audits_fieldName_idx" ON "task_audits"("fieldName");

-- CreateIndex
CREATE INDEX "task_audits_changedAt_idx" ON "task_audits"("changedAt");

-- AddForeignKey
ALTER TABLE "task_audits" ADD CONSTRAINT "task_audits_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
