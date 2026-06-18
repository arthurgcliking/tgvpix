"use client";

import { useFrame } from "@react-three/fiber";
import type { MutableRefObject } from "react";
import { useMemo, useRef } from "react";
import * as THREE from "three";

type PointerState = {
  active: boolean;
  x: number;
  y: number;
};

type AeroSilhouetteProps = {
  pointerRef: MutableRefObject<PointerState>;
  reducedMotion: boolean;
};

type Streak = {
  line: THREE.Line;
  material: THREE.LineBasicMaterial;
  phase: number;
  strength: number;
};

function smoothstep(edge0: number, edge1: number, value: number) {
  const x = THREE.MathUtils.clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return x * x * (3 - 2 * x);
}

function createAeroSurfaceGeometry() {
  const lengthSegments = 112;
  const widthSegments = 22;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let ix = 0; ix <= lengthSegments; ix += 1) {
    const u = ix / lengthSegments;
    const x = THREE.MathUtils.lerp(-4.6, 3.7, u);
    const rearRise = smoothstep(0.02, 0.2, u);
    const noseTaper = 1 - smoothstep(0.5, 1, u) * 0.94;
    const shoulder = 0.08 + rearRise * noseTaper;
    const crown = Math.sin(u * Math.PI) * 0.13;
    const noseDrop = smoothstep(0.72, 1, u) * 0.12;

    for (let iy = 0; iy <= widthSegments; iy += 1) {
      const v = iy / widthSegments;
      const side = v * 2 - 1;
      const edge = Math.abs(side);
      const sideFalloff = 1 - edge ** 1.72 * 0.5;
      const width = 1.56 * shoulder;
      const height = 0.34 * shoulder;
      const z = side * width * 0.5;
      const y = -0.18 + crown + sideFalloff * height - edge ** 2 * 0.11 - noseDrop;
      const twist = side * smoothstep(0.44, 1, u) * -0.13;

      positions.push(x, y + twist, z);
      uvs.push(u, v);
    }
  }

  for (let ix = 0; ix < lengthSegments; ix += 1) {
    for (let iy = 0; iy < widthSegments; iy += 1) {
      const a = ix * (widthSegments + 1) + iy;
      const b = a + 1;
      const c = a + widthSegments + 1;
      const d = c + 1;

      indices.push(a, c, b);
      indices.push(b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}

function createCurveGeometry(points: THREE.Vector3[], segments = 120) {
  const curve = new THREE.CatmullRomCurve3(points);
  return new THREE.BufferGeometry().setFromPoints(curve.getPoints(segments));
}

function createReflectionMaterial() {
  return new THREE.ShaderMaterial({
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    transparent: true,
    uniforms: {
      uPointer: { value: 0 },
      uReveal: { value: 0 },
      uTime: { value: 0 },
    },
    vertexShader: [
      "varying vec2 vUv;",
      "varying vec3 vNormal;",
      "varying vec3 vViewPosition;",
      "void main() {",
      "  vUv = uv;",
      "  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);",
      "  vViewPosition = -mvPosition.xyz;",
      "  vNormal = normalize(normalMatrix * normal);",
      "  gl_Position = projectionMatrix * mvPosition;",
      "}",
    ].join("\n"),
    fragmentShader: [
      "uniform float uPointer;",
      "uniform float uReveal;",
      "uniform float uTime;",
      "varying vec2 vUv;",
      "varying vec3 vNormal;",
      "varying vec3 vViewPosition;",
      "float streak(float coord, float center, float width) {",
      "  float d = abs(coord - center);",
      "  return exp(-(d * d) / (width * width));",
      "}",
      "void main() {",
      "  vec3 viewDir = normalize(vViewPosition);",
      "  float fresnel = pow(1.0 - max(dot(normalize(vNormal), viewDir), 0.0), 2.45);",
      "  float edgeMask = smoothstep(0.02, 0.16, vUv.x) * (1.0 - smoothstep(0.92, 1.0, vUv.x));",
      "  edgeMask *= smoothstep(0.015, 0.16, vUv.y) * (1.0 - smoothstep(0.86, 1.0, vUv.y));",
      "  float coord = vUv.x + vUv.y * 0.22 + uPointer * 0.028;",
      "  float bands = 0.0;",
      "  for (int i = 0; i < 9; i++) {",
      "    float fi = float(i);",
      "    float center = fract(uTime * (0.022 + fi * 0.0028) + fi * 0.137) * 1.32 - 0.16;",
      "    float width = 0.006 + mod(fi, 3.0) * 0.0035;",
      "    bands += streak(coord, center, width) * (0.3 + 0.06 * fi);",
      "  }",
      "  float hairline = 1.0 - smoothstep(0.0, 0.01, abs(fract(coord * 11.0 - uTime * 0.18) - 0.48));",
      "  float revealGate = smoothstep(0.02, 0.42, vUv.x) * (1.0 - smoothstep(0.98, 1.0, vUv.x));",
      "  float alpha = (bands * 0.5 + fresnel * 0.34 + hairline * 0.035) * edgeMask * revealGate * uReveal;",
      "  vec3 cyan = mix(vec3(0.12, 0.72, 0.95), vec3(0.86, 0.99, 1.0), clamp(bands, 0.0, 1.0));",
      "  gl_FragColor = vec4(cyan, alpha);",
      "}",
    ].join("\n"),
  });
}

function makeStreak(points: THREE.Vector3[], color: string, phase: number, strength: number): Streak {
  const material = new THREE.LineBasicMaterial({
    blending: THREE.AdditiveBlending,
    color: new THREE.Color(color),
    depthWrite: false,
    opacity: 0,
    toneMapped: false,
    transparent: true,
  });

  return {
    line: new THREE.Line(createCurveGeometry(points), material),
    material,
    phase,
    strength,
  };
}

export default function AeroSilhouette({
  pointerRef,
  reducedMotion,
}: AeroSilhouetteProps) {
  const groupRef = useRef<THREE.Group>(null);
  const surfaceMaterialRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const reflectionMaterialRef = useRef<THREE.ShaderMaterial>(null);
  const rimMaterialRef = useRef<THREE.MeshBasicMaterial>(null);

  const {
    reflectionMaterial,
    rimGeometry,
    streaks,
    surfaceGeometry,
  } = useMemo(() => {
    const surfaceGeometry = createAeroSurfaceGeometry();
    const reflectionMaterial = createReflectionMaterial();

    return {
      reflectionMaterial,
      rimGeometry: surfaceGeometry.clone(),
      streaks: [
        makeStreak([
          new THREE.Vector3(-3.9, 0.17, -0.18),
          new THREE.Vector3(-2.1, 0.35, -0.11),
          new THREE.Vector3(0.55, 0.34, -0.06),
          new THREE.Vector3(2.75, 0.0, -0.02),
        ], "#dffbff", 0.1, 0.48),
        makeStreak([
          new THREE.Vector3(-4.1, 0.08, 0.25),
          new THREE.Vector3(-1.6, 0.23, 0.43),
          new THREE.Vector3(1.15, 0.13, 0.28),
          new THREE.Vector3(3.1, -0.1, 0.04),
        ], "#67e8f9", 1.4, 0.36),
        makeStreak([
          new THREE.Vector3(-3.45, 0.04, -0.43),
          new THREE.Vector3(-0.9, 0.16, -0.55),
          new THREE.Vector3(1.55, 0.02, -0.31),
          new THREE.Vector3(2.92, -0.1, -0.05),
        ], "#38bdf8", 2.1, 0.3),
        makeStreak([
          new THREE.Vector3(-2.6, 0.31, 0.02),
          new THREE.Vector3(-0.8, 0.43, 0.04),
          new THREE.Vector3(1.45, 0.28, 0.02),
        ], "#f0fdff", 2.8, 0.34),
        makeStreak([
          new THREE.Vector3(-4.2, -0.08, 0.34),
          new THREE.Vector3(-2.0, 0.03, 0.58),
          new THREE.Vector3(0.8, -0.02, 0.43),
          new THREE.Vector3(2.45, -0.16, 0.12),
        ], "#0ea5e9", 3.35, 0.24),
        makeStreak([
          new THREE.Vector3(-4.0, -0.12, -0.32),
          new THREE.Vector3(-1.55, 0.0, -0.5),
          new THREE.Vector3(0.95, -0.05, -0.34),
          new THREE.Vector3(2.3, -0.15, -0.1),
        ], "#0ea5e9", 4.2, 0.22),
      ],
      surfaceGeometry,
    };
  }, []);

  useFrame(({ clock }) => {
    const elapsed = clock.getElapsedTime();
    const pointer = reducedMotion ? { x: 0, y: 0 } : pointerRef.current;
    const reveal = reducedMotion ? 0.72 : THREE.MathUtils.smoothstep(elapsed, 1.25, 5.0);
    const firstLight = reducedMotion ? 1 : THREE.MathUtils.smoothstep(elapsed, 0.35, 2.2);
    const breathe = reducedMotion ? 0 : Math.sin(elapsed * 0.54) * 0.012;
    const reflectionPulse = reducedMotion ? 0.1 : Math.sin(elapsed * 0.92) * 0.09;

    if (groupRef.current) {
      groupRef.current.position.x = THREE.MathUtils.lerp(
        groupRef.current.position.x,
        0.04 + pointer.x * 0.07,
        0.032,
      );
      groupRef.current.position.y = 0.03 + breathe - pointer.y * 0.018;
      groupRef.current.rotation.x = 0.075 - pointer.y * 0.01;
      groupRef.current.rotation.y = -0.16 + pointer.x * 0.018;
      groupRef.current.rotation.z = -0.035;
    }

    if (surfaceMaterialRef.current) {
      surfaceMaterialRef.current.opacity = reveal * 0.54;
      surfaceMaterialRef.current.emissiveIntensity = reveal * (0.018 + reflectionPulse * 0.04);
      surfaceMaterialRef.current.roughness = 0.18 - reflectionPulse * 0.03;
    }

    if (rimMaterialRef.current) {
      rimMaterialRef.current.opacity = reveal * (0.018 + reflectionPulse * 0.02);
    }

    reflectionMaterial.uniforms.uTime.value = reducedMotion ? 5.5 : elapsed;
    reflectionMaterial.uniforms.uReveal.value = firstLight;
    reflectionMaterial.uniforms.uPointer.value = pointer.x;

    if (reflectionMaterialRef.current) {
      reflectionMaterialRef.current.uniforms.uTime.value = reflectionMaterial.uniforms.uTime.value;
      reflectionMaterialRef.current.uniforms.uReveal.value = reflectionMaterial.uniforms.uReveal.value;
      reflectionMaterialRef.current.uniforms.uPointer.value = reflectionMaterial.uniforms.uPointer.value;
    }

    streaks.forEach((streak) => {
      const phase = elapsed * 0.68 - streak.phase;
      const pulse = Math.max(0, Math.sin(phase));
      const gate = reducedMotion ? 0.38 : THREE.MathUtils.smoothstep(elapsed, 1.4 + streak.phase * 0.18, 4.2 + streak.phase * 0.18);
      streak.material.opacity = gate * reveal * streak.strength * pulse ** 2.4;
      streak.line.position.x = reducedMotion ? 0 : Math.sin(phase * 0.38) * 0.035;
    });
  });

  return (
    <group ref={groupRef} position={[0.04, 0.03, -4.55]} rotation={[0.075, -0.16, -0.035]} scale={[1.34, 1.08, 1.24]}>
      <mesh geometry={rimGeometry} scale={[1.015, 1.03, 1.035]}>
        <meshBasicMaterial
          ref={rimMaterialRef}
          blending={THREE.AdditiveBlending}
          color="#0ea5e9"
          depthWrite={false}
          opacity={0}
          transparent
        />
      </mesh>

      <mesh geometry={surfaceGeometry}>
        <meshPhysicalMaterial
          ref={surfaceMaterialRef}
          clearcoat={1}
          clearcoatRoughness={0.12}
          color="#01060c"
          emissive="#063648"
          emissiveIntensity={0}
          envMapIntensity={1.9}
          metalness={0.96}
          opacity={0}
          roughness={0.18}
          transparent
        />
      </mesh>

      <mesh geometry={surfaceGeometry} material={reflectionMaterial}>
        <primitive attach="material" object={reflectionMaterial} ref={reflectionMaterialRef} />
      </mesh>

      {streaks.map((streak, index) => (
        <primitive key={index} object={streak.line} />
      ))}
    </group>
  );
}
