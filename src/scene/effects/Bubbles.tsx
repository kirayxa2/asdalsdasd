import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const COUNT = 40;

interface Particle {
  x: number;
  y: number;
  z: number;
  vy: number;
  size: number;
  life: number;
}

/**
 * Bubble particles inside the jar liquid. Driven by the bubbles intensity
 * value (0..1). Uses InstancedMesh for performance.
 */
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
    Array.from({ length: COUNT }, () => initParticle(radius, liquidBottom, liquidTop)),
  );

  useFrame((_, dt) => {
    if (!meshRef.current) return;
    const mesh = meshRef.current;
    const spawnRate = intensity * 4;
    for (let i = 0; i < COUNT; i++) {
      const p = particles.current[i];
      // Bring inactive particles back to life proportionally to intensity.
      if (p.life <= 0) {
        if (Math.random() < spawnRate * dt) {
          Object.assign(p, initParticle(radius, liquidBottom, liquidTop));
        } else {
          dummy.scale.setScalar(0);
          dummy.position.set(0, -10, 0);
          dummy.updateMatrix();
          mesh.setMatrixAt(i, dummy.matrix);
          continue;
        }
      }
      p.y += p.vy * dt * (0.5 + intensity);
      p.life -= dt * 0.6;
      if (p.y > liquidTop - 0.01) p.life = 0;

      dummy.position.set(center[0] + p.x, center[1] + p.y, center[2] + p.z);
      dummy.scale.setScalar(p.size * Math.max(0, p.life));
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.visible = intensity > 0.02;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]}>
      <sphereGeometry args={[1, 8, 6]} />
      <meshPhysicalMaterial
        color="#ffffff"
        roughness={0.05}
        transmission={0.9}
        thickness={0.05}
        transparent
        opacity={0.85}
      />
    </instancedMesh>
  );
}

function initParticle(radius: number, bottom: number, top: number): Particle {
  const a = Math.random() * Math.PI * 2;
  const r = Math.random() * radius * 0.7;
  return {
    x: Math.cos(a) * r,
    y: bottom + Math.random() * (top - bottom) * 0.3,
    z: Math.sin(a) * r,
    vy: 0.15 + Math.random() * 0.25,
    size: 0.012 + Math.random() * 0.02,
    life: 0.9 + Math.random() * 0.6,
  };
}
