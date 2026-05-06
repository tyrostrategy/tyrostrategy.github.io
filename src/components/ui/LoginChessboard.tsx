import { useRef, useMemo, useEffect, useState, useCallback, Suspense, type ReactNode } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette, N8AO } from "@react-three/postprocessing";
import * as THREE from "three";
import { Target, BarChart3, Network, CalendarClock, Shield } from "lucide-react";
import PolyHavenChessSet, { type PieceRefMap } from "./login/PolyHavenChessSet";
import BoardGrid from "./login/BoardGrid";
import KingHero from "./login/KingHero";
import PieceScatter from "./login/PieceScatter";
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

// Scene accepts an extra internal callback that bubbles up when the
// chess set finishes loading — LoginChessboard uses it to gate the
// post-processing pipeline so heavy shader compile doesn't overlap
// with GLTF parse/upload.
type SceneProps = Props & { onSceneReady?: () => void };

/* ═══════════════════════════════════════════════════════════════════
 * SUSPENSE FALLBACK — low-fi placeholder while the chess set streams.
 * Replaces the previous `fallback={null}` which gave users an empty
 * canvas during the first ~1-2s of load.
 * ═══════════════════════════════════════════════════════════════════ */
function SceneFallback() {
  return (
    <>
      <ambientLight intensity={0.35} />
      <hemisphereLight args={["#fff5e0", "#0a1628", 0.32]} />
      <mesh rotation-x={-Math.PI / 2} position={[0.14, 0, 0]} receiveShadow>
        <planeGeometry args={[0.42, 0.42]} />
        <meshStandardMaterial color="#14253f" roughness={0.85} metalness={0.15} />
      </mesh>
    </>
  );
}

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
function Scene({ t, phase, onPortalClick, onFeatureArchive, onSceneReady }: SceneProps) {
  const { scene } = useThree();
  const [pieces, setPieces] = useState<PieceRefMap>({});
  const [portalVisible, setPortalVisible] = useState(false);
  const [activeCard, setActiveCard] = useState<ActiveFeatureCard | null>(null);
  const cardTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Board material ref + ripple state — for piece-move ripple effect
  const boardMatRef = useRef<THREE.MeshPhysicalMaterial | null>(null);
  const gridMatRef = useRef<THREE.ShaderMaterial | null>(null);
  const rippleStateRef = useRef<{
    x: number;
    z: number;
    start: number;
    color: THREE.Color;
  } | null>(null);
  const RIPPLE_DURATION_MS = 1400;
  // Ripple tint matches the moving piece's material palette
  const RIPPLE_GOLD = useMemo(() => new THREE.Color("#e0ad3e"), []);
  const RIPPLE_NAVY = useMemo(() => new THREE.Color("#5a82c8"), []);

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

  const handlePiecesReady = useCallback((p: PieceRefMap, board: THREE.Object3D | null) => {
    setPieces(p);
    if (board && (board as THREE.Mesh).material) {
      boardMatRef.current = (board as THREE.Mesh).material as THREE.MeshPhysicalMaterial;
    }
    // Signal upward so the post-processing pipeline can now mount
    // without stealing shader-compile time from first GLTF paint.
    onSceneReady?.();
  }, [onSceneReady]);

  const handleGridReady = useCallback((mat: THREE.ShaderMaterial) => {
    gridMatRef.current = mat;
  }, []);

  // Frame loop — drive shader uniforms for BOTH board material and grid
  // material: breathing glow (always) + ripple (on move). Keeps the two
  // surfaces visually synchronized.
  useFrame((s) => {
    const mat = boardMatRef.current;
    const gridMat = gridMatRef.current;
    const ud = mat?.userData?.shader;
    const now = s.clock.elapsedTime;

    // Always: uTime for breathing
    if (ud) ud.uniforms.uTime.value = now;
    if (gridMat) gridMat.uniforms.uTime.value = now;

    // Ripple — only while a move is active
    const state = rippleStateRef.current;
    if (!state) {
      if (ud && ud.uniforms.uRippleTime.value < 1.1) ud.uniforms.uRippleTime.value = 1.1;
      if (gridMat && gridMat.uniforms.uRippleTime.value < 1.1) gridMat.uniforms.uRippleTime.value = 1.1;
      return;
    }
    const t = (performance.now() - state.start) / RIPPLE_DURATION_MS;
    if (t >= 1) {
      rippleStateRef.current = null;
      if (ud) ud.uniforms.uRippleTime.value = 1.1;
      if (gridMat) gridMat.uniforms.uRippleTime.value = 1.1;
      return;
    }
    if (ud) {
      ud.uniforms.uRippleOrigin.value.set(state.x, state.z);
      ud.uniforms.uRippleTime.value = t;
      ud.uniforms.uRippleColor.value.copy(state.color);
    }
    if (gridMat) {
      gridMat.uniforms.uRippleOrigin.value.set(state.x, state.z);
      gridMat.uniforms.uRippleTime.value = t;
      // Grid flashes crystal-white regardless of piece team — ripple color
      // on grid stays fixed as the shimmer tint (board material keeps team color)
    }
  });

  const handlePortalReveal = useCallback(() => {
    setPortalVisible(true);
  }, []);

  const handleMoveComplete = useCallback(
    (move: Move, worldPos: [number, number, number]) => {
      // Trigger a ripple emanating from the landed piece — fires for every
      // move regardless of whether there's a feature card attached.
      // Color matches the piece's material palette (gold for white, navy for black).
      const isWhite = move.pieceName.includes("white");
      rippleStateRef.current = {
        x: worldPos[0],
        z: worldPos[2],
        start: performance.now(),
        color: isWhite ? RIPPLE_GOLD : RIPPLE_NAVY,
      };

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

      {/* Chess set + hero kings — share the single outer Suspense
          boundary (in LoginChessboard) so the scene reveals atomically
          instead of piece-by-piece as each sub-resource resolves. */}
      <PolyHavenChessSet position={[0.14, 0, 0]} onReady={handlePiecesReady} />

      {/* Detailed hero kings — one per team. Replace PH kings during
          match, charge to center at checkmate, gold takes hero shot at
          p5+ while navy recedes. Mounted at world root; positions driven
          in useFrame via getWorldPosition of the PH king pieces. */}
      <KingHero team="white" pieces={pieces} phase={phase} />
      <KingHero team="black" pieces={pieces} phase={phase} />

      {/* Piece scatter — at p4 (king arrives center) all non-king pieces
          explode outward with gravity + tumble as a shockwave */}
      <PieceScatter pieces={pieces} phase={phase} />

      {/* Gold polished inlay frame around the playing area */}
      <BoardBorderFrame position={[0.14, 0.018, 0]} />

      {/* Gold glow grid lines on the board */}
      <BoardGrid position={[0.14, 0.0176, 0]} onReady={handleGridReady} />

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

/** Düşük güçlü cihaz tespiti — postprocessing pipeline'ını atla.
 *  N8AO + Bloom + Vignette toplamda ~150 KB JS + büyük GPU shader compile
 *  maliyeti. Düşük cihazda scene zaten zorlanırken bu pipeline tarayıcıyı
 *  kilitliyor.
 *  Kriterler:
 *    - prefers-reduced-motion: accessibility tercihi
 *    - deviceMemory < 4: 4GB altı RAM
 *    - hardwareConcurrency < 4: 4 çekirdek altı
 *  Server-side render (typeof window === "undefined") da true.
 */
function shouldSkipPostprocessing(): boolean {
  if (typeof window === "undefined") return true;
  try {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return true;
    const nav = navigator as Navigator & { deviceMemory?: number };
    if (typeof nav.deviceMemory === "number" && nav.deviceMemory < 4) return true;
    if (typeof navigator.hardwareConcurrency === "number" && navigator.hardwareConcurrency < 4) return true;
  } catch { /* defensive — feature detection errors → render full pipeline */ }
  return false;
}

export default function LoginChessboard({ t, phase, onPortalClick, onFeatureArchive }: Props) {
  // Defer the post-processing pipeline (N8AO + Bloom + Vignette) until
  // the chess set has parsed and uploaded its textures. Shader compile
  // for those effects is expensive; overlapping it with the first GLTF
  // paint is what made the scene appear "in pieces" on cold load.
  const [sceneReady, setSceneReady] = useState(false);
  const skipPost = useMemo(shouldSkipPostprocessing, []);

  return (
    <Canvas
      camera={{ position: [0.28, 0.34, 0.52], fov: 42 }}
      // dpr cap 1.5 (eskiden 1.6) — yüksek-DPI ekranda %20 fewer pixel
      // hesabı, görsel olarak fark edilmez ama hafif cihazda fps'i
      // canlandırır. SSR / 1×: 1.
      dpr={[1, 1.5]}
      gl={{ alpha: true, antialias: true }}
      shadows
      style={{ width: "100%", height: "100%" }}
    >
      <Suspense fallback={<SceneFallback />}>
        <Scene
          t={t}
          phase={phase}
          onPortalClick={onPortalClick}
          onFeatureArchive={onFeatureArchive}
          onSceneReady={() => setSceneReady(true)}
        />
      </Suspense>
      {sceneReady && !skipPost && (
        <EffectComposer multisampling={4}>
          <N8AO aoRadius={0.08} intensity={1.5} distanceFalloff={0.2} />
          <Bloom mipmapBlur intensity={0.32} luminanceThreshold={0.82} luminanceSmoothing={0.3} />
          <Vignette offset={0.3} darkness={0.55} />
        </EffectComposer>
      )}
    </Canvas>
  );
}
