// All tags used by the reaction system. Add a tag here to extend chemistry.
export type Tag =
  | "organic"
  | "acid"
  | "water"
  | "alcohol"
  | "metal"
  | "uranium"
  | "glass"
  | "salt";

export type ItemShape =
  | "banana"
  | "apple"
  | "orange"
  | "bottle"
  | "cube"
  | "flask"
  | "test-tube"
  | "spoon";

export type ItemKind = "solid" | "liquid";

export interface ItemDef {
  id: string;
  name: string;
  kind: ItemKind;
  tags: Tag[];
  shape: ItemShape;
  color: string;
  accent?: string;
  liquidColor?: string;
  emissive?: string;
  emissiveIntensity?: number;
  scale?: number;
}

// One entry inside the jar. For solids amount=1 always. For liquids it grows
// during pouring (0..1 = empty..one bottle's worth).
export interface JarEntry {
  id: string;
  itemId: string;
  tags: Tag[];
  kind: ItemKind;
  color: string;
  integrity: number; // 1=fresh, 0=dissolved (solids only)
  amount: number;    // 0..1 fill amount
}

export interface JarState {
  entries: JarEntry[];
  liquidColor: string;
  liquidLevel: number;
  bubbles: number;
  smoke: number;
  sparks: number;
  glow: number;
  danger: number;
  shake: number;
}

export interface TableItem {
  id: string;
  itemId: string;
  position: [number, number, number];
  velocity: [number, number, number];
  rotation: [number, number, number];
  angularVelocity: [number, number, number];
  resting: boolean;
  lastImpact: number; // performance.now() of last surface impact (for squash anim)
}

export interface Shard {
  id: string;
  position: [number, number, number];
  velocity: [number, number, number];
  rotation: [number, number, number];
  angularVelocity: [number, number, number];
  life: number;
  size: number;
}
