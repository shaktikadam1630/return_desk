import { ReturnResolution } from "@prisma/client";
import { BusinessRuleError } from "@/lib/errors";

export interface ValidatedApprovalResolution {
  resolution: ReturnResolution;
  refundAmount: number | null;
}

/**
 * Enforces Rule 2: Approval requires resolution.
 * - Resolution is required (REFUND, REPLACEMENT, STORE_CREDIT).
 * - If REFUND: refundAmount is required and must be > 0.
 * - If REPLACEMENT or STORE_CREDIT: refundAmount must be null / absent.
 */
export function validateApprovalResolution(
  resolution?: ReturnResolution | null,
  refundAmount?: number | null
): ValidatedApprovalResolution {
  if (!resolution) {
    throw new BusinessRuleError(
      "A resolution (REFUND, REPLACEMENT, or STORE_CREDIT) is required to approve a return request.",
      "RESOLUTION_REQUIRED"
    );
  }

  if (resolution === ReturnResolution.REFUND) {
    if (refundAmount === undefined || refundAmount === null) {
      throw new BusinessRuleError(
        "A refund amount is required when resolution is REFUND.",
        "REFUND_AMOUNT_REQUIRED"
      );
    }

    if (typeof refundAmount !== "number" || isNaN(refundAmount) || refundAmount <= 0) {
      throw new BusinessRuleError(
        "Refund amount must be a valid number greater than 0.",
        "INVALID_REFUND_AMOUNT"
      );
    }

    // Round to 2 decimal places
    const cleanAmount = Math.round(refundAmount * 100) / 100;
    return {
      resolution: ReturnResolution.REFUND,
      refundAmount: cleanAmount,
    };
  }

  // REPLACEMENT or STORE_CREDIT
  if (refundAmount !== undefined && refundAmount !== null && refundAmount !== 0) {
    throw new BusinessRuleError(
      `Refund amount must not be specified when resolution is '${resolution}'.`,
      "REFUND_AMOUNT_NOT_ALLOWED"
    );
  }

  return {
    resolution,
    refundAmount: null,
  };
}
