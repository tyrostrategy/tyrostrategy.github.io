import { useRef, useMemo, useEffect, useState, useCallback, Suspense, type ReactNode } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette, N8AO } from "@react-three/postprocessing";
import * as THREE from "three";
import { Target, BarChart3, Network, CalendarClock, Shield } from "lucide-react";
import PolyHavenChessSet, { type PieceRefMap } from "./login/PolyHavenChessSet";
import BoardGrid from "./login/BoardGrid";
import BoardBorderFrame from "./login/BoardBorderFrame";
import MatchOrchestrator from "./login/MatchOrchestrator";
import ScenePortalButton from "./login/ScenePortalButton";
import MoveFeatureCard, { type ActiveFeatureCard } from "./login/MoveFeatureCard";
import MeteorShower from "./login/MeteorShower";
import StarField from "./login/StarField";
import type { FeatureIconId, Move } from "./login/ChessMatch";
import type { IntroPhase } from "./login/introPhases";

declare global {
  interface Window {
    _tyroLoginAnim?: boolean;
    _tyroLoginStart?: number;
  }
}

type Mode = "idle" | "match" | "checkmate";

type Props = {
  t: (key: string) => string;
  phase: IntroPhase;
  onPortalClick: () => void;
  onFeatureArchive?: (card: ActiveFeatureCard) => void;
};

/* ═══════════════════════════════════════════════════════════════════
 * FEATURE ICONS (used by move feature cards)
 * ═══════════════════════════════════════════════════════════════════ */
function featureIcon(id: FeatureIconId): ReactNode {
  const size = 16;
  switch (id) {
    case "target": return <Target size={size} />;
    case "chart": return <BarChart3 size={size} />;
    case "network": return <Network size={size} />;
    case "clock": return <CalendarClock size={size} />;
    case "shield": return <Shield size={size} />;
  }
}

/* ═══════════════════════════════════════════════════════════════════
 * GOLD DUST
 * ═══════════════════════════════════════════════════════════════════ */
function GoldDust() {
  const pointsRef = useRef<THREE.Points>(null);
  const COUNT = 80;
  const positions = useMemo(() => {
    const arr = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 1.0;
      arr[i * 3 + 1] = Math.random() * 0.5 + 0.05;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 1.0;
    }
    return arr;
  }, []);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    const attr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    for (let i = 0; i < COUNT; i++) {
      arr[i * 3 + 1] -= delta * 0.008;
      if (arr[i * 3 + 1] < -0.02) {
        arr[i * 3 + 1] = 0.55;
        arr[i * 3] = (Math.random() - 0.5) * 1.0;
        arr[i * 3 + 2] = (Math.random() - 0.5) * 1.0;
      }
    }
    attr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} count={COUNT} />
      </bufferGeometry>
      <pointsMaterial
        size={0.004}
        color="#c8922a"
        transparent
        opacity={0.55}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

/* ═══════════════════════════════════════════════════════════════════
 * CAMERA CONTROLLER
 * ═══════════════════════════════════════════════════════════════════ */
function CameraController() {
  const { camera } = useThree();
  const basePos = useMemo(() => new THREE.Vector3(0.28, 0.34, 0.52), []);
  const zoomEnd = useMemo(() => new THREE.Vector3(0.18, 0.26, 0.36), []);
  const diveTarget = useMemo(() => new THREE.Vector3(0.08, 0.05, 0.18), []);
  const lookAtBase = useMemo(() => new THREE.Vector3(0.05, 0.04, 0), []);
  const lookAtDive = useMemo(() => new THREE.Vector3(0.05, -0.02, 0), []);
  const currentLookAt = useMemo(() => new THREE.Vector3().copy(lookAtBase), [lookAtBase]);
  // Reusable temp vector for zoom-end calculation
  const tempZoomPos = useMemo(() => new THREE.Vector3(), []);

  const mouseX = useRef(0);
  const mouseY = useRef(0);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouseX.current = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY.current = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  useFrame(() => {
    if (window._tyroLoginAnim && window._tyroLoginStart) {
      const elapsed = (performance.now() - window._tyroLoginStart) / 1000;

      // Phase 2 — dive. Start from the ZOOM-END position so there's no cut
      // between the end of zoom (elapsed 2.1) and the start of dive (2.2).
      if (elapsed >= 2.2) {
        const zoomEasedAtEnd = 0.6; // zoom reaches 60% of the way from basePos → zoomEnd at t=1
        tempZoomPos.copy(basePos).lerp(zoomEnd, zoomEasedAtEnd);
        const t = Math.min((elapsed - 2.2) / 1.3, 1);         // longer dive: 0.9s → 1.3s
        const eased = t * t * (3 - 2 * t);                     // smoothstep (smoother than cubic-in)
        camera.position.lerpVectors(tempZoomPos, diveTarget, eased);
        currentLookAt.lerpVectors(lookAtBase, lookAtDive, eased);
        camera.lookAt(currentLookAt);
        return;
      }

      // Phase 1 — gentle zoom toward board
      if (elapsed >= 0.4) {
        const t = Math.min((elapsed - 0.4) / 1.8, 1);
        const eased = t * t * (3 - 2 * t);
        tempZoomPos.copy(basePos).lerp(zoomEnd, eased * 0.6);
        camera.position.copy(tempZoomPos);
        camera.lookAt(lookAtBase);
        return;
      }

      camera.position.copy(basePos);
      camera.lookAt(lookAtBase);
      return;
    }

    const targetX = basePos.x + mouseX.current * 0.025;
    const targetY = basePos.y - mouseY.current * 0.018;
    camera.position.x += (targetX - camera.position.x) * 0.04;
    camera.position.y += (targetY - camera.position.y) * 0.04;
    camera.position.z += (basePos.z - camera.position.z) * 0.04;
    camera.lookAt(lookAtBase);
  });

  return null;
}

