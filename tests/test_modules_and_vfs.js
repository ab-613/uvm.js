// File: tests/test_modules_and_vfs.js
import assert from 'assert';
import { vfs } from '../js/vfs/vfs.js';
import { moduleManager } from '../js/vm/modules.js';
import { parsePythonSource } from '../js/frontend/python.js';
import { BytecodeCompiler } from '../js/vm/compiler.js';
import { VirtualMachine } from '../js/vm/vm.js';

console.log('=== Running 3-Tier Universal Module & VFS Test Suite ===\n');

// -------------------------------------------------------------
// Test 1: Virtual Filesystem (VFS) Operations
// -------------------------------------------------------------
console.log('Testing Tier 1/2 VFS Filesystem Operations...');
assert.strictEqual(vfs.exists('/lib/python3/statistics.py'), true);
assert.strictEqual(vfs.exists('/lib/c/_fastmath.c'), true);

vfs.writeFile('/tmp/custom_mod.py', 'def add(a, b):\n    return a + b\n');
assert.strictEqual(vfs.exists('/tmp/custom_mod.py'), true);
assert.strictEqual(vfs.readFile('/tmp/custom_mod.py').includes('def add'), true);

const dirContents = vfs.readdir('/lib');
assert.strictEqual(dirContents.includes('python3'), true);
assert.strictEqual(dirContents.includes('c'), true);
console.log('✅ Test 1 Passed: Virtual Filesystem reads, writes, and directory traversal.');

// -------------------------------------------------------------
// Test 2: Tier 3 Host Bridges (math, json, re, random, time)
// -------------------------------------------------------------
console.log('\nTesting Tier 3 Native Host Bridges...');
const math = moduleManager.getOrLoad('math');
assert.strictEqual(math.sqrt(16), 4);
assert.strictEqual(math.gcd(48, 18), 6);
assert.strictEqual(math.floor(3.9), 3);
assert.strictEqual(math.pi, Math.PI);

const json = moduleManager.getOrLoad('json');
const encoded = json.dumps({ status: 'ok', count: 42 });
const decoded = json.loads(encoded);
assert.strictEqual(decoded.status, 'ok');
assert.strictEqual(decoded.count, 42);

const re = moduleManager.getOrLoad('re');
const matches = re.findall('\\d+', 'Order 66 and Room 101');
assert.deepStrictEqual(matches, ['66', '101']);

const rand = moduleManager.getOrLoad('random');
const n = rand.randint(10, 20);
assert.strictEqual(n >= 10 && n <= 20, true);
console.log('✅ Test 2 Passed: Tier 3 Host Bridges (math, json, re, random) executed.');

// -------------------------------------------------------------
// Test 3: Tier 2 Genuine C Extension Compilation & Execution
// -------------------------------------------------------------
console.log('\nTesting Tier 2 Genuine C Extensions (_fastmath.c)...');
const fastmath = moduleManager.getOrLoad('_fastmath');
assert.strictEqual(typeof fastmath.fast_gcd, 'function');
assert.strictEqual(typeof fastmath.fast_fib, 'function');
assert.strictEqual(typeof fastmath.is_prime, 'function');

assert.strictEqual(fastmath.fast_gcd(252, 105), 21);
assert.strictEqual(fastmath.fast_fib(12), 144);
assert.strictEqual(fastmath.is_prime(97), 1);
assert.strictEqual(fastmath.is_prime(100), 0);
console.log('✅ Test 3 Passed: Tier 2 C Extension compiled to UVM Bytecode and executed correctly.');

// -------------------------------------------------------------
// Test 4: Tier 1 Pure Python from VFS (statistics.py)
// -------------------------------------------------------------
console.log('\nTesting Tier 1 Pure-Python VFS Module (statistics.py)...');
const stats = moduleManager.getOrLoad('statistics');
assert.strictEqual(stats.mean([10, 20, 30, 40]), 25);
assert.strictEqual(stats.median([5, 1, 9, 3, 7]), 5);
assert.strictEqual(stats.median([1, 2, 3, 4]), 2.5);
assert.strictEqual(Math.round(stats.variance([2, 4, 4, 4, 5, 5, 7, 9]) * 1000) / 1000, 4.571);
assert.strictEqual(Math.round(stats.stdev([2, 4, 4, 4, 5, 5, 7, 9]) * 1000) / 1000, 2.138);
console.log('✅ Test 4 Passed: Tier 1 Pure-Python standard library functions (mean, median, variance, stdev).');

// -------------------------------------------------------------
// Test 5: End-to-End Polyglot Python Script with Multi-Tier Imports
// -------------------------------------------------------------
console.log('\nTesting End-to-End Polyglot Script with Multi-Tier Imports in UVM...');
const pyScript = `
import math
import json
import _fastmath
import statistics

# 1. Tier 3 test
r = math.sqrt(256)

# 2. Tier 2 test (C extension)
g = _fastmath.fast_gcd(120, 45)
f = _fastmath.fast_fib(10)

# 3. Tier 1 test (Pure Python VFS)
avg = statistics.mean([10, 20, 30, 40])

# 4. Synthesize results
result = {
    "sqrt": r,
    "gcd": g,
    "fib": f,
    "mean": avg
}
`;

const ast = parsePythonSource(pyScript);
const compiler = new BytecodeCompiler();
const program = compiler.compile(ast);
console.log(`Compiled polyglot program: ${program.instructions.length} instructions, ${program.constants.length} constants.`);

const vm = new VirtualMachine();
vm.moduleManager = moduleManager;
const iter = vm.execute(program);
while (!iter.next().done) {}

const result = vm.globals.get('result');
console.log('VM Globals result:', result);
assert.strictEqual(result.sqrt, 16);
assert.strictEqual(result.gcd, 15);
assert.strictEqual(result.fib, 55);
assert.strictEqual(result.mean, 25);

console.log('✅ Test 5 Passed: End-to-End script importing Tier 1, Tier 2, and Tier 3 modules simultaneously.');
console.log('\n🎉 ALL 3-TIER MODULE & VFS TESTS PASSED SUCCESSFULLY!');
