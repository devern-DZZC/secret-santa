import { useEffect, useState } from "react";
import { AnimatePresence, m } from "motion/react";
import { getCountdown } from "../../lib/countdown";
import { useCalmMode } from "../motion";

function Unit({ value, label }: { value: number; label: string }) {
  const calm = useCalmMode();
  const text = String(value).padStart(2, "0");
  return (
    <div className="countdown__unit">
      <span className="countdown__value">
        <AnimatePresence mode="popLayout" initial={false}>
          <m.span
            key={text}
            initial={calm ? false : { y: "-60%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={calm ? { opacity: 0 } : { y: "60%", opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            {text}
          </m.span>
        </AnimatePresence>
      </span>
      <span className="countdown__label">{label}</span>
    </div>
  );
}

export function Countdown({ target }: { target: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);

  const c = getCountdown(target, now);
  if (c.done) return <p className="countdown countdown--done">It's gifting time!</p>;

  return (
    <div className="countdown" role="timer" aria-label={`${c.days} days, ${c.hours} hours and ${c.minutes} minutes to go`}>
      <div className="countdown__units" aria-hidden="true">
        <Unit value={c.days} label="days" />
        <Unit value={c.hours} label="hrs" />
        <Unit value={c.minutes} label="mins" />
        <Unit value={c.seconds} label="secs" />
      </div>
      <p className="countdown__caption" aria-hidden="true">till the lime</p>
    </div>
  );
}
