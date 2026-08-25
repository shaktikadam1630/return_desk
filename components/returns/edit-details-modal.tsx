"use client";

import React, { useState } from "react";
import { ReturnReason, ReturnStatus } from "@prisma/client";
import { Edit3, X, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/toast";

interface EditDetailsModalProps {
  request: {
    id: string;
    reference: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    orderId: string;
    itemId: string;
    quantity: number;
    reason: ReturnReason;
    status: ReturnStatus;
  };
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditDetailsModal({
  request,
  isOpen,
  onClose,
  onSuccess,
}: EditDetailsModalProps) {
  const { success, error } = useToast();
  const [customerName, setCustomerName] = useState(request.customerName);
  const [customerEmail, setCustomerEmail] = useState(request.customerEmail);
  const [customerPhone, setCustomerPhone] = useState(request.customerPhone);
  const [orderId, setOrderId] = useState(request.orderId);
  const [itemId, setItemId] = useState(request.itemId);
  const [quantity, setQuantity] = useState(request.quantity);
  const [reason, setReason] = useState<ReturnReason>(request.reason);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    try {
      setLoading(true);
      const res = await fetch(`/api/returns/${request.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          customerEmail,
          customerPhone,
          orderId,
          itemId,
          quantity: Number(quantity),
          reason,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to update return details");
      }

      success("Details Updated", `Return request ${request.reference} details updated.`);
      onSuccess();
      onClose();
    } catch (err: any) {
      setFormError(err.message || "An error occurred");
      error("Update Failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
            <Edit3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              Edit Return Details
            </h3>
            <p className="text-xs text-zinc-500">{request.reference}</p>
          </div>
        </div>

        {formError && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl flex items-start gap-2 text-rose-700 dark:text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Customer Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Customer Email <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Customer Phone <span className="text-rose-500">*</span>
            </label>
            <input
              type="tel"
              required
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Order ID <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 font-mono"
              />
            </div>

            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Item ID <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={itemId}
                onChange={(e) => setItemId(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 font-mono"
              />
            </div>

            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Quantity <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Return Reason <span className="text-rose-500">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as ReturnReason)}
              className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            >
              <option value="DAMAGED">Damaged</option>
              <option value="WRONG_ITEM">Wrong Item</option>
              <option value="SIZE_ISSUE">Size Issue</option>
              <option value="NOT_AS_DESCRIBED">Not As Described</option>
              <option value="CHANGED_MIND">Changed Mind</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
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
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
