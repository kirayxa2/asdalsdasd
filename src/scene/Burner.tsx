import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGame } from "../store/gameStore";

/**
 * Hot-plate style lab burner: thick base, body, and a metal ring on top that
 * the jar physically sits on. Flame is visible inside the ring under the jar.
 */
export function Burner({ position }: { position: [number, number, number] }) {
  const burnerOn = useGame((s) => s.burnerOn);
  const flame = useRef<THREE.Group>(null);
  const matBlue = useRef<THREE.MeshBasicMaterial>(null);
  const matYellow = useRef<THREE.MeshBasicMaterial>(null);
  const matCore = useRef<THREE.MeshBasicMaterial>(null);
  const heatLight = useRef<THREE.PointLight>(null);

  useFrame(() => {
    if (!flame.current) return;
    const target = burnerOn ? 1 : 0;
    flame.current.scale.y += (target - flame.current.scale.y) * 0.08;
    const t = performance.now() * 0.001;
    flame.current.scale.x = 0.9 + Math.sin(t * 18) * 0.08 + Math.sin(t * 7) * 0.04;
    flame.current.scale.z = 0.9 + Math.cos(t * 16) * 0.08 + Math.cos(t * 6) * 0.04;
    const flicker = 0.85 + Math.sin(t * 30) * 0.15 + (Math.random() - 0.5) * 0.08;
    const k = burnerOn ? 1 : 0;
    if (matBlue.current) matBlue.current.opacity = 0.65 * flicker * k;
    if (matYellow.current) matYellow.current.opacity = 0.85 * flicker * k;
    if (matCore.current) matCore.current.opacity = 1 * flicker * k;
    if (heatLight.current) heatLight.current.intensity = burnerOn ? 2.4 + Math.sin(t * 25) * 0.5 : 0;
  });

  // Burner sits at given (x, table_y, z). Total height of the burner = 0.22.
  return (
    <group position={position}>
      {/* base disk (wide, heavy) */}
      <mesh castShadow receiveShadow position={[0, 0.025, 0]}>
        <cylinderGeometry args={[0.34, 0.36, 0.05, 40]} />
        <meshStandardMaterial color="#1a1a1d" metalness={0.6} roughness={0.45} />
      </mesh>
      {/* body */}
      <mesh castShadow position={[0, 0.13, 0]}>
        <cylinderGeometry args={[0.25, 0.30, 0.12, 32]} />
        <meshStandardMaterial color="#28282c" metalness={0.5} roughness={0.45} />
      </mesh>
      {/* gas knob */}
      <mesh castShadow position={[0.30, 0.12, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.04, 0.04, 0.07, 16]} />
        <meshStandardMaterial color="#a82828" metalness={0.5} roughness={0.4} emissive={burnerOn ? "#ff3030" : "#000000"} emissiveIntensity={burnerOn ? 0.6 : 0} />
      </mesh>
      {/* support ring (metal grid where the jar sits) — torus on top */}
      <mesh castShadow position={[0, 0.21, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.21, 0.018, 12, 32]} />
        <meshStandardMaterial color="#3a3a3e" metalness={0.85} roughness={0.25} />
      </mesh>
      {/* three crossbars across the ring (gives the jar something visible to rest on) */}
      {[0, Math.PI / 3, (2 * Math.PI) / 3].map((a, i) => (
        <mesh key={i} position={[0, 0.21, 0]} rotation={[0, a, 0]} castShadow>
          <boxGeometry args={[0.42, 0.012, 0.012]} />
          <meshStandardMaterial color="#3a3a3e" metalness={0.85} roughness={0.25} />
        </mesh>
      ))}

      {/* Flame inside the ring, going UP through it */}
      <group ref={flame} position={[0, 0.16, 0]} scale={[1, 0, 1]}>
        <mesh>
          <coneGeometry args={[0.16, 0.30, 20]} />
          <meshBasicMaterial
            ref={matBlue}
            color="#3a8aff"
            transparent
            opacity={0}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </mesh>
        <mesh position={[0, -0.01, 0]}>
          <coneGeometry args={[0.10, 0.22, 18]} />
          <meshBasicMaterial
            ref={matYellow}
            color="#ffb040"
            transparent
            opacity={0}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </mesh>
        <mesh position={[0, -0.03, 0]}>
          <coneGeometry args={[0.05, 0.14, 16]} />
          <meshBasicMaterial
            ref={matCore}
            color="#ffe8b0"
            transparent
            opacity={0}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </mesh>
        <pointLight ref={heatLight} color="#ff9a40" intensity={0} distance={2.6} decay={2} />
      </group>
    </group>
  );
}
