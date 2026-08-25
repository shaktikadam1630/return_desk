"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ReturnStatus, ReturnReason, ReturnResolution } from "@prisma/client";
import { StatusBadge } from "./status-badge";
import { ReasonBadge } from "./reason-badge";
import { ResolutionBadge } from "./resolution-badge";
import { ApprovalModal } from "./approval-modal";
import { ConfirmDialog } from "./confirm-dialog";
import { formatDate, formatCurrency } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  ArrowRight,
  CheckCircle2,
  XCircle,
  CheckCheck,
  Trash2,
  Inbox,
  User,
  Package,
} from "lucide-react";

export interface ReturnRequestItem {
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
  _count?: { notes: number };
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ReturnsTableProps {
  data: ReturnRequestItem[];
  pagination: PaginationMeta;
  loading: boolean;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  onDataRefresh: () => void;
  onClearFilters: () => void;
}

export function ReturnsTable({
  data,
  pagination,
  loading,
  onPageChange,
  onLimitChange,
  onDataRefresh,
  onClearFilters,
}: ReturnsTableProps) {
  const { success, error } = useToast();

  // Modal states
  const [approvalTarget, setApprovalTarget] = useState<ReturnRequestItem | null>(null);
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

  // Action Handlers enforcing backend API transitions
  const handleMoveToInReview = (item: ReturnRequestItem) => {
    setConfirmDialog({
      isOpen: true,
      title: "Move Request to In Review",
      description: `Move return request ${item.reference} to 'In Review' status to begin investigation?`,
      variant: "primary",
      confirmText: "Start Review",
      action: async () => {
        const res = await fetch(`/api/returns/${item.id}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: ReturnStatus.IN_REVIEW }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error?.message || "Failed to transition status");
        success("Status Updated", `Request ${item.reference} is now In Review.`);
        onDataRefresh();
      },
    });
  };

  const handleReject = (item: ReturnRequestItem) => {
    setConfirmDialog({
      isOpen: true,
      title: "Reject Return Request",
      description: `Are you sure you want to reject return request ${item.reference}? This is a terminal state and cannot be undone.`,
      variant: "danger",
      confirmText: "Reject Request",
      action: async () => {
        const res = await fetch(`/api/returns/${item.id}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: ReturnStatus.REJECTED }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error?.message || "Failed to reject request");
        success("Request Rejected", `Request ${item.reference} has been rejected.`);
        onDataRefresh();
      },
    });
  };

