import { Canvas } from "@react-three/fiber";
import { useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, PerspectiveCamera, RoundedBox } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import {
  BASE_ORIGIN,
  CENTRE,
  COLORS,
  COLOR_HEX,
  HOME_LANE,
  LOOP,
  STAR_LOOP_INDEXES,
  START_INDEX,
  cellOf,
  type Cell,
  type Color,
} from "@/game/board";
import { useGame } from "@/game/store";
import { HOME_STEPS } from "@/game/rules";

const TILE = 1;
/** convert a board cell (col,row) to world x/z */
function pos(cell: Cell): [number, number] {
  return [cell[0] - 7, cell[1] - 7];
}

function Tile({
  cell,
  color,
  star,
  raised = 0.02,
}: {
  cell: Cell;
  color: string;
  star?: boolean | undefined;
  raised?: number | undefined;
}) {
  const [x, z] = pos(cell);
  return (
    <group position={[x, 0.16 + raised, z]}>
      <RoundedBox args={[TILE * 0.92, 0.14, TILE * 0.92]} radius={0.05} smoothness={2}>
        <meshStandardMaterial color={color} roughness={0.35} metalness={0.02} />
      </RoundedBox>
      {star && (
        <mesh position={[0, 0.09, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.26, 5]} />
          <meshStandardMaterial color="#FFFDF3" roughness={0.4} />
        </mesh>
      )}
    </group>
  );
}

function BasePad({ color, inPlay }: { color: Color; inPlay: boolean }) {
  const origin = BASE_ORIGIN[color];
  const [x, z] = pos([origin[0] + 2.5, origin[1] + 2.5]);
  if (!inPlay) {
    // an empty corner: dim, flat and with no token slots, so it reads as "not in play"
    return (
      <group position={[x, 0.14, z]}>
        <RoundedBox args={[6, 0.1, 6]} radius={0.35} smoothness={2}>
          <meshStandardMaterial color="#E7DCC7" roughness={0.85} />
        </RoundedBox>
      </group>
    );
  }
  return (
    <group position={[x, 0.18, z]}>
      <RoundedBox args={[6, 0.22, 6]} radius={0.35} smoothness={3}>
        <meshStandardMaterial color={COLOR_HEX[color]} roughness={0.3} />
      </RoundedBox>
      <RoundedBox args={[3.6, 0.16, 3.6]} radius={0.3} smoothness={3} position={[0, 0.14, 0]}>
        <meshStandardMaterial color="#FFF7E8" roughness={0.5} opacity={0.55} transparent />
      </RoundedBox>
    </group>
  );
}

function CentreHome() {
  const [x, z] = pos(CENTRE);
  const tri = (color: Color, rot: number) => (
    <mesh key={color} position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, rot]}>
      <shapeGeometry args={[triangleShape()]} />
      <meshStandardMaterial color={COLOR_HEX[color]} roughness={0.3} />
    </mesh>
  );
  return (
    <group position={[x, 0.2, z]}>
      <RoundedBox args={[3, 0.16, 3]} radius={0.1} smoothness={2}>
        <meshStandardMaterial color="#FFF7E8" roughness={0.4} />
      </RoundedBox>
      {tri("blue", Math.PI / 2)}
      {tri("red", Math.PI)}
      {tri("green", -Math.PI / 2)}
      {tri("yellow", 0)}
    </group>
  );
}

function triangleShape() {
  const s = new THREE.Shape();
  s.moveTo(-1.4, -1.4);
  s.lineTo(1.4, -1.4);
  s.lineTo(0, 0);
  s.closePath();
  return s;
}

function Pawn({
  color,
  movable,
  reduced,
  cell,
  hopping,
  onSelect,
  label,
}: {
  color: Color;
  movable: boolean;
  reduced: boolean;
  cell: Cell;
  hopping: boolean;
  onSelect?: (() => void) | undefined;
  label: string;
}) {
  const group = useRef<THREE.Group>(null);
  const target = useMemo(() => new THREE.Vector3(cell[0] - 7, 0.3, cell[1] - 7), [cell]);
  const t = useRef(0);

  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;
    const d = Math.min(delta, 0.05);
    t.current += d;
    const dist = g.position.distanceTo(target);
    if (dist > 0.001) {
      const k = reduced ? 24 : 12;
      g.position.lerp(target, 1 - Math.exp(-k * d));
      g.position.y = target.y + (reduced ? 0 : Math.min(dist, 1) * 0.5);
    } else {
      g.position.copy(target);
      g.position.y = target.y + (movable && !reduced ? Math.abs(Math.sin(t.current * 3)) * 0.18 : 0);
    }
    const s = movable && !reduced ? 1 + Math.sin(t.current * 6) * 0.04 : 1;
    g.scale.setScalar(s);
  });

  return (
    <group ref={group} position={[cell[0] - 7, 0.3, cell[1] - 7]}>
      <group
        onClick={(e) => {
          e.stopPropagation();
          onSelect?.();
        }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {/* enlarged invisible hit area */}
        <mesh visible={false} position={[0, 0.4, 0]}>
          <boxGeometry args={[1.3, 1.6, 1.3]} />
          <meshBasicMaterial />
        </mesh>
        <mesh position={[0, 0.06, 0]}>
          <cylinderGeometry args={[0.34, 0.42, 0.12, 20]} />
          <meshStandardMaterial color={COLOR_HEX[color]} roughness={0.22} metalness={0.05} />
        </mesh>
        <mesh position={[0, 0.3, 0]}>
          <cylinderGeometry args={[0.15, 0.3, 0.42, 20]} />
          <meshStandardMaterial color={COLOR_HEX[color]} roughness={0.22} />
        </mesh>
        <mesh position={[0, 0.62, 0]}>
          <sphereGeometry args={[0.26, 24, 20]} />
          <meshStandardMaterial color={COLOR_HEX[color]} roughness={0.15} metalness={0.08} />
        </mesh>
        <mesh position={[-0.08, 0.7, 0.16]}>
          <sphereGeometry args={[0.07, 12, 12]} />
          <meshStandardMaterial color="#ffffff" roughness={0.1} />
        </mesh>
      </group>
      {movable && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.45, 0.62, 28]} />
          <meshBasicMaterial color="#FFFFFF" transparent opacity={hopping ? 0.35 : 0.85} />
        </mesh>
      )}
      <group name={label} />
    </group>
  );
}

