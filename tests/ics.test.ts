import { describe, expect, it } from "vitest";
import { buildIcs } from "../src/lib/ics";
import { event } from "../src/data/event";

describe("add-to-calendar file", () => {
  const ics = buildIcs(event, Date.parse("2026-09-28T22:00:00Z"));
  const lines = ics.split("\r\n");

  it("is a valid VCALENDAR with one VEVENT and CRLF line endings", () => {
    expect(lines[0]).toBe("BEGIN:VCALENDAR");
    expect(lines).toContain("VERSION:2.0");
    expect(lines).toContain("BEGIN:VEVENT");
    expect(lines).toContain("END:VEVENT");
    expect(lines.at(-2)).toBe("END:VCALENDAR");
    expect(ics.endsWith("\r\n")).toBe(true);
    expect(ics.replace(/\r\n/g, "")).not.toContain("\n");
  });

  it("starts at 7pm Trinidad time (23:00 UTC) on 27 Dec 2026 and runs 3 hours", () => {
    expect(lines).toContain("DTSTART:20261227T230000Z");
    expect(lines).toContain("DTEND:20261228T020000Z");
    expect(lines).toContain("DTSTAMP:20260928T220000Z");
  });

  it("includes the title and escaped location", () => {
    expect(lines).toContain(`SUMMARY:${event.title.replace(/,/g, "\\,")}`);
    expect(ics).toContain("LOCATION:The Alley\\, East Gates Mall\\, Trincity\\, Trinidad");
    expect(lines.some((l) => l.startsWith("UID:"))).toBe(true);
  });

  it("escapes special characters", () => {
    const tricky = buildIcs({ ...event, title: "A; B, C\\D\nE" }, 0);
    expect(tricky).toContain("SUMMARY:A\; B\\, C\\\\D\\nE");
  });
});

describe("event data", () => {
  it("matches the host's details", () => {
    expect(event.startsAt).toBe("2026-12-27T19:00:00-04:00");
    expect(event.venueName).toBe("The Alley");
    expect(event.address).toBe("East Gates Mall, Trincity, Trinidad");
    expect(event.mapUrl).toMatch(/^https:\/\/www\.google\.com\/maps\/search\/\?api=1&query=/);
    expect(event.budget).toBeNull();
  });
});
