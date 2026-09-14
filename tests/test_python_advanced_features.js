// File: tests/test_python_advanced_features.js
import assert from 'assert';
import { parsePythonSource } from '../js/frontend/python.js';
import { BytecodeCompiler } from '../js/vm/compiler.js';
import { VirtualMachine } from '../js/vm/vm.js';
import { ModuleManager } from '../js/vm/modules.js';

console.log('=== Running Modern Python 3 Syntactic Idioms & Features Test Suite ===\n');

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
// Test 1: List, Dict, and Set Comprehensions
// -------------------------------------------------------------
console.log('Testing Comprehensions (List, Dict, Set)...');
{
  const src = `
nums = [1, 2, 3, 4, 5]
evens = [x * 10 for x in nums if x % 2 == 0]
squares_map = {x: x * x for x in nums if x <= 3}
words = ["apple", "banana", "apple", "cherry"]
unique = {w for w in words}
`;
  const vm = runPython(src);
  assert.deepStrictEqual(vm.globals.get('evens'), [20, 40]);
  assert.deepStrictEqual(vm.globals.get('squares_map'), { '1': 1, '2': 4, '3': 9 });
  const unique = vm.globals.get('unique');
  assert.strictEqual(unique.length, 3);
  assert.ok(unique.includes('apple'));
  assert.ok(unique.includes('banana'));
  assert.ok(unique.includes('cherry'));
  console.log('  ✅ Test 1 Passed: ListComp, DictComp, and SetComp work with filtering.');
}

// -------------------------------------------------------------
// Test 2: Ternary / Conditional Expressions
// -------------------------------------------------------------
console.log('\nTesting Ternary / Conditional Expressions (x if cond else y)...');
{
  const src = `
score = 85
grade = "pass" if score >= 60 else "fail"
other = "yes" if score < 50 else "no"
`;
  const vm = runPython(src);
  assert.strictEqual(vm.globals.get('grade'), 'pass');
  assert.strictEqual(vm.globals.get('other'), 'no');
  console.log('  ✅ Test 2 Passed: Python ternary expressions evaluated correctly.');
}

// -------------------------------------------------------------
// Test 3: Sequence Slicing
// -------------------------------------------------------------
console.log('\nTesting Sequence Slicing (seq[start:stop:step])...');
{
  const src = `
msg = "hello world"
sub1 = msg[0:5]
sub2 = msg[6:]
sub3 = msg[:5]
rev = msg[::-1]
items = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
evens = items[::2]
tail = items[-3:]
`;
  const vm = runPython(src);
  assert.strictEqual(vm.globals.get('sub1'), 'hello');
  assert.strictEqual(vm.globals.get('sub2'), 'world');
  assert.strictEqual(vm.globals.get('sub3'), 'hello');
  assert.strictEqual(vm.globals.get('rev'), 'dlrow olleh');
  assert.deepStrictEqual(vm.globals.get('evens'), [0, 2, 4, 6, 8]);
  assert.deepStrictEqual(vm.globals.get('tail'), [7, 8, 9]);
  console.log('  ✅ Test 3 Passed: Positive, negative, open, and strided sequence slicing.');
}

// -------------------------------------------------------------
// Test 4: Multiple Assignment, Swapping, and Loop Unpacking
// -------------------------------------------------------------
console.log('\nTesting Multiple Assignment, Variable Swapping, and Unpacking...');
{
  const src = `
a, b = 10, 20
a, b = b, a

coords = [100, 200]
x, y = coords

pairs = [[1, "one"], [2, "two"], [3, "three"]]
keys = []
vals = []
for k, v in pairs:
    keys.append(k)
    vals.append(v)
`;
  const vm = runPython(src);
  assert.strictEqual(vm.globals.get('a'), 20);
  assert.strictEqual(vm.globals.get('b'), 10);
  assert.strictEqual(vm.globals.get('x'), 100);
  assert.strictEqual(vm.globals.get('y'), 200);
  assert.deepStrictEqual(vm.globals.get('keys'), [1, 2, 3]);
  assert.deepStrictEqual(vm.globals.get('vals'), ['one', 'two', 'three']);
  console.log('  ✅ Test 4 Passed: Multiple assignment, atomic swap, and for-loop unpacking.');
}

// -------------------------------------------------------------
// Test 5: Lambdas & Builtins (zip, enumerate, all, any, reversed)
// -------------------------------------------------------------
console.log('\nTesting Lambdas & Python Iteration Builtins...');
{
  const src = `
f = lambda x, y: x * y + 5
calc = f(3, 4)

chars = ["a", "b", "c"]
indexed = []
for i, c in enumerate(chars):
    indexed.append([i, c])

z = zip([1, 2, 3], ["x", "y", "z"])
all_true = all([True, 1, "yes"])
any_true = any([False, 0, "hello"])
any_false = any([False, 0, ""])
`;
  const vm = runPython(src);
  assert.strictEqual(vm.globals.get('calc'), 17);
  assert.deepStrictEqual(vm.globals.get('indexed'), [[0, 'a'], [1, 'b'], [2, 'c']]);
  assert.deepStrictEqual(vm.globals.get('z'), [[1, 'x'], [2, 'y'], [3, 'z']]);
  assert.strictEqual(vm.globals.get('all_true'), true);
  assert.strictEqual(vm.globals.get('any_true'), true);
  assert.strictEqual(vm.globals.get('any_false'), false);
  console.log('  ✅ Test 5 Passed: First-class lambdas, enumerate, zip, all, any.');
}

