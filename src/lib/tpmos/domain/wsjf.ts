/**
 * WSJF (Weighted Shortest Job First) computation — pure function, no I/O.
 * 100% Vitest branch coverage required.
 *
 * Formula: WSJF = (avg(value) + avg(criticality) + avg(risk_reduction)) / committed_weeks
 *
 * Also computes per-dimension variance for the consensus heatmap.
 */

export interface VoteInput {
  value: number | null;
  timeCriticality: number | null;
  riskReduction: number | null;
  durationEstimateWeeks?: number | null;
}

export interface WsjfResult {
  /** WSJF score, or null if no votes or committedWeeks <= 0 */
  score: number | null;
  /** Average per dimension (only from votes that have the dimension filled) */
  perDimensionAvg: {
    value: number | null;
    criticality: number | null;
    risk: number | null;
    durationEstimate: number | null;
  };
  /** Sample variance per dimension (null if < 2 votes) */
  perDimensionVariance: {
    value: number | null;
    criticality: number | null;
    risk: number | null;
  };
  /** Total count of votes with at least one dimension filled */
  voteCount: number;
  /** Sum of dimension averages (numerator of WSJF) */
  costOfDelay: number | null;
}

function avg(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function sampleVariance(values: number[]): number | null {
  if (values.length < 2) return null;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const sumSqDiff = values.reduce((sum, v) => sum + (v - mean) ** 2, 0);
  return sumSqDiff / (values.length - 1);
}

export function computeWsjf(votes: VoteInput[], committedWeeks: number): WsjfResult {
  const values = votes.map((v) => v.value).filter((v): v is number => v !== null);
  const criticalities = votes.map((v) => v.timeCriticality).filter((v): v is number => v !== null);
  const risks = votes.map((v) => v.riskReduction).filter((v): v is number => v !== null);
  const durations = votes
    .map((v) => v.durationEstimateWeeks)
    .filter((v): v is number => v !== null && v !== undefined);

  const avgValue = avg(values);
  const avgCriticality = avg(criticalities);
  const avgRisk = avg(risks);
  const avgDuration = avg(durations);

  const voteCount = votes.filter(
    (v) => v.value !== null || v.timeCriticality !== null || v.riskReduction !== null
  ).length;

  // Cost of delay = sum of dimension averages (only if all three have at least one vote)
  const costOfDelay =
    avgValue !== null && avgCriticality !== null && avgRisk !== null
      ? avgValue + avgCriticality + avgRisk
      : null;

  // WSJF = costOfDelay / committedWeeks
  const score =
    costOfDelay !== null && committedWeeks > 0
      ? costOfDelay / committedWeeks
      : null;

  return {
    score,
    perDimensionAvg: {
      value: avgValue,
      criticality: avgCriticality,
      risk: avgRisk,
      durationEstimate: avgDuration,
    },
    perDimensionVariance: {
      value: sampleVariance(values),
      criticality: sampleVariance(criticalities),
      risk: sampleVariance(risks),
    },
    voteCount,
    costOfDelay,
  };
}
