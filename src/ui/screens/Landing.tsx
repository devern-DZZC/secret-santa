import { m } from "motion/react";
import { Gift } from "@phosphor-icons/react";
import { event } from "../../data/event";
import { Button } from "../components/Button";
import { Countdown } from "../components/Countdown";
import { EventCard } from "../components/EventCard";
import { EASE_OUT, useCalmMode } from "../motion";

export function Landing({ onStart }: { onStart: () => void }) {
  const calm = useCalmMode();
  const rise = (delay: number) =>
    calm
      ? {}
      : { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { delay, duration: 0.6, ease: EASE_OUT } };

  return (
    <div className="screen screen--landing">
      <header className="hero">
        <m.h1 className="hero__title" {...rise(0.05)}>
          Cousins'<br />Secret Santa
        </m.h1>
        <m.p className="hero__lede" {...rise(0.15)}>
          Pick your name, tap in your PIN and find out who you're buying for this Christmas.
        </m.p>
        <m.div {...rise(0.25)}>
          <Countdown target={event.startsAt} />
        </m.div>
        <m.div className="hero__cta" {...rise(0.35)}>
          <Button onClick={onStart} icon={<Gift size={22} weight="fill" aria-hidden="true" />}>
            Find my giftee
          </Button>
        </m.div>
      </header>
      <m.div {...rise(0.45)}>
        <EventCard event={event} />
      </m.div>
    </div>
  );
}
