import type { EventDetails } from "../data/event";

const escape = (text: string) =>
  text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

const stamp = (ms: number) => new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

/** Builds an .ics calendar file for the exchange. */
export function buildIcs(event: EventDetails, nowMs: number): string {
  const start = Date.parse(event.startsAt);
  const end = start + event.durationHours * 3_600_000;
  const firstStop = event.stops[0];
  if (!firstStop) throw new Error("The event needs at least one stop");
  const description = [
    event.notes,
    "",
    "Itinerary:",
    ...event.stops.flatMap((stop, index) => [
      `${index + 1}. ${stop.label}: ${stop.name}`,
      stop.address,
      stop.mapUrl,
    ]),
  ].join("\n");
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
    `LOCATION:${escape(`${firstStop.name}, ${firstStop.address}`)}`,
    `DESCRIPTION:${escape(description)}`,
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}
