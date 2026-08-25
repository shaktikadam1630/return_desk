"use client";

import React, { useState } from "react";
import { MessageSquare, Send, Clock, ShieldAlert } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

interface NoteItem {
  id: string;
  content: string;
  createdAt: string | Date;
}

interface NotesSectionProps {
  requestId: string;
  notes: NoteItem[];
  onNoteAdded: () => void;
}

export function NotesSection({ requestId, notes, onNoteAdded }: NotesSectionProps) {
  const { success, error } = useToast();
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      setSubmitting(true);
      const res = await fetch(`/api/returns/${requestId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim() }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to add note");
      }

      setContent("");
      success("Note Added", "Internal note was successfully recorded.");
      onNoteAdded();
    } catch (err: any) {
      error("Error", err.message || "Failed to post note");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
            <MessageSquare className="w-4 h-4" />
          </div>
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            Internal Activity & Notes
          </h2>
          <span className="px-2 py-0.5 text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-full">
            {notes.length}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-2xs text-zinc-400">
          <ShieldAlert className="w-3.5 h-3.5 text-zinc-400" />
          <span>Immutable audit trail</span>
        </div>
      </div>

      {/* Add Note Form */}
      <form onSubmit={handleAddNote} className="space-y-3">
        <div>
          <label htmlFor="noteContent" className="sr-only">
            Add internal note
          </label>
          <textarea
            id="noteContent"
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Add an internal note or agent update (visible to team)..."
            required
            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/50 p-3.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:bg-white dark:focus:bg-zinc-800 focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 transition resize-none"
          />
        </div>
        <div className="flex items-center justify-between">
          <p className="text-2xs text-zinc-500">
            Notes cannot be edited or deleted once submitted.
          </p>
          <button
            type="submit"
            disabled={submitting || !content.trim()}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{submitting ? "Adding..." : "Add Note"}</span>
          </button>
        </div>
      </form>

      {/* Chronological Notes Feed */}
      <div className="space-y-3 pt-2">
        {notes.length === 0 ? (
          <div className="text-center py-8 px-4 bg-zinc-50/60 dark:bg-zinc-800/30 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
            <MessageSquare className="w-8 h-8 mx-auto text-zinc-300 dark:text-zinc-600 mb-2" />
            <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              No notes recorded yet
            </p>
            <p className="text-2xs text-zinc-400 mt-0.5">
              Be the first to leave an update regarding this request.
            </p>
          </div>
        ) : (
          <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-200 dark:before:bg-zinc-800">
            {notes.map((note) => (
              <div key={note.id} className="relative group">
                {/* Timeline node */}
                <div className="absolute -left-6 top-1.5 w-3 h-3 rounded-full border-2 border-white dark:border-zinc-900 bg-indigo-500 ring-2 ring-indigo-100 dark:ring-indigo-950" />

                <div className="p-3.5 rounded-xl bg-zinc-50/80 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800 space-y-1.5 hover:bg-zinc-100/70 dark:hover:bg-zinc-800/70 transition">
                  <div className="flex items-center justify-between text-2xs text-zinc-500">
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                      Support Agent
                    </span>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatDate(note.createdAt)}</span>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed">
                    {note.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
