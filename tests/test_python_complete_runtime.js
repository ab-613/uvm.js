// File: tests/test_python_complete_runtime.js
import assert from 'assert';
import { parsePythonSource } from '../js/frontend/python.js';
import { BytecodeCompiler } from '../js/vm/compiler.js';
import { VirtualMachine } from '../js/vm/vm.js';
import { ModuleManager } from '../js/vm/modules.js';

console.log('=== Running Complete Python 3 Language & Runtime Test Suite ===\n');

function runPython(src) {
  const ast = parsePythonSource(src);
  const compiler = new BytecodeCompiler();
  const program = compiler.compile(ast);
  const mm = new ModuleManager();
  const logs = [];
  const vm = new VirtualMachine({ moduleManager: mm, onPrint: (msg) => logs.push(msg) });

  const gen = vm.execute(program);
  let step = gen.next();
  while (!step.done) {
    step = gen.next();
  }
  return { vm, logs };
}

// -------------------------------------------------------------
// Test 1: Full Method Suites on Built-in Types (str, list, dict)
// -------------------------------------------------------------
console.log('Testing Built-in Methods on Strings, Lists, Dicts...');
{
  const src = `
# String methods
s = "  hello world  "
stripped = s.strip()
upper_s = stripped.upper()
parts = upper_s.split(" ")
joined = "-".join(parts)
has_hello = stripped.startswith("hello")
num_check = "12345".isdigit()

# List methods
lst = [10, 20]
lst.append(30)
lst.extend([40, 50])
lst.insert(0, 5)
popped_val = lst.pop()
first_idx = lst.index(20)
lst.reverse()

# Dict methods
d = {"a": 1, "b": 2}
d_keys = d.keys()
val_a = d.get("a", 0)
val_missing = d.get("z", 99)
d.update({"c": 3})
`;
  const { vm } = runPython(src);
  assert.strictEqual(vm.globals.get('stripped'), 'hello world');
  assert.strictEqual(vm.globals.get('upper_s'), 'HELLO WORLD');
  assert.deepStrictEqual(vm.globals.get('parts'), ['HELLO', 'WORLD']);
  assert.strictEqual(vm.globals.get('joined'), 'HELLO-WORLD');
  assert.strictEqual(vm.globals.get('has_hello'), true);
  assert.strictEqual(vm.globals.get('num_check'), true);

  assert.strictEqual(vm.globals.get('popped_val'), 50);
  assert.strictEqual(vm.globals.get('first_idx'), 2);
  assert.deepStrictEqual(vm.globals.get('lst'), [40, 30, 20, 10, 5]);

  assert.strictEqual(vm.globals.get('val_a'), 1);
  assert.strictEqual(vm.globals.get('val_missing'), 99);
  assert.strictEqual(vm.globals.get('d')['c'], 3);
  console.log('  ✅ Test 1 Passed: Complete methods on strings, lists, and dicts.');
}

// -------------------------------------------------------------
// Test 2: Structured Exception Handling (try, except, finally, raise)
// -------------------------------------------------------------
console.log('\nTesting Exception Handling (try, except, finally, raise)...');
{
  const src = `
events = []
caught_err = ""

try:
    events.append("try_start")
    raise ValueError("Something went wrong!")
    events.append("unreachable")
except ValueError as e:
    events.append("except_caught")
    caught_err = str(e)
finally:
    events.append("finally_done")
`;
  const { vm } = runPython(src);
  assert.deepStrictEqual(vm.globals.get('events'), ['try_start', 'except_caught', 'finally_done']);
  assert.strictEqual(vm.globals.get('caught_err').includes('Something went wrong!'), true);
  console.log('  ✅ Test 2 Passed: try/except/finally caught and unwound error safely.');
}

// -------------------------------------------------------------
// Test 3: Runtime Error Trapping in try/except
// -------------------------------------------------------------
console.log('\nTesting Runtime VM Error Trapping in try/except...');
{
  const src = `
trapped = false
try:
    x = 10 / 0
except:
    trapped = true
`;
  const { vm } = runPython(src);
  assert.strictEqual(vm.globals.get('trapped'), true);
  console.log('  ✅ Test 3 Passed: ZeroDivisionError safely trapped in try/except.');
}

