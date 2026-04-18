import { useMemo } from "react";
import * as THREE from "three";
import { SQUARE_SIZE, FILE_ORIGIN_X, RANK_ORIGIN_Z_WHITE } from "./ChessMatch";

/**
 * BoardGrid — 9 horizontal + 9 vertical gold glow lines on the board.
 * Pure LineSegments + bright gold + toneMapped=false lets the Bloom
 * pass wrap each line in a soft halo.
 */

type Props = { position?: [number, number, number] };

export default function BoardGrid({ position = [0, 0, 0] }: Props) {
  const geometry = useMemo(() => {
    const half = SQUARE_SIZE / 2;
    const min = FILE_ORIGIN_X - half;
    const max = FILE_ORIGIN_X + 7 * SQUARE_SIZE + half;
    const zMin = RANK_ORIGIN_Z_WHITE - half;
    const zMax = RANK_ORIGIN_Z_WHITE + 7 * SQUARE_SIZE + half;

    const verts: number[] = [];
    for (let i = 0; i <= 8; i++) {
      const t = min + i * SQUARE_SIZE;
      verts.push(min, 0, t, max, 0, t);
      verts.push(t, 0, zMin, t, 0, zMax);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
    return g;
  }, []);

  return (
    // @ts-expect-error three primitive
    <lineSegments geometry={geometry} position={position}>
      <lineBasicMaterial
        color="#f0c95e"
        transparent
        opacity={0.95}
        toneMapped={false}
        polygonOffset
        polygonOffsetFactor={-2}
        polygonOffsetUnits={-2}
      />
    </lineSegments>
  );
}
