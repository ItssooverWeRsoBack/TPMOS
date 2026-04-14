import { describe, it, expect } from "vitest";
import { computeWsjf, type VoteInput } from "../wsjf";

describe("computeWsjf", () => {
  describe("with no votes", () => {
    it("returns null score and null averages", () => {
      const result = computeWsjf([], 5);
      expect(result.score).toBeNull();
      expect(result.costOfDelay).toBeNull();
      expect(result.perDimensionAvg.value).toBeNull();
      expect(result.perDimensionAvg.criticality).toBeNull();
      expect(result.perDimensionAvg.risk).toBeNull();
      expect(result.perDimensionAvg.durationEstimate).toBeNull();
      expect(result.perDimensionVariance.value).toBeNull();
      expect(result.perDimensionVariance.criticality).toBeNull();
      expect(result.perDimensionVariance.risk).toBeNull();
      expect(result.voteCount).toBe(0);
    });
  });

  describe("with zero committed weeks", () => {
    it("returns null score even with votes", () => {
      const votes: VoteInput[] = [
        { value: 8, timeCriticality: 6, riskReduction: 9 },
      ];
      const result = computeWsjf(votes, 0);
      expect(result.score).toBeNull();
      expect(result.costOfDelay).toBe(23); // 8 + 6 + 9
      expect(result.voteCount).toBe(1);
    });

    it("returns null score with negative committed weeks", () => {
      const votes: VoteInput[] = [
        { value: 5, timeCriticality: 5, riskReduction: 5 },
      ];
      const result = computeWsjf(votes, -3);
      expect(result.score).toBeNull();
    });
  });

  describe("single voter", () => {
    it("computes correct WSJF", () => {
      const votes: VoteInput[] = [
        { value: 8, timeCriticality: 6, riskReduction: 4 },
      ];
      const result = computeWsjf(votes, 3);
      // WSJF = (8 + 6 + 4) / 3 = 6
      expect(result.score).toBe(6);
      expect(result.costOfDelay).toBe(18);
      expect(result.perDimensionAvg.value).toBe(8);
      expect(result.perDimensionAvg.criticality).toBe(6);
      expect(result.perDimensionAvg.risk).toBe(4);
      expect(result.voteCount).toBe(1);
    });

    it("returns null variance with single voter", () => {
      const votes: VoteInput[] = [
        { value: 8, timeCriticality: 6, riskReduction: 4 },
      ];
      const result = computeWsjf(votes, 3);
      expect(result.perDimensionVariance.value).toBeNull();
      expect(result.perDimensionVariance.criticality).toBeNull();
      expect(result.perDimensionVariance.risk).toBeNull();
    });
  });

  describe("multi-voter consensus (low variance)", () => {
    it("computes averages and low variance", () => {
      const votes: VoteInput[] = [
        { value: 8, timeCriticality: 7, riskReduction: 6 },
        { value: 9, timeCriticality: 7, riskReduction: 7 },
        { value: 8, timeCriticality: 8, riskReduction: 6 },
      ];
      const result = computeWsjf(votes, 4);

      // Averages: value=8.33, crit=7.33, risk=6.33
      expect(result.perDimensionAvg.value).toBeCloseTo(8.333, 2);
      expect(result.perDimensionAvg.criticality).toBeCloseTo(7.333, 2);
      expect(result.perDimensionAvg.risk).toBeCloseTo(6.333, 2);

      // WSJF = (8.33 + 7.33 + 6.33) / 4 = 22 / 4 = 5.5
      expect(result.costOfDelay).toBeCloseTo(22, 0);
      expect(result.score).toBeCloseTo(5.5, 1);

      // Low variance (team agrees)
      expect(result.perDimensionVariance.value).toBeCloseTo(0.333, 2);
      expect(result.perDimensionVariance.criticality).toBeCloseTo(0.333, 2);
      expect(result.perDimensionVariance.risk).toBeCloseTo(0.333, 2);

      expect(result.voteCount).toBe(3);
    });
  });

  describe("multi-voter divergence (high variance)", () => {
    it("computes high variance when team disagrees", () => {
      const votes: VoteInput[] = [
        { value: 2, timeCriticality: 9, riskReduction: 1 },
        { value: 10, timeCriticality: 1, riskReduction: 10 },
        { value: 5, timeCriticality: 5, riskReduction: 5 },
      ];
      const result = computeWsjf(votes, 2);

      // value variance: [2,10,5] → mean=5.67, var=16.33
      expect(result.perDimensionVariance.value).toBeCloseTo(16.333, 2);
      // crit variance: [9,1,5] → mean=5, var=16
      expect(result.perDimensionVariance.criticality).toBeCloseTo(16, 1);
      // risk variance: [1,10,5] → mean=5.33, var=20.33
      expect(result.perDimensionVariance.risk).toBeCloseTo(20.333, 2);

      expect(result.voteCount).toBe(3);
    });
  });

  describe("partial votes (some dimensions null)", () => {
    it("averages only filled dimensions", () => {
      const votes: VoteInput[] = [
        { value: 8, timeCriticality: null, riskReduction: 6 },
        { value: 6, timeCriticality: 7, riskReduction: null },
      ];
      const result = computeWsjf(votes, 3);

      expect(result.perDimensionAvg.value).toBe(7); // (8+6)/2
      expect(result.perDimensionAvg.criticality).toBe(7); // only one vote
      expect(result.perDimensionAvg.risk).toBe(6); // only one vote
      expect(result.voteCount).toBe(2);
    });

    it("returns null costOfDelay if any dimension has zero votes", () => {
      const votes: VoteInput[] = [
        { value: 8, timeCriticality: null, riskReduction: null },
      ];
      const result = computeWsjf(votes, 3);

      expect(result.perDimensionAvg.value).toBe(8);
      expect(result.perDimensionAvg.criticality).toBeNull();
      expect(result.costOfDelay).toBeNull();
      expect(result.score).toBeNull();
    });
  });

  describe("duration estimates", () => {
    it("computes average duration estimate", () => {
      const votes: VoteInput[] = [
        { value: 5, timeCriticality: 5, riskReduction: 5, durationEstimateWeeks: 4 },
        { value: 5, timeCriticality: 5, riskReduction: 5, durationEstimateWeeks: 6 },
        { value: 5, timeCriticality: 5, riskReduction: 5, durationEstimateWeeks: 8 },
      ];
      const result = computeWsjf(votes, 5);
      expect(result.perDimensionAvg.durationEstimate).toBe(6);
    });

    it("ignores null duration estimates", () => {
      const votes: VoteInput[] = [
        { value: 5, timeCriticality: 5, riskReduction: 5, durationEstimateWeeks: 4 },
        { value: 5, timeCriticality: 5, riskReduction: 5, durationEstimateWeeks: null },
      ];
      const result = computeWsjf(votes, 5);
      expect(result.perDimensionAvg.durationEstimate).toBe(4);
    });

    it("returns null when no duration estimates provided", () => {
      const votes: VoteInput[] = [
        { value: 5, timeCriticality: 5, riskReduction: 5 },
      ];
      const result = computeWsjf(votes, 5);
      expect(result.perDimensionAvg.durationEstimate).toBeNull();
    });
  });

  describe("edge cases", () => {
    it("handles all 1s", () => {
      const votes: VoteInput[] = [
        { value: 1, timeCriticality: 1, riskReduction: 1 },
      ];
      const result = computeWsjf(votes, 10);
      expect(result.score).toBe(0.3); // (1+1+1)/10
    });

    it("handles all 10s", () => {
      const votes: VoteInput[] = [
        { value: 10, timeCriticality: 10, riskReduction: 10 },
      ];
      const result = computeWsjf(votes, 1);
      expect(result.score).toBe(30); // (10+10+10)/1
    });

    it("handles fractional committed weeks", () => {
      const votes: VoteInput[] = [
        { value: 6, timeCriticality: 6, riskReduction: 6 },
      ];
      const result = computeWsjf(votes, 2.5);
      expect(result.score).toBeCloseTo(7.2, 1); // 18/2.5
    });

    it("handles votes with all null dimensions", () => {
      const votes: VoteInput[] = [
        { value: null, timeCriticality: null, riskReduction: null },
      ];
      const result = computeWsjf(votes, 5);
      expect(result.score).toBeNull();
      expect(result.voteCount).toBe(0); // no dimensions filled
    });

    it("two voters gives valid variance", () => {
      const votes: VoteInput[] = [
        { value: 3, timeCriticality: 3, riskReduction: 3 },
        { value: 7, timeCriticality: 7, riskReduction: 7 },
      ];
      const result = computeWsjf(votes, 2);
      // sample variance of [3,7] = (3-5)^2 + (7-5)^2 / (2-1) = 8
      expect(result.perDimensionVariance.value).toBe(8);
      expect(result.perDimensionVariance.criticality).toBe(8);
      expect(result.perDimensionVariance.risk).toBe(8);
    });
  });
});
