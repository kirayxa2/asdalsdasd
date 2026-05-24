import { Canvas } from "@react-three/fiber";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { Scene } from "./scene/Scene";
import { HUD } from "./ui/HUD";

export default function App() {
  return (
    <>
      <Canvas
        shadows
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: false }}
        camera={{ position: [0, 1.7, 2.2], fov: 45, near: 0.1, far: 50 }}
      >
        <color attach="background" args={["#0a0c10"]} />
        <Scene />
        <EffectComposer>
          <Bloom
            mipmapBlur
            intensity={0.7}
            luminanceThreshold={0.35}
            luminanceSmoothing={0.2}
          />
          <Vignette eskil={false} offset={0.2} darkness={0.7} />
        </EffectComposer>
      </Canvas>
      <HUD />
    </>
  );
}
