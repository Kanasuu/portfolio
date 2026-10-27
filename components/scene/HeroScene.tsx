"use client";

import { Float, Html, Sparkles } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useReducedMotion } from "framer-motion";
import { useMemo, useRef, useState } from "react";
import type { Mesh } from "three";
import { projects } from "@/data/content";
import { accentClasses } from "@/lib/accent";
import { pointer } from "@/lib/pointer";
import { openProject } from "@/lib/projectEvents";

/** Eases the camera toward the cursor for gentle depth parallax. */
function CameraRig({ still }: { still: boolean }) {
  useFrame(({ camera }, delta) => {
    if (still) return;
    const k = 1 - Math.pow(0.04, delta);
    camera.position.x += (pointer.x * 0.7 - camera.position.x) * k;
    camera.position.y += (-pointer.y * 0.45 - camera.position.y) * k;
    camera.lookAt(0, 0, 0);
  });
  return null;
}

function Island({ position, scale = 1, top = "#bfe9d8" }: { position: [number, number, number]; scale?: number; top?: string }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry args={[1, 0.92, 0.24, 40]} />
        <meshStandardMaterial color={top} roughness={0.85} />
      </mesh>
      <mesh position={[0, -0.62, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.92, 1.3, 7, 1]} />
        <meshStandardMaterial color="#d9c9f6" roughness={0.9} flatShading />
      </mesh>
      {[
        [0.38, 0.38, 0.1, 0.26],
        [-0.3, 0.34, -0.25, 0.2],
        [0.05, 0.33, 0.45, 0.16],
      ].map(([x, y, z, r]) => (
        <mesh key={`${x}${z}`} position={[x, y, z]}>
          <sphereGeometry args={[r, 20, 16]} />
          <meshStandardMaterial color="#f7c4d6" roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
}

function Cloud({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      {[
        [0, 0, 0, 0.55],
        [0.55, -0.08, 0, 0.42],
        [-0.55, -0.1, 0.05, 0.4],
        [0.25, 0.25, -0.1, 0.4],
        [-0.2, 0.2, 0.1, 0.36],
      ].map(([x, y, z, r]) => (
        <mesh key={`${x}${y}`} position={[x, y, z]}>
          <sphereGeometry args={[r, 24, 18]} />
          <meshStandardMaterial color="#ffffff" roughness={1} transparent opacity={0.92} />
        </mesh>
      ))}
    </group>
  );
}

function Bubble({ position, radius, color }: { position: [number, number, number]; radius: number; color: string }) {
  return (
    <mesh position={position}>
      <sphereGeometry args={[radius, 40, 32]} />
      <meshPhysicalMaterial
        color={color}
        transparent
        opacity={0.38}
        roughness={0.08}
        clearcoat={1}
        iridescence={1}
        iridescenceIOR={1.3}
      />
    </mesh>
  );
}

function ProjectGem({
  id,
  name,
  color,
  position,
  scale,
  still,
}: {
  id: string;
  name: string;
  color: string;
  position: [number, number, number];
  scale: number;
  still: boolean;
}) {
  const mesh = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((_, delta) => {
    const m = mesh.current;
    if (!m) return;
    if (!still) m.rotation.y += delta * (hovered ? 1.6 : 0.45);
    const target = hovered ? 1.3 : 1;
    m.scale.setScalar(m.scale.x + (target - m.scale.x) * Math.min(1, delta * 10));
  });

  return (
    <group
      position={position}
      scale={scale}
      onClick={(e) => {
        e.stopPropagation();
        openProject(id);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = "";
      }}
    >
      <mesh ref={mesh}>
        <octahedronGeometry args={[0.42, 0]} />
        <meshPhysicalMaterial
          color={color}
          roughness={0.12}
          metalness={0.05}
          clearcoat={1}
          emissive={color}
          emissiveIntensity={hovered ? 0.45 : 0.15}
          flatShading
        />
      </mesh>
      {/* Larger invisible hit area so gems are easy to tap on touch screens. */}
      <mesh visible={false}>
        <sphereGeometry args={[0.7, 8, 8]} />
      </mesh>
      <Html center position={[0, 0.85, 0]} style={{ pointerEvents: "none" }} zIndexRange={[20, 0]}>
        <div
          className={`glass whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold text-ink transition-all duration-300 ${
            hovered ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
          }`}
        >
          {name} →
        </div>
      </Html>
    </group>
  );
}

/** Float, or a plain group when the visitor prefers reduced motion. */
function Drift({ still, children, ...props }: React.ComponentProps<typeof Float> & { still: boolean }) {
  return still ? <group>{children}</group> : <Float {...props}>{children}</Float>;
}

function World({ still }: { still: boolean }) {
  const { viewport } = useThree();
  const w = viewport.width;
  const h = viewport.height;
  const narrow = w < 7;
  // Decorations are sized in world units, so shrink them on narrow screens to keep text clear.
  const k = narrow ? 0.55 : 1;

  const gems = useMemo(() => {
    // Positions as fractions of the visible area, kept clear of the headline and the character.
    const spots: [number, number][] = narrow
      ? [[0.3, 0.1], [-0.4, -0.12], [0.4, -0.14], [0.35, -0.44]]
      : [[-0.02, 0.27], [0.04, -0.36], [0.44, 0.34], [0.45, -0.3]];
    return projects
      .filter((p) => p.featured)
      .map((p, i) => ({
        id: p.id,
        name: p.name,
        color: accentClasses[p.accent].hex,
        position: [spots[i][0] * w, spots[i][1] * h, 0.4] as [number, number, number],
      }));
  }, [narrow, w, h]);

  return (
    <group>
      <Drift still={still} speed={1.1} floatIntensity={0.6} rotationIntensity={0.15}>
        <Island position={[-0.5 * w, -0.36 * h, -3]} scale={1.3 * k} />
      </Drift>
      <Drift still={still} speed={0.9} floatIntensity={0.7} rotationIntensity={0.2}>
        <Island position={[0.2 * w, 0.32 * h, -6]} scale={0.9 * k} top="#f9d6e2" />
      </Drift>
      <Drift still={still} speed={1.3} floatIntensity={0.5} rotationIntensity={0.2}>
        <Island position={[-0.18 * w, 0.42 * h, -8]} scale={0.6 * k} top="#e3dafb" />
      </Drift>

      <Drift still={still} speed={0.6} floatIntensity={0.4} rotationIntensity={0}>
        <Cloud position={[-0.36 * w, 0.3 * h, -4]} scale={1.1 * k} />
      </Drift>
      <Drift still={still} speed={0.5} floatIntensity={0.4} rotationIntensity={0}>
        <Cloud position={[0.42 * w, 0.05 * h, -7]} scale={1.5 * k} />
      </Drift>
      <Drift still={still} speed={0.7} floatIntensity={0.3} rotationIntensity={0}>
        <Cloud position={[0.05 * w, -0.4 * h, -5]} scale={0.9 * k} />
      </Drift>

      <Drift still={still} speed={1.6} floatIntensity={1.2} rotationIntensity={0}>
        <Bubble position={[-0.3 * w, 0.36 * h, -2]} radius={0.35 * k} color="#f4b9cf" />
      </Drift>
      <Drift still={still} speed={1.2} floatIntensity={1} rotationIntensity={0}>
        <Bubble position={[0.3 * w, -0.42 * h, -1.5]} radius={0.5 * k} color="#c9b8f4" />
      </Drift>
      <Drift still={still} speed={1.4} floatIntensity={1.1} rotationIntensity={0}>
        <Bubble position={[-0.44 * w, 0.12 * h, -1]} radius={0.25 * k} color="#b6e8d6" />
      </Drift>

      {gems.map((g) => (
        <Drift still={still} key={g.id} speed={1.8} floatIntensity={0.8} rotationIntensity={0.3}>
          <ProjectGem {...g} scale={narrow ? 0.6 : 1} still={still} />
        </Drift>
      ))}

      <Sparkles count={narrow ? 40 : 80} scale={[w * 1.2, h * 1.2, 6]} size={3.2} speed={still ? 0 : 0.35} color="#ffffff" opacity={0.9} />
    </group>
  );
}

export default function HeroScene({ active }: { active: boolean }) {
  const reduce = useReducedMotion() ?? false;

  return (
    <Canvas
      aria-hidden
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, 10], fov: 42 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      frameloop={!active ? "never" : reduce ? "demand" : "always"}
      style={{ position: "absolute", inset: 0 }}
    >
      <fog attach="fog" args={["#efe6fd", 9, 22]} />
      <ambientLight intensity={0.85} />
      <hemisphereLight args={["#fff1f7", "#d7f3e8", 0.9]} />
      <directionalLight position={[5, 6, 4]} intensity={1.4} color="#fff3f8" />
      <pointLight position={[-6, -2, 3]} intensity={18} color="#c9b8f4" />
      <CameraRig still={reduce} />
      <World still={reduce} />
    </Canvas>
  );
}
