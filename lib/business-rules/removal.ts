import { ReturnStatus } from "@prisma/client";
import { BusinessRuleError } from "@/lib/errors";

export const REMOVABLE_STATUSES: ReturnStatus[] = [
  ReturnStatus.OPEN,
  ReturnStatus.REJECTED,
];

/**
 * Enforces Rule 5: Removal (Soft delete eligibility).
 * Only requests in OPEN or REJECTED status may be removed from the desk.
 * Requests in IN_REVIEW, APPROVED, or COMPLETED status cannot be removed.
 * 
 * Throws BusinessRuleError (409) if the request status is not removable.
 */
export function assertCanRemoveRequest(status: ReturnStatus): void {
  if (!REMOVABLE_STATUSES.includes(status)) {
    throw new BusinessRuleError(
      `Cannot remove request. Only requests in OPEN or REJECTED status may be removed. Current status is '${status}'.`,
      "CANNOT_REMOVE_REQUEST",
      409,
      { currentStatus: status, allowedStatuses: REMOVABLE_STATUSES }
    );
  }
}
