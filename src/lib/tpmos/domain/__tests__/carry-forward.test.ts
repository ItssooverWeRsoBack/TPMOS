import { describe, it, expect } from "vitest";
import {
  buildCarryForwardDrafts,
  getEligibleForCarryForward,
  type SourceEpic,
} from "../carry-forward";

const base: SourceEpic = {
  id: "epic-1",
  title: "Auth migration",
  description: "Migrate to OAuth",
  definitionOfDone: "All services use OAuth",
  driUserId: "user-1",
  driCommittedWeeks: 4,
  status: "in_progress",
  percentComplete: 50,
};

describe("buildCarryForwardDrafts", () => {
  it("carries an in-progress epic", () => {
    const drafts = buildCarryForwardDrafts([base], ["epic-1"]);
    expect(drafts).toHaveLength(1);
    expect(drafts[0].title).toBe("Auth migration");
    expect(drafts[0].description).toBe("Migrate to OAuth");
    expect(drafts[0].definitionOfDone).toBe("All services use OAuth");
    expect(drafts[0].driUserId).toBe("user-1");
    expect(drafts[0].driCommittedWeeks).toBe(4);
    expect(drafts[0].carriedFromEpicId).toBe("epic-1");
  });

  it("filters out done epics", () => {
    const done = { ...base, id: "epic-2", status: "done" };
    const drafts = buildCarryForwardDrafts([base, done], ["epic-1", "epic-2"]);
    expect(drafts).toHaveLength(1);
    expect(drafts[0].carriedFromEpicId).toBe("epic-1");
  });

  it("filters out cancelled epics", () => {
    const cancelled = { ...base, id: "epic-3", status: "cancelled" };
    const drafts = buildCarryForwardDrafts([cancelled], ["epic-3"]);
    expect(drafts).toHaveLength(0);
  });

  it("skips IDs not found in source", () => {
    const drafts = buildCarryForwardDrafts([base], ["nonexistent"]);
    expect(drafts).toHaveLength(0);
  });

  it("handles empty selected IDs", () => {
    const drafts = buildCarryForwardDrafts([base], []);
    expect(drafts).toHaveLength(0);
  });

  it("handles empty source epics", () => {
    const drafts = buildCarryForwardDrafts([], ["epic-1"]);
    expect(drafts).toHaveLength(0);
  });

  it("carries multiple epics preserving order", () => {
    const epics = [
      { ...base, id: "a", title: "Alpha" },
      { ...base, id: "b", title: "Bravo" },
      { ...base, id: "c", title: "Charlie" },
    ];
    const drafts = buildCarryForwardDrafts(epics, ["c", "a"]);
    expect(drafts.map((d) => d.title)).toEqual(["Charlie", "Alpha"]);
  });

  it("preserves null fields", () => {
    const epic = { ...base, description: null, definitionOfDone: null, driUserId: null };
    const [draft] = buildCarryForwardDrafts([epic], [epic.id]);
    expect(draft.description).toBeNull();
    expect(draft.definitionOfDone).toBeNull();
    expect(draft.driUserId).toBeNull();
  });

  it("carries blocked and at_risk epics", () => {
    const blocked = { ...base, id: "b1", status: "blocked" };
    const atRisk = { ...base, id: "b2", status: "at_risk" };
    const notStarted = { ...base, id: "b3", status: "not_started" };
    const drafts = buildCarryForwardDrafts(
      [blocked, atRisk, notStarted],
      ["b1", "b2", "b3"]
    );
    expect(drafts).toHaveLength(3);
  });
});

describe("getEligibleForCarryForward", () => {
  it("returns non-done, non-cancelled epics", () => {
    const epics = [
      { ...base, id: "1", status: "in_progress" },
      { ...base, id: "2", status: "done" },
      { ...base, id: "3", status: "blocked" },
      { ...base, id: "4", status: "cancelled" },
      { ...base, id: "5", status: "at_risk" },
      { ...base, id: "6", status: "not_started" },
    ];
    const eligible = getEligibleForCarryForward(epics);
    expect(eligible.map((e) => e.id)).toEqual(["1", "3", "5", "6"]);
  });

  it("returns empty for all-done list", () => {
    const epics = [{ ...base, status: "done" }];
    expect(getEligibleForCarryForward(epics)).toHaveLength(0);
  });

  it("returns empty for empty list", () => {
    expect(getEligibleForCarryForward([])).toHaveLength(0);
  });
});
