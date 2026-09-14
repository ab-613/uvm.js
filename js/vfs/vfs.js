// File: js/vfs/vfs.js
/**
 * In-Memory Virtual Filesystem (VFS)
 * Provides a sandboxed POSIX-like filesystem for the Universal Interpreter.
 * Ships with standard library packages (Python .py and C .c extensions).
 */

export class VirtualFileSystem {
  constructor() {
    this.files = new Map();
    this.directories = new Set(['/', '/lib', '/lib/python3', '/lib/c']);
    this.seedDefaultFiles();
  }

  normalizePath(rawPath) {
    if (!rawPath || typeof rawPath !== 'string') return '/';
    let p = rawPath.replace(/\\/g, '/');
    if (!p.startsWith('/')) p = '/' + p;
    
    const parts = p.split('/').filter(Boolean);
    const resolved = [];
    for (const part of parts) {
      if (part === '.') continue;
      if (part === '..') {
        resolved.pop();
      } else {
        resolved.push(part);
      }
    }
    return '/' + resolved.join('/');
  }

  mkdir(dirPath) {
    const norm = this.normalizePath(dirPath);
    const parts = norm.split('/').filter(Boolean);
    let curr = '';
    for (const part of parts) {
      curr += '/' + part;
      this.directories.add(curr);
    }
  }

  writeFile(filePath, content) {
    const norm = this.normalizePath(filePath);
    const parent = norm.substring(0, norm.lastIndexOf('/')) || '/';
    this.mkdir(parent);
    this.files.set(norm, typeof content === 'string' ? content : String(content));
  }

  readFile(filePath) {
    const norm = this.normalizePath(filePath);
    if (!this.files.has(norm)) {
      throw new Error(`FileNotFoundError: [Errno 2] No such file: '${filePath}'`);
    }
    return this.files.get(norm);
  }

  exists(filePath) {
    const norm = this.normalizePath(filePath);
    return this.files.has(norm) || this.directories.has(norm);
  }

  readdir(dirPath) {
    const norm = this.normalizePath(dirPath);
    const prefix = norm === '/' ? '/' : norm + '/';
    const entries = new Set();

    for (const file of this.files.keys()) {
      if (file.startsWith(prefix)) {
        const rest = file.slice(prefix.length);
        const name = rest.split('/')[0];
        entries.add(name);
      }
    }
    for (const dir of this.directories) {
      if (dir !== norm && dir.startsWith(prefix)) {
        const rest = dir.slice(prefix.length);
        const name = rest.split('/')[0];
        entries.add(name);
      }
    }
    return Array.from(entries).sort();
  }

  unlink(filePath) {
    const norm = this.normalizePath(filePath);
    if (this.directories.has(norm)) {
      throw new Error(`IsADirectoryError: [Errno 21] Is a directory: '${filePath}'`);
    }
    if (!this.files.has(norm)) {
      throw new Error(`FileNotFoundError: [Errno 2] No such file: '${filePath}'`);
    }
    this.files.delete(norm);
    return true;
  }

  rmdir(dirPath) {
    const norm = this.normalizePath(dirPath);
    if (this.files.has(norm)) {
      throw new Error(`NotADirectoryError: [Errno 20] Not a directory: '${dirPath}'`);
    }
    if (!this.directories.has(norm)) {
      throw new Error(`FileNotFoundError: [Errno 2] No such directory: '${dirPath}'`);
    }
    if (norm === '/') {
      throw new Error(`PermissionError: [Errno 13] Cannot remove root directory`);
    }
    const entries = this.readdir(norm);
    if (entries.length > 0) {
      throw new Error(`OSError: [Errno 39] Directory not empty: '${dirPath}'`);
    }
    this.directories.delete(norm);
    return true;
  }

