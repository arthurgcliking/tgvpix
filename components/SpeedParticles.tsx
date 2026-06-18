"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

type SpeedParticlesProps = {
  reducedMotion: boolean;
};

type ParticleData = {
  geometry: THREE.BufferGeometry;
  positions: Float32Array;
  speeds: Float32Array;
};

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

export default function SpeedParticles({ reducedMotion }: SpeedParticlesProps) {
  const materialRef = useRef<THREE.PointsMaterial>(null);

  const particleData = useMemo<ParticleData>(() => {
    const count = reducedMotion ? 32 : 86;
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);

    for (let i = 0; i < count; i += 1) {
      positions[i * 3] = randomBetween(-4.8, 4.8);
      positions[i * 3 + 1] = randomBetween(-1.6, 1.9);
      positions[i * 3 + 2] = randomBetween(-9.8, 2.8);
      speeds[i] = randomBetween(0.18, 0.92);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    return { geometry, positions, speeds };
  }, [reducedMotion]);

  useFrame(({ clock }, delta) => {
    const elapsed = clock.getElapsedTime();

    if (materialRef.current) {
      const reveal = reducedMotion ? 0.45 : THREE.MathUtils.smoothstep(elapsed, 2.1, 5.0);
      materialRef.current.opacity = reveal * (reducedMotion ? 0.07 : 0.14);
    }

    if (reducedMotion) {
      return;
    }

    const { geometry, positions, speeds } = particleData;

    for (let i = 0; i < speeds.length; i += 1) {
      const zIndex = i * 3 + 2;
      positions[zIndex] += speeds[i] * delta;
      positions[i * 3] += Math.sin(elapsed * 0.35 + i) * delta * 0.018;

      if (positions[zIndex] > 3.0) {
        positions[i * 3] = randomBetween(-4.8, 4.8);
        positions[i * 3 + 1] = randomBetween(-1.6, 1.9);
        positions[zIndex] = randomBetween(-10.5, -8.2);
      }
    }

    const positionAttribute = geometry.getAttribute("position") as THREE.BufferAttribute;
    positionAttribute.needsUpdate = true;
  });

  return (
    <points geometry={particleData.geometry}>
      <pointsMaterial
        ref={materialRef}
        blending={THREE.AdditiveBlending}
        color="#a5f3fc"
        depthWrite={false}
        opacity={0}
        size={0.014}
        sizeAttenuation
        toneMapped={false}
        transparent
      />
    </points>
  );
}
