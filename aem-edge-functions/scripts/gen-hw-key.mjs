// Generates src/hw-key.generated.js (gitignored) from hw_key.local so the
// Healthwise key can be bundled into the edge function WITHOUT committing it to
// the (public) repo. This is only a fallback for Sandbox programs, which don't
// provision the Fastly secret store; real environments use the managed secret
// and this value stays empty/unused.
//
// Runs automatically before `npm run build` (prebuild). If hw_key.local is
// absent, it writes an empty key (safe — real envs read from the secret store).
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = new URL('..', import.meta.url);
const keyFile = fileURLToPath(new URL('hw_key.local', root));
const outFile = fileURLToPath(new URL('src/hw-key.generated.js', root));

let key = '';
try {
  if (existsSync(keyFile)) key = readFileSync(keyFile, 'utf8').trim();
} catch { /* leave empty */ }

writeFileSync(
  outFile,
  `// AUTO-GENERATED — do not edit, do not commit (gitignored).\n`
    + `// Sandbox-only Healthwise key fallback; empty on real environments.\n`
    + `export const HW_KEY_FALLBACK = ${JSON.stringify(key)};\n`,
);

console.log(`gen-hw-key: wrote src/hw-key.generated.js (${key ? 'key present' : 'empty'})`);
