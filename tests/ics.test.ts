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

  it("starts at 6pm Trinidad time (22:00 UTC) on 27 Dec 2026 and runs 3 hours", () => {
    expect(lines).toContain("DTSTART:20261227T220000Z");
    expect(lines).toContain("DTEND:20261228T010000Z");
    expect(lines).toContain("DTSTAMP:20260928T220000Z");
  });

  it("uses the first stop as the location and includes the full itinerary", () => {
    expect(lines).toContain(`SUMMARY:${event.title.replace(/,/g, "\\,")}`);
    expect(ics).toContain("LOCATION:Skallywag Bay\\, Chaguaramas\\, Trinidad");
    expect(ics).toContain("1. Mini golf: Skallywag Bay");
    expect(ics).toContain("2. Dinner afterward: Sails Restaurant & Pub");
    expect(ics).toContain("Powerboats Marina\\, Western Main Road\\, Chaguaramas");
    expect(ics).toContain(event.stops[0]!.mapUrl);
    expect(ics).toContain(event.stops[1]!.mapUrl);
    expect(lines.some((line) => line.startsWith("UID:"))).toBe(true);
  });

  it("escapes special characters", () => {
    const tricky = buildIcs({ ...event, title: "A; B, C\\D\nE" }, 0);
    expect(tricky).toContain("SUMMARY:A\\; B\\, C\\\\D\\nE");
  });
});

describe("event data", () => {
  it("matches the host's details", () => {
    expect(event.startsAt).toBe("2026-12-27T18:00:00-04:00");
    expect(event.stops).toEqual([
      {
        label: "Mini golf",
        name: "Skallywag Bay",
        address: "Chaguaramas, Trinidad",
        mapUrl: "https://www.google.com/maps/search/?api=1&query=Skallywag+Bay+Chaguaramas+Trinidad",
      },
      {
        label: "Dinner afterward",
        name: "Sails Restaurant & Pub",
        address: "Powerboats Marina, Western Main Road, Chaguaramas",
        mapUrl: "https://www.google.com/maps/search/?api=1&query=Sails+Restaurant+and+Pub+Chaguaramas+Trinidad",
      },
    ]);
    expect(event.budget).toBeNull();
  });
});
