import type { CSSProperties } from "react";

export const ORNAMENT_TONES = ["cranberry", "pine", "gold", "frost"] as const;
export type OrnamentTone = (typeof ORNAMENT_TONES)[number];

interface Props {
  emoji: string;
  tone: OrnamentTone;
  /** Length of the string it hangs from, in px. */
  stringLength?: number;
  size?: "md" | "lg";
  glowing?: boolean;
}

/** A glass bauble on a string. Purely visual; wrap it in a button to make it interactive. */
export function Ornament({ emoji, tone, stringLength = 28, size = "md", glowing = false }: Props) {
  return (
    <span
      className={`ornament ornament--${tone} ornament--${size}${glowing ? " is-glowing" : ""}`}
      style={{ "--string": `${stringLength}px` } as CSSProperties}
      aria-hidden="true"
    >
      <span className="ornament__string" />
      <span className="ornament__cap" />
      <span className="ornament__ball">
        <span className="ornament__emoji">{emoji}</span>
      </span>
    </span>
  );
}
