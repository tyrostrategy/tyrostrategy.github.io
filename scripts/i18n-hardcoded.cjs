/**
 * Hardcoded Turkish String Scanner
 * Scans .tsx files for likely untranslated Turkish strings.
 * Usage: node scripts/i18n-hardcoded.cjs
 */
const fs = require("fs");
const path = require("path");

const SRC_DIR = path.resolve(__dirname, "../src");
// Turkish-specific chars: ç, ş, ğ, ı, ö, ü and uppercase variants
const TR_CHARS = /[çşğıöüÇŞĞİÖÜ]/;
// Match JSX text content and common attribute values
const PATTERNS = [
  // JSX text: >some text<
  />([^<>{}`]+)</g,
  // String attributes: label="text", placeholder="text", title="text", content="text", message="text"
  /(?:label|placeholder|title|content|message|aria-label)="([^"]+)"/g,
  // Template literals in JSX attributes: label={`text`}
  /(?:label|placeholder|title|content|message)=\{`([^`]+)`\}/g,
];

function walk(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== "node_modules" && entry.name !== "locales") {
      files.push(...walk(full));
    } else if (entry.isFile() && /\.tsx?$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

const files = walk(SRC_DIR);
let totalHits = 0;
const results = [];

for (const file of files) {
  const lines = fs.readFileSync(file, "utf8").split("\n");
  const rel = path.relative(SRC_DIR, file);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Skip import/comment lines
    if (/^\s*(\/\/|\/\*|\*|import\s)/.test(line)) continue;

    for (const pat of PATTERNS) {
      pat.lastIndex = 0;
      let m;
      while ((m = pat.exec(line)) !== null) {
        const text = m[1].trim();
        if (text && TR_CHARS.test(text) && text.length > 1) {
          results.push({ file: rel, line: i + 1, text });
          totalHits++;
        }
      }
    }
  }
}

console.log("\n\x1b[1mi18n Hardcoded Turkish String Scanner\x1b[0m");
console.log("\x1b[90m══════════════════════════════════════\x1b[0m");
console.log(`Scanned: \x1b[36m${files.length}\x1b[0m files\n`);

if (results.length === 0) {
  console.log("\x1b[32m✅ No hardcoded Turkish strings found!\x1b[0m\n");
  process.exit(0);
}

// Group by file
const grouped = {};
for (const r of results) {
  if (!grouped[r.file]) grouped[r.file] = [];
  grouped[r.file].push(r);
}

for (const [file, hits] of Object.entries(grouped)) {
  console.log(`\x1b[36m${file}\x1b[0m`);
  for (const h of hits) {
    const preview = h.text.length > 60 ? h.text.slice(0, 57) + "..." : h.text;
    console.log(`  \x1b[33mL${h.line}\x1b[0m: ${preview}`);
  }
  console.log();
}

console.log(`\x1b[31m⚠  ${totalHits} hardcoded Turkish string(s) found in ${Object.keys(grouped).length} file(s)\x1b[0m\n`);
process.exit(1);
