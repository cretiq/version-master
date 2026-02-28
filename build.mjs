import { build } from 'esbuild';

await build({
  entryPoints: ['src/cli.tsx'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  outfile: 'dist/vm.mjs',
  banner: {
    js: [
      '#!/usr/bin/env node',
      'import { createRequire as __createRequire } from "node:module";',
      'const require = __createRequire(import.meta.url);',
    ].join('\n'),
  },
  alias: { 'react-devtools-core': './src/shims/empty.js' },
  define: { 'process.env.DEV': 'false' },
  minify: false,
  sourcemap: false,
});

console.log('Built dist/vm.mjs');
