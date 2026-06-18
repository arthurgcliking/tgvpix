"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

type RailLinesProps = {
  reducedMotion: boolean;
};

function createCurveGeometry(points: THREE.Vector3[], segments = 80) {
  const curve = new THREE.CatmullRomCurve3(points);
  return new THREE.BufferGeometry().setFromPoints(curve.getPoints(segments));
}

export default function RailLines({ reducedMotion }: RailLinesProps) {
  const groupRef = useRef<THREE.Group>(null);

  const { accentMaterial, accentLines, trajectoryLines, trajectoryMaterial } = useMemo(() => {
    const trajectoryMaterial = new THREE.LineBasicMaterial({
      blending: THREE.AdditiveBlending,
      color: new THREE.Color("#38bdf8"),
      depthWrite: false,
      opacity: 0,
      toneMapped: false,
      transparent: true,
    });
    const accentMaterial = new THREE.LineBasicMaterial({
      blending: THREE.AdditiveBlending,
      color: new THREE.Color("#a5f3fc"),
      depthWrite: false,
      opacity: 0,
      toneMapped: false,
      transparent: true,
    });

    const trajectoryGeometries = [
      createCurveGeometry([
        new THREE.Vector3(-4.2, -1.42, 3.2),
        new THREE.Vector3(-1.65, -0.82, -0.9),
        new THREE.Vector3(-0.28, -0.42, -5.9),
      ]),
      createCurveGeometry([
        new THREE.Vector3(4.0, -1.46, 3.1),
        new THREE.Vector3(1.55, -0.8, -0.9),
        new THREE.Vector3(0.24, -0.42, -5.9),
      ]),
      createCurveGeometry([
        new THREE.Vector3(-2.4, -1.52, 3.4),
        new THREE.Vector3(-0.86, -0.9, -1.0),
        new THREE.Vector3(-0.08, -0.44, -5.4),
      ]),
      createCurveGeometry([
        new THREE.Vector3(2.36, -1.52, 3.4),
        new THREE.Vector3(0.82, -0.9, -1.0),
        new THREE.Vector3(0.08, -0.44, -5.4),
      ]),
      createCurveGeometry([
        new THREE.Vector3(-3.3, 0.28, -1.2),
        new THREE.Vector3(-1.1, 0.52, -3.4),
        new THREE.Vector3(2.7, 0.2, -6.4),
      ]),
      createCurveGeometry([
        new THREE.Vector3(3.1, 0.06, -1.8),
        new THREE.Vector3(0.9, 0.38, -3.6),
        new THREE.Vector3(-2.4, 0.06, -6.2),
      ]),
    ];

    return {
      accentMaterial,
      accentLines: trajectoryGeometries.slice(4).map((geometry) => new THREE.Line(geometry, accentMaterial)),
      trajectoryLines: trajectoryGeometries.slice(0, 4).map((geometry) => new THREE.Line(geometry, trajectoryMaterial)),
      trajectoryMaterial,
    };
  }, []);

  useFrame(({ clock }) => {
    const elapsed = clock.getElapsedTime();
    const reveal = reducedMotion ? 0.28 : THREE.MathUtils.smoothstep(elapsed, 3.0, 5.8);
    const pulse = reducedMotion ? 0 : Math.sin(elapsed * 0.76) * 0.025;

    trajectoryMaterial.opacity = reveal * (0.048 + pulse);
    accentMaterial.opacity = reveal * 0.026;

    if (groupRef.current && !reducedMotion) {
      groupRef.current.position.z = Math.sin(elapsed * 0.18) * 0.08;
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.18, -0.95]}>
      {trajectoryLines.map((line, index) => (
        <primitive key={index} object={line} />
      ))}
      {accentLines.map((line, index) => (
        <primitive key={index} object={line} />
      ))}
    </group>
  );
}
