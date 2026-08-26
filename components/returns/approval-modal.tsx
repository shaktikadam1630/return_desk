"use client";

import React, { useState } from "react";
import { ReturnResolution } from "@prisma/client";
import { CheckCircle2, DollarSign, ArrowRightLeft, CreditCard, X, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/toast";

interface ApprovalModalProps {
  requestId: string;
  reference: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ApprovalModal({
  requestId,
  reference,
  isOpen,
  onClose,
  onSuccess,
}: ApprovalModalProps) {
  const { success, error } = useToast();
  const [resolution, setResolution] = useState<ReturnResolution>(ReturnResolution.REFUND);
  const [refundAmount, setRefundAmount] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Frontend validation matching business rules
    let parsedAmount: number | null = null;
    if (resolution === ReturnResolution.REFUND) {
      const amountNum = parseFloat(refundAmount);
      if (isNaN(amountNum) || amountNum <= 0) {
        setFormError("Refund amount must be a valid number greater than $0.00");
        return;
      }
      parsedAmount = Math.round(amountNum * 100) / 100;
    }

    try {
      setLoading(true);
      const res = await fetch(`/api/returns/${requestId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "APPROVED",
          resolution,
          refundAmount: resolution === ReturnResolution.REFUND ? parsedAmount : null,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to approve return request");
      }

      success("Request Approved", `Return request ${reference} has been approved.`);
      onSuccess();
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setFormError(message);
      error("Approval Failed", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6 relative">
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              Approve Return Request
            </h3>
            <p className="text-xs text-zinc-500">{reference}</p>
          </div>
        </div>

        {formError && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl flex items-start gap-2 text-rose-700 dark:text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
              Select Resolution Type <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setResolution(ReturnResolution.REFUND);
                  setFormError(null);
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-medium transition cursor-pointer ${
                  resolution === ReturnResolution.REFUND
                    ? "border-emerald-500 bg-emerald-50/80 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300 font-semibold ring-2 ring-emerald-500/20"
                    : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300"
                }`}
              >
                <DollarSign className="w-5 h-5 mb-1 text-emerald-600" />
                <span>Refund</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setResolution(ReturnResolution.REPLACEMENT);
                  setRefundAmount("");
                  setFormError(null);
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-medium transition cursor-pointer ${
                  resolution === ReturnResolution.REPLACEMENT
                    ? "border-cyan-500 bg-cyan-50/80 text-cyan-900 dark:bg-cyan-950/40 dark:text-cyan-300 font-semibold ring-2 ring-cyan-500/20"
                    : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300"
                }`}
              >
                <ArrowRightLeft className="w-5 h-5 mb-1 text-cyan-600" />
                <span>Replacement</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setResolution(ReturnResolution.STORE_CREDIT);
                  setRefundAmount("");
                  setFormError(null);
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-medium transition cursor-pointer ${
                  resolution === ReturnResolution.STORE_CREDIT
                    ? "border-violet-500 bg-violet-50/80 text-violet-900 dark:bg-violet-950/40 dark:text-violet-300 font-semibold ring-2 ring-violet-500/20"
                    : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300"
                }`}
              >
                <CreditCard className="w-5 h-5 mb-1 text-violet-600" />
                <span>Store Credit</span>
              </button>
            </div>
          </div>

          {resolution === ReturnResolution.REFUND ? (
            <div>
              <label
                htmlFor="refundAmount"
                className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5"
              >
                Refund Amount (USD) <span className="text-rose-500">*</span>
              </label>
              <div className="relative rounded-xl shadow-2xs">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-500">
                  <span className="text-sm font-semibold">$</span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  id="refundAmount"
                  required
                  placeholder="0.00"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  className="block w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-8 pr-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 transition"
                />
              </div>
              <p className="text-2xs text-zinc-500 mt-1">
                A non-zero refund amount is strictly required for REFUND resolution.
              </p>
            </div>
          ) : (
            <div className="p-3.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-400">
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">Note:</span> For{" "}
              {resolution === ReturnResolution.REPLACEMENT ? "Replacements" : "Store Credit"},{" "}
              refund amount is omitted per Rule 2.
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span>Approving...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm Approval</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
