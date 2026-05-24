import type { ItemDef } from "../types";

// Catalog of items the player can pick up from the shelves.
// Order matters — first three are placed on left shelf, next on right shelf, etc.
export const ITEMS: ItemDef[] = [
  // --- Fruits (organic solids) ---
  {
    id: "banana",
    name: "Banana",
    kind: "solid",
    tags: ["organic"],
    shape: "banana",
    color: "#f6d743",
    accent: "#6b4a1a",
  },
  {
    id: "apple",
    name: "Apple",
    kind: "solid",
    tags: ["organic"],
    shape: "apple",
    color: "#d83a2a",
    accent: "#3b6b1f",
  },
  {
    id: "orange",
    name: "Orange",
    kind: "solid",
    tags: ["organic"],
    shape: "orange",
    color: "#ff8a1f",
    accent: "#356b22",
  },

  // --- Liquids ---
  {
    id: "acid",
    name: "Acid",
    kind: "liquid",
    tags: ["acid"],
    shape: "bottle",
    color: "#1a8f3a",
    accent: "#102a14",
    liquidColor: "#7cff66",
  },
  {
    id: "water",
    name: "Water",
    kind: "liquid",
    tags: ["water"],
    shape: "bottle",
    color: "#3aa7d8",
    accent: "#0d3a52",
    liquidColor: "#9fd7ff",
  },
  {
    id: "vinegar",
    name: "Vinegar",
    kind: "liquid",
    tags: ["acid"],
    shape: "bottle",
    color: "#a06030",
    accent: "#3a1d10",
    liquidColor: "#d4a26a",
  },

  // --- Dangerous solids ---
  {
    id: "uranium",
    name: "Uranium",
    kind: "solid",
    tags: ["uranium", "metal"],
    shape: "cube",
    color: "#384a32",
    emissive: "#a8ff5a",
    emissiveIntensity: 1.6,
  },

  // --- Lab tools ---
  {
    id: "flask",
    name: "Flask",
    kind: "solid",
    tags: ["glass"],
    shape: "flask",
    color: "#cfeaff",
    accent: "#9ec8e8",
  },
  {
    id: "test-tube",
    name: "Test tube",
    kind: "solid",
    tags: ["glass"],
    shape: "test-tube",
    color: "#dff1ff",
    accent: "#9ec8e8",
  },
  {
    id: "spoon",
    name: "Spoon",
    kind: "solid",
    tags: ["metal"],
    shape: "spoon",
    color: "#cfd4d8",
  },
];

export const ITEMS_BY_ID: Record<string, ItemDef> = Object.fromEntries(
  ITEMS.map((i) => [i.id, i]),
);
