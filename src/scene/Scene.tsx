import { useFrame } from "@react-three/fiber";
import { Lab } from "./Lab";
import { Shelf } from "./Shelf";
import { Burner } from "./Burner";
import { Jar, JAR_POSITION } from "./Jar";
import { HeldItem } from "./HeldItem";
import { DragController } from "./DragController";
import { CameraRig } from "./CameraRig";
import { TableItems } from "./TableItems";
import { Smoke } from "./effects/Smoke";
import { Sparks } from "./effects/Sparks";
import { Explosion } from "./effects/Explosion";
import { Shards } from "./effects/Shards";
import { useGame } from "../store/gameStore";

/**
 * Top-level R3F scene. Drives the simulation tick and renders everything.
 */
export function Scene() {
  const tick = useGame((s) => s.tick);
  const jarSmoke = useGame((s) => s.jar.smoke);
  const jarSparks = useGame((s) => s.jar.sparks);
  const jarLiquidColor = useGame((s) => s.jar.liquidColor);
  const explosionActive = useGame((s) => s.explosion.active);

  useFrame((_, dt) => {
    tick(Math.min(0.05, dt));
  });

  return (
    <>
      <CameraRig />
      <Lab />

      {/* Burner stands on the table; its top supports the jar */}
      <Burner position={[0, 0.92, 0]} />
      <Jar />

      {/* Effects rooted at the jar */}
      <group position={[JAR_POSITION[0], JAR_POSITION[1] + 0.22, JAR_POSITION[2]]}>
        <Smoke origin={[0, 0, 0]} intensity={Math.max(jarSmoke, explosionActive ? 1 : 0)} color={jarLiquidColor} />
      </group>
      <group position={JAR_POSITION}>
        <Sparks origin={[0, 0.05, 0]} intensity={jarSparks} />
      </group>
      <Explosion position={[JAR_POSITION[0], JAR_POSITION[1] + 0.05, JAR_POSITION[2]]} />
      <Shards />

      {/* Shelves arranged around the table */}
      <Shelf
        side="back-left"
        position={[-0.95, 1.55, -1.2]}
        itemIds={["banana", "apple", "orange"]}
      />
      <Shelf
        side="back-right"
        position={[0.95, 1.55, -1.2]}
        itemIds={["acid", "water", "vinegar"]}
      />
      <Shelf
        side="left"
        position={[-2.0, 1.5, 0]}
        rotationY={Math.PI / 2}
        itemIds={["flask", "test-tube", "spoon"]}
      />
      <Shelf
        side="right"
        position={[2.0, 1.5, 0]}
        rotationY={-Math.PI / 2}
        itemIds={["uranium"]}
      />

      {/* Items lying on the table (after being dropped) */}
      <TableItems />

      {/* Held item floats with the cursor */}
      <HeldItem />
      <DragController />
    </>
  );
}
