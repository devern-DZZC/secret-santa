import { useEffect, useMemo, type CSSProperties } from "react";
import { mulberry32 } from "../../lib/rng";

const FLAKES = 42;

/** Three depths of drifting snow, pure CSS. Hidden for reduced motion; paused when the tab is hidden. */
export function Snow() {
  const flakes = useMemo(() => {
    const rng = mulberry32(2512);
    return Array.from({ length: FLAKES }, (_, i) => {
      const depth = i % 3; // 0 far, 1 mid, 2 near
      return {
        depth,
        style: {
          "--x": `${rng() * 100}vw`,
          "--size": `${2 + depth * 2 + rng() * 2}px`,
          "--dur": `${16 - depth * 4 + rng() * 6}s`,
          "--delay": `${-rng() * 20}s`,
          "--drift": `${(rng() - 0.5) * 12}vw`,
          "--alpha": `${0.35 + depth * 0.22}`,
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
        <span key={i} className={`flake flake--d${f.depth}`} style={f.style} />
      ))}
    </div>
  );
}
