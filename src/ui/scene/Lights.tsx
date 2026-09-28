import type { CSSProperties } from "react";

const BULBS = 13;
const TONES = ["gold", "cranberry", "leaf", "frost"] as const;

/**
 * A string of fairy lights draped across the top of every screen.
 * The wire is a simple curve; bulbs sit on it and twinkle out of step.
 */
export function Lights() {
  return (
    <div className="lights" aria-hidden="true">
      <svg className="lights__wire" viewBox="0 0 1200 60" preserveAspectRatio="none">
        <path d="M0 8 Q 100 44 200 12 T 400 12 T 600 12 T 800 12 T 1000 12 T 1200 8" />
      </svg>
      {Array.from({ length: BULBS }, (_, i) => {
        const x = (i + 0.5) / BULBS;
        // follow the wire's waves: 6 dips across the width
        // wire height at this point (matches the SVG path scaled to 44px tall)
        const wireY = ((12 + 16 * Math.abs(Math.sin(x * Math.PI * 6))) * 44) / 60;
        return (
          <span
            key={i}
            className={`bulb bulb--${TONES[i % TONES.length]}`}
            style={
              {
                "--x": `${x * 100}%`,
                "--y": `${wireY}px`,
                "--tilt": `${(i % 2 ? 1 : -1) * 8}deg`,
                "--delay": `${(i * 0.37) % 2.4}s`,
              } as CSSProperties
            }
          />
        );
      })}
    </div>
  );
}
