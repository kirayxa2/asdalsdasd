import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGame } from "../store/gameStore";

/**
 * Bunsen-burner-ish base + animated flame above when on.
 */
export function Burner({ position }: { position: [number, number, number] }) {
  const burnerOn = useGame((s) => s.burnerOn);
  const flame = useRef<THREE.Group>(null);
  const flameMat1 = useRef<THREE.MeshBasicMaterial>(null);
  const flameMat2 = useRef<THREE.MeshBasicMaterial>(null);

  useFrame((_, dt) => {
    if (!flame.current) return;
    const target = burnerOn ? 1 : 0;
    flame.current.scale.y += (target - flame.current.scale.y) * Math.min(1, dt * 6);
    flame.current.scale.x = 0.85 + Math.sin(performance.now() * 0.02) * 0.08;
    flame.current.scale.z = 0.85 + Math.cos(performance.now() * 0.018) * 0.08;
    const flicker = 0.85 + Math.sin(performance.now() * 0.04) * 0.15;
    if (flameMat1.current) flameMat1.current.opacity = 0.9 * flicker * (burnerOn ? 1 : 0);
    if (flameMat2.current) flameMat2.current.opacity = 0.7 * flicker * (burnerOn ? 1 : 0);
  });

  return (
    <group position={position}>
      {/* base disk */}
      <mesh castShadow receiveShadow position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.28, 0.32, 0.04, 32]} />
        <meshStandardMaterial color="#1a1a1c" metalness={0.7} roughness={0.4} />
      </mesh>
      {/* mid neck */}
      <mesh castShadow position={[0, 0.09, 0]}>
        <cylinderGeometry args={[0.12, 0.16, 0.1, 24]} />
        <meshStandardMaterial color="#2a2a2e" metalness={0.6} roughness={0.45} />
      </mesh>
      {/* tube top */}
      <mesh castShadow position={[0, 0.18, 0]}>
        <cylinderGeometry args={[0.085, 0.1, 0.08, 20]} />
        <meshStandardMaterial color="#3a3a40" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* gas knob */}
      <mesh castShadow position={[0.22, 0.06, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.03, 0.03, 0.06, 12]} />
        <meshStandardMaterial color="#aa2222" metalness={0.4} roughness={0.5} />
      </mesh>

      {/* flame */}
      <group ref={flame} position={[0, 0.32, 0]} scale={[1, 0, 1]}>
        {/* outer cool flame */}
        <mesh ref={(r) => r && (r as any)}>
          <coneGeometry args={[0.13, 0.5, 16]} />
          <meshBasicMaterial
            ref={flameMat2}
            color="#3aa0ff"
            transparent
            opacity={0.7}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
        {/* inner hot flame */}
        <mesh position={[0, -0.05, 0]}>
          <coneGeometry args={[0.07, 0.32, 16]} />
          <meshBasicMaterial
            ref={flameMat1}
            color="#ffd040"
            transparent
            opacity={0.9}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
        {/* light source */}
        {burnerOn && (
          <pointLight color="#ff9a40" intensity={1.2} distance={2.2} decay={2} />
        )}
      </group>
    </group>
  );
}
