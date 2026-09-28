import { useCallback, useEffect, useRef, useState } from "react";
import { m, useAnimate } from "motion/react";
import { ArrowLeft, Backspace } from "@phosphor-icons/react";
import { people, type Person } from "../../data/people";
import type { AttemptTracker } from "../../lib/attempts";
import { unlock, type PublicPerson, type UnlockResult } from "../../lib/unlock";
import { ORNAMENT_TONES, Ornament } from "../components/Ornament";
import { formatClock } from "../format";
import { useCalmMode } from "../motion";

const PIN_LENGTH = 4;
const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "back"] as const;

interface Props {
  person: PublicPerson | Person;
  tracker: AttemptTracker;
  onUnlocked: (result: UnlockResult, pin: string) => void;
  onBack: () => void;
}

type Status = "idle" | "wrong" | "success";

export function PinPad({ person, tracker, onUnlocked, onBack }: Props) {
  const calm = useCalmMode();
  const [scope, animate] = useAnimate();
  const digitsRef = useRef("");
  const statusRef = useRef<Status>("idle");
  const [digits, setDigitsState] = useState("");
  const [status, setStatusState] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [lockMs, setLockMs] = useState(() => tracker.lockRemainingMs(person.id));
  const locked = lockMs > 0;
  const tone = ORNAMENT_TONES[people.findIndex((p) => p.id === person.id) % ORNAMENT_TONES.length]!;

  const setDigits = (next: string) => {
    digitsRef.current = next;
    setDigitsState(next);
  };
  const setStatus = (next: Status) => {
    statusRef.current = next;
    setStatusState(next);
  };

  // Tick the cooldown while locked.
  useEffect(() => {
    if (!locked) return;
    const t = window.setInterval(() => {
      const left = tracker.lockRemainingMs(person.id);
      setLockMs(left);
      if (left === 0) setMessage("");
    }, 250);
    return () => window.clearInterval(t);
  }, [locked, tracker, person.id]);

  const check = useCallback(
    (pin: string) => {
      const result = unlock(person.id, pin);
      if (result) {
        tracker.recordSuccess(person.id);
        setStatus("success");
        setMessage("");
        window.setTimeout(() => onUnlocked(result, pin), calm ? 0 : 750);
        return;
      }
      tracker.recordFailure(person.id);
      setStatus("wrong");
      navigator.vibrate?.(80);
      if (!calm && scope.current) animate(scope.current, { x: [0, -14, 12, -9, 6, -3, 0] }, { duration: 0.45 });
      const left = tracker.failuresLeft(person.id);
      setLockMs(tracker.lockRemainingMs(person.id));
      setMessage(
        tracker.isLocked(person.id)
          ? ""
          : left <= 2
            ? `That's not your PIN. ${left} ${left === 1 ? "try" : "tries"} left.`
            : "That's not your PIN. Try again.",
      );
      window.setTimeout(() => {
        setDigits("");
        setStatus("idle");
      }, calm ? 0 : 480);
    },
    [person.id, tracker, onUnlocked, calm, animate, scope],
  );

  const accept = useCallback(
    (next: string) => {
      if (statusRef.current !== "idle" || tracker.isLocked(person.id)) return;
      const clean = next.replace(/\D/g, "").slice(0, PIN_LENGTH);
      if (clean.length > digitsRef.current.length) setMessage("");
      setDigits(clean);
      if (clean.length === PIN_LENGTH) check(clean);
    },
    [check, tracker, person.id],
  );

  const press = useCallback(
    (key: string) => {
      if (key === "back") accept(digitsRef.current.slice(0, -1));
      else accept(digitsRef.current + key);
    },
    [accept],
  );

  // Hardware keyboards: digits and backspace anywhere on the page.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement | null)?.dataset?.pinInput) return; // the input handles itself
      if (/^\d$/.test(e.key)) press(e.key);
      else if (e.key === "Backspace") press("back");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [press]);

  const disabled = locked || status !== "idle";
  const alertText = locked ? `Too many tries. The elves need a break for ${formatClock(lockMs)}.` : message;

  return (
    <div className="screen screen--pin">
      <button type="button" className="back-link" onClick={onBack}>
        <ArrowLeft size={18} weight="bold" aria-hidden="true" />
        <span>Not you? Pick again</span>
      </button>

      <div className="pin__hero">
        <div ref={scope} className="pin__ornament">
          <Ornament emoji={person.emoji} tone={tone} stringLength={8} glowing={status === "success"} />
        </div>
        <h1 className="screen__title">Hi {person.shortName}!</h1>
        <p className="screen__lede">Enter your 4-digit PIN.</p>
      </div>

      <label className="sr-only" htmlFor="pin-input">PIN</label>
      <input
        id="pin-input"
        className="sr-only"
        data-pin-input="true"
        inputMode="numeric"
        autoComplete="off"
        data-1p-ignore="true"
        data-lpignore="true"
        maxLength={PIN_LENGTH}
        value={digits}
        disabled={disabled}
        onChange={(e) => accept(e.target.value)}
      />

      <div className={`pin__dots is-${status}`} aria-hidden="true">
        {Array.from({ length: PIN_LENGTH }, (_, i) => (
          <m.span
            key={i}
            className={`pin__dot${i < digits.length ? " is-filled" : ""}`}
            animate={i < digits.length && !calm ? { scale: [1, 1.35, 1] } : { scale: 1 }}
            transition={{ duration: 0.25 }}
          />
        ))}
      </div>
      <p role="status" className="sr-only">{`${digits.length} of ${PIN_LENGTH} digits entered`}</p>
      <p role="alert" className="pin__message">{alertText}</p>

      <div className="keypad">
        {KEYS.map((key, i) =>
          key === "" ? (
            <span key={i} />
          ) : (
            <m.button
              key={i}
              type="button"
              className={`key${key === "back" ? " key--back" : ""}`}
              aria-label={key === "back" ? "Delete last digit" : key}
              disabled={disabled}
              onClick={() => press(key)}
              whileTap={calm ? undefined : { scale: 0.9 }}
            >
              {key === "back" ? <Backspace size={26} weight="bold" aria-hidden="true" /> : key}
            </m.button>
          ),
        )}
      </div>
    </div>
  );
}
