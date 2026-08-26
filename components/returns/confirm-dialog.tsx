"use client";

import React, { useState } from "react";
import { AlertCircle, AlertTriangle, CheckCircle, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "primary" | "success";
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "primary",
}: ConfirmDialogProps) {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      await onConfirm();
      onClose();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case "danger":
        return {
          icon: Trash2,
          iconBg: "bg-rose-100 dark:bg-rose-950/60 text-rose-600",
          btn: "bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white",
        };
      case "warning":
        return {
          icon: AlertTriangle,
          iconBg: "bg-amber-100 dark:bg-amber-950/60 text-amber-600",
          btn: "bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white",
        };
      case "success":
        return {
          icon: CheckCircle,
          iconBg: "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600",
          btn: "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white",
        };
      default:
        return {
          icon: AlertCircle,
          iconBg: "bg-blue-100 dark:bg-blue-950/60 text-blue-600",
          btn: "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white",
        };
    }
  };

  const { icon: Icon, iconBg, btn } = getVariantStyles();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 relative">
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-3.5">
          <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0", iconBg)}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0 pr-6">
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">{title}</h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed">{description}</p>
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300 text-xs">
            {errorMessage}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className={cn(
              "px-5 py-2 text-xs font-semibold rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-50",
              btn
            )}
          >
            {loading ? "Processing..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
