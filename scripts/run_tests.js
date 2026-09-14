// File: scripts/run_tests.js
/**
 * Test Suite Runner for Universal Virtual Machine (UVM)
 */

import fs from 'fs';
import path from 'path';
import { fork } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TESTS_DIR = path.resolve(__dirname, '../tests');

async function runTestFile(filePath) {
  const fileName = path.basename(filePath);
  const start = performance.now();

  return new Promise((resolve) => {
    const child = fork(filePath, [], {
      stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => (stdout += data.toString()));
    child.stderr.on('data', (data) => (stderr += data.toString()));

    child.on('close', (code) => {
      const durationMs = performance.now() - start;
      resolve({
        file: fileName,
        exitCode: code,
        passed: code === 0,
        durationMs,
        stdout,
        stderr,
      });
    });

    child.on('error', (err) => {
      const durationMs = performance.now() - start;
      resolve({
        file: fileName,
        exitCode: 1,
        passed: false,
        durationMs,
        stdout,
        stderr: err.message,
      });
    });
  });
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║        UNIVERSAL VIRTUAL MACHINE (UVM) - TEST SUITE RUNNER       ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝\n');

  const files = fs
    .readdirSync(TESTS_DIR)
    .filter((f) => f.startsWith('test_') && f.endsWith('.js'))
    .map((f) => path.join(TESTS_DIR, f));

  console.log(`Discovered ${files.length} test suites in tests/\n`);

  const results = [];
  let allPassed = true;

  for (const file of files) {
    const res = await runTestFile(file);
    results.push(res);

    const statusBadge = res.passed ? '✅ PASS' : '❌ FAIL';
    const timeStr = `${res.durationMs.toFixed(0).padStart(5)} ms`;
    console.log(`  ${statusBadge}  [${timeStr}]  ${res.file}`);

    if (!res.passed) {
      allPassed = false;
      console.error('\n--- Failure Details ---');
      console.error(res.stderr || res.stdout);
      console.error('-----------------------\n');
    }
  }

  console.log('\n──────────────────────────────────────────────────────────────────');
  const totalDuration = results.reduce((acc, r) => acc + r.durationMs, 0);
  const passedCount = results.filter((r) => r.passed).length;

  console.log(`Summary: ${passedCount}/${results.length} suites passed (${(totalDuration / 1000).toFixed(2)}s total)`);

  if (!allPassed) {
    console.error('\n❌ Some tests failed.');
    process.exit(1);
  } else {
    console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY WITH 100% RELIABILITY!\n');
    process.exit(0);
  }
}

main();
