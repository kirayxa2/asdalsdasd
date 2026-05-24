import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGame } from "../store/gameStore";
import { ITEMS_BY_ID } from "../data/items";
import { ItemMesh } from "./ItemMesh";
import { JAR_POSITION } from "./Jar";

/**
 * The item the player is currently holding (follows pointer in world space).
 * Liquids tilt automatically when hovering over the jar.
 */
export function HeldItem() {
  const heldItemId = useGame((s) => s.heldItemId);
  const pointer = useGame((s) => s.pointer);
  const setPourTilt = useGame((s) => s.setPourTilt);
  const pourTilt = useGame((s) => s.pourTilt);
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, dt) => {
    if (!groupRef.current || !heldItemId) return;
    // Smooth follow
    const target = new THREE.Vector3(pointer.x, pointer.y, pointer.z);
    groupRef.current.position.lerp(target, Math.min(1, dt * 20));

    // Auto-tilt liquids when over the jar
    const def = ITEMS_BY_ID[heldItemId];
    if (def?.kind === "liquid") {
      const dx = pointer.x - JAR_POSITION[0];
      const dz = pointer.z - JAR_POSITION[2];
      const overJar = Math.hypot(dx, dz) < 0.3 && pointer.y > JAR_POSITION[1] - 0.1;
      const targetTilt = overJar ? 1 : 0;
      setPourTilt(pourTilt + (targetTilt - pourTilt) * Math.min(1, dt * 6));
    } else if (pourTilt !== 0) {
      setPourTilt(0);
    }
  });

  if (!heldItemId) return null;
  const def = ITEMS_BY_ID[heldItemId];
  if (!def) return null;

  return (
    <group ref={groupRef} position={[pointer.x, pointer.y, pointer.z]}>
      <ItemMesh def={def} highlighted tilt={-pourTilt * 1.3} />

      {/* Pouring liquid stream */}
      {def.kind === "liquid" && pourTilt > 0.4 && (
        <mesh position={[0, -0.18, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 0.4, 8]} />
          <meshBasicMaterial
            color={def.liquidColor ?? def.color}
            transparent
            opacity={pourTilt}
          />
        </mesh>
      )}
    </group>
  );
}
