import React from "react";
import { ReturnStatus } from "@prisma/client";
import { cn, formatStatusLabel } from "@/lib/utils";
import { Clock, Search, CheckCircle, XCircle, CheckCheck } from "lucide-react";

interface StatusBadgeProps {
  status: ReturnStatus | string;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  className?: string;
}

export function StatusBadge({ status, size = "md", showIcon = true, className }: StatusBadgeProps) {
  const getBadgeStyle = (st: string) => {
    switch (st) {
      case ReturnStatus.OPEN:
        return {
          bg: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
          icon: Clock,
        };
      case ReturnStatus.IN_REVIEW:
        return {
          bg: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
          icon: Search,
        };
      case ReturnStatus.APPROVED:
        return {
          bg: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
          icon: CheckCircle,
        };
      case ReturnStatus.COMPLETED:
        return {
          bg: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800",
          icon: CheckCheck,
        };
      case ReturnStatus.REJECTED:
        return {
          bg: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
          icon: XCircle,
        };
      default:
        return {
          bg: "bg-zinc-100 text-zinc-700 border-zinc-200",
          icon: Clock,
        };
    }
  };

  const { bg, icon: Icon } = getBadgeStyle(status);

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs gap-1",
    md: "px-2.5 py-1 text-xs gap-1.5 font-medium",
    lg: "px-3 py-1.5 text-sm gap-2 font-semibold",
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-3.5 h-3.5",
    lg: "w-4 h-4",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border shadow-xs tracking-tight",
        bg,
        sizeClasses[size],
        className
      )}
    >
      {showIcon && <Icon className={cn("shrink-0", iconSizes[size])} />}
      <span>{formatStatusLabel(status)}</span>
    </span>
  );
}
