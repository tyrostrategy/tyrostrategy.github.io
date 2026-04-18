import { useMemo } from "react";
import * as THREE from "three";
import { SQUARE_SIZE, FILE_ORIGIN_X } from "./ChessMatch";

/**
 * BoardBorderFrame — polished gold rectangular frame sitting on the
 * board at the edge of the 8×8 playing area. Extruded with a bevel so
 * it catches light like a real museum inlay. Bloom picks up the
 * emissive and wraps it in a soft halo.
 */

type Props = { position?: [number, number, number] };

export default function BoardBorderFrame({ position = [0, 0, 0] }: Props) {
  const { geometry, material } = useMemo(() => {
    const half = SQUARE_SIZE / 2;
    const innerHalf = FILE_ORIGIN_X + 7 * SQUARE_SIZE + half - 0.0005;
    const outerHalf = innerHalf + 0.014;

    const shape = new THREE.Shape();
    shape.moveTo(-outerHalf, -outerHalf);
    shape.lineTo(outerHalf, -outerHalf);
    shape.lineTo(outerHalf, outerHalf);
    shape.lineTo(-outerHalf, outerHalf);
    shape.lineTo(-outerHalf, -outerHalf);

    const hole = new THREE.Path();
    hole.moveTo(-innerHalf, -innerHalf);
    hole.lineTo(innerHalf, -innerHalf);
    hole.lineTo(innerHalf, innerHalf);
    hole.lineTo(-innerHalf, innerHalf);
    hole.lineTo(-innerHalf, -innerHalf);
    shape.holes.push(hole);

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.0025,
      bevelEnabled: true,
      bevelThickness: 0.0008,
      bevelSize: 0.0006,
      bevelSegments: 2,
      curveSegments: 2,
    });
    geo.rotateX(-Math.PI / 2);

    const mat = new THREE.MeshPhysicalMaterial({
      color: "#c8922a",
      metalness: 1.0,
      roughness: 0.2,
      clearcoat: 0.7,
      clearcoatRoughness: 0.1,
      emissive: new THREE.Color("#7a5420"),
      emissiveIntensity: 0.35,
    });

    return { geometry: geo, material: mat };
  }, []);

  return <mesh geometry={geometry} material={material} position={position} />;
}
