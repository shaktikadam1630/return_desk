import React from "react";
import { ReturnResolution } from "@prisma/client";
import { cn, formatResolutionLabel, formatCurrency } from "@/lib/utils";
import { DollarSign, ArrowRightLeft, CreditCard } from "lucide-react";

interface ResolutionBadgeProps {
  resolution?: ReturnResolution | string | null;
  refundAmount?: number | string | null;
  className?: string;
}

export function ResolutionBadge({ resolution, refundAmount, className }: ResolutionBadgeProps) {
  if (!resolution) {
    return <span className="text-zinc-400 text-xs">—</span>;
  }

  const getStyle = (res: string) => {
    switch (res) {
      case ReturnResolution.REFUND:
        return {
          bg: "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300",
          icon: DollarSign,
          label: refundAmount ? `Refund: ${formatCurrency(refundAmount)}` : "Refund",
        };
      case ReturnResolution.REPLACEMENT:
        return {
          bg: "bg-cyan-50 text-cyan-800 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300",
          icon: ArrowRightLeft,
          label: "Replacement",
        };
      case ReturnResolution.STORE_CREDIT:
        return {
          bg: "bg-violet-50 text-violet-800 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300",
          icon: CreditCard,
          label: "Store Credit",
        };
      default:
        return {
          bg: "bg-zinc-100 text-zinc-700 border-zinc-200",
          icon: DollarSign,
          label: formatResolutionLabel(res),
        };
    }
  };

  const { bg, icon: Icon, label } = getStyle(resolution);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border shadow-2xs",
        bg,
        className
      )}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{label}</span>
    </span>
  );
}
