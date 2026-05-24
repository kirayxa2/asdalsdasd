import * as THREE from "three";
import { Table } from "./Table";

/**
 * The lab room: walls, ambient lighting, key/fill lights. Self-contained.
 */
export function Lab() {
  return (
    <group>
      {/* Lighting: warm key light + cool fill */}
      <ambientLight intensity={0.25} />
      <directionalLight
        position={[3, 6, 4]}
        intensity={1.2}
        color="#fff2dc"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={20}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={5}
        shadow-camera-bottom={-5}
      />
      <directionalLight position={[-4, 3, -2]} intensity={0.4} color="#9bb6d8" />
      {/* Subtle fill from below */}
      <pointLight position={[0, 1.4, 1.5]} intensity={0.4} color="#fff" distance={3.5} />

      {/* Walls — a back wall + side walls so the camera doesn't see the void */}
      <mesh position={[0, 2.5, -2.5]} receiveShadow>
        <planeGeometry args={[16, 5]} />
        <meshStandardMaterial color="#1a1d22" roughness={0.95} />
      </mesh>
      <mesh position={[-5, 2.5, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[8, 5]} />
        <meshStandardMaterial color="#15171b" roughness={0.95} />
      </mesh>
      <mesh position={[5, 2.5, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[8, 5]} />
        <meshStandardMaterial color="#15171b" roughness={0.95} />
      </mesh>
      {/* Ceiling */}
      <mesh position={[0, 5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[16, 8]} />
        <meshStandardMaterial color="#0c0c10" side={THREE.DoubleSide} />
      </mesh>

      {/* Faint fog of a room */}
      <fog attach="fog" args={["#0a0c10", 6, 16]} />

      <Table />
    </group>
  );
}
