// File: js/vm/c_extension.js
import * as ohm from 'ohm-js';
import { C_GRAMMAR_SRC } from '../frontend/c_grammar.js';
import { createCSemantics } from '../frontend/c_semantics.js';
import { BytecodeCompiler } from './compiler.js';
import { BytecodeProgram } from './program.js';
import { VirtualMachine } from './vm.js';
import { OP } from './opcodes.js';

let cGrammar = null;
let cSemantics = null;

function initCGrammar() {
  if (!cGrammar) {
    const bundle = ohm.grammars(C_GRAMMAR_SRC);
    cGrammar = bundle.CSyntax;
    cSemantics = createCSemantics(cGrammar);
  }
  return { grammar: cGrammar, semantics: cSemantics };
}

/**
 * Creates a callable function wrapper around a compiled bytecode function.
 * Enables calling the compiled C bytecode directly from JavaScript or from UVM modules.
 */
function createModuleCallable(fnName, cProgram) {
  return function(...args) {
    const prog = new BytecodeProgram();
    prog.constants = [...cProgram.constants];
    prog.instructions = [...cProgram.instructions];
    if (prog.instructions[prog.instructions.length - 1] === OP.HALT) {
      prog.instructions.pop();
    }

    // Push callee first, then arguments, per UVM calling convention
    const nameIdx = prog.addConstant(fnName);
    prog.emit(OP.LOAD_GLOBAL, nameIdx);
    for (const arg of args) {
      const idx = prog.addConstant(arg);
      prog.emit(OP.CONST, idx);
    }
    prog.emit(OP.CALL, args.length);
    prog.emit(OP.HALT);

    const subVm = new VirtualMachine();
    const iter = subVm.execute(prog);
    let step;
    let res;
    while (!(step = iter.next()).done) {
      res = step.value;
    }
    return step.value !== undefined ? step.value : res;
  };
}

/**
 * Parses, compiles, and loads a Python C extension (.c file) into a callable module namespace.
 * @param {string} cSource - Raw C source code with Python.h conventions
 * @returns {Record<string, Function>} Exported module methods
 */
export function loadCExtension(cSource) {
  const { grammar, semantics } = initCGrammar();
  const match = grammar.match(cSource, 'CProgram');

  if (!match.succeeded()) {
    throw new SyntaxError(`C Extension Compilation Error:\n${match.message}`);
  }

  const ast = semantics(match).toAST();
  const methodTables = ast.body.filter(n => n.type === 'CMethodTable');
  const codeNodes = ast.body.filter(n => n.type !== 'CMethodTable');

  // Compile C function AST nodes into UVM Bytecode
  const compiler = new BytecodeCompiler();
  const program = compiler.compile({ type: 'Program', body: codeNodes });

  // Execute in a virtual machine to verify symbols and populate function descriptors
  const vm = new VirtualMachine();
  const iter = vm.execute(program);
  while (!iter.next().done) {}

  // Construct module export dictionary from PyMethodDef table entries
  const moduleExports = {};
  for (const table of methodTables) {
    for (const entry of table.entries) {
      if (vm.globals.has(entry.cFunction)) {
        moduleExports[entry.name] = createModuleCallable(entry.cFunction, program);
        moduleExports[entry.name].doc = entry.doc;
      }
    }
  }

  return moduleExports;
}
