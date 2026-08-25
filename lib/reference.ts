import { Prisma } from "@prisma/client";

/**
 * Generates an atomic, unique, human-readable reference number
 * in format RET-YYYY-XXXXX (e.g. RET-2026-00001).
 * 
 * Must be executed within a Prisma transaction client for concurrency safety.
 */
export async function generateReturnReference(tx: Prisma.TransactionClient): Promise<string> {
  const currentYear = new Date().getFullYear();
  
  const seq = await tx.referenceSequence.upsert({
    where: { year: currentYear },
    update: { lastValue: { increment: 1 } },
    create: { year: currentYear, lastValue: 1 },
  });

  const paddedNumber = String(seq.lastValue).padStart(5, "0");
  return `RET-${currentYear}-${paddedNumber}`;
}
