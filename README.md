# uvm.js

An experimental Python subset compiler and stack-based virtual machine written in pure JavaScript. Built on top of [Ohm.js](https://ohmjs.org/) and ES6 generators, it runs entirely in the browser without WebAssembly, supports cooperative multitasking (`sleep()`, `input()`, non-blocking HTTP via browser `fetch`), and includes a visual step-by-step instruction debugger.

[**Launch Live Web Studio & Bytecode Stepper**](https://ab-613.github.io/uvm.js/) — *Try the Flagship Tour preset to see fibers, VFS file operations, and the C-extension running live in browser memory.*

---

## Why build this?

Most browser-based Python solutions rely on WebAssembly builds of CPython (like Pyodide), which require downloading 20MB–50MB+ runtime bundles before the first line of code executes. 

I wanted an instant-booting engine for docs and interactive debugging without making users download a 30MB Pyodide binary:
* **Instant startup**: Under 250 KB minified (including the Ohm grammar), cold-booting in under 50ms.
* **Zero WebAssembly**: Pure ES6 that runs anywhere from legacy WebViews to Node scripts.
* **Inspectable & educational**: Designed around an instruction-level stepper where you can watch the call stack, operand stack, and AST nodes update in real time.
* **Generator-driven execution**: The VM dispatch loop is an ES6 generator (`function* executeLoop()`), so pausing for `time.sleep()`, terminal `input()`, or awaiting a network response is just a generator yield that doesn't lock the browser UI.

---

## How It Works (and the Hacks Making It Work)

### 1. Generator-Driven Stack VM (`js/vm/vm.js`)
Instead of a standard `while(true)` dispatch loop, the execution loop is implemented as an ES6 generator (`*executeLoop()`). Every instruction or quantum of work yields control back to a cooperative scheduler (`Scheduler.js`). 

Wrapping the dispatch loop in an ES6 generator gives us two hard runtime features almost for free:
* **True cooperative I/O**: `time.sleep(ms)` or `input()` simply suspends the generator and sets a timer or event listener in JavaScript, resuming execution seamlessly once ready.
* **Single-step debugging**: Single-stepping in the UI is just calling `.next()` on the generator, which emits a stack/frame snapshot to Monaco on every opcode.

### 2. Layout-Sensitive Parsing via Ohm.js (`js/frontend/`)
Because Ohm.js is a PEG parser that dislikes off-side indentation, `python_preprocessor.js` first scans whitespace, balances brackets, and emits explicit `{}` delimiters before the grammar sees it. The Ohm semantic actions then desugar high-level constructs (`for` loops into indexed `while` loops, list comprehensions into temporary append routines, and `with` into `try/finally` enter/exit pairs).

### 3. On-Demand Stdlib over VFS (`js/packages/package_manager.js`)
Rather than bundling the entire standard library, `uvm.js` includes an in-memory POSIX Virtual File System. When a script runs `import colorsys` or `import calendar`, the module manager:
1. Checks the local in-memory `/lib/python3/` directory.
2. If missing, fetches the raw, unpatched `.py` source directly from the official `python/cpython` 3.12 GitHub branch into an in-memory POSIX virtual filesystem (try the *Dynamic CPython 3.12 Stdlib* preset in the demo to watch it load `colorsys.py` live).
3. Caches it in the VFS and compiles it on the fly. To prevent stdlib imports from failing on internal C-extensions, UVM provides pure JS host bridges for the modules they depend on (including `_thread`, `datetime`, `hashlib` with pure-JS MD5, and `itertools`).

### 4. The C Extension Hack: Syntactic Transpilation (`js/vm/c_extension.js`)
We obviously aren't running Clang or virtualizing raw C pointers in 250KB of JS. Instead, an Ohm C grammar parses single-file C modules, strips `PyArg_ParseTuple` to bind parameter names, unwraps `PyLong_FromLong()`, and emits UVM bytecode for the arithmetic/loop body. C functions share the exact same call stack and registers as Python scripts. Check out the `_fastmath.c` demo in the studio to see Euclid's algorithm and Fibonacci execute this way.

---

## Installation & Usage

### Node.js

```bash
npm install uvm-js
```

```javascript
// The engine is called UniversalInterpreter because the AST pipeline also accepts C & Java syntax profiles
import { UniversalInterpreter } from 'uvm-js';

const uvm = new UniversalInterpreter();

// 1. Asynchronous run (cooperative fibers, sleep, and real requests.get() via browser fetch)
// Defaults to 'auto', but language can be explicitly pinned:
const res = await uvm.run(`
def fib(n):
    return n if n <= 1 else fib(n - 1) + fib(n - 2)

for i in range(7):
    print(f"fib({i}) = {fib(i)}")
`, { language: 'python' });

console.log(res.output);

// 2. Synchronous fast-path
const sync = uvm.runSync('print(2 ** 16)', { language: 'python' });
console.log(sync.output); // 65536
```

### Direct Browser Embed (`<script>`)

No bundler or import maps required:

```html
<script src="https://cdn.jsdelivr.net/npm/uvm-js/dist/uvm.min.js"></script>
<script>
  const uvm = new UniversalInterpreter();

  uvm.run(`
import math
print(f"Square root of 144 is {math.sqrt(144)}")
  `).then(res => console.log(res.output));
</script>
```

### CLI

```bash
# Run a Python script
npx uvm run script.py

# Inspect compiled bytecode instructions
npx uvm dis script.py

# Evaluate inline snippet
npx uvm -e "print([x * 2 for x in range(5)])"

# Interactive REPL
npx uvm repl
```

---

## Low-Level Compiler & Stepper API

For custom tooling, educational demos, or inspecting bytecode:

```javascript
import {
  parseSource,
  BytecodeCompiler,
  VirtualMachine,
  moduleManager
} from 'uvm-js';

// 1. Parse source to AST
const ast = parseSource('x = 10 + 20\nprint(x)', 'python');

// 2. Compile AST into bytecode
const compiler = new BytecodeCompiler();
const program = compiler.compile(ast);
console.log(program.disassemble());

// 3. Step instruction-by-instruction
const vm = new VirtualMachine({ moduleManager });
vm.singleStepMode = true;

const stepper = vm.execute(program);

let step = stepper.next();
while (!step.done) {
  const snapshot = vm.getExecutionSnapshot();
  console.log(`PC: ${snapshot.pc} | Stack:`, snapshot.operandStack);
  step = stepper.next();
}
```

---

## Current Status & Limitations

`uvm.js` is an educational sandbox and lightweight micro-runtime, **not** a full CPython replacement.

| Feature | Support | Notes |
| :--- | :--- | :--- |
| **Core Syntax** | Supported | Functions, closures/upvalues, classes, single inheritance, comprehensions, slicing, f-strings, `*args`, `try/except/finally`. |
| **Async / Fibers** | Supported | Non-blocking `time.sleep()`, terminal `input()`, and an in-memory virtual terminal supporting ANSI escape codes (`\x1b[2J`) and carriage-return line rewriting (`\r`). |
| **VFS & Context Managers** | Supported | In-memory POSIX filesystem, `with open(...) as f:`. |
| **Standard Library** | Supported | Pure-Python modules loaded on-demand from CPython GitHub repo; host bridges for `math`, `time`, `json`, `re`, and async `requests` (supports `get`, `post`, `Session`, and `iter_content`; see the *Star Wars ASCII Cinema* demo for streaming). |
| **C Extensions** | Experimental | Parses a small subset of ANSI C and compiles it directly to UVM bytecode (see `_fastmath.c`). |
| **Binary Wheels (NumPy, Pandas)** | *Out of Scope* | Any package shipping precompiled `.so`/`.pyd` binaries or Fortran BLAS kernels (`numpy`, `pandas`, `torch`) cannot run here—a browser sandbox cannot execute raw machine binaries without a full container. Use Pyodide for heavy scientific computing. |
| **Java Profile** | Experimental Syntax Demo | Parses Java classes and methods into the shared AST; primary bytecode execution is geared toward Python. |

---

## Development & Testing

The test suite covers parser edge cases, lexical scoping upvalues, 4-level nested closures, multiple inheritance, and VFS file operations:

```bash
# Clone repository
git clone https://github.com/ab-613/uvm.js.git
cd uvm.js

# Install dev dependencies (Ohm.js, esbuild)
npm install

# Run compiler, VM, and stdlib integration test suites
npm test

# Build standalone browser bundles into /dist (outputs minified uvm.min.js <250KB)
npm run build

# Launch local Web IDE
npm start
```

---

## License

MIT
