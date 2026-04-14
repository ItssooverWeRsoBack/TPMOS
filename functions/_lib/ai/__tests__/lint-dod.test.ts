import { describe, it, expect } from "vitest";
import { regexLintDoD } from "../prompts/lint-dod";

describe("regexLintDoD", () => {
  it("flags 'ship the feature'", () => {
    const issues = regexLintDoD("Ship the feature to production");
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0]).toContain("Vague");
  });

  it("flags 'make it better'", () => {
    const issues = regexLintDoD("Make it better and faster");
    expect(issues.length).toBeGreaterThan(0);
  });

  it("flags 'complete the task'", () => {
    const issues = regexLintDoD("Complete the task and deploy");
    expect(issues.length).toBeGreaterThan(0);
  });

  it("flags 'done when ready'", () => {
    const issues = regexLintDoD("Done when ready for review");
    expect(issues.length).toBeGreaterThan(0);
  });

  it("flags 'get it working'", () => {
    const issues = regexLintDoD("Get it working in staging");
    expect(issues.length).toBeGreaterThan(0);
  });

  it("flags lack of measurability in long text", () => {
    const issues = regexLintDoD("Deploy the new authentication system and verify it works correctly across all environments");
    expect(issues.some((i) => i.includes("measurable"))).toBe(true);
  });

  it("flags very short DoD", () => {
    const issues = regexLintDoD("Done");
    expect(issues.some((i) => i.includes("Very short"))).toBe(true);
  });

  it("passes a well-written DoD", () => {
    const goodDoD = `- All API endpoints return < 200ms at p99 latency
- Error rate stays below 0.1% for 7 days post-deploy
- Integration tests pass with 95% coverage on the auth module
- Security team approves the implementation`;
    const issues = regexLintDoD(goodDoD);
    expect(issues).toEqual([]);
  });

  it("passes DoD with percentage metrics", () => {
    const issues = regexLintDoD("Test coverage reaches 90 percent for the new module and error rate is below 1 percent");
    expect(issues).toEqual([]);
  });

  it("passes DoD with numeric criteria", () => {
    const issues = regexLintDoD("Response time under 100ms, handles 5000 concurrent users, 99.9% uptime");
    expect(issues).toEqual([]);
  });
});
