/**
 * Carry-forward logic — builds new epic drafts from incomplete source epics.
 * Pure function, no I/O. 100% Vitest branch coverage required.
 */

export interface SourceEpic {
  id: string;
  title: string;
  description: string | null;
  definitionOfDone: string | null;
  driUserId: string | null;
  driCommittedWeeks: number;
  status: string;
  percentComplete: number;
}

export interface CarriedEpicDraft {
  title: string;
  description: string | null;
  definitionOfDone: string | null;
  driUserId: string | null;
  driCommittedWeeks: number;
  carriedFromEpicId: string;
}

/**
 * Build epic drafts for carry-forward.
 * Only non-done, non-cancelled epics can be carried.
 * Resets status, percent complete, and votes. Preserves content and DRI.
 */
export function buildCarryForwardDrafts(
  sourceEpics: SourceEpic[],
  selectedIds: string[]
): CarriedEpicDraft[] {
  return selectedIds
    .map((id) => sourceEpics.find((e) => e.id === id))
    .filter((epic): epic is SourceEpic => {
      if (!epic) return false;
      // Don't carry done or cancelled epics
      if (epic.status === "done" || epic.status === "cancelled") return false;
      return true;
    })
    .map((epic) => ({
      title: epic.title,
      description: epic.description,
      definitionOfDone: epic.definitionOfDone,
      driUserId: epic.driUserId,
      driCommittedWeeks: epic.driCommittedWeeks,
      carriedFromEpicId: epic.id,
    }));
}

/**
 * Identify epics eligible for carry-forward.
 * Returns epics that are not done and not cancelled.
 */
export function getEligibleForCarryForward(epics: SourceEpic[]): SourceEpic[] {
  return epics.filter(
    (e) => e.status !== "done" && e.status !== "cancelled"
  );
}
