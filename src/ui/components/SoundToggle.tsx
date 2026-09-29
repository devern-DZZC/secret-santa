import { useState } from "react";
import { MusicNotes, SpeakerHigh, SpeakerSlash } from "@phosphor-icons/react";
import { isMusicOn, isSoundOn, setMusicOn, setSoundOn } from "../../lib/soundPrefs";
import { startMusic, stopMusic } from "../music";
import { sfx } from "../sound";

/** Two switches in the top corner: background music, and sound effects. */
export function SoundToggle() {
  const [sound, setSound] = useState(isSoundOn);
  const [music, setMusic] = useState(isMusicOn);

  const toggleSound = () => {
    const next = !sound;
    setSoundOn(next);
    setSound(next);
    if (next) sfx.unlock();
  };

  const toggleMusic = () => {
    const next = !music;
    setMusicOn(next);
    setMusic(next);
    if (next) startMusic();
    else stopMusic();
  };

  return (
    <div className="audio-toggles">
      <button
        type="button"
        className={`audio-toggle${music ? "" : " is-off"}`}
        onClick={toggleMusic}
        aria-pressed={music}
        aria-label={music ? "Music is on. Turn music off" : "Music is off. Turn music on"}
      >
        <MusicNotes size={22} weight="fill" aria-hidden="true" />
      </button>
      <button
        type="button"
        className={`audio-toggle${sound ? "" : " is-off"}`}
        onClick={toggleSound}
        aria-pressed={sound}
        aria-label={sound ? "Sound effects are on. Turn sound effects off" : "Sound effects are off. Turn sound effects on"}
      >
        {sound ? <SpeakerHigh size={22} weight="fill" aria-hidden="true" /> : <SpeakerSlash size={22} weight="fill" aria-hidden="true" />}
      </button>
    </div>
  );
}
