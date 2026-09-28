import { useEffect, useState } from "react";
import { AnimatePresence, m } from "motion/react";
import { ArrowCounterClockwise, Gift, UserSwitch } from "@phosphor-icons/react";
import { event } from "../../data/event";
import type { UnlockResult } from "../../lib/unlock";
import { Button } from "../components/Button";
import { EventCard } from "../components/EventCard";
import { GiftBox } from "../components/GiftBox";
import { EASE_OUT, useCalmMode } from "../motion";

const TAPS = 3;
const CONFETTI = ["#b3202a", "#e8b64c", "#1f7a55", "#fdfaf4"];

function burst() {
  import("canvas-confetti")
    .then(({ default: confetti }) => {
      const base = { colors: CONFETTI, disableForReducedMotion: true, zIndex: 40 };
      confetti({ ...base, particleCount: 90, spread: 75, startVelocity: 42, origin: { y: 0.55 } });
      window.setTimeout(
        () => confetti({ ...base, particleCount: 50, spread: 110, startVelocity: 30, origin: { y: 0.5 } }),
        180,
      );
    })
    .catch(() => {
      /* confetti is a nice-to-have */
    });
}

interface Props {
  result: UnlockResult;
  /** Play the unwrap (true right after entering the PIN). */
  playReveal: boolean;
  onSwitch: () => void;
}

export function Giftee({ result, playReveal, onSwitch }: Props) {
  const calm = useCalmMode();
  const [phase, setPhase] = useState<"wrapped" | "opening" | "open">(playReveal && !calm ? "wrapped" : "open");
  const [tapsLeft, setTapsLeft] = useState(TAPS);
  const { giver, receiver } = result;

  useEffect(() => {
    if (phase !== "opening") return;
    burst();
    const t = window.setTimeout(() => setPhase("open"), 1900);
    return () => window.clearTimeout(t);
  }, [phase]);

  const tap = () => {
    if (phase !== "wrapped") return;
    navigator.vibrate?.(20);
    const next = tapsLeft - 1;
    setTapsLeft(next);
    if (next === 0) setPhase("opening");
  };

  const replay = () => {
    setTapsLeft(TAPS);
    setPhase(calm ? "open" : "wrapped");
  };

  return (
    <AnimatePresence mode="wait" initial={false}>
      {phase !== "open" ? (
        <m.div
          key="reveal"
          className="screen screen--reveal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.35 } }}
        >
          <h1 className="screen__title">Ready, {giver.shortName}?</h1>
          <p className="screen__lede" aria-live="polite">
            {phase === "opening"
              ? "Here we go…"
              : tapsLeft === TAPS
                ? "Tap the gift to open it."
                : tapsLeft === 1
                  ? "One more tap!"
                  : `${tapsLeft} more taps.`}
          </p>
          <div className="reveal__stage">
            <GiftBox tapsLeft={tapsLeft} opened={phase === "opening"} onTap={tap} />
            {phase === "opening" && (
              <m.div
                className="reveal__rise"
                initial={{ y: 60, opacity: 0, scale: 0.6 }}
                animate={{ y: -30, opacity: 1, scale: 1 }}
                transition={{ delay: 0.25, duration: 0.9, ease: EASE_OUT }}
                aria-hidden="true"
              >
                <span className="reveal__emoji">{receiver.emoji}</span>
                <span className="reveal__name">{receiver.shortName}</span>
              </m.div>
            )}
          </div>
          {phase === "wrapped" && (
            <button type="button" className="text-link" onClick={() => setPhase("open")}>
              Skip the animation
            </button>
          )}
        </m.div>
      ) : (
        <m.div
          key="giftee"
          className="screen screen--giftee"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <header className="giftee__header">
            <m.span
              className="giftee__emoji"
              aria-hidden="true"
              initial={calm ? false : { scale: 0.4, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 14 }}
            >
              {receiver.emoji}
            </m.span>
            <h1 className="giftee__kicker">You're Secret Santa for</h1>
            <h2 className="giftee__name">{receiver.name}</h2>
          </header>

          <section className="ideas" aria-labelledby="ideas-heading">
            <h3 id="ideas-heading" className="ideas__title">
              {receiver.shortName.split(" ")[0]} would love
            </h3>
            <ul className="ideas__list">
              {receiver.wishlist.map((g, i) => (
                <m.li
                  key={g.idea}
                  className="idea"
                  initial={calm ? false : { opacity: 0, rotateX: -80, y: 12 }}
                  animate={{ opacity: 1, rotateX: 0, y: 0 }}
                  transition={{ delay: 0.25 + i * 0.16, duration: 0.6, ease: EASE_OUT }}
                >
                  <span className="idea__icon" aria-hidden="true"><Gift size={22} weight="fill" /></span>
                  <span className="idea__text">
                    <strong>{g.idea}</strong>
                    {g.note && <span>{g.note}</span>}
                  </span>
                </m.li>
              ))}
            </ul>
          </section>

          <p className="hush">
            <span aria-hidden="true">🤫</span> Shh! Keep it secret until the lime.
          </p>

          <EventCard event={event} compact />

          <div className="giftee__actions">
            <Button variant="ghost" onClick={replay} icon={<ArrowCounterClockwise size={20} weight="bold" aria-hidden="true" />}>
              Replay the reveal
            </Button>
            <Button variant="quiet" onClick={onSwitch} icon={<UserSwitch size={20} weight="bold" aria-hidden="true" />}>
              Not you? Switch person
            </Button>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
