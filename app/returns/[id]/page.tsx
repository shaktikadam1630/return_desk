"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ReturnStatus, ReturnReason, ReturnResolution } from "@prisma/client";
import { StatusBadge } from "@/components/returns/status-badge";
import { ReasonBadge } from "@/components/returns/reason-badge";
import { ResolutionBadge } from "@/components/returns/resolution-badge";
import { NotesSection } from "@/components/returns/notes-section";
import { ApprovalModal } from "@/components/returns/approval-modal";
import { EditDetailsModal } from "@/components/returns/edit-details-modal";
import { ConfirmDialog } from "@/components/returns/confirm-dialog";
import { formatDate, formatCurrency } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import {
  ArrowLeft,
  User,
  Package,
  CheckCircle2,
  XCircle,
  CheckCheck,
  ArrowRight,
  Edit3,
  Trash2,
  Lock,
  DollarSign,
  AlertCircle,
} from "lucide-react";

interface NoteItem {
  id: string;
  content: string;
  createdAt: string | Date;
}

interface ReturnRequestDetail {
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
  resolution: ReturnResolution | null;
  refundAmount: number | string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  removedAt: string | Date | null;
  notes: NoteItem[];
}

export default function ReturnDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const { success } = useToast();

  const [request, setRequest] = useState<ReturnRequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Modals state
  const [isApprovalOpen, setIsApprovalOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    action: () => Promise<void>;
    variant: "primary" | "warning" | "danger" | "success";
    confirmText: string;
  }>({
    isOpen: false,
    title: "",
    description: "",
    action: async () => {},
    variant: "primary",
    confirmText: "Confirm",
  });

  const fetchRequestDetails = useCallback(async () => {
    try {
      setLoading(true);
      setFetchError(null);
      const res = await fetch(`/api/returns/${id}`);
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to load return request");
      }

      setRequest(json.data);
    } catch (err) {
      setFetchError(
        err instanceof Error ? err.message : "Failed to load request details",
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchRequestDetails();
  }, [fetchRequestDetails]);

  // Action Triggers
  const handleMoveToInReview = () => {
    if (!request) return;
    setConfirmDialog({
      isOpen: true,
      title: "Move to In Review",
      description: `Move return request ${request.reference} to 'In Review' status?`,
      variant: "primary",
      confirmText: "Start Review",
      action: async () => {
        const res = await fetch(`/api/returns/${request.id}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: ReturnStatus.IN_REVIEW }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error?.message || "Failed to update status");
        success("Status Updated", `Request is now In Review.`);
        fetchRequestDetails();
      },
    });
  };

  const handleReject = () => {
    if (!request) return;
    setConfirmDialog({
      isOpen: true,
      title: "Reject Return Request",
      description: `Are you sure you want to reject request ${request.reference}? This is a final decision.`,
      variant: "danger",
      confirmText: "Reject Request",
      action: async () => {
        const res = await fetch(`/api/returns/${request.id}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: ReturnStatus.REJECTED }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error?.message || "Failed to reject request");
        success("Request Rejected", `Request ${request.reference} was rejected.`);
        fetchRequestDetails();
      },
    });
  };

  const handleComplete = () => {
    if (!request) return;
    setConfirmDialog({
      isOpen: true,
      title: "Complete Return Request",
      description: `Mark request ${request.reference} as Completed? This confirms all resolution actions (refund/replacement/store credit) are finalized.`,
      variant: "success",
      confirmText: "Mark Completed",
      action: async () => {
        const res = await fetch(`/api/returns/${request.id}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: ReturnStatus.COMPLETED }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error?.message || "Failed to complete request");
        success("Request Completed", `Request ${request.reference} marked as Completed.`);
        fetchRequestDetails();
      },
    });
  };

  const handleRemove = () => {
    if (!request) return;
    setConfirmDialog({
      isOpen: true,
      title: "Remove Return Request",
      description: `Remove ${request.reference} from active desk? It will be soft-deleted in PostgreSQL and will no longer be visible or fetchable.`,
      variant: "danger",
      confirmText: "Remove Request",
      action: async () => {
        const res = await fetch(`/api/returns/${request.id}`, {
          method: "DELETE",
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error?.message || "Failed to remove request");
        success("Request Removed", `Request ${request.reference} removed.`);
        router.push("/");
      },
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-32 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="h-8 w-48 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
            <div className="h-8 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-full animate-pulse" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-40 bg-zinc-100 dark:bg-zinc-800/60 rounded-2xl animate-pulse" />
            <div className="h-40 bg-zinc-100 dark:bg-zinc-800/60 rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (fetchError || !request) {
    return (
      <div className="py-16 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950 text-rose-600 mx-auto flex items-center justify-center">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
          Request Not Found
        </h2>
        <p className="text-xs text-zinc-500 max-w-md mx-auto">
          {fetchError || "The requested return record could not be found or has been removed."}
        </p>
        <div className="pt-2">
          <Link
            href="/"
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Desk</span>
          </Link>
        </div>
      </div>
    );
  }

  const isDecided = (
    [
      ReturnStatus.APPROVED,
      ReturnStatus.REJECTED,
      ReturnStatus.COMPLETED,
    ] as ReturnStatus[]
  ).includes(request.status);

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Desk</span>
        </Link>

        <div className="flex items-center gap-2 text-2xs text-zinc-400">
          <span>Created: {formatDate(request.createdAt)}</span>
          <span>•</span>
          <span>Updated: {formatDate(request.updatedAt)}</span>
        </div>
      </div>

      {/* Main Request Header Banner */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-100 dark:border-zinc-800">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="font-mono text-2xl font-extrabold text-zinc-900 dark:text-zinc-100">
                {request.reference}
              </span>
              <StatusBadge status={request.status} size="lg" />
              <ReasonBadge reason={request.reason} />
            </div>
            <p className="text-xs text-zinc-500">
              Raised by <span className="font-semibold text-zinc-800 dark:text-zinc-200">{request.customerName}</span> for Order <span className="font-mono font-semibold text-zinc-800 dark:text-zinc-200">{request.orderId}</span>
            </p>
          </div>

          {/* Contextual Action Buttons */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Status: OPEN Actions */}
            {request.status === ReturnStatus.OPEN && (
              <>
                <button
                  onClick={handleMoveToInReview}
                  className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>Move to In Review</span>
                </button>

                <button
                  onClick={() => setIsEditOpen(true)}
                  className="px-3.5 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Details</span>
                </button>

                <button
                  onClick={handleRemove}
                  className="px-3.5 py-2 text-xs font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 rounded-xl border border-rose-200 dark:border-rose-800 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              </>
            )}

            {/* Status: IN_REVIEW Actions */}
            {request.status === ReturnStatus.IN_REVIEW && (
              <>
                <button
                  onClick={() => setIsApprovalOpen(true)}
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve Request</span>
                </button>

                <button
                  onClick={handleReject}
                  className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Reject Request</span>
                </button>

                <button
                  onClick={() => setIsEditOpen(true)}
                  className="px-3.5 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Details</span>
                </button>
              </>
            )}

            {/* Status: APPROVED Actions */}
            {request.status === ReturnStatus.APPROVED && (
              <button
                onClick={handleComplete}
                className="px-5 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 active:bg-purple-800 rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCheck className="w-4 h-4" />
                <span>Mark Completed</span>
              </button>
            )}

            {/* Status: REJECTED Actions */}
            {request.status === ReturnStatus.REJECTED && (
              <button
                onClick={handleRemove}
                className="px-4 py-2 text-xs font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 rounded-xl border border-rose-200 dark:border-rose-800 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove Request</span>
              </button>
            )}
          </div>
        </div>

        {/* Locking Banner (Rule 4) */}
        {isDecided && (
          <div className="p-3.5 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex items-center gap-2.5 text-xs text-zinc-600 dark:text-zinc-400">
            <Lock className="w-4 h-4 text-zinc-400 shrink-0" />
            <span>
              <strong className="text-zinc-800 dark:text-zinc-200">Rule 4 Locked:</strong> Customer and item details cannot be edited once decided ({request.status}). Internal notes can still be recorded.
            </span>
          </div>
        )}

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Customer Card */}
          <div className="p-5 rounded-2xl bg-zinc-50/60 dark:bg-zinc-800/30 border border-zinc-200 dark:border-zinc-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500">
              <User className="w-4 h-4 text-blue-600" />
              <span>Customer Details</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-zinc-500">Name</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">{request.customerName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-zinc-500">Email</span>
                <span className="font-mono text-zinc-800 dark:text-zinc-200">{request.customerEmail}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-zinc-500">Phone</span>
                <span className="font-mono text-zinc-800 dark:text-zinc-200">{request.customerPhone}</span>
              </div>
            </div>
          </div>

          {/* Order & Item Card */}
          <div className="p-5 rounded-2xl bg-zinc-50/60 dark:bg-zinc-800/30 border border-zinc-200 dark:border-zinc-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500">
              <Package className="w-4 h-4 text-indigo-600" />
              <span>Order & Return Spec</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-zinc-500">Order ID</span>
                <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">{request.orderId}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-zinc-500">Item ID / SKU</span>
                <span className="font-mono text-zinc-800 dark:text-zinc-200">{request.itemId}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-zinc-500">Quantity</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">{request.quantity} units</span>
              </div>
            </div>
          </div>
        </div>

        {/* Resolution Information Card (if present) */}
        {request.resolution && (
          <div className="p-5 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
              <DollarSign className="w-4 h-4" />
              <span>Decision & Resolution</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-zinc-500 block mb-1">Resolution Granted</span>
                <ResolutionBadge resolution={request.resolution} refundAmount={request.refundAmount} />
              </div>
              {request.resolution === ReturnResolution.REFUND && (
                <div>
                  <span className="text-zinc-500 block mb-1">Authorized Refund Amount</span>
                  <span className="text-base font-extrabold text-emerald-700 dark:text-emerald-300">
                    {formatCurrency(request.refundAmount)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Notes & Activity Section */}
      <NotesSection
        requestId={request.id}
        notes={request.notes || []}
        onNoteAdded={fetchRequestDetails}
      />

      {/* Dynamic Modals */}
      {isApprovalOpen && (
        <ApprovalModal
          requestId={request.id}
          reference={request.reference}
          isOpen={isApprovalOpen}
          onClose={() => setIsApprovalOpen(false)}
          onSuccess={fetchRequestDetails}
        />
      )}

      {isEditOpen && (
        <EditDetailsModal
          request={request}
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          onSuccess={fetchRequestDetails}
        />
      )}

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog((p) => ({ ...p, isOpen: false }))}
        onConfirm={confirmDialog.action}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmText={confirmDialog.confirmText}
        variant={confirmDialog.variant}
      />
    </div>
  );
}
