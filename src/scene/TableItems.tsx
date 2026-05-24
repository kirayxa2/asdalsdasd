import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGame } from "../store/gameStore";
import { ITEMS_BY_ID } from "../data/items";
import { ItemMesh } from "./ItemMesh";

/**
 * Items currently lying / falling on the table. Physics in store; here we
 * render + apply a squash-stretch animation triggered by impacts.
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

const SQUASH_DURATION = 0.18;

function FallingItem({
  id,
  itemId,
  position,
  rotation,
  lastImpact,
}: {
  id: string;
  itemId: string;
  position: [number, number, number];
  rotation: [number, number, number];
  lastImpact: number;
}) {
  const def = ITEMS_BY_ID[itemId];
  const [hover, setHover] = useState(false);
  const heldItemId = useGame((s) => s.heldItemId);
  const pickUp = useGame((s) => s.pickUpFromTable);
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!groupRef.current) return;
    const t = (performance.now() - lastImpact) / 1000;
    if (lastImpact === 0 || t > SQUASH_DURATION) {
      groupRef.current.scale.set(1, 1, 1);
      return;
    }
    const k = Math.sin((t / SQUASH_DURATION) * Math.PI);
    groupRef.current.scale.set(1 + 0.25 * k, 1 - 0.35 * k, 1 + 0.25 * k);
  });

  if (!def) return null;
  return (
    <group
      ref={groupRef}
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
