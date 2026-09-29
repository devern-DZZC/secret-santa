import { useState } from "react";
import { SpeakerHigh, SpeakerSlash } from "@phosphor-icons/react";
import { isSoundOn, setSoundOn } from "../../lib/soundPrefs";
import { sfx } from "../sound";

export function SoundToggle() {
  const [on, setOn] = useState(isSoundOn);
  const toggle = () => {
    const next = !on;
    setSoundOn(next);
    setOn(next);
    if (next) sfx.unlock();
  };
  return (
    <button
      type="button"
      className="sound-toggle"
      onClick={toggle}
      aria-pressed={on}
      aria-label={on ? "Sound is on. Turn sound off" : "Sound is off. Turn sound on"}
    >
      {on ? <SpeakerHigh size={22} weight="fill" aria-hidden="true" /> : <SpeakerSlash size={22} weight="fill" aria-hidden="true" />}
    </button>
  );
}
