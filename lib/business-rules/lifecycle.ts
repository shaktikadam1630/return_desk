import { ReturnStatus } from "@prisma/client";
import { BusinessRuleError } from "@/lib/errors";

/**
 * Allowed status transitions map:
 * OPEN -> IN_REVIEW
 * IN_REVIEW -> APPROVED | REJECTED
 * APPROVED -> COMPLETED
 * REJECTED -> none (terminal)
 * COMPLETED -> none (terminal)
 */
export const ALLOWED_TRANSITIONS: Record<ReturnStatus, readonly ReturnStatus[]> = {
  [ReturnStatus.OPEN]: [ReturnStatus.IN_REVIEW],
  [ReturnStatus.IN_REVIEW]: [ReturnStatus.APPROVED, ReturnStatus.REJECTED],
  [ReturnStatus.APPROVED]: [ReturnStatus.COMPLETED],
  [ReturnStatus.REJECTED]: [],
  [ReturnStatus.COMPLETED]: [],
};

/**
 * Returns the list of valid next statuses for a given status.
 */
export function getAllowedTransitions(currentStatus: ReturnStatus): readonly ReturnStatus[] {
  return ALLOWED_TRANSITIONS[currentStatus] || [];
}

/**
 * Validates whether moving from currentStatus to nextStatus is allowed according to Rule 1.
 * Throws BusinessRuleError (409) if the transition is illegal.
 */
export function validateStatusTransition(currentStatus: ReturnStatus, nextStatus: ReturnStatus): void {
  if (currentStatus === nextStatus) {
    throw new BusinessRuleError(
      `Request is already in status '${currentStatus}'.`,
      "NO_STATUS_CHANGE"
    );
  }

  const allowed = ALLOWED_TRANSITIONS[currentStatus];
  if (!allowed || !allowed.includes(nextStatus)) {
    if (currentStatus === ReturnStatus.REJECTED || currentStatus === ReturnStatus.COMPLETED) {
      throw new BusinessRuleError(
        `Cannot change status. '${currentStatus}' is a final state and cannot be modified.`,
        "TERMINAL_STATE_LOCKED"
      );
    }

    const allowedStr = allowed.length > 0 ? allowed.join(", ") : "none";
    throw new BusinessRuleError(
      `Invalid status transition from '${currentStatus}' to '${nextStatus}'. Allowed next status: [${allowedStr}].`,
      "INVALID_STATUS_TRANSITION"
    );
  }
}
