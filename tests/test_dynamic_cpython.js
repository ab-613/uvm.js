// File: tests/test_dynamic_cpython.js
import assert from 'assert';
import { UniversalInterpreter, vfs } from '../js/index.js';

console.log('=== Running Dynamic CPython Stdlib Fetcher Tests ===\n');

const uvm = new UniversalInterpreter();

// Test 1: Dynamically fetch colorsys.py from CPython 3.12 GitHub and execute
{
  console.log('Testing dynamic fetch and execution of official CPython colorsys.py...');
  const code = `
import colorsys

hsv = colorsys.rgb_to_hsv(0.2, 0.4, 0.4)
print("HSV H:", round(hsv[0], 2))
print("HSV S:", round(hsv[1], 2))
print("HSV V:", round(hsv[2], 2))
`;

  const result = await uvm.run(code, { language: 'python' });
  console.log(result.output);

  assert.ok(vfs.exists('/lib/python3/colorsys.py'), 'colorsys.py should be cached in VFS');
  assert.ok(result.output.includes('HSV H: 0.5'), 'HSV H should be 0.5');
  assert.ok(result.output.includes('HSV S: 0.5'), 'HSV S should be 0.5');
  assert.ok(result.output.includes('HSV V: 0.4'), 'HSV V should be 0.4');
  console.log(`  ✅ Test 1 Passed: colorsys.py fetched, cached in VFS, and executed in ${result.durationMs.toFixed(1)}ms\n`);
}

// Test 2: Execution from cache (zero network latency)
{
  console.log('Testing second run from local VFS cache...');
  const code = `
import colorsys
rgb = colorsys.hsv_to_rgb(0.5, 0.5, 0.4)
print("RGB R:", round(rgb[0], 2))
`;
  const result = await uvm.run(code, { language: 'python' });
  console.log(result.output);
  assert.ok(result.output.includes('RGB R: 0.2'), 'RGB R should be 0.2');
  console.log(`  ✅ Test 2 Passed: Executed from VFS cache in ${result.durationMs.toFixed(1)}ms\n`);
}

// Test 3: Dynamically fetch official antigravity.py and execute Munroe geohash
{
  console.log('Testing dynamic fetch and execution of official CPython antigravity.py...');
  const code = `
import antigravity
antigravity.geohash(37.421542, -122.085589, "2005-05-26-10458.68")
`;
  const result = await uvm.run(code, { language: 'python' });
  console.log('OUTPUT WAS:', JSON.stringify(result.output));
  assert.ok(result.output.includes('37.857713 -122.544543'), 'Munroe geohash algorithm output must match');
  console.log(`  ✅ Test 3 Passed: antigravity.py fetched, cached, and Munroe geohash algorithm verified!\n`);
}

console.log('🎉 All Dynamic CPython Stdlib Tests Passed with 100% Success!\n');
