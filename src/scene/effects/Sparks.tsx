import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const COUNT = 30;

interface Spark {
  x: number; y: number; z: number;
  vx: number; vy: number; vz: number;
  life: number; size: number;
}

export function Sparks({
  origin,
  intensity,
}: {
  origin: [number, number, number];
  intensity: number;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const sparks = useRef<Spark[]>(Array.from({ length: COUNT }, () => init(true)));

  useFrame((_, dt) => {
    if (!ref.current) return;
    const mesh = ref.current;
    const rate = intensity * 8;
    for (let i = 0; i < COUNT; i++) {
      const s = sparks.current[i];
      if (s.life <= 0) {
        if (Math.random() < rate * dt) Object.assign(s, init(false));
        else {
          dummy.scale.setScalar(0);
          dummy.position.set(0, -10, 0);
          dummy.updateMatrix();
          mesh.setMatrixAt(i, dummy.matrix);
          continue;
        }
      }
      s.vy -= dt * 1.6; // gravity
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.z += s.vz * dt;
      s.life -= dt;
      dummy.position.set(origin[0] + s.x, origin[1] + s.y, origin[2] + s.z);
      dummy.scale.setScalar(s.size * Math.max(0, s.life));
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.visible = intensity > 0.05;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, COUNT]} frustumCulled={false}>
      <sphereGeometry args={[1, 6, 4]} />
      <meshBasicMaterial color="#ffb44a" toneMapped={false} />
    </instancedMesh>
  );
}

function init(stale: boolean): Spark {
  const a = Math.random() * Math.PI * 2;
  const speed = 0.6 + Math.random() * 0.8;
  return {
    x: 0, y: stale ? -5 : 0, z: 0,
    vx: Math.cos(a) * speed,
    vy: 0.6 + Math.random() * 0.8,
    vz: Math.sin(a) * speed,
    life: stale ? 0 : 0.5 + Math.random() * 0.5,
    size: 0.02 + Math.random() * 0.02,
  };
}
