import { Suspense, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import * as THREE from 'three';

interface LiveRobot3DProps {
  isSpeaking: boolean;
  mood?: 'idle' | 'happy' | 'thinking' | 'greeting';
}

function RobotHead({ isSpeaking, mood = 'idle' }: { isSpeaking: boolean; mood: string }) {
  const headRef = useRef<THREE.Group>(null);
  const jawRef = useRef<THREE.Mesh>(null);
  const eyeLeftRef = useRef<THREE.Mesh>(null);
  const eyeRightRef = useRef<THREE.Mesh>(null);
  const eyeLidLeftRef = useRef<THREE.Mesh>(null);
  const eyeLidRightRef = useRef<THREE.Mesh>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  
  const timeRef = useRef(0);
  const blinkTimeRef = useRef(0);
  const nextBlinkRef = useRef(2);
  const isBlinkingRef = useRef(false);
  const gestureTimeRef = useRef(0);
  
  useFrame((state, delta) => {
    timeRef.current += delta;
    blinkTimeRef.current += delta;
    gestureTimeRef.current += delta;
    
    // ===== HEAD MOVEMENT =====
    if (headRef.current) {
      // Idle breathing movement
      const idleY = Math.sin(timeRef.current * 0.5) * 0.015;
      const idleRotX = Math.sin(timeRef.current * 0.3) * 0.015;
      const idleRotZ = Math.sin(timeRef.current * 0.4) * 0.008;
      
      headRef.current.position.y = 0.8 + idleY;
      headRef.current.rotation.x = idleRotX;
      headRef.current.rotation.z = idleRotZ;
      
      // Speaking animation - more expressive movement
      if (isSpeaking) {
        const speakRotY = Math.sin(timeRef.current * 2.5) * 0.06;
        const speakRotX = Math.sin(timeRef.current * 3.5) * 0.04;
        const nod = Math.sin(timeRef.current * 1.5) * 0.02;
        headRef.current.rotation.y = speakRotY;
        headRef.current.rotation.x += speakRotX + nod;
      } else {
        headRef.current.rotation.y *= 0.95;
      }
      
      // Mood-based head tilt
      if (mood === 'thinking') {
        headRef.current.rotation.z += 0.1;
      } else if (mood === 'happy') {
        headRef.current.rotation.x -= 0.05;
      }
    }
    
    // ===== BLINKING =====
    if (eyeLidLeftRef.current && eyeLidRightRef.current) {
      // Random blink timing
      if (blinkTimeRef.current > nextBlinkRef.current && !isBlinkingRef.current) {
        isBlinkingRef.current = true;
        blinkTimeRef.current = 0;
      }
      
      if (isBlinkingRef.current) {
        // Blink animation (0.15 seconds)
        const blinkProgress = blinkTimeRef.current / 0.15;
        const blinkAmount = blinkProgress < 0.5 
          ? blinkProgress * 2 
          : (1 - blinkProgress) * 2;
        
        const lidScale = 1 - (blinkAmount * 0.9);
        eyeLidLeftRef.current.scale.y = Math.max(0.1, lidScale);
        eyeLidRightRef.current.scale.y = Math.max(0.1, lidScale);
        
        if (blinkProgress >= 1) {
          isBlinkingRef.current = false;
          nextBlinkRef.current = 2 + Math.random() * 4; // Next blink in 2-6 seconds
        }
      } else {
        // Eyes open
        eyeLidLeftRef.current.scale.y = 1;
        eyeLidRightRef.current.scale.y = 1;
      }
    }
    
    // ===== JAW ANIMATION =====
    if (jawRef.current) {
      if (isSpeaking) {
        // Realistic jaw movement with variation
        const jawFreq1 = Math.sin(timeRef.current * 12) * 0.5;
        const jawFreq2 = Math.sin(timeRef.current * 8) * 0.3;
        const jawFreq3 = Math.sin(timeRef.current * 15) * 0.2;
        const jawOpen = Math.abs(jawFreq1 + jawFreq2 + jawFreq3) * 0.025;
        
        jawRef.current.position.y = -0.08 - jawOpen;
        jawRef.current.scale.y = 1 + jawOpen * 1.5;
      } else {
        jawRef.current.position.y = -0.08;
        jawRef.current.scale.y = 1;
      }
    }
    
    // ===== EYE GLOW =====
    if (eyeLeftRef.current && eyeRightRef.current) {
      const glowIntensity = isSpeaking 
        ? 0.9 + Math.sin(timeRef.current * 5) * 0.15
        : 0.6 + Math.sin(timeRef.current * 1.5) * 0.1;
      
      const eyeMaterial = eyeLeftRef.current.material as THREE.MeshStandardMaterial;
      eyeMaterial.emissiveIntensity = glowIntensity;
      (eyeRightRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = glowIntensity;
    }
    
    // ===== ARM GESTURES =====
    if (leftArmRef.current && rightArmRef.current) {
      if (isSpeaking) {
        // Gesturing while speaking
        const gesturePhase = Math.sin(gestureTimeRef.current * 1.2);
        const armWave = Math.sin(timeRef.current * 2) * 0.15;
        
        if (gesturePhase > 0.3) {
          rightArmRef.current.rotation.z = -0.3 - armWave;
          rightArmRef.current.rotation.x = Math.sin(timeRef.current * 1.5) * 0.1;
        } else {
          rightArmRef.current.rotation.z = -0.1;
          rightArmRef.current.rotation.x = 0;
        }
        
        leftArmRef.current.rotation.z = 0.1 + Math.sin(timeRef.current * 0.8) * 0.05;
      } else {
        // Idle arm position
        leftArmRef.current.rotation.z = 0.05 + Math.sin(timeRef.current * 0.3) * 0.02;
        rightArmRef.current.rotation.z = -0.05 - Math.sin(timeRef.current * 0.3) * 0.02;
        leftArmRef.current.rotation.x = 0;
        rightArmRef.current.rotation.x = 0;
      }
      
      // Greeting wave
      if (mood === 'greeting') {
        rightArmRef.current.rotation.z = -1.2 + Math.sin(timeRef.current * 8) * 0.3;
        rightArmRef.current.rotation.x = 0.3;
      }
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
    color: new THREE.Color(0x2dd4bf), // Primary teal color
    metalness: 0.7,
    roughness: 0.2,
    emissive: new THREE.Color(0x2dd4bf),
    emissiveIntensity: 0.4,
  }), []);
  
  const eyeMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color(0x2dd4bf),
    metalness: 0.5,
    roughness: 0.1,
    emissive: new THREE.Color(0x2dd4bf),
    emissiveIntensity: 0.6,
  }), []);

  const skinMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color(0x1a1a2e),
    metalness: 0.3,
    roughness: 0.7,
  }), []);

  return (
    <group position={[0, -0.2, 0]}>
      {/* Torso */}
      <mesh position={[0, 0.2, 0]} material={darkMetalMaterial}>
        <boxGeometry args={[0.9, 0.5, 0.4]} />
      </mesh>
      
      {/* Shoulder joints */}
      <mesh position={[-0.45, 0.35, 0]} material={lightMetalMaterial}>
        <sphereGeometry args={[0.12, 16, 16]} />
      </mesh>
      <mesh position={[0.45, 0.35, 0]} material={lightMetalMaterial}>
        <sphereGeometry args={[0.12, 16, 16]} />
      </mesh>
      
      {/* Left Arm */}
      <group ref={leftArmRef} position={[-0.55, 0.25, 0]}>
        <mesh position={[0, -0.15, 0]} material={lightMetalMaterial}>
          <capsuleGeometry args={[0.06, 0.2, 8, 16]} />
        </mesh>
        <mesh position={[0, -0.35, 0]} material={darkMetalMaterial}>
          <sphereGeometry args={[0.05, 8, 8]} />
        </mesh>
      </group>
      
      {/* Right Arm */}
      <group ref={rightArmRef} position={[0.55, 0.25, 0]}>
        <mesh position={[0, -0.15, 0]} material={lightMetalMaterial}>
          <capsuleGeometry args={[0.06, 0.2, 8, 16]} />
        </mesh>
        <mesh position={[0, -0.35, 0]} material={darkMetalMaterial}>
          <sphereGeometry args={[0.05, 8, 8]} />
        </mesh>
      </group>
      
      {/* Neck */}
      <mesh position={[0, 0.55, 0]} material={lightMetalMaterial}>
        <cylinderGeometry args={[0.1, 0.12, 0.25, 16]} />
      </mesh>
      
      {/* Neck ring */}
      <mesh position={[0, 0.5, 0]} material={accentMaterial}>
        <torusGeometry args={[0.11, 0.015, 8, 24]} />
      </mesh>
      
      {/* Head group */}
      <group ref={headRef} position={[0, 0.8, 0]}>
        {/* Main head - rounded */}
        <mesh material={darkMetalMaterial}>
          <sphereGeometry args={[0.28, 32, 32]} />
        </mesh>
        
        {/* Face plate */}
        <mesh position={[0, -0.02, 0.18]} material={lightMetalMaterial}>
          <boxGeometry args={[0.32, 0.22, 0.08]} />
        </mesh>
        
        {/* Forehead accent */}
        <mesh position={[0, 0.12, 0.2]} material={accentMaterial}>
          <boxGeometry args={[0.25, 0.04, 0.02]} />
        </mesh>
        
        {/* Eye visor */}
        <mesh position={[0, 0.04, 0.25]} material={skinMaterial}>
          <boxGeometry args={[0.28, 0.07, 0.02]} />
        </mesh>
        
        {/* Left eye */}
        <mesh ref={eyeLeftRef} position={[-0.08, 0.04, 0.27]} material={eyeMaterial}>
          <sphereGeometry args={[0.035, 16, 16]} />
        </mesh>
        
        {/* Right eye */}
        <mesh ref={eyeRightRef} position={[0.08, 0.04, 0.27]} material={eyeMaterial}>
          <sphereGeometry args={[0.035, 16, 16]} />
        </mesh>
        
        {/* Eye lids (for blinking) */}
        <mesh ref={eyeLidLeftRef} position={[-0.08, 0.06, 0.275]}>
          <boxGeometry args={[0.08, 0.04, 0.01]} />
          <meshStandardMaterial color={0x1a1a2e} />
        </mesh>
        <mesh ref={eyeLidRightRef} position={[0.08, 0.06, 0.275]}>
          <boxGeometry args={[0.08, 0.04, 0.01]} />
          <meshStandardMaterial color={0x1a1a2e} />
        </mesh>
        
        {/* Mouth area */}
        <mesh ref={jawRef} position={[0, -0.08, 0.24]} material={accentMaterial}>
          <boxGeometry args={[0.15, 0.03, 0.02]} />
        </mesh>
        
        {/* Side panels (ears) */}
        <mesh position={[-0.26, 0, 0]} material={lightMetalMaterial}>
          <cylinderGeometry args={[0.04, 0.04, 0.12, 8]} />
        </mesh>
        <mesh position={[0.26, 0, 0]} material={lightMetalMaterial}>
          <cylinderGeometry args={[0.04, 0.04, 0.12, 8]} />
        </mesh>
        
        {/* Antenna */}
        <mesh position={[0, 0.28, 0]} material={accentMaterial}>
          <cylinderGeometry args={[0.015, 0.015, 0.08, 8]} />
        </mesh>
        <mesh position={[0, 0.34, 0]} material={eyeMaterial}>
          <sphereGeometry args={[0.025, 8, 8]} />
        </mesh>
      </group>
      
      {/* Chest indicator */}
      <mesh position={[0, 0.3, 0.21]}>
        <circleGeometry args={[0.06, 24]} />
        <meshStandardMaterial
          color={isSpeaking ? 0x22c55e : 0x2dd4bf}
          emissive={isSpeaking ? 0x22c55e : 0x2dd4bf}
          emissiveIntensity={isSpeaking ? 1.2 : 0.4}
        />
      </mesh>
      
      {/* Chest accent lines */}
      <mesh position={[-0.15, 0.25, 0.21]} material={accentMaterial}>
        <boxGeometry args={[0.08, 0.02, 0.01]} />
      </mesh>
      <mesh position={[0.15, 0.25, 0.21]} material={accentMaterial}>
        <boxGeometry args={[0.08, 0.02, 0.01]} />
      </mesh>
    </group>
  );
}

