import { describe, it, expect } from "vitest";

describe("smoke test", () => {
  it("vitest is configured and running", () => {
    expect(1 + 1).toBe(2);
  });

  it("@/ alias resolves correctly", async () => {
    // This verifies the vitest path alias matches tsconfig
    const mod = await import("@/lib/tpmos/domain/__tests__/smoke.test");
    expect(mod).toBeDefined();
  });
});
