"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

function WireSurface() {
  const meshRef = useRef<THREE.Mesh>(null);
  const { mouse, viewport } = useThree();

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(28, 14, 90, 90);
    const position = geo.attributes.position;

    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i);
      const y = position.getY(i);

      const z =
        Math.sin(x * 0.82) * 0.9 +
        Math.cos(y * 1.15) * 0.5 +
        Math.sin((x + y) * 0.72) * 0.4;

      position.setZ(i, z);
    }

    position.needsUpdate = true;
    geo.computeVertexNormals();
    return geo;
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;

    const targetX = mouse.y * 0.32;
    const targetY = mouse.x * 0.32;

    meshRef.current.rotation.x = THREE.MathUtils.lerp(
      meshRef.current.rotation.x,
      -1.15 + targetX,
      0.05
    );

    meshRef.current.rotation.z = THREE.MathUtils.lerp(
      meshRef.current.rotation.z,
      -0.18 + targetY,
      0.05
    );

    meshRef.current.position.x = THREE.MathUtils.lerp(
      meshRef.current.position.x,
      mouse.x * viewport.width * 0.08,
      0.04
    );

    meshRef.current.position.y = THREE.MathUtils.lerp(
      meshRef.current.position.y,
      -2.2 + mouse.y * 0.45,
      0.04
    );

    meshRef.current.rotation.y =
      Math.sin(state.clock.elapsedTime * 0.18) * 0.03;
  });

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      rotation={[-1.15, 0.04, -0.18]}
      position={[0, -2.2, 0]}
    >
      <meshBasicMaterial color="#7dff6b" wireframe transparent opacity={0.95} />
    </mesh>
  );
}

function Particles() {
  const pointsRef = useRef<THREE.Points>(null);
  const { mouse } = useThree();

  const positions = useMemo(() => {
    const count = 180;
    const array = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      array[i * 3] = (Math.random() - 0.5) * 24;
      array[i * 3 + 1] = Math.random() * 10 - 1;
      array[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }

    return array;
  }, []);

  useFrame((state) => {
    if (!pointsRef.current) return;

    pointsRef.current.rotation.y += 0.0008;
    pointsRef.current.rotation.x = THREE.MathUtils.lerp(
      pointsRef.current.rotation.x,
      mouse.y * 0.08,
      0.03
    );

    pointsRef.current.position.x = THREE.MathUtils.lerp(
      pointsRef.current.position.x,
      mouse.x * 0.35,
      0.03
    );

    pointsRef.current.position.y = THREE.MathUtils.lerp(
      pointsRef.current.position.y,
      mouse.y * 0.25,
      0.03
    );

    pointsRef.current.rotation.z =
      Math.sin(state.clock.elapsedTime * 0.08) * 0.03;
  });

  return (
    <points ref={pointsRef} position={[0, 0, -2]}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#a855f7"
        size={0.06}
        sizeAttenuation
        transparent
        opacity={0.9}
      />
    </points>
  );
}

function CameraRig() {
  const { camera, mouse } = useThree();

  useFrame(() => {
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, mouse.x * 0.45, 0.03);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, 2.2 + mouse.y * 0.2, 0.03);
    camera.lookAt(0, -0.6, 0);
  });

  return null;
}

export function SurfaceScene() {
  return (
    <div className="relative h-full w-full overflow-hidden">
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 2.6, 11], fov: 42 }}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
        style={{ background: "transparent" }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
        }}
      >
        <CameraRig />
        <ambientLight intensity={0.9} />
        <WireSurface />
        <Particles />
      </Canvas>

      <div className="pointer-events-none absolute bottom-12 left-[58%] -translate-x-1/2 rounded-full border border-white/10 bg-black/65 px-4 py-2 text-xs text-zinc-400 backdrop-blur-md">
        z = f(x, y) · Interactive 3D Surface
      </div>
    </div>
  );
}