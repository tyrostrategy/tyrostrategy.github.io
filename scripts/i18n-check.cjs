/**
 * i18n Key Validation Script
 * Compares tr.json and en.json to find missing/extra keys.
 * Usage: node scripts/i18n-check.cjs
 */
const fs = require("fs");
const path = require("path");

const TR_PATH = path.resolve(__dirname, "../src/locales/tr.json");
const EN_PATH = path.resolve(__dirname, "../src/locales/en.json");

function flattenKeys(obj, prefix = "") {
  const keys = [];
  for (const [k, v] of Object.entries(obj)) {
    const full = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      keys.push(...flattenKeys(v, full));
    } else {
      keys.push(full);
    }
  }
  return keys;
}

const tr = JSON.parse(fs.readFileSync(TR_PATH, "utf8"));
const en = JSON.parse(fs.readFileSync(EN_PATH, "utf8"));

const trKeys = new Set(flattenKeys(tr));
const enKeys = new Set(flattenKeys(en));

const inTrNotEn = [...trKeys].filter((k) => !enKeys.has(k)).sort();
const inEnNotTr = [...enKeys].filter((k) => !trKeys.has(k)).sort();

console.log("\n\x1b[1mi18n Key Check\x1b[0m");
console.log("\x1b[90m══════════════════════════════════════\x1b[0m");
console.log(`TR keys: \x1b[36m${trKeys.size}\x1b[0m | EN keys: \x1b[36m${enKeys.size}\x1b[0m\n`);

if (inTrNotEn.length > 0) {
  console.log(`\x1b[31m❌ TR'de var, EN'de yok (${inTrNotEn.length}):\x1b[0m`);
  inTrNotEn.forEach((k) => console.log(`   \x1b[33m- ${k}\x1b[0m`));
  console.log();
}

if (inEnNotTr.length > 0) {
  console.log(`\x1b[31m❌ EN'de var, TR'de yok (${inEnNotTr.length}):\x1b[0m`);
  inEnNotTr.forEach((k) => console.log(`   \x1b[33m- ${k}\x1b[0m`));
  console.log();
}

const total = inTrNotEn.length + inEnNotTr.length;
if (total === 0) {
  console.log("\x1b[32m✅ Tüm key'ler senkron! Her iki dosya da eşleşiyor.\x1b[0m\n");
  process.exit(0);
} else {
  console.log(`\x1b[31m⚠  SONUÇ: ${total} uyumsuz key bulundu\x1b[0m\n`);
  process.exit(1);
}
