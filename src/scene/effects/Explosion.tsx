import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGame } from "../../store/gameStore";

/**
 * Big fireball + shockwave ring + multi-stage flash light. Driven by
 * store.explosion.t (0..2.4 seconds).
 */
export function Explosion({ position }: { position: [number, number, number] }) {
  const explosion = useGame((s) => s.explosion);

  const fireballRef = useRef<THREE.Mesh>(null);
  const fireballMat = useRef<THREE.MeshBasicMaterial>(null);
  const innerRef = useRef<THREE.Mesh>(null);
  const innerMat = useRef<THREE.MeshBasicMaterial>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const ringMat = useRef<THREE.MeshBasicMaterial>(null);
  const lightA = useRef<THREE.PointLight>(null);
  const lightB = useRef<THREE.PointLight>(null);

  useFrame(() => {
    const active = explosion.active;
    const t = explosion.t;

    // Outer fireball: rapid expand, slow fade.
    if (fireballRef.current && fireballMat.current) {
      const s = active ? Math.min(2.6, 0.2 + Math.pow(t * 1.8, 0.7) * 2.2) : 0;
      fireballRef.current.scale.setScalar(s);
      fireballMat.current.opacity = active ? Math.max(0, 1 - t / 0.9) : 0;
    }
    // Inner hot core: smaller, brighter, fades faster.
    if (innerRef.current && innerMat.current) {
      const s = active ? Math.min(1.2, 0.15 + t * 2.2) : 0;
      innerRef.current.scale.setScalar(s);
      innerMat.current.opacity = active ? Math.max(0, 1 - t / 0.45) : 0;
    }
    // Shockwave ring on the table plane.
    if (ringRef.current && ringMat.current) {
      const s = active ? 0.2 + t * 4.5 : 0;
      ringRef.current.scale.setScalar(s);
      ringMat.current.opacity = active ? Math.max(0, 1 - t / 1.1) : 0;
    }
    // Two-stage light: huge initial flash, lingering glow.
    if (lightA.current) {
      lightA.current.intensity = active ? Math.max(0, 80 * (1 - t / 0.25)) : 0;
    }
    if (lightB.current) {
      lightB.current.intensity = active ? Math.max(0, 18 * (1 - t / 1.4)) : 0;
    }
  });

  return (
    <group position={position}>
      {/* Fireball */}
      <mesh ref={fireballRef} scale={0}>
        <sphereGeometry args={[1, 32, 24]} />
        <meshBasicMaterial
          ref={fireballMat}
          color="#ff8030"
          transparent
          opacity={0}
          toneMapped={false}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      {/* Inner core */}
      <mesh ref={innerRef} scale={0}>
        <sphereGeometry args={[1, 24, 18]} />
        <meshBasicMaterial
          ref={innerMat}
          color="#ffffd0"
          transparent
          opacity={0}
          toneMapped={false}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      {/* Shockwave ring on the table */}
      <mesh ref={ringRef} scale={0} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
        <ringGeometry args={[0.5, 0.55, 64]} />
        <meshBasicMaterial
          ref={ringMat}
          color="#ffe0a0"
          transparent
          opacity={0}
          toneMapped={false}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Lights */}
      <pointLight ref={lightA} color="#fff0c0" intensity={0} distance={10} decay={2} />
      <pointLight ref={lightB} color="#ff7030" intensity={0} distance={6} decay={2} />
    </group>
  );
}
