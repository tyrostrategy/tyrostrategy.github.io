import { Stars } from "@react-three/drei";

/**
 * StarField — drei's Stars wraps the scene in a spherical shell of
 * randomly-placed points. Combined with sizeAttenuation and the
 * procedural shader, it gives a rich "stardom" sky regardless of
 * camera position or frustum.
 */

export default function StarField() {
  return (
    <>
      {/* Dim far layer — dense background dust */}
      <Stars
        radius={4}
        depth={3}
        count={900}
        factor={0.08}
        saturation={0}
        fade
        speed={0.3}
      />
      {/* Bright accent layer — fewer, larger warm stars */}
      <Stars
        radius={2.5}
        depth={1.5}
        count={180}
        factor={0.16}
        saturation={0}
        fade
        speed={0.2}
      />
    </>
  );
}
