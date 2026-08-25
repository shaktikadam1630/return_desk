import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createReturnSchema, queryReturnsSchema } from "@/lib/validation/returns";
import { generateReturnReference } from "@/lib/reference";
import { assertNoDuplicateLiveRequest } from "@/lib/business-rules/duplicate";
import { handleApiError } from "@/lib/errors";
import { Prisma } from "@prisma/client";

/**
 * GET /api/returns
 * Fetches paginated, sorted, filtered, and searched return requests directly via PostgreSQL queries.
 * Soft-deleted requests (removedAt != null) are strictly excluded.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const rawParams = {
      search: searchParams.get("search") || undefined,
      status: searchParams.get("status") || undefined,
      reason: searchParams.get("reason") || undefined,
      sort: searchParams.get("sort") || "createdAt",
      order: searchParams.get("order") || "desc",
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "10",
    };

    const validatedQuery = queryReturnsSchema.parse(rawParams);
    const { search, status, reason, sort, order, page, limit } = validatedQuery;

    const skip = (page - 1) * limit;

    // Construct Prisma where clause
    const where: Prisma.ReturnRequestWhereInput = {
      removedAt: null, // Always exclude soft-deleted records
    };

    if (status) {
      where.status = status;
    }

    if (reason) {
      where.reason = reason;
    }

    if (search && search.trim() !== "") {
      const searchTerm = search.trim();
      where.OR = [
        { reference: { contains: searchTerm, mode: "insensitive" } },
        { customerName: { contains: searchTerm, mode: "insensitive" } },
        { customerEmail: { contains: searchTerm, mode: "insensitive" } },
        { orderId: { contains: searchTerm, mode: "insensitive" } },
        { itemId: { contains: searchTerm, mode: "insensitive" } },
      ];
    }

    // Execute query and total count in parallel
    const [data, total] = await prisma.$transaction([
      prisma.returnRequest.findMany({
        where,
        orderBy: {
          [sort]: order,
        },
        skip,
        take: limit,
        include: {
          _count: {
            select: { notes: true },
          },
        },
      }),
      prisma.returnRequest.count({ where }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/returns
 * Creates a new return request with a server-generated human-readable reference.
 * Enforces Rule 3 (no duplicate live request for same orderId + itemId).
 */
export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const body = createReturnSchema.parse(json);

    const newRequest = await prisma.$transaction(async (tx) => {
      // Rule 3: Enforce single live request per order/item
      await assertNoDuplicateLiveRequest(tx, body.orderId, body.itemId);

      // Generate server-side unique reference
      const reference = await generateReturnReference(tx);

      // Create return request in OPEN status
      return await tx.returnRequest.create({
        data: {
          reference,
          customerName: body.customerName,
          customerEmail: body.customerEmail,
          customerPhone: body.customerPhone,
          orderId: body.orderId,
          itemId: body.itemId,
          quantity: body.quantity,
          reason: body.reason,
        },
      });
    });

    return NextResponse.json({ data: newRequest }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
