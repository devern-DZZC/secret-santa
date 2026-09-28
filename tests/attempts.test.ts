import { beforeEach, describe, expect, it } from "vitest";
import { LOCK_MS, MAX_FAILURES, createAttemptTracker } from "../src/lib/attempts";
import { createSafeStorage, safeStorage } from "../src/lib/storage";

let clock = 0;
const now = () => clock;

beforeEach(() => {
  clock = 1_000_000;
  localStorage.clear();
});

describe("wrong-PIN cooldown", () => {
  it("uses 5 tries and a 30 second pause", () => {
    expect(MAX_FAILURES).toBe(5);
    expect(LOCK_MS).toBe(30_000);
  });

  it("locks a name after 5 wrong PINs and unlocks it 30 seconds later", () => {
    const t = createAttemptTracker({ now });
    for (let i = 0; i < 4; i++) t.recordFailure("devern");
    expect(t.isLocked("devern")).toBe(false);
    expect(t.failuresLeft("devern")).toBe(1);
    t.recordFailure("devern");
    expect(t.isLocked("devern")).toBe(true);
    expect(t.lockRemainingMs("devern")).toBe(30_000);
    clock += 29_999;
    expect(t.isLocked("devern")).toBe(true);
    expect(t.lockRemainingMs("devern")).toBe(1);
    clock += 1;
    expect(t.isLocked("devern")).toBe(false);
    expect(t.lockRemainingMs("devern")).toBe(0);
    expect(t.failuresLeft("devern")).toBe(5);
  });

  it("a lock on one name doesn't affect other names", () => {
    const t = createAttemptTracker({ now });
    for (let i = 0; i < 5; i++) t.recordFailure("devern");
    expect(t.isLocked("devern")).toBe(true);
    expect(t.isLocked("feisha")).toBe(false);
  });

  it("a correct PIN resets the counter", () => {
    const t = createAttemptTracker({ now });
    for (let i = 0; i < 4; i++) t.recordFailure("devern");
    t.recordSuccess("devern");
    t.recordFailure("devern");
    expect(t.isLocked("devern")).toBe(false);
    expect(t.failuresLeft("devern")).toBe(4);
  });

  it("failures while locked don't extend the lock", () => {
    const t = createAttemptTracker({ now });
    for (let i = 0; i < 5; i++) t.recordFailure("devern");
    clock += 10_000;
    t.recordFailure("devern");
    expect(t.lockRemainingMs("devern")).toBe(20_000);
  });

  it("survives a page reload through storage", () => {
    for (let i = 0; i < 5; i++) createAttemptTracker({ now }).recordFailure("devern");
    expect(createAttemptTracker({ now }).isLocked("devern")).toBe(true);
  });

  it("uses the real clock and storage by default", () => {
    const t = createAttemptTracker();
    t.recordFailure("reyan");
    expect(t.failuresLeft("reyan")).toBe(4);
    expect(safeStorage.get("ss:attempts")).toContain("reyan");
  });

  it("still works in memory when storage is blocked or garbled", () => {
    const blocked = createSafeStorage(() => {
      throw new Error("blocked");
    });
    const t = createAttemptTracker({ now, store: blocked });
    for (let i = 0; i < 5; i++) t.recordFailure("devern");
    expect(t.isLocked("devern")).toBe(true);

    localStorage.setItem("ss:attempts", "{garbled");
    expect(createAttemptTracker({ now }).isLocked("devern")).toBe(false);
    localStorage.setItem("ss:attempts", "[1,2]");
    expect(createAttemptTracker({ now }).failuresLeft("devern")).toBe(5);
  });
});
