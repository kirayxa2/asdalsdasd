import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const COUNT = 30;

interface Puff {
  x: number;
  y: number;
  z: number;
  vy: number;
  vx: number;
  vz: number;
  size: number;
  life: number;
  maxLife: number;
}

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
  const puffs = useRef<Puff[]>(Array.from({ length: COUNT }, () => initPuff(true)));
  const colorObj = useMemo(() => new THREE.Color(color), [color]);

  useFrame((_, dt) => {
    if (!ref.current) return;
    const mesh = ref.current;
    const spawnRate = intensity * 4;
    for (let i = 0; i < COUNT; i++) {
      const p = puffs.current[i];
      if (p.life <= 0) {
        if (Math.random() < spawnRate * dt) Object.assign(p, initPuff(false));
        else {
          dummy.scale.setScalar(0);
          dummy.position.set(0, -10, 0);
          dummy.updateMatrix();
          mesh.setMatrixAt(i, dummy.matrix);
          continue;
        }
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      p.life -= dt;
      const t = p.life / p.maxLife;
      const s = p.size * (1.5 - t);
      dummy.position.set(origin[0] + p.x, origin[1] + p.y, origin[2] + p.z);
      dummy.scale.setScalar(s);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt?.(i, colorObj.clone().multiplyScalar(0.6 + t * 0.4));
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.visible = intensity > 0.05;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, COUNT]} frustumCulled={false}>
      <sphereGeometry args={[1, 8, 6]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.45}
        depthWrite={false}
      />
    </instancedMesh>
  );
}

function initPuff(stale: boolean): Puff {
  const a = Math.random() * Math.PI * 2;
  const r = Math.random() * 0.06;
  const maxLife = 1.2 + Math.random() * 1.2;
  return {
    x: Math.cos(a) * r,
    y: stale ? -5 : 0,
    z: Math.sin(a) * r,
    vx: (Math.random() - 0.5) * 0.15,
    vy: 0.35 + Math.random() * 0.35,
    vz: (Math.random() - 0.5) * 0.15,
    size: 0.08 + Math.random() * 0.08,
    life: stale ? 0 : maxLife,
    maxLife,
  };
}
