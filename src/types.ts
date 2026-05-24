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

// Visual shape used by the renderer to draw a stylized primitive for the item.
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
  id: string;            // stable id, e.g. "banana"
  name: string;          // display name
  kind: ItemKind;        // solid -> drop into jar; liquid -> pour into jar
  tags: Tag[];           // chemistry tags
  shape: ItemShape;      // how to render
  color: string;         // primary color
  accent?: string;       // secondary color (label, stem)
  liquidColor?: string;  // color of the liquid this bottle contains (if liquid)
  emissive?: string;     // for glowing items (uranium)
  emissiveIntensity?: number;
  scale?: number;        // overall mesh scale
}

// One entry inside the jar (after being dropped/poured).
export interface JarEntry {
  id: string;            // unique runtime id
  itemId: string;        // refers to ItemDef.id
  tags: Tag[];
  kind: ItemKind;
  color: string;         // color contribution
  // Solids slowly dissolve / burn — we keep an integrity 1..0 for visual.
  integrity: number;
}

// Visual / chemical state of the jar's contents.
export interface JarState {
  entries: JarEntry[];
  liquidColor: string;   // computed mix of liquid contributions
  liquidLevel: number;   // 0..1
  bubbles: number;       // 0..1 intensity
  smoke: number;         // 0..1 intensity
  sparks: number;        // 0..1 intensity
  glow: number;          // 0..1 radiation glow
  danger: number;        // 0..1, when >= 1 and heated -> explode
  shake: number;         // 0..1 transient shake (for explosion preview)
}
