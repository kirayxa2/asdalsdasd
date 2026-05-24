import { useGame } from "../../store/gameStore";

/**
 * Glass shards sprayed by an explosion. Driven by store.shards (physics in
 * the store tick).
 */
export function Shards() {
  const shards = useGame((s) => s.shards);
  return (
    <>
      {shards.map((s) => (
        <mesh
          key={s.id}
          position={s.position}
          rotation={s.rotation}
          scale={[s.size * 1.4, s.size * 0.4, s.size]}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshPhysicalMaterial
            color="#cfeaff"
            roughness={0.05}
            transmission={0.85}
            thickness={0.05}
            transparent
            opacity={Math.min(1, s.life)}
          />
        </mesh>
      ))}
    </>
  );
}
