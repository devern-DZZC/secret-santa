import { describe, expect, it, vi } from "vitest";

vi.mock("../src/lib/drawStore", () => ({ getReceiverId: () => "not-a-cousin" }));

describe("a corrupted draw", () => {
  it("fails closed: a correct PIN returns null instead of a broken giftee", async () => {
    const { unlock } = await import("../src/lib/unlock");
    expect(unlock("devern", "2004")).toBeNull();
  });
});
