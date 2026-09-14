// File: js/vm/program.js
import { OP, OP_NAMES } from './opcodes.js';
import { SYSCALL_NAMES } from './syscalls.js';

/**
 * Encapsulates a compiled bytecode program with constants, instructions, and debugging metadata.
 */
export class BytecodeProgram {
  constructor() {
    this.constants = [];
    this.instructions = [];
    this.sourceMap = new Map(); // PC -> { line, col }
    this.functionTable = new Map(); // name -> { entryPC, paramCount, localCount }
    this.entryPoint = 0;
  }

  /**
   * Adds a constant to the constant pool, returning its index.
   * Reuses existing primitive constants if present.
   */
  addConstant(value) {
    if (typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean') {
      const existingIdx = this.constants.indexOf(value);
      if (existingIdx !== -1) return existingIdx;
    }
    this.constants.push(value);
    return this.constants.length - 1;
  }

  /**
   * Emits an opcode with optional operands to the instruction stream.
   * @returns {number} The starting PC index of the emitted instruction.
   */
  emit(opcode, ...operands) {
    const pc = this.instructions.length;
    this.instructions.push(opcode);
    for (const operand of operands) {
      this.instructions.push(operand);
    }
    return pc;
  }

  /**
   * Patches an operand at a specific instruction index (used for jump targets).
   */
  patch(index, value) {
    this.instructions[index] = value;
  }

  /**
   * Disassembles the bytecode instructions into human-readable assembly text.
   * @returns {string} Formatted disassembly.
   */
  disassemble() {
    const lines = [];
    lines.push('=== Bytecode Disassembly ===');
    lines.push(`Constants: [${this.constants.map((c, i) => `${i}: ${JSON.stringify(c)}`).join(', ')}]`);
    lines.push('Instructions:');

    let pc = 0;
    while (pc < this.instructions.length) {
      const startPc = pc;
      const op = this.instructions[pc++];
      const opName = OP_NAMES[op] || `UNKNOWN(0x${op.toString(16)})`;

      let operandStr = '';

      switch (op) {
        case OP.CONST: {
          const idx = this.instructions[pc++];
          operandStr = `#${idx} (${JSON.stringify(this.constants[idx])})`;
          break;
        }

        case OP.LOAD_LOCAL:
        case OP.STORE_LOCAL: {
          const slot = this.instructions[pc++];
          operandStr = `slot[${slot}]`;
          break;
        }

        case OP.LOAD_GLOBAL:
        case OP.STORE_GLOBAL: {
          const nameIdx = this.instructions[pc++];
          operandStr = `@${this.constants[nameIdx]} (#${nameIdx})`;
          break;
        }

        case OP.JUMP:
        case OP.JUMP_IF_FALSE:
        case OP.JUMP_IF_TRUE: {
          const target = this.instructions[pc++];
          operandStr = `-> ${String(target).padStart(4, '0')}`;
          break;
        }

        case OP.CALL: {
          const argc = this.instructions[pc++];
          operandStr = `argc=${argc}`;
          break;
        }

        case OP.BUILD_LIST:
        case OP.BUILD_MAP: {
          const count = this.instructions[pc++];
          operandStr = `count=${count}`;
          break;
        }

        case OP.GET_MEMBER:
        case OP.SET_MEMBER: {
          const propIdx = this.instructions[pc++];
          operandStr = `.${this.constants[propIdx]} (#${propIdx})`;
          break;
        }

        case OP.IMPORT: {
          const modIdx = this.instructions[pc++];
          operandStr = `${this.constants[modIdx]} (#${modIdx})`;
          break;
        }

        case OP.SYSCALL: {
          const id = this.instructions[pc++];
          const sysName = SYSCALL_NAMES[id] || `0x${id.toString(16)}`;
          operandStr = `SYS_${sysName} (${id})`;
          break;
        }

        default:
          break;
      }

      const pcFormatted = String(startPc).padStart(4, '0');
      lines.push(`  ${pcFormatted}:  ${opName.padEnd(16)} ${operandStr}`);
    }

    return lines.join('\n');
  }

  /**
   * Returns structured instructions array for UI inspection and step debugging.
   */
  getInstructionList() {
    const list = [];
    let pc = 0;
    while (pc < this.instructions.length) {
      const startPc = pc;
      const op = this.instructions[pc++];
      const opName = OP_NAMES[op] || `UNKNOWN(0x${op.toString(16)})`;
      let operandStr = '';

      switch (op) {
        case OP.CONST: {
          const idx = this.instructions[pc++];
          operandStr = `#${idx} (${JSON.stringify(this.constants[idx])})`;
          break;
        }
        case OP.LOAD_LOCAL:
        case OP.STORE_LOCAL: {
          const slot = this.instructions[pc++];
          operandStr = `slot[${slot}]`;
          break;
        }
        case OP.LOAD_GLOBAL:
        case OP.STORE_GLOBAL: {
          const nameIdx = this.instructions[pc++];
          operandStr = `@${this.constants[nameIdx]} (#${nameIdx})`;
          break;
        }
        case OP.JUMP:
        case OP.JUMP_IF_FALSE:
        case OP.JUMP_IF_TRUE: {
          const target = this.instructions[pc++];
          operandStr = `-> ${String(target).padStart(4, '0')}`;
          break;
        }
        case OP.CALL: {
          const argc = this.instructions[pc++];
          operandStr = `argc=${argc}`;
          break;
        }
        case OP.BUILD_LIST:
        case OP.BUILD_MAP: {
          const count = this.instructions[pc++];
          operandStr = `count=${count}`;
          break;
        }
        case OP.GET_MEMBER:
        case OP.SET_MEMBER: {
          const propIdx = this.instructions[pc++];
          operandStr = `.${this.constants[propIdx]} (#${propIdx})`;
          break;
        }
        case OP.IMPORT: {
          const modIdx = this.instructions[pc++];
          operandStr = `${this.constants[modIdx]} (#${modIdx})`;
          break;
        }
        case OP.SYSCALL: {
          const id = this.instructions[pc++];
          const sysName = SYSCALL_NAMES[id] || `0x${id.toString(16)}`;
          operandStr = `SYS_${sysName} (${id})`;
          break;
        }
        default:
          break;
      }

      list.push({
        pc: startPc,
        endPc: pc,
        op,
        opName,
        operandStr
      });
    }
    return list;
  }
}

