import { create } from "zustand";
import type { JarEntry, JarState, Shard, TableItem } from "../types";
import { ITEMS_BY_ID } from "../data/items";
import { recomputeJar } from "../data/reactions";

// Table top is at y = 0.92 (from Table.tsx), floor at y = 0.
const TABLE_Y = 0.92;
const FLOOR_Y = 0;
const TABLE_HALF_X = 1.6;
const TABLE_HALF_Z = 0.8;
// Jar footprint (don't let items rest under the jar visually).
const JAR_X = 0;
const JAR_Z = 0;
const JAR_R_BLOCK = 0.36; // radius around jar where things slide off

interface GameState {
  // ---- Held item ----
  heldItemId: string | null;
  heldOriginShelf: string | null;
  heldOriginTableId: string | null; // if picked up from the table
  heldOriginTableSnapshot: TableItem | null; // restore-on-void when from table
  pointer: { x: number; y: number; z: number };
  pointerPrev: { x: number; y: number; z: number };
  pourTilt: number;

  // ---- Jar ----
  jar: JarState;

  // ---- Burner ----
  burnerOn: boolean;

  // ---- Explosion / shards / camera shake ----
  explosion: { active: boolean; t: number };
  shards: Shard[];
  cameraShake: number;
  flash: number; // full-screen white flash 0..1

  // ---- Camera ----
  cameraMode: "static" | "orbit" | "fps";

  // ---- Table physics ----
  tableItems: TableItem[];

