import { useGLTF, useTexture } from "@react-three/drei";
import { useMemo, useEffect } from "react";
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

export default function PolyHavenChessSet({ onReady, ...groupProps }: Props) {
  const gltf = useGLTF(GLTF_URL);
  const boardDiff = useTexture(BOARD_DIFF_URL);

  /* ── Configure board texture ── */
  useEffect(() => {
    if (!boardDiff) return;
    boardDiff.colorSpace = THREE.SRGBColorSpace;
    boardDiff.wrapS = THREE.RepeatWrapping;
    boardDiff.wrapT = THREE.RepeatWrapping;
    boardDiff.needsUpdate = true;
  }, [boardDiff]);

  /* ── Memoized override materials ── */
  const goldMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#d4a24c",
        roughness: 0.28,
        metalness: 1.0,
        clearcoat: 0.4,
        clearcoatRoughness: 0.25,
        emissive: new THREE.Color("#c8922a"),
        emissiveIntensity: 0.18,
      }),
    [],
  );

  const navyMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#0f2542",
        roughness: 0.2,
        metalness: 0.08,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
        ior: 1.55,
        reflectivity: 0.55,
        sheen: 0.18,
        sheenColor: new THREE.Color("#3a5a8c"),
        emissive: new THREE.Color("#3b6ba5"),
        emissiveIntensity: 0.15,
      }),
    [],
  );

  const boardMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        map: boardDiff,
        color: new THREE.Color("#4a6a92"),
        roughness: 0.42,
        metalness: 0.3,
        clearcoat: 0.55,
        clearcoatRoughness: 0.3,
      }),
    [boardDiff],
  );

  /* ── Traverse scene, apply materials, collect piece refs ── */
  useEffect(() => {
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
