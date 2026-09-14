# uvm.js

A lightweight, browser-native Python 3 subset compiler and stack-based virtual machine written in pure JavaScript. 

Built using [Ohm.js](https://ohmjs.org/) and ES6 generators, **uvm.js** runs entirely in the browser without WebAssembly, supports cooperative multitasking (`sleep()`, `input()`, async HTTP), and features a visual, step-by-step bytecode debugger.

[**Launch Live Web IDE & Bytecode Stepper**](https://ab-613.github.io/uvm.js/)

---

## Why build this?

Running Python in the browser usually means downloading a full WebAssembly build of CPython (like Pyodide). While Pyodide is fantastic for data science packages like NumPy and Pandas, it requires downloading a 20MB–40MB runtime before executing a single line of code.

**uvm.js** was built for a different use case: **instant-boot educational playgrounds, interactive documentation, and visual debugging**.

* **Instant Startup**: Under 250 KB minified (including the Ohm parser). Zero WebAssembly compile/instantiate delay.
* **Inspectable VM**: Watch the call stack, local slots, operand stack, and AST nodes update in real time on an instruction-by-instruction basis.
* **Non-Blocking I/O**: The execution engine lives inside an ES6 Generator (`function* executeLoop()`), allowing scripts to yield for `sleep()`, interactive user input, or network calls without freezing the browser UI or requiring Web Workers.

---

## Architecture & Clever Hacks

### 1. The Generator-Backed Stack VM (`js/vm/vm.js`)
Instead of a standard `while(true)` dispatch loop that locks the UI thread, the core dispatch loop is an ES6 generator. Every opcode or time-slice quantum yields back to a cooperative scheduler (`scheduler.js`).

This design unlocks two powerful primitives for free:
* **Single-Step Debugging**: Advancing the VM by exactly one instruction is literally just calling `.next()` on the generator and reading the stack snapshot.
* **Cooperative Fibers**: Syscalls like `sleep(ms)`, `input()`, or async HTTP requests simply suspend the generator. A browser event listener or timer resumes the fiber with the resolved value once ready.

### 2. Layout Preprocessing & AST Desugaring (`js/frontend/`)
Python’s indentation-sensitive syntax is handled in a two-stage pipeline:
1. `python_preprocessor.js` balances indentation levels, normalizes f-strings, and injects block delimiters.
2. Ohm.js PEG grammars parse the stream into an AST, where high-level Python semantics (list/dict comprehensions, `with` context managers, tuple unpacking, and class inheritance) are desugared into clean VM primitives.

### 3. On-Demand Stdlib with CPython C-Shims (`js/vm/modules.js`)
Rather than shipping a bloated standard library bundle:
1. When your script imports a pure-Python module (like `calendar` or `colorsys`), the package manager fetches the raw `.py` source directly from the official `python/cpython` 3.12 GitHub repository into an in-memory POSIX Virtual File System (VFS).
2. **The Catch**: Pure-Python stdlib modules often rely on internal C-extension modules. To make this work, `uvm.js` includes handcrafted JavaScript host bridges for internal CPython dependencies—including `_thread`, `datetime`, `itertools`, `_locale`, and `hashlib`.

### 4. Syntactic C-Extension Transpiler (`js/vm/c_extension.js`)
To experiment with Python C-extensions without needing GCC, Clang, or WebAssembly toolchains, `uvm.js` includes a lightweight C parser:
* It parses single-file C snippets written with standard `Python.h` conventions (such as `_fastmath.c`).
* It inspects `PyArg_ParseTuple` calls to infer function parameter bindings, unwraps `PyLong_FromLong(...)`, and transpiles C arithmetic/loop structures into the **exact same AST format** as Python functions.
* Both C and Python functions run inside the same VM, sharing stack frames and local slots seamlessly.

---

## What works (and what doesn't)

`uvm.js` is an educational runtime and lightweight sandbox, **not** a 100% CPython replacement.

### Supported
* **Core Language**: Functions, nested closures & upvalues, classes, single inheritance, `*args`, multiple assignment / swapping, list & dict comprehensions, slicing, f-strings, walrus operator (`:=`), `try/except/else/finally/raise`.
* **Async & Fibers**: Non-blocking `time.sleep()`, interactive terminal `input()`.
* **Networking**: A built-in, fetch-backed `requests` bridge (`get`, `post`, `Session`, streaming `iter_content`).
* **In-Memory VFS**: POSIX filesystem supporting `with open(...) as f:`.
* **Select Stdlib**: Dynamic loading of pure-Python standard libraries (`math`, `random`, `json`, `re`, `colorsys`, `calendar`, `statistics`).

### Out of Scope
* **Binary Wheels (`numpy`, `pandas`, `torch`)**: Any module requiring precompiled machine shared objects (`.so`, `.dll`), Fortran linear algebra routines, or low-level C memory pointers cannot run in this engine. Use Pyodide for these.
* **OS-Level Sockets & Subprocesses**: No raw TCP sockets or `subprocess.Popen` (governed by browser sandbox limitations).

---

## Quickstart (Web Demo & Local Dev)

Try the [**Live Web Studio Demo**](https://ab-613.github.io/uvm.js/) to see the visual stepper, Monaco editor, and terminal in action.

### Running Locally

```bash
# Clone the repository
git clone https://github.com/ab-613/uvm.js.git
cd uvm.js

# Install dependencies (Ohm.js, esbuild)
npm install

# Run automated test suites & adversarial fuzzing
npm test

# Start the local studio web server
npm start
```

### Programmatic Usage

```javascript
import { UniversalInterpreter } from './js/index.js';

const uvm = new UniversalInterpreter();

// Asynchronous execution with cooperative sleep & output
const res = await uvm.run(`
def fib(n):
    return n if n <= 1 else fib(n - 1) + fib(n - 2)

for i in range(7):
    print(f"fib({i}) = {fib(i)}")
`, { language: 'python' });

console.log(res.output);
```

---

## License

MIT
