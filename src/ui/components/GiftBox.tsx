import { m } from "motion/react";

interface Props {
  tapsLeft: number;
  opened: boolean;
  onTap: () => void;
}

const WOBBLE = [
  { rotate: [0, -4, 4, -2, 0], scale: [1, 1.02, 1] },
  { rotate: [0, -8, 8, -6, 6, 0], scale: [1, 1.05, 1] },
  { rotate: [0, -12, 12, -10, 10, -4, 0], scale: [1, 1.08, 1] },
];

/** A wrapped present built from CSS shapes. It shakes harder with every tap, then the lid pops. */
export function GiftBox({ tapsLeft, opened, onTap }: Props) {
  const intensity = Math.min(3 - tapsLeft, 2);
  return (
    <m.button
      type="button"
      className={`gift${opened ? " is-open" : ""}`}
      onClick={onTap}
      disabled={opened}
      aria-label={opened ? "Gift opened" : `Open your gift, ${tapsLeft} ${tapsLeft === 1 ? "tap" : "taps"} to go`}
      animate={opened ? { rotate: 0, scale: 1 } : WOBBLE[intensity]}
      transition={{ duration: 0.5 + intensity * 0.1, ease: "easeInOut" }}
      key={opened ? "open" : `tap-${tapsLeft}`}
      whileTap={opened ? undefined : { scale: 0.96 }}
    >
      <m.span
        className="gift__lid"
        animate={opened ? { y: -150, rotate: -24, opacity: 0 } : { y: 0, rotate: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        <span className="gift__bow gift__bow--left" />
        <span className="gift__bow gift__bow--right" />
        <span className="gift__knot" />
      </m.span>
      <span className="gift__box">
        <span className="gift__ribbon" />
      </span>
    </m.button>
  );
}