// -------------------------------------------------------------
// Test 4: Context Managers (with statement) & VFS open() File I/O
// -------------------------------------------------------------
console.log('\nTesting Context Managers (with) and VFS open()...');
{
  const src = `
# Write to VFS
with open("workspace_file.txt", "w") as f:
    f.write("Universal Interpreter VFS Data Line 1\\nLine 2")

# Read back from VFS
read_back = ""
first_line = ""
with open("workspace_file.txt", "r") as f:
    read_back = f.read()

with open("workspace_file.txt", "r") as f:
    first_line = f.readline()
`;
  const { vm } = runPython(src);
  assert.strictEqual(vm.globals.get('read_back'), 'Universal Interpreter VFS Data Line 1\nLine 2');
  assert.strictEqual(vm.globals.get('first_line'), 'Universal Interpreter VFS Data Line 1\n');
  console.log('  ✅ Test 4 Passed: with open(...) writes, reads, and auto-closes via VFS.');
}

// -------------------------------------------------------------
// Test 5: Variable Arguments (*args) Packing and Unpacking
// -------------------------------------------------------------
console.log('\nTesting Variable Arguments (*args) Packing & Call Unpacking...');
{
  const src = `
def sum_all(multiplier, *numbers):
    total = 0
    for n in numbers:
        total = total + n
    return total * multiplier

pos_call = sum_all(2, 1, 2, 3, 4)

# Call-site unpacking with *
extra = [10, 20, 30]
unpack_call = sum_all(3, *extra)
`;
  const { vm } = runPython(src);
  assert.strictEqual(vm.globals.get('pos_call'), 20); // (1+2+3+4) * 2 = 20
  assert.strictEqual(vm.globals.get('unpack_call'), 180); // (10+20+30) * 3 = 180
  console.log('  ✅ Test 5 Passed: *args definition packing and call-site spread unpacking.');
}

// -------------------------------------------------------------
// Test 6: Standard Built-in Utilities & Reflection
// -------------------------------------------------------------
console.log('\nTesting Standard Built-in Utilities (isinstance, type, ord, chr, map, filter)...');
{
  const src = `
is_int = isinstance(42, int)
is_str = isinstance("hello", str)
is_list = isinstance([1, 2], list)

t_num = type(99)
t_str = type("abc")
t_lst = type([])

char_code = ord("A")
from_code = chr(66)

bin_str = bin(10)
hex_str = hex(255)
oct_str = oct(8)

doubled = list(map(lambda x: x * 2, [1, 2, 3, 4]))
evens = list(filter(lambda x: x % 2 == 0, [1, 2, 3, 4, 5, 6]))
power_val = pow(2, 8)
`;
  const { vm } = runPython(src);
  assert.strictEqual(vm.globals.get('is_int'), true);
  assert.strictEqual(vm.globals.get('is_str'), true);
  assert.strictEqual(vm.globals.get('is_list'), true);

  assert.strictEqual(vm.globals.get('t_num'), 'int');
  assert.strictEqual(vm.globals.get('t_str'), 'str');
  assert.strictEqual(vm.globals.get('t_lst'), 'list');

  assert.strictEqual(vm.globals.get('char_code'), 65);
  assert.strictEqual(vm.globals.get('from_code'), 'B');

  assert.strictEqual(vm.globals.get('bin_str'), '0b1010');
  assert.strictEqual(vm.globals.get('hex_str'), '0xff');
  assert.strictEqual(vm.globals.get('oct_str'), '0o10');

  assert.deepStrictEqual(vm.globals.get('doubled'), [2, 4, 6, 8]);
  assert.deepStrictEqual(vm.globals.get('evens'), [2, 4, 6]);
  assert.strictEqual(vm.globals.get('power_val'), 256);
  console.log('  ✅ Test 6 Passed: isinstance, type, ord, chr, bin/hex/oct, map/filter/pow.');
}

console.log('\n🎉 ALL COMPLETE PYTHON 3 RUNTIME TESTS PASSED WITH 100% SUCCESS!\n');
