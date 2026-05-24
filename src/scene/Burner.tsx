import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGame } from "../store/gameStore";

/**
 * Bunsen-burner-ish base + multi-layer animated flame above. The flame is
 * built from several stacked cones with additive blending and per-frame
 * jitter so it feels alive.
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
    flame.current.scale.x = 0.85 + Math.sin(t * 18) * 0.1 + Math.sin(t * 7) * 0.04;
    flame.current.scale.z = 0.85 + Math.cos(t * 16) * 0.1 + Math.cos(t * 6) * 0.04;
    const flicker = 0.85 + Math.sin(t * 30) * 0.15 + (Math.random() - 0.5) * 0.1;
    const k = burnerOn ? 1 : 0;
    if (matBlue.current) matBlue.current.opacity = 0.7 * flicker * k;
    if (matYellow.current) matYellow.current.opacity = 0.85 * flicker * k;
    if (matCore.current) matCore.current.opacity = 1 * flicker * k;
    if (heatLight.current) heatLight.current.intensity = burnerOn ? 2.4 + Math.sin(t * 25) * 0.5 : 0;
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

      {/* Flame ----------------------------------------------------------- */}
      <group ref={flame} position={[0, 0.32, 0]} scale={[1, 0, 1]}>
        {/* cool outer envelope */}
        <mesh>
          <coneGeometry args={[0.16, 0.55, 20]} />
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
        {/* yellow body */}
        <mesh position={[0, -0.04, 0]}>
          <coneGeometry args={[0.1, 0.42, 18]} />
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
        {/* white-hot core */}
        <mesh position={[0, -0.08, 0]}>
          <coneGeometry args={[0.05, 0.26, 16]} />
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
        {/* heat light source */}
        <pointLight ref={heatLight} color="#ff9a40" intensity={0} distance={2.6} decay={2} />
      </group>
    </group>
  );
}
