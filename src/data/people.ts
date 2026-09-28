/**
 * The 10 cousins.
 *
 * PINs are fixed on purpose (agreed with the host) and reused for every draw.
 * They're strings so leading zeros survive, for example "0946".
 *
 * PLACEHOLDER WISHLISTS: these gift ideas are stand-ins. Replace them with
 * the real ideas once you've collected them. Editing wishlists never
 * changes who drew whom.
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

export interface GiftIdea {
  idea: string;
  note: string;
}

export interface Person {
  id: PersonId;
  /** Full name, shown on the giftee page. */
  name: string;
  /** Shorter name for ornaments and greetings. */
  shortName: string;
  emoji: string;
  pin: string;
  wishlist: readonly [GiftIdea, GiftIdea, GiftIdea];
}

export const people: readonly Person[] = [
  {
    id: "devern",
    name: "Devern",
    shortName: "Devern",
    emoji: "🦌",
    pin: "2004",
    wishlist: [
      { idea: "Wireless earbuds", note: "Something sweat-proof for the gym" },
      { idea: "A good hot sauce set", note: "The spicier the better" },
      { idea: "Desk plant", note: "Low maintenance, likes a bit of green" },
    ],
  },
  {
    id: "feisha",
    name: "Feisha",
    shortName: "Feisha",
    emoji: "⛄",
    pin: "2356",
    wishlist: [
      { idea: "Scented candles", note: "Vanilla or coconut" },
      { idea: "Cosy throw blanket", note: "Soft, neutral colours" },
      { idea: "A paperback thriller", note: "Loves a good mystery" },
    ],
  },
  {
    id: "eeshana",
    name: "Eeshana",
    shortName: "Eeshana",
    emoji: "🎄",
    pin: "3817",
    wishlist: [
      { idea: "Skincare set", note: "Gentle, fragrance-free" },
      { idea: "Journal and nice pens", note: "Likes fine tips" },
      { idea: "Mini bluetooth speaker", note: "For beach limes" },
    ],
  },
  {
    id: "nathan",
    name: "Nathan",
    shortName: "Nathan",
    emoji: "🍪",
    pin: "4702",
    wishlist: [
      { idea: "Football jersey", note: "Size M, any big club" },
      { idea: "Gaming gift card", note: "PlayStation Store" },
      { idea: "Snack hamper", note: "Sweet and salty mix" },
    ],
  },
  {
    id: "nirvana",
    name: "Nirvana",
    shortName: "Nirvana",
    emoji: "🔔",
    pin: "5169",
    wishlist: [
      { idea: "Jewellery dish", note: "Gold tones" },
      { idea: "Tote bag", note: "Big enough for a laptop" },
      { idea: "Spa voucher", note: "Any local spa" },
    ],
  },
  {
    id: "chris-ali",
    name: "Christopher Ali",
    shortName: "Chris Ali",
    emoji: "⭐",
    pin: "6431",
    wishlist: [
      { idea: "Cologne", note: "Fresh, citrusy scents" },
      { idea: "Leather wallet", note: "Slim, black or brown" },
      { idea: "Phone tripod", note: "For content and group photos" },
    ],
  },
  {
    id: "chris-alexander",
    name: "Christopher Alexander",
    shortName: "Chris Alexander",
    emoji: "🧦",
    pin: "7258",
    wishlist: [
      { idea: "Graphic tee", note: "Size L, anime or music" },
      { idea: "Portable charger", note: "Fast charging, USB-C" },
      { idea: "Board game", note: "Something for family nights" },
    ],
  },
  {
    id: "brandon",
    name: "Brandon",
    shortName: "Brandon",
    emoji: "🕯️",
    pin: "8093",
    wishlist: [
      { idea: "Water bottle", note: "Insulated, keeps drinks cold" },
      { idea: "Cap", note: "Plain, adjustable" },
      { idea: "Headphones", note: "Over-ear, comfy" },
    ],
  },
  {
    id: "dana",
    name: "Dana",
    shortName: "Dana",
    emoji: "🎁",
    pin: "0946",
    wishlist: [
      { idea: "Nail polish set", note: "Bright colours" },
      { idea: "Cute phone case", note: "Check the phone model first" },
      { idea: "Chocolate box", note: "Dark chocolate is a favourite" },
    ],
  },
  {
    id: "reyan",
    name: "Reyan",
    shortName: "Reyan",
    emoji: "❄️",
    pin: "1587",
    wishlist: [
      { idea: "Sneaker cleaning kit", note: "Takes sneakers seriously" },
      { idea: "Lego set", note: "Cars or architecture" },
      { idea: "Hoodie", note: "Size M, dark colours" },
    ],
  },
];
