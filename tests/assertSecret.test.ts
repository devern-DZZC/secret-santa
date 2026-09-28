import { describe, expect, it } from "vitest";
import { SecretAssertionError, assertSecret } from "./helpers/assertSecret";

describe("assertSecret (keeps failing draw checks spoiler-free)", () => {
  it("passes silently when the condition holds", () => {
    expect(() => assertSecret(true, "label")).not.toThrow();
  });

  it("fails with only the label, never the compared values", () => {
    const secret = "dana";
    try {
      assertSecret(secret === ("brandon" as string), "rule check failed");
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(SecretAssertionError);
      expect((e as Error).message).toBe("rule check failed");
      expect((e as Error).stack).not.toContain(secret);
    }
  });
});
