// Lab table top + legs — simple sturdy wooden look.
export function Table() {
  return (
    <group>
      {/* top */}
      <mesh receiveShadow castShadow position={[0, 0.88, 0]}>
        <boxGeometry args={[3.2, 0.08, 1.6]} />
        <meshStandardMaterial color="#2a2018" roughness={0.85} />
      </mesh>
      {/* edge highlight */}
      <mesh position={[0, 0.93, 0]}>
        <boxGeometry args={[3.21, 0.005, 1.61]} />
        <meshStandardMaterial color="#3a2c20" roughness={0.7} />
      </mesh>
      {/* legs */}
      {[
        [-1.45, -0.7],
        [1.45, -0.7],
        [-1.45, 0.7],
        [1.45, 0.7],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.43, z]} castShadow>
          <boxGeometry args={[0.1, 0.86, 0.1]} />
          <meshStandardMaterial color="#1d160f" roughness={0.9} />
        </mesh>
      ))}
      {/* floor */}
      <mesh receiveShadow position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#0e0e10" roughness={0.95} />
      </mesh>
    </group>
  );
}
