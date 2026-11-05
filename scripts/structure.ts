/**
 * Prints the project structure: the file tree with line counts, and every
 * file's public API. Run with `npm run structure`.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const SKIP = new Set(['node_modules', 'dist', 'data', 'shots', '.git', '.cache', '.arena']);

interface Entry {
  path: string;
  lines: number;
  exports: string[];
}

function walk(dir: string, out: Entry[] = []): Entry[] {
  for (const name of readdirSync(dir).sort()) {
    if (SKIP.has(name)) continue;
    const full = join(dir, name);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      walk(full, out);
      continue;
    }
    if (!/\.(ts|tsx|css|html|json|md)$/.test(name)) continue;
    if (name === 'package-lock.json') continue;
    const source = readFileSync(full, 'utf8');
    // Markdown is listed but not scanned — code samples inside it are not APIs.
    const exports = /\.(ts|tsx)$/.test(name)
      ? [
          ...source.matchAll(
            /^export\s+(?:declare\s+)?(?:async\s+)?(?:interface|type|const|function|class)\s+([A-Za-z0-9_]+)/gm,
          ),
        ].map((match) => match[1])
      : [];
    out.push({
      path: relative(ROOT, full),
      lines: source.split('\n').length,
      exports,
    });
  }
  return out;
}

const entries = walk(ROOT);

console.log('\nFlyer Studio — structure\n');
for (const entry of entries) {
  console.log(`${String(entry.lines).padStart(5)}  ${entry.path}`);
  if (entry.exports.length) {
    console.log(`       └─ ${entry.exports.join(', ')}`);
  }
}
console.log(`\n${entries.length} files, ${entries.reduce((sum, e) => sum + e.lines, 0)} lines\n`);
