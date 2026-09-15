// File: tests/test_indexing_and_input.js
import assert from 'assert';
import { parsePythonSource } from '../js/frontend/python.js';
import { BytecodeCompiler } from '../js/vm/compiler.js';
import { VirtualMachine } from '../js/vm/vm.js';
import { ModuleManager } from '../js/vm/modules.js';
import { cancelPendingTerminalInput } from '../js/main.js';

console.log('=== Running Indexing Semantics, Error Handling & Input Lifecycle Tests ===\n');

function runPython(src) {
  const ast = parsePythonSource(src);
  const compiler = new BytecodeCompiler();
  const program = compiler.compile(ast);
  const mm = new ModuleManager();
  const vm = new VirtualMachine({ moduleManager: mm });

  const gen = vm.execute(program);
  let step = gen.next();
  while (!step.done) {
    step = gen.next();
  }
  return vm;
}

// -------------------------------------------------------------
// Test 1: Test Index Out of Bounds (List)
// -------------------------------------------------------------
console.log('Testing Index Out of Bounds...');
{
  const src = `
table = []
caught = False
try:
    table[0].append('a')
    assert False, "Should have raised IndexError"
except IndexError as e:
    caught = True
`;
  const vm = runPython(src);
  assert.strictEqual(vm.globals.get('caught'), true, "IndexError should be caught when indexing out-of-bounds");
  console.log('  ✅ Test 1 Passed: Out-of-bounds list indexing raises caught IndexError, avoiding JS TypeError leak.');
}

// -------------------------------------------------------------
// Test 2: Test List Access Out of Bounds with Child Method Call
// -------------------------------------------------------------
console.log('\nTesting List Access Out of Bounds with Child Element...');
{
  const src = `
table = [[]]
caught = False
try:
    table[1].append('a')
    assert False, "table[1] should raise IndexError"
except IndexError:
    caught = True
`;
  const vm = runPython(src);
  assert.strictEqual(vm.globals.get('caught'), true, "table[1] should raise IndexError");
  console.log('  ✅ Test 2 Passed: Out-of-bounds element access raises IndexError.');
}

// -------------------------------------------------------------
// Test 3: Test List Assignment Out of Bounds
// -------------------------------------------------------------
console.log('\nTesting List Assignment Out of Bounds...');
{
  const src = `
table = [10]
caught = False
try:
    table[1] = 20
    assert False, "table[1] = 20 should raise IndexError"
except IndexError:
    caught = True
`;
  const vm = runPython(src);
  assert.strictEqual(vm.globals.get('caught'), true, "table[1] = 20 should raise IndexError");
  console.log('  ✅ Test 3 Passed: Out-of-bounds list assignment raises IndexError.');
}

// -------------------------------------------------------------
// Test 4: Test Dictionary Missing Key
// -------------------------------------------------------------
console.log('\nTesting Dictionary Missing Key...');
{
  const src = `
d = {"a": 1}
caught = False
try:
    _ = d["b"]
    assert False, "Should raise KeyError"
except KeyError:
    caught = True
`;
  const vm = runPython(src);
  assert.strictEqual(vm.globals.get('caught'), true, "Missing key in dict should raise KeyError");
  console.log('  ✅ Test 4 Passed: Missing dictionary key raises caught KeyError.');
}

// -------------------------------------------------------------
// Test 5: Test Member Access on None
// -------------------------------------------------------------
console.log('\nTesting Member Access on None...');
{
  const src = `
x = None
caught = False
try:
    x.append(10)
    assert False, "Should raise AttributeError"
except AttributeError:
    caught = True
`;
  const vm = runPython(src);
  assert.strictEqual(vm.globals.get('caught'), true, "x.append on None should raise AttributeError");
  console.log('  ✅ Test 5 Passed: Member access on None raises caught AttributeError.');
}

// -------------------------------------------------------------
// Test 6: Test for-in Loop over Dictionary Keys
// -------------------------------------------------------------
console.log('\nTesting for-in loop over dictionary keys...');
{
  const src = `
d = {"apple": 1, "banana": 2, "cherry": 3}
keys = []
for k in d:
    keys.append(k)
`;
  const vm = runPython(src);
  const keys = vm.globals.get('keys');
  assert.deepStrictEqual(keys, ["apple", "banana", "cherry"]);
  console.log('  ✅ Test 6 Passed: for-in loop over dict iterates keys correctly.');
}

// -------------------------------------------------------------
// Test 7: Test for-in Loop over Set
// -------------------------------------------------------------
console.log('\nTesting for-in loop over set...');
{
  const src = `
s = set([10, 20, 30])
items = []
for x in s:
    items.append(x)
`;
  const vm = runPython(src);
  const items = vm.globals.get('items');
  assert.strictEqual(items.length, 3);
  assert.ok(items.includes(10));
  assert.ok(items.includes(20));
  assert.ok(items.includes(30));
  console.log('  ✅ Test 7 Passed: for-in loop over set iterates elements correctly.');
}

// -------------------------------------------------------------
// Test 8: Test String Indexing Bounds
// -------------------------------------------------------------
console.log('\nTesting String Indexing Bounds...');
{
  const src = `
s = "hello"
caught = False
try:
    ch = s[10]
except IndexError:
    caught = True
`;
  const vm = runPython(src);
  assert.strictEqual(vm.globals.get('caught'), true, "String out-of-bounds should raise IndexError");
  console.log('  ✅ Test 8 Passed: String out-of-bounds indexing raises IndexError.');
}

// -------------------------------------------------------------
// Test 9: Test Terminal Input Lifecycle & Cleanup Function
// -------------------------------------------------------------
console.log('\nTesting Terminal Input Lifecycle & Cleanup...');
{
  assert.strictEqual(typeof cancelPendingTerminalInput, 'function', 'cancelPendingTerminalInput should be exported');
  // Executing cancelPendingTerminalInput should be safe when no input is pending
  cancelPendingTerminalInput();
  console.log('  ✅ Test 9 Passed: cancelPendingTerminalInput is a callable function and safely executes.');
}

console.log('\n🎉 ALL INDEXING, ERROR HANDLING & INPUT TESTS PASSED SUCCESSFULLY! 🎉');
