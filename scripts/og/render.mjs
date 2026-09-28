// Renders public/og-image.png (the WhatsApp/iMessage link preview). Run: node scripts/og/render.mjs
import { chromium } from "@playwright/test";
import { fileURLToPath } from "node:url";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
await p.goto(new URL("./og.html", import.meta.url).href);
await p.waitForTimeout(500);
await p.screenshot({ path: fileURLToPath(new URL("../../public/og-image.png", import.meta.url)) });
await b.close();
