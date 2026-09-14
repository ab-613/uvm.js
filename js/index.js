// File: js/index.js
/**
 * Universal Interpreter & Bytecode Virtual Machine (UVM) SDK
 *
 * A high-performance polyglot interpreter, bytecode compiler, and virtual machine
 * with cooperative fiber scheduling, virtual filesystem (VFS), and FFI bridges.
 */

import { parseSource } from './frontend/index.js';
import {
  BytecodeCompiler,
  VirtualMachine,
  BytecodeProgram,
  Scheduler,
  moduleManager,
  ModuleManager,
  loadCExtension,
  OP,
  OP_NAMES,
  SYSCALL,
  SYSCALL_NAMES,
  VirtualTerminal,
} from './vm/index.js';
import { vfs, VirtualFileSystem } from './vfs/vfs.js';

export class UniversalInterpreter {
  /**
   * @param {Object} [options={}]
   * @param {VirtualFileSystem} [options.vfs] - Custom virtual filesystem instance
   * @param {ModuleManager} [options.moduleManager] - Custom module manager instance
   * @param {function(string): void} [options.onPrint] - Callback for stdout messages
   * @param {function(string, function(string): void): void} [options.onInputRequired] - Prompt handler for interactive input
   * @param {number} [options.timeSliceInterval] - Max instructions before yielding slice
   */
  constructor(options = {}) {
    this.options = options;
    this.vfs = options.vfs || vfs;
    this.moduleManager = options.moduleManager || moduleManager;
  }

  /**
   * Parses source code into a standardized AST.
   *
   * @param {string} sourceCode - Raw code string (Python, Java, or C)
   * @param {string} [language='auto'] - Language mode ('auto', 'python', 'java', 'c')
   * @returns {Object} AST node tree
   */
  parse(sourceCode, language = 'auto') {
    return parseSource(sourceCode, language);
  }

  /**
   * Compiles source code into an executable BytecodeProgram.
   *
   * @param {string} sourceCode - Raw code string
   * @param {string} [language='auto'] - Language mode
   * @returns {BytecodeProgram} Compiled bytecode program
   */
  compile(sourceCode, language = 'auto') {
    const ast = this.parse(sourceCode, language);

    // Convenience: If source defines a main() function/method and never calls it,
    // automatically invoke main() as the entry point (standard Java/C convention).
    if (ast && Array.isArray(ast.body)) {
      const hasMainDecl = ast.body.some((node) => {
        if (node.type === 'FunctionDeclaration' && node.name === 'main') return true;
        if (node.type === 'ClassDeclaration' && Array.isArray(node.body)) {
          return node.body.some((m) => m.type === 'FunctionDeclaration' && m.name === 'main');
        }
        return false;
      });

      const hasMainCall = ast.body.some((node) => {
        if (node.type === 'ExpressionStatement' && node.expression) {
          const exp = node.expression;
          if (exp.type === 'CallExpression' && exp.callee && exp.callee.name === 'main') {
            return true;
          }
        }
        return false;
      });

      if (hasMainDecl && !hasMainCall) {
        ast.body.push({
          type: 'ExpressionStatement',
          expression: {
            type: 'CallExpression',
            callee: { type: 'Identifier', name: 'main' },
            arguments: [],
          },
        });
      }
    }

    const compiler = new BytecodeCompiler();
    return compiler.compile(ast);
  }

  /**
   * Pre-fetches any missing standard library imports over the network before compiling.
   */
  async prefetchImports(sourceCode) {
    if (typeof fetch === 'undefined' || !this.moduleManager) return;
    const matches = sourceCode.matchAll(/(?:from\s+([a-zA-Z0-9_.]+)\s+import|import\s+([a-zA-Z0-9_.]+))/g);
    for (const match of matches) {
      const modName = match[1] || match[2];
      if (modName && this.moduleManager.hasModule && !this.moduleManager.hasModule(modName)) {
        if (!modName.includes('.')) {
          try {
            await this.moduleManager.fetchAndCacheModule(modName);
          } catch (e) {
            // Ignore prefetch error; VM will report on execution if unresolved
          }
        }
      }
    }
  }

