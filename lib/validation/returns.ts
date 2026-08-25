import { z } from "zod";
import { ReturnReason, ReturnStatus, ReturnResolution } from "@prisma/client";

export const ReturnReasonEnum = z.nativeEnum(ReturnReason);
export const ReturnStatusEnum = z.nativeEnum(ReturnStatus);
export const ReturnResolutionEnum = z.nativeEnum(ReturnResolution);

export const createReturnSchema = z.object({
  customerName: z
    .string({ required_error: "Customer name is required" })
    .trim()
    .min(1, "Customer name is required")
    .max(100, "Customer name cannot exceed 100 characters"),
  customerEmail: z
    .string({ required_error: "Customer email is required" })
    .trim()
    .email("Invalid customer email address"),
  customerPhone: z
    .string({ required_error: "Customer phone is required" })
    .trim()
    .min(5, "Customer phone must be at least 5 digits")
    .max(20, "Customer phone cannot exceed 20 characters"),
  orderId: z
    .string({ required_error: "Order ID is required" })
    .trim()
    .min(1, "Order ID is required")
    .max(50, "Order ID cannot exceed 50 characters"),
  itemId: z
    .string({ required_error: "Item ID is required" })
    .trim()
    .min(1, "Item ID is required")
    .max(50, "Item ID cannot exceed 50 characters"),
  quantity: z
    .number({ required_error: "Quantity is required" })
    .int("Quantity must be an integer")
    .min(1, "Quantity must be at least 1")
    .max(1000, "Quantity cannot exceed 1000"),
  reason: ReturnReasonEnum,
});

export const updateReturnSchema = z.object({
  customerName: z
    .string()
    .trim()
    .min(1, "Customer name cannot be empty")
    .max(100, "Customer name cannot exceed 100 characters")
    .optional(),
  customerEmail: z
    .string()
    .trim()
    .email("Invalid customer email address")
    .optional(),
  customerPhone: z
    .string()
    .trim()
    .min(5, "Customer phone must be at least 5 digits")
    .max(20, "Customer phone cannot exceed 20 characters")
    .optional(),
  orderId: z
    .string()
    .trim()
    .min(1, "Order ID cannot be empty")
    .max(50, "Order ID cannot exceed 50 characters")
    .optional(),
  itemId: z
    .string()
    .trim()
    .min(1, "Item ID cannot be empty")
    .max(50, "Item ID cannot exceed 50 characters")
    .optional(),
  quantity: z
    .number()
    .int("Quantity must be an integer")
    .min(1, "Quantity must be at least 1")
    .max(1000, "Quantity cannot exceed 1000")
    .optional(),
  reason: ReturnReasonEnum.optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field must be provided for update" }
);

export const statusTransitionSchema = z.object({
  status: ReturnStatusEnum,
  resolution: ReturnResolutionEnum.nullable().optional(),
  refundAmount: z.number().nullable().optional(),
});

export const createNoteSchema = z.object({
  content: z
    .string({ required_error: "Note content is required" })
    .trim()
    .min(1, "Note content cannot be empty")
    .max(2000, "Note content cannot exceed 2000 characters"),
});

export const queryReturnsSchema = z.object({
  search: z.string().trim().optional(),
  status: ReturnStatusEnum.optional(),
  reason: ReturnReasonEnum.optional(),
  sort: z
    .enum(["createdAt", "updatedAt", "reference", "customerName", "orderId", "status", "reason", "quantity"])
    .default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type CreateReturnInput = z.infer<typeof createReturnSchema>;
export type UpdateReturnInput = z.infer<typeof updateReturnSchema>;
export type StatusTransitionInput = z.infer<typeof statusTransitionSchema>;
export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type QueryReturnsInput = z.infer<typeof queryReturnsSchema>;
