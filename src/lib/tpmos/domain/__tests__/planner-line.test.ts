import { describe, it, expect } from "vitest";
import { computeLine, reorderEpics } from "../planner-line";

describe("computeLine", () => {
  it("all epics fit above the line", () => {
    const epics = [
      { id: "a", weeks: 3 },
      { id: "b", weeks: 4 },
      { id: "c", weeks: 2 },
    ];
    const result = computeLine(epics, 20);
    expect(result.aboveLineIds).toEqual(["a", "b", "c"]);
    expect(result.belowLineIds).toEqual([]);
    expect(result.lineIndex).toBe(3);
    expect(result.cumulativeWeeks).toEqual([3, 7, 9]);
    expect(result.overcommitWeeks).toBe(0);
    expect(result.committedWeeks).toBe(9);
  });

  it("some epics below the line", () => {
    const epics = [
      { id: "a", weeks: 5 },
      { id: "b", weeks: 5 },
      { id: "c", weeks: 5 },
      { id: "d", weeks: 5 },
    ];
    const result = computeLine(epics, 12);
    expect(result.aboveLineIds).toEqual(["a", "b"]);
    expect(result.belowLineIds).toEqual(["c", "d"]);
    expect(result.lineIndex).toBe(2);
    expect(result.cumulativeWeeks).toEqual([5, 10, 15, 20]);
    expect(result.overcommitWeeks).toBe(8);
    expect(result.committedWeeks).toBe(10);
  });

  it("exact fit — all above", () => {
    const epics = [
      { id: "a", weeks: 5 },
      { id: "b", weeks: 5 },
    ];
    const result = computeLine(epics, 10);
    expect(result.aboveLineIds).toEqual(["a", "b"]);
    expect(result.belowLineIds).toEqual([]);
    expect(result.lineIndex).toBe(2);
    expect(result.overcommitWeeks).toBe(0);
    expect(result.committedWeeks).toBe(10);
  });

  it("first epic exceeds capacity", () => {
    const epics = [
      { id: "a", weeks: 15 },
      { id: "b", weeks: 3 },
    ];
    const result = computeLine(epics, 10);
    expect(result.aboveLineIds).toEqual([]);
    expect(result.belowLineIds).toEqual(["a", "b"]);
    expect(result.lineIndex).toBe(0);
    expect(result.overcommitWeeks).toBe(8);
  });

  it("zero available weeks — all below", () => {
    const epics = [
      { id: "a", weeks: 3 },
      { id: "b", weeks: 2 },
    ];
    const result = computeLine(epics, 0);
    expect(result.aboveLineIds).toEqual([]);
    expect(result.belowLineIds).toEqual(["a", "b"]);
    expect(result.lineIndex).toBe(0);
  });

  it("empty epics list", () => {
    const result = computeLine([], 20);
    expect(result.aboveLineIds).toEqual([]);
    expect(result.belowLineIds).toEqual([]);
    expect(result.lineIndex).toBe(0);
    expect(result.cumulativeWeeks).toEqual([]);
    expect(result.overcommitWeeks).toBe(0);
    expect(result.committedWeeks).toBe(0);
  });

  it("single epic that fits", () => {
    const result = computeLine([{ id: "a", weeks: 5 }], 10);
    expect(result.aboveLineIds).toEqual(["a"]);
    expect(result.belowLineIds).toEqual([]);
    expect(result.committedWeeks).toBe(5);
  });

  it("single epic that doesn't fit", () => {
    const result = computeLine([{ id: "a", weeks: 15 }], 10);
    expect(result.aboveLineIds).toEqual([]);
    expect(result.belowLineIds).toEqual(["a"]);
    expect(result.overcommitWeeks).toBe(5);
  });

  it("handles zero-week epics", () => {
    const epics = [
      { id: "a", weeks: 0 },
      { id: "b", weeks: 5 },
      { id: "c", weeks: 0 },
    ];
    const result = computeLine(epics, 5);
    expect(result.aboveLineIds).toEqual(["a", "b", "c"]);
    expect(result.cumulativeWeeks).toEqual([0, 5, 5]);
    expect(result.committedWeeks).toBe(5);
  });

  it("handles fractional weeks", () => {
    const epics = [
      { id: "a", weeks: 2.5 },
      { id: "b", weeks: 3.7 },
      { id: "c", weeks: 1.8 },
    ];
    const result = computeLine(epics, 6);
    expect(result.aboveLineIds).toEqual(["a"]);
    expect(result.belowLineIds).toEqual(["b", "c"]);
    expect(result.lineIndex).toBe(1);
    expect(result.cumulativeWeeks[0]).toBeCloseTo(2.5);
    expect(result.cumulativeWeeks[1]).toBeCloseTo(6.2);
  });
});

describe("reorderEpics", () => {
  it("moves an epic forward", () => {
    expect(reorderEpics(["a", "b", "c", "d"], 0, 2)).toEqual(["b", "c", "a", "d"]);
  });

  it("moves an epic backward", () => {
    expect(reorderEpics(["a", "b", "c", "d"], 3, 1)).toEqual(["a", "d", "b", "c"]);
  });

  it("no-op when from === to", () => {
    expect(reorderEpics(["a", "b", "c"], 1, 1)).toEqual(["a", "b", "c"]);
  });

  it("move to start", () => {
    expect(reorderEpics(["a", "b", "c"], 2, 0)).toEqual(["c", "a", "b"]);
  });

  it("move to end", () => {
    expect(reorderEpics(["a", "b", "c"], 0, 2)).toEqual(["b", "c", "a"]);
  });

  it("single element", () => {
    expect(reorderEpics(["a"], 0, 0)).toEqual(["a"]);
  });

  it("does not mutate original", () => {
    const original = ["a", "b", "c"];
    reorderEpics(original, 0, 2);
    expect(original).toEqual(["a", "b", "c"]);
  });
});
