// File: tests/test_python_round2_adversarial.js
import assert from 'assert';
import fs from 'fs';
import { preprocessPython } from '../js/frontend/python_preprocessor.js';
import { parsePythonSource } from '../js/frontend/python.js';
import { BytecodeCompiler } from '../js/vm/compiler.js';
import { VirtualMachine } from '../js/vm/vm.js';
import { ModuleManager } from '../js/vm/modules.js';

function executePythonTest(testDef) {
  const result = {
    id: testDef.id,
    name: testDef.name,
    category: testDef.category,
    source: testDef.source.trim(),
    passed: false,
    stage: 'SUCCESS',
    error: null,
    errorMessage: '',
    errorType: '',
    logs: [],
    globals: null
  };

  const logs = [];

  // Stage 1: Preprocessor
  let preprocessed = '';
  try {
    preprocessed = preprocessPython(testDef.source);
  } catch (err) {
    result.stage = 'PREPROCESSOR';
    result.error = err;
    result.errorType = err.name || 'Error';
    result.errorMessage = err.message || String(err);
    return result;
  }

  // Stage 2: Parser & Semantics
  let ast = null;
  try {
    ast = parsePythonSource(testDef.source);
  } catch (err) {
    result.stage = 'PARSER';
    result.error = err;
    result.errorType = err.name || 'SyntaxError';
    result.errorMessage = err.message || String(err);
    return result;
  }

  // Stage 3: Bytecode Compiler
  let program = null;
  try {
    const compiler = new BytecodeCompiler();
    program = compiler.compile(ast);
  } catch (err) {
    result.stage = 'COMPILER';
    result.error = err;
    result.errorType = err.name || 'Error';
    result.errorMessage = err.message || String(err);
    return result;
  }

  // Stage 4: Virtual Machine Execution
  let vm = null;
  try {
    const mm = new ModuleManager();
    vm = new VirtualMachine({
      moduleManager: mm,
      onPrint: (msg) => logs.push(msg)
    });
    const gen = vm.execute(program);
    let step = gen.next();
    while (!step.done) {
      step = gen.next();
    }
  } catch (err) {
    result.stage = 'VM_RUNTIME';
    result.error = err;
    result.errorType = err.name || 'Error';
    result.errorMessage = err.message || String(err);
    result.logs = logs;
    return result;
  }

  // Stage 5: Verification Assertions
  result.logs = logs;
  result.globals = vm.globals;

  try {
    if (testDef.verify) {
      testDef.verify(vm, logs);
    }
    result.passed = true;
    result.stage = 'SUCCESS';
  } catch (err) {
    result.stage = 'ASSERTION';
    result.error = err;
    result.errorType = err.name || 'AssertionError';
    result.errorMessage = err.message || String(err);
  }

  return result;
}

