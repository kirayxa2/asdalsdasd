import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { useGame } from "../store/gameStore";

const STATIC_POS: [number, number, number] = [0, 1.7, 2.2];
const STATIC_TARGET: [number, number, number] = [0, 1.25, 0];

/**
 * Camera rig with two modes (toggle with F):
 *   - "static": locked over-the-table view (default)
 *   - "orbit":  free orbit around the jar
 *
 * In static mode we add explosion-driven shake by perturbing the camera
 * position/target every frame.
 */
export function CameraRig() {
  const cameraMode = useGame((s) => s.cameraMode);
  const setCameraMode = useGame((s) => s.setCameraMode);
  const shake = useGame((s) => s.cameraShake);
  const { camera } = useThree();
  const target = useRef(new THREE.Vector3(...STATIC_TARGET));
  const baseTarget = useRef(new THREE.Vector3(...STATIC_TARGET));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "f" || e.key === "F") {
        setCameraMode(cameraMode === "static" ? "orbit" : "static");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cameraMode, setCameraMode]);

  useFrame((_, dt) => {
    if (cameraMode !== "static") return;
    const targetPos = new THREE.Vector3(...STATIC_POS);
    const tt = baseTarget.current.copy(new THREE.Vector3(...STATIC_TARGET));
    if (shake > 0) {
      const k = shake * 0.12;
      targetPos.x += (Math.random() - 0.5) * k;
      targetPos.y += (Math.random() - 0.5) * k * 0.6;
      tt.x += (Math.random() - 0.5) * k * 0.6;
      tt.y += (Math.random() - 0.5) * k * 0.6;
    }
    camera.position.lerp(targetPos, Math.min(1, dt * 6));
    target.current.lerp(tt, Math.min(1, dt * 8));
    camera.lookAt(target.current);
  });

  return cameraMode === "orbit" ? (
    <OrbitControls
      enablePan={false}
      target={STATIC_TARGET}
      minDistance={1.2}
      maxDistance={4}
      minPolarAngle={0.2}
      maxPolarAngle={Math.PI / 2 - 0.05}
    />
  ) : null;
}
