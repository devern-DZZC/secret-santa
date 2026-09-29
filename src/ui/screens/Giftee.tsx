import { useEffect, useState } from "react";
import { AnimatePresence, m } from "motion/react";
import { ArrowCounterClockwise, UserSwitch } from "@phosphor-icons/react";
import { Art, art } from "../art";
import { sfx } from "../sound";
import { duckMusic } from "../music";
import { event } from "../../data/event";
import type { UnlockResult } from "../../lib/unlock";
import { Button } from "../components/Button";
import { EventCard } from "../components/EventCard";
import { GiftBox } from "../components/GiftBox";
import { EASE_OUT, useCalmMode } from "../motion";
import { focusRequest, useScreenHeading } from "../useScreenHeading";

const TAPS = 3;
const CONFETTI = ["#c8102e", "#148a3f", "#ffffff", "#ffc93c"];
const IDEA_ART = [art.wrappedGift, art.star, art.bell];

function RevealHeading({ name }: { name: string }) {
  const ref = useScreenHeading();
  return (
    <h1 className="screen__title" ref={ref} tabIndex={-1}>
      Ready, {name}?
    </h1>
  );
}

function GifteeHeading() {
  const ref = useScreenHeading();
  return (
    <h1 className="giftee__kicker" ref={ref} tabIndex={-1}>
      You're Secret Santa for
    </h1>
  );
}

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
    duckMusic(3200);
    sfx.reveal();
    const t = window.setTimeout(() => open(), 1900);
    return () => window.clearTimeout(t);
  }, [phase]);

  // Moving between the unwrap and the giftee is a screen change for focus purposes.
  const open = () => {
    focusRequest.pending = true;
    setPhase("open");
  };

  const tap = () => {
    if (phase !== "wrapped") return; // aria-disabled button: ignore taps once opening
    navigator.vibrate?.(20);
    const next = tapsLeft - 1;
    sfx.tap(TAPS - next);
    setTapsLeft(next);
    if (next === 0) setPhase("opening");
  };

  const replay = () => {
    // the giftee page is long; bring the gift back into view
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    focusRequest.pending = true;
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
          <RevealHeading name={giver.shortName} />
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
                <Art emoji={receiver.emoji} className="reveal__art" />
                <span className="reveal__name">{receiver.shortName}</span>
              </m.div>
            )}
          </div>
          {phase === "wrapped" && (
            <button type="button" className="text-link" onClick={open}>
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
          <header className="giftee__header card">
            <m.span
              className="giftee__art"
              aria-hidden="true"
              initial={calm ? false : { scale: 0.4, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 14 }}
            >
              <Art emoji={receiver.emoji} />
            </m.span>
            <GifteeHeading />
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
                  <span className="idea__icon" aria-hidden="true"><img src={IDEA_ART[i % IDEA_ART.length]} alt="" /></span>
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
            <Button variant="light" onClick={replay} icon={<ArrowCounterClockwise size={20} weight="bold" aria-hidden="true" />}>
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
