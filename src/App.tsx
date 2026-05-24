import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { EffectComposer, Bloom, Vignette, ChromaticAberration } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { Scene } from "./scene/Scene";
import { HUD } from "./ui/HUD";
import { FlashOverlay } from "./ui/FlashOverlay";

export default function App() {
  return (
    <>
      <Canvas
        shadows
        dpr={[1, 1.75]}
        gl={{
          antialias: true,
          alpha: false,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.05,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
        camera={{ position: [0, 1.7, 2.2], fov: 45, near: 0.1, far: 50 }}
      >
        <color attach="background" args={["#15171b"]} />
        <Scene />
        <EffectComposer multisampling={0}>
          <Bloom
            mipmapBlur
            intensity={1.0}
            luminanceThreshold={0.55}
            luminanceSmoothing={0.18}
          />
          <ChromaticAberration
            blendFunction={BlendFunction.NORMAL}
            offset={[0.0008, 0.0008] as unknown as THREE.Vector2}
            radialModulation={false}
            modulationOffset={0}
          />
          <Vignette eskil={false} offset={0.2} darkness={0.55} />
        </EffectComposer>
      </Canvas>
      <FlashOverlay />
      <HUD />
    </>
  );
}
