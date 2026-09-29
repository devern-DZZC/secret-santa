import type { CSSProperties } from "react";

const BULBS = 15;
const TONES = ["gold", "snow", "blue", "lime", "orange", "pink"] as const;

/**
 * A pine garland strung with big fairy lights across the top of every screen.
 * Bulbs sit on the garland's curve and twinkle out of step.
 */
export function Lights() {
  return (
    <div className="lights" aria-hidden="true">
      <svg className="lights__garland" viewBox="0 0 1200 60" preserveAspectRatio="none">
        <path className="lights__rope" d="M0 8 Q 100 44 200 12 T 400 12 T 600 12 T 800 12 T 1000 12 T 1200 8" />
        <path className="lights__needles" d="M0 8 Q 100 44 200 12 T 400 12 T 600 12 T 800 12 T 1000 12 T 1200 8" />
      </svg>
      {Array.from({ length: BULBS }, (_, i) => {
        const x = (i + 0.5) / BULBS;
        // wire height at this point (matches the SVG path scaled to 44px tall)
        const wireY = ((12 + 16 * Math.abs(Math.sin(x * Math.PI * 6))) * 44) / 60;
        return (
          <span
            key={i}
            className={`bulb bulb--${TONES[i % TONES.length]}`}
            style={
              {
                "--x": `${x * 100}%`,
                "--y": `${wireY + 2}px`,
                "--tilt": `${(i % 2 ? 1 : -1) * 10}deg`,
                "--delay": `${(i * 0.41) % 2.2}s`,
              } as CSSProperties
            }
          />
        );
      })}
    </div>
  );
}
