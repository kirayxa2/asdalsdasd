import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGame, JAR_CENTER } from "../store/gameStore";
import { ITEMS_BY_ID } from "../data/items";
import { ItemMesh } from "./ItemMesh";

/**
 * Item attached to the cursor. Smooth-follow + tilt + curved pour stream.
 * Also draws a small ground shadow under the item so it feels grounded.
 */
export function HeldItem() {
  const heldItemId = useGame((s) => s.heldItemId);
  const pointer = useGame((s) => s.pointer);
  const pourTilt = useGame((s) => s.pourTilt);
  const pouringEntryId = useGame((s) => s.pouringEntryId);
  const groupRef = useRef<THREE.Group>(null);
  const streamRef = useRef<THREE.Mesh>(null);
  const streamGeo = useRef<THREE.TubeGeometry | null>(null);

  const tmp = useMemo(
    () => ({
      a: new THREE.Vector3(),
      b: new THREE.Vector3(),
      c: new THREE.Vector3(),
      target: new THREE.Vector3(),
    }),
    [],
  );

  useFrame((_, dt) => {
    if (!groupRef.current || !heldItemId) return;
    tmp.target.set(pointer.x, pointer.y, pointer.z);
    groupRef.current.position.lerp(tmp.target, Math.min(1, dt * 22));

    if (streamRef.current) {
      streamRef.current.visible = !!pouringEntryId;
      if (pouringEntryId) {
        // Local coords inside held group:
        // bottle neck ~ (0, 0.18, 0); jar opening world -> local subtracts pointer.
        const sx = 0,
          sy = 0.18,
          sz = 0;
        const ex = JAR_CENTER[0] - pointer.x;
        const ey = JAR_CENTER[1] + 0.22 - pointer.y;
        const ez = JAR_CENTER[2] - pointer.z;
        tmp.a.set(sx, sy, sz);
        tmp.b.set((sx + ex) / 2, (sy + ey) / 2 - 0.05, (sz + ez) / 2);
        tmp.c.set(ex, ey, ez);
        const curve = new THREE.CatmullRomCurve3([tmp.a, tmp.b, tmp.c], false);
        streamGeo.current?.dispose();
        const geo = new THREE.TubeGeometry(curve, 18, 0.014, 8, false);
        streamGeo.current = geo;
        streamRef.current.geometry = geo;
      }
    }
  });

  if (!heldItemId) return null;
  const def = ITEMS_BY_ID[heldItemId];
  if (!def) return null;

  return (
    <group ref={groupRef} position={[pointer.x, pointer.y, pointer.z]}>
      <group rotation={[0, 0, -pourTilt * 1.4]}>
        <ItemMesh def={def} highlighted />
      </group>

      {def.kind === "liquid" && (
        <mesh ref={streamRef} visible={false}>
          <bufferGeometry />
          <meshStandardMaterial
            color={def.liquidColor ?? def.color}
            emissive={def.liquidColor ?? def.color}
            emissiveIntensity={0.5}
            transparent
            opacity={0.95}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Ground shadow disc — projects roughly under the item onto the table. */}
      <mesh position={[0, -(pointer.y - 0.93), 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.15, 24]} />
        <meshBasicMaterial color="#000" transparent opacity={0.25} depthWrite={false} />
      </mesh>
    </group>
  );
}
