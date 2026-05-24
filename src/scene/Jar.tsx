import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGame } from "../store/gameStore";
import { ITEMS_BY_ID } from "../data/items";
import { ItemMesh } from "./ItemMesh";
import { Bubbles } from "./effects/Bubbles";

const JAR_RADIUS = 0.18;
const JAR_HEIGHT = 0.4;

export const JAR_POSITION: [number, number, number] = [0, 1.16, 0];

/**
 * Glass jar standing on the burner. Contains liquid + dropped solids + bubbles.
 * Reacts to jar.shake / glow.
 */
export function Jar() {
  const jar = useGame((s) => s.jar);
  const groupRef = useRef<THREE.Group>(null);
  const liquidRef = useRef<THREE.Mesh>(null);
  const liquidMat = useRef<THREE.MeshStandardMaterial>(null);
  const glowLight = useRef<THREE.PointLight>(null);

  useFrame(() => {
    if (groupRef.current) {
      const sx = (Math.random() - 0.5) * jar.shake * 0.04;
      const sz = (Math.random() - 0.5) * jar.shake * 0.04;
      groupRef.current.position.set(JAR_POSITION[0] + sx, JAR_POSITION[1], JAR_POSITION[2] + sz);
    }
    if (liquidRef.current) {
      const h = JAR_HEIGHT * jar.liquidLevel;
      liquidRef.current.scale.y = Math.max(0.001, h / JAR_HEIGHT);
      liquidRef.current.position.y = -JAR_HEIGHT / 2 + h / 2;
    }
    if (liquidMat.current) {
      liquidMat.current.color.set(jar.liquidColor);
      liquidMat.current.emissive.set(jar.liquidColor);
      liquidMat.current.emissiveIntensity = 0.15 + jar.glow * 1.4;
      liquidMat.current.opacity = jar.liquidLevel > 0 ? 0.85 : 0;
    }
    if (glowLight.current) {
      glowLight.current.intensity = jar.glow * 2.5;
      glowLight.current.color.set(jar.liquidColor);
    }
  });

  const liquidTopWorld = JAR_POSITION[1] - JAR_HEIGHT / 2 + JAR_HEIGHT * jar.liquidLevel;
  const liquidBottomWorld = JAR_POSITION[1] - JAR_HEIGHT / 2;

  return (
    <group ref={groupRef} position={JAR_POSITION}>
      {/* glass body */}
      <mesh castShadow position={[0, 0, 0]}>
        <cylinderGeometry args={[JAR_RADIUS, JAR_RADIUS, JAR_HEIGHT, 32, 1, true]} />
        <meshPhysicalMaterial
          color="#cfeaff"
          roughness={0.05}
          transmission={0.92}
          thickness={0.4}
          ior={1.45}
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* bottom disk */}
      <mesh position={[0, -JAR_HEIGHT / 2 + 0.005, 0]}>
        <cylinderGeometry args={[JAR_RADIUS, JAR_RADIUS, 0.01, 32]} />
        <meshPhysicalMaterial
          color="#cfeaff"
          roughness={0.05}
          transmission={0.92}
          thickness={0.4}
          transparent
          opacity={0.6}
        />
      </mesh>
      {/* rim */}
      <mesh position={[0, JAR_HEIGHT / 2, 0]}>
        <torusGeometry args={[JAR_RADIUS, 0.012, 12, 32]} />
        <meshStandardMaterial color="#bcd4e6" roughness={0.3} />
      </mesh>

      {/* liquid */}
      <mesh ref={liquidRef} position={[0, 0, 0]} renderOrder={1}>
        <cylinderGeometry args={[JAR_RADIUS - 0.01, JAR_RADIUS - 0.01, JAR_HEIGHT, 32]} />
        <meshStandardMaterial
          ref={liquidMat}
          color="#1a1a1a"
          transparent
          opacity={0}
          depthWrite={false}
        />
      </mesh>

      {/* contents (solids floating in the jar, scaled by integrity) */}
      <JarContents />

      {/* glow light from radioactive content */}
      <pointLight ref={glowLight} color="#88ff66" intensity={0} distance={2} />

      {/* bubbles particle system, expressed in world coordinates of jar */}
      <BubblesProxy
        bubbles={jar.bubbles}
        liquidTop={liquidTopWorld - JAR_POSITION[1]}
        liquidBottom={liquidBottomWorld - JAR_POSITION[1]}
      />
    </group>
  );
}

function JarContents() {
  const entries = useGame((s) => s.jar.entries);
  return (
    <>
      {entries
        .filter((e) => e.kind === "solid")
        .map((e, idx) => {
          const def = ITEMS_BY_ID[e.itemId];
          if (!def) return null;
          // Arrange solids in a small ring at the bottom of the jar.
          const angle = (idx / Math.max(1, entries.length)) * Math.PI * 2;
          const r = entries.length > 1 ? 0.06 : 0;
          const x = Math.cos(angle) * r;
          const z = Math.sin(angle) * r;
          const y = -JAR_HEIGHT / 2 + 0.07 + (idx % 3) * 0.02;
          return (
            <group key={e.id} position={[x, y, z]} scale={0.7}>
              <ItemMesh def={def} integrity={e.integrity} />
            </group>
          );
        })}
    </>
  );
}

function BubblesProxy({
  bubbles,
  liquidTop,
  liquidBottom,
}: {
  bubbles: number;
  liquidTop: number;
  liquidBottom: number;
}) {
  return (
    <Bubbles
      center={[0, 0, 0]}
      radius={JAR_RADIUS - 0.02}
      liquidTop={liquidTop}
      liquidBottom={liquidBottom}
      intensity={bubbles}
    />
  );
}
