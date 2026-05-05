/**
 * Installs git hooks from scripts/git-hooks/ into .git/hooks/.
 * Cross-platform (Node.js, no bash required).
 *
 * Usage:
 *   npm run hooks:install
 *
 * Hooks committed in repo so future clones get the same protection
 * (just run npm run hooks:install once after clone).
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const repoRoot = execSync("git rev-parse --show-toplevel", { encoding: "utf8" }).trim();
const hooksSrc = path.join(repoRoot, "scripts", "git-hooks");
const hooksDest = path.join(repoRoot, ".git", "hooks");

if (!fs.existsSync(hooksDest)) {
  console.error("❌ .git/hooks not found. Are you inside a git repo?");
  process.exit(1);
}

const files = fs.readdirSync(hooksSrc).filter((f) => !f.startsWith("."));
let installed = 0;
for (const f of files) {
  const src = path.join(hooksSrc, f);
  const dest = path.join(hooksDest, f);
  fs.copyFileSync(src, dest);
  // chmod +x — Linux/macOS. Windows git-bash zaten exec'liyor.
  try {
    fs.chmodSync(dest, 0o755);
  } catch { /* Windows ACL — ignore */ }
  console.log(`✓ Installed: ${f}`);
  installed++;
}

console.log(`\n✅ ${installed} git hook(s) installed at ${hooksDest}`);
console.log("\nHooks active. To bypass for a single push:");
console.log("  git push --no-verify");
