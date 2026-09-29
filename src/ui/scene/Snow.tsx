import { useEffect, useMemo, type CSSProperties } from "react";
import { mulberry32 } from "../../lib/rng";

const FLAKES = 64;

/**
 * Three depths of falling snow: soft dots plus a few crystal snowflakes that spin as they drift.
 * Pure CSS (transform/opacity). Hidden for reduced motion; paused when the tab is hidden.
 */
export function Snow() {
  const flakes = useMemo(() => {
    const rng = mulberry32(2512);
    return Array.from({ length: FLAKES }, (_, i) => {
      const depth = i % 3; // 0 far, 1 mid, 2 near
      const crystal = i % 5 === 0;
      return {
        depth,
        crystal,
        style: {
          "--x": `${rng() * 100}vw`,
          "--size": crystal ? `${12 + depth * 5 + rng() * 6}px` : `${3 + depth * 2 + rng() * 3}px`,
          "--dur": `${15 - depth * 3.5 + rng() * 6}s`,
          "--delay": `${-rng() * 20}s`,
          "--drift": `${(rng() - 0.5) * 16}vw`,
          "--spin": `${(rng() > 0.5 ? 1 : -1) * (180 + rng() * 360)}deg`,
          "--alpha": `${0.55 + depth * 0.2}`,
        } as CSSProperties,
      };
    });
  }, []);

  useEffect(() => {
    const onVisibility = () => document.documentElement.toggleAttribute("data-hidden", document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  return (
    <div className="snow" aria-hidden="true">
      {flakes.map((f, i) => (
        <span key={i} className={`flake flake--d${f.depth}${f.crystal ? " flake--crystal" : ""}`} style={f.style}>
          {f.crystal ? "❅" : null}
        </span>
      ))}
    </div>
  );
}
