"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import "katex/dist/katex.min.css";
import { InlineMath } from "react-katex";

function WireSurface() {
  const meshRef = useRef<THREE.Mesh>(null);
  const { mouse, viewport } = useThree();

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(40, 20, 60, 40);
    return geo;
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;

    const time = state.clock.elapsedTime;
    const targetX = mouse.y * 0.2;
    const targetY = mouse.x * 0.2;

    meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, -1.2 + targetX, 0.05);
    meshRef.current.rotation.z = THREE.MathUtils.lerp(meshRef.current.rotation.z, -0.2 + targetY, 0.05);
    meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, mouse.x * viewport.width * 0.05, 0.04);
    meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, -2.5 + mouse.y * 0.3, 0.04);
    meshRef.current.rotation.y = Math.sin(time * 0.1) * 0.05;

    const position = meshRef.current.geometry.attributes.position;
    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i);
      const y = position.getY(i);
      const distance = Math.sqrt(x * x + y * y);
      const z = Math.sin(distance * 0.4 - time * 1.5) * 1.2;
      position.setZ(i, z);
    }
    
    position.needsUpdate = true;
    meshRef.current.geometry.computeVertexNormals();
  });

  return (
    <mesh ref={meshRef} geometry={geometry} rotation={[-1.2, 0, -0.2]} position={[0, -2.5, 0]}>
      <meshBasicMaterial color="#39ff14" wireframe transparent opacity={0.35} />
    </mesh>
  );
}

export function SurfaceScene() {
  return (
    <div 
      className="relative h-full w-full overflow-hidden"
      // A mágica acontece aqui: A máscara usa o canal Alpha para "apagar" as bordas reais do canvas
      style={{ 
        WebkitMaskImage: 'radial-gradient(ellipse 80% 50% at 50% 50%, black 20%, transparent 100%)',
        maskImage: 'radial-gradient(ellipse 80% 50% at 50% 50%, black 20%, transparent 100%)'
      }}
    >
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 2.6, 11], fov: 42 }}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
        style={{ background: "transparent" }}
        onCreated={({ gl }) => {
          // Fundo estritamente 100% transparente, sem Fog bloqueando a visão
          gl.setClearColor(0x000000, 0); 
        }}
      >
        <ambientLight intensity={0.9} />
        <WireSurface />
      </Canvas>

      <div className="pointer-events-none absolute bottom-12 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3 rounded-full border border-white/10 bg-black/40 px-6 py-3 text-sm text-zinc-300 shadow-xl backdrop-blur-md">
        <InlineMath math="T(\mathbf{v}) = A\mathbf{v}" />
        <span className="text-zinc-600">•</span>
        <span className="font-medium tracking-wide">Espaço Vetorial no</span>
        <InlineMath math="\mathbb{R}^3" />
      </div>
    </div>
  );
}