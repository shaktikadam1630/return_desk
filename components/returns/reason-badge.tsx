import React from "react";
import { ReturnReason } from "@prisma/client";
import { cn, formatReasonLabel } from "@/lib/utils";
import { AlertTriangle, PackageX, Ruler, FileQuestion, RefreshCw } from "lucide-react";

interface ReasonBadgeProps {
  reason: ReturnReason | string;
  size?: "sm" | "md";
  showIcon?: boolean;
  className?: string;
}

export function ReasonBadge({ reason, size = "md", showIcon = true, className }: ReasonBadgeProps) {
  const getStyle = (r: string) => {
    switch (r) {
      case ReturnReason.DAMAGED:
        return {
          bg: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-300 dark:border-orange-800",
          icon: AlertTriangle,
        };
      case ReturnReason.WRONG_ITEM:
        return {
          bg: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800",
          icon: PackageX,
        };
      case ReturnReason.SIZE_ISSUE:
        return {
          bg: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-300 dark:border-indigo-800",
          icon: Ruler,
        };
      case ReturnReason.NOT_AS_DESCRIBED:
        return {
          bg: "bg-yellow-50 text-yellow-800 border-yellow-200 dark:bg-yellow-950/30 dark:text-yellow-300 dark:border-yellow-800",
          icon: FileQuestion,
        };
      case ReturnReason.CHANGED_MIND:
        return {
          bg: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/30 dark:text-teal-300 dark:border-teal-800",
          icon: RefreshCw,
        };
      default:
        return {
          bg: "bg-zinc-100 text-zinc-700 border-zinc-200",
          icon: AlertTriangle,
        };
    }
  };

  const { bg, icon: Icon } = getStyle(reason);

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border font-medium",
        bg,
        size === "sm" ? "px-2 py-0.5 text-xs gap-1" : "px-2.5 py-1 text-xs gap-1.5",
        className
      )}
    >
      {showIcon && <Icon className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} />}
      <span>{formatReasonLabel(reason)}</span>
    </span>
  );
}
