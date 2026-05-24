import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGame, JAR_CENTER } from "../store/gameStore";
import { ITEMS_BY_ID } from "../data/items";
import { ItemMesh } from "./ItemMesh";

/**
 * Item attached to the cursor. Smooth-follows pointer. When pouring, draws
 * a falling liquid stream from the bottle neck down to the jar top.
 */
export function HeldItem() {
  const heldItemId = useGame((s) => s.heldItemId);
  const pointer = useGame((s) => s.pointer);
  const pourTilt = useGame((s) => s.pourTilt);
  const pouringEntryId = useGame((s) => s.pouringEntryId);
  const groupRef = useRef<THREE.Group>(null);
  const streamRef = useRef<THREE.Mesh>(null);

  useFrame((_, dt) => {
    if (!groupRef.current || !heldItemId) return;
    const target = new THREE.Vector3(pointer.x, pointer.y, pointer.z);
    groupRef.current.position.lerp(target, Math.min(1, dt * 22));

    if (streamRef.current) {
      streamRef.current.visible = !!pouringEntryId;
    }
  });

  if (!heldItemId) return null;
  const def = ITEMS_BY_ID[heldItemId];
  if (!def) return null;

  // Compute stream length from current bottle position down to jar opening.
  const fromY = pointer.y - 0.15;
  const toY = JAR_CENTER[1] + 0.18;
  const streamLen = Math.max(0.05, fromY - toY);

  return (
    <group ref={groupRef} position={[pointer.x, pointer.y, pointer.z]}>
      {/* Tilt visually only if pouring (pourTilt=1) */}
      <group rotation={[0, 0, -pourTilt * 1.4]}>
        <ItemMesh def={def} highlighted />
      </group>

      {/* Pouring stream — drawn between bottle neck (local) and jar top in world.
          We draw it in WORLD space by attaching to the held group with offsets. */}
      {def.kind === "liquid" && (
        <mesh
          ref={streamRef}
          visible={!!pouringEntryId}
          position={[
            JAR_CENTER[0] - pointer.x,
            -streamLen / 2 - 0.1,
            JAR_CENTER[2] - pointer.z,
          ]}
        >
          <cylinderGeometry args={[0.018, 0.012, streamLen, 8]} />
          <meshStandardMaterial
            color={def.liquidColor ?? def.color}
            emissive={def.liquidColor ?? def.color}
            emissiveIntensity={0.3}
            transparent
            opacity={0.85}
          />
        </mesh>
      )}
    </group>
  );
}
