import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useGame } from "../store/gameStore";
import { JAR_POSITION } from "./Jar";

const TABLE_HALF_X = 1.6;
const TABLE_HALF_Z = 0.8;
const TABLE_Y = 0.92;
const JAR_DROP_RADIUS = 0.22;

/**
 * Tracks the mouse and projects it twice per frame:
 *   1. onto a plane facing the camera at jar height (where the held item floats)
 *   2. onto the table-top plane (to decide jar/table/void on release)
 *
 * On pointerup we use the table-top hit to pick the release target.
 */
export function DragController() {
  const { camera, gl } = useThree();
  const setPointer = useGame((s) => s.setPointer);
  const release = useGame((s) => s.release);

  useEffect(() => {
    const dom = gl.domElement;
    const ndc = new THREE.Vector2();
    const ray = new THREE.Raycaster();
    const camPlane = new THREE.Plane();
    const camNormal = new THREE.Vector3();
    const tableTopPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -TABLE_Y);
    const camHit = new THREE.Vector3();
    const tableHit = new THREE.Vector3();

    let lastTableHit: THREE.Vector3 | null = null;

    function onMove(ev: PointerEvent) {
      if (!useGame.getState().heldItemId) return;
      const rect = dom.getBoundingClientRect();
      ndc.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
      ray.setFromCamera(ndc, camera);

      // Hit the camera-facing plane at jar height for the visual position.
      camNormal.set(0, 0, 0).sub(camera.position).normalize();
      camPlane.setFromNormalAndCoplanarPoint(
        camNormal,
        new THREE.Vector3(0, JAR_POSITION[1] + 0.3, JAR_POSITION[2]),
      );
      if (ray.ray.intersectPlane(camPlane, camHit)) {
        camHit.x = THREE.MathUtils.clamp(camHit.x, -2.5, 2.5);
        camHit.y = THREE.MathUtils.clamp(camHit.y, 1.05, 2.2);
        camHit.z = THREE.MathUtils.clamp(camHit.z, -1.0, 1.0);
        setPointer(camHit.x, camHit.y, camHit.z);
      }
      // Hit the table top for release-target detection.
      if (ray.ray.intersectPlane(tableTopPlane, tableHit)) {
        lastTableHit = tableHit.clone();
      } else {
        lastTableHit = null;
      }
    }

    function onUp(_ev: PointerEvent) {
      const s = useGame.getState();
      if (!s.heldItemId) return;
      let target: "jar" | "table" | "void" = "void";
      if (lastTableHit) {
        const dx = lastTableHit.x - JAR_POSITION[0];
        const dz = lastTableHit.z - JAR_POSITION[2];
        const overJar = Math.hypot(dx, dz) < JAR_DROP_RADIUS;
        const onTable =
          Math.abs(lastTableHit.x) < TABLE_HALF_X &&
          Math.abs(lastTableHit.z) < TABLE_HALF_Z;
        if (overJar) target = "jar";
        else if (onTable) target = "table";
      }
      release(target);
    }

    dom.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      dom.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [camera, gl, setPointer, release]);

  return null;
}
