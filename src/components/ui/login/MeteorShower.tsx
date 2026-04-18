import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * MeteorShower — cinematic shooting stars. Warm white-gold head with a
 * fading trail, staggered across the deep background. Robust spawn
 * logic: during pre-birth / dying frames the segment collapses onto a
 * single point so nothing ever shows as a static dark streak.
 */

const METEOR_COUNT = 16;

type Meteor = {
  headPos: THREE.Vector3;
  dir: THREE.Vector3;
  speed: number;
  trailLen: number;
  lifetime: number;
  age: number;
  hueShift: number; // 0..1 — picks warm white → gold variation
};

function makeMeteor(initial = false): Meteor {
  // Enter from a wide band up and to the right
  const startX = 0.6 + Math.random() * 1.8;
  const startY = 0.8 + Math.random() * 0.9;
  const startZ = -1.3 - Math.random() * 1.0;

  // Diagonal sweep down-left with slight z jitter
  const dir = new THREE.Vector3(
    -0.55 - Math.random() * 0.35,
    -0.65 - Math.random() * 0.3,
    (Math.random() - 0.5) * 0.12,
  ).normalize();

  return {
    headPos: new THREE.Vector3(startX, startY, startZ),
    dir,
    speed: 0.32 + Math.random() * 0.5,
    trailLen: 0.18 + Math.random() * 0.28,
    lifetime: 1.6 + Math.random() * 1.4,
    // Initial meteors get a random age offset so they don't all spawn
    // simultaneously; later respawns start with small pre-birth delay.
    age: initial ? Math.random() * 2.5 - 1.8 : -0.15 - Math.random() * 1.2,
    hueShift: Math.random(),
  };
}

export default function MeteorShower() {
  const meteorsRef = useRef<Meteor[]>([]);

  const { geometry, positions, colors } = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(METEOR_COUNT * 2 * 3);
    const col = new Float32Array(METEOR_COUNT * 2 * 3);
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, -1.8), 10);
    geo.computeBoundingSphere = () => {};
    return { geometry: geo, positions: pos, colors: col };
  }, []);

  const material = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 1,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        fog: false,
      }),
    [],
  );

  useEffect(() => {
    meteorsRef.current = Array.from({ length: METEOR_COUNT }, () => makeMeteor(true));
  }, []);

  useFrame((_, delta) => {
    const meteors = meteorsRef.current;
    for (let i = 0; i < meteors.length; i++) {
      let m = meteors[i];
      m.age += delta;

      // Expired → respawn with fresh pre-birth delay
      if (m.age >= m.lifetime) {
        m = makeMeteor();
        meteors[i] = m;
      }

      const base = i * 6;
      const alive = m.age >= 0 && m.age < m.lifetime;

      if (!alive) {
        // Collapse to a single far-away point → nothing draws
        positions[base + 0] = 0;
        positions[base + 1] = 0;
        positions[base + 2] = -50;
        positions[base + 3] = 0;
        positions[base + 4] = 0;
        positions[base + 5] = -50;
        // Clear colors just in case
        colors[base + 0] = 0; colors[base + 1] = 0; colors[base + 2] = 0;
        colors[base + 3] = 0; colors[base + 4] = 0; colors[base + 5] = 0;
        continue;
      }

      const prog = m.age / m.lifetime;
      // Smooth ease in/out
      const fade = prog < 0.15 ? prog / 0.15
                 : prog > 0.85 ? (1 - prog) / 0.15
                 : 1;

      // Advance head
      m.headPos.addScaledVector(m.dir, m.speed * delta);

      // Position — head + tail along reverse direction
      positions[base + 0] = m.headPos.x;
      positions[base + 1] = m.headPos.y;
      positions[base + 2] = m.headPos.z;
      positions[base + 3] = m.headPos.x - m.dir.x * m.trailLen;
      positions[base + 4] = m.headPos.y - m.dir.y * m.trailLen;
      positions[base + 5] = m.headPos.z - m.dir.z * m.trailLen;

      // Color: head bright, tail fades to transparent. Hue mix between
      // cool white (#e8efff) and warm gold (#ffd878).
      const headR = 1.0;
      const headG = 0.98 - m.hueShift * 0.13;  // cooler or warmer
      const headB = 0.85 - m.hueShift * 0.35;
      colors[base + 0] = headR * fade;
      colors[base + 1] = headG * fade;
      colors[base + 2] = headB * fade;
      // Tail dimmer + warmer bias
      colors[base + 3] = 0.6 * fade;
      colors[base + 4] = 0.38 * fade;
      colors[base + 5] = 0.1 * fade;
    }

    (geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    (geometry.attributes.color as THREE.BufferAttribute).needsUpdate = true;
  });

  return (
    // @ts-expect-error three.js primitive
    <lineSegments
      frustumCulled={false}
      geometry={geometry}
      material={material}
      renderOrder={-1}
    />
  );
}