  rmtree(dirPath) {
    const norm = this.normalizePath(dirPath);
    if (norm === '/') {
      throw new Error(`PermissionError: [Errno 13] Cannot remove root directory`);
    }
    if (this.files.has(norm)) {
      throw new Error(`NotADirectoryError: [Errno 20] Not a directory: '${dirPath}'`);
    }
    if (!this.directories.has(norm)) {
      throw new Error(`FileNotFoundError: [Errno 2] No such directory: '${dirPath}'`);
    }
    const prefix = norm + '/';
    for (const filePath of Array.from(this.files.keys())) {
      if (filePath.startsWith(prefix)) {
        this.files.delete(filePath);
      }
    }
    for (const subDir of Array.from(this.directories)) {
      if (subDir === norm || subDir.startsWith(prefix)) {
        this.directories.delete(subDir);
      }
    }
    return true;
  }

  stat(targetPath) {
    const norm = this.normalizePath(targetPath);
    if (this.directories.has(norm)) {
      return {
        isDirectory: true,
        isFile: false,
        size: 4096,
        mtime: Date.now()
      };
    }
    if (this.files.has(norm)) {
      const content = this.files.get(norm);
      return {
        isDirectory: false,
        isFile: true,
        size: typeof content === 'string' ? content.length : 0,
        mtime: Date.now()
      };
    }
    throw new Error(`FileNotFoundError: [Errno 2] No such file or directory: '${targetPath}'`);
  }

  isDirectory(targetPath) {
    const norm = this.normalizePath(targetPath);
    return this.directories.has(norm);
  }

  isFile(targetPath) {
    const norm = this.normalizePath(targetPath);
    return this.files.has(norm);
  }

  copyFile(src, dst) {
    const content = this.readFile(src);
    let dstNorm = this.normalizePath(dst);
    if (this.isDirectory(dstNorm)) {
      const base = this.normalizePath(src).split('/').pop();
      dstNorm = (dstNorm === '/' ? '' : dstNorm) + '/' + base;
    }
    this.writeFile(dstNorm, content);
    return dstNorm;
  }

  copyTree(src, dst) {
    const srcNorm = this.normalizePath(src);
    if (!this.isDirectory(srcNorm)) {
      throw new Error(`NotADirectoryError: [Errno 20] Not a directory: '${src}'`);
    }
    const dstNorm = this.normalizePath(dst);
    this.mkdir(dstNorm);
    const prefix = srcNorm === '/' ? '/' : srcNorm + '/';
    for (const [filePath, content] of this.files.entries()) {
      if (filePath.startsWith(prefix)) {
        const rel = filePath.slice(prefix.length);
        const targetPath = (dstNorm === '/' ? '' : dstNorm) + '/' + rel;
        this.writeFile(targetPath, content);
      }
    }
    for (const subDir of this.directories) {
      if (subDir !== srcNorm && subDir.startsWith(prefix)) {
        const rel = subDir.slice(prefix.length);
        const targetDir = (dstNorm === '/' ? '' : dstNorm) + '/' + rel;
        this.mkdir(targetDir);
      }
    }
    return dstNorm;
  }

  move(src, dst) {
    const srcNorm = this.normalizePath(src);
    if (this.isFile(srcNorm)) {
      this.copyFile(src, dst);
      this.unlink(src);
    } else if (this.isDirectory(srcNorm)) {
      this.copyTree(src, dst);
      this.rmtree(src);
    } else {
      throw new Error(`FileNotFoundError: [Errno 2] No such file or directory: '${src}'`);
    }
    return dst;
  }

