// File: js/vm/index.js
export { OP, OP_NAMES } from './opcodes.js';
export { SYSCALL, SYSCALL_NAMES } from './syscalls.js';
export { BytecodeProgram } from './program.js';
export { VirtualMachine, CallFrame } from './vm.js';
export { BytecodeCompiler } from './compiler.js';
export { ModuleManager, moduleManager } from './modules.js';
export { loadCExtension } from './c_extension.js';
export { Scheduler } from './scheduler.js';
export { VirtualTerminal } from './terminal.js';
