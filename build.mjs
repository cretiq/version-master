import { build } from 'esbuild';

await build({
  entryPoints: ['src/cli.tsx'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  outfile: 'dist/vm.mjs',
  banner: { js: '#!/usr/bin/env node' },
  external: ['react-devtools-core'],
  minify: false,
  sourcemap: false,
});

console.log('Built dist/vm.mjs');