function RobotScene({ isSpeaking, mood }: LiveRobot3DProps) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={0.9} />
      <directionalLight position={[-3, 3, 2]} intensity={0.4} color="#a0c4ff" />
      <pointLight position={[0, 2, 3]} intensity={0.6} color="#2dd4bf" />
      
      <RobotHead isSpeaking={isSpeaking} mood={mood || 'idle'} />
      
      <Environment preset="city" />
    </>
  );
}

export function LiveRobot3D({ isSpeaking, mood }: LiveRobot3DProps) {
  return (
    <div 
      className="w-full h-full rounded-xl overflow-hidden bg-gradient-to-b from-background/80 to-muted/40 border border-border/50"
      style={{ 
        boxShadow: isSpeaking 
          ? '0 0 30px hsl(var(--primary) / 0.4)' 
          : '0 0 15px hsl(222 47% 4% / 0.3)',
        pointerEvents: 'none', // Allow clicks to pass through to elements below
      }}
    >
      <Canvas
        camera={{ position: [0, 1.1, 2.8], fov: 40 }}
        gl={{ antialias: true, alpha: true }}
        style={{ pointerEvents: 'none' }} // Disable pointer events on canvas
      >
        <Suspense fallback={null}>
          <RobotScene isSpeaking={isSpeaking} mood={mood} />
        </Suspense>
      </Canvas>
    </div>
  );
}
