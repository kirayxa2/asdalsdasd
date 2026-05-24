import { useMemo } from "react";
import * as THREE from "three";
import type { ItemDef } from "../types";

interface Props {
  def: ItemDef;
  highlighted?: boolean;
  // Optional integrity for solids in the jar (1 = fresh, 0 = dissolved).
  integrity?: number;
  // Tilt around Z for pouring (radians).
  tilt?: number;
}

/**
 * Stylized primitive renderer for each item. We avoid GLB assets so the build
 * stays small and the project is fully self-contained.
 */
export function ItemMesh({ def, highlighted = false, integrity = 1, tilt = 0 }: Props) {
  const scale = (def.scale ?? 1) * (0.5 + 0.5 * integrity);
  const emissive = highlighted
    ? new THREE.Color("#ffffff")
    : def.emissive
    ? new THREE.Color(def.emissive)
    : new THREE.Color("#000000");
  const emissiveIntensity = highlighted ? 0.6 : def.emissiveIntensity ?? 0;

  const matProps = useMemo(
    () => ({
      color: def.color,
      roughness: 0.55,
      metalness: 0.05,
      emissive,
      emissiveIntensity,
    }),
    [def.color, emissive, emissiveIntensity],
  );

  return (
    <group scale={scale} rotation={[0, 0, tilt]}>
      {def.shape === "banana" && <BananaMesh matProps={matProps} accent={def.accent} />}
      {def.shape === "apple" && <AppleMesh matProps={matProps} accent={def.accent} />}
      {def.shape === "orange" && <OrangeMesh matProps={matProps} accent={def.accent} />}
      {def.shape === "bottle" && (
        <BottleMesh matProps={matProps} liquidColor={def.liquidColor} />
      )}
      {def.shape === "cube" && <CubeMesh matProps={matProps} />}
      {def.shape === "flask" && <FlaskMesh matProps={matProps} />}
      {def.shape === "test-tube" && <TestTubeMesh matProps={matProps} />}
      {def.shape === "spoon" && <SpoonMesh matProps={matProps} />}
    </group>
  );
}

type MatProps = {
  color: string;
  roughness: number;
  metalness: number;
  emissive: THREE.Color;
  emissiveIntensity: number;
};

function BananaMesh({ matProps, accent }: { matProps: MatProps; accent?: string }) {
  // Curved banana = a piece of a torus.
  return (
    <group rotation={[0, 0, 0.5]}>
      <mesh castShadow rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <torusGeometry args={[0.18, 0.05, 12, 24, Math.PI * 0.7]} />
        <meshStandardMaterial {...matProps} />
      </mesh>
      {/* stem */}
      <mesh position={[0.17, 0.06, 0]} castShadow>
        <cylinderGeometry args={[0.012, 0.012, 0.06, 8]} />
        <meshStandardMaterial color={accent ?? "#6b4a1a"} roughness={1} />
      </mesh>
    </group>
  );
}

function AppleMesh({ matProps, accent }: { matProps: MatProps; accent?: string }) {
  return (
    <group>
      <mesh castShadow scale={[1, 0.95, 1]}>
        <sphereGeometry args={[0.13, 24, 18]} />
        <meshStandardMaterial {...matProps} />
      </mesh>
      <mesh position={[0, 0.13, 0]} castShadow>
        <cylinderGeometry args={[0.012, 0.012, 0.05, 8]} />
        <meshStandardMaterial color="#3a2510" roughness={1} />
      </mesh>
      <mesh position={[0.04, 0.16, 0]} rotation={[0, 0, 1]} castShadow>
        <coneGeometry args={[0.025, 0.08, 8]} />
        <meshStandardMaterial color={accent ?? "#3b6b1f"} roughness={0.9} />
      </mesh>
    </group>
  );
}

function OrangeMesh({ matProps, accent }: { matProps: MatProps; accent?: string }) {
  return (
    <group>
      <mesh castShadow>
        <sphereGeometry args={[0.13, 24, 18]} />
        <meshStandardMaterial {...matProps} roughness={0.85} />
      </mesh>
      <mesh position={[0.02, 0.13, 0]} rotation={[0, 0, 0.4]} castShadow>
        <coneGeometry args={[0.03, 0.06, 8]} />
        <meshStandardMaterial color={accent ?? "#356b22"} />
      </mesh>
    </group>
  );
}

