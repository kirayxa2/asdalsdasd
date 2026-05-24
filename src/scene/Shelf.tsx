import { useState } from "react";
import { ItemMesh } from "./ItemMesh";
import { ITEMS_BY_ID } from "../data/items";
import { useGame } from "../store/gameStore";
import type { ItemDef } from "../types";

interface ShelfProps {
  position: [number, number, number];
  rotationY?: number;
  itemIds: string[];      // up to 4 items per shelf
  side: "left" | "right" | "back-left" | "back-right";
}

/**
 * A shelf with up to 4 item slots. Each item is hoverable and clickable to
 * pick up. Held items disappear from the shelf until released.
 */
export function Shelf({ position, rotationY = 0, itemIds, side }: ShelfProps) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* shelf board */}
      <mesh castShadow receiveShadow position={[0, 0, 0]}>
        <boxGeometry args={[1.6, 0.04, 0.35]} />
        <meshStandardMaterial color="#23211e" roughness={0.85} />
      </mesh>
      {/* back panel */}
      <mesh position={[0, 0.25, -0.17]}>
        <boxGeometry args={[1.6, 0.5, 0.02]} />
        <meshStandardMaterial color="#181614" roughness={0.95} />
      </mesh>

      {itemIds.map((id, idx) => {
        const def = ITEMS_BY_ID[id];
        if (!def) return null;
        const slot = `${side}-${idx}`;
        // Spread items across the shelf.
        const spread = 1.2;
        const x = (idx - (itemIds.length - 1) / 2) * (spread / Math.max(1, itemIds.length - 1));
        return (
          <ShelfSlot key={slot} slotId={slot} def={def} position={[x, 0.18, 0]} />
        );
      })}
    </group>
  );
}

function ShelfSlot({
  slotId,
  def,
  position,
}: {
  slotId: string;
  def: ItemDef;
  position: [number, number, number];
}) {
  const [hover, setHover] = useState(false);
  const heldItemId = useGame((s) => s.heldItemId);
  const heldOriginShelf = useGame((s) => s.heldOriginShelf);
  const pickUp = useGame((s) => s.pickUpFromShelf);

  // Hide this slot if its item is currently held.
  const isHeldFromHere = heldItemId === def.id && heldOriginShelf === slotId;
  if (isHeldFromHere) return null;
  // Also hide if any item is held (single-hand) — except this isn't held.
  // We still show the others so you can see the shelf.

  return (
    <group
      position={position}
      onPointerOver={(e) => {
        e.stopPropagation();
        if (!heldItemId) setHover(true);
        document.body.style.cursor = heldItemId ? "default" : "grab";
      }}
      onPointerOut={() => {
        setHover(false);
        document.body.style.cursor = "default";
      }}
      onPointerDown={(e) => {
        if (heldItemId) return;
        e.stopPropagation();
        pickUp(def.id, slotId);
        setHover(false);
        document.body.style.cursor = "grabbing";
      }}
    >
      <ItemMesh def={def} highlighted={hover} />
    </group>
  );
}