/* ═══════════════════════════════════════════════════════════════════
 * SCENE
 * ═══════════════════════════════════════════════════════════════════ */
function Scene({ t, phase, onPortalClick, onFeatureArchive }: Props) {
  const { scene } = useThree();
  const [pieces, setPieces] = useState<PieceRefMap>({});
  const [portalVisible, setPortalVisible] = useState(false);
  const [activeCard, setActiveCard] = useState<ActiveFeatureCard | null>(null);
  const cardTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Mode derivation from phase
  const mode: Mode = useMemo(() => {
    if (phase === "idle") return "match";
    if (phase === "p1" || phase === "p2" || phase === "p2b") return "checkmate";
    return "idle";
  }, [phase]);

  useEffect(() => {
    scene.fog = new THREE.Fog("#0a1628", 1.5, 4.5);
    return () => {
      scene.fog = null;
    };
  }, [scene]);

  const handlePiecesReady = useCallback((p: PieceRefMap) => {
    setPieces(p);
  }, []);

  const handlePortalReveal = useCallback(() => {
    setPortalVisible(true);
  }, []);

  const handleMoveComplete = useCallback(
    (move: Move, worldPos: [number, number, number]) => {
      if (!move.feature) return;
      if (cardTimeoutRef.current) clearTimeout(cardTimeoutRef.current);
      setActiveCard((prev) => {
        // Archive the previous card before replacing it
        if (prev) onFeatureArchive?.(prev);
        return {
          id: move.id,
          worldPos,
          icon: featureIcon(move.feature!.iconId),
          title: t(`${move.feature!.i18nKey}.title`),
          desc: t(`${move.feature!.i18nKey}.desc`),
        };
      });
      cardTimeoutRef.current = setTimeout(() => {
        // When the card times out on its own, archive it too so the last
        // card in the match always lands in the history panel.
        setActiveCard((prev) => {
          if (prev) onFeatureArchive?.(prev);
          return null;
        });
      }, 2800);
    },
    [t, onFeatureArchive],
  );

  useEffect(() => {
    return () => {
      if (cardTimeoutRef.current) clearTimeout(cardTimeoutRef.current);
    };
  }, []);

  // Hide card + portal during intro
  useEffect(() => {
    if (phase !== "idle") {
      setActiveCard(null);
    }
  }, [phase]);

  return (
    <>
      {/* Lighting */}
      <hemisphereLight args={["#fff5e0", "#0a1628", 0.4]} />
      <ambientLight intensity={0.22} />
      <directionalLight
        position={[0.6, 1.2, 0.4]}
        intensity={1.6}
        color="#fff5e0"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0001}
      />
      <directionalLight position={[-0.4, 0.3, -0.5]} intensity={0.55} color="#4a7ab0" />
      <directionalLight position={[0.3, 0.15, -0.7]} intensity={0.35} color="#c8daec" />
      <pointLight position={[0, 0.5, 0.3]} intensity={0.65} color="#c8922a" distance={1} />
      <pointLight position={[0.1, 0.35, -0.3]} intensity={0.4} color="#3b6ba5" distance={0.8} />

      {/* Chess set — offset right to leave room for left brand overlays */}
      <Suspense fallback={null}>
        <PolyHavenChessSet position={[0.14, 0, 0]} onReady={handlePiecesReady} />
      </Suspense>

      {/* Gold polished inlay frame around the playing area */}
      <BoardBorderFrame position={[0.14, 0.018, 0]} />

      {/* Gold glow grid lines on the board */}
      <BoardGrid position={[0.14, 0.0176, 0]} />

      {/* Match orchestrator */}
      <MatchOrchestrator
        pieces={pieces}
        mode={mode}
        onPortalReveal={handlePortalReveal}
        onMoveComplete={handleMoveComplete}
      />

      {/* Scene-anchored portal button (at board center, shifted with board) */}
      <ScenePortalButton
        visible={portalVisible}
        phase={phase}
        onClick={onPortalClick}
        worldPosition={[0.14, 0.08, 0]}
      />

      {/* Feature card overlay above active piece */}
      <MoveFeatureCard card={activeCard} />

      {/* Ambient starfield + meteor shower (both deep background) */}
      <StarField />
      <MeteorShower />

      {/* Contact shadow */}
      <ContactShadows
        position={[0.05, 0.001, 0]}
        opacity={0.5}
        scale={0.6}
        blur={2.2}
        far={0.18}
        resolution={1024}
        color="#000814"
        frames={1}
      />

      <CameraController />
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════
 * EXPORT
 * ═══════════════════════════════════════════════════════════════════ */
export default function LoginChessboard({ t, phase, onPortalClick, onFeatureArchive }: Props) {
  return (
    <Canvas
      camera={{ position: [0.28, 0.34, 0.52], fov: 42 }}
      dpr={[1, 1.6]}
      gl={{ alpha: true, antialias: true }}
      shadows
      style={{ width: "100%", height: "100%" }}
    >
      <Suspense fallback={null}>
        <Scene t={t} phase={phase} onPortalClick={onPortalClick} onFeatureArchive={onFeatureArchive} />
        <EffectComposer multisampling={4}>
          <N8AO aoRadius={0.08} intensity={1.5} distanceFalloff={0.2} />
          <Bloom mipmapBlur intensity={0.32} luminanceThreshold={0.82} luminanceSmoothing={0.3} />
          <Vignette offset={0.3} darkness={0.55} />
        </EffectComposer>
      </Suspense>
    </Canvas>
  );
}
