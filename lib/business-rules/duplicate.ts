import { Prisma, ReturnStatus } from "@prisma/client";
import { BusinessRuleError } from "@/lib/errors";

export const LIVE_STATUSES: ReturnStatus[] = [
  ReturnStatus.OPEN,
  ReturnStatus.IN_REVIEW,
  ReturnStatus.APPROVED,
];

/**
 * Enforces Rule 3: One live request per order/item.
 * A customer cannot have two live requests for the same order and item.
 * Live statuses are OPEN, IN_REVIEW, and APPROVED (and not soft-deleted).
 * 
 * Throws BusinessRuleError (409) if a duplicate live request exists.
 */
export async function assertNoDuplicateLiveRequest(
  tx: Prisma.TransactionClient,
  orderId: string,
  itemId: string,
  excludeRequestId?: string
): Promise<void> {
  const existing = await tx.returnRequest.findFirst({
    where: {
      orderId,
      itemId,
      status: { in: LIVE_STATUSES },
      removedAt: null,
      ...(excludeRequestId ? { id: { not: excludeRequestId } } : {}),
    },
    select: {
      id: true,
      reference: true,
      status: true,
      orderId: true,
      itemId: true,
    },
  });

  if (existing) {
    throw new BusinessRuleError(
      `An active return request (${existing.reference}, status: ${existing.status}) already exists for Order '${orderId}' and Item '${itemId}'. Another request cannot be raised until the existing one is REJECTED or COMPLETED.`,
      "DUPLICATE_LIVE_REQUEST",
      409,
      {
        existingRequestId: existing.id,
        existingReference: existing.reference,
        existingStatus: existing.status,
      }
    );
  }
}