const tests = [
  // =========================================================================
  // 1. NESTED FUNCTIONS & CLOSURES
  // =========================================================================
  {
    id: 'ADV_CLOSURE_01',
    category: 'Nested Functions & Closures',
    name: '4-level nested closure scope propagation',
    source: `
def level1(a):
    def level2(b):
        def level3(c):
            def level4(d):
                return a * 1000 + b * 100 + c * 10 + d
            return level4
        return level3
    return level2

f2 = level1(5)
f3 = f2(4)
f4 = f3(3)
res = f4(2)
`,
    verify: (vm) => {
      assert.strictEqual(vm.globals.get('res'), 5432);
    }
  },
  {
    id: 'ADV_CLOSURE_02',
    category: 'Nested Functions & Closures',
    name: 'Closure factory inside loop generating independent functions',
    source: `
def make_multiplier(factor):
    def mult(x):
        return x * factor
    return mult

funcs = [make_multiplier(i) for i in range(5)]
products = [f(10) for f in funcs]
`,
    verify: (vm) => {
      assert.deepStrictEqual(vm.globals.get('products'), [0, 10, 20, 30, 40]);
    }
  },
  {
    id: 'ADV_CLOSURE_03',
    category: 'Nested Functions & Closures',
    name: 'Multiple closures sharing mutable encapsulated state dictionary',
    source: `
def create_account(initial_balance):
    state = {"balance": initial_balance, "history": []}
    def deposit(amount):
        state["balance"] = state["balance"] + amount
        state["history"].append("+" + str(amount))
        return state["balance"]
    def withdraw(amount):
        if state["balance"] >= amount:
            state["balance"] = state["balance"] - amount
            state["history"].append("-" + str(amount))
            return state["balance"]
        return -1
    def get_history():
        return state["history"]
    return [deposit, withdraw, get_history]

ops = create_account(100)
dep = ops[0]
wth = ops[1]
hist = ops[2]

d1 = dep(50)
w1 = wth(30)
w2 = wth(200)
h = hist()
`,
    verify: (vm) => {
      assert.strictEqual(vm.globals.get('d1'), 150);
      assert.strictEqual(vm.globals.get('w1'), 120);
      assert.strictEqual(vm.globals.get('w2'), -1);
      assert.deepStrictEqual(vm.globals.get('h'), ['+50', '-30']);
    }
  },
  {
    id: 'ADV_CLOSURE_04',
    category: 'Nested Functions & Closures',
    name: 'Closure accessing enclosing local and mutating global state',
    source: `
counter = 0

def make_logger(tag):
    def log(msg):
        global counter
        counter = counter + 1
        return "[" + tag + " #" + str(counter) + "] " + msg
    return log

log_sys = make_logger("SYS")
log_app = make_logger("APP")

m1 = log_sys("Start")
m2 = log_app("Init")
m3 = log_sys("Done")
`,
    verify: (vm) => {
      assert.strictEqual(vm.globals.get('m1'), '[SYS #1] Start');
      assert.strictEqual(vm.globals.get('m2'), '[APP #2] Init');
      assert.strictEqual(vm.globals.get('m3'), '[SYS #3] Done');
      assert.strictEqual(vm.globals.get('counter'), 3);
    }
  },
  {
    id: 'ADV_CLOSURE_05',
    category: 'Nested Functions & Closures',
    name: 'Recursive helper function defined inside enclosing function',
    source: `
def combinations_count(n, r):
    def factorial(k):
        if k <= 1:
            return 1
        return k * factorial(k - 1)
    return factorial(n) // (factorial(r) * factorial(n - r))

c5_2 = combinations_count(5, 2)
c6_3 = combinations_count(6, 3)
`,
    verify: (vm) => {
      assert.strictEqual(vm.globals.get('c5_2'), 10);
      assert.strictEqual(vm.globals.get('c6_3'), 20);
    }
  },

  // =========================================================================
  // 2. COMPLEX CLASS HIERARCHIES & OOP
  // =========================================================================
  {
    id: 'ADV_OOP_01',
    category: 'Complex Class Hierarchies',
    name: '3-level inheritance chain (Grandparent -> Parent -> Child)',
    source: `
class Grandparent:
    def __init__(self, name):
        self.name = name
        self.generation = 1

    def info(self):
        return self.name + " (Gen " + str(self.generation) + ")"

    def base_greeting(self):
        return "Greetings from " + self.name

class Parent(Grandparent):
    def __init__(self, name, occupation):
        self.name = name
        self.occupation = occupation
        self.generation = 2

    def get_job(self):
        return self.occupation

class Child(Parent):
    def __init__(self, name, occupation, school):
        self.name = name
        self.occupation = occupation
        self.school = school
        self.generation = 3

    def get_school(self):
        return self.school

g = Grandparent("Alice")
p = Parent("Bob", "Architect")
c = Child("Charlie", "Intern", "Stanford")

g_info = g.info()
p_info = p.info()
c_info = c.info()

c_job = c.get_job()
c_school = c.get_school()
c_greet = c.base_greeting()
`,
    verify: (vm) => {
      assert.strictEqual(vm.globals.get('g_info'), 'Alice (Gen 1)');
      assert.strictEqual(vm.globals.get('p_info'), 'Bob (Gen 2)');
      assert.strictEqual(vm.globals.get('c_info'), 'Charlie (Gen 3)');
      assert.strictEqual(vm.globals.get('c_job'), 'Intern');
      assert.strictEqual(vm.globals.get('c_school'), 'Stanford');
      assert.strictEqual(vm.globals.get('c_greet'), 'Greetings from Charlie');
    }
  },
  {
    id: 'ADV_OOP_02',
    category: 'Complex Class Hierarchies',
    name: 'Polymorphic method dispatch over heterogeneous list of instances',
    source: `
class Grandparent:
    def __init__(self, name):
        self.name = name

    def role(self):
        return "Elder"

class Parent(Grandparent):
    def role(self):
        return "Guardian"

class Child(Parent):
    def role(self):
        return "Junior"

roster = [Grandparent("G"), Parent("P"), Child("C")]
roles = [member.role() for member in roster]
`,
    verify: (vm) => {
      assert.deepStrictEqual(vm.globals.get('roles'), ['Elder', 'Guardian', 'Junior']);
    }
  },
  {
    id: 'ADV_OOP_03',
    category: 'Complex Class Hierarchies',
    name: 'Virtual method dispatch via base template method pattern',
    source: `
class Shape:
    def __init__(self, color):
        self.color = color

    def area(self):
        return 0

    def describe(self):
        return self.color + " shape with area=" + str(self.area())

class Rectangle(Shape):
    def __init__(self, color, w, h):
        self.color = color
        self.w = w
        self.h = h

    def area(self):
        return self.w * self.h

class Square(Rectangle):
    def __init__(self, color, side):
        self.color = color
        self.w = side
        self.h = side

s = Square("blue", 5)
desc = s.describe()
area_val = s.area()
`,
    verify: (vm) => {
      assert.strictEqual(vm.globals.get('area_val'), 25);
      assert.strictEqual(vm.globals.get('desc'), 'blue shape with area=25');
    }
  },
  {
    id: 'ADV_OOP_04',
    category: 'Complex Class Hierarchies',
    name: 'Inherited method modifying instance attributes across levels',
    source: `
class BankAccount:
    def __init__(self, owner, balance):
        self.owner = owner
        self.balance = balance

    def deposit(self, amt):
        self.balance = self.balance + amt
        return self.balance

class SavingsAccount(BankAccount):
    def add_interest(self, rate):
        interest = self.balance * rate
        self.balance = self.balance + interest
        return self.balance

class HighYieldSavings(SavingsAccount):
    def apply_bonus(self, bonus):
        self.balance = self.balance + bonus
        return self.balance

acct = HighYieldSavings("Ariel", 1000)
acct.deposit(500)
acct.add_interest(0.10)
acct.apply_bonus(50)
final_bal = acct.balance
`,
    verify: (vm) => {
      assert.strictEqual(vm.globals.get('final_bal'), 1700);
    }
  },
  {
    id: 'ADV_OOP_05',
    category: 'Complex Class Hierarchies',
    name: 'Class composition: container class managing instances of subclasses',
    source: `
class Item:
    def __init__(self, name, price):
        self.name = name
        self.price = price

class DiscountItem(Item):
    def __init__(self, name, price, discount):
        self.name = name
        self.price = price - discount

class Cart:
    def __init__(self):
        self.item_list = []

    def add(self, item):
        self.item_list.append(item)

    def total(self):
        t = 0
        for it in self.item_list:
            t = t + it.price
        return t

cart = Cart()
cart.add(Item("Book", 20))
cart.add(DiscountItem("Pen", 10, 3))
cart.add(DiscountItem("Bag", 50, 15))
cart_total = cart.total()
`,
    verify: (vm) => {
      assert.strictEqual(vm.globals.get('cart_total'), 62);
    }
  },

  // =========================================================================
  // 3. COMPLEX EXCEPTION FLOWS
  // =========================================================================
  {
    id: 'ADV_EXC_01',
    category: 'Complex Exception Flows',
    name: 'Nested try blocks escalating different exception types',
    source: `
events = []

try:
    events.append("outer_start")
    try:
        events.append("inner_start")
        raise ValueError("inner problem")
    except ValueError as ve:
        events.append("caught_inner: " + str(ve))
        raise TypeError("escalated problem")
    finally:
        events.append("inner_finally")
except TypeError as te:
    events.append("caught_outer: " + str(te))
finally:
    events.append("outer_finally")
`,
    verify: (vm) => {
      const events = vm.globals.get('events');
      assert.strictEqual(events[0], 'outer_start');
      assert.strictEqual(events[1], 'inner_start');
      assert.strictEqual(events[2].includes('inner problem'), true);
      assert.strictEqual(events[3].includes('escalated problem'), true);
      assert.strictEqual(events[4], 'outer_finally');
    }
  },
  {
    id: 'ADV_EXC_02',
    category: 'Complex Exception Flows',
    name: 'Try/except block nested inside an except handler (recovery)',
    source: `
log = []
try:
    log.append("try1")
    raise KeyError("first_error")
except KeyError as k:
    log.append("caught_first: " + str(k))
    try:
        log.append("try_recovery")
        raise IndexError("second_error")
    except IndexError as idx_err:
        log.append("caught_recovery: " + str(idx_err))
    finally:
        log.append("finally_recovery")
finally:
    log.append("finally_outer")
`,
    verify: (vm) => {
      const log = vm.globals.get('log');
      assert.strictEqual(log[0], 'try1');
      assert.strictEqual(log[1].includes('first_error'), true);
      assert.strictEqual(log[2], 'try_recovery');
      assert.strictEqual(log[3].includes('second_error'), true);
      assert.strictEqual(log[4], 'finally_recovery');
      assert.strictEqual(log[5], 'finally_outer');
    }
  },
  {
    id: 'ADV_EXC_03',
    category: 'Complex Exception Flows',
    name: 'Try/except block nested inside a finally block (guarded cleanup)',
    source: `
trace = []
try:
    trace.append("primary_work")
finally:
    trace.append("cleanup_start")
    try:
        trace.append("sub_cleanup")
        raise ValueError("cleanup_glitch")
    except ValueError as e:
        trace.append("handled_glitch: " + str(e))
    trace.append("cleanup_done")
`,
    verify: (vm) => {
      const trace = vm.globals.get('trace');
      assert.strictEqual(trace[0], 'primary_work');
      assert.strictEqual(trace[1], 'cleanup_start');
      assert.strictEqual(trace[2], 'sub_cleanup');
      assert.strictEqual(trace[3].includes('cleanup_glitch'), true);
      assert.strictEqual(trace[4], 'cleanup_done');
    }
  },
  {
    id: 'ADV_EXC_04',
    category: 'Complex Exception Flows',
    name: 'Exception during sequence unpacking of None target',
    source: `
trapped = False
try:
    a, b, c = None
except TypeError:
    trapped = True
`,
    verify: (vm) => {
      assert.strictEqual(vm.globals.get('trapped'), true);
    }
  },
  {
    id: 'ADV_EXC_05',
    category: 'Complex Exception Flows',
    name: 'Exception raised by function call during sequence unpacking RHS evaluation',
    source: `
def parse_record(s):
    if len(s) < 3:
        raise ValueError("Record too short: " + s)
    return [s[0], s[1], s[2]]

records = ["abc", "x", "def"]
successes = []
failures = []

for rec in records:
    try:
        r1, r2, r3 = parse_record(rec)
        successes.append(r1 + r2 + r3)
    except ValueError as e:
        failures.append(str(e))
`,
    verify: (vm) => {
      assert.deepStrictEqual(vm.globals.get('successes'), ['abc', 'def']);
      assert.strictEqual(vm.globals.get('failures').length, 1);
      assert.strictEqual(vm.globals.get('failures')[0].includes('Record too short: x'), true);
    }
  },

  // =========================================================================
  // 4. ADVANCED COMPREHENSIONS & EXPRESSIONS
  // =========================================================================
  {
    id: 'ADV_COMP_01',
    category: 'Advanced Comprehensions & Expressions',
    name: '2D nested list comprehension generating multiplication grid',
    source: `
grid = [[x * y for x in range(4)] for y in range(4)]
`,
    verify: (vm) => {
      assert.deepStrictEqual(vm.globals.get('grid'), [
        [0, 0, 0, 0],
        [0, 1, 2, 3],
        [0, 2, 4, 6],
        [0, 3, 6, 9]
      ]);
    }
  },
  {
    id: 'ADV_COMP_02',
    category: 'Advanced Comprehensions & Expressions',
    name: '3D nested list comprehension generating 3D coordinate tensor',
    source: `
tensor = [[[x + y + z for x in range(2)] for y in range(2)] for z in range(2)]
`,
    verify: (vm) => {
      assert.deepStrictEqual(vm.globals.get('tensor'), [
        [[0, 1], [1, 2]],
        [[1, 2], [2, 3]]
      ]);
    }
  },
  {
    id: 'ADV_COMP_03',
    category: 'Advanced Comprehensions & Expressions',
    name: 'Comprehension chaining (filtering output of inner list comprehension)',
    source: `
filtered = [x * 2 for x in [y + 10 for y in range(8)] if x % 3 == 0]
`,
    verify: (vm) => {
      assert.deepStrictEqual(vm.globals.get('filtered'), [24, 30]);
    }
  },
  {
    id: 'ADV_COMP_04',
    category: 'Advanced Comprehensions & Expressions',
    name: 'Dict comprehension with dynamic key construction and filtering',
    source: `
squares = {str(k): k * k for k in range(10) if k % 2 != 0}
`,
    verify: (vm) => {
      assert.deepStrictEqual(vm.globals.get('squares'), {
        '1': 1,
        '3': 9,
        '5': 25,
        '7': 49,
        '9': 81
      });
    }
  },
  {
    id: 'ADV_COMP_05',
    category: 'Advanced Comprehensions & Expressions',
    name: 'Deeply nested ternary conditional expressions with multiple fallbacks',
    source: `
def grade(score):
    return "A" if score >= 90 else "B" if score >= 80 else "C" if score >= 70 else "D" if score >= 60 else "F"

g1 = grade(95)
g2 = grade(83)
g3 = grade(72)
g4 = grade(65)
g5 = grade(40)
grades = [g1, g2, g3, g4, g5]
`,
    verify: (vm) => {
      assert.deepStrictEqual(vm.globals.get('grades'), ['A', 'B', 'C', 'D', 'F']);
    }
  },
  {
    id: 'ADV_COMP_06',
    category: 'Advanced Comprehensions & Expressions',
    name: 'Complex arithmetic, floor division, modulo, and bitwise precedence',
    source: `
a = 15
b = 4
c = 7

val1 = (a // b) * b + (a % b)
val2 = (a & c) + (a | c) - (a ^ c)
val3 = pow(2, 3) * 4 + 16 // 2
`,
    verify: (vm) => {
      assert.strictEqual(vm.globals.get('val1'), 15);
      assert.strictEqual(vm.globals.get('val2'), 2 * (15 & 7));
      assert.strictEqual(vm.globals.get('val3'), 40);
    }
  },

  // =========================================================================
  // 5. PYTHONIC DATA STRUCTURE OPERATIONS
  // =========================================================================
  {
    id: 'ADV_DATA_01',
    category: 'Data Structure Operations',
    name: 'Dictionary mutations inside while loops (pop, add, update)',
    source: `
d = {"k1": 10, "k2": 20, "k3": 30, "k4": 40}
order = ["k1", "k2", "k3", "k4"]
evens = []
i = 0

while i < len(order):
    key = order[i]
    val = d[key]
    if val % 20 == 0:
        evens.append(d.pop(key))
    else:
        d["doubled_" + key] = val * 2
    i = i + 1
`,
    verify: (vm) => {
      assert.deepStrictEqual(vm.globals.get('evens'), [20, 40]);
      const d = vm.globals.get('d');
      assert.strictEqual(d['k1'], 10);
      assert.strictEqual(d['k3'], 30);
      assert.strictEqual(d['doubled_k1'], 20);
      assert.strictEqual(d['doubled_k3'], 60);
      assert.strictEqual(d['k2'], undefined);
      assert.strictEqual(d['k4'], undefined);
    }
  },
  {
    id: 'ADV_DATA_02',
    category: 'Data Structure Operations',
    name: 'Advanced list slicing with negative steps and sub-ranges',
    source: `
nums = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
rev_full = nums[::-1]
rev_sub = nums[8:2:-2]
rev_neg = nums[-2:-8:-2]
`,
    verify: (vm) => {
      assert.deepStrictEqual(vm.globals.get('rev_full'), [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]);
      assert.deepStrictEqual(vm.globals.get('rev_sub'), [8, 6, 4]);
      assert.deepStrictEqual(vm.globals.get('rev_neg'), [8, 6, 4]);
    }
  },
  {
    id: 'ADV_DATA_03',
    category: 'Data Structure Operations',
    name: 'List and string slicing with extreme out-of-bounds indices',
    source: `
data = [10, 20, 30, 40]
s_pos = data[-1000:1000:1]
s_rev = data[1000:-1000:-1]

text = "PYTHON"
t_pos = text[-500:500:2]
t_rev = text[500:-500:-2]
`,
    verify: (vm) => {
      assert.deepStrictEqual(vm.globals.get('s_pos'), [10, 20, 30, 40]);
      assert.deepStrictEqual(vm.globals.get('s_rev'), [40, 30, 20, 10]);
      assert.strictEqual(vm.globals.get('t_pos'), 'PTO');
      assert.strictEqual(vm.globals.get('t_rev'), 'NHY');
    }
  },
  {
    id: 'ADV_DATA_04',
    category: 'Data Structure Operations',
    name: 'Function definition with positional, default, and rest arguments (*args)',
    source: `
def format_log(level, *messages):
    body = " ".join([str(m) for m in messages])
    return "[" + level + "] " + body

l1 = format_log("INFO", "Server", "started", "on", 8080)
l2 = format_log("WARN")
`,
    verify: (vm) => {
      assert.strictEqual(vm.globals.get('l1'), '[INFO] Server started on 8080');
      assert.strictEqual(vm.globals.get('l2'), '[WARN] ');
    }
  },
  {
    id: 'ADV_DATA_05',
    category: 'Data Structure Operations',
    name: 'Call-site spread unpacking mixed with positional arguments',
    source: `
def accumulate(head, *items):
    res = head
    for x in items:
        res = res + x
    return res

middle = [2, 3, 4]
res1 = accumulate(1, *middle, 5)
res2 = accumulate(10, *[20, 30])
`,
    verify: (vm) => {
      assert.strictEqual(vm.globals.get('res1'), 15);
      assert.strictEqual(vm.globals.get('res2'), 60);
    }
  },
  {
    id: 'ADV_DATA_06',
    category: 'Data Structure Operations',
    name: 'Multiple sequence unpacking and parallel swap inside iteration',
    source: `
a, b = 0, 1
fib_seq = [a, b]
i = 0
while i < 8:
    a, b = b, a + b
    fib_seq.append(b)
    i = i + 1
`,
    verify: (vm) => {
      assert.deepStrictEqual(vm.globals.get('fib_seq'), [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]);
    }
  },

  // =========================================================================
  // 6. STRING INTERPOLATION & METHOD CHAINING
  // =========================================================================
  {
    id: 'ADV_STR_01',
    category: 'String Interpolation & Method Chaining',
    name: 'Multiple f-strings with arithmetic expressions and function calls',
    source: `
x = 12
y = 5
label = "Calculations"

msg = f"{label}: x={x}, y={y}, sum={x + y}, diff={x - y}, prod={x * y}"
`,
    verify: (vm) => {
      assert.strictEqual(vm.globals.get('msg'), 'Calculations: x=12, y=5, sum=17, diff=7, prod=60');
    }
  },
  {
    id: 'ADV_STR_02',
    category: 'String Interpolation & Method Chaining',
    name: 'Deep method chaining on strings (strip, replace, lower, split, join)',
    source: `
raw = "   ==> Alpha, BETA , Gamma, DELTA <==   "
cleaned = raw.strip().strip("<=> ").replace(" ", "").lower()
parts = cleaned.split(",")
rejoined = "::".join(parts)
`,
    verify: (vm) => {
      assert.strictEqual(vm.globals.get('cleaned'), 'alpha,beta,gamma,delta');
      assert.deepStrictEqual(vm.globals.get('parts'), ['alpha', 'beta', 'gamma', 'delta']);
      assert.strictEqual(vm.globals.get('rejoined'), 'alpha::beta::gamma::delta');
    }
  },
  {
    id: 'ADV_STR_03',
    category: 'String Interpolation & Method Chaining',
    name: 'F-strings with numeric format specifiers (fixed decimal, width)',
    source: `
pi_val = 3.14159265
price = 49.9
formatted = f"PI={pi_val:.3f}, Price={price:.2f}"
`,
    verify: (vm) => {
      assert.strictEqual(vm.globals.get('formatted'), 'PI=3.142, Price=49.90');
    }
  },
  {
    id: 'ADV_STR_04',
    category: 'String Interpolation & Method Chaining',
    name: 'String joining of transformed comprehension outputs with method chaining',
    source: `
entries = ["  admin  ", "  GUEST ", " root ", "  user123 "]
processed = "-".join([e.strip().upper() for e in entries if len(e.strip()) <= 5])
`,
    verify: (vm) => {
      assert.strictEqual(vm.globals.get('processed'), 'ADMIN-GUEST-ROOT');
    }
  },

  // =========================================================================
  // 7. STANDARD LIBRARY INTERACTIONS & PIPELINE
  // =========================================================================
  {
    id: 'ADV_STDLIB_01',
    category: 'Standard Library Pipeline',
    name: 'Multi-module realistic pipeline (json, math, random, re, statistics)',
    source: `
import json
import math
import random
import re
import statistics

raw_logs = [
    "LOG [2026-09-06 10:00] SENSOR_1: temp=22.50C status=HEALTHY cpu=12%",
    "LOG [2026-09-06 10:01] SENSOR_2: temp=24.10C status=HEALTHY cpu=18%",
    "LOG [2026-09-06 10:02] SENSOR_3: temp=21.80C status=HEALTHY cpu=15%",
    "LOG [2026-09-06 10:03] SENSOR_4: temp=28.40C status=WARNING cpu=85%",
    "LOG [2026-09-06 10:04] SENSOR_5: temp=23.20C status=HEALTHY cpu=22%"
]

temperatures = []
cpu_loads = []
statuses = []

for log in raw_logs:
    temp_match = re.search("temp=([0-9.]+)C", log)
    temp_num = float(re.sub("[^0-9.]", "", temp_match))
    temperatures.append(temp_num)

    cpu_match = re.search("cpu=([0-9]+)%", log)
    cpu_num = int(re.sub("[^0-9]", "", cpu_match))
    cpu_loads.append(cpu_num)

    st_match = re.search("status=([A-Z]+)", log)
    statuses.append(re.sub("status=", "", st_match))

# Simulate random perturbation
perturbed = []
for t in temperatures:
    noise = (random.random() - 0.5) * 0.1
    perturbed.append(t + noise)

mean_temp = statistics.mean(temperatures)
median_temp = statistics.median(temperatures)
var_temp = statistics.variance(temperatures)
std_temp = statistics.stdev(temperatures)
mean_cpu = statistics.mean(cpu_loads)

rounded_mean_temp = math.floor(mean_temp * 100) / 100
sqrt_var = math.sqrt(var_temp)
stdev_check = math.fabs(sqrt_var - std_temp) < 0.0001

summary = {
    "sensor_count": len(temperatures),
    "mean_temp": rounded_mean_temp,
    "median_temp": median_temp,
    "std_dev_temp": math.floor(std_temp * 100) / 100,
    "mean_cpu": mean_cpu,
    "stdev_consistent": stdev_check,
    "healthy_count": len([s for s in statuses if s == "HEALTHY"])
}

json_string = json.dumps(summary)
parsed_doc = json.loads(json_string)
`,
    verify: (vm) => {
      const doc = vm.globals.get('parsed_doc');
      assert.strictEqual(doc['sensor_count'], 5);
      assert.strictEqual(doc['mean_temp'], 24);
      assert.strictEqual(doc['median_temp'], 23.2);
      assert.strictEqual(doc['mean_cpu'], 30.4);
      assert.strictEqual(doc['stdev_consistent'], true);
      assert.strictEqual(doc['healthy_count'], 4);
    }
  },
  {
    id: 'ADV_STDLIB_02',
    category: 'Standard Library Pipeline',
    name: 'Regex extraction, text substitution, and JSON configuration parser',
    source: `
import re
import json

raw_config = "host: '127.0.0.1'; port: 8080; debug: true; tags: 'alpha, beta, gamma';"

lines = [l.strip() for l in raw_config.split(";") if len(l.strip()) > 0]
conf = {}

for line in lines:
    parts = line.split(":")
    if len(parts) == 2:
        k = parts[0].strip()
        v = parts[1].strip()
        v = re.sub("^'|'$", "", v)
        if v == "true":
            conf[k] = True
        elif v == "false":
            conf[k] = False
        elif v.isdigit():
            conf[k] = int(v)
        else:
            conf[k] = v

json_payload = json.dumps(conf)
reloaded = json.loads(json_payload)
`,
    verify: (vm) => {
      const reloaded = vm.globals.get('reloaded');
      assert.strictEqual(reloaded['host'], '127.0.0.1');
      assert.strictEqual(reloaded['port'], 8080);
      assert.strictEqual(reloaded['debug'], true);
      assert.strictEqual(reloaded['tags'], 'alpha, beta, gamma');
    }
  },
  {
    id: 'ADV_STDLIB_03',
    category: 'Standard Library Pipeline',
    name: 'Statistical distribution and mathematical transformations',
    source: `
import math
import statistics

dataset = [10, 12, 23, 23, 16, 23, 21, 16]
m = statistics.mean(dataset)
med = statistics.median(dataset)
v = statistics.variance(dataset)
s = statistics.stdev(dataset)

norm_z = [(x - m) / s for x in dataset]
z_mean = statistics.mean(norm_z)
z_mean_near_zero = math.fabs(z_mean) < 0.0001
`,
    verify: (vm) => {
      assert.strictEqual(vm.globals.get('m'), 18);
      assert.strictEqual(vm.globals.get('med'), 18.5);
      assert.strictEqual(vm.globals.get('z_mean_near_zero'), true);
    }
  },

  // =========================================================================
  // 8. ADDITIONAL SYSTEM-LEVEL CONSTRUCTS
  // =========================================================================
  {
    id: 'ADV_SYS_01',
    category: 'System Constructs',
    name: 'Nested context managers (with open) reading and writing distinct VFS files',
    source: `
with open("source_a.txt", "w") as fa:
    fa.write("ALPHA_PAYLOAD")

with open("source_b.txt", "w") as fb:
    fb.write("BETA_PAYLOAD")

merged = ""
with open("source_a.txt", "r") as ra:
    with open("source_b.txt", "r") as rb:
        merged = ra.read() + "::" + rb.read()
`,
    verify: (vm) => {
      assert.strictEqual(vm.globals.get('merged'), 'ALPHA_PAYLOAD::BETA_PAYLOAD');
    }
  },
  {
    id: 'ADV_SYS_02',
    category: 'System Constructs',
    name: 'Short-circuit boolean logic avoiding runtime zero division errors',
    source: `
sc_or = True or (1 / 0)
sc_and = False and (1 / 0)
sc_list_or = [1, 2] or (1 / 0)
sc_list_and = [] and (1 / 0)
`,
    verify: (vm) => {
      assert.strictEqual(vm.globals.get('sc_or'), true);
      assert.strictEqual(vm.globals.get('sc_and'), false);
      assert.deepStrictEqual(vm.globals.get('sc_list_or'), [1, 2]);
      assert.deepStrictEqual(vm.globals.get('sc_list_and'), []);
    }
  }
];

console.log('================================================================');
console.log('  UNIVERSAL PYTHON 3 COMPILER & RUNTIME ADVERSARIAL TEST SUITE');
console.log('                       ROUND 2 STRESS TESTS');
console.log('================================================================\n');

const results = [];
let passCount = 0;
let failCount = 0;

for (const t of tests) {
  const res = executePythonTest(t);
  results.push(res);
  if (res.passed) {
    passCount++;
    console.log(`✅ [PASS] ${res.id}: ${res.name} (${res.category})`);
  } else {
    failCount++;
    console.log(`❌ [FAIL - ${res.stage}] ${res.id}: ${res.name} (${res.category})`);
    console.log(`   Error [${res.errorType}]: ${res.errorMessage.split('\n')[0]}`);
  }
}

console.log('\n================================================================');
console.log(`TEST SUMMARY: Total: ${tests.length} | Passed: ${passCount} | Failed: ${failCount}`);
console.log('================================================================\n');

// Export JSON summary for analysis
fs.writeFileSync('tests/round2_adversarial_results.json', JSON.stringify(results, null, 2));

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
