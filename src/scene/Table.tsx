import * as THREE from "three";
import { useMemo } from "react";

/**
 * Lab table top + legs + floor. Procedural wood-ish material.
 */
export function Table() {
  const woodMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#3a2c1e",
        roughness: 0.75,
        metalness: 0.05,
      }),
    [],
  );
  const darkWoodMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#231a11",
        roughness: 0.85,
        metalness: 0.05,
      }),
    [],
  );
  const floorMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#1c1a18",
        roughness: 0.95,
        metalness: 0,
      }),
    [],
  );
  return (
    <group>
      {/* table top */}
      <mesh receiveShadow castShadow position={[0, 0.88, 0]} material={woodMat}>
        <boxGeometry args={[3.2, 0.08, 1.6]} />
      </mesh>
      {/* edge highlight */}
      <mesh position={[0, 0.93, 0]}>
        <boxGeometry args={[3.21, 0.005, 1.61]} />
        <meshStandardMaterial color="#5a4528" roughness={0.6} />
      </mesh>
      {/* legs */}
      {[
        [-1.45, -0.7],
        [1.45, -0.7],
        [-1.45, 0.7],
        [1.45, 0.7],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.43, z]} castShadow material={darkWoodMat}>
          <boxGeometry args={[0.1, 0.86, 0.1]} />
        </mesh>
      ))}
      {/* floor */}
      <mesh receiveShadow position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} material={floorMat}>
        <planeGeometry args={[20, 20]} />
      </mesh>
    </group>
  );
}
