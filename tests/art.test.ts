import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

const dir = resolve(process.cwd(), "src/assets/art");

describe("illustration files", () => {
  it.each(readdirSync(dir))("%s is valid standalone SVG", (file) => {
    const svg = readFileSync(resolve(dir, file), "utf8");
    const doc = new DOMParser().parseFromString(svg, "image/svg+xml");
    expect(doc.getElementsByTagName("parsererror")).toHaveLength(0);
    expect(doc.documentElement.getAttribute("viewBox")).toMatch(/^0 0 \d+ \d+$/);
  });
});
