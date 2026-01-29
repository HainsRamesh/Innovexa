import { Suspense, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import * as THREE from 'three';

interface RobotPresenterProps {
  isSpeaking: boolean;
  theme?: string;
}

/**
 * 3D Robot Presenter - Professional humanoid AI presenter
 * 
 * This is a procedurally generated robot using Three.js primitives.
 * Style: Clean, modern, professional metallic robot (upper torso only)
 * 
 * TODO: Replace with a high-quality GLB model when available.
 * The GLB should have:
 * - Idle animation (subtle breathing/movement)
 * - Talk animation (head/jaw movement synced to speech)
 * - Professional humanoid appearance (not cartoon)
 */

function RobotHead({ isSpeaking }: { isSpeaking: boolean }) {
  const headRef = useRef<THREE.Group>(null);
  const jawRef = useRef<THREE.Mesh>(null);
  const eyeLeftRef = useRef<THREE.Mesh>(null);
  const eyeRightRef = useRef<THREE.Mesh>(null);
  
  // Animation timing
  const timeRef = useRef(0);
  
  useFrame((state, delta) => {
    timeRef.current += delta;
    
    if (headRef.current) {
      // Subtle idle head movement (breathing effect)
      const idleY = Math.sin(timeRef.current * 0.5) * 0.02;
      const idleRotX = Math.sin(timeRef.current * 0.3) * 0.02;
      const idleRotZ = Math.sin(timeRef.current * 0.4) * 0.01;
      
      headRef.current.position.y = 0.8 + idleY;
      headRef.current.rotation.x = idleRotX;
      headRef.current.rotation.z = idleRotZ;
      
      // Speaking animation - more movement
      if (isSpeaking) {
        const speakRotY = Math.sin(timeRef.current * 2) * 0.05;
        const speakRotX = Math.sin(timeRef.current * 3) * 0.03;
        headRef.current.rotation.y = speakRotY;
        headRef.current.rotation.x += speakRotX;
      } else {
        headRef.current.rotation.y *= 0.95; // Ease back to center
      }
    }
    
    // Jaw/mouth animation when speaking
    if (jawRef.current) {
      if (isSpeaking) {
        const jawOpen = Math.abs(Math.sin(timeRef.current * 8)) * 0.03;
        jawRef.current.position.y = -0.08 - jawOpen;
        jawRef.current.scale.y = 1 + jawOpen * 2;
      } else {
        jawRef.current.position.y = -0.08;
        jawRef.current.scale.y = 1;
      }
    }
    
    // Eye glow pulse
    if (eyeLeftRef.current && eyeRightRef.current) {
      const glowIntensity = isSpeaking 
        ? 0.8 + Math.sin(timeRef.current * 4) * 0.2
        : 0.5 + Math.sin(timeRef.current) * 0.1;
      
      const eyeMaterial = eyeLeftRef.current.material as THREE.MeshStandardMaterial;
      eyeMaterial.emissiveIntensity = glowIntensity;
      (eyeRightRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = glowIntensity;
    }
  });

  // Materials
  const darkMetalMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color(0x1a1a2e),
    metalness: 0.9,
    roughness: 0.3,
  }), []);
  
  const lightMetalMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color(0x2d2d44),
    metalness: 0.8,
    roughness: 0.4,
  }), []);
  
  const accentMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color(0x3b82f6),
    metalness: 0.7,
    roughness: 0.2,
    emissive: new THREE.Color(0x3b82f6),
    emissiveIntensity: 0.3,
  }), []);
  
  const eyeMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color(0x60a5fa),
    metalness: 0.5,
    roughness: 0.1,
    emissive: new THREE.Color(0x3b82f6),
    emissiveIntensity: 0.5,
  }), []);

  return (
    <group position={[0, 0, 0]}>
      {/* Shoulders/Torso base */}
      <mesh position={[0, 0.2, 0]} material={darkMetalMaterial}>
        <boxGeometry args={[1.2, 0.4, 0.5]} />
      </mesh>
      
      {/* Shoulder joints */}
      <mesh position={[-0.55, 0.3, 0]} material={lightMetalMaterial}>
        <sphereGeometry args={[0.15, 16, 16]} />
      </mesh>
      <mesh position={[0.55, 0.3, 0]} material={lightMetalMaterial}>
        <sphereGeometry args={[0.15, 16, 16]} />
      </mesh>
      
      {/* Neck */}
      <mesh position={[0, 0.55, 0]} material={lightMetalMaterial}>
        <cylinderGeometry args={[0.12, 0.15, 0.3, 16]} />
      </mesh>
      
      {/* Neck rings (detail) */}
      <mesh position={[0, 0.5, 0]} material={accentMaterial}>
        <torusGeometry args={[0.14, 0.02, 8, 24]} />
      </mesh>
      
      {/* Head group */}
      <group ref={headRef} position={[0, 0.8, 0]}>
        {/* Main head */}
        <mesh material={darkMetalMaterial}>
          <boxGeometry args={[0.5, 0.45, 0.4]} />
        </mesh>
        
        {/* Head top panel */}
        <mesh position={[0, 0.18, 0]} material={lightMetalMaterial}>
          <boxGeometry args={[0.4, 0.1, 0.35]} />
        </mesh>
        
        {/* Forehead accent */}
        <mesh position={[0, 0.1, 0.21]} material={accentMaterial}>
          <boxGeometry args={[0.3, 0.05, 0.02]} />
        </mesh>
        
        {/* Face plate */}
        <mesh position={[0, -0.02, 0.15]} material={lightMetalMaterial}>
          <boxGeometry args={[0.35, 0.25, 0.12]} />
        </mesh>
        
        {/* Eye visor */}
        <mesh position={[0, 0.02, 0.22]} material={accentMaterial}>
          <boxGeometry args={[0.32, 0.08, 0.02]} />
        </mesh>
        
        {/* Left eye */}
        <mesh ref={eyeLeftRef} position={[-0.1, 0.02, 0.24]} material={eyeMaterial}>
          <sphereGeometry args={[0.04, 16, 16]} />
        </mesh>
        
        {/* Right eye */}
        <mesh ref={eyeRightRef} position={[0.1, 0.02, 0.24]} material={eyeMaterial}>
          <sphereGeometry args={[0.04, 16, 16]} />
        </mesh>
        
        {/* Mouth/Speaker area */}
        <mesh ref={jawRef} position={[0, -0.08, 0.22]} material={darkMetalMaterial}>
          <boxGeometry args={[0.2, 0.04, 0.02]} />
        </mesh>
        
        {/* Side panels */}
        <mesh position={[-0.27, 0, 0]} material={lightMetalMaterial}>
          <boxGeometry args={[0.06, 0.35, 0.3]} />
        </mesh>
        <mesh position={[0.27, 0, 0]} material={lightMetalMaterial}>
          <boxGeometry args={[0.06, 0.35, 0.3]} />
        </mesh>
        
        {/* Antenna/sensor */}
        <mesh position={[0, 0.28, 0]} material={accentMaterial}>
          <cylinderGeometry args={[0.02, 0.02, 0.1, 8]} />
        </mesh>
        <mesh position={[0, 0.35, 0]} material={eyeMaterial}>
          <sphereGeometry args={[0.03, 8, 8]} />
        </mesh>
      </group>
      
      {/* Chest plate details */}
      <mesh position={[0, 0.25, 0.26]} material={accentMaterial}>
        <boxGeometry args={[0.3, 0.15, 0.02]} />
      </mesh>
      
      {/* Chest light indicator */}
      <mesh position={[0, 0.25, 0.28]}>
        <circleGeometry args={[0.04, 16]} />
        <meshStandardMaterial
          color={isSpeaking ? 0x22c55e : 0x3b82f6}
          emissive={isSpeaking ? 0x22c55e : 0x3b82f6}
          emissiveIntensity={isSpeaking ? 1 : 0.3}
        />
      </mesh>
    </group>
  );
}

function RobotScene({ isSpeaking }: RobotPresenterProps) {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />
      <directionalLight position={[-3, 3, 2]} intensity={0.4} color="#a0c4ff" />
      <pointLight position={[0, 2, 3]} intensity={0.5} color="#60a5fa" />
      
      <RobotHead isSpeaking={isSpeaking} />
      
      <Environment preset="city" />
    </>
  );
}

export function RobotPresenter3D({ isSpeaking, theme }: RobotPresenterProps) {
  return (
    <div 
      className="w-24 h-24 rounded-lg overflow-hidden bg-gradient-to-b from-muted/50 to-muted/80 border border-border/50"
      style={{ 
        boxShadow: isSpeaking 
          ? '0 0 20px rgba(59, 130, 246, 0.3)' 
          : '0 0 10px rgba(0, 0, 0, 0.2)'
      }}
    >
      <Canvas
        camera={{ position: [0, 0.6, 2.5], fov: 35 }}
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={null}>
          <RobotScene isSpeaking={isSpeaking} theme={theme} />
        </Suspense>
      </Canvas>
    </div>
  );
}
