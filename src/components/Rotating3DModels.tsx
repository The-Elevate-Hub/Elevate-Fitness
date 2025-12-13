'use client';

'use client';

import { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

interface ModelProps {
  position: [number, number, number];
  rotation: number;
  isActive: boolean;
}

function DumbbellModel({ position, rotation, isActive }: ModelProps) {
  const meshRef = useRef<THREE.Group>(null);
  const gltf = useGLTF('/assets/models/3D/dumbell.glb');

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y = rotation;
      meshRef.current.scale.setScalar(isActive ? 1.2 : 1);
    }
  });

  return (
    <primitive
      ref={meshRef}
      object={gltf.scene.clone()}
      position={position}
      scale={isActive ? 1.2 : 1}
    />
  );
}

function WeightliftModel({ position, rotation, isActive }: ModelProps) {
  const meshRef = useRef<THREE.Group>(null);
  const fbx = useLoader(FBXLoader, '/assets/models/3D/weightlift-halter.fbx');

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y = rotation;
      meshRef.current.scale.setScalar(isActive ? 1.2 : 1);
    }
  });

  return (
    <primitive
      ref={meshRef}
      object={fbx.clone()}
      position={position}
      scale={isActive ? 0.012 : 0.01}
    />
  );
}

function TreadmillModel({ position, rotation, isActive }: ModelProps) {
  const meshRef = useRef<THREE.Group>(null);
  const fbx = useLoader(FBXLoader, '/assets/models/3D/treadmill.fbx');

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y = rotation;
      meshRef.current.scale.setScalar(isActive ? 1.2 : 1);
    }
  });

  return (
    <primitive
      ref={meshRef}
      object={fbx.clone()}
      position={position}
      scale={isActive ? 0.012 : 0.01}
    />
  );
}

const modelData = [
  {
    name: 'strength',
    title: 'Strength Training',
    description: 'Build lean muscle and increase your strength with our comprehensive weightlifting programs.',
    component: WeightliftModel,
  },
  {
    name: 'cardio',
    title: 'Cardio Excellence',
    description: 'Improve your cardiovascular health and endurance with science-backed cardio routines.',
    component: TreadmillModel,
  },
  {
    name: 'equipment',
    title: 'Home Workouts',
    description: 'Transform your space into a personal gym with minimal equipment and maximum results.',
    component: DumbbellModel,
  },
];

export function Rotating3DModels() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const containerHeight = rect.height;
      const viewportHeight = window.innerHeight;
      const scrollStart = rect.top;
      const scrollableDistance = containerHeight - viewportHeight;

      if (scrollStart <= 0 && scrollStart >= -scrollableDistance) {
        const progress = Math.abs(scrollStart) / scrollableDistance;
        setScrollProgress(progress);

        const newIndex = Math.floor(progress * modelData.length);
        setActiveIndex(Math.min(newIndex, modelData.length - 1));
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const radius = 4;
  const angleStep = (Math.PI * 2) / modelData.length;
  const baseRotation = scrollProgress * Math.PI * 2;

  return (
    <div ref={containerRef} className="relative h-[300vh] bg-background">
      <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
        
        <div className="relative w-full h-full max-w-7xl mx-auto px-4">
          <div className="absolute inset-0 flex items-center justify-center">
            <Canvas
              camera={{ position: [0, 2, 10], fov: 50 }}
              className="w-full h-full"
            >
              <ambientLight intensity={0.5} />
              <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />
              <spotLight position={[-10, -10, -10]} angle={0.15} penumbra={1} intensity={0.5} />
              <pointLight position={[0, 5, 0]} intensity={0.5} />

              {modelData.map((model, index) => {
                const angle = baseRotation + angleStep * index;
                const x = Math.sin(angle) * radius;
                const z = Math.cos(angle) * radius;
                const isActive = index === activeIndex;

                const ModelComponent = model.component;
                return (
                  <ModelComponent
                    key={model.name}
                    position={[x, 0, z]}
                    rotation={-angle}
                    isActive={isActive}
                  />
                );
              })}

              <OrbitControls
                enableZoom={false}
                enablePan={false}
                maxPolarAngle={Math.PI / 2}
                minPolarAngle={Math.PI / 3}
              />
            </Canvas>
          </div>

          <div className="absolute bottom-20 left-0 right-0 flex justify-center">
            <div className="glass-effect rounded-2xl p-8 max-w-2xl mx-4 text-center">
              <h3 className="text-3xl font-serif font-bold mb-4 text-accent">
                {modelData[activeIndex].title}
              </h3>
              <p className="text-lg text-muted-foreground">
                {modelData[activeIndex].description}
              </p>
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
          {modelData.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === activeIndex ? 'w-8 bg-accent' : 'w-2 bg-muted'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

useGLTF.preload('/assets/models/3D/dumbell.glb');