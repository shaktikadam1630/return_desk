import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined) return "$0.00";
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(num);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

export function formatReasonLabel(reason: string): string {
  const map: Record<string, string> = {
    DAMAGED: "Damaged",
    WRONG_ITEM: "Wrong Item",
    SIZE_ISSUE: "Size Issue",
    NOT_AS_DESCRIBED: "Not As Described",
    CHANGED_MIND: "Changed Mind",
  };
  return map[reason] || reason;
}

export function formatStatusLabel(status: string): string {
  const map: Record<string, string> = {
    OPEN: "Open",
    IN_REVIEW: "In Review",
    APPROVED: "Approved",
    REJECTED: "Rejected",
    COMPLETED: "Completed",
  };
  return map[status] || status;
}

export function formatResolutionLabel(resolution: string | null | undefined): string {
  if (!resolution) return "—";
  const map: Record<string, string> = {
    REFUND: "Refund",
    REPLACEMENT: "Replacement",
    STORE_CREDIT: "Store Credit",
  };
  return map[resolution] || resolution;
}
