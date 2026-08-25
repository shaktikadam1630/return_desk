import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { statusTransitionSchema } from "@/lib/validation/returns";
import { validateStatusTransition } from "@/lib/business-rules/lifecycle";
import { validateApprovalResolution } from "@/lib/business-rules/approval";
import { handleApiError, NotFoundError } from "@/lib/errors";
import { ReturnStatus, Prisma } from "@prisma/client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/returns/:id/status
 * Handles state machine transitions for return requests.
 * Enforces Rule 1 (Lifecycle Transitions) and Rule 2 (Approval Requirements).
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const json = await request.json();
    const body = statusTransitionSchema.parse(json);

    const updated = await prisma.$transaction(async (tx) => {
      const existing = await tx.returnRequest.findFirst({
        where: {
          OR: [{ id }, { reference: id }],
          removedAt: null,
        },
      });

      if (!existing) {
        throw new NotFoundError(`Return request '${id}' not found or has been removed.`);
      }

      // Rule 1: Validate allowed lifecycle transition
      validateStatusTransition(existing.status, body.status);

      const updateData: Prisma.ReturnRequestUpdateInput = {
        status: body.status,
      };

      // Rule 2: If moving to APPROVED, validate and set resolution and refund amount
      if (body.status === ReturnStatus.APPROVED) {
        const { resolution, refundAmount } = validateApprovalResolution(
          body.resolution,
          body.refundAmount
        );

        updateData.resolution = resolution;
        updateData.refundAmount = refundAmount;
      }

      return await tx.returnRequest.update({
        where: { id: existing.id },
        data: updateData,
      });
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
