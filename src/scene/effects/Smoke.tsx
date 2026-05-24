import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const COUNT = 60;

interface Puff {
  x: number; y: number; z: number;
  vx: number; vy: number; vz: number;
  size: number; life: number; maxLife: number;
}

/**
 * Volumetric-ish smoke column: large soft particles, color shifted by jar
 * liquid color, billowing upward from the source.
 */
export function Smoke({
  origin,
  intensity,
  color = "#3a3a3a",
}: {
  origin: [number, number, number];
  intensity: number;
  color?: string;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const puffs = useRef<Puff[]>(Array.from({ length: COUNT }, () => init(true)));
  const tmpColor = useMemo(() => new THREE.Color(), []);
  const baseColor = useMemo(() => new THREE.Color(color), [color]);

  useFrame((_, dt) => {
    if (!ref.current) return;
    const mesh = ref.current;
    baseColor.set(color);
    const spawnRate = intensity * 6;
    for (let i = 0; i < COUNT; i++) {
      const p = puffs.current[i];
      if (p.life <= 0) {
        if (Math.random() < spawnRate * dt) Object.assign(p, init(false));
        else {
          dummy.scale.setScalar(0);
          dummy.position.set(0, -50, 0);
          dummy.updateMatrix();
          mesh.setMatrixAt(i, dummy.matrix);
          continue;
        }
      }
      // Buoyant rise with horizontal drift & slow swirl.
      p.vx += (Math.random() - 0.5) * dt * 0.3;
      p.vz += (Math.random() - 0.5) * dt * 0.3;
      p.vy += dt * 0.4;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      p.life -= dt;

      const tlife = p.life / p.maxLife;
      const s = p.size * (1.6 - tlife * 0.6);
      dummy.position.set(origin[0] + p.x, origin[1] + p.y, origin[2] + p.z);
      dummy.scale.setScalar(s);
      dummy.rotation.set(0, p.x * 2, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      // Darken with age, brighten when fresh
      tmpColor.copy(baseColor).multiplyScalar(0.4 + tlife * 0.7);
      mesh.setColorAt?.(i, tmpColor);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.visible = intensity > 0.04;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, COUNT]} frustumCulled={false}>
      <sphereGeometry args={[1, 8, 6]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.35}
        depthWrite={false}
      />
    </instancedMesh>
  );
}

function init(stale: boolean): Puff {
  const a = Math.random() * Math.PI * 2;
  const r = Math.random() * 0.08;
  const maxLife = 1.6 + Math.random() * 1.6;
  return {
    x: Math.cos(a) * r,
    y: stale ? -50 : 0,
    z: Math.sin(a) * r,
    vx: (Math.random() - 0.5) * 0.2,
    vy: 0.45 + Math.random() * 0.4,
    vz: (Math.random() - 0.5) * 0.2,
    size: 0.11 + Math.random() * 0.1,
    life: stale ? 0 : maxLife,
    maxLife,
  };
}
