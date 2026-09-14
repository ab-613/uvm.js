# uvm.js

An experimental Python subset compiler and stack-based virtual machine written in pure JavaScript. Built on top of [Ohm.js](https://ohmjs.org/) and ES6 generators, it runs entirely in the browser without WebAssembly, supports cooperative multitasking (`sleep()`, `input()`), and includes a visual bytecode instruction stepper.

[**Live Web IDE & Stepper Demo**](https://ab-613.github.io/uvm.js/)

---

## Why build this?

Most browser-based Python solutions rely on WebAssembly builds of CPython (like Pyodide), which require downloading 20MB–50MB+ runtime bundles before the first line of code executes. 

**uvm.js** approaches the problem from the opposite direction:
* **Tiny footprint**: Under 250 KB minified (including the Ohm parser).
* **Zero WebAssembly**: Instant startup in plain browser contexts, WebViews, and Node.js.
* **Inspectable & educational**: Designed around an instruction-level stepper where you can watch the call stack, operand stack, and AST nodes update in real time.
* **Non-blocking by design**: The VM executes inside an ES6 Generator (`function*`), allowing scripts to yield for `sleep()` or wait on interactive user input without blocking the main browser thread.

---

## How it works

### 1. Generator-Driven Stack VM (`js/vm/vm.js`)
Instead of a standard `while(true)` dispatch loop, the execution loop is implemented as an ES6 generator (`*executeLoop()`). Every instruction or quantum of work yields control back to a cooperative scheduler (`Scheduler.js`). 

This architecture provides two huge advantages:
* **True cooperative I/O**: `time.sleep(ms)` or `input()` simply suspends the generator and sets a timer or event listener in JavaScript, resuming execution seamlessly once ready.
* **Single-step debugging**: Stepping one opcode is as simple as calling `.next()` on the VM generator and reading the stack snapshot.

### 2. Layout-Sensitive Parsing via Ohm.js (`js/frontend/`)
Python's significant whitespace and indentation are handled via a preprocessor (`python_preprocessor.js`) that injects block delimiters before passing code to Ohm.js PEG grammars. The AST semantics then desugar higher-level Python syntax (like list/dict comprehensions, `for` loops, and `with` statements) into basic VM primitives.

### 3. On-Demand Stdlib over VFS (`js/packages/package_manager.js`)
Rather than bundling the entire standard library, `uvm.js` includes an in-memory POSIX Virtual File System. When a script runs `import colorsys` or `import calendar`, the module manager:
1. Checks the local in-memory `/lib/python3/` directory.
2. If missing, fetches the official pure-Python `.py` source directly from the `python/cpython` 3.12 GitHub repository.
3. Caches it in the VFS and compiles it to UVM bytecode on the fly.

### 4. Bytecode-Level C Extension Simulation (`js/vm/c_extension.js`)
To support C extensions without native compilation tooling or WebAssembly, a lightweight C grammar parses single-file C modules written with standard `Python.h` conventions (e.g. `PyMethodDef`, `PyArg_ParseTuple`). It converts C functions into the **same internal AST** and emits UVM bytecode, allowing C and Python functions to share the exact same call frames and operand stack.

---

## Installation & Usage

### Node.js

```bash
npm install uvm-js
```

```javascript
import { UniversalInterpreter } from 'uvm-js';

const uvm = new UniversalInterpreter();

// 1. Asynchronous run (supports fibers, sleep, and network)
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
| **Async / Fibers** | Supported | Generator-backed cooperative multitasking (`sleep`, `input`). |
| **VFS & Context Managers** | Supported | In-memory POSIX filesystem, `with open(...) as f:`. |
| **Standard Library** | Supported | Pure-Python modules loaded on-demand from CPython GitHub repo; host bridges for `math`, `time`, `json`, `re`, and async `requests`. |
| **C Extensions** | Experimental | Parses a small subset of ANSI C and compiles it directly to UVM bytecode (see `_fastmath.c`). |
| **Binary Wheels (NumPy, Pandas)** | *Out of Scope* | Modules requiring native shared libraries (`.so`, `.pyd`) or Fortran/C++ compilation cannot run in this engine. Use Pyodide for these. |
| **Java Profile** | Preview Only | Grammar demo showing Java parsing into the universal AST. |

---

## Development & Testing

The repository contains an automated test suite covering parsing, compiler slot allocation, upvalues/closures, VFS operations, and adversarial fuzzing:

```bash
# Clone repository
git clone https://github.com/ab-613/uvm.js.git
cd uvm.js

# Install dev dependencies (Ohm.js, esbuild)
npm install

# Run test suite
npm test

# Build standalone distribution bundles (/dist)
npm run build

# Launch local Web IDE
npm start
```

---

## License

MIT
