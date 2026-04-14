/**
 * Progress computation — pure functions, no I/O, no React.
 * 100% Vitest branch coverage required.
 */

export interface ProgressEpic {
  driCommittedWeeks: number;
  percentComplete: number;
  status: string;
}

export interface ProgressResult {
  /** Weighted completion: sum(percent × weeks) / sum(weeks) for committed epics */
  weightedCompletion: number;
  /** Percentage of the quarter elapsed */
  timeElapsed: number;
  /** Whether the team is behind pace (completion lags time by > threshold) */
  behindPace: boolean;
  /** How many percentage points behind (positive = behind, negative = ahead) */
  paceDelta: number;
  /** Count by status */
  statusCounts: Record<string, number>;
  /** Total committed epics */
  totalCommitted: number;
  /** Total done */
  totalDone: number;
}

/**
 * Compute team progress for the quarter.
 *
 * @param epics - committed (above-line) epics only
 * @param quarterStartDate - ISO date string
 * @param quarterEndDate - ISO date string
 * @param now - current date (injectable for testing)
 * @param behindPaceThreshold - percentage points behind before flagging (default 15)
 */
export function computeProgress(
  epics: ProgressEpic[],
  quarterStartDate: string,
  quarterEndDate: string,
  now: Date = new Date(),
  behindPaceThreshold: number = 15
): ProgressResult {
  const start = new Date(quarterStartDate).getTime();
  const end = new Date(quarterEndDate).getTime();
  const current = now.getTime();

  const quarterDuration = Math.max(1, end - start);
  const elapsed = Math.max(0, Math.min(current - start, quarterDuration));
  const timeElapsed = (elapsed / quarterDuration) * 100;

  // Weighted completion
  const totalWeeks = epics.reduce((sum, e) => sum + e.driCommittedWeeks, 0);
  const weightedSum = epics.reduce(
    (sum, e) => sum + e.percentComplete * e.driCommittedWeeks,
    0
  );
  const weightedCompletion = totalWeeks > 0 ? weightedSum / totalWeeks : 0;

  // Pace
  const paceDelta = timeElapsed - weightedCompletion;
  const behindPace = totalWeeks > 0 && paceDelta > behindPaceThreshold;

  // Status counts
  const statusCounts: Record<string, number> = {};
  for (const epic of epics) {
    statusCounts[epic.status] = (statusCounts[epic.status] ?? 0) + 1;
  }

  const totalDone = epics.filter((e) => e.status === "done").length;

  return {
    weightedCompletion,
    timeElapsed,
    behindPace,
    paceDelta,
    statusCounts,
    totalCommitted: epics.length,
    totalDone,
  };
}
