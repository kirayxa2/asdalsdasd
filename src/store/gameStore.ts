import { create } from "zustand";
import type { JarEntry, JarState, Shard, TableItem } from "../types";
import { ITEMS_BY_ID } from "../data/items";
import { recomputeJar } from "../data/reactions";

const TABLE_Y = 0.92;
const FLOOR_Y = 0;
const TABLE_HALF_X = 1.6;
const TABLE_HALF_Z = 0.8;
// Jar physical position used by collision logic (kept in sync with Jar.tsx).
export const JAR_CENTER: [number, number, number] = [0, 1.34, 0];
export const JAR_R = 0.18;
export const JAR_TOP_Y = JAR_CENTER[1] + 0.2;     // top opening height
export const JAR_BOTTOM_Y = JAR_CENTER[1] - 0.2;
const JAR_BLOCK_R = 0.30;

const POUR_RATE = 0.45; // 1.0 = full bottle in 1 sec; 0.45 = ~2.2 sec for full

interface GameState {
  // Held item
  heldItemId: string | null;
  heldOriginShelf: string | null;
  heldOriginTableId: string | null;
  heldOriginTableSnapshot: TableItem | null;
  pointer: { x: number; y: number; z: number };
  pointerPrev: { x: number; y: number; z: number };
  pourTilt: number;

  // Pouring (continuous liquid stream)
  pouringEntryId: string | null;

  // Jar
  jar: JarState;
  burnerOn: boolean;

  // Effects
  explosion: { active: boolean; t: number };
  shards: Shard[];
  cameraShake: number;
  flash: number;

  cameraMode: "static" | "orbit" | "fps";
  tableItems: TableItem[];

