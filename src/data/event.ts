export interface EventStop {
  label: string;
  name: string;
  address: string;
  mapUrl: string;
}

export interface EventDetails {
  title: string;
  /** ISO time with Trinidad's offset (UTC-4, no daylight saving). */
  startsAt: string;
  durationHours: number;
  stops: readonly EventStop[];
  /** Spending limit, e.g. "$200 TTD". Leave null to hide it until it's decided. */
  budget: string | null;
  notes: string;
}

export const event: EventDetails = {
  title: "Cousins' Secret Santa 2026",
  startsAt: "2026-12-27T18:00:00-04:00",
  durationHours: 3,
  stops: [
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
  ],
  budget: null,
  notes: "Bring your gift wrapped, with your giftee's name on it.",
};
