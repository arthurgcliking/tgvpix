"use client";

import { Environment, Float, Lightformer } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Bloom,
  ChromaticAberration,
  EffectComposer,
  Noise,
  Vignette,
} from "@react-three/postprocessing";
import type { MutableRefObject, ReactNode } from "react";
import { Suspense, useRef } from "react";
import { BlendFunction } from "postprocessing";
import * as THREE from "three";
import AeroSilhouette from "@/components/AeroSilhouette";
import RailLines from "@/components/RailLines";
import SpeedParticles from "@/components/SpeedParticles";

export type PointerState = {
  active: boolean;
  x: number;
  y: number;
};

type TgvpixSceneProps = {
  pointerRef: MutableRefObject<PointerState>;
  reducedMotion: boolean;
};

function SceneRig({
  children,
  pointerRef,
  reducedMotion,
}: TgvpixSceneProps & { children: ReactNode }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ camera, clock }) => {
    const pointer = reducedMotion ? { x: 0, y: 0 } : pointerRef.current;
    const elapsed = clock.getElapsedTime();
    const idle = reducedMotion ? 0 : Math.sin(elapsed * 0.18) * 0.012;

    camera.position.x = THREE.MathUtils.lerp(camera.position.x, pointer.x * 0.1, 0.038);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, 0.48 - pointer.y * 0.045, 0.038);
    camera.lookAt(pointer.x * 0.04, 0.02 + idle, -4.0);

    if (groupRef.current) {
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        pointer.x * 0.01,
        0.04,
      );
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        -pointer.y * 0.006,
        0.04,
      );
    }
  });

  return <group ref={groupRef}>{children}</group>;
}

function CinematicLights({ pointerRef, reducedMotion }: TgvpixSceneProps) {
  const sweepLightRef = useRef<THREE.PointLight>(null);
  const rimLightRef = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    const elapsed = clock.getElapsedTime();
    const pointer = reducedMotion ? { x: 0, y: 0 } : pointerRef.current;
    const sweep = reducedMotion ? 0.38 : (Math.sin(elapsed * 0.42 - 1.2) + 1) * 0.5;

    if (sweepLightRef.current) {
      sweepLightRef.current.position.x = THREE.MathUtils.lerp(-3.2, 2.8, sweep) + pointer.x * 0.32;
      sweepLightRef.current.position.y = 0.7 - pointer.y * 0.1;
      sweepLightRef.current.intensity = reducedMotion ? 1.2 : 0.7 + sweep * 3.1;
    }

    if (rimLightRef.current) {
      rimLightRef.current.position.x = 2.6 + pointer.x * 0.22;
      rimLightRef.current.position.y = -0.4 - pointer.y * 0.08;
      rimLightRef.current.intensity = reducedMotion ? 0.8 : 0.68 + Math.sin(elapsed * 0.52) * 0.22;
    }
  });

  return (
    <>
      <ambientLight intensity={0.018} />
      <directionalLight color="#dffbff" intensity={0.09} position={[-2.8, 3.4, 2.8]} />
      <pointLight ref={sweepLightRef} color="#67e8f9" distance={7.2} intensity={0} position={[-3, 0.75, -2.7]} />
      <pointLight ref={rimLightRef} color="#0ea5e9" distance={6.4} intensity={1.2} position={[2.6, -0.4, -2.2]} />
      <spotLight
        angle={0.22}
        color="#8ff6ff"
        distance={8}
        intensity={0.78}
        penumbra={0.82}
        position={[0.3, 1.5, 1.8]}
        target-position={[0, 0, -4.2]}
      />
    </>
  );
}

export default function TgvpixScene({
  pointerRef,
  reducedMotion,
}: TgvpixSceneProps) {
  return (
    <div aria-hidden className="absolute inset-0 z-0">
      <Canvas
        camera={{ far: 48, fov: 38, near: 0.1, position: [0, 0.48, 5.8] }}
        dpr={[1, 1.5]}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
        onCreated={({ gl }) => {
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 0.72;
        }}
      >
        <color args={["#000106"]} attach="background" />
        <fog args={["#000106", 4.2, 13.5]} attach="fog" />
        <Suspense fallback={null}>
          <CinematicLights pointerRef={pointerRef} reducedMotion={reducedMotion} />
          <Environment resolution={32}>
            <Lightformer
              color="#67e8f9"
              form="rect"
              intensity={1.15}
              position={[-2.4, 1.2, -2.4]}
              rotation={[0.2, 0.65, 0.1]}
              scale={[4.8, 0.22, 1]}
            />
            <Lightformer
              color="#dffbff"
              form="rect"
              intensity={0.38}
              position={[1.9, 1.8, 0.8]}
              rotation={[0.4, -0.5, 0.1]}
              scale={[2.4, 0.18, 1]}
            />
          </Environment>
          <SceneRig pointerRef={pointerRef} reducedMotion={reducedMotion}>
            <Float
              floatIntensity={reducedMotion ? 0 : 0.08}
              rotationIntensity={reducedMotion ? 0 : 0.025}
              speed={0.38}
            >
              <AeroSilhouette pointerRef={pointerRef} reducedMotion={reducedMotion} />
            </Float>
            <RailLines reducedMotion={reducedMotion} />
            <SpeedParticles reducedMotion={reducedMotion} />
          </SceneRig>
          <EffectComposer multisampling={0}>
            <Bloom
              intensity={reducedMotion ? 0.24 : 0.46}
              luminanceSmoothing={0.82}
              luminanceThreshold={0.13}
              mipmapBlur
            />
            <ChromaticAberration
              blendFunction={BlendFunction.NORMAL}
              offset={[0.00026, 0.00016]}
            />
            <Noise blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.024} />
            <Vignette darkness={0.9} offset={0.16} />
          </EffectComposer>
        </Suspense>
      </Canvas>
    </div>
  );
}