  seedDefaultFiles() {
    // 0. Workspace project files
    this.writeFile('/workspace/main.py', `# Universal Interpreter Workspace
# Welcome to UVM 3.5 Interactive Studio

def calculate_fibonacci(n):
    if n <= 1:
        return n
    a, b = 0, 1
    for _ in range(2, n + 1):
        a, b = b, a + b
    return b

print("UVM Runtime Active.")
for i in range(1, 9):
    print(f"fib({i}) = {calculate_fibonacci(i)}")
`);

    this.writeFile('/workspace/utils.py', `# Utility helper functions
def is_even(n):
    return n % 2 == 0

def clamp(val, low, high):
    if val < low:
        return low
    if val > high:
        return high
    return val

def greeting(name):
    return f"Hello, {name} from UVM VFS!"
`);

    this.writeFile('/workspace/native.c', `/* Genuine C Extension for UVM Bytecode Stepper */
#include <stdio.h>

int add(int a, int b) {
    return a + b;
}

int square(int n) {
    return n * n;
}
`);

    this.writeFile('/workspace/config.json', `{
  "project": "Universal Interpreter Studio",
  "version": "3.5.0",
  "target": "uvm-stack",
  "compiler": "ohm-js",
  "languages": ["python", "c", "java"]
}
`);

    this.writeFile('/workspace/README.md', `# Universal Interpreter

A sandboxed multi-language execution engine and bytecode virtual machine.

## Features
- **Ohm AST Parser**: Python 3, ANSI C, and Java grammars.
- **UVM Bytecode Stepper**: Instruction-by-instruction execution.
- **In-Memory POSIX VFS**: Sandboxed virtual filesystem with tiered modules.
`);

    // 1. Pure Python standard statistics module
    this.writeFile('/lib/python3/statistics.py', `
# Python Standard Library: statistics (Pure Python)

def mean(data):
    total = 0
    for x in data:
        total = total + x
    return total / len(data)

def fmean(data):
    return mean(data)

def _sort(lst):
    # In-place bubble/selection sort copy
    res = []
    for item in lst:
        res.append(item)
    n = len(res)
    i = 0
    while i < n:
        j = 0
        while j < n - i - 1:
            if res[j] > res[j + 1]:
                temp = res[j]
                res[j] = res[j + 1]
                res[j + 1] = temp
            j = j + 1
        i = i + 1
    return res

def median(data):
    s = _sort(data)
    n = len(s)
    mid = n // 2
    if n % 2 == 1:
        return s[mid]
    return (s[mid - 1] + s[mid]) / 2

def variance(data):
    m = mean(data)
    total_sq = 0
    for x in data:
        diff = x - m
        total_sq = total_sq + diff * diff
    return total_sq / (len(data) - 1)

def stdev(data):
    import math
    return math.sqrt(variance(data))
`);

    // 2. Genuine C Extension Module: _fastmath.c
    this.writeFile('/lib/c/_fastmath.c', `
#include <Python.h>

/* Genuine C implementation of fast GCD using Euclidean algorithm */
static PyObject* py_fast_gcd(PyObject* self, PyObject* args) {
    long a, b;
    if (!PyArg_ParseTuple(args, "ll", &a, &b)) {
        return NULL;
    }
    while (b != 0) {
        long temp = b;
        b = a % b;
        a = temp;
    }
    return PyLong_FromLong(a);
}

/* Genuine C implementation of fast iterative Fibonacci */
static PyObject* py_fast_fib(PyObject* self, PyObject* args) {
    long n;
    if (!PyArg_ParseTuple(args, "l", &n)) {
        return NULL;
    }
    if (n <= 0) return PyLong_FromLong(0);
    long a = 0;
    long b = 1;
    for (long i = 1; i < n; i++) {
        long temp = a + b;
        a = b;
        b = temp;
    }
    return PyLong_FromLong(b);
}

/* Genuine C implementation of trial-division primality test */
static PyObject* py_is_prime(PyObject* self, PyObject* args) {
    long n;
    if (!PyArg_ParseTuple(args, "l", &n)) {
        return NULL;
    }
    if (n <= 1) return PyLong_FromLong(0);
    for (long d = 2; d * d <= n; d++) {
        if (n % d == 0) return PyLong_FromLong(0);
    }
    return PyLong_FromLong(1);
}

/* Method Table definition (Standard Python.h convention) */
static PyMethodDef FastMathMethods[] = {
    {"fast_gcd", py_fast_gcd, METH_VARARGS, "Calculate greatest common divisor in C"},
    {"fast_fib", py_fast_fib, METH_VARARGS, "Calculate fast fibonacci in C"},
    {"is_prime", py_is_prime, METH_VARARGS, "Check primality in C"},
    {NULL, NULL, 0, NULL}
};

/* Module Initialization function */
PyMODINIT_FUNC PyInit__fastmath(void) {
    return PyModule_Create(&fastmathmodule);
}
`);
  }
}

export const vfs = new VirtualFileSystem();
