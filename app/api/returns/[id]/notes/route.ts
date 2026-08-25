import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createNoteSchema } from "@/lib/validation/returns";
import { handleApiError, NotFoundError } from "@/lib/errors";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/returns/:id/notes
 * Appends a new immutable note to a return request.
 * Notes can be added at any point in the request lifecycle.
 * Notes cannot be edited or deleted.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const json = await request.json();
    const body = createNoteSchema.parse(json);

    // Verify request exists and is not soft-deleted
    const returnRequest = await prisma.returnRequest.findFirst({
      where: {
        OR: [{ id }, { reference: id }],
        removedAt: null,
      },
      select: { id: true },
    });

    if (!returnRequest) {
      throw new NotFoundError(`Return request '${id}' not found or has been removed.`);
    }

    const note = await prisma.note.create({
      data: {
        requestId: returnRequest.id,
        content: body.content,
      },
    });

    return NextResponse.json({ data: note }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
