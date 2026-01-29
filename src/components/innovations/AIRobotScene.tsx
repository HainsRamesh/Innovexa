import { Suspense, useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, useAnimations, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

// TODO: Replace with actual robot GLB model URL
// The model should have 'Idle' and 'Talk' animations
const ROBOT_MODEL_URL = 'https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/robot/robot.glb';

interface RobotModelProps {
  isTalking: boolean;
}

function RobotModel({ isTalking }: RobotModelProps) {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(ROBOT_MODEL_URL);
  const { actions, names } = useAnimations(animations, group);
  const [currentAnimation, setCurrentAnimation] = useState<string>('Idle');

  // Find animation names (case-insensitive search)
  const findAnimation = (searchTerm: string): string | null => {
    const found = names.find(name => 
      name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return found || null;
  };

  const idleAnimation = findAnimation('idle') || names[0];
  const talkAnimation = findAnimation('talk') || findAnimation('speak') || findAnimation('wave') || names[1] || names[0];

  useEffect(() => {
    const targetAnimation = isTalking ? talkAnimation : idleAnimation;
    
    if (targetAnimation && actions[targetAnimation]) {
      // Fade out current animation
      if (currentAnimation && actions[currentAnimation]) {
        actions[currentAnimation].fadeOut(0.3);
      }
      
      // Fade in new animation
      actions[targetAnimation].reset().fadeIn(0.3).play();
      setCurrentAnimation(targetAnimation);
    }
  }, [isTalking, actions, idleAnimation, talkAnimation, currentAnimation]);

  // Initial animation setup
  useEffect(() => {
    if (idleAnimation && actions[idleAnimation]) {
      actions[idleAnimation].play();
      setCurrentAnimation(idleAnimation);
    }
  }, [actions, idleAnimation]);

  // Gentle hover animation
  useFrame((state) => {
    if (group.current) {
      group.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
    }
  });

  return (
    <group ref={group} position={[0, -1, 0]} scale={1.5}>
      <primitive object={scene} />
    </group>
  );
}

// Fallback placeholder robot when model fails to load
function PlaceholderRobot({ isTalking }: RobotModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      // Gentle hover
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
    if (headRef.current && isTalking) {
      // Subtle "talking" movement
      headRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 8) * 0.05;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Body */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.5, 0.6, 1.2, 16]} />
        <meshStandardMaterial color="#3b82f6" metalness={0.8} roughness={0.2} />
      </mesh>
      
      {/* Head */}
      <mesh ref={headRef} position={[0, 1, 0]}>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshStandardMaterial color="#60a5fa" metalness={0.6} roughness={0.3} />
      </mesh>
      
      {/* Eyes */}
      <mesh position={[-0.15, 1.05, 0.3]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[0.15, 1.05, 0.3]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} />
      </mesh>
      
      {/* Antenna */}
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.3, 8]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.1} />
      </mesh>
      <mesh position={[0, 1.7, 0]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial 
          color={isTalking ? "#22c55e" : "#ef4444"} 
          emissive={isTalking ? "#22c55e" : "#ef4444"} 
          emissiveIntensity={0.8} 
        />
      </mesh>
      
      {/* Arms */}
      <mesh position={[-0.7, 0.2, 0]} rotation={[0, 0, Math.PI / 4]}>
        <cylinderGeometry args={[0.08, 0.08, 0.6, 8]} />
        <meshStandardMaterial color="#3b82f6" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0.7, 0.2, 0]} rotation={[0, 0, -Math.PI / 4]}>
        <cylinderGeometry args={[0.08, 0.08, 0.6, 8]} />
        <meshStandardMaterial color="#3b82f6" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
}

interface AIRobotSceneProps {
  isTalking: boolean;
}

export function AIRobotScene({ isTalking }: AIRobotSceneProps) {
  const [usePlaceholder, setUsePlaceholder] = useState(false);

  return (
    <div className="w-full h-[200px] rounded-lg overflow-hidden bg-gradient-to-b from-slate-900 to-slate-800">
      <Canvas
        camera={{ position: [0, 0.5, 4], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
        <pointLight position={[-5, 5, -5]} intensity={0.5} color="#60a5fa" />
        
        <Suspense fallback={<PlaceholderRobot isTalking={isTalking} />}>
          {usePlaceholder ? (
            <PlaceholderRobot isTalking={isTalking} />
          ) : (
            <ErrorBoundaryRobot 
              isTalking={isTalking} 
              onError={() => setUsePlaceholder(true)} 
            />
          )}
        </Suspense>
        
        <ContactShadows 
          position={[0, -1.5, 0]} 
          opacity={0.4} 
          scale={5} 
          blur={2} 
        />
        <Environment preset="city" />
        <OrbitControls 
          enableZoom={false} 
          enablePan={false}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 2}
        />
      </Canvas>
    </div>
  );
}

// Error boundary wrapper for the robot model
function ErrorBoundaryRobot({ 
  isTalking, 
  onError 
}: { 
  isTalking: boolean; 
  onError: () => void;
}) {
  useEffect(() => {
    // Preload the model and catch errors
    try {
      useGLTF.preload(ROBOT_MODEL_URL);
    } catch (e) {
      console.warn('Failed to preload robot model, using placeholder');
      onError();
    }
  }, [onError]);

  return <RobotModel isTalking={isTalking} />;
}

// Preload the model
try {
  useGLTF.preload(ROBOT_MODEL_URL);
} catch (e) {
  console.warn('Robot model preload failed');
}
