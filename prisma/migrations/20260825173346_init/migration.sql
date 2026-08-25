-- CreateEnum
CREATE TYPE "ReturnReason" AS ENUM ('DAMAGED', 'WRONG_ITEM', 'SIZE_ISSUE', 'NOT_AS_DESCRIBED', 'CHANGED_MIND');

-- CreateEnum
CREATE TYPE "ReturnStatus" AS ENUM ('OPEN', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ReturnResolution" AS ENUM ('REFUND', 'REPLACEMENT', 'STORE_CREDIT');

-- CreateTable
CREATE TABLE "ReturnRequest" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reason" "ReturnReason" NOT NULL,
    "status" "ReturnStatus" NOT NULL DEFAULT 'OPEN',
    "resolution" "ReturnResolution",
    "refundAmount" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "removedAt" TIMESTAMP(3),

    CONSTRAINT "ReturnRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Note" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferenceSequence" (
    "year" INTEGER NOT NULL,
    "lastValue" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ReferenceSequence_pkey" PRIMARY KEY ("year")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReturnRequest_reference_key" ON "ReturnRequest"("reference");

-- CreateIndex
CREATE INDEX "ReturnRequest_status_removedAt_idx" ON "ReturnRequest"("status", "removedAt");

-- CreateIndex
CREATE INDEX "ReturnRequest_orderId_itemId_idx" ON "ReturnRequest"("orderId", "itemId");

-- CreateIndex
CREATE INDEX "ReturnRequest_createdAt_idx" ON "ReturnRequest"("createdAt");

-- CreateIndex
CREATE INDEX "ReturnRequest_customerEmail_idx" ON "ReturnRequest"("customerEmail");

-- CreateIndex
CREATE INDEX "ReturnRequest_customerName_idx" ON "ReturnRequest"("customerName");

-- CreateIndex
CREATE INDEX "ReturnRequest_reference_idx" ON "ReturnRequest"("reference");

-- CreateIndex
CREATE INDEX "ReturnRequest_reason_idx" ON "ReturnRequest"("reason");

-- CreateIndex
CREATE INDEX "Note_requestId_createdAt_idx" ON "Note"("requestId", "createdAt");

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "ReturnRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
