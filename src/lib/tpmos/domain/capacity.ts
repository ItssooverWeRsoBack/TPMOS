/**
 * Capacity domain logic — pure functions, no I/O, no React.
 * 100% Vitest branch coverage required.
 */

export interface CapacityInput {
  /** Total member-weeks in the quarter (members × weeks_per_quarter) */
  totalMemberWeeks: number;
  /** Weeks consumed by planned vacation */
  vacationWeeks: number;
  /** Weeks allocated for tech debt / maintenance */
  techDebtWeeks: number;
  /** Other overhead: on-call, interviews, training, etc. */
  otherOverheadWeeks: number;
}

export interface CapacityResult {
  /** Weeks available for epic work */
  availableWeeks: number;
  /** Total raw capacity before deductions */
  totalMemberWeeks: number;
  /** Sum of all deductions */
  totalOverheadWeeks: number;
  /** Percentage of capacity consumed by overhead */
  overheadPercent: number;
}

/**
 * Compute available capacity for a team in a quarter.
 * All negative inputs are clamped to 0.
 * Available weeks is floored at 0 (never negative).
 */
export function computeAvailableWeeks(input: CapacityInput): CapacityResult {
  const total = Math.max(0, input.totalMemberWeeks);
  const vacation = Math.max(0, input.vacationWeeks);
  const techDebt = Math.max(0, input.techDebtWeeks);
  const other = Math.max(0, input.otherOverheadWeeks);

  const totalOverhead = vacation + techDebt + other;
  const available = Math.max(0, total - totalOverhead);
  const overheadPercent = total > 0 ? (totalOverhead / total) * 100 : 0;

  return {
    availableWeeks: available,
    totalMemberWeeks: total,
    totalOverheadWeeks: totalOverhead,
    overheadPercent,
  };
}

/**
 * Compute total member weeks from headcount and weeks per quarter.
 * Default quarter length is 13 weeks.
 */
export function memberCountToWeeks(
  memberCount: number,
  weeksPerQuarter: number = 13
): number {
  return Math.max(0, memberCount) * Math.max(0, weeksPerQuarter);
}

/**
 * Capacity utilization state for UI color coding.
 */
export type CapacityState = "under" | "healthy" | "tight" | "over";

/**
 * Determine the capacity state based on committed weeks vs available weeks.
 * - under: < 70% utilized
 * - healthy: 70-90%
 * - tight: 90-100%
 * - over: > 100%
 */
export function getCapacityState(
  committedWeeks: number,
  availableWeeks: number
): CapacityState {
  if (availableWeeks <= 0) return committedWeeks > 0 ? "over" : "under";
  const ratio = committedWeeks / availableWeeks;
  if (ratio > 1) return "over";
  if (ratio >= 0.9) return "tight";
  if (ratio >= 0.7) return "healthy";
  return "under";
}
