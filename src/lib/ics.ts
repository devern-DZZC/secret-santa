import type { EventDetails } from "../data/event";

const escape = (text: string) =>
  text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

const stamp = (ms: number) => new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

/** Builds an .ics calendar file for the exchange. */
export function buildIcs(event: EventDetails, nowMs: number): string {
  const start = Date.parse(event.startsAt);
  const end = start + event.durationHours * 3_600_000;
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Cousins Secret Santa//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:secret-santa-${start}@cousins`,
    `DTSTAMP:${stamp(nowMs)}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${escape(event.title)}`,
    `LOCATION:${escape(`${event.venueName}, ${event.address}`)}`,
    `DESCRIPTION:${escape(event.notes)}`,
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}
