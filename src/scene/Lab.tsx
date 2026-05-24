import * as THREE from "three";
import { Environment } from "@react-three/drei";
import { Table } from "./Table";

/**
 * The lab room: walls, image-based lighting (HDRI), key/fill/rim lights.
 * Lights placed off to the side so nothing is hanging over the jar.
 */
export function Lab() {
  return (
    <group>
      {/* IBL — gives glass and metal believable reflections */}
      <Environment preset="apartment" background={false} />

      {/* Ambient: bright enough that nothing is muddy */}
      <ambientLight intensity={0.8} color="#ffffff" />

      {/* Key light: warm, from upper-front-right */}
      <directionalLight
        position={[3, 6, 4]}
        intensity={1.6}
        color="#fff5e0"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0005}
        shadow-camera-near={0.5}
        shadow-camera-far={20}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={5}
        shadow-camera-bottom={-5}
      />
      {/* Cool fill from camera-left */}
      <directionalLight position={[-5, 4, 2]} intensity={0.7} color="#cfdcef" />
      {/* Rim from behind for depth */}
      <directionalLight position={[0, 4, -4]} intensity={0.5} color="#ffd0a0" />

      {/* Walls — light grey-warm, much brighter than before */}
      <mesh position={[0, 2.5, -2.6]} receiveShadow>
        <planeGeometry args={[16, 5]} />
        <meshStandardMaterial color="#7d756a" roughness={0.95} />
      </mesh>
      <mesh position={[-5, 2.5, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[8, 5]} />
        <meshStandardMaterial color="#6d6659" roughness={0.95} />
      </mesh>
      <mesh position={[5, 2.5, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[8, 5]} />
        <meshStandardMaterial color="#6d6659" roughness={0.95} />
      </mesh>
      {/* Ceiling */}
      <mesh position={[0, 5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[16, 8]} />
        <meshStandardMaterial color="#3a3835" side={THREE.DoubleSide} />
      </mesh>

      {/* Two ceiling-corner work lamps so light doesn't dangle over the table */}
      <CornerLamp position={[-2.5, 4.4, -1.8]} />
      <CornerLamp position={[2.5, 4.4, -1.8]} />

      {/* Very faint fog for depth, far away */}
      <fog attach="fog" args={["#3a3835", 12, 28]} />

      <Table />
    </group>
  );
}

function CornerLamp({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* shade body (cone) */}
      <mesh>
        <cylinderGeometry args={[0.18, 0.28, 0.22, 20, 1, true]} />
        <meshStandardMaterial color="#2a2520" side={THREE.DoubleSide} roughness={0.6} />
      </mesh>
      {/* visible bulb */}
      <mesh position={[0, -0.07, 0]}>
        <sphereGeometry args={[0.08, 16, 12]} />
        <meshBasicMaterial color="#fff0c0" toneMapped={false} />
      </mesh>
      <spotLight
        position={[0, -0.05, 0]}
        target-position={[position[0] * -0.6, 0.9, 0]}
        angle={0.7}
        penumbra={0.7}
        intensity={4}
        distance={6}
        color="#ffd99a"
        castShadow={false}
      />
      <pointLight color="#ffe0b0" intensity={0.4} distance={2.0} position={[0, -0.15, 0]} />
    </group>
  );
}
