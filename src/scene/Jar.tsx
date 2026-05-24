import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGame, JAR_CENTER, JAR_R } from "../store/gameStore";
import { ITEMS_BY_ID } from "../data/items";
import { ItemMesh } from "./ItemMesh";
import { Bubbles } from "./effects/Bubbles";

const JAR_HEIGHT = 0.40;
export const JAR_POSITION = JAR_CENTER;

/**
 * Glass jar shaped via a Lathe of a hand-tuned 2D profile, so we get a real
 * jar silhouette (rounded shoulder + neck + rim) instead of a plain cylinder.
 * Liquid inside is also a Lathe scaled in Y for the fill level.
 *
 * Also draws a glowing green ring above the mouth when the player is holding
 * an item over the jar — a clear "drop here" indicator.
 */
export function Jar() {
  const jar = useGame((s) => s.jar);
  const overJar = useGame((s) => s.overJarHover);
  const heldItemId = useGame((s) => s.heldItemId);
  const groupRef = useRef<THREE.Group>(null);
  const liquidRef = useRef<THREE.Mesh>(null);
  const liquidMat = useRef<THREE.MeshStandardMaterial>(null);
  const liquidTopRef = useRef<THREE.Mesh>(null);
  const liquidTopMat = useRef<THREE.MeshStandardMaterial>(null);
  const glowLight = useRef<THREE.PointLight>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const ringMat = useRef<THREE.MeshBasicMaterial>(null);

  const glassProfile = useMemo(() => {
    const r = JAR_R;
    const h = JAR_HEIGHT;
    return [
      new THREE.Vector2(0.0, -h / 2),
      new THREE.Vector2(r * 0.7, -h / 2),
      new THREE.Vector2(r * 0.95, -h / 2 + 0.04),
      new THREE.Vector2(r * 1.0, -h / 2 + 0.10),
      new THREE.Vector2(r * 1.02, 0),
      new THREE.Vector2(r * 1.0, h / 2 - 0.10),
      new THREE.Vector2(r * 0.85, h / 2 - 0.04),
      new THREE.Vector2(r * 0.85, h / 2),
    ];
  }, []);

  const liquidProfile = useMemo(() => {
    const r = JAR_R - 0.018;
    const h = JAR_HEIGHT;
    return [
      new THREE.Vector2(0.0, -h / 2 + 0.005),
      new THREE.Vector2(r * 0.7, -h / 2 + 0.005),
      new THREE.Vector2(r * 0.94, -h / 2 + 0.045),
      new THREE.Vector2(r * 1.0, -h / 2 + 0.105),
      new THREE.Vector2(r * 1.02, 0),
      new THREE.Vector2(r * 1.02, h / 2),
    ];
  }, []);

  useFrame((_, dt) => {
    if (groupRef.current) {
      const sx = (Math.random() - 0.5) * jar.shake * 0.04;
      const sz = (Math.random() - 0.5) * jar.shake * 0.04;
      groupRef.current.position.set(
        JAR_POSITION[0] + sx,
        JAR_POSITION[1],
        JAR_POSITION[2] + sz,
      );
    }
    const fillRatio = Math.max(0.001, jar.liquidLevel);
    if (liquidRef.current) {
      liquidRef.current.scale.y = fillRatio;
      liquidRef.current.position.y =
        -JAR_HEIGHT / 2 + (JAR_HEIGHT * fillRatio) / 2 - 0.002;
    }
    if (liquidTopRef.current) {
      liquidTopRef.current.position.y =
        -JAR_HEIGHT / 2 + JAR_HEIGHT * jar.liquidLevel - 0.001;
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
    if (ringRef.current && ringMat.current) {
      const visible = !!heldItemId && overJar;
      const targetA = visible ? 0.85 : 0;
      ringMat.current.opacity += (targetA - ringMat.current.opacity) * Math.min(1, dt * 12);
      const pulse = 1 + Math.sin(performance.now() * 0.006) * 0.06;
      ringRef.current.scale.set(pulse, pulse, pulse);
    }
  });

  return (
    <group ref={groupRef} position={JAR_POSITION}>
      {/* Glass body (lathe) */}
      <mesh castShadow>
        <latheGeometry args={[glassProfile, 48]} />
        <meshPhysicalMaterial
          color="#eef6ff"
          roughness={0.04}
          metalness={0}
          transmission={0.95}
          thickness={0.25}
          ior={1.45}
          attenuationColor="#dceeff"
          attenuationDistance={1.4}
          transparent
          opacity={0.55}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Rim torus */}
      <mesh position={[0, JAR_HEIGHT / 2, 0]}>
        <torusGeometry args={[JAR_R * 0.85, 0.012, 12, 40]} />
        <meshStandardMaterial color="#bcd4e6" roughness={0.3} />
      </mesh>

      {/* Liquid (lathe) */}
      <mesh ref={liquidRef}>
        <latheGeometry args={[liquidProfile, 40]} />
        <meshStandardMaterial
          ref={liquidMat}
          color="#1a1a1a"
          transparent
          opacity={0}
          depthWrite={false}
        />
      </mesh>
      {/* Surface meniscus disk */}
      <mesh ref={liquidTopRef} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[JAR_R - 0.02, 40]} />
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

      {/* Drop zone indicator: glowing green ring above the jar mouth */}
      <mesh
        ref={ringRef}
        position={[0, JAR_HEIGHT / 2 + 0.06, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[JAR_R * 0.95, JAR_R * 1.15, 64]} />
        <meshBasicMaterial
          ref={ringMat}
          color="#7afa6e"
          transparent
          opacity={0}
          toneMapped={false}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
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
