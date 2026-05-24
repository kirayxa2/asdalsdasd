import { useEffect } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGame } from "../store/gameStore";
import { JAR_POSITION } from "./Jar";

/**
 * Tracks the mouse and projects it onto a horizontal plane at table height
 * (~y = 1.4) so the held item floats in front of the camera. Triggers release
 * on pointerup.
 */
export function DragController() {
  const { camera, gl } = useThree();
  const heldItemId = useGame((s) => s.heldItemId);
  const setPointer = useGame((s) => s.setPointer);
  const release = useGame((s) => s.release);
  const pointer = useGame((s) => s.pointer);

  // Plane the cursor is projected onto. We tilt it slightly toward the camera
  // so vertical mouse moves change Y nicely.
  useFrame(() => {
    // no per-frame work currently
  });

  useEffect(() => {
    const dom = gl.domElement;
    const ndc = new THREE.Vector2();
    const ray = new THREE.Raycaster();
    const tablePlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -0.0); // z=0 plane (toward camera Z)
    // Better: use a plane at the depth of the jar, normal toward camera. We
    // compute it dynamically each move so the pointer follows the camera.
    const tmpPlane = new THREE.Plane();
    const tmpNormal = new THREE.Vector3();
    const hit = new THREE.Vector3();

    function onMove(ev: PointerEvent) {
      if (!useGame.getState().heldItemId) return;
      const rect = dom.getBoundingClientRect();
      ndc.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
      ray.setFromCamera(ndc, camera);

      // Plane facing camera, anchored at jar depth.
      tmpNormal.set(0, 0, 0).sub(camera.position).normalize();
      tmpPlane.setFromNormalAndCoplanarPoint(
        tmpNormal,
        new THREE.Vector3(0, JAR_POSITION[1] + 0.25, JAR_POSITION[2]),
      );
      if (ray.ray.intersectPlane(tmpPlane, hit)) {
        // Clamp to a reasonable area above the table.
        hit.x = THREE.MathUtils.clamp(hit.x, -2.5, 2.5);
        hit.y = THREE.MathUtils.clamp(hit.y, 1.0, 2.2);
        hit.z = THREE.MathUtils.clamp(hit.z, -0.6, 1.0);
        setPointer(hit.x, hit.y, hit.z);
      }
    }

    function onUp(_ev: PointerEvent) {
      const s = useGame.getState();
      if (!s.heldItemId) return;
      const dx = s.pointer.x - JAR_POSITION[0];
      const dz = s.pointer.z - JAR_POSITION[2];
      const overJar = Math.hypot(dx, dz) < 0.28 && s.pointer.y > JAR_POSITION[1] - 0.05;
      release(overJar);
    }

    dom.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      dom.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [camera, gl, setPointer, release]);

  // Suppress unused warning — pointer state is consumed by HeldItem.
  void pointer;
  void heldItemId;

  return null;
}