function Scene() {
  const game = useGame((s) => s.game);
  const moves = useGame((s) => s.moves);
  const phase = useGame((s) => s.phase);
  const visual = useGame((s) => s.visual);
  const reduced = useGame((s) => s.settings.reducedMotion);
  const chooseToken = useGame((s) => s.chooseToken);

  const inPlay = useMemo(() => game?.players.map((p) => p.color) ?? COLORS, [game?.players]);

  const tiles = useMemo(() => {
    const list: { cell: Cell; color: string; star?: boolean }[] = [];
    LOOP.forEach((cell, i) => {
      const owner = COLORS.find((c) => START_INDEX[c] === i);
      list.push({
        cell,
        color: owner ? COLOR_HEX[owner] : "#FFFDF6",
        star: STAR_LOOP_INDEXES.includes(i),
      });
    });
    // home lanes only exist for colours that are actually playing
    inPlay.forEach((c) => {
      HOME_LANE[c].forEach((cell) => list.push({ cell, color: COLOR_HEX[c] }));
    });
    return list;
  }, [inPlay]);

  const movableIds = phase === "choosing" ? moves.map((m) => m.tokenId) : [];

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 17.5, 14.5]} fov={44} onUpdate={(c) => c.lookAt(0, 0, 0)} />
      <ambientLight intensity={0.75} />
      <directionalLight position={[8, 14, 8]} intensity={1.5} />
      <directionalLight position={[-8, 8, -4]} intensity={0.5} color="#8FD3FF" />
      <Environment>
        <Lightformer intensity={1.6} position={[0, 8, 3]} scale={[14, 10, 1]} />
        <Lightformer intensity={0.8} color="#FFE1A8" position={[-6, 4, -4]} scale={[10, 6, 1]} />
      </Environment>

      {/* wooden tray */}
      <group position={[0, -0.1, 0]}>
        <RoundedBox args={[17.4, 0.9, 17.4]} radius={0.6} smoothness={4} position={[0, -0.45, 0]}>
          <meshStandardMaterial color="#D39A5B" roughness={0.6} />
        </RoundedBox>
        <RoundedBox args={[15.6, 0.4, 15.6]} radius={0.3} smoothness={3} position={[0, -0.1, 0]}>
          <meshStandardMaterial color="#FFF7E8" roughness={0.5} />
        </RoundedBox>
      </group>

      {COLORS.map((c) => (
        <BasePad key={c} color={c} inPlay={inPlay.includes(c)} />
      ))}
      {tiles.map((t, i) => (
        <Tile key={i} cell={t.cell} color={t.color} star={t.star} />
      ))}
      <CentreHome />

      {game?.players.flatMap((p) =>
        p.tokens.map((token) => {
          const steps = visual[token.id] ?? token.steps;
          const homeOffset = steps >= HOME_STEPS ? token.slot : 0;
          const cell = cellOf(token.color, steps, token.slot);
          const shifted: Cell = [
            cell[0] + (steps >= HOME_STEPS ? (homeOffset % 2 ? 0.5 : -0.5) : 0),
            cell[1] + (steps >= HOME_STEPS ? (homeOffset > 1 ? 0.5 : -0.5) : 0),
          ];
          const movable = movableIds.includes(token.id);
          return (
            <Pawn
              key={token.id}
              color={token.color}
              cell={shifted}
              movable={movable}
              reduced={reduced}
              hopping={visual[token.id] != null}
              label={token.id}
              onSelect={movable ? () => chooseToken(token.id) : undefined}
            />
          );
        }),
      )}

      <ContactShadows position={[0, 0.32, 0]} opacity={0.28} scale={20} blur={2.4} far={4} />
    </>
  );
}

export default function Board3D() {
  return (
    <Canvas
      dpr={[1, 2]}
      shadows={false}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      aria-label="Ludo board"
      role="img"
      style={{ width: "100%", height: "100%", touchAction: "manipulation" }}
    >
      <Scene />
    </Canvas>
  );
}
