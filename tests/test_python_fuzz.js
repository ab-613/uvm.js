// File: tests/test_python_fuzz.js
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
  // 1. ALGORITHMIC CODE
  // =========================================================================
  {
    id: 'ALGO_01',
    category: 'Algorithms',
    name: 'Recursive Backtracking: N-Queens (4 Queens count)',
    source: `
count = 0

def is_safe(board, row, col):
    i = 0
    while i < row:
        c = board[i]
        if c == col:
            return False
        if abs(c - col) == abs(i - row):
            return False
        i = i + 1
    return True

def solve_n_queens(board, row, n):
    global count
    if row == n:
        count = count + 1
        return
    col = 0
    while col < n:
        if is_safe(board, row, col):
            board[row] = col
            solve_n_queens(board, row + 1, n)
            board[row] = -1
        col = col + 1

board = [-1, -1, -1, -1]
solve_n_queens(board, 0, 4)
`,
    verify: (vm) => {
      assert.strictEqual(vm.globals.get('count'), 2);
    }
  },
  {
    id: 'ALGO_02',
    category: 'Algorithms',
    name: 'Recursive Quicksort',
    source: `
def quicksort(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[0]
    less = []
    greater = []
    i = 1
    while i < len(arr):
        if arr[i] <= pivot:
            less.append(arr[i])
        else:
            greater.append(arr[i])
        i = i + 1
    sorted_less = quicksort(less)
    sorted_greater = quicksort(greater)
    res = []
    for x in sorted_less:
        res.append(x)
    res.append(pivot)
    for x in sorted_greater:
        res.append(x)
    return res

data = [38, 27, 43, 3, 9, 82, 10]
sorted_data = quicksort(data)
`,
    verify: (vm) => {
      assert.deepStrictEqual(vm.globals.get('sorted_data'), [3, 9, 10, 27, 38, 43, 82]);
    }
  },
  {
    id: 'ALGO_03',
    category: 'Algorithms',
    name: 'Binary Search (Iterative)',
    source: `
def binary_search(arr, target):
    low = 0
    high = len(arr) - 1
    while low <= high:
        mid = (low + high) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            low = mid + 1
        else:
            high = mid - 1
    return -1

nums = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91]
found_idx = binary_search(nums, 23)
missing_idx = binary_search(nums, 50)
`,
    verify: (vm) => {
      assert.strictEqual(vm.globals.get('found_idx'), 5);
      assert.strictEqual(vm.globals.get('missing_idx'), -1);
    }
  },
  {
    id: 'ALGO_04',
    category: 'Algorithms',
    name: 'Graph BFS Traversal (Shortest Path Length)',
    source: `
graph = {
    "A": ["B", "C"],
    "B": ["A", "D", "E"],
    "C": ["A", "F"],
    "D": ["B"],
    "E": ["B", "F"],
    "F": ["C", "E"]
}

def bfs_dist(graph, start, goal):
    queue = [[start, 0]]
    visited = [start]
    while len(queue) > 0:
        curr = queue.pop(0)
        node = curr[0]
        dist = curr[1]
        if node == goal:
            return dist
        neighbors = graph[node]
        for neighbor in neighbors:
            if neighbor not in visited:
                visited.append(neighbor)
                queue.append([neighbor, dist + 1])
    return -1

dist_a_to_f = bfs_dist(graph, "A", "F")
dist_a_to_d = bfs_dist(graph, "A", "D")
`,
    verify: (vm) => {
      assert.strictEqual(vm.globals.get('dist_a_to_f'), 2);
      assert.strictEqual(vm.globals.get('dist_a_to_d'), 2);
    }
  },
  {
    id: 'ALGO_05',
    category: 'Algorithms',
    name: 'Graph DFS Traversal (Reachability)',
    source: `
adj = {
    "1": ["2", "3"],
    "2": ["4"],
    "3": [],
    "4": ["1"]
}

def dfs_has_path(start, target, visited):
    if start == target:
        return True
    visited.append(start)
    neighbors = adj[start]
    for nxt in neighbors:
        if nxt not in visited:
            if dfs_has_path(nxt, target, visited):
                return True
    return False

p1 = dfs_has_path("1", "4", [])
p2 = dfs_has_path("3", "4", [])
`,
    verify: (vm) => {
      assert.strictEqual(vm.globals.get('p1'), true);
      assert.strictEqual(vm.globals.get('p2'), false);
    }
  },
  {
    id: 'ALGO_06',
    category: 'Algorithms',
    name: 'Matrix Multiplication (2D Lists)',
    source: `
def matmul(A, B):
    rows_A = len(A)
    cols_A = len(A[0])
    rows_B = len(B)
    cols_B = len(B[0])
    C = []
    i = 0
    while i < rows_A:
        row = []
        j = 0
        while j < cols_B:
            val = 0
            k = 0
            while k < cols_A:
                val = val + A[i][k] * B[k][j]
                k = k + 1
            row.append(val)
            j = j + 1
        C.append(row)
        i = i + 1
    return C

A = [[1, 2], [3, 4]]
B = [[5, 6], [7, 8]]
res = matmul(A, B)
`,
    verify: (vm) => {
      assert.deepStrictEqual(vm.globals.get('res'), [[19, 22], [43, 50]]);
    }
  },
  {
    id: 'ALGO_07',
    category: 'Algorithms',
    name: 'Matrix Transpose',
    source: `
def transpose(mat):
    rows = len(mat)
    cols = len(mat[0])
    trans = []
    c = 0
    while c < cols:
        new_row = []
        r = 0
        while r < rows:
            new_row.append(mat[r][c])
            r = r + 1
        trans.append(new_row)
        c = c + 1
    return trans

M = [[1, 2, 3], [4, 5, 6]]
T = transpose(M)
`,
    verify: (vm) => {
      assert.deepStrictEqual(vm.globals.get('T'), [[1, 4], [2, 5], [3, 6]]);
    }
  },

  // =========================================================================
  // 2. DEFAULT ARGUMENTS IN FUNCTION DEFINITIONS
  // =========================================================================
  {
    id: 'DEF_ARG_01',
    category: 'Default Arguments',
    name: 'Single default argument (trailing)',
    source: `
def add(a, b=10):
    return a + b

call1 = add(5)
call2 = add(5, 20)
`,
    verify: (vm) => {
      assert.strictEqual(vm.globals.get('call1'), 15);
      assert.strictEqual(vm.globals.get('call2'), 25);
    }
  },
  {
    id: 'DEF_ARG_02',
    category: 'Default Arguments',
    name: 'Multiple default arguments',
    source: `
def greet(name, greeting="Hello", punctuation="!"):
    return greeting + ", " + name + punctuation

res1 = greet("Alice")
res2 = greet("Bob", "Hi")
res3 = greet("Charlie", "Hey", "?")
`,
    verify: (vm) => {
      assert.strictEqual(vm.globals.get('res1'), 'Hello, Alice!');
      assert.strictEqual(vm.globals.get('res2'), 'Hi, Bob!');
      assert.strictEqual(vm.globals.get('res3'), 'Hey, Charlie?');
    }
  },
  {
    id: 'DEF_ARG_03',
    category: 'Default Arguments',
    name: 'All default arguments',
    source: `
def calc(x=1, y=2, z=3):
    return x * 100 + y * 10 + z

val0 = calc()
val1 = calc(5)
val2 = calc(5, 6)
val3 = calc(5, 6, 7)
`,
    verify: (vm) => {
      assert.strictEqual(vm.globals.get('val0'), 123);
      assert.strictEqual(vm.globals.get('val1'), 523);
      assert.strictEqual(vm.globals.get('val2'), 563);
      assert.strictEqual(vm.globals.get('val3'), 567);
    }
  },

  // =========================================================================
  // 3. TRY / EXCEPT / ELSE / FINALLY VARIATIONS
  // =========================================================================
  {
    id: 'TRY_01',
    category: 'Exceptions',
    name: 'Try with single except and without finally',
    source: `
caught = False
try:
    x = 10 / 0
except:
    caught = True
`,
    verify: (vm) => {
      assert.strictEqual(vm.globals.get('caught'), true);
    }
  },
  {
    id: 'TRY_02',
    category: 'Exceptions',
    name: 'Try with multiple except blocks (matching first)',
    source: `
tag = ""
try:
    raise ValueError("bad value")
except ValueError:
    tag = "caught_value_error"
except TypeError:
    tag = "caught_type_error"
`,
    verify: (vm) => {
      assert.strictEqual(vm.globals.get('tag'), 'caught_value_error');
    }
  },
  {
    id: 'TRY_03',
    category: 'Exceptions',
    name: 'Try with multiple except blocks (matching second)',
    source: `
tag = ""
try:
    raise TypeError("bad type")
except ValueError:
    tag = "caught_value_error"
except TypeError:
    tag = "caught_type_error"
`,
    verify: (vm) => {
      assert.strictEqual(vm.globals.get('tag'), 'caught_type_error');
    }
  },
  {
    id: 'TRY_04',
    category: 'Exceptions',
    name: 'Try with except and else block (no exception occurs)',
    source: `
branch = ""
try:
    x = 42
except:
    branch = "except"
else:
    branch = "else"
`,
    verify: (vm) => {
      assert.strictEqual(vm.globals.get('branch'), 'else');
    }
  },
  {
    id: 'TRY_05',
    category: 'Exceptions',
    name: 'Try/except/else/finally full sequence',
    source: `
events = []
try:
    events.append("try")
except:
    events.append("except")
else:
    events.append("else")
finally:
    events.append("finally")
`,
    verify: (vm) => {
      assert.deepStrictEqual(vm.globals.get('events'), ['try', 'else', 'finally']);
    }
  },
  {
    id: 'TRY_06',
    category: 'Exceptions',
    name: 'Bare raise re-raising current exception',
    source: `
outer_caught = False
try:
    try:
        raise ValueError("initial error")
    except ValueError:
        raise
except ValueError:
    outer_caught = True
`,
    verify: (vm) => {
      assert.strictEqual(vm.globals.get('outer_caught'), true);
    }
  },
  {
    id: 'TRY_07',
    category: 'Exceptions',
    name: 'Nested try/except/finally blocks',
    source: `
trail = []
try:
    trail.append("outer_try")
    try:
        trail.append("inner_try")
        raise KeyError("missing")
    except KeyError:
        trail.append("inner_except")
    finally:
        trail.append("inner_finally")
except:
    trail.append("outer_except")
finally:
    trail.append("outer_finally")
`,
    verify: (vm) => {
      assert.deepStrictEqual(vm.globals.get('trail'), ['outer_try', 'inner_try', 'inner_except', 'inner_finally', 'outer_finally']);
    }
  },

  // =========================================================================
  // 4. PREPROCESSOR & LEXICAL EDGE CASES
  // =========================================================================
  {
    id: 'PREPROC_01',
    category: 'Preprocessor',
    name: 'Multi-line brackets in list literal',
    source: `
items = [
    1,
    2,
    3,
    4
]
total = sum(items)
`,
    verify: (vm) => {
      assert.strictEqual(vm.globals.get('total'), 10);
    }
  },
  {
    id: 'PREPROC_02',
    category: 'Preprocessor',
    name: 'Multi-line dictionary literal',
    source: `
lookup = {
    "first": 10,
    "second": 20,
    "third": 30
}
val = lookup["second"]
`,
    verify: (vm) => {
      assert.strictEqual(vm.globals.get('val'), 20);
    }
  },
  {
    id: 'PREPROC_03',
    category: 'Preprocessor',
    name: 'Comments at end of statement lines',
    source: `
a = 10 # assign a
b = 20 # assign b
c = a + b # compute sum
`,
    verify: (vm) => {
      assert.strictEqual(vm.globals.get('c'), 30);
    }
  },
  {
    id: 'PREPROC_04',
    category: 'Preprocessor',
    name: 'Comments inside multi-line bracketed expressions',
    source: `
matrix = [
    10, # first element
    20, # second element
    30  # third element
]
res = len(matrix)
`,
    verify: (vm) => {
      assert.strictEqual(vm.globals.get('res'), 3);
    }
  },
  {
    id: 'PREPROC_05',
    category: 'Preprocessor',
    name: 'Blank lines inside nested if / while / def blocks',
    source: `
def compute(n):

    total = 0

    i = 0

    while i < n:

        if i % 2 == 0:

            total = total + i

        i = i + 1

    return total

ans = compute(10)
`,
    verify: (vm) => {
      assert.strictEqual(vm.globals.get('ans'), 20);
    }
  },
  {
    id: 'PREPROC_06',
    category: 'Preprocessor',
    name: 'Multiple indentation levels and multi-level unindent',
    source: `
res = 0
if True:
    if True:
        if True:
            if True:
                res = 99
res_after = res
`,
    verify: (vm) => {
      assert.strictEqual(vm.globals.get('res_after'), 99);
    }
  },
  {
    id: 'PREPROC_07',
    category: 'Preprocessor',
    name: 'Trailing commas in lists and dicts',
    source: `
lst = [10, 20, 30,]
d = {"a": 1, "b": 2,}
`,
    verify: (vm) => {
      assert.deepStrictEqual(vm.globals.get('lst'), [10, 20, 30]);
      assert.strictEqual(vm.globals.get('d')['b'], 2);
    }
  },
  {
    id: 'PREPROC_08',
    category: 'Preprocessor',
    name: 'Hash character inside string literal',
    source: `
msg = "hello # not a comment at all"
words = msg.split(" # ")
`,
    verify: (vm) => {
      assert.strictEqual(vm.globals.get('msg'), 'hello # not a comment at all');
      assert.deepStrictEqual(vm.globals.get('words'), ['hello', 'not a comment at all']);
    }
  },

  // =========================================================================
  // 5. DICTIONARY AND LIST OPERATIONS
  // =========================================================================
  {
    id: 'COLLEC_01',
    category: 'Collections',
    name: 'Nested dictionary read, write, and key creation',
    source: `
d = {
    "user": {
        "profile": {
            "name": "Alice",
            "score": 100
        }
    }
}
d["user"]["profile"]["score"] = 200
d["user"]["profile"]["rank"] = 1
new_score = d["user"]["profile"]["score"]
new_rank = d["user"]["profile"]["rank"]
`,
    verify: (vm) => {
      assert.strictEqual(vm.globals.get('new_score'), 200);
      assert.strictEqual(vm.globals.get('new_rank'), 1);
    }
  },
  {
    id: 'COLLEC_02',
    category: 'Collections',
    name: 'Key existence (k in d, k not in d)',
    source: `
inventory = {"apples": 5, "oranges": 10}
has_apples = "apples" in inventory
has_bananas = "bananas" in inventory
no_bananas = "bananas" not in inventory
`,
    verify: (vm) => {
      assert.strictEqual(vm.globals.get('has_apples'), true);
      assert.strictEqual(vm.globals.get('has_bananas'), false);
      assert.strictEqual(vm.globals.get('no_bananas'), true);
    }
  },
  {
    id: 'COLLEC_03',
    category: 'Collections',
    name: 'Negative indexing on list',
    source: `
lst = [10, 20, 30, 40, 50]
last = lst[-1]
second_last = lst[-2]
`,
    verify: (vm) => {
      assert.strictEqual(vm.globals.get('last'), 50);
      assert.strictEqual(vm.globals.get('second_last'), 40);
    }
  },
  {
    id: 'COLLEC_04',
    category: 'Collections',
    name: 'Negative indexing on string',
    source: `
word = "PYTHON"
last_char = word[-1]
second_last_char = word[-2]
`,
    verify: (vm) => {
      assert.strictEqual(vm.globals.get('last_char'), 'N');
      assert.strictEqual(vm.globals.get('second_last_char'), 'O');
    }
  },
  {
    id: 'COLLEC_05',
    category: 'Collections',
    name: 'Negative index assignment on list',
    source: `
items = [1, 2, 3, 4]
items[-1] = 99
items[-2] = 88
`,
    verify: (vm) => {
      assert.deepStrictEqual(vm.globals.get('items'), [1, 2, 88, 99]);
    }
  },
  {
    id: 'COLLEC_06',
    category: 'Collections',
    name: 'List slicing variations (step, reverse, negative indices)',
    source: `
nums = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
s1 = nums[2:6]
s2 = nums[:3]
s3 = nums[7:]
s4 = nums[::2]
s5 = nums[::-1]
s6 = nums[-4:-1]
`,
    verify: (vm) => {
      assert.deepStrictEqual(vm.globals.get('s1'), [2, 3, 4, 5]);
      assert.deepStrictEqual(vm.globals.get('s2'), [0, 1, 2]);
      assert.deepStrictEqual(vm.globals.get('s3'), [7, 8, 9]);
      assert.deepStrictEqual(vm.globals.get('s4'), [0, 2, 4, 6, 8]);
      assert.deepStrictEqual(vm.globals.get('s5'), [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]);
      assert.deepStrictEqual(vm.globals.get('s6'), [6, 7, 8]);
    }
  },
  {
    id: 'COLLEC_07',
    category: 'Collections',
    name: 'Dictionary built-in methods (keys, values, items, get, pop, update)',
    source: `
d = {"x": 10, "y": 20}
keys = d.keys()
values = d.values()
items = d.items()
get_x = d.get("x", 0)
get_z = d.get("z", 99)
popped_x = d.pop("x")
d.update({"z": 30})
`,
    verify: (vm) => {
      assert.deepStrictEqual(vm.globals.get('keys').sort(), ['x', 'y']);
      assert.deepStrictEqual(vm.globals.get('values').sort(), [10, 20]);
      assert.strictEqual(vm.globals.get('get_x'), 10);
      assert.strictEqual(vm.globals.get('get_z'), 99);
      assert.strictEqual(vm.globals.get('popped_x'), 10);
      assert.strictEqual(vm.globals.get('d')['z'], 30);
    }
  },

  // =========================================================================
  // 6. CLASS INHERITANCE & OOP
  // =========================================================================
  {
    id: 'OOP_01',
    category: 'Classes & OOP',
    name: 'Class inheritance calling base class methods',
    source: `
class Animal:
    def __init__(self, name):
        self.name = name

    def speak(self):
        return self.name + " makes a noise."

class Dog(Animal):
    def bark(self):
        return self.name + " barks!"

d = Dog("Buddy")
s1 = d.speak()
s2 = d.bark()
`,
    verify: (vm) => {
      assert.strictEqual(vm.globals.get('s1'), 'Buddy makes a noise.');
      assert.strictEqual(vm.globals.get('s2'), 'Buddy barks!');
    }
  },
  {
    id: 'OOP_02',
    category: 'Classes & OOP',
    name: 'Class method overriding',
    source: `
class Parent:
    def greet(self):
        return "Parent greet"

class Child(Parent):
    def greet(self):
        return "Child greet"

c = Child()
res = c.greet()
`,
    verify: (vm) => {
      assert.strictEqual(vm.globals.get('res'), 'Child greet');
    }
  },

  // =========================================================================
  // 7. IMPORTS & STANDARD LIBRARY MODULES
  // =========================================================================
  {
    id: 'IMPORT_01',
    category: 'Imports',
    name: 'import math and math functions',
    source: `
import math
sqrt_val = math.sqrt(144)
pi_val = math.pi
floor_val = math.floor(3.9)
fact_val = math.factorial(5)
gcd_val = math.gcd(48, 18)
`,
    verify: (vm) => {
      assert.strictEqual(vm.globals.get('sqrt_val'), 12);
      assert.strictEqual(vm.globals.get('pi_val'), Math.PI);
      assert.strictEqual(vm.globals.get('floor_val'), 3);
      assert.strictEqual(vm.globals.get('fact_val'), 120);
      assert.strictEqual(vm.globals.get('gcd_val'), 6);
    }
  },
  {
    id: 'IMPORT_02',
    category: 'Imports',
    name: 'from math import sqrt, pi',
    source: `
from math import sqrt, pi
v1 = sqrt(81)
v2 = pi
`,
    verify: (vm) => {
      assert.strictEqual(vm.globals.get('v1'), 9);
      assert.strictEqual(vm.globals.get('v2'), Math.PI);
    }
  },
  {
    id: 'IMPORT_03',
    category: 'Imports',
    name: 'import random functions',
    source: `
import random
r = random.random()
num = random.randint(10, 20)
choice_val = random.choice([100, 200, 300])
`,
    verify: (vm) => {
      const r = vm.globals.get('r');
      assert.strictEqual(typeof r, 'number');
      assert.ok(r >= 0 && r <= 1);
      const num = vm.globals.get('num');
      assert.ok(num >= 10 && num <= 20);
      const choice_val = vm.globals.get('choice_val');
      assert.ok([100, 200, 300].includes(choice_val));
    }
  },
  {
    id: 'IMPORT_04',
    category: 'Imports',
    name: 'import json (dumps and loads)',
    source: `
import json
data = {"title": "Test", "score": 95}
s = json.dumps(data)
obj = json.loads(s)
title_back = obj["title"]
score_back = obj["score"]
`,
    verify: (vm) => {
      assert.strictEqual(vm.globals.get('title_back'), 'Test');
      assert.strictEqual(vm.globals.get('score_back'), 95);
    }
  },
  {
    id: 'IMPORT_05',
    category: 'Imports',
    name: 'import re (search, findall, sub)',
    source: `
import re
has_match = re.search("foo", "hello foo bar")
all_digits = re.findall("[0-9]+", "item 12 and 345 and 6")
subbed = re.sub("apple", "orange", "apple pie and apple cider")
`,
    verify: (vm) => {
      assert.strictEqual(vm.globals.get('has_match'), 'foo');
      assert.deepStrictEqual(vm.globals.get('all_digits'), ['12', '345', '6']);
      assert.strictEqual(vm.globals.get('subbed'), 'orange pie and orange cider');
    }
  },
  {
    id: 'IMPORT_06',
    category: 'Imports',
    name: 'import statistics (from VFS)',
    source: `
import statistics
data = [10, 20, 30, 40, 50]
m = statistics.mean(data)
med = statistics.median(data)
`,
    verify: (vm) => {
      assert.strictEqual(vm.globals.get('m'), 30);
      assert.strictEqual(vm.globals.get('med'), 30);
    }
  },
  {
    id: 'IMPORT_07',
    category: 'Imports',
    name: 'from statistics import mean',
    source: `
from statistics import mean
m = mean([10, 20, 30])
`,
    verify: (vm) => {
      assert.strictEqual(vm.globals.get('m'), 20);
    }
  },

  // =========================================================================
  // 8. BOOLEANS & TRUTHINESS SHORT-CIRCUITING
  // =========================================================================
  {
    id: 'BOOL_01',
    category: 'Booleans & Short-Circuit',
    name: 'or operator short-circuiting (avoid side effects / error)',
    source: `
def throw_err():
    raise ValueError("Should not be called!")
    return False

res = True or throw_err()
`,
    verify: (vm) => {
      assert.strictEqual(vm.globals.get('res'), true);
    }
  },
  {
    id: 'BOOL_02',
    category: 'Booleans & Short-Circuit',
    name: 'and operator short-circuiting (avoid side effects / error)',
    source: `
def throw_err():
    raise ValueError("Should not be called!")
    return True

res = False and throw_err()
`,
    verify: (vm) => {
      assert.strictEqual(vm.globals.get('res'), false);
    }
  },
  {
    id: 'BOOL_03',
    category: 'Booleans & Short-Circuit',
    name: 'Truthiness of empty list and empty dict in if statements',
    source: `
hit_list = False
if []:
    hit_list = True

hit_dict = False
if {}:
    hit_dict = True

not_list = False
if not []:
    not_list = True

not_dict = False
if not {}:
    not_dict = True
`,
    verify: (vm) => {
      assert.strictEqual(vm.globals.get('hit_list'), false);
      assert.strictEqual(vm.globals.get('hit_dict'), false);
      assert.strictEqual(vm.globals.get('not_list'), true);
      assert.strictEqual(vm.globals.get('not_dict'), true);
    }
  },
  {
    id: 'BOOL_04',
    category: 'Booleans & Short-Circuit',
    name: 'Python or/and value-preserving semantics',
    source: `
v1 = 0 or "default"
v2 = "first" or "second"
v3 = 10 and "matched"
v4 = "" and "unreached"
`,
    verify: (vm) => {
      assert.strictEqual(vm.globals.get('v1'), 'default');
      assert.strictEqual(vm.globals.get('v2'), 'first');
      assert.strictEqual(vm.globals.get('v3'), 'matched');
      assert.strictEqual(vm.globals.get('v4'), '');
    }
  },
  {
    id: 'BOOL_05',
    category: 'Booleans & Short-Circuit',
    name: 'Identity operators is and is not with None',
    source: `
x = None
y = 10
c1 = x is None
c2 = y is not None
c3 = x is not None
`,
    verify: (vm) => {
      assert.strictEqual(vm.globals.get('c1'), true);
      assert.strictEqual(vm.globals.get('c2'), true);
      assert.strictEqual(vm.globals.get('c3'), false);
    }
  },

  // =========================================================================
  // 9. STRING METHODS AND FORMATTING
  // =========================================================================
  {
    id: 'STR_01',
    category: 'Strings',
    name: 'String methods suite',
    source: `
raw = "  hello world  "
st = raw.strip()
up = st.upper()
words = up.split(" ")
joined = "::".join(words)
rep = joined.replace("::", " ")
sub_pos = rep.find("WORLD")
starts = rep.startswith("HELLO")
ends = rep.endswith("WORLD")
`,
    verify: (vm) => {
      assert.strictEqual(vm.globals.get('st'), 'hello world');
      assert.strictEqual(vm.globals.get('up'), 'HELLO WORLD');
      assert.deepStrictEqual(vm.globals.get('words'), ['HELLO', 'WORLD']);
      assert.strictEqual(vm.globals.get('joined'), 'HELLO::WORLD');
      assert.strictEqual(vm.globals.get('rep'), 'HELLO WORLD');
      assert.strictEqual(vm.globals.get('sub_pos'), 6);
      assert.strictEqual(vm.globals.get('starts'), true);
      assert.strictEqual(vm.globals.get('ends'), true);
    }
  },
  {
    id: 'STR_02',
    category: 'Strings',
    name: 'String multiplication operator',
    source: `
bar = "=" * 10
rep = "abc" * 3
`,
    verify: (vm) => {
      assert.strictEqual(vm.globals.get('bar'), '==========');
      assert.strictEqual(vm.globals.get('rep'), 'abcabcabc');
    }
  },
  {
    id: 'STR_03',
    category: 'Strings',
    name: 'F-string formatting with expressions and specifiers',
    source: `
num = 42
pi = 3.14159265
msg = f"Hex: {num:x}, Dec: {num:04d}, Pi: {pi:.2f}"
esc = f"{{literal}} {num}"
`,
    verify: (vm) => {
      assert.strictEqual(vm.globals.get('msg'), 'Hex: 2a, Dec: 0042, Pi: 3.14');
      assert.strictEqual(vm.globals.get('esc'), '{literal} 42');
    }
  },

  // =========================================================================
  // 10. FILE I/O WITH OPEN(...) INSIDE CONTEXT MANAGERS
  // =========================================================================
  {
    id: 'IO_01',
    category: 'File I/O',
    name: 'Write and Read file using with open(...)',
    source: `
with open("test_stress.txt", "w") as f:
    f.write("Line 1\\nLine 2\\nLine 3")

with open("test_stress.txt", "r") as f:
    content = f.read()

with open("test_stress.txt", "r") as f:
    l1 = f.readline()
    l2 = f.readline()
`,
    verify: (vm) => {
      assert.strictEqual(vm.globals.get('content'), 'Line 1\nLine 2\nLine 3');
      assert.strictEqual(vm.globals.get('l1'), 'Line 1\n');
      assert.strictEqual(vm.globals.get('l2'), 'Line 2\n');
    }
  },
  {
    id: 'IO_02',
    category: 'File I/O',
    name: 'Error when performing I/O on closed file',
    source: `
f = open("closed_test.txt", "w")
f.close()
err_caught = False
try:
    f.write("should fail")
except:
    err_caught = True
`,
    verify: (vm) => {
      assert.strictEqual(vm.globals.get('err_caught'), true);
    }
  },

  // =========================================================================
  // 11. EXTRA PYTHON LANGUAGE CORNER CASES
  // =========================================================================
  {
    id: 'EDGE_01',
    category: 'Edge Cases',
    name: 'Sequence unpacking and variable swapping',
    source: `
a, b = 10, 20
a, b = b, a
x, y, z = [1, 2, 3]
`,
    verify: (vm) => {
      assert.strictEqual(vm.globals.get('a'), 20);
      assert.strictEqual(vm.globals.get('b'), 10);
      assert.strictEqual(vm.globals.get('x'), 1);
      assert.strictEqual(vm.globals.get('y'), 2);
      assert.strictEqual(vm.globals.get('z'), 3);
    }
  },
  {
    id: 'EDGE_02',
    category: 'Edge Cases',
    name: 'Loops with break and continue',
    source: `
evens = []
i = 0
while i < 10:
    i = i + 1
    if i % 2 != 0:
        continue
    if i > 6:
        break
    evens.append(i)
`,
    verify: (vm) => {
      assert.deepStrictEqual(vm.globals.get('evens'), [2, 4, 6]);
    }
  },
  {
    id: 'EDGE_03',
    category: 'Edge Cases',
    name: 'List and Dict comprehensions',
    source: `
squares = [x * x for x in [1, 2, 3, 4] if x % 2 == 0]
lookup = {str(x): x * 10 for x in [1, 2, 3]}
`,
    verify: (vm) => {
      assert.deepStrictEqual(vm.globals.get('squares'), [4, 16]);
      assert.deepStrictEqual(vm.globals.get('lookup'), { '1': 10, '2': 20, '3': 30 });
    }
  },
  {
    id: 'EDGE_04',
    category: 'Edge Cases',
    name: 'Walrus operator := inside while condition',
    source: `
nums = [5, 4, 3, 2, 1]
collected = []
while (n := len(nums)) > 0:
    nums.pop()
    collected.append(n)
`,
    verify: (vm) => {
      assert.deepStrictEqual(vm.globals.get('collected'), [5, 4, 3, 2, 1]);
    }
  },
  {
    id: 'EDGE_05',
    category: 'Edge Cases',
    name: 'Integer floor division // and modulo % with negative numbers',
    source: `
q1 = -7 // 2
q2 = 7 // -2
q3 = -7 // -2
r1 = -7 % 3
r2 = 7 % -3
`,
    verify: (vm) => {
      assert.strictEqual(vm.globals.get('q1'), -4);
      assert.strictEqual(vm.globals.get('q2'), -4);
      assert.strictEqual(vm.globals.get('q3'), 3);
      assert.strictEqual(vm.globals.get('r1'), 2);
      assert.strictEqual(vm.globals.get('r2'), -2);
    }
  },
  {
    id: 'EDGE_06',
    category: 'Edge Cases',
    name: 'Dynamic Programming: Memoized Fibonacci',
    source: `
memo = {}

def fib(n):
    if n <= 1:
        return n
    key = str(n)
    if key in memo:
        return memo[key]
    res = fib(n - 1) + fib(n - 2)
    memo[key] = res
    return res

fib10 = fib(10)
fib15 = fib(15)
`,
    verify: (vm) => {
      assert.strictEqual(vm.globals.get('fib10'), 55);
      assert.strictEqual(vm.globals.get('fib15'), 610);
    }
  }
];

console.log('================================================================');
console.log('  UNIVERSAL PYTHON 3 COMPILER & RUNTIME STRESS-TEST SUITE');
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
fs.writeFileSync('tests/fuzz_results.json', JSON.stringify(results, null, 2));
