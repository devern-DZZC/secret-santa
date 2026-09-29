/**
 * Christmas illustrations from Microsoft Fluent Emoji (flat style, MIT licence).
 * Using real image files means every cousin sees the same artwork on iPhone and Android.
 */
import bell from "../assets/art/bell.svg";
import candle from "../assets/art/candle.svg";
import christmasTree from "../assets/art/christmas-tree.svg";
import cookie from "../assets/art/cookie.svg";
import deer from "../assets/art/deer.svg";
import evergreenTree from "../assets/art/evergreen-tree.svg";
import glowingStar from "../assets/art/glowing-star.svg";
import house from "../assets/art/house-with-garden.svg";
import santa from "../assets/art/santa-claus.svg";
import sled from "../assets/art/sled.svg";
import snowflake from "../assets/art/snowflake.svg";
import snowman from "../assets/art/snowman.svg";
import socks from "../assets/art/socks.svg";
import sparkles from "../assets/art/sparkles.svg";
import star from "../assets/art/star.svg";
import wrappedGift from "../assets/art/wrapped-gift.svg";

export const art = {
  bell, candle, christmasTree, cookie, deer, evergreenTree, glowingStar, house, santa, sled,
  snowflake, snowman, socks, sparkles, star, wrappedGift,
};

/** Each cousin's emoji (from people.ts) mapped to its illustration. */
const EMOJI_ART: Record<string, string> = {
  "🦌": deer,
  "⛄": snowman,
  "☃️": snowman,
  "🎄": christmasTree,
  "🍪": cookie,
  "🔔": bell,
  "⭐": star,
  "🌟": glowingStar,
  "🧦": socks,
  "🕯️": candle,
  "🎁": wrappedGift,
  "❄️": snowflake,
  "🎅": santa,
  "🛷": sled,
  "✨": sparkles,
};

/** The illustration for an emoji, or undefined to fall back to the emoji itself. */
export const artFor = (emoji: string): string | undefined => EMOJI_ART[emoji];

/** Renders a cousin's illustration, falling back to their emoji if it isn't in the set. */
export function Art({ emoji, className }: { emoji: string; className?: string }) {
  const src = artFor(emoji);
  return src ? (
    <img className={className} src={src} alt="" draggable={false} />
  ) : (
    <span className={className}>{emoji}</span>
  );
}
