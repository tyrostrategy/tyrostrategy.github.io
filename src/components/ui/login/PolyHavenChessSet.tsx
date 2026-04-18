import { useGLTF, useTexture } from "@react-three/drei";
import { useMemo, useLayoutEffect } from "react";
import * as THREE from "three";
import type { GroupProps } from "@react-three/fiber";

/**
 * PolyHavenChessSet — CC0 Staunton chess set from Poly Haven.
 *
 * - Applies navy/gold material overrides
 * - Preserves board diff texture for square pattern visibility
 * - Exposes piece Object3D map via `onReady` callback so parent
 *   orchestrator can animate individual pieces
 *
 * Source: https://polyhaven.com/a/chess_set (CC0)
 * Assets: /public/models/chess_set/*
 */

// Use Vite BASE_URL so assets resolve correctly on sub-path deployments
// (e.g., GitHub Pages serves from /tyrostrategy/).
const GLTF_URL = `${import.meta.env.BASE_URL}models/chess_set/chess_set.gltf`;
const BOARD_DIFF_URL = `${import.meta.env.BASE_URL}models/chess_set/textures/chess_set_board_diff_1k.jpg`;

export type PieceRefMap = Record<string, THREE.Object3D>;

type Props = GroupProps & {
  onReady?: (pieces: PieceRefMap, board: THREE.Object3D | null) => void;
};

/* ──────────────────────────────────────────────────────────────
 * Shader injection — vertical 3-stop gradient + thin etched rings.
 * Uses onBeforeCompile so the standard PBR pipeline (lighting,
 * clearcoat, metalness) stays intact; only the diffuse color is
 * remapped. `vPieceLocalY` name avoids clashing with three's own
 * varyings.
 * ────────────────────────────────────────────────────────────── */
function applyLuxuryShader(
  material: THREE.MeshPhysicalMaterial,
  opts: {
    baseColor: THREE.Color;
    midColor: THREE.Color;
    topColor: THREE.Color;
    ringColor: THREE.Color;
    ringStrength: number;
    yMin: number;
    yMax: number;
  },
) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uBase = { value: opts.baseColor };
    shader.uniforms.uMid = { value: opts.midColor };
    shader.uniforms.uTop = { value: opts.topColor };
    shader.uniforms.uRing = { value: opts.ringColor };
    shader.uniforms.uRingStr = { value: opts.ringStrength };
    shader.uniforms.uYMin = { value: opts.yMin };
    shader.uniforms.uYMax = { value: opts.yMax };

    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
        varying float vPieceLocalY;`,
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        vPieceLocalY = position.y;`,
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        varying float vPieceLocalY;
        uniform vec3 uBase;
        uniform vec3 uMid;
        uniform vec3 uTop;
        uniform vec3 uRing;
        uniform float uRingStr;
        uniform float uYMin;
        uniform float uYMax;`,
      )
      .replace(
        "vec4 diffuseColor = vec4( diffuse, opacity );",
        `
        float t = clamp((vPieceLocalY - uYMin) / (uYMax - uYMin), 0.0, 1.0);
        vec3 gradCol = t < 0.55
          ? mix(uBase, uMid, smoothstep(0.0, 0.55, t))
          : mix(uMid, uTop, smoothstep(0.55, 1.0, t));

        float r1 = 1.0 - smoothstep(0.0, 0.010, abs(t - 0.16));
        float r2 = 1.0 - smoothstep(0.0, 0.008, abs(t - 0.34));
        float r3 = 1.0 - smoothstep(0.0, 0.007, abs(t - 0.58));
        float ringMask = max(r1, max(r2 * 0.75, r3 * 0.6)) * uRingStr;

        vec3 finalCol = mix(gradCol, uRing, ringMask);
        vec4 diffuseColor = vec4( finalCol, opacity );`,
      );
  };
  material.needsUpdate = true;
}

export default function PolyHavenChessSet({ onReady, ...groupProps }: Props) {
  const gltf = useGLTF(GLTF_URL);
  const boardDiff = useTexture(BOARD_DIFF_URL);

  /* ── Configure board texture ── */
  useLayoutEffect(() => {
    if (!boardDiff) return;
    boardDiff.colorSpace = THREE.SRGBColorSpace;
    boardDiff.wrapS = THREE.RepeatWrapping;
    boardDiff.wrapT = THREE.RepeatWrapping;
    boardDiff.needsUpdate = true;
  }, [boardDiff]);

  /* ── Gold pieces — champagne bronze, museum-polished ── */
  const goldMaterial = useMemo(() => {
    const m = new THREE.MeshPhysicalMaterial({
      color: "#b88838",
      roughness: 0.22,
      metalness: 1.0,
      clearcoat: 0.85,
      clearcoatRoughness: 0.12,
      emissive: new THREE.Color("#5a3d0f"),
      emissiveIntensity: 0.1,
    });
    applyLuxuryShader(m, {
      baseColor: new THREE.Color("#3d2a0a"),
      midColor:  new THREE.Color("#8a6a2e"),
      topColor:  new THREE.Color("#d4b065"),
      ringColor: new THREE.Color("#0a1a38"),
      ringStrength: 0.8,
      yMin: 0.0,
      yMax: 0.1,
    });
    return m;
  }, []);

  /* ── Navy pieces — deep ink porcelain, lacquered ── */
  const navyMaterial = useMemo(() => {
    const m = new THREE.MeshPhysicalMaterial({
      color: "#132a50",
      roughness: 0.15,
      metalness: 0.08,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      ior: 1.6,
      reflectivity: 0.6,
      sheen: 0.3,
      sheenRoughness: 0.4,
      sheenColor: new THREE.Color("#3a5a8c"),
      emissive: new THREE.Color("#0a1e38"),
      emissiveIntensity: 0.08,
    });
    applyLuxuryShader(m, {
      baseColor: new THREE.Color("#050e1e"),
      midColor:  new THREE.Color("#11284a"),
      topColor:  new THREE.Color("#2b4f82"),
      ringColor: new THREE.Color("#b88838"),
      ringStrength: 0.85,
      yMin: 0.0,
      yMax: 0.1,
    });
    return m;
  }, []);

  const boardMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color("#1c3152"),   // solid navy, no squares
        roughness: 0.35,
        metalness: 0.1,
        clearcoat: 0.8,
        clearcoatRoughness: 0.12,
      }),
    [],
  );

  /* ── Traverse scene, apply materials, collect piece refs ── */
  useLayoutEffect(() => {
    if (!gltf.scene) return;

    const pieces: PieceRefMap = {};
    let board: THREE.Object3D | null = null;

    gltf.scene.traverse((obj) => {
      if (obj.name.startsWith("piece_")) {
        pieces[obj.name] = obj;
      }
      if (obj.name === "board") {
        board = obj;
      }

      if (obj instanceof THREE.Mesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;

        const mat = obj.material as THREE.Material | THREE.Material[];
        const matName = Array.isArray(mat) ? mat[0]?.name : mat?.name;

        if (matName === "chess_set_pieces_white") {
          obj.material = goldMaterial;
        } else if (matName === "chess_set_pieces_black") {
          obj.material = navyMaterial;
        } else if (matName === "chess_set_board") {
          obj.material = boardMaterial;
        }
      }
    });

    onReady?.(pieces, board);
  }, [gltf.scene, goldMaterial, navyMaterial, boardMaterial, onReady]);

  return <primitive object={gltf.scene} {...groupProps} />;
}

useGLTF.preload(GLTF_URL);
useTexture.preload(BOARD_DIFF_URL);
