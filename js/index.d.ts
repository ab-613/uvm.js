// Type definitions for universal-interpreter

export type SupportedLanguage = 'auto' | 'python' | 'java' | 'c';

export interface InterpreterOptions {
  vfs?: any;
  moduleManager?: any;
  language?: SupportedLanguage;
  onPrint?: (text: string) => void;
  onInputRequired?: (prompt: string, callback: (input: string) => void) => void;
  timeSliceInterval?: number;
}

export interface ExecutionResult {
  output: string;
  value: any;
  durationMs: number;
  program: BytecodeProgram;
  vm: VirtualMachine;
}

export class UniversalInterpreter {
  constructor(options?: InterpreterOptions);
  vfs: any;
  moduleManager: any;
  parse(sourceCode: string, language?: SupportedLanguage): any;
  compile(sourceCode: string, language?: SupportedLanguage): BytecodeProgram;
  run(input: string | BytecodeProgram, options?: InterpreterOptions): Promise<ExecutionResult>;
  runSync(input: string | BytecodeProgram, options?: InterpreterOptions): ExecutionResult;
}

export class BytecodeProgram {
  instructions: number[];
  constants: any[];
  labels: Record<string, number>;
  emit(opcode: number, ...operands: number[]): void;
  disassemble(): string;
}

export class BytecodeCompiler {
  compile(ast: any): BytecodeProgram;
}

export class VirtualMachine {
  constructor(options?: any);
  pc: number;
  operandStack: any[];
  callStack: any[];
  consoleOutput: string;
  isHalted: boolean;
  instructionCount: number;
  execute(program: BytecodeProgram): Generator<any, any, any>;
  reset(): void;
  getExecutionSnapshot(): any;
}

export class Scheduler {
  constructor(interpreter?: any);
  spawn(generator: Generator, parent?: any): any;
  run(onComplete?: () => void, onError?: (err: any) => void): void;
  stop(): void;
  onInputRequired: ((prompt: string, callback: (input: string) => void) => void) | null;
}

export const parseSource: (sourceCode: string, language?: SupportedLanguage) => any;
export const vfs: any;
export const moduleManager: any;
export const OP: Record<string, number>;
export const OP_NAMES: Record<number, string>;
export const SYSCALL: Record<string, number>;
export const SYSCALL_NAMES: Record<number, string>;

export default UniversalInterpreter;