  // Actions
  pickUpFromShelf: (itemId: string, shelfSlot: string) => void;
  pickUpFromTable: (tableId: string) => void;
  release: (target: "jar" | "table" | "void") => void;
  setPointer: (x: number, y: number, z: number) => void;
  setPourTilt: (t: number) => void;
  startPour: () => void;
  stopPour: () => void;
  toggleBurner: () => void;
  setCameraMode: (m: GameState["cameraMode"]) => void;
  resetJar: () => void;
  resetAll: () => void;
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

let _nextId = 1;
const uid = (prefix: string) => `${prefix}-${_nextId++}-${Math.random().toString(36).slice(2, 6)}`;

export const useGame = create<GameState>((set, get) => ({
  heldItemId: null,
  heldOriginShelf: null,
  heldOriginTableId: null,
  heldOriginTableSnapshot: null,
  pointer: { x: 0, y: 1.5, z: 0.5 },
  pointerPrev: { x: 0, y: 1.5, z: 0.5 },
  pourTilt: 0,
  pouringEntryId: null,
  jar: emptyJar(),
  burnerOn: false,
  explosion: { active: false, t: 0 },
  shards: [],
  cameraShake: 0,
  flash: 0,
  cameraMode: "static",
  tableItems: [],

  pickUpFromShelf: (itemId, shelfSlot) => {
    if (get().heldItemId) return;
    set({
      heldItemId: itemId,
      heldOriginShelf: shelfSlot,
      heldOriginTableId: null,
      heldOriginTableSnapshot: null,
      pourTilt: 0,
    });
  },

  pickUpFromTable: (tableId) => {
    const s = get();
    if (s.heldItemId) return;
    const item = s.tableItems.find((t) => t.id === tableId);
    if (!item) return;
    set({
      heldItemId: item.itemId,
      heldOriginShelf: null,
      heldOriginTableId: tableId,
      heldOriginTableSnapshot: item,
      tableItems: s.tableItems.filter((t) => t.id !== tableId),
      pourTilt: 0,
    });
  },

  release: (target) => {
    const s = get();
    const { heldItemId } = s;
    if (!heldItemId) return;
    const def = ITEMS_BY_ID[heldItemId];
    // Always stop pouring on release.
    if (s.pouringEntryId) {
      set({ pouringEntryId: null });
    }
    if (!def) {
      set({
        heldItemId: null,
        heldOriginShelf: null,
        heldOriginTableId: null,
        heldOriginTableSnapshot: null,
        pourTilt: 0,
      });
      return;
    }

    if (target === "jar") {
      // For solids, drop into the jar as a discrete item.
      // For liquids, the pour mechanism already added an entry — so we just put
      // the bottle back without adding more. (Player should pour by holding,
      // not by quick-release.)
      if (def.kind === "solid") {
        const entry: JarEntry = {
          id: uid(def.id),
          itemId: def.id,
          tags: def.tags,
          kind: "solid",
          color: def.color,
          integrity: 1,
          amount: 1,
        };
        set({
          jar: { ...s.jar, entries: [...s.jar.entries, entry] },
          heldItemId: null,
          heldOriginShelf: null,
          heldOriginTableId: null,
          heldOriginTableSnapshot: null,
          pourTilt: 0,
        });
      } else {
        // Liquid — if no pour happened (quick click), drop a small splash to be helpful.
        const minDose = 0.18;
        const lastIsSame =
          s.jar.entries.length > 0 &&
          s.jar.entries[s.jar.entries.length - 1].itemId === def.id;
        if (!lastIsSame || s.jar.entries[s.jar.entries.length - 1].amount > 0.95) {
          const entry: JarEntry = {
            id: uid(def.id),
            itemId: def.id,
            tags: def.tags,
            kind: "liquid",
            color: def.liquidColor ?? def.color,
            integrity: 1,
            amount: minDose,
          };
          set({
            jar: { ...s.jar, entries: [...s.jar.entries, entry] },
            heldItemId: null,
            heldOriginShelf: null,
            heldOriginTableId: null,
            heldOriginTableSnapshot: null,
            pourTilt: 0,
          });
        } else {
          set({
            heldItemId: null,
            heldOriginShelf: null,
            heldOriginTableId: null,
            heldOriginTableSnapshot: null,
            pourTilt: 0,
          });
        }
      }
    } else if (target === "table") {
      const vx = (s.pointer.x - s.pointerPrev.x) * 12;
      const vz = (s.pointer.z - s.pointerPrev.z) * 12;
      const ti: TableItem = {
        id: uid("ti"),
        itemId: def.id,
        position: [s.pointer.x, Math.max(s.pointer.y, 1.25), s.pointer.z],
        velocity: [vx, 0, vz],
        rotation: [Math.random() * 0.4, Math.random() * Math.PI * 2, Math.random() * 0.4],
        angularVelocity: [
          (Math.random() - 0.5) * 4,
          (Math.random() - 0.5) * 4,
          (Math.random() - 0.5) * 4,
        ],
        resting: false,
      };
      set({
        tableItems: [...s.tableItems, ti],
        heldItemId: null,
        heldOriginShelf: null,
        heldOriginTableId: null,
        heldOriginTableSnapshot: null,
        pourTilt: 0,
      });
    } else {
      // void: shelf items snap back automatically (Shelf hides held item by id).
      // Items from the table get respawned at their old position.
      if (s.heldOriginTableSnapshot) {
        set({
          tableItems: [...s.tableItems, s.heldOriginTableSnapshot],
          heldItemId: null,
          heldOriginShelf: null,
          heldOriginTableId: null,
          heldOriginTableSnapshot: null,
          pourTilt: 0,
        });
      } else {
        set({
          heldItemId: null,
          heldOriginShelf: null,
          heldOriginTableId: null,
          heldOriginTableSnapshot: null,
          pourTilt: 0,
        });
      }
    }
  },

  setPointer: (x, y, z) =>
    set((s) => ({ pointerPrev: s.pointer, pointer: { x, y, z } })),

  setPourTilt: (t) => set({ pourTilt: Math.max(0, Math.min(1, t)) }),

  startPour: () => {
    const s = get();
    if (s.pouringEntryId) return; // already pouring
    if (!s.heldItemId) return;
    const def = ITEMS_BY_ID[s.heldItemId];
    if (!def || def.kind !== "liquid") return;

    // Reuse the most recent same-liquid entry if it isn't full yet, otherwise
    // start a new entry that will grow over time.
    const last = s.jar.entries[s.jar.entries.length - 1];
    if (last && last.itemId === def.id && last.amount < 0.99) {
      set({ pouringEntryId: last.id });
      return;
    }
    const entry: JarEntry = {
      id: uid(def.id),
      itemId: def.id,
      tags: def.tags,
      kind: "liquid",
      color: def.liquidColor ?? def.color,
      integrity: 1,
      amount: 0,
    };
    set({
      jar: { ...s.jar, entries: [...s.jar.entries, entry] },
      pouringEntryId: entry.id,
    });
  },

  stopPour: () => {
    const s = get();
    if (!s.pouringEntryId) return;
    // Drop entries that received zero pour.
    const entries = s.jar.entries.filter((e) => e.kind === "solid" || e.amount > 0.01);
    set({ pouringEntryId: null, jar: { ...s.jar, entries } });
  },

  toggleBurner: () => set((s) => ({ burnerOn: !s.burnerOn })),
  setCameraMode: (m) => set({ cameraMode: m }),

  resetJar: () =>
    set({
      jar: emptyJar(),
      explosion: { active: false, t: 0 },
      burnerOn: false,
      pouringEntryId: null,
    }),

  resetAll: () =>
    set({
      jar: emptyJar(),
      explosion: { active: false, t: 0 },
      shards: [],
      tableItems: [],
      burnerOn: false,
      cameraShake: 0,
      flash: 0,
      heldItemId: null,
      heldOriginShelf: null,
      heldOriginTableId: null,
      heldOriginTableSnapshot: null,
      pourTilt: 0,
      pouringEntryId: null,
    }),

  triggerExplosion: () => {
    const s = get();
    const shards: Shard[] = [];
    for (let i = 0; i < 28; i++) {
      const a = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 5;
      shards.push({
        id: uid("shd"),
        position: [JAR_CENTER[0], JAR_CENTER[1] + 0.05, JAR_CENTER[2]],
        velocity: [Math.cos(a) * speed, 2 + Math.random() * 5, Math.sin(a) * speed],
        rotation: [0, 0, 0],
        angularVelocity: [
          (Math.random() - 0.5) * 18,
          (Math.random() - 0.5) * 18,
          (Math.random() - 0.5) * 18,
        ],
        life: 2.5 + Math.random() * 1.5,
        size: 0.018 + Math.random() * 0.025,
      });
    }
    const newTable = s.tableItems.map((t) => {
      const dx = t.position[0] - JAR_CENTER[0];
      const dz = t.position[2] - JAR_CENTER[2];
      const d = Math.max(0.2, Math.hypot(dx, dz));
      const force = 7 / d;
      return {
        ...t,
        velocity: [
          t.velocity[0] + (dx / d) * force,
          t.velocity[1] + 3 + Math.random() * 2,
          t.velocity[2] + (dz / d) * force,
        ] as [number, number, number],
        angularVelocity: [
          (Math.random() - 0.5) * 12,
          (Math.random() - 0.5) * 12,
          (Math.random() - 0.5) * 12,
        ] as [number, number, number],
        resting: false,
      };
    });

    set({
      explosion: { active: true, t: 0 },
      jar: { ...emptyJar(), shake: 1 },
      burnerOn: false,
      shards: [...s.shards, ...shards],
      tableItems: newTable,
      cameraShake: 1,
      flash: 1,
      pouringEntryId: null,
    });
  },

  tick: (dt) => {
    const s = get();
    const patch: Partial<GameState> = {};

    if (s.explosion.active) {
      const nt = s.explosion.t + dt;
      if (nt > 2.4) patch.explosion = { active: false, t: 0 };
      else patch.explosion = { active: true, t: nt };
    }
    if (s.cameraShake > 0) patch.cameraShake = Math.max(0, s.cameraShake - dt * 1.4);
    if (s.flash > 0) patch.flash = Math.max(0, s.flash - dt * 2.5);

    // Continuous pouring: grow the active pouring entry.
    let jar = s.jar;
    if (s.pouringEntryId) {
      const idx = jar.entries.findIndex((e) => e.id === s.pouringEntryId);
      if (idx >= 0) {
        const e = jar.entries[idx];
        const newAmount = Math.min(1, e.amount + POUR_RATE * dt);
        if (newAmount !== e.amount) {
          const entries = jar.entries.slice();
          entries[idx] = { ...e, amount: newAmount };
          jar = { ...jar, entries };
        }
        if (newAmount >= 1) {
          patch.pouringEntryId = null;
        }
      } else {
        patch.pouringEntryId = null;
      }
    }

    const newJar = recomputeJar(jar, s.burnerOn, dt);
    if (newJar !== s.jar) patch.jar = newJar;
    if (newJar.danger >= 1 && !s.explosion.active) {
      if (Object.keys(patch).length) set(patch);
      get().triggerExplosion();
      return;
    }

    // Table physics
    const items = s.tableItems.map((t) => {
      if (t.resting) return t;
      const [px, py, pz] = t.position;
      let [vx, vy, vz] = t.velocity;
      const [rx, ry, rz] = t.rotation;
      let [ax, ay, az] = t.angularVelocity;
      vy -= 9.8 * dt;
      let nx = px + vx * dt;
      let ny = py + vy * dt;
      let nz = pz + vz * dt;
      const nrx = rx + ax * dt;
      const nry = ry + ay * dt;
      const nrz = rz + az * dt;
      const onTableXZ = Math.abs(nx) < TABLE_HALF_X && Math.abs(nz) < TABLE_HALF_Z;
      const onJar =
        Math.hypot(nx - JAR_CENTER[0], nz - JAR_CENTER[2]) < JAR_BLOCK_R &&
        ny < TABLE_Y + 0.6;
      const half = 0.07;
      if (onTableXZ && !onJar && ny < TABLE_Y + half) {
        ny = TABLE_Y + half;
        if (vy < 0) vy = -vy * 0.32;
        vx *= 0.86; vz *= 0.86;
        ax *= 0.7; ay *= 0.85; az *= 0.7;
      }
      if (onJar) {
        const dx = nx - JAR_CENTER[0];
        const dz = nz - JAR_CENTER[2];
        const d = Math.max(0.001, Math.hypot(dx, dz));
        nx = JAR_CENTER[0] + (dx / d) * JAR_BLOCK_R;
        nz = JAR_CENTER[2] + (dz / d) * JAR_BLOCK_R;
        vx += (dx / d) * 0.6;
        vz += (dz / d) * 0.6;
      }
      if (!onTableXZ && ny < FLOOR_Y + half) {
        ny = FLOOR_Y + half;
        if (vy < 0) vy = -vy * 0.18;
        vx *= 0.7; vz *= 0.7;
        ax *= 0.5; ay *= 0.7; az *= 0.5;
      }
      const speed2 = vx * vx + vy * vy + vz * vz;
      const onSurface =
        (onTableXZ && !onJar && ny <= TABLE_Y + half + 0.001) ||
        (!onTableXZ && ny <= FLOOR_Y + half + 0.001);
      const resting = onSurface && speed2 < 0.02 && Math.abs(ax) + Math.abs(ay) + Math.abs(az) < 0.5;
      return {
        ...t,
        position: [nx, ny, nz] as [number, number, number],
        velocity: [vx, vy, vz] as [number, number, number],
        rotation: [nrx, nry, nrz] as [number, number, number],
        angularVelocity: [ax, ay, az] as [number, number, number],
        resting,
      };
    });
    patch.tableItems = items;

    if (s.shards.length) {
      const shards: Shard[] = [];
      for (const sh of s.shards) {
        const nlife = sh.life - dt;
        if (nlife <= 0) continue;
        let [vx, vy, vz] = sh.velocity;
        vy -= 9.8 * dt;
        const [px, py, pz] = sh.position;
        let nx = px + vx * dt;
        let ny = py + vy * dt;
        let nz = pz + vz * dt;
        const [rx, ry, rz] = sh.rotation;
        const [ax, ay, az] = sh.angularVelocity;
        const nrx = rx + ax * dt;
        const nry = ry + ay * dt;
        const nrz = rz + az * dt;
        if (Math.abs(nx) < TABLE_HALF_X && Math.abs(nz) < TABLE_HALF_Z && ny < TABLE_Y + 0.01) {
          ny = TABLE_Y + 0.01;
          if (vy < 0) vy = -vy * 0.3;
          vx *= 0.7; vz *= 0.7;
        } else if (ny < FLOOR_Y + 0.01) {
          ny = FLOOR_Y + 0.01;
          if (vy < 0) vy = -vy * 0.2;
          vx *= 0.6; vz *= 0.6;
        }
        shards.push({
          ...sh,
          position: [nx, ny, nz],
          velocity: [vx, vy, vz],
          rotation: [nrx, nry, nrz],
          life: nlife,
        });
      }
      patch.shards = shards;
    }

    if (Object.keys(patch).length) set(patch);
  },
}));
