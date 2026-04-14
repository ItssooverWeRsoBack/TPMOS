import { describe, it, expect } from "vitest";
import { computeProgress, type ProgressEpic } from "../progress";

const Q_START = "2026-04-01";
const Q_END = "2026-06-30";

function makeDate(month: number, day: number): Date {
  return new Date(Date.UTC(2026, month - 1, day));
}

describe("computeProgress", () => {
  it("computes weighted completion correctly", () => {
    const epics: ProgressEpic[] = [
      { driCommittedWeeks: 4, percentComplete: 100, status: "done" },
      { driCommittedWeeks: 6, percentComplete: 50, status: "in_progress" },
    ];
    // weighted = (100*4 + 50*6) / (4+6) = (400+300)/10 = 70
    const result = computeProgress(epics, Q_START, Q_END, makeDate(5, 15));
    expect(result.weightedCompletion).toBe(70);
  });

  it("computes time elapsed at quarter start", () => {
    const result = computeProgress([], Q_START, Q_END, makeDate(4, 1));
    expect(result.timeElapsed).toBe(0);
  });

  it("computes time elapsed at quarter end", () => {
    const result = computeProgress([], Q_START, Q_END, makeDate(6, 30));
    expect(result.timeElapsed).toBe(100);
  });

  it("computes time elapsed at midpoint", () => {
    // Q2 is 91 days (Apr 1 - Jun 30). May 16 is day 45.
    const result = computeProgress([], Q_START, Q_END, makeDate(5, 16));
    expect(result.timeElapsed).toBeGreaterThan(45);
    expect(result.timeElapsed).toBeLessThan(55);
  });

  it("clamps time elapsed before quarter start", () => {
    const result = computeProgress([], Q_START, Q_END, makeDate(3, 1));
    expect(result.timeElapsed).toBe(0);
  });

  it("clamps time elapsed after quarter end", () => {
    const result = computeProgress([], Q_START, Q_END, makeDate(8, 1));
    expect(result.timeElapsed).toBe(100);
  });

  it("flags behind pace when completion lags by > threshold", () => {
    const epics: ProgressEpic[] = [
      { driCommittedWeeks: 10, percentComplete: 20, status: "in_progress" },
    ];
    // At 50% through quarter with 20% done → delta = 30 > 15 threshold
    const result = computeProgress(epics, Q_START, Q_END, makeDate(5, 16), 15);
    expect(result.behindPace).toBe(true);
    expect(result.paceDelta).toBeGreaterThan(15);
  });

  it("does not flag behind pace when on track", () => {
    const epics: ProgressEpic[] = [
      { driCommittedWeeks: 10, percentComplete: 45, status: "in_progress" },
    ];
    // At 50% through quarter with 45% done → delta = 5 < 15
    const result = computeProgress(epics, Q_START, Q_END, makeDate(5, 16), 15);
    expect(result.behindPace).toBe(false);
  });

  it("counts statuses correctly", () => {
    const epics: ProgressEpic[] = [
      { driCommittedWeeks: 3, percentComplete: 100, status: "done" },
      { driCommittedWeeks: 4, percentComplete: 50, status: "in_progress" },
      { driCommittedWeeks: 2, percentComplete: 0, status: "not_started" },
      { driCommittedWeeks: 5, percentComplete: 30, status: "at_risk" },
      { driCommittedWeeks: 3, percentComplete: 100, status: "done" },
    ];
    const result = computeProgress(epics, Q_START, Q_END, makeDate(5, 1));
    expect(result.statusCounts).toEqual({
      done: 2,
      in_progress: 1,
      not_started: 1,
      at_risk: 1,
    });
    expect(result.totalCommitted).toBe(5);
    expect(result.totalDone).toBe(2);
  });

  it("handles empty epics", () => {
    const result = computeProgress([], Q_START, Q_END, makeDate(5, 15));
    expect(result.weightedCompletion).toBe(0);
    expect(result.totalCommitted).toBe(0);
    expect(result.totalDone).toBe(0);
    expect(result.behindPace).toBe(false);
  });

  it("handles all zero-week epics", () => {
    const epics: ProgressEpic[] = [
      { driCommittedWeeks: 0, percentComplete: 50, status: "in_progress" },
    ];
    const result = computeProgress(epics, Q_START, Q_END, makeDate(5, 15));
    expect(result.weightedCompletion).toBe(0);
  });

  it("custom behind-pace threshold", () => {
    const epics: ProgressEpic[] = [
      { driCommittedWeeks: 10, percentComplete: 40, status: "in_progress" },
    ];
    // At 50% with 40% done → delta=10. Threshold 5 → behind. Threshold 15 → not behind.
    expect(computeProgress(epics, Q_START, Q_END, makeDate(5, 16), 5).behindPace).toBe(true);
    expect(computeProgress(epics, Q_START, Q_END, makeDate(5, 16), 15).behindPace).toBe(false);
  });
});