// -------------------------------------------------------------
// Test 6: F-Strings (String Interpolation)
// -------------------------------------------------------------
console.log('\nTesting F-Strings (String Interpolation)...');
{
  const src = `
name = "Antigravity"
version = 2
variance = 12.345678
greeting = f"Welcome to {name} v{version + 1}!"
escaped = f"Escaped {{braces}} with val {10 * 5}"
formatted_float = f"VFS Variance: {variance:.4f}"
binary_padded = f"Bin: {42:b}, Pad: {7:04d}, Hex: {255:x}"
`;
  const vm = runPython(src);
  assert.strictEqual(vm.globals.get('greeting'), 'Welcome to Antigravity v3!');
  assert.strictEqual(vm.globals.get('escaped'), 'Escaped {braces} with val 50');
  assert.strictEqual(vm.globals.get('formatted_float'), 'VFS Variance: 12.3457');
  assert.strictEqual(vm.globals.get('binary_padded'), 'Bin: 101010, Pad: 0007, Hex: ff');
  console.log('  ✅ Test 6 Passed: F-strings with variables, format specifiers (:spec), and escaped braces.');
}

// -------------------------------------------------------------
// Test 7: Chained Comparisons & Membership (in, not in)
// -------------------------------------------------------------
console.log('\nTesting Chained Comparisons & Membership...');
{
  const src = `
x = 15
c1 = 10 < x < 20
c2 = 10 < x < 15
c3 = 10 <= x <= 15
c4 = 15 in [10, 15, 20]
c5 = 99 not in [10, 15, 20]
c6 = "grav" in "Antigravity"
`;
  const vm = runPython(src);
  assert.strictEqual(vm.globals.get('c1'), true);
  assert.strictEqual(vm.globals.get('c2'), false);
  assert.strictEqual(vm.globals.get('c3'), true);
  assert.strictEqual(vm.globals.get('c4'), true);
  assert.strictEqual(vm.globals.get('c5'), true);
  assert.strictEqual(vm.globals.get('c6'), true);
  console.log('  ✅ Test 7 Passed: Chained comparisons and in/not in membership testing.');
}

// -------------------------------------------------------------
// Test 8: Function Decorators (@decorator)
// -------------------------------------------------------------
console.log('\nTesting Decorators (@decorator syntax)...');
{
  const src = `
def double_output(fn):
    def wrapper(x):
        return fn(x) * 2
    return wrapper

@double_output
def compute(n):
    return n + 10

result = compute(5)
`;
  const vm = runPython(src);
  // compute(5) -> (5 + 10) * 2 = 30
  assert.strictEqual(vm.globals.get('result'), 30);
  console.log('  ✅ Test 8 Passed: Function decorators wrapping and re-binding.');
}

// -------------------------------------------------------------
// Test 9: Python Classes & OOP
// -------------------------------------------------------------
console.log('\nTesting Python Classes, Methods, and Self...');
{
  const src = `
class BankAccount:
    def __init__(self, owner, balance):
        self.owner = owner
        self.balance = balance

    def deposit(self, amount):
        self.balance += amount
        return self.balance

    def summary(self):
        return f"Account {self.owner}: balance={self.balance}"

acc = BankAccount("Ariel", 100)
new_bal = acc.deposit(50)
desc = acc.summary()
`;
  const vm = runPython(src);
  assert.strictEqual(vm.globals.get('new_bal'), 150);
  assert.strictEqual(vm.globals.get('desc'), 'Account Ariel: balance=150');
  console.log('  ✅ Test 9 Passed: Class instantiation, bound methods, self mutation, and f-strings.');
}

// -------------------------------------------------------------
// Test 10: Walrus Operator (:=)
// -------------------------------------------------------------
console.log('\nTesting Walrus Operator (:=)...');
{
  const src = `
data = [10, 20, 30]
if (n := len(data)) > 2:
    status = f"Found {n} items"
else:
    status = "Few items"
`;
  const vm = runPython(src);
  assert.strictEqual(vm.globals.get('n'), 3);
  assert.strictEqual(vm.globals.get('status'), 'Found 3 items');
  console.log('  ✅ Test 10 Passed: Walrus operator inside condition storing and propagating.');
}

console.log('\n🎉 ALL 10 MODERN PYTHON 3 ADVANCED FEATURES PASSED WITH FLYING COLORS!\n');
