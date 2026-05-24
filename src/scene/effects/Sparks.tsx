import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const COUNT = 60;

interface Spark {
  x: number; y: number; z: number;
  vx: number; vy: number; vz: number;
  life: number; maxLife: number; size: number;
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
    const rate = intensity * 16;
    for (let i = 0; i < COUNT; i++) {
      const s = sparks.current[i];
      if (s.life <= 0) {
        if (Math.random() < rate * dt) Object.assign(s, init(false));
        else {
          dummy.scale.setScalar(0);
          dummy.position.set(0, -50, 0);
          dummy.updateMatrix();
          mesh.setMatrixAt(i, dummy.matrix);
          continue;
        }
      }
      s.vy -= dt * 4; // strong gravity for sparks (ballistic)
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.z += s.vz * dt;
      s.life -= dt;
      const f = s.life / s.maxLife;
      dummy.position.set(origin[0] + s.x, origin[1] + s.y, origin[2] + s.z);
      // Stretch along velocity for trail look.
      const speed = Math.hypot(s.vx, s.vy, s.vz);
      dummy.scale.set(s.size * f, s.size * f * 3 * Math.min(1, speed / 4), s.size * f);
      const ang = Math.atan2(s.vy, Math.hypot(s.vx, s.vz));
      dummy.rotation.set(0, Math.atan2(s.vx, s.vz), ang - Math.PI / 2);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.visible = intensity > 0.04;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, COUNT]} frustumCulled={false}>
      <cylinderGeometry args={[0.5, 0.5, 1, 6]} />
      <meshBasicMaterial color="#ffd070" toneMapped={false} />
    </instancedMesh>
  );
}

function init(stale: boolean): Spark {
  const a = Math.random() * Math.PI * 2;
  const speed = 1.2 + Math.random() * 1.6;
  const maxLife = 0.5 + Math.random() * 0.5;
  return {
    x: 0, y: stale ? -50 : 0, z: 0,
    vx: Math.cos(a) * speed,
    vy: 1.4 + Math.random() * 1.6,
    vz: Math.sin(a) * speed,
    life: stale ? 0 : maxLife,
    maxLife,
    size: 0.014 + Math.random() * 0.012,
  };
}
