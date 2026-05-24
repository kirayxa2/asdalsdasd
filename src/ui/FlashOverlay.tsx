import { useEffect, useRef } from "react";
import { useGame } from "../store/gameStore";

/**
 * White full-screen flash on explosion. Pulled from store.flash and applied
 * via opacity on a fixed div — cheaper than an in-canvas effect.
 */
export function FlashOverlay() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    return useGame.subscribe((s) => {
      if (ref.current) ref.current.style.opacity = String(Math.min(1, s.flash));
    });
  }, []);
  return (
    <div
      ref={ref}
      style={{
        position: "fixed",
        inset: 0,
        background: "white",
        opacity: 0,
        pointerEvents: "none",
        zIndex: 5,
        mixBlendMode: "screen",
        transition: "opacity 0.08s linear",
      }}
    />
  );
}
