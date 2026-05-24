import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGame, JAR_CENTER, JAR_R } from "../store/gameStore";
import { ITEMS_BY_ID } from "../data/items";
import { ItemMesh } from "./ItemMesh";
import { Bubbles } from "./effects/Bubbles";

const JAR_HEIGHT = 0.40;

export const JAR_POSITION = JAR_CENTER;

/**
 * Glass jar with closed bottom, transparent walls, dynamic liquid inside,
 * floating solids, bubble particles, and radioactive glow light.
 */
export function Jar() {
  const jar = useGame((s) => s.jar);
  const groupRef = useRef<THREE.Group>(null);
  const liquidRef = useRef<THREE.Mesh>(null);
  const liquidMat = useRef<THREE.MeshStandardMaterial>(null);
  const liquidTopRef = useRef<THREE.Mesh>(null);
  const liquidTopMat = useRef<THREE.MeshStandardMaterial>(null);
  const glowLight = useRef<THREE.PointLight>(null);

  useFrame(() => {
    if (groupRef.current) {
      const sx = (Math.random() - 0.5) * jar.shake * 0.04;
      const sz = (Math.random() - 0.5) * jar.shake * 0.04;
      groupRef.current.position.set(
        JAR_POSITION[0] + sx,
        JAR_POSITION[1],
        JAR_POSITION[2] + sz,
      );
    }
    const h = JAR_HEIGHT * jar.liquidLevel;
    if (liquidRef.current) {
      liquidRef.current.scale.y = Math.max(0.001, h / JAR_HEIGHT);
      liquidRef.current.position.y = -JAR_HEIGHT / 2 + h / 2;
    }
    if (liquidTopRef.current) {
      liquidTopRef.current.position.y = -JAR_HEIGHT / 2 + h - 0.001;
      liquidTopRef.current.visible = jar.liquidLevel > 0.02;
    }
    if (liquidMat.current) {
      liquidMat.current.color.set(jar.liquidColor);
      liquidMat.current.emissive.set(jar.liquidColor);
      liquidMat.current.emissiveIntensity = 0.05 + jar.glow * 1.4;
      liquidMat.current.opacity = jar.liquidLevel > 0 ? 0.92 : 0;
    }
    if (liquidTopMat.current) {
      liquidTopMat.current.color.set(jar.liquidColor);
      liquidTopMat.current.emissive.set(jar.liquidColor);
      liquidTopMat.current.emissiveIntensity = 0.1 + jar.glow * 1.6;
    }
    if (glowLight.current) {
      glowLight.current.intensity = jar.glow * 2.5;
      glowLight.current.color.set(jar.liquidColor);
    }
  });

  return (
    <group ref={groupRef} position={JAR_POSITION}>
      {/* Outer glass: closed cylinder using two passes for nicer transparency.
          Single physical material with transmission gives the cleanest look. */}
      <mesh castShadow position={[0, 0, 0]}>
        <cylinderGeometry args={[JAR_R, JAR_R, JAR_HEIGHT, 40, 1, false]} />
        <meshPhysicalMaterial
          color="#eef6ff"
          roughness={0.05}
          metalness={0}
          transmission={0.95}
          thickness={0.25}
          ior={1.45}
          attenuationColor="#e0eeff"
          attenuationDistance={1.2}
          transparent
          opacity={0.55}
        />
      </mesh>
      {/* Rim */}
      <mesh position={[0, JAR_HEIGHT / 2, 0]}>
        <torusGeometry args={[JAR_R, 0.012, 12, 40]} />
        <meshStandardMaterial color="#bcd4e6" roughness={0.3} />
      </mesh>

      {/* Liquid body */}
      <mesh ref={liquidRef} position={[0, 0, 0]}>
        <cylinderGeometry args={[JAR_R - 0.012, JAR_R - 0.012, JAR_HEIGHT, 40]} />
        <meshStandardMaterial
          ref={liquidMat}
          color="#1a1a1a"
          transparent
          opacity={0}
          depthWrite={false}
        />
      </mesh>
      {/* Liquid top disk (surface) — gives a clear meniscus */}
      <mesh ref={liquidTopRef} position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[JAR_R - 0.013, 40]} />
        <meshStandardMaterial
          ref={liquidTopMat}
          color="#1a1a1a"
          transparent
          opacity={0.95}
          depthWrite={false}
        />
      </mesh>

      <JarContents />

      <pointLight ref={glowLight} color="#88ff66" intensity={0} distance={2} />

      <Bubbles
        center={[0, 0, 0]}
        radius={JAR_R - 0.02}
        liquidTop={-JAR_HEIGHT / 2 + JAR_HEIGHT * jar.liquidLevel}
        liquidBottom={-JAR_HEIGHT / 2}
        intensity={jar.bubbles}
      />
    </group>
  );
}

function JarContents() {
  const entries = useGame((s) => s.jar.entries);
  const solids = entries.filter((e) => e.kind === "solid");
  return (
    <>
      {solids.map((e, idx) => {
        const def = ITEMS_BY_ID[e.itemId];
        if (!def) return null;
        const angle = (idx / Math.max(1, solids.length)) * Math.PI * 2;
        const r = solids.length > 1 ? 0.06 : 0;
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
