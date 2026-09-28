import { beforeEach, describe, expect, it } from "vitest";
import { createSafeStorage, safeStorage } from "../src/lib/storage";
import { forgetUnlock, getRemembered, rememberUnlock } from "../src/lib/remember";

const throwingBackend = () => {
  throw new Error("SecurityError: storage is blocked");
};
const brokenMethods = {
  getItem() { throw new Error("blocked"); },
  setItem() { throw new Error("quota"); },
  removeItem() { throw new Error("blocked"); },
} as unknown as Storage;

beforeEach(() => localStorage.clear());

describe("safeStorage", () => {
  it("reads, writes and removes through localStorage", () => {
    safeStorage.set("k", "v");
    expect(safeStorage.get("k")).toBe("v");
    expect(localStorage.getItem("k")).toBe("v");
    safeStorage.remove("k");
    expect(safeStorage.get("k")).toBeNull();
  });

  it("never throws when storage is unavailable (private mode, blocked cookies)", () => {
    for (const s of [createSafeStorage(throwingBackend), createSafeStorage(() => brokenMethods)]) {
      expect(() => s.set("k", "v")).not.toThrow();
      expect(s.get("k")).toBeNull();
      expect(() => s.remove("k")).not.toThrow();
    }
  });
});

describe("remembered unlock", () => {
  it("remembers one person and their PIN on this device", () => {
    rememberUnlock("feisha", "2356");
    expect(getRemembered()).toEqual({ id: "feisha", pin: "2356" });
  });

  it("unlocking someone else replaces the remembered person", () => {
    rememberUnlock("feisha", "2356");
    rememberUnlock("devern", "2004");
    expect(getRemembered()).toEqual({ id: "devern", pin: "2004" });
  });

  it("switching person forgets the unlock", () => {
    rememberUnlock("feisha", "2356");
    forgetUnlock();
    expect(getRemembered()).toBeNull();
  });

  it("ignores missing or garbled saved data", () => {
    expect(getRemembered()).toBeNull();
    localStorage.setItem("ss:remembered", "{not json");
    expect(getRemembered()).toBeNull();
    localStorage.setItem("ss:remembered", JSON.stringify({ id: 5 }));
    expect(getRemembered()).toBeNull();
    localStorage.setItem("ss:remembered", "null");
    expect(getRemembered()).toBeNull();
  });

  it("works (without remembering) when storage is blocked", () => {
    const blocked = createSafeStorage(throwingBackend);
    expect(() => rememberUnlock("feisha", "2356", blocked)).not.toThrow();
    expect(getRemembered(blocked)).toBeNull();
    expect(() => forgetUnlock(blocked)).not.toThrow();
  });
});
