/**
 * Planner line computation — determines which epics are above/below the capacity line.
 * Pure function, no I/O, no React. 100% Vitest branch coverage required.
 */

export interface PlannerEpic {
  id: string;
  weeks: number;
}

export interface LineResult {
  /** Indices of epics above the line (committed) */
  aboveLineIds: string[];
  /** Indices of epics below the line (stretch) */
  belowLineIds: string[];
  /** Index in the sorted array where cumulative weeks first exceeds available */
  lineIndex: number;
  /** Running cumulative sum, parallel to input array */
  cumulativeWeeks: number[];
  /** How many weeks over capacity (0 if under) */
  overcommitWeeks: number;
  /** Total committed weeks (above-line epics only) */
  committedWeeks: number;
}

/**
 * Compute the above/below line split for a sorted list of epics.
 * Epics are assumed to already be in priority order (sort_order ASC).
 */
export function computeLine(
  epics: PlannerEpic[],
  availableWeeks: number
): LineResult {
  const cumulative: number[] = [];
  let runningSum = 0;
  let lineIndex = epics.length; // default: all above

  for (let i = 0; i < epics.length; i++) {
    runningSum += epics[i].weeks;
    cumulative.push(runningSum);

    if (runningSum > availableWeeks && lineIndex === epics.length) {
      lineIndex = i + 1; // line is AFTER this epic (it still fits partially)
    }
  }

  // Recalculate: the line should be at the last epic whose cumulative fits
  lineIndex = epics.length;
  let cumulativeAtLine = 0;
  for (let i = 0; i < epics.length; i++) {
    cumulativeAtLine += epics[i].weeks;
    if (cumulativeAtLine > availableWeeks) {
      lineIndex = i;
      break;
    }
  }

  const aboveLineIds = epics.slice(0, lineIndex).map((e) => e.id);
  const belowLineIds = epics.slice(lineIndex).map((e) => e.id);
  const committedWeeks = cumulative[lineIndex - 1] ?? 0;
  const overcommitWeeks = Math.max(0, runningSum - availableWeeks);

  return {
    aboveLineIds,
    belowLineIds,
    lineIndex,
    cumulativeWeeks: cumulative,
    overcommitWeeks,
    committedWeeks,
  };
}

/**
 * Reorder epics by moving one epic from fromIndex to toIndex.
 * Returns the new ordered array of IDs.
 */
export function reorderEpics(
  epicIds: string[],
  fromIndex: number,
  toIndex: number
): string[] {
  const result = [...epicIds];
  const [moved] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, moved);
  return result;
}
