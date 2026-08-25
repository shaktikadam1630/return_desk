"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ReturnsFilterBar } from "@/components/returns/returns-filter-bar";
import { ReturnsTable, ReturnRequestItem } from "@/components/returns/returns-table";
import { useToast } from "@/components/ui/toast";
import {
  RotateCcw,
  Plus,
  Clock,
  Search,
  CheckCircle,
  CheckCheck,
  XCircle,
  AlertTriangle,
} from "lucide-react";

interface StatusCounts {
  all: number;
  open: number;
  inReview: number;
  approved: number;
  completed: number;
  rejected: number;
}

export default function DashboardPage() {
  const { error } = useToast();

  // Query state
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [reason, setReason] = useState("");
  const [sort, setSort] = useState("createdAt");
  const [order, setOrder] = useState("desc");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Data state
  const [data, setData] = useState<ReturnRequestItem[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StatusCounts>({
    all: 0,
    open: 0,
    inReview: 0,
    approved: 0,
    completed: 0,
    rejected: 0,
  });

  // Fetch returns list from server API
  const fetchReturns = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (status) params.set("status", status);
      if (reason) params.set("reason", reason);
      params.set("sort", sort);
      params.set("order", order);
      params.set("page", page.toString());
      params.set("limit", limit.toString());

      const res = await fetch(`/api/returns?${params.toString()}`);
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to fetch return requests");
      }

      setData(json.data || []);
      setPagination(json.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
    } catch (err: any) {
      error("Error Loading Desk", err.message || "Failed to load returns list");
    } finally {
      setLoading(false);
    }
  }, [search, status, reason, sort, order, page, limit, error]);

  // Fetch status summary counts for desk stats cards
  const fetchStatusCounts = useCallback(async () => {
    try {
      // Parallel status counts for dashboard stats
      const [allRes, openRes, reviewRes, approvedRes, compRes, rejRes] = await Promise.all([
        fetch("/api/returns?limit=1"),
        fetch("/api/returns?status=OPEN&limit=1"),
        fetch("/api/returns?status=IN_REVIEW&limit=1"),
        fetch("/api/returns?status=APPROVED&limit=1"),
        fetch("/api/returns?status=COMPLETED&limit=1"),
        fetch("/api/returns?status=REJECTED&limit=1"),
      ]);

      const [allJ, openJ, reviewJ, appJ, compJ, rejJ] = await Promise.all([
        allRes.json(),
        openRes.json(),
        reviewRes.json(),
        approvedRes.json(),
        compRes.json(),
        rejRes.json(),
      ]);

      setStats({
        all: allJ.pagination?.total || 0,
        open: openJ.pagination?.total || 0,
        inReview: reviewJ.pagination?.total || 0,
        approved: appJ.pagination?.total || 0,
        completed: compJ.pagination?.total || 0,
        rejected: rejJ.pagination?.total || 0,
      });
    } catch (err) {
      console.error("Failed to load status counts", err);
    }
  }, []);

  // Initial & reactive fetch
  useEffect(() => {
    fetchReturns();
  }, [fetchReturns]);

  useEffect(() => {
    fetchStatusCounts();
  }, [fetchStatusCounts]);

  const handleResetFilters = () => {
    setSearch("");
    setStatus("");
    setReason("");
    setSort("createdAt");
    setOrder("desc");
    setPage(1);
  };

  const handleStatusFilterClick = (st: string) => {
    setStatus((prev) => (prev === st ? "" : st));
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
            Returns Desk
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Manage customer return requests, review items, issue resolutions, and track audit notes.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              fetchReturns();
              fetchStatusCounts();
            }}
            title="Refresh returns data"
            className="p-2 text-zinc-600 dark:text-zinc-300 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold shadow-2xs"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <Link
            href="/returns/new"
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Return Request</span>
          </Link>
        </div>
      </div>

      {/* Desk Stats Chips / Status Filter Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* All Active */}
        <button
          onClick={() => handleStatusFilterClick("")}
          className={`p-3.5 rounded-2xl border text-left transition cursor-pointer ${
            status === ""
              ? "bg-blue-50/80 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 ring-2 ring-blue-500/20"
              : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300"
          }`}
        >
          <span className="text-2xs font-semibold uppercase tracking-wider text-zinc-500">
            All Requests
          </span>
          <p className="text-xl font-extrabold text-zinc-900 dark:text-zinc-100 mt-1">
            {stats.all}
          </p>
        </button>

        {/* OPEN */}
        <button
          onClick={() => handleStatusFilterClick("OPEN")}
          className={`p-3.5 rounded-2xl border text-left transition cursor-pointer ${
            status === "OPEN"
              ? "bg-blue-50/80 dark:bg-blue-950/40 border-blue-400 dark:border-blue-700 ring-2 ring-blue-500/20"
              : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-2xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Open
            </span>
            <Clock className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <p className="text-xl font-extrabold text-blue-700 dark:text-blue-300 mt-1">
            {stats.open}
          </p>
        </button>

        {/* IN_REVIEW */}
        <button
          onClick={() => handleStatusFilterClick("IN_REVIEW")}
          className={`p-3.5 rounded-2xl border text-left transition cursor-pointer ${
            status === "IN_REVIEW"
              ? "bg-amber-50/80 dark:bg-amber-950/40 border-amber-400 dark:border-amber-700 ring-2 ring-amber-500/20"
              : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-2xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              In Review
            </span>
            <Search className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <p className="text-xl font-extrabold text-amber-700 dark:text-amber-300 mt-1">
            {stats.inReview}
          </p>
        </button>

        {/* APPROVED */}
        <button
          onClick={() => handleStatusFilterClick("APPROVED")}
          className={`p-3.5 rounded-2xl border text-left transition cursor-pointer ${
            status === "APPROVED"
              ? "bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-700 ring-2 ring-emerald-500/20"
              : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-2xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Approved
            </span>
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <p className="text-xl font-extrabold text-emerald-700 dark:text-emerald-300 mt-1">
            {stats.approved}
          </p>
        </button>

        {/* COMPLETED */}
        <button
          onClick={() => handleStatusFilterClick("COMPLETED")}
          className={`p-3.5 rounded-2xl border text-left transition cursor-pointer ${
            status === "COMPLETED"
              ? "bg-purple-50/80 dark:bg-purple-950/40 border-purple-400 dark:border-purple-700 ring-2 ring-purple-500/20"
              : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-2xs font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400">
              Completed
            </span>
            <CheckCheck className="w-3.5 h-3.5 text-purple-500" />
          </div>
          <p className="text-xl font-extrabold text-purple-700 dark:text-purple-300 mt-1">
            {stats.completed}
          </p>
        </button>

        {/* REJECTED */}
        <button
          onClick={() => handleStatusFilterClick("REJECTED")}
          className={`p-3.5 rounded-2xl border text-left transition cursor-pointer ${
            status === "REJECTED"
              ? "bg-rose-50/80 dark:bg-rose-950/40 border-rose-400 dark:border-rose-700 ring-2 ring-rose-500/20"
              : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-2xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              Rejected
            </span>
            <XCircle className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <p className="text-xl font-extrabold text-rose-700 dark:text-rose-300 mt-1">
            {stats.rejected}
          </p>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <ReturnsFilterBar
        search={search}
        status={status}
        reason={reason}
        sort={sort}
        order={order}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        onStatusChange={(val) => {
          setStatus(val);
          setPage(1);
        }}
        onReasonChange={(val) => {
          setReason(val);
          setPage(1);
        }}
        onSortChange={(s, o) => {
          setSort(s);
          setOrder(o);
          setPage(1);
        }}
        onReset={handleResetFilters}
      />

      {/* Return Requests Data Table */}
      <ReturnsTable
        data={data}
        pagination={pagination}
        loading={loading}
        onPageChange={(p) => setPage(p)}
        onLimitChange={(l) => {
          setLimit(l);
          setPage(1);
        }}
        onDataRefresh={() => {
          fetchReturns();
          fetchStatusCounts();
        }}
        onClearFilters={handleResetFilters}
      />
    </div>
  );
}
