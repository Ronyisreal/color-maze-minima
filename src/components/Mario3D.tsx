import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, Box, Cylinder } from '@react-three/drei';
import * as THREE from 'three';

const MarioHead3D: React.FC = () => {
  const headRef = useRef<THREE.Group>(null);
  const capRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (headRef.current) {
      headRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
      headRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.1;
    }
    if (capRef.current) {
      capRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 3) * 0.02;
    }
  });

  return (
    <group ref={headRef}>
      {/* Mario's Face */}
      <Sphere args={[1, 32, 32]} position={[0, 0, 0]}>
        <meshPhongMaterial color="#F4A460" />
      </Sphere>
      
      {/* Mario's Cap */}
      <group ref={capRef} position={[0, 0.7, 0]}>
        {/* Cap Main */}
        <Sphere args={[1.1, 32, 16]} position={[0, 0.2, 0]} scale={[1, 0.8, 1]}>
          <meshPhongMaterial color="#DC143C" />
        </Sphere>
        
        {/* Cap Visor */}
        <Cylinder args={[0.8, 1, 0.2, 32]} position={[0, -0.3, 0.5]} rotation={[0.3, 0, 0]}>
          <meshPhongMaterial color="#8B0000" />
        </Cylinder>
        
        {/* M Logo */}
        <Cylinder args={[0.25, 0.25, 0.1, 32]} position={[0, 0.4, 0.9]}>
          <meshPhongMaterial color="white" />
        </Cylinder>
      </group>
      
      {/* Eyes */}
      <Sphere args={[0.15, 16, 16]} position={[-0.3, 0.2, 0.8]}>
        <meshPhongMaterial color="black" />
      </Sphere>
      <Sphere args={[0.15, 16, 16]} position={[0.3, 0.2, 0.8]}>
        <meshPhongMaterial color="black" />
      </Sphere>
      
      {/* Eye whites */}
      <Sphere args={[0.2, 16, 16]} position={[-0.3, 0.2, 0.75]}>
        <meshPhongMaterial color="white" />
      </Sphere>
      <Sphere args={[0.2, 16, 16]} position={[0.3, 0.2, 0.75]}>
        <meshPhongMaterial color="white" />
      </Sphere>
      
      {/* Nose */}
      <Sphere args={[0.2, 16, 16]} position={[0, -0.1, 0.9]} scale={[0.8, 1.2, 0.6]}>
        <meshPhongMaterial color="#DEB887" />
      </Sphere>
      
      {/* Mustache */}
      <Box args={[0.6, 0.15, 0.3]} position={[0, -0.35, 0.8]}>
        <meshPhongMaterial color="#8B4513" />
      </Box>
    </group>
  );
};

export const Mario3D: React.FC = () => {
  return (
    <div className="mario-3d-container">
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <pointLight position={[-10, -10, -5]} intensity={0.5} />
        <MarioHead3D />
      </Canvas>
    </div>
  );
};