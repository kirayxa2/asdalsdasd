import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useGame, JAR_CENTER, JAR_R, JAR_TOP_Y } from "../store/gameStore";
import { ITEMS_BY_ID } from "../data/items";

const TABLE_HALF_X = 1.6;
const TABLE_HALF_Z = 0.8;
const TABLE_Y = 0.92;

// Visual hold height — adjustable with the mouse wheel.
const HOLD_Y_DEFAULT = 1.55;
const HOLD_Y_MIN = 1.05;
const HOLD_Y_MAX = 2.4;

const JAR_DROP_RADIUS = JAR_R + 0.05; // forgiving — anywhere over the opening counts

/**
 * Pointer driver:
 *   - Held item floats on a HORIZONTAL plane at y=holdY (you have full XZ
 *     freedom). Wheel moves the plane up/down.
 *   - On every move we also raycast to (a) jar-top plane and (b) table-top
 *     plane to know precisely what the cursor is over.
 *   - While holding a liquid bottle over the jar, the store starts a pour;
 *     the moment the cursor leaves the jar (or the player releases) it stops.
 *   - On pointerup we pick the release target from those raycasts.
 */
export function DragController() {
  const { camera, gl } = useThree();
  const setPointer = useGame((s) => s.setPointer);
  const release = useGame((s) => s.release);
  const startPour = useGame((s) => s.startPour);
  const stopPour = useGame((s) => s.stopPour);
  const setPourTilt = useGame((s) => s.setPourTilt);
  const holdYRef = useRef(HOLD_Y_DEFAULT);
  const lastJarTop = useRef<THREE.Vector3 | null>(null);
  const lastTableTop = useRef<THREE.Vector3 | null>(null);

  useEffect(() => {
    const dom = gl.domElement;
    const ndc = new THREE.Vector2();
    const ray = new THREE.Raycaster();
    const holdPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const jarTopPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -JAR_TOP_Y);
    const tableTopPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -TABLE_Y);
    const camFacing = new THREE.Plane();
    const camNormal = new THREE.Vector3();
    const hit = new THREE.Vector3();

    function projectHold(): boolean {
      // Build hold plane at current holdY.
      holdPlane.set(new THREE.Vector3(0, 1, 0), -holdYRef.current);
      if (ray.ray.intersectPlane(holdPlane, hit)) {
        // Ray went under the plane normally — good.
        hit.x = THREE.MathUtils.clamp(hit.x, -2.2, 2.2);
        hit.z = THREE.MathUtils.clamp(hit.z, -1.0, 1.4);
        setPointer(hit.x, holdYRef.current, hit.z);
        return true;
      }
      // Fallback (cursor near top edge of screen pointing upward) —
      // use a camera-facing plane so the held item still follows.
      camNormal.set(0, 0, 0).sub(camera.position).normalize();
      camFacing.setFromNormalAndCoplanarPoint(
        camNormal,
        new THREE.Vector3(0, JAR_CENTER[1] + 0.3, JAR_CENTER[2]),
      );
      if (ray.ray.intersectPlane(camFacing, hit)) {
        hit.y = THREE.MathUtils.clamp(hit.y, HOLD_Y_MIN, HOLD_Y_MAX);
        setPointer(hit.x, hit.y, hit.z);
        return true;
      }
      return false;
    }

    function onMove(ev: PointerEvent) {
      const s = useGame.getState();
      if (!s.heldItemId) return;
      const rect = dom.getBoundingClientRect();
      ndc.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
      ray.setFromCamera(ndc, camera);

      projectHold();

      // Raycast jar/table planes for drop-target detection.
      const jr = new THREE.Vector3();
      if (ray.ray.intersectPlane(jarTopPlane, jr)) lastJarTop.current = jr.clone();
      else lastJarTop.current = null;
      const tr = new THREE.Vector3();
      if (ray.ray.intersectPlane(tableTopPlane, tr)) lastTableTop.current = tr.clone();
      else lastTableTop.current = null;

      // Manage pour & tilt for the held liquid bottle.
      const def = ITEMS_BY_ID[s.heldItemId];
      const overJar = !!lastJarTop.current && (() => {
        const dx = lastJarTop.current!.x - JAR_CENTER[0];
        const dz = lastJarTop.current!.z - JAR_CENTER[2];
        return Math.hypot(dx, dz) < JAR_DROP_RADIUS;
      })();
      useGame.getState().setOverJarHover(overJar);

      if (def && def.kind === "liquid") {
        if (overJar) {
          setPourTilt(1);
          startPour();
        } else {
          setPourTilt(0);
          stopPour();
        }
      } else {
        setPourTilt(0);
        if (s.pouringEntryId) stopPour();
      }
    }

    function onUp(_ev: PointerEvent) {
      const s = useGame.getState();
      if (!s.heldItemId) return;
      let target: "jar" | "table" | "void" = "void";
      if (lastJarTop.current) {
        const dx = lastJarTop.current.x - JAR_CENTER[0];
        const dz = lastJarTop.current.z - JAR_CENTER[2];
        if (Math.hypot(dx, dz) < JAR_DROP_RADIUS) target = "jar";
      }
      if (target === "void" && lastTableTop.current) {
        const t = lastTableTop.current;
        if (Math.abs(t.x) < TABLE_HALF_X && Math.abs(t.z) < TABLE_HALF_Z) target = "table";
      }
      useGame.getState().setOverJarHover(false);
      release(target);
    }

    function onWheel(ev: WheelEvent) {
      if (!useGame.getState().heldItemId) return;
      ev.preventDefault();
      holdYRef.current = THREE.MathUtils.clamp(
        holdYRef.current - ev.deltaY * 0.0015,
        HOLD_Y_MIN,
        HOLD_Y_MAX,
      );
      // Re-emit pointer at new height
      const s = useGame.getState();
      setPointer(s.pointer.x, holdYRef.current, s.pointer.z);
    }

    dom.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    dom.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      dom.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      dom.removeEventListener("wheel", onWheel);
    };
  }, [camera, gl, setPointer, release, startPour, stopPour, setPourTilt]);

  return null;
}
