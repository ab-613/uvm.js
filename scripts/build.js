import * as esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';

const distDir = path.resolve('dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

async function build() {
  console.log('Building UVM standalone distributions...');

  // 1. Browser Standalone IIFE Bundle (Includes ohm-js)
  // Exposes window.UniversalInterpreter and window.UVM
  await esbuild.build({
    entryPoints: ['js/index.js'],
    bundle: true,
    outfile: 'dist/uvm.bundle.js',
    format: 'iife',
    globalName: 'UVM',
    banner: {
      js: '/* UVM Studio - Bytecode Virtual Machine & Stepper (Universal Interpreter) */\n'
    },
    footer: {
      js: 'if (typeof window !== "undefined") { window.UniversalInterpreter = UVM.UniversalInterpreter || UVM.default; }'
    },
    platform: 'browser',
    sourcemap: true,
    logLevel: 'info'
  });

  // 2. Minified Browser Bundle for CDN / production
  await esbuild.build({
    entryPoints: ['js/index.js'],
    bundle: true,
    outfile: 'dist/uvm.min.js',
    format: 'iife',
    globalName: 'UVM',
    minify: true,
    footer: {
      js: 'if (typeof window !== "undefined") { window.UniversalInterpreter = UVM.UniversalInterpreter || UVM.default; }'
    },
    platform: 'browser',
    sourcemap: true,
    logLevel: 'info'
  });

  // 3. ESM bundle for modern bundlers / CDN module scripts
  await esbuild.build({
    entryPoints: ['js/index.js'],
    bundle: true,
    outfile: 'dist/uvm.mjs',
    format: 'esm',
    platform: 'neutral',
    sourcemap: true,
    logLevel: 'info'
  });

  const stats = fs.statSync('dist/uvm.min.js');
  console.log(`\n✅ Build complete!`);
  console.log(`   - dist/uvm.bundle.js (Full unminified bundle)`);
  console.log(`   - dist/uvm.min.js    (Minified standalone browser script: ${(stats.size / 1024).toFixed(1)} KB)`);
  console.log(`   - dist/uvm.mjs       (Standalone ESM bundle)`);
}

build().catch(err => {
  console.error(err);
  process.exit(1);
});
