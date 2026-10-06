import { it, expect } from "vitest";
import { resolvePlanningQuarter } from "../planning-context";
import type { PlanningQuarter } from "../../schemas/planning-context";
const quarter = (id: string, state: PlanningQuarter["state"] = "planning", hasWebhook = false): PlanningQuarter => ({ id, state, hasWebhook, label: id, startDate: "2026-01-01", endDate: "2026-03-31", epicCount: 0, hasCapacity: false });
it("preserves explicit selected quarters, including history, without silently falling back on invalid input", () => {
  const qs = [quarter("active", "active"), quarter("practice", "planning", true), quarter("closed", "closed")];
  expect(resolvePlanningQuarter(qs, "active")).toBe("active");
  expect(resolvePlanningQuarter(qs, "closed")).toBe("closed");
  expect(resolvePlanningQuarter(qs, "missing")).toBeNull();
  expect(resolvePlanningQuarter([], "")).toBeNull();
});
it("defaults to the sole open webhook target but does not guess between multiple connected quarters", () => {
  expect(resolvePlanningQuarter([quarter("q2", "active"), quarter("practice", "planning", true)], null)).toBe("practice");
  expect(resolvePlanningQuarter([quarter("closed-hook", "closed", true), quarter("q2", "active")], null)).toBe("q2");
  expect(resolvePlanningQuarter([quarter("one", "planning", true), quarter("two", "planning", true), quarter("active", "active")], null)).toBe("active");
});
it("falls back to planning, then available history, or none", () => {
  expect(resolvePlanningQuarter([quarter("closed", "closed"), quarter("planning")], null)).toBe("planning");
  expect(resolvePlanningQuarter([quarter("closed", "closed")], null)).toBe("closed");
  expect(resolvePlanningQuarter([], null)).toBeNull();
});
