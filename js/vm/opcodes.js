// File: js/vm/opcodes.js
/**
 * Universal Virtual Machine (UVM) Opcode Definitions
 */

export const OP = {
  // Stack operations
  NOP: 0x00,
  CONST: 0x01,          // [CONST, const_idx] -> push constants[const_idx]
  POP: 0x02,            // pop value from stack
  DUP: 0x03,            // duplicate top of stack
  SWAP: 0x04,           // swap top two stack values

  // Literals
  TRUE: 0x05,           // push true
  FALSE: 0x06,          // push false
  NIL: 0x07,            // push null

  // Local variables (stack-frame indexed slots)
  LOAD_LOCAL: 0x10,     // [LOAD_LOCAL, slot_idx]
  STORE_LOCAL: 0x11,    // [STORE_LOCAL, slot_idx]

  // Global variables (named)
  LOAD_GLOBAL: 0x12,    // [LOAD_GLOBAL, name_const_idx]
  STORE_GLOBAL: 0x13,   // [STORE_GLOBAL, name_const_idx]

  // Closures & Upvalues (lexical enclosing scopes)
  LOAD_UPVALUE: 0x14,   // [LOAD_UPVALUE, slot_idx, hops]
  STORE_UPVALUE: 0x15,  // [STORE_UPVALUE, slot_idx, hops]

  // Arithmetic
  ADD: 0x20,            // b = pop(), a = pop(), push(a + b)
  SUB: 0x21,            // b = pop(), a = pop(), push(a - b)
  MUL: 0x22,            // b = pop(), a = pop(), push(a * b)
  DIV: 0x23,            // b = pop(), a = pop(), push(a / b)
  MOD: 0x24,            // b = pop(), a = pop(), push(a % b)
  POW: 0x25,            // b = pop(), a = pop(), push(a ** b)
  NEG: 0x26,            // a = pop(), push(-a)
  IDIV: 0x27,           // b = pop(), a = pop(), push(Math.floor(a / b))
  MATMUL: 0x28,         // b = pop(), a = pop(), push(a @ b)
  POS: 0x29,            // a = pop(), push(+a or a.__pos__())

  // Bitwise
  BIT_AND: 0x30,
  BIT_OR: 0x31,
  BIT_XOR: 0x32,
  BIT_NOT: 0x33,
  SHL: 0x34,
  SHR: 0x35,

  // Comparison & Logic
  EQ: 0x40,             // push(a === b)
  NEQ: 0x41,            // push(a !== b)
  LT: 0x42,             // push(a < b)
  LTE: 0x43,            // push(a <= b)
  GT: 0x44,             // push(a > b)
  GTE: 0x45,            // push(a >= b)
  NOT: 0x46,            // push(!isTruthy(a))
  IN: 0x47,             // b = pop(), a = pop(), push(b.includes(a) or a in b)

  // Branching & Control Flow
  JUMP: 0x50,           // [JUMP, target_pc]
  JUMP_IF_FALSE: 0x51,  // [JUMP_IF_FALSE, target_pc] -> pops condition; jumps if falsy
  JUMP_IF_TRUE: 0x52,   // [JUMP_IF_TRUE, target_pc]  -> pops condition; jumps if truthy
  PUSH_TRY: 0x53,       // [PUSH_TRY, catch_pc, finally_pc] -> pushes try frame
  POP_TRY: 0x54,        // pops try frame
  RAISE: 0x55,          // pops error and unwinds stack

  // Functions & Calls
  CALL: 0x60,           // [CALL, argc] -> callee and args on stack
  RETURN: 0x61,         // returns top stack value
  CALL_SPREAD: 0x62,    // pops args array, pops callee, invokes with spread args

  // Data structures
  BUILD_LIST: 0x70,     // [BUILD_LIST, count] -> pops count elements, pushes array
  BUILD_MAP: 0x71,      // [BUILD_MAP, count]  -> pops count*2 elements, pushes object
  GET_INDEX: 0x72,      // idx = pop(), obj = pop(), push(obj[idx])
  SET_INDEX: 0x73,      // val = pop(), idx = pop(), obj = pop(), obj[idx] = val
  GET_MEMBER: 0x74,     // [GET_MEMBER, prop_const_idx]
  SET_MEMBER: 0x75,     // [SET_MEMBER, prop_const_idx]
  DICT_UPDATE: 0x76,    // pops src, pops target, merges src into target, pushes target

  // Modules & Imports
  IMPORT: 0x80,         // [IMPORT, module_name_const_idx] -> pushes module object
  IMPORT_STAR: 0x81,    // pops module object, copies exports to current frame globals

  // System & VM lifecycle
  SYSCALL: 0xF0,        // [SYSCALL, syscall_id] -> invokes host syscall
  HALT: 0xFF,           // stops VM execution
};

// Map opcode numbers to string names for disassembly and debugging
export const OP_NAMES = Object.fromEntries(
  Object.entries(OP).map(([name, code]) => [code, name])
);
