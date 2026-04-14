import { describe, it, expect } from "vitest";
import {
  computeAvailableWeeks,
  memberCountToWeeks,
  getCapacityState,
} from "../capacity";

describe("computeAvailableWeeks", () => {
  it("computes normal case", () => {
    const result = computeAvailableWeeks({
      totalMemberWeeks: 52, // 4 members × 13 weeks
      vacationWeeks: 4,
      techDebtWeeks: 5,
      otherOverheadWeeks: 3,
    });
    expect(result.availableWeeks).toBe(40);
    expect(result.totalMemberWeeks).toBe(52);
    expect(result.totalOverheadWeeks).toBe(12);
    expect(result.overheadPercent).toBeCloseTo(23.08, 1);
  });

  it("returns zero when overhead exceeds capacity", () => {
    const result = computeAvailableWeeks({
      totalMemberWeeks: 10,
      vacationWeeks: 5,
      techDebtWeeks: 5,
      otherOverheadWeeks: 5,
    });
    expect(result.availableWeeks).toBe(0);
    expect(result.totalOverheadWeeks).toBe(15);
  });

  it("clamps negative totalMemberWeeks to zero", () => {
    const result = computeAvailableWeeks({
      totalMemberWeeks: -10,
      vacationWeeks: 0,
      techDebtWeeks: 0,
      otherOverheadWeeks: 0,
    });
    expect(result.availableWeeks).toBe(0);
    expect(result.totalMemberWeeks).toBe(0);
    expect(result.overheadPercent).toBe(0);
  });

  it("clamps negative overhead inputs to zero", () => {
    const result = computeAvailableWeeks({
      totalMemberWeeks: 26,
      vacationWeeks: -2,
      techDebtWeeks: -1,
      otherOverheadWeeks: -3,
    });
    expect(result.availableWeeks).toBe(26);
    expect(result.totalOverheadWeeks).toBe(0);
  });

  it("handles all zeros", () => {
    const result = computeAvailableWeeks({
      totalMemberWeeks: 0,
      vacationWeeks: 0,
      techDebtWeeks: 0,
      otherOverheadWeeks: 0,
    });
    expect(result.availableWeeks).toBe(0);
    expect(result.totalMemberWeeks).toBe(0);
    expect(result.overheadPercent).toBe(0);
  });

  it("handles fractional weeks", () => {
    const result = computeAvailableWeeks({
      totalMemberWeeks: 13.5,
      vacationWeeks: 1.5,
      techDebtWeeks: 0.5,
      otherOverheadWeeks: 0,
    });
    expect(result.availableWeeks).toBe(11.5);
    expect(result.totalOverheadWeeks).toBe(2);
  });

  it("computes 100% overhead", () => {
    const result = computeAvailableWeeks({
      totalMemberWeeks: 10,
      vacationWeeks: 10,
      techDebtWeeks: 0,
      otherOverheadWeeks: 0,
    });
    expect(result.availableWeeks).toBe(0);
    expect(result.overheadPercent).toBe(100);
  });
});

describe("memberCountToWeeks", () => {
  it("computes default 13-week quarter", () => {
    expect(memberCountToWeeks(4)).toBe(52);
  });

  it("uses custom quarter length", () => {
    expect(memberCountToWeeks(3, 12)).toBe(36);
  });

  it("clamps negative member count", () => {
    expect(memberCountToWeeks(-2)).toBe(0);
  });

  it("clamps negative quarter length", () => {
    expect(memberCountToWeeks(4, -1)).toBe(0);
  });

  it("handles zero members", () => {
    expect(memberCountToWeeks(0)).toBe(0);
  });
});

describe("getCapacityState", () => {
  it("returns 'under' when < 70% utilized", () => {
    expect(getCapacityState(5, 40)).toBe("under");
    expect(getCapacityState(0, 40)).toBe("under");
    expect(getCapacityState(27, 40)).toBe("under"); // 67.5%
  });

  it("returns 'healthy' when 70-90%", () => {
    expect(getCapacityState(28, 40)).toBe("healthy"); // 70%
    expect(getCapacityState(32, 40)).toBe("healthy"); // 80%
    expect(getCapacityState(35, 40)).toBe("healthy"); // 87.5%
  });

  it("returns 'tight' when 90-100%", () => {
    expect(getCapacityState(36.1, 40)).toBe("tight"); // 90.25%
    expect(getCapacityState(39, 40)).toBe("tight"); // 97.5%
    expect(getCapacityState(40, 40)).toBe("tight"); // 100% exactly
  });

  it("returns 'over' when > 100%", () => {
    expect(getCapacityState(41, 40)).toBe("over");
    expect(getCapacityState(80, 40)).toBe("over");
  });

  it("handles zero available weeks", () => {
    expect(getCapacityState(0, 0)).toBe("under");
    expect(getCapacityState(5, 0)).toBe("over");
  });

  it("handles negative available weeks", () => {
    expect(getCapacityState(0, -1)).toBe("under");
    expect(getCapacityState(1, -1)).toBe("over");
  });
});
