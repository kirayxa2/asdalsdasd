import * as THREE from "three";
import { Environment } from "@react-three/drei";
import { Table } from "./Table";

/**
 * The lab room: walls, image-based lighting (HDRI), key/fill/rim lights, fog.
 *
 * We use Drei's <Environment preset="warehouse" /> for free PBR reflections
 * + ambient illumination so glass and metal look alive without any texture
 * authoring.
 */
export function Lab() {
  return (
    <group>
      {/* IBL — gives us realistic reflections on glass / metal */}
      <Environment preset="warehouse" background={false} />

      {/* Lights ----------------------------------------------------------- */}
      {/* Soft general ambient so nothing is pitch-black */}
      <ambientLight intensity={0.55} color="#f4ecdf" />

      {/* Key light: warm overhead lamp angled slightly forward */}
      <directionalLight
        position={[2, 7, 3]}
        intensity={1.4}
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
      <directionalLight position={[-5, 4, 2]} intensity={0.55} color="#aac6e6" />
      {/* Rim light from behind */}
      <directionalLight position={[0, 4, -4]} intensity={0.4} color="#ffd0a0" />

      {/* Hanging desk lamp directly above the jar (warm spotlight) */}
      <DeskLamp position={[0, 2.4, 0]} />

      {/* Walls — much lighter than before so the scene reads */}
      <mesh position={[0, 2.5, -2.6]} receiveShadow>
        <planeGeometry args={[16, 5]} />
        <meshStandardMaterial color="#5c5448" roughness={0.95} />
      </mesh>
      <mesh position={[-5, 2.5, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[8, 5]} />
        <meshStandardMaterial color="#4d4638" roughness={0.95} />
      </mesh>
      <mesh position={[5, 2.5, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[8, 5]} />
        <meshStandardMaterial color="#4d4638" roughness={0.95} />
      </mesh>
      {/* Ceiling */}
      <mesh position={[0, 5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[16, 8]} />
        <meshStandardMaterial color="#1a1a1d" side={THREE.DoubleSide} />
      </mesh>

      {/* Faint fog for depth */}
      <fog attach="fog" args={["#1a1d22", 8, 22]} />

      <Table />
    </group>
  );
}

function DeskLamp({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* cord */}
      <mesh position={[0, 1.0, 0]}>
        <cylinderGeometry args={[0.005, 0.005, 2.2, 6]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      {/* shade */}
      <mesh position={[0, 0, 0]}>
        <coneGeometry args={[0.3, 0.32, 24, 1, true]} />
        <meshStandardMaterial color="#2a2520" side={THREE.DoubleSide} roughness={0.6} />
      </mesh>
      {/* bulb */}
      <mesh position={[0, -0.16, 0]}>
        <sphereGeometry args={[0.08, 16, 12]} />
        <meshBasicMaterial color="#fff0c0" toneMapped={false} />
      </mesh>
      {/* spot light */}
      <spotLight
        position={[0, -0.05, 0]}
        target-position={[0, -2, 0]}
        angle={0.7}
        penumbra={0.5}
        intensity={6}
        distance={4}
        color="#ffd99a"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      {/* small ambient point so close objects warm up */}
      <pointLight color="#ffe0b0" intensity={0.5} distance={1.6} position={[0, -0.3, 0]} />
    </group>
  );
}
