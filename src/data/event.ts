export interface EventDetails {
  title: string;
  /** ISO time with Trinidad's offset (UTC-4, no daylight saving). */
  startsAt: string;
  durationHours: number;
  venueName: string;
  address: string;
  mapUrl: string;
  /** Spending limit, e.g. "$200 TTD". Leave null to hide it until it's decided. */
  budget: string | null;
  notes: string;
}

export const event: EventDetails = {
  title: "Cousins' Secret Santa 2026",
  startsAt: "2026-12-27T19:00:00-04:00",
  durationHours: 3,
  venueName: "The Alley",
  address: "East Gates Mall, Trincity, Trinidad",
  mapUrl: "https://www.google.com/maps/search/?api=1&query=The+Alley+East+Gates+Mall+Trincity+Trinidad",
  budget: null,
  notes: "Bring your gift wrapped, with your giftee's name on it.",
};
