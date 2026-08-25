import { NextResponse } from "next/server";
import { ZodError } from "zod";

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(message: string, statusCode: number = 400, code: string = "BAD_REQUEST", details?: unknown) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Requested resource was not found") {
    super(message, 404, "NOT_FOUND");
    this.name = "NotFoundError";
  }
}

export class BusinessRuleError extends AppError {
  constructor(message: string, code: string = "BUSINESS_RULE_VIOLATION", statusCode: number = 409, details?: unknown) {
    super(message, statusCode, code, details);
    this.name = "BusinessRuleError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string = "Invalid request payload", details?: unknown) {
    super(message, 400, "VALIDATION_ERROR", details);
    this.name = "ValidationError";
  }
}

/**
 * Transforms any caught error into a standardized machine-readable JSON NextResponse.
 */
export function handleApiError(error: unknown): NextResponse {
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          ...(error.details !== undefined ? { details: error.details } : {}),
        },
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof ZodError) {
    const formattedErrors = error.errors.map((err) => ({
      field: err.path.join("."),
      message: err.message,
    }));

    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: formattedErrors[0]?.message || "Validation failed",
          details: formattedErrors,
        },
      },
      { status: 400 }
    );
  }

  console.error("Unhandled API Error:", error);

  return NextResponse.json(
    {
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred. Please try again later.",
      },
    },
    { status: 500 }
  );
}