  const handleComplete = (item: ReturnRequestItem) => {
    setConfirmDialog({
      isOpen: true,
      title: "Complete Return Request",
      description: `Mark return request ${item.reference} as Completed? This confirms all payouts or replacement shipments are fulfilled.`,
      variant: "success",
      confirmText: "Mark Completed",
      action: async () => {
        const res = await fetch(`/api/returns/${item.id}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: ReturnStatus.COMPLETED }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error?.message || "Failed to complete request");
        success("Request Completed", `Request ${item.reference} has been marked Completed.`);
        onDataRefresh();
      },
    });
  };

  const handleRemove = (item: ReturnRequestItem) => {
    setConfirmDialog({
      isOpen: true,
      title: "Remove Return Request",
      description: `Remove ${item.reference} from the active desk? It will be soft-deleted in the database and hidden from active views.`,
      variant: "danger",
      confirmText: "Remove Request",
      action: async () => {
        const res = await fetch(`/api/returns/${item.id}`, {
          method: "DELETE",
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error?.message || "Failed to remove request");
        success("Request Removed", `Request ${item.reference} was removed from the desk.`);
        onDataRefresh();
      },
    });
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xs overflow-hidden flex flex-col">
      {/* Loading Skeleton */}
      {loading ? (
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
            <div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
          </div>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center justify-between py-3 gap-4 border-b border-zinc-50 dark:border-zinc-800/50">
              <div className="h-4 w-28 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
              <div className="h-4 w-40 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
              <div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse hidden md:block" />
              <div className="h-6 w-20 bg-zinc-200 dark:bg-zinc-800 rounded-full animate-pulse" />
              <div className="h-8 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-xl animate-pulse" />
            </div>
          ))}
        </div>
      ) : data.length === 0 ? (
        /* Empty State */
        <div className="py-16 px-4 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 mx-auto flex items-center justify-center">
            <Inbox className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            No Return Requests Found
          </h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            No return requests match your active filters or search criteria. Try adjusting or resetting your filters.
          </p>
          <div className="pt-2">
            <button
              onClick={onClearFilters}
              className="px-4 py-2 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-xl transition cursor-pointer"
            >
              Clear All Filters
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Desktop Table (md and up) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/40 text-2xs font-semibold uppercase tracking-wider text-zinc-500">
                  <th className="py-3.5 pl-6 pr-3">Reference</th>
                  <th className="py-3.5 px-3">Customer</th>
                  <th className="py-3.5 px-3">Order & Item</th>
                  <th className="py-3.5 px-3">Reason</th>
                  <th className="py-3.5 px-3">Status</th>
                  <th className="py-3.5 px-3">Resolution</th>
                  <th className="py-3.5 px-3">Created</th>
                  <th className="py-3.5 pl-3 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-xs">
                {data.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition group"
                  >
                    <td className="py-3.5 pl-6 pr-3 font-mono font-semibold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                      <Link
                        href={`/returns/${item.id}`}
                        className="hover:underline flex items-center gap-1.5"
                      >
                        <span>{item.reference}</span>
                        {item._count && item._count.notes > 0 && (
                          <span
                            title={`${item._count.notes} note(s)`}
                            className="px-1.5 py-0.2 text-3xs font-sans font-semibold bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-full"
                          >
                            {item._count.notes}
                          </span>
                        )}
                      </Link>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {item.customerName}
                      </div>
                      <div className="text-2xs text-zinc-500 truncate max-w-[160px]">
                        {item.customerEmail}
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="font-mono text-zinc-800 dark:text-zinc-200 font-medium">
                        {item.orderId}
                      </div>
                      <div className="text-2xs text-zinc-500 font-mono">
                        {item.itemId} (x{item.quantity})
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <ReasonBadge reason={item.reason} size="sm" />
                    </td>

                    <td className="py-3.5 px-3">
                      <StatusBadge status={item.status} size="sm" />
                    </td>

                    <td className="py-3.5 px-3">
                      <ResolutionBadge
                        resolution={item.resolution}
                        refundAmount={item.refundAmount}
                      />
                    </td>

                    <td className="py-3.5 px-3 text-zinc-500 whitespace-nowrap text-2xs">
                      {formatDate(item.createdAt)}
                    </td>

                    <td className="py-3.5 pl-3 pr-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Legal Action triggers based on Status */}
                        {item.status === ReturnStatus.OPEN && (
                          <>
                            <button
                              onClick={() => handleMoveToInReview(item)}
                              title="Move to In Review"
                              className="px-2.5 py-1 text-2xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-900/50 rounded-lg border border-amber-200 dark:border-amber-800 transition cursor-pointer flex items-center gap-1"
                            >
                              <ArrowRight className="w-3 h-3" />
                              <span>Review</span>
                            </button>
                            <button
                              onClick={() => handleRemove(item)}
                              title="Remove Request (Soft Delete)"
                              className="p-1 text-zinc-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}

                        {item.status === ReturnStatus.IN_REVIEW && (
                          <>
                            <button
                              onClick={() => setApprovalTarget(item)}
                              title="Approve Request"
                              className="px-2.5 py-1 text-2xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/50 rounded-lg border border-emerald-200 dark:border-emerald-800 transition cursor-pointer flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => handleReject(item)}
                              title="Reject Request"
                              className="px-2.5 py-1 text-2xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-900/50 rounded-lg border border-rose-200 dark:border-rose-800 transition cursor-pointer flex items-center gap-1"
                            >
                              <XCircle className="w-3 h-3" />
                              <span>Reject</span>
                            </button>
                          </>
                        )}

                        {item.status === ReturnStatus.APPROVED && (
                          <button
                            onClick={() => handleComplete(item)}
                            title="Complete Request"
                            className="px-2.5 py-1 text-2xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:text-purple-300 dark:hover:bg-purple-900/50 rounded-lg border border-purple-200 dark:border-purple-800 transition cursor-pointer flex items-center gap-1"
                          >
                            <CheckCheck className="w-3 h-3" />
                            <span>Complete</span>
                          </button>
                        )}

                        {item.status === ReturnStatus.REJECTED && (
                          <button
                            onClick={() => handleRemove(item)}
                            title="Remove Request (Soft Delete)"
                            className="px-2.5 py-1 text-2xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-900/50 rounded-lg border border-rose-200 dark:border-rose-800 transition cursor-pointer flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Remove</span>
                          </button>
                        )}

                        <Link
                          href={`/returns/${item.id}`}
                          title="View Details"
                          className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View (down to 375px) */}
          <div className="md:hidden divide-y divide-zinc-100 dark:divide-zinc-800">
            {data.map((item) => (
              <div key={item.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link
                      href={`/returns/${item.id}`}
                      className="font-mono text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1.5"
                    >
                      <span>{item.reference}</span>
                      {item._count && item._count.notes > 0 && (
                        <span className="px-1.5 py-0.2 text-3xs font-sans bg-zinc-200 dark:bg-zinc-700 rounded-full text-zinc-700 dark:text-zinc-200">
                          {item._count.notes}
                        </span>
                      )}
                    </Link>
                    <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">
                      {item.customerName}
                    </p>
                  </div>
                  <StatusBadge status={item.status} size="sm" />
                </div>

                <div className="grid grid-cols-2 gap-2 text-2xs bg-zinc-50 dark:bg-zinc-800/50 p-2.5 rounded-xl">
                  <div>
                    <span className="text-zinc-500 block">Order ID</span>
                    <span className="font-mono font-semibold text-zinc-800 dark:text-zinc-200">
                      {item.orderId}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Item / Qty</span>
                    <span className="font-mono text-zinc-800 dark:text-zinc-200">
                      {item.itemId} (x{item.quantity})
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Reason</span>
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">
                      {item.reason}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Resolution</span>
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">
                      {item.resolution ? item.resolution : "—"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-3xs text-zinc-400">{formatDate(item.createdAt)}</span>
                  <div className="flex items-center gap-2">
                    {item.status === ReturnStatus.OPEN && (
                      <button
                        onClick={() => handleMoveToInReview(item)}
                        className="px-2.5 py-1 text-2xs font-semibold text-amber-700 bg-amber-50 rounded-lg border border-amber-200"
                      >
                        Review
                      </button>
                    )}
                    {item.status === ReturnStatus.IN_REVIEW && (
                      <button
                        onClick={() => setApprovalTarget(item)}
                        className="px-2.5 py-1 text-2xs font-semibold text-emerald-700 bg-emerald-50 rounded-lg border border-emerald-200"
                      >
                        Approve
                      </button>
                    )}
                    {item.status === ReturnStatus.APPROVED && (
                      <button
                        onClick={() => handleComplete(item)}
                        className="px-2.5 py-1 text-2xs font-semibold text-purple-700 bg-purple-50 rounded-lg border border-purple-200"
                      >
                        Complete
                      </button>
                    )}
                    {(item.status === ReturnStatus.OPEN || item.status === ReturnStatus.REJECTED) && (
                      <button
                        onClick={() => handleRemove(item)}
                        className="p-1 text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <Link
                      href={`/returns/${item.id}`}
                      className="px-2.5 py-1 text-2xs font-semibold text-blue-600 bg-blue-50 rounded-lg"
                    >
                      Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-600 dark:text-zinc-400">
            <div className="flex items-center gap-2">
              <span>
                Showing{" "}
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1}
                </span>{" "}
                to{" "}
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {Math.min(pagination.page * pagination.limit, pagination.total)}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {pagination.total}
                </span>{" "}
                requests
              </span>

              <div className="flex items-center gap-1.5 ml-2 border-l border-zinc-200 dark:border-zinc-700 pl-3">
                <span className="text-2xs text-zinc-500">Per page:</span>
                <select
                  value={pagination.limit}
                  onChange={(e) => onLimitChange(Number(e.target.value))}
                  className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 py-1 px-2 text-2xs font-medium text-zinc-800 dark:text-zinc-200 focus:outline-hidden"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onPageChange(1)}
                disabled={pagination.page <= 1}
                title="First Page"
                className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer"
              >
                <ChevronsLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onPageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                title="Previous Page"
                className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <span className="px-3 py-1 text-xs font-semibold bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200">
                Page {pagination.page} of {pagination.totalPages}
              </span>

              <button
                onClick={() => onPageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                title="Next Page"
                className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onPageChange(pagination.totalPages)}
                disabled={pagination.page >= pagination.totalPages}
                title="Last Page"
                className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer"
              >
                <ChevronsRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </>
      )}

      {/* Dynamic Modals */}
      {approvalTarget && (
        <ApprovalModal
          requestId={approvalTarget.id}
          reference={approvalTarget.reference}
          isOpen={Boolean(approvalTarget)}
          onClose={() => setApprovalTarget(null)}
          onSuccess={onDataRefresh}
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
