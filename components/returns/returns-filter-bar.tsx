"use client";

import React, { useState, useEffect } from "react";
import { Search, Filter, ArrowUpDown, X, RotateCcw } from "lucide-react";
import { ReturnStatus, ReturnReason } from "@prisma/client";

interface ReturnsFilterBarProps {
  search: string;
  status: string;
  reason: string;
  sort: string;
  order: string;
  onSearchChange: (val: string) => void;
  onStatusChange: (val: string) => void;
  onReasonChange: (val: string) => void;
  onSortChange: (sort: string, order: string) => void;
  onReset: () => void;
}

export function ReturnsFilterBar({
  search,
  status,
  reason,
  sort,
  order,
  onSearchChange,
  onStatusChange,
  onReasonChange,
  onSortChange,
  onReset,
}: ReturnsFilterBarProps) {
  // Local state for debounced search input
  const [localSearch, setLocalSearch] = useState(search);

  // Debounce search by 350ms
  useEffect(() => {
    const handler = setTimeout(() => {
      if (localSearch !== search) {
        onSearchChange(localSearch);
      }
    }, 350);

    return () => clearTimeout(handler);
  }, [localSearch, search, onSearchChange]);

  // Sync if parent search prop changes (e.g. on Reset)
  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  const hasActiveFilters = Boolean(
    search || status || reason || sort !== "createdAt" || order !== "desc"
  );

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        {/* Search Input with Debounce */}
        <div className="md:col-span-4 relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search customer, order, reference..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/60 pl-10 pr-9 py-2 text-xs md:text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:bg-white dark:focus:bg-zinc-800 focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 transition"
          />
          {localSearch && (
            <button
              onClick={() => {
                setLocalSearch("");
                onSearchChange("");
              }}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400 hover:text-zinc-600 transition"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Filter */}
        <div className="md:col-span-3">
          <div className="relative">
            <select
              value={status}
              onChange={(e) => onStatusChange(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/60 px-3.5 py-2 text-xs md:text-sm text-zinc-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-zinc-800 focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 transition cursor-pointer appearance-none"
            >
              <option value="">All Statuses</option>
              <option value={ReturnStatus.OPEN}>Open</option>
              <option value={ReturnStatus.IN_REVIEW}>In Review</option>
              <option value={ReturnStatus.APPROVED}>Approved</option>
              <option value={ReturnStatus.COMPLETED}>Completed</option>
              <option value={ReturnStatus.REJECTED}>Rejected</option>
            </select>
            <Filter className="w-3.5 h-3.5 text-zinc-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Reason Filter */}
        <div className="md:col-span-3">
          <div className="relative">
            <select
              value={reason}
              onChange={(e) => onReasonChange(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/60 px-3.5 py-2 text-xs md:text-sm text-zinc-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-zinc-800 focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 transition cursor-pointer appearance-none"
            >
              <option value="">All Reasons</option>
              <option value={ReturnReason.DAMAGED}>Damaged</option>
              <option value={ReturnReason.WRONG_ITEM}>Wrong Item</option>
              <option value={ReturnReason.SIZE_ISSUE}>Size Issue</option>
              <option value={ReturnReason.NOT_AS_DESCRIBED}>Not As Described</option>
              <option value={ReturnReason.CHANGED_MIND}>Changed Mind</option>
            </select>
            <Filter className="w-3.5 h-3.5 text-zinc-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Sort Selector */}
        <div className="md:col-span-2 flex items-center gap-1.5">
          <div className="relative flex-1">
            <select
              value={`${sort}:${order}`}
              onChange={(e) => {
                const [s, o] = e.target.value.split(":");
                onSortChange(s, o);
              }}
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/60 px-3 py-2 text-xs md:text-sm text-zinc-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-zinc-800 focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 transition cursor-pointer appearance-none"
            >
              <option value="createdAt:desc">Newest First</option>
              <option value="createdAt:asc">Oldest First</option>
              <option value="reference:asc">Reference (A-Z)</option>
              <option value="reference:desc">Reference (Z-A)</option>
              <option value="customerName:asc">Customer (A-Z)</option>
              <option value="orderId:asc">Order ID (Asc)</option>
              <option value="status:asc">Status</option>
            </select>
            <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {hasActiveFilters && (
            <button
              onClick={onReset}
              title="Reset all filters"
              className="p-2 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer shrink-0"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
