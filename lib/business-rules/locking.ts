import { ReturnStatus } from "@prisma/client";
import { BusinessRuleError } from "@/lib/errors";

export const DECIDED_STATUSES: ReturnStatus[] = [
  ReturnStatus.APPROVED,
  ReturnStatus.REJECTED,
  ReturnStatus.COMPLETED,
];

/**
 * Enforces Rule 4: Locked once decided.
 * Once a request reaches APPROVED, REJECTED, or COMPLETED, its customer and item details cannot be edited.
 * 
 * Throws BusinessRuleError (409) if the request is locked.
 */
export function assertRequestNotLocked(status: ReturnStatus): void {
  if (DECIDED_STATUSES.includes(status)) {
    throw new BusinessRuleError(
      `Request details are locked and cannot be edited because the request is in '${status}' status. Only requests in OPEN or IN_REVIEW status can be edited.`,
      "REQUEST_LOCKED",
      409,
      { currentStatus: status }
    );
  }
}
