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

/**
 * `@openuidev/react-ui/genui-lib` is a self-contained sub-bundle: it defines
 * its own `ThemeContext`/chart components rather than sharing the main
 * package's, so `<ThemeProvider>` can't reach it, and none of the OpenUI-Lang
 * chart signatures (PieChart/BarChart/...) expose a palette argument either.
 * Every chart falls back to its hardcoded default — the "ocean" (blue) named
 * palette. With no public way to theme it, this plugin patches that palette's
 * hex values in-place at build time (never touching node_modules on disk) so
 * generated charts use the app's orange/red/purple palette instead of blue.
 * Order/values are validated with the dataviz skill's palette validator
 * (CVD-safe adjacent pairs, contrast vs. the dark card surface); see the
 * chat history for the exact validation run. If a future react-ui upgrade
 * renames/restructures `colorPalettes`, this silently no-ops — the build
 * still succeeds, charts just fall back to blue again.
 */
const fireChartPalette = [
  '#e0857a',
  '#f2a154',
  '#e0576b',
  '#b0405f',
  '#dc700f',
  '#7c3aed',
  '#c81e3a',
  '#b23aa8',
  '#8a4fd6',
  '#f0914f',
  '#9c2f52',
];

const patchOceanPalette = {
  name: 'patch-ocean-chart-palette',
  setup(pluginBuild) {
    pluginBuild.onLoad({ filter: /genui-lib[/\\]index\.mjs$/ }, (args) => {
      const source = readFileSync(args.path, 'utf8');
      const patched = source.replace(
        /(ocean:\s*\{\s*name:\s*"Ocean",\s*colors:\s*\[)[^\]]*(\])/,
        (_match, open, close) => `${open}${fireChartPalette.map((c) => `"${c}"`).join(',')}${close}`,
      );
      if (patched === source) {
        console.warn('[island] WARNING: could not find "ocean" chart palette to patch — charts will use library defaults (blue).');
      }
      return { contents: patched, loader: 'js' };
    });
  },
};

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
  plugins: [patchOceanPalette],
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
