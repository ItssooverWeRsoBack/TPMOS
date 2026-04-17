"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface EpicDetailSheetProps {
  epicId: string | null;
  onClose: () => void;
  teamSlug: string | null;
  quarterId: string | null;
}

interface EpicDetail {
  id: string;
  title: string;
  description: string;
  definitionOfDone: string;
  driUserId: string | null;
  driCommittedWeeks: number;
  status: string;
  percentComplete: number;
  atRisk: boolean;
  voteSummary?: { yes: number; no: number; abstain: number };
  wsjfScore?: number;
}

const STATUS_OPTIONS = [
  "proposed",
  "committed",
  "in-progress",
  "done",
  "cut",
] as const;

export function EpicDetailSheet({
  epicId,
  onClose,
  teamSlug,
  quarterId,
}: EpicDetailSheetProps) {
  const queryClient = useQueryClient();
  const isOpen = epicId !== null;

  // Local form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dod, setDod] = useState("");
  const [driUserId, setDriUserId] = useState<string | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const [status, setStatus] = useState<string>("proposed");
  const [percentComplete, setPercentComplete] = useState<number>(0);
  const [atRisk, setAtRisk] = useState(false);

  // Fetch epic detail
  const { data: epic, isLoading } = useQuery<EpicDetail>({
    queryKey: ["epic-detail", epicId],
    queryFn: async () => {
      const res = await fetch(`/api/tpmos/epics/${epicId}`);
      if (!res.ok) throw new Error("Failed to fetch epic");
      return res.json();
    },
    enabled: !!epicId,
  });

  // Sync fetched data into local state
  useEffect(() => {
    if (epic) {
      setTitle(epic.title);
      setDescription(epic.description ?? "");
      setDod(epic.definitionOfDone ?? "");
      setDriUserId(epic.driUserId);
      setDuration(epic.driCommittedWeeks);
      setStatus(epic.status);
      setPercentComplete(epic.percentComplete);
      setAtRisk(epic.atRisk);
    }
  }, [epic]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (payload: Partial<EpicDetail>) => {
      const res = await fetch(`/api/tpmos/epics/${epicId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to update epic");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["epic-detail", epicId] });
      queryClient.invalidateQueries({ queryKey: ["epics"] });
    },
  });

  // Close on Escape
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  function handleSave() {
    updateMutation.mutate({
      title,
      description,
      definitionOfDone: dod,
      driUserId,
      driCommittedWeeks: duration,
      status,
      percentComplete,
      atRisk,
    });
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/30"
            onClick={onClose}
          />

          {/* Sliding panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-lg flex-col border-l border-border bg-background shadow-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="text-sm font-semibold text-foreground">
                Epic Detail
              </h2>
              <button
                onClick={onClose}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
                  Loading...
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Title */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">
                      Title
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">
                      Description
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  {/* Definition of Done */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">
                      Definition of Done
                    </label>
                    <textarea
                      value={dod}
                      onChange={(e) => setDod(e.target.value)}
                      rows={3}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  {/* Two-column row: DRI + Duration */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-foreground">
                        DRI
                      </label>
                      <input
                        type="text"
                        value={driUserId ?? ""}
                        onChange={(e) =>
                          setDriUserId(e.target.value || null)
                        }
                        placeholder="User ID"
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-foreground">
                        Duration (weeks)
                      </label>
                      <input
                        type="number"
                        value={duration}
                        onChange={(e) => setDuration(Number(e.target.value))}
                        min={0}
                        step={0.5}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  {/* Status + Percent */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-foreground">
                        Status
                      </label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-foreground">
                        % Complete
                      </label>
                      <input
                        type="number"
                        value={percentComplete}
                        onChange={(e) =>
                          setPercentComplete(
                            Math.min(100, Math.max(0, Number(e.target.value)))
                          )
                        }
                        min={0}
                        max={100}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  {/* At-Risk toggle */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={atRisk}
                      onClick={() => setAtRisk(!atRisk)}
                      className={cn(
                        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
                        atRisk ? "bg-destructive" : "bg-muted"
                      )}
                    >
                      <span
                        className={cn(
                          "pointer-events-none inline-block size-4 rounded-full bg-white shadow-sm transition-transform",
                          atRisk ? "translate-x-4" : "translate-x-0"
                        )}
                      />
                    </button>
                    <span className="text-xs font-medium text-foreground">
                      At Risk
                    </span>
                  </div>

                  {/* Vote summary */}
                  {epic?.voteSummary && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-foreground">
                        Votes
                      </label>
                      <div className="flex gap-3 text-xs text-muted-foreground">
                        <span className="text-green-600">
                          Yes: {epic.voteSummary.yes}
                        </span>
                        <span className="text-red-600">
                          No: {epic.voteSummary.no}
                        </span>
                        <span>Abstain: {epic.voteSummary.abstain}</span>
                      </div>
                    </div>
                  )}

                  {/* WSJF badge */}
                  {epic?.wsjfScore !== undefined && (
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                      WSJF: {epic.wsjfScore.toFixed(1)}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-border px-5 py-3">
              <div className="flex justify-end gap-2">
                <button
                  onClick={onClose}
                  className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={updateMutation.isPending || !title}
                  className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {updateMutation.isPending ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