function BottleMesh({
  matProps,
  liquidColor,
}: {
  matProps: MatProps;
  liquidColor?: string;
}) {
  const color = liquidColor ?? "#88c";
  return (
    <group>
      {/* glass body — slightly transparent */}
      <mesh castShadow position={[0, 0, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 0.32, 20]} />
        <meshPhysicalMaterial
          color={matProps.color}
          roughness={0.15}
          metalness={0}
          transmission={0.55}
          thickness={0.4}
          transparent
          opacity={0.88}
        />
      </mesh>
      {/* liquid inside */}
      <mesh position={[0, -0.04, 0]}>
        <cylinderGeometry args={[0.062, 0.062, 0.22, 20]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.15} />
      </mesh>
      {/* neck */}
      <mesh position={[0, 0.2, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.05, 0.08, 16]} />
        <meshStandardMaterial color={matProps.color} roughness={0.3} />
      </mesh>
      {/* cap */}
      <mesh position={[0, 0.26, 0]} castShadow>
        <cylinderGeometry args={[0.035, 0.035, 0.04, 16]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.6} />
      </mesh>
      {/* label band */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.071, 0.071, 0.1, 20]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
    </group>
  );
}

function CubeMesh({ matProps }: { matProps: MatProps }) {
  return (
    <mesh castShadow>
      <boxGeometry args={[0.18, 0.18, 0.18]} />
      <meshStandardMaterial {...matProps} roughness={0.4} metalness={0.6} />
    </mesh>
  );
}

function FlaskMesh({ matProps }: { matProps: MatProps }) {
  // Erlenmeyer-style flask
  return (
    <group>
      <mesh castShadow position={[0, 0, 0]}>
        <coneGeometry args={[0.13, 0.26, 24, 1, true]} />
        <meshPhysicalMaterial
          color={matProps.color}
          roughness={0.1}
          transmission={0.7}
          thickness={0.3}
          transparent
          opacity={0.85}
        />
      </mesh>
      {/* base disk */}
      <mesh position={[0, -0.13, 0]}>
        <cylinderGeometry args={[0.13, 0.13, 0.005, 24]} />
        <meshPhysicalMaterial
          color={matProps.color}
          roughness={0.1}
          transmission={0.7}
          thickness={0.3}
          transparent
          opacity={0.85}
        />
      </mesh>
      {/* neck */}
      <mesh position={[0, 0.16, 0]} castShadow>
        <cylinderGeometry args={[0.025, 0.025, 0.06, 16]} />
        <meshPhysicalMaterial color={matProps.color} transparent opacity={0.85} />
      </mesh>
    </group>
  );
}

function TestTubeMesh({ matProps }: { matProps: MatProps }) {
  return (
    <group>
      <mesh castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.28, 16, 1, true]} />
        <meshPhysicalMaterial
          color={matProps.color}
          roughness={0.1}
          transmission={0.7}
          thickness={0.2}
          transparent
          opacity={0.85}
        />
      </mesh>
      {/* rounded bottom */}
      <mesh position={[0, -0.14, 0]}>
        <sphereGeometry args={[0.04, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshPhysicalMaterial
          color={matProps.color}
          roughness={0.1}
          transmission={0.7}
          thickness={0.2}
          transparent
          opacity={0.85}
        />
      </mesh>
    </group>
  );
}

function SpoonMesh({ matProps }: { matProps: MatProps }) {
  return (
    <group rotation={[0, 0, Math.PI / 2]}>
      {/* handle */}
      <mesh position={[0.06, 0, 0]} castShadow>
        <cylinderGeometry args={[0.012, 0.012, 0.18, 12]} />
        <meshStandardMaterial {...matProps} metalness={0.85} roughness={0.25} />
      </mesh>
      {/* scoop */}
      <mesh position={[-0.06, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow scale={[1, 0.4, 0.6]}>
        <sphereGeometry args={[0.05, 16, 12]} />
        <meshStandardMaterial {...matProps} metalness={0.85} roughness={0.25} />
      </mesh>
    </group>
  );
}
