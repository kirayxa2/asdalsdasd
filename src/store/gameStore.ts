import { create } from "zustand";
import type { JarEntry, JarState } from "../types";
import { ITEMS_BY_ID } from "../data/items";
import { recomputeJar } from "../data/reactions";

interface GameState {
  // ---- Held item ----
  heldItemId: string | null;
  heldOriginShelf: string | null; // shelf slot id we picked it from
  pointer: { x: number; y: number; z: number }; // world pos of held item
  pourTilt: number; // 0..1 — how much the held bottle is tilted (pouring)

  // ---- Jar ----
  jar: JarState;

  // ---- Burner ----
  burnerOn: boolean;

  // ---- Explosion ----
  explosion: { active: boolean; t: number };

  // ---- Camera ----
  cameraMode: "static" | "orbit" | "fps";

  // ---- Actions ----
  pickUp: (itemId: string, shelfSlot: string) => void;
  release: (overJar: boolean) => void;
  setPointer: (x: number, y: number, z: number) => void;
  setPourTilt: (t: number) => void;
  toggleBurner: () => void;
  setCameraMode: (m: GameState["cameraMode"]) => void;
  resetJar: () => void;
  triggerExplosion: () => void;
  tick: (dt: number) => void;
}

const emptyJar = (): JarState => ({
  entries: [],
  liquidColor: "#1a1a1a",
  liquidLevel: 0,
  bubbles: 0,
  smoke: 0,
  sparks: 0,
  glow: 0,
  danger: 0,
  shake: 0,
});

export const useGame = create<GameState>((set, get) => ({
  heldItemId: null,
  heldOriginShelf: null,
  pointer: { x: 0, y: 1.4, z: 0.5 },
  pourTilt: 0,
  jar: emptyJar(),
  burnerOn: false,
  explosion: { active: false, t: 0 },
  cameraMode: "static",

  pickUp: (itemId, shelfSlot) => {
    if (get().heldItemId) return;
    set({ heldItemId: itemId, heldOriginShelf: shelfSlot, pourTilt: 0 });
  },

  release: (overJar) => {
    const { heldItemId, jar } = get();
    if (!heldItemId) return;
    const def = ITEMS_BY_ID[heldItemId];
    if (!def) {
      set({ heldItemId: null, heldOriginShelf: null, pourTilt: 0 });
      return;
    }

    if (overJar) {
      if (def.kind === "solid") {
        // Drop the solid into the jar.
        const entry: JarEntry = {
          id: `${def.id}-${Math.random().toString(36).slice(2, 8)}`,
          itemId: def.id,
          tags: def.tags,
          kind: "solid",
          color: def.color,
          integrity: 1,
        };
        set({
          jar: { ...jar, entries: [...jar.entries, entry] },
          heldItemId: null,
          heldOriginShelf: null,
          pourTilt: 0,
        });
      } else {
        // Liquid: only counts if the bottle was tilted enough during release.
        // For UX we always add 1 dose if released over the jar.
        const entry: JarEntry = {
          id: `${def.id}-${Math.random().toString(36).slice(2, 8)}`,
          itemId: def.id,
          tags: def.tags,
          kind: "liquid",
          color: def.liquidColor ?? def.color,
          integrity: 1,
        };
        set({
          jar: { ...jar, entries: [...jar.entries, entry] },
          heldItemId: null,
          heldOriginShelf: null,
          pourTilt: 0,
        });
      }
    } else {
      // Released away from jar — return to shelf.
      set({ heldItemId: null, heldOriginShelf: null, pourTilt: 0 });
    }
  },

  setPointer: (x, y, z) => set({ pointer: { x, y, z } }),
  setPourTilt: (t) => set({ pourTilt: Math.max(0, Math.min(1, t)) }),
  toggleBurner: () => set((s) => ({ burnerOn: !s.burnerOn })),
  setCameraMode: (m) => set({ cameraMode: m }),

  resetJar: () =>
    set({
      jar: emptyJar(),
      explosion: { active: false, t: 0 },
      burnerOn: false,
    }),

  triggerExplosion: () =>
    set((s) => ({
      explosion: { active: true, t: 0 },
      jar: { ...emptyJar(), shake: 1 },
      burnerOn: false,
      heldItemId: s.heldItemId, // keep held item if any
    })),

  tick: (dt) => {
    const s = get();

    // Explosion timer
    if (s.explosion.active) {
      const nt = s.explosion.t + dt;
      if (nt > 1.6) set({ explosion: { active: false, t: 0 } });
      else set({ explosion: { active: true, t: nt } });
    }

    // Recompute jar visuals/chemistry every tick
    const newJar = recomputeJar(s.jar, s.burnerOn, dt);
    if (newJar !== s.jar) set({ jar: newJar });

    // Trigger explosion when danger maxes out
    if (newJar.danger >= 1 && !s.explosion.active) {
      get().triggerExplosion();
    }
  },
}));
