import { Canvas, useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useGame } from "@/game/store";

const PIP = 0.13;
/** dot layouts per face value in local face space */
const LAYOUTS: Record<number, [number, number][]> = {
  1: [[0, 0]],
  2: [
    [-0.22, -0.22],
    [0.22, 0.22],
  ],
  3: [
    [-0.24, -0.24],
    [0, 0],
    [0.24, 0.24],
  ],
  4: [
    [-0.22, -0.22],
    [0.22, -0.22],
    [-0.22, 0.22],
    [0.22, 0.22],
  ],
  5: [
    [-0.24, -0.24],
    [0.24, -0.24],
    [0, 0],
    [-0.24, 0.24],
    [0.24, 0.24],
  ],
  6: [
    [-0.24, -0.26],
    [0.24, -0.26],
    [-0.24, 0],
    [0.24, 0],
    [-0.24, 0.26],
    [0.24, 0.26],
  ],
};

function Face({ value, position, rotation }: { value: number; position: [number, number, number]; rotation: [number, number, number] }) {
  return (
    <group position={position} rotation={rotation}>
      {(LAYOUTS[value] ?? []).map(([x, y], i) => (
        <mesh key={i} position={[x, y, 0]}>
          <circleGeometry args={[PIP, 18]} />
          <meshStandardMaterial color="#1F2B5C" roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

/** rotations that bring each value to the camera-facing top */
const REST: Record<number, [number, number, number]> = {
  1: [0, 0, 0],
  2: [0, 0, Math.PI / 2],
  3: [Math.PI / 2, 0, 0],
  4: [-Math.PI / 2, 0, 0],
  5: [0, 0, -Math.PI / 2],
  6: [Math.PI, 0, 0],
};

function Cube() {
  const dice = useGame((s) => s.dice);
  const phase = useGame((s) => s.phase);
  const rollKey = useGame((s) => s.diceRollKey);
  const reduced = useGame((s) => s.settings.reducedMotion);
  const group = useRef<THREE.Group>(null);
  const spin = useRef(0);
  const rolling = phase === "rolling";
  const startedAt = useRef(0);

  useEffect(() => {
    startedAt.current = performance.now();
  }, [rollKey]);

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const d = Math.min(delta, 0.05);
    const value = dice ?? 1;
    const rest = REST[value] ?? REST[1]!;
    if (rolling && !reduced) {
      spin.current += d * 9;
      g.rotation.set(spin.current * 1.3, spin.current, spin.current * 0.7);
      g.position.y = Math.abs(Math.sin(spin.current * 1.4)) * 0.5;
    } else {
      g.rotation.x += (rest[0] - g.rotation.x) * (1 - Math.exp(-12 * d));
      g.rotation.y += (rest[1] - g.rotation.y) * (1 - Math.exp(-12 * d));
      g.rotation.z += (rest[2] - g.rotation.z) * (1 - Math.exp(-12 * d));
      const idle = reduced ? 0 : Math.sin(state.clock.elapsedTime * 2) * 0.04;
      g.position.y += (idle - g.position.y) * (1 - Math.exp(-8 * d));
      if (!reduced && phase === "idle") g.rotation.z += Math.sin(state.clock.elapsedTime * 3) * 0.002;
    }
  });

  return (
    <group ref={group}>
      <RoundedBox args={[1.5, 1.5, 1.5]} radius={0.26} smoothness={4}>
        <meshStandardMaterial color="#FFFFFF" roughness={0.22} metalness={0.02} />
      </RoundedBox>
      <Face value={1} position={[0, 0.77, 0]} rotation={[-Math.PI / 2, 0, 0]} />
      <Face value={6} position={[0, -0.77, 0]} rotation={[Math.PI / 2, 0, 0]} />
      <Face value={2} position={[0.77, 0, 0]} rotation={[0, Math.PI / 2, 0]} />
      <Face value={5} position={[-0.77, 0, 0]} rotation={[0, -Math.PI / 2, 0]} />
      <Face value={4} position={[0, 0, 0.77]} rotation={[0, 0, 0]} />
      <Face value={3} position={[0, 0, -0.77]} rotation={[0, Math.PI, 0]} />
    </group>
  );
}

export default function Dice3D() {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 2.1, 2.8], fov: 40 }}
      style={{ width: "100%", height: "100%", pointerEvents: "none" }}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.9} />
      <directionalLight position={[3, 6, 4]} intensity={1.6} />
      <directionalLight position={[-3, 2, -2]} intensity={0.4} />
      <Cube />
    </Canvas>
  );
}
