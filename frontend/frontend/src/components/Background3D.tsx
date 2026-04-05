import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'

const Terrain = () => {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (!meshRef.current) return
    const time = state.clock.getElapsedTime()
    const geometry = meshRef.current.geometry as THREE.PlaneGeometry
    const position = geometry.attributes.position

    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i)
      const y = position.getY(i)
      const z = Math.sin(x * 0.5 + time) * 0.5 + Math.cos(y * 0.5 + time) * 0.5
      position.setZ(i, z)
    }
    position.needsUpdate = true
  })

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2.5, 0, 0]} position={[0, -2, -5]}>
      <planeGeometry args={[50, 50, 60, 60]} />
      <meshBasicMaterial color="#39FF14" wireframe transparent opacity={0.15} />
    </mesh>
  )
}

export default function Background3D() {
  return (
    <div className="fixed inset-0 z-[-1] bg-ddx-dark">
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={75} />
        <fog attach="fog" args={['#050505', 3, 15]} />
        <Terrain />
      </Canvas>
    </div>
  )
}