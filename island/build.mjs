/**
 * Builds the OpenUI island into web-served assets:
 *   public/openui-island.js   — IIFE bundle, global `OpenUIIsland`
 *   public/openui-island.css  — react-ui styles (concatenated, url()s left alone)
 *
 * CSS is concatenated from react-ui's declared subpath exports rather than
 * imported through esbuild, so esbuild never has to resolve url() asset refs.
 */
import { build } from 'esbuild';
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const outDir = join(root, 'public');
mkdirSync(outDir, { recursive: true });

await build({
  entryPoints: [join(here, 'index.tsx')],
  bundle: true,
  format: 'iife',
  globalName: 'OpenUIIsland',
  outfile: join(outDir, 'openui-island.js'),
  platform: 'browser',
  target: 'es2020',
  jsx: 'automatic',
  minify: true,
  legalComments: 'none',
  define: { 'process.env.NODE_ENV': '"production"' },
  logLevel: 'info',
});

const require = createRequire(import.meta.url);
const cssInputs = [
  require.resolve('@openuidev/react-ui/defaults.css'),
  require.resolve('@openuidev/react-ui/components.css'),
];
const css = cssInputs.map((p) => readFileSync(p, 'utf8')).join('\n');
writeFileSync(join(outDir, 'openui-island.css'), css);
console.log(`[island] wrote openui-island.css (${css.length.toLocaleString()} bytes)`);