  /**
   * Executes source code or a compiled program asynchronously.
   * Supports cooperative multitasking, non-blocking sleep(), and interactive input prompts.
   *
   * @param {string|BytecodeProgram} input - Source code string or BytecodeProgram instance
   * @param {Object} [options={}] - Execution options overriding constructor defaults
   * @param {string} [options.language='auto'] - Language mode if input is a string
   * @param {function(string): void} [options.onPrint] - Callback invoked whenever text is printed
   * @param {function(string, function(string): void): void} [options.onInputRequired] - Input handler
   * @returns {Promise<{ output: string, value: any, durationMs: number, program: BytecodeProgram, vm: VirtualMachine }>}
   */
  async run(input, options = {}) {
    const language = options.language || this.options.language || 'auto';
    if (typeof input === 'string' && (language === 'python' || language === 'auto')) {
      await this.prefetchImports(input);
    }
    const program =
      typeof input === 'string' ? this.compile(input, language) : input;

    let consoleBuffer = '';
    const onPrint =
      options.onPrint ||
      this.options.onPrint ||
      ((text) => {
        consoleBuffer += text + '\n';
      });

    const vm = new VirtualMachine({
      moduleManager: this.moduleManager,
      timeSliceInterval:
        options.timeSliceInterval || this.options.timeSliceInterval || 10000,
      onPrint: onPrint,
    });

    const scheduler = new Scheduler(vm);
    scheduler.spawn(vm.execute(program));

    const inputHandler =
      options.onInputRequired || this.options.onInputRequired;
    if (inputHandler) {
      scheduler.onInputRequired = inputHandler;
    }

    const startTime = performance.now();

    return new Promise((resolve, reject) => {
      scheduler.run(
        () => {
          const durationMs = performance.now() - startTime;
          resolve({
            output: vm.consoleOutput || consoleBuffer,
            value:
              vm.operandStack.length > 0
                ? vm.operandStack[vm.operandStack.length - 1]
                : null,
            durationMs,
            program,
            vm,
          });
        },
        (err) => reject(err)
      );
    });
  }

  /**
   * Executes source code synchronously to completion (suited for non-fiber workloads).
   *
   * @param {string|BytecodeProgram} input - Source code string or BytecodeProgram instance
   * @param {Object} [options={}] - Execution options
   * @returns {{ output: string, value: any, durationMs: number, program: BytecodeProgram, vm: VirtualMachine }}
   */
  runSync(input, options = {}) {
    const language = options.language || this.options.language || 'auto';
    const program =
      typeof input === 'string' ? this.compile(input, language) : input;

    const vm = new VirtualMachine({
      moduleManager: this.moduleManager,
      onPrint: options.onPrint || this.options.onPrint,
    });

    const startTime = performance.now();
    const gen = vm.execute(program);
    let lastStep = gen.next();
    while (!lastStep.done) {
      lastStep = gen.next();
    }
    const durationMs = performance.now() - startTime;

    return {
      output: vm.consoleOutput,
      value:
        lastStep.value !== undefined
          ? lastStep.value
          : vm.operandStack.length > 0
          ? vm.operandStack[vm.operandStack.length - 1]
          : null,
      durationMs,
      program,
      vm,
    };
  }
}

// Re-export modular low-level components for advanced integrations
export {
  parseSource,
  BytecodeCompiler,
  VirtualMachine,
  BytecodeProgram,
  Scheduler,
  moduleManager,
  ModuleManager,
  loadCExtension,
  VirtualFileSystem,
  vfs,
  VirtualTerminal,
  OP,
  OP_NAMES,
  SYSCALL,
  SYSCALL_NAMES,
};

export default UniversalInterpreter;
