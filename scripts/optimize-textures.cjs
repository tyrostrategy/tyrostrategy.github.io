/**
 * Login asset texture optimization — chess_set 1K → 1K JPG (re-encode at
 * lower quality) and 512 down-sample variants.
 *
 * Why not just resize?
 *   chess_set.gltf references textures by filename. Replacing the original
 *   1K with 512 in-place would preserve gltf compatibility but lose detail
 *   on close-up camera dives. Better strategy:
 *     1. Re-encode 1K JPGs with quality=80 + mozjpeg flag (~30-40% smaller,
 *        zero perceptual loss)
 *     2. Strip metadata (EXIF/ICC profile)
 *
 *   king_hero/textures/* is unused (KingHero uses scene.notex.gltf, material
 *   overridden in code) — those files are pure repo bloat. Removed.
 *
 * Usage:
 *   node scripts/optimize-textures.cjs
 */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const ROOT = path.join(__dirname, "..", "public", "models");

async function recompressJpeg(file) {
  const tmp = file + ".tmp";
  const before = fs.statSync(file).size;
  await sharp(file)
    .jpeg({ quality: 80, mozjpeg: true, chromaSubsampling: "4:2:0" })
    .toFile(tmp);
  const after = fs.statSync(tmp).size;
  if (after < before * 0.95) {
    fs.renameSync(tmp, file);
    return { before, after, kept: true };
  }
  fs.unlinkSync(tmp);
  return { before, after, kept: false };
}

async function recompressPng(file) {
  const tmp = file + ".tmp";
  const before = fs.statSync(file).size;
  await sharp(file)
    .png({ compressionLevel: 9, palette: true })
    .toFile(tmp);
  const after = fs.statSync(tmp).size;
  if (after < before * 0.95) {
    fs.renameSync(tmp, file);
    return { before, after, kept: true };
  }
  fs.unlinkSync(tmp);
  return { before, after, kept: false };
}

function fmt(n) {
  return (n / 1024).toFixed(1) + " KB";
}

(async () => {
  console.log("=== chess_set/textures (1K JPGs, mozjpeg recompress) ===\n");
  const csDir = path.join(ROOT, "chess_set", "textures");
  let totalBefore = 0;
  let totalAfter = 0;
  for (const f of fs.readdirSync(csDir)) {
    const file = path.join(csDir, f);
    if (!/\.(jpe?g)$/i.test(f)) continue;
    const r = await recompressJpeg(file);
    totalBefore += r.before;
    totalAfter += r.kept ? r.after : r.before;
    const flag = r.kept ? "✓" : "= (kept original, recompress not better)";
    console.log(`  ${f.padEnd(45)} ${fmt(r.before)} → ${fmt(r.kept ? r.after : r.before)}  ${flag}`);
  }
  console.log(`\n  TOTAL: ${fmt(totalBefore)} → ${fmt(totalAfter)}  (saved ${fmt(totalBefore - totalAfter)}, -${(((totalBefore - totalAfter) / totalBefore) * 100).toFixed(0)}%)`);

  console.log("\n=== king_hero/textures (UNUSED — material overridden in code) ===");
  const khDir = path.join(ROOT, "king_hero", "textures");
  if (fs.existsSync(khDir)) {
    let total = 0;
    for (const f of fs.readdirSync(khDir)) {
      const file = path.join(khDir, f);
      const sz = fs.statSync(file).size;
      total += sz;
    }
    console.log(`  Removing ${khDir} (${fmt(total)} of unused asset)`);
    fs.rmSync(khDir, { recursive: true, force: true });
    console.log(`  ✓ Removed`);
  } else {
    console.log(`  Already removed`);
  }

  // Also delete scene.gltf (the textured variant) — we only use scene.notex.gltf
  const sceneGltf = path.join(ROOT, "king_hero", "scene.gltf");
  if (fs.existsSync(sceneGltf)) {
    const sz = fs.statSync(sceneGltf).size;
    console.log(`  Removing scene.gltf (${fmt(sz)}, references the deleted textures)`);
    fs.unlinkSync(sceneGltf);
  }

  console.log("\n✅ Done.");
})().catch((e) => {
  console.error("Failed:", e.message);
  process.exit(1);
});
