import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const html = readFileSync(resolve(process.cwd(), "index.html"), "utf8");
const image = readFileSync(resolve(process.cwd(), "public/og-secret-santa-chaguaramas.png"));
const legacyImage = readFileSync(resolve(process.cwd(), "public/og-image.png"));

describe("social preview metadata", () => {
  it("describes the current Chaguaramas event and uses the versioned artwork", () => {
    expect(html).toContain("Sunday 27 December at 6pm");
    expect(html).toContain("Skallywag Bay");
    expect(html).toContain("Sails Restaurant &amp; Pub");
    expect(html).toContain("og-secret-santa-chaguaramas.png");
    expect(html).not.toMatch(/The Alley|7pm/i);
  });

  it("ships a 1200 by 630 PNG at both the current and legacy image URLs", () => {
    expect(image.subarray(1, 4).toString()).toBe("PNG");
    expect(image.readUInt32BE(16)).toBe(1200);
    expect(image.readUInt32BE(20)).toBe(630);
    expect(legacyImage.equals(image)).toBe(true);
  });
});
