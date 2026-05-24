import { useState } from "react";
import { useGame } from "../store/gameStore";
import { ITEMS_BY_ID } from "../data/items";
import { ItemMesh } from "./ItemMesh";

/**
 * Items currently lying / falling on the table. They follow the simple
 * physics integrator in the store. Hovering one lets you pick it up again.
 */
export function TableItems() {
  const items = useGame((s) => s.tableItems);
  return (
    <>
      {items.map((it) => (
        <FallingItem key={it.id} {...it} />
      ))}
    </>
  );
}

function FallingItem({
  id,
  itemId,
  position,
  rotation,
}: {
  id: string;
  itemId: string;
  position: [number, number, number];
  rotation: [number, number, number];
}) {
  const def = ITEMS_BY_ID[itemId];
  const [hover, setHover] = useState(false);
  const heldItemId = useGame((s) => s.heldItemId);
  const pickUp = useGame((s) => s.pickUpFromTable);
  if (!def) return null;
  return (
    <group
      position={position}
      rotation={rotation}
      onPointerOver={(e) => {
        e.stopPropagation();
        if (heldItemId) return;
        setHover(true);
        document.body.style.cursor = "grab";
      }}
      onPointerOut={() => {
        setHover(false);
        document.body.style.cursor = "default";
      }}
      onPointerDown={(e) => {
        if (heldItemId) return;
        e.stopPropagation();
        pickUp(id);
        document.body.style.cursor = "grabbing";
      }}
    >
      <ItemMesh def={def} highlighted={hover} />
    </group>
  );
}
