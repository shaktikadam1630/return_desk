import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateReturnSchema } from "@/lib/validation/returns";
import { assertRequestNotLocked } from "@/lib/business-rules/locking";
import { assertCanRemoveRequest } from "@/lib/business-rules/removal";
import { assertNoDuplicateLiveRequest } from "@/lib/business-rules/duplicate";
import { handleApiError, NotFoundError } from "@/lib/errors";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/returns/:id
 * Fetches a single return request along with its chronological notes.
 * Returns 404 if the request does not exist or has been soft-deleted.
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const returnRequest = await prisma.returnRequest.findFirst({
      where: {
        OR: [{ id }, { reference: id }],
        removedAt: null, // Exclude soft-deleted
      },
      include: {
        notes: {
          orderBy: {
            createdAt: "asc", // Notes must be in chronological order
          },
        },
      },
    });

    if (!returnRequest) {
      throw new NotFoundError(`Return request '${id}' not found or has been removed.`);
    }

    return NextResponse.json({ data: returnRequest });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/returns/:id
 * Updates customer and item details for an active request.
 * Enforces Rule 4 (Locked once decided) and Rule 3 (Duplicate live request check).
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const json = await request.json();
    const body = updateReturnSchema.parse(json);

    const updatedRequest = await prisma.$transaction(async (tx) => {
      // Find active request
      const existing = await tx.returnRequest.findFirst({
        where: {
          OR: [{ id }, { reference: id }],
          removedAt: null,
        },
      });

      if (!existing) {
        throw new NotFoundError(`Return request '${id}' not found or has been removed.`);
      }

      // Rule 4: Check if request is locked after decision
      assertRequestNotLocked(existing.status);

      const targetOrderId = body.orderId ?? existing.orderId;
      const targetItemId = body.itemId ?? existing.itemId;

      // If orderId or itemId changed, check Rule 3 against other live requests
      if (body.orderId !== undefined || body.itemId !== undefined) {
        await assertNoDuplicateLiveRequest(tx, targetOrderId, targetItemId, existing.id);
      }

      // Perform update on permitted fields
      return await tx.returnRequest.update({
        where: { id: existing.id },
        data: {
          ...(body.customerName !== undefined ? { customerName: body.customerName } : {}),
          ...(body.customerEmail !== undefined ? { customerEmail: body.customerEmail } : {}),
          ...(body.customerPhone !== undefined ? { customerPhone: body.customerPhone } : {}),
          ...(body.orderId !== undefined ? { orderId: body.orderId } : {}),
          ...(body.itemId !== undefined ? { itemId: body.itemId } : {}),
          ...(body.quantity !== undefined ? { quantity: body.quantity } : {}),
          ...(body.reason !== undefined ? { reason: body.reason } : {}),
        },
      });
    });

    return NextResponse.json({ data: updatedRequest });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/returns/:id
 * Soft deletes a return request by setting removedAt = now().
 * Never physically deletes the record from the database.
 * Enforces Rule 5 (Only OPEN or REJECTED requests may be removed).
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.returnRequest.findFirst({
        where: {
          OR: [{ id }, { reference: id }],
          removedAt: null,
        },
      });

      if (!existing) {
        throw new NotFoundError(`Return request '${id}' not found or has already been removed.`);
      }

      // Rule 5: Check soft-deletion eligibility
      assertCanRemoveRequest(existing.status);

      // Perform soft deletion
      return await tx.returnRequest.update({
        where: { id: existing.id },
        data: {
          removedAt: new Date(),
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: `Return request ${result.reference} has been removed from the desk.`,
      data: {
        id: result.id,
        reference: result.reference,
        removedAt: result.removedAt,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
