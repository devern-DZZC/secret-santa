/**
 * Copies the Christmas illustrations the app uses out of Microsoft's Fluent Emoji
 * (flat style, MIT licence, https://github.com/microsoft/fluentui-emoji) into
 * src/assets/art as plain SVG files. Run: node scripts/art/extract.mjs
 */
import { writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { getIconData, iconToHTML, iconToSVG } from "@iconify/utils";

const require = createRequire(import.meta.url);
const set = require("@iconify-json/fluent-emoji-flat/icons.json");

const NAMES = [
  "santa-claus", "deer", "sled", "christmas-tree", "evergreen-tree", "wrapped-gift", "snowman",
  "bell", "star", "glowing-star", "cookie", "socks", "candle", "snowflake", "house-with-garden",
  "ribbon", "sparkles",
];

for (const name of NAMES) {
  const data = getIconData(set, name);
  if (!data) throw new Error(`Missing icon: ${name}`);
  const svg = iconToSVG(data, { height: "auto" });
  const html = iconToHTML(svg.body, svg.attributes); // already includes xmlns
  writeFileSync(new URL(`../../src/assets/art/${name}.svg`, import.meta.url), html);
}
console.log(`Wrote ${NAMES.length} illustrations.`);
