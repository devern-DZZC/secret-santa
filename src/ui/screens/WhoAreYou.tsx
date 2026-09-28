import { useState } from "react";
import { m } from "motion/react";
import { ArrowLeft } from "@phosphor-icons/react";
import { people } from "../../data/people";
import type { PersonId } from "../../data/people";
import { ORNAMENT_TONES, Ornament } from "../components/Ornament";
import { useCalmMode } from "../motion";

// Staggered string lengths make the wall look hand-hung rather than gridded.
const STRINGS = [22, 58, 46, 18, 30, 64, 60, 26, 20, 50];

export function WhoAreYou({ onPick, onBack }: { onPick: (id: PersonId) => void; onBack: () => void }) {
  const calm = useCalmMode();
  const [picked, setPicked] = useState<PersonId | null>(null);

  const pick = (id: PersonId) => {
    if (picked) return;
    setPicked(id);
    window.setTimeout(() => onPick(id), calm ? 0 : 420);
  };

  return (
    <div className="screen screen--who">
      <button type="button" className="back-link" onClick={onBack}>
        <ArrowLeft size={18} weight="bold" aria-hidden="true" />
        <span>Back</span>
      </button>
      <h1 className="screen__title">Who are you?</h1>
      <p className="screen__lede">Tap your ornament.</p>
      <ul className="ornament-wall">
        {people.map((p, i) => (
          <li key={p.id}>
            <m.button
              type="button"
              className="ornament-pick"
              aria-label={`I'm ${p.shortName}`}
              onClick={() => pick(p.id)}
              style={{ originY: 0 }}
              animate={
                picked === p.id && !calm ? { rotate: [0, 14, -10, 6, -3, 0] } : { rotate: 0 }
              }
              whileHover={calm ? undefined : { rotate: [0, 4, -3, 0], transition: { duration: 0.8 } }}
              whileTap={calm ? undefined : { scale: 0.96 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
            >
              <Ornament emoji={p.emoji} tone={ORNAMENT_TONES[i % ORNAMENT_TONES.length]!} stringLength={STRINGS[i]} />
              <span className="ornament-pick__name">{p.shortName}</span>
            </m.button>
          </li>
        ))}
      </ul>
    </div>
  );
}
