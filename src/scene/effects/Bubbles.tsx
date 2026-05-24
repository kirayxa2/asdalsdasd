import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const COUNT = 70;

interface Particle {
  x: number; y: number; z: number;
  vy: number; size: number; life: number; maxLife: number;
}

export function Bubbles({
  center,
  radius,
  liquidTop,
  liquidBottom,
  intensity,
}: {
  center: [number, number, number];
  radius: number;
  liquidTop: number;
  liquidBottom: number;
  intensity: number;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const particles = useRef<Particle[]>(
    Array.from({ length: COUNT }, () => initParticle(radius, liquidBottom, liquidTop, true)),
  );

  useFrame((_, dt) => {
    if (!meshRef.current) return;
    const mesh = meshRef.current;
    const spawnRate = intensity * 7;
    for (let i = 0; i < COUNT; i++) {
      const p = particles.current[i];
      if (p.life <= 0) {
        if (Math.random() < spawnRate * dt) {
          Object.assign(p, initParticle(radius, liquidBottom, liquidTop, false));
        } else {
          dummy.scale.setScalar(0);
          dummy.position.set(0, -50, 0);
          dummy.updateMatrix();
          mesh.setMatrixAt(i, dummy.matrix);
          continue;
        }
      }
      // Bubbles speed up as they rise.
      p.y += p.vy * dt * (0.6 + intensity * 0.8);
      p.life -= dt * 0.5;
      // Pop at the surface
      if (p.y > liquidTop - 0.005) {
        p.life = Math.min(p.life, 0.05);
        p.vy *= 0.2;
      }
      const t = p.life / p.maxLife;
      dummy.position.set(center[0] + p.x, center[1] + p.y, center[2] + p.z);
      dummy.scale.setScalar(p.size * Math.max(0, t));
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.visible = intensity > 0.02;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]} frustumCulled={false}>
      <sphereGeometry args={[1, 10, 8]} />
      <meshPhysicalMaterial
        color="#ffffff"
        roughness={0.05}
        transmission={0.95}
        thickness={0.04}
        ior={1.33}
        transparent
        opacity={0.85}
      />
    </instancedMesh>
  );
}

function initParticle(
  radius: number,
  bottom: number,
  top: number,
  stale: boolean,
): Particle {
  const a = Math.random() * Math.PI * 2;
  const r = Math.random() * radius * 0.85;
  const maxLife = 1.0 + Math.random() * 0.8;
  return {
    x: Math.cos(a) * r,
    y: stale ? -50 : bottom + Math.random() * (top - bottom) * 0.25,
    z: Math.sin(a) * r,
    vy: 0.18 + Math.random() * 0.28,
    size: 0.012 + Math.random() * 0.022,
    life: stale ? 0 : maxLife,
    maxLife,
  };
}
