import fs from 'fs';
import path from 'path';

const root = process.cwd();
const srcDir = path.join(root, 'src');

function walk(dir) {
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

const files = walk(srcDir).filter((p) => /\.(ts|tsx|css)$/.test(p));

const violations = [];

function add(file, rule, snippet) {
  violations.push({ file: path.relative(root, file), rule, snippet });
}

for (const file of files) {
  const txt = fs.readFileSync(file, 'utf8');

  // 1) Disallow font imports from external sources and legacy font-family declarations.
  if (/(@import\s+url\(['"]https:\/\/fonts\.googleapis\.com)/.test(txt)) {
    add(file, 'Disallowed external font import', RegExp.$1);
  }

  if (/font-family\s*:\s*[^;]*\b(?:Inter|Playfair Display|Google Sans|Segoe UI|system-ui|Roboto)\b/.test(txt)) {
    add(file, 'Inline font-family detected', 'use var(--font-sans / --font-display) instead');
  }

  // 2) Disallow inline hex/rgb(a)/hsl(a) colors in source (best-effort)
  if (/(#[0-9a-fA-F]{3,8})\b/.test(txt)) add(file, 'Hardcoded hex color detected', RegExp.$1);
  if (/(rgba?\(|hsla?\()/.test(txt)) add(file, 'Hardcoded rgb/hsl color detected', RegExp.$0);

  // 3) Disallow common Tailwind semantic color variants that should be token-driven.
  // This is heuristic until repo is fully migrated.
  if (/(\bbg-(amber|red|emerald|green|yellow|blue|purple)-\d{2,}|\btext-(amber|red|emerald|green|yellow|blue|purple)-\d{2,}|\bborder-(amber|red|emerald|green|yellow|blue|purple)-\d{2,})/.test(txt)) {
    add(file, 'Tailwind semantic color variant used (heuristic) - migrate to tokens', 'bg/text/border amber/red/etc');
  }

  // 4) Disallow tiny text sizes except explicitly allowed captions.
  if (/(text-\[(7|8|9|10)px\])/.test(txt)) {
    add(file, 'Tiny text size used', RegExp.$1);
  }

  if (/\btext-\[(7|8|9|10)px\]$/.test(txt)) {
    add(file, 'Tiny text size used at end token', RegExp.$0);
  }

  // 5) Disallow hardcoded shadows classes (heuristic). Prefer shadow tokens.
  if (/\bshadow-[a-zA-Z]+\b/.test(txt)) {
    // allow shadow-premium which is already token-like
    if (!/\bshadow-premium/.test(txt) && !/\bshadow-premium-lg/.test(txt) && !/\bshadow-premium-xl/.test(txt)) {
      add(file, 'Potential hardcoded Tailwind shadow class used', 'shadow-*');
    }
  }

  // 6) Disallow arbitrary border-radius values
  if (/\brounded-\[[^\]]+\]/.test(txt)) {
    add(file, 'Arbitrary border-radius used', 'rounded-[...]');
  }
}

if (violations.length) {
  console.error('\nDesign system enforcement failed. Violations:');
  for (const v of violations.slice(0, 50)) {
    console.error(`- ${v.file} | ${v.rule} | ${v.snippet}`);
  }
  if (violations.length > 50) {
    console.error(`...and ${violations.length - 50} more`);
  }
  process.exit(1);
}

console.log('Design system enforcement passed (best-effort).');

