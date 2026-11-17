/**
 * The 10 cousins.
 *
 * PINs are fixed on purpose (agreed with the host) and reused for every draw.
 * They're strings so leading zeros survive, for example "0946".
 */

export const PERSON_IDS = [
  "devern",
  "feisha",
  "eeshana",
  "nathan",
  "nirvana",
  "chris-ali",
  "chris-alexander",
  "brandon",
  "dana",
  "reyan",
] as const;

export type PersonId = (typeof PERSON_IDS)[number];

export interface Person {
  id: PersonId;
  /** Full name, shown on the giftee page. */
  name: string;
  /** Shorter name for ornaments and greetings. */
  shortName: string;
  emoji: string;
  pin: string;
}

export const people: readonly Person[] = [
  { id: "devern", name: "Devern", shortName: "Devern", emoji: "🦌", pin: "2004" },
  { id: "feisha", name: "Feisha", shortName: "Feisha", emoji: "⛄", pin: "2356" },
  { id: "eeshana", name: "Eeshana", shortName: "Eeshana", emoji: "🎄", pin: "3817" },
  { id: "nathan", name: "Nathan", shortName: "Nathan", emoji: "🍪", pin: "4702" },
  { id: "nirvana", name: "Nirvana", shortName: "Nirvana", emoji: "🔔", pin: "5169" },
  { id: "chris-ali", name: "Christopher Ali", shortName: "Chris Ali", emoji: "⭐", pin: "6431" },
  {
    id: "chris-alexander",
    name: "Christopher Alexander",
    shortName: "Chris Alexander",
    emoji: "🧦",
    pin: "7258",
  },
  { id: "brandon", name: "Brandon", shortName: "Brandon", emoji: "🕯️", pin: "8093" },
  { id: "dana", name: "Dana", shortName: "Dana", emoji: "🎁", pin: "0946" },
  { id: "reyan", name: "Reyan", shortName: "Reyan", emoji: "❄️", pin: "1587" },
];
