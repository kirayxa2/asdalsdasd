import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
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
          toneMappingExposure: 1.15,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
        camera={{ position: [0, 1.7, 2.2], fov: 45, near: 0.1, far: 50 }}
      >
        <color attach="background" args={["#1c1f24"]} />
        <Scene />
        <EffectComposer multisampling={0}>
          {/* Subtle bloom — only the brightest things glow (flames, uranium, sparks) */}
          <Bloom
            mipmapBlur
            intensity={0.55}
            luminanceThreshold={0.85}
            luminanceSmoothing={0.15}
          />
          <Vignette eskil={false} offset={0.3} darkness={0.35} />
        </EffectComposer>
      </Canvas>
      <FlashOverlay />
      <HUD />
    </>
  );
}
