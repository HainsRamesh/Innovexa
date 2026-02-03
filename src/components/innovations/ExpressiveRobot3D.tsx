import { Suspense, useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import * as THREE from 'three';

export type RobotEmotion = 'idle' | 'speaking' | 'happy' | 'curious' | 'excited' | 'thinking';

interface ExpressiveRobotProps {
  emotion: RobotEmotion;
  isSpeaking: boolean;
}

function RobotCharacter({ emotion, isSpeaking }: ExpressiveRobotProps) {
  const headRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const jawRef = useRef<THREE.Mesh>(null);
  const eyeLeftRef = useRef<THREE.Mesh>(null);
  const eyeRightRef = useRef<THREE.Mesh>(null);
  const browLeftRef = useRef<THREE.Mesh>(null);
  const browRightRef = useRef<THREE.Mesh>(null);
  const antennaRef = useRef<THREE.Mesh>(null);
  const chestLightRef = useRef<THREE.Mesh>(null);
  
  const timeRef = useRef(0);
  const blinkTimerRef = useRef(0);
  const isBlinkingRef = useRef(false);
  const emotionTransitionRef = useRef(0);
  
  useFrame((_, delta) => {
    timeRef.current += delta;
    blinkTimerRef.current += delta;
    emotionTransitionRef.current = Math.min(emotionTransitionRef.current + delta * 3, 1);
    
    // Natural blinking (every 2-5 seconds)
    if (blinkTimerRef.current > 2 + Math.random() * 3) {
      isBlinkingRef.current = true;
      blinkTimerRef.current = 0;
    }
    if (isBlinkingRef.current && blinkTimerRef.current > 0.15) {
      isBlinkingRef.current = false;
    }
    
    const t = timeRef.current;
    const smoothFactor = emotionTransitionRef.current;
    
    // === BODY BREATHING ANIMATION ===
    if (bodyRef.current) {
      const breathe = Math.sin(t * 0.8) * 0.015;
      bodyRef.current.position.y = breathe;
      bodyRef.current.rotation.z = Math.sin(t * 0.3) * 0.01;
    }
    
    // === HEAD ANIMATIONS ===
    if (headRef.current) {
      let targetRotX = Math.sin(t * 0.4) * 0.03;
      let targetRotY = Math.sin(t * 0.25) * 0.04;
      let targetRotZ = Math.sin(t * 0.35) * 0.02;
      let targetPosY = 0.8 + Math.sin(t * 0.6) * 0.02;
      
      // Emotion-based head movements
      switch (emotion) {
        case 'happy':
          targetRotX = Math.sin(t * 1.5) * 0.08; // Nodding
          targetPosY += Math.abs(Math.sin(t * 2)) * 0.03;
          break;
        case 'curious':
          targetRotZ = 0.15 + Math.sin(t * 0.5) * 0.05; // Tilted
          targetRotY = Math.sin(t * 0.8) * 0.1;
          break;
        case 'excited':
          targetRotX = Math.sin(t * 3) * 0.1;
          targetPosY += Math.abs(Math.sin(t * 4)) * 0.04;
          targetRotZ = Math.sin(t * 2.5) * 0.08;
          break;
        case 'thinking':
          targetRotY = -0.2 + Math.sin(t * 0.3) * 0.05;
          targetRotX = 0.1;
          break;
        case 'speaking':
          targetRotX = Math.sin(t * 2) * 0.04;
          targetRotY = Math.sin(t * 1.5) * 0.06;
          break;
      }
      
      // Apply speaking overlay
      if (isSpeaking) {
        targetRotX += Math.sin(t * 2.5) * 0.03;
        targetRotY += Math.sin(t * 1.8) * 0.04;
      }
      
      // Smooth interpolation
      headRef.current.rotation.x += (targetRotX - headRef.current.rotation.x) * 0.1;
      headRef.current.rotation.y += (targetRotY - headRef.current.rotation.y) * 0.1;
      headRef.current.rotation.z += (targetRotZ - headRef.current.rotation.z) * 0.1;
      headRef.current.position.y += (targetPosY - headRef.current.position.y) * 0.1;
    }
    
    // === JAW/MOUTH ANIMATION ===
    if (jawRef.current) {
      let jawOpen = 0;
      if (isSpeaking) {
        // Realistic speech pattern with varied mouth movement
        const speechPattern = 
          Math.abs(Math.sin(t * 12)) * 0.3 +
          Math.abs(Math.sin(t * 8 + 1)) * 0.2 +
          Math.abs(Math.sin(t * 15 + 2)) * 0.15;
        jawOpen = speechPattern * 0.04;
      }
      jawRef.current.position.y = -0.08 - jawOpen;
      jawRef.current.scale.y = 1 + jawOpen * 3;
    }
    
    // === EYE ANIMATIONS ===
    const blinkScale = isBlinkingRef.current ? 0.1 : 1;
    
    if (eyeLeftRef.current && eyeRightRef.current) {
      // Eye scale for blinking
      eyeLeftRef.current.scale.y = THREE.MathUtils.lerp(eyeLeftRef.current.scale.y, blinkScale, 0.3);
      eyeRightRef.current.scale.y = THREE.MathUtils.lerp(eyeRightRef.current.scale.y, blinkScale, 0.3);
      
      // Eye glow based on emotion
      let glowIntensity = 0.4 + Math.sin(t * 1.5) * 0.1;
      let eyeColor = new THREE.Color(0x60a5fa); // Default blue
      
      switch (emotion) {
        case 'happy':
          glowIntensity = 0.8 + Math.sin(t * 3) * 0.2;
          eyeColor = new THREE.Color(0x4ade80); // Green
          break;
        case 'excited':
          glowIntensity = 1 + Math.sin(t * 5) * 0.3;
          eyeColor = new THREE.Color(0xfbbf24); // Yellow/gold
          break;
        case 'curious':
          glowIntensity = 0.6 + Math.sin(t * 2) * 0.15;
          eyeColor = new THREE.Color(0xa78bfa); // Purple
          break;
        case 'thinking':
          glowIntensity = 0.3 + Math.sin(t * 0.8) * 0.2;
          eyeColor = new THREE.Color(0x38bdf8); // Light blue
          break;
        case 'speaking':
          glowIntensity = 0.7 + Math.sin(t * 4) * 0.2;
          break;
      }
      
      if (isSpeaking) {
        glowIntensity += 0.2;
      }
      
      const leftMat = eyeLeftRef.current.material as THREE.MeshStandardMaterial;
      const rightMat = eyeRightRef.current.material as THREE.MeshStandardMaterial;
      
      leftMat.emissive.lerp(eyeColor, 0.1);
      leftMat.emissiveIntensity = THREE.MathUtils.lerp(leftMat.emissiveIntensity, glowIntensity, 0.1);
      rightMat.emissive.lerp(eyeColor, 0.1);
      rightMat.emissiveIntensity = THREE.MathUtils.lerp(rightMat.emissiveIntensity, glowIntensity, 0.1);
    }
    
    // === EYEBROW ANIMATIONS ===
    if (browLeftRef.current && browRightRef.current) {
      let browLeftY = 0.16;
      let browRightY = 0.16;
      let browLeftRot = 0;
      let browRightRot = 0;
      
      switch (emotion) {
        case 'happy':
          browLeftY = 0.18;
          browRightY = 0.18;
          browLeftRot = 0.1;
          browRightRot = -0.1;
          break;
        case 'curious':
          browLeftY = 0.19;
          browRightY = 0.15;
          browLeftRot = 0.2;
          browRightRot = -0.1;
          break;
        case 'excited':
          browLeftY = 0.2 + Math.sin(t * 4) * 0.02;
          browRightY = 0.2 + Math.sin(t * 4) * 0.02;
          break;
        case 'thinking':
          browLeftY = 0.14;
          browRightY = 0.17;
          browLeftRot = -0.15;
          browRightRot = 0.1;
          break;
      }
      
      browLeftRef.current.position.y = THREE.MathUtils.lerp(browLeftRef.current.position.y, browLeftY, 0.1);
      browRightRef.current.position.y = THREE.MathUtils.lerp(browRightRef.current.position.y, browRightY, 0.1);
      browLeftRef.current.rotation.z = THREE.MathUtils.lerp(browLeftRef.current.rotation.z, browLeftRot, 0.1);
      browRightRef.current.rotation.z = THREE.MathUtils.lerp(browRightRef.current.rotation.z, browRightRot, 0.1);
    }
    
    // === ANTENNA ANIMATION ===
    if (antennaRef.current) {
      const antennaPulse = isSpeaking || emotion === 'excited'
        ? 1 + Math.sin(t * 6) * 0.3
        : 0.5 + Math.sin(t * 2) * 0.2;
      
      const antennaMat = antennaRef.current.material as THREE.MeshStandardMaterial;
      antennaMat.emissiveIntensity = antennaPulse;
    }
    
    // === CHEST LIGHT ===
    if (chestLightRef.current) {
      const chestMat = chestLightRef.current.material as THREE.MeshStandardMaterial;
      
      let chestColor = isSpeaking ? new THREE.Color(0x22c55e) : new THREE.Color(0x3b82f6);
      let chestIntensity = isSpeaking ? 1 + Math.sin(t * 8) * 0.3 : 0.4 + Math.sin(t * 1.5) * 0.2;
      
      if (emotion === 'excited') {
        chestColor = new THREE.Color(0xfbbf24);
        chestIntensity = 1.2 + Math.sin(t * 6) * 0.4;
      } else if (emotion === 'happy') {
        chestColor = new THREE.Color(0x4ade80);
      }
      
      chestMat.emissive.lerp(chestColor, 0.1);
      chestMat.emissiveIntensity = THREE.MathUtils.lerp(chestMat.emissiveIntensity, chestIntensity, 0.1);
    }
  });

  // Reset transition on emotion change
  useEffect(() => {
    emotionTransitionRef.current = 0;
  }, [emotion]);

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
    emissive: new THREE.Color(0x60a5fa),
    emissiveIntensity: 0.5,
  }), []);

  const browMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color(0x4b5563),
    metalness: 0.9,
    roughness: 0.3,
  }), []);

  const chestLightMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color(0x3b82f6),
    emissive: new THREE.Color(0x3b82f6),
    emissiveIntensity: 0.4,
    metalness: 0.3,
    roughness: 0.2,
  }), []);

  const antennaMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color(0x60a5fa),
    emissive: new THREE.Color(0x3b82f6),
    emissiveIntensity: 0.5,
    metalness: 0.5,
    roughness: 0.2,
  }), []);

  return (
    <group ref={bodyRef} position={[0, 0, 0]}>
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
      
      {/* Neck ring */}
      <mesh position={[0, 0.5, 0]} material={accentMaterial}>
        <torusGeometry args={[0.14, 0.02, 8, 24]} />
      </mesh>
      
      {/* Head group */}
      <group ref={headRef} position={[0, 0.8, 0]}>
        {/* Main head */}
        <mesh material={darkMetalMaterial}>
          <boxGeometry args={[0.5, 0.45, 0.4]} />
        </mesh>
        
        {/* Head top */}
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
        
        {/* Eyebrows */}
        <mesh ref={browLeftRef} position={[-0.1, 0.16, 0.23]} material={browMaterial}>
          <boxGeometry args={[0.08, 0.015, 0.01]} />
        </mesh>
        <mesh ref={browRightRef} position={[0.1, 0.16, 0.23]} material={browMaterial}>
          <boxGeometry args={[0.08, 0.015, 0.01]} />
        </mesh>
        
        {/* Left eye */}
        <mesh ref={eyeLeftRef} position={[-0.1, 0.02, 0.24]} material={eyeMaterial}>
          <sphereGeometry args={[0.045, 16, 16]} />
        </mesh>
        
        {/* Right eye */}
        <mesh ref={eyeRightRef} position={[0.1, 0.02, 0.24]} material={eyeMaterial}>
          <sphereGeometry args={[0.045, 16, 16]} />
        </mesh>
        
        {/* Mouth/Speaker */}
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
        
        {/* Antenna */}
        <group position={[0, 0.28, 0]}>
          <mesh ref={antennaRef} material={accentMaterial}>
            <cylinderGeometry args={[0.02, 0.02, 0.12, 8]} />
          </mesh>
          <mesh position={[0, 0.08, 0]} material={antennaMaterial}>
            <sphereGeometry args={[0.035, 8, 8]} />
          </mesh>
        </group>
      </group>
      
      {/* Chest plate */}
      <mesh position={[0, 0.25, 0.26]} material={accentMaterial}>
        <boxGeometry args={[0.3, 0.15, 0.02]} />
      </mesh>
      
      {/* Chest light */}
      <mesh ref={chestLightRef} position={[0, 0.25, 0.28]} material={chestLightMaterial}>
        <circleGeometry args={[0.05, 16]} />
      </mesh>
    </group>
  );
}

function RobotScene({ emotion, isSpeaking }: ExpressiveRobotProps) {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />
      <directionalLight position={[-3, 3, 2]} intensity={0.4} color="#a0c4ff" />
      <pointLight position={[0, 2, 3]} intensity={0.5} color="#60a5fa" />
      
      <RobotCharacter emotion={emotion} isSpeaking={isSpeaking} />
      
      <Environment preset="city" />
    </>
  );
}

export function ExpressiveRobot3D({ emotion, isSpeaking }: ExpressiveRobotProps) {
  return (
    <div 
      className="w-28 h-28 rounded-xl overflow-hidden bg-gradient-to-b from-muted/30 to-muted/60 border border-border/50"
      style={{ 
        boxShadow: isSpeaking 
          ? '0 0 25px rgba(59, 130, 246, 0.4), 0 0 50px rgba(59, 130, 246, 0.2)' 
          : '0 0 15px rgba(0, 0, 0, 0.2)'
      }}
    >
      <Canvas
        camera={{ position: [0, 0.6, 2.5], fov: 35 }}
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={null}>
          <RobotScene emotion={emotion} isSpeaking={isSpeaking} />
        </Suspense>
      </Canvas>
    </div>
  );
}