  // ---- Actions ----
  pickUpFromShelf: (itemId: string, shelfSlot: string) => void;
  pickUpFromTable: (tableId: string) => void;
  release: (target: "jar" | "table" | "void") => void;
  setPointer: (x: number, y: number, z: number) => void;
  setPourTilt: (t: number) => void;
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
  pointer: { x: 0, y: 1.4, z: 0.5 },
  pointerPrev: { x: 0, y: 1.4, z: 0.5 },
  pourTilt: 0,
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
      const entry: JarEntry = {
        id: uid(def.id),
        itemId: def.id,
        tags: def.tags,
        kind: def.kind,
        color: def.kind === "liquid" ? def.liquidColor ?? def.color : def.color,
        integrity: 1,
      };
      set({
        jar: { ...s.jar, entries: [...s.jar.entries, entry] },
        heldItemId: null,
        heldOriginShelf: null,
        heldOriginTableId: null,
        heldOriginTableSnapshot: null,
        pourTilt: 0,
      });
    } else if (target === "table") {
      // Drop onto the table — it falls with momentum from cursor velocity.
      const vx = (s.pointer.x - s.pointerPrev.x) * 12;
      const vy = 0;
      const vz = (s.pointer.z - s.pointerPrev.z) * 12;
      const ti: TableItem = {
        id: uid("ti"),
        itemId: def.id,
        position: [s.pointer.x, Math.max(s.pointer.y, 1.2), s.pointer.z],
        velocity: [vx, vy, vz],
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
      // void: shelf items just snap back (they're not in tableItems).
      // Items picked up FROM the table: restore the snapshot so they don't disappear.
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
  toggleBurner: () => set((s) => ({ burnerOn: !s.burnerOn })),
  setCameraMode: (m) => set({ cameraMode: m }),

  resetJar: () =>
    set({
      jar: emptyJar(),
      explosion: { active: false, t: 0 },
      burnerOn: false,
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
    }),

  triggerExplosion: () => {
    const s = get();
    // Spawn ~24 glass shards radiating outward.
    const shards: Shard[] = [];
    for (let i = 0; i < 24; i++) {
      const a = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 4;
      shards.push({
        id: uid("shd"),
        position: [JAR_X, TABLE_Y + 0.25, JAR_Z],
        velocity: [Math.cos(a) * speed, 2 + Math.random() * 4, Math.sin(a) * speed],
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
    // Blast existing table items away.
    const newTable = s.tableItems.map((t) => {
      const dx = t.position[0] - JAR_X;
      const dz = t.position[2] - JAR_Z;
      const d = Math.max(0.2, Math.hypot(dx, dz));
      const force = 6 / d;
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
    });
  },

  tick: (dt) => {
    const s = get();
    const patch: Partial<GameState> = {};

    // ---- Explosion timer ----
    if (s.explosion.active) {
      const nt = s.explosion.t + dt;
      if (nt > 2.4) patch.explosion = { active: false, t: 0 };
      else patch.explosion = { active: true, t: nt };
    }

    // ---- Camera shake & flash decay ----
    if (s.cameraShake > 0) patch.cameraShake = Math.max(0, s.cameraShake - dt * 1.4);
    if (s.flash > 0) patch.flash = Math.max(0, s.flash - dt * 2.5);

    // ---- Recompute jar ----
    const newJar = recomputeJar(s.jar, s.burnerOn, dt);
    if (newJar !== s.jar) patch.jar = newJar;
    if (newJar.danger >= 1 && !s.explosion.active) {
      // Apply patch first, then call explosion which sets more state.
      if (Object.keys(patch).length) set(patch);
      get().triggerExplosion();
      return;
    }

    // ---- Table item physics ----
    const items = s.tableItems.map((t) => {
      if (t.resting) return t;
      const [px, py, pz] = t.position;
      let [vx, vy, vz] = t.velocity;
      const [rx, ry, rz] = t.rotation;
      let [ax, ay, az] = t.angularVelocity;

      // Gravity
      vy -= 9.8 * dt;

      // Integrate
      let nx = px + vx * dt;
      let ny = py + vy * dt;
      let nz = pz + vz * dt;
      let nrx = rx + ax * dt;
      let nry = ry + ay * dt;
      let nrz = rz + az * dt;

      // Collision with table top (only within table footprint and not on jar)
      const onTableXZ =
        Math.abs(nx) < TABLE_HALF_X && Math.abs(nz) < TABLE_HALF_Z;
      const onJar = Math.hypot(nx - JAR_X, nz - JAR_Z) < JAR_R_BLOCK && ny < TABLE_Y + 0.5;
      const itemHalfHeight = 0.07;

      if (onTableXZ && !onJar && ny < TABLE_Y + itemHalfHeight) {
        ny = TABLE_Y + itemHalfHeight;
        if (vy < 0) vy = -vy * 0.32; // bounce
        // Friction on horizontal velocity
        vx *= 0.86;
        vz *= 0.86;
        // Damp angular velocity on contact
        ax *= 0.7;
        ay *= 0.85;
        az *= 0.7;
      }

      // Push off the jar zone (slide outward).
      if (onJar) {
        const dx = nx - JAR_X;
        const dz = nz - JAR_Z;
        const d = Math.max(0.001, Math.hypot(dx, dz));
        nx = JAR_X + (dx / d) * JAR_R_BLOCK;
        nz = JAR_Z + (dz / d) * JAR_R_BLOCK;
        vx += (dx / d) * 0.6;
        vz += (dz / d) * 0.6;
      }

      // Edge of the table -> fall to the floor
      if (!onTableXZ && ny < FLOOR_Y + itemHalfHeight) {
        ny = FLOOR_Y + itemHalfHeight;
        if (vy < 0) vy = -vy * 0.18;
        vx *= 0.7;
        vz *= 0.7;
        ax *= 0.5;
        ay *= 0.7;
        az *= 0.5;
      }

      // Sleep when low motion on a surface.
      const speed2 = vx * vx + vy * vy + vz * vz;
      const onSurface =
        (onTableXZ && !onJar && ny <= TABLE_Y + itemHalfHeight + 0.001) ||
        (!onTableXZ && ny <= FLOOR_Y + itemHalfHeight + 0.001);
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

    // ---- Shards physics ----
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

        // bounce on table
        if (
          Math.abs(nx) < TABLE_HALF_X &&
          Math.abs(nz) < TABLE_HALF_Z &&
          ny < TABLE_Y + 0.01
        ) {
          ny = TABLE_Y + 0.01;
          if (vy < 0) vy = -vy * 0.3;
          vx *= 0.7;
          vz *= 0.7;
        } else if (ny < FLOOR_Y + 0.01) {
          ny = FLOOR_Y + 0.01;
          if (vy < 0) vy = -vy * 0.2;
          vx *= 0.6;
          vz *= 0.6;
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
