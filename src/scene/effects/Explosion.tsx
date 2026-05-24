import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGame } from "../../store/gameStore";

/**
 * Expanding fireball + light flash + lingering smoke. Driven by store.explosion.
 */
export function Explosion({ position }: { position: [number, number, number] }) {
  const explosion = useGame((s) => s.explosion);
  const sphereRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshBasicMaterial>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame(() => {
    const t = explosion.t;
    const active = explosion.active;
    if (sphereRef.current) {
      const s = active ? Math.min(2.4, 0.3 + t * 4.5) : 0;
      sphereRef.current.scale.setScalar(s);
    }
    if (matRef.current) {
      matRef.current.opacity = active ? Math.max(0, 1 - t / 1.4) : 0;
    }
    if (lightRef.current) {
      lightRef.current.intensity = active ? Math.max(0, 30 * (1 - t / 0.6)) : 0;
    }
  });

  return (
    <group position={position}>
      <mesh ref={sphereRef} scale={0}>
        <sphereGeometry args={[1, 24, 16]} />
        <meshBasicMaterial
          ref={matRef}
          color="#ffb04a"
          transparent
          opacity={0}
          toneMapped={false}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <pointLight ref={lightRef} color="#ff8030" intensity={0} distance={6} decay={2} />
    </group>
  );
}
