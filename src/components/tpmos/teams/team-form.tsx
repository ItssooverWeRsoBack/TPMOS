"use client";

import { useState } from "react";
import type { CreateTeamInput } from "@/lib/tpmos/schemas/team";

interface TeamFormProps {
  onSubmit: (input: CreateTeamInput) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function TeamForm({ onSubmit, onCancel, isLoading }: TeamFormProps) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [charter, setCharter] = useState("");
  const [autoSlug, setAutoSlug] = useState(true);

  function handleNameChange(value: string) {
    setName(value);
    if (autoSlug) {
      setSlug(
        value
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
          .slice(0, 50)
      );
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({ name, slug, charter: charter || undefined });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-foreground">Team Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="e.g., Platform"
          required
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-foreground">Slug</label>
        <input
          type="text"
          value={slug}
          onChange={(e) => {
            setSlug(e.target.value);
            setAutoSlug(false);
          }}
          placeholder="e.g., platform"
          required
          pattern="^[a-z0-9-]+$"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <p className="text-[11px] text-muted-foreground">Lowercase letters, numbers, and hyphens only.</p>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-foreground">Charter (optional)</label>
        <textarea
          value={charter}
          onChange={(e) => setCharter(e.target.value)}
          placeholder="What does this team own?"
          rows={3}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading || !name || !slug}
          className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isLoading ? "Creating..." : "Create Team"}
        </button>
      </div>
    </form>
  );
}
