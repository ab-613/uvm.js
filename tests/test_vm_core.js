// File: tests/test_vm_core.js
import assert from 'assert';
import { OP, BytecodeProgram, VirtualMachine } from '../js/vm/index.js';

console.log('=== Running UVM Core Tests ===');

// Test 1: Arithmetic & Stack operations: (10 + 20) * 3 = 90
{
  const program = new BytecodeProgram();
  const c10 = program.addConstant(10);
  const c20 = program.addConstant(20);
  const c3 = program.addConstant(3);

  program.emit(OP.CONST, c10);
  program.emit(OP.CONST, c20);
  program.emit(OP.ADD);
  program.emit(OP.CONST, c3);
  program.emit(OP.MUL);
  program.emit(OP.HALT);

  const vm = new VirtualMachine();
  const gen = vm.execute(program);
  let step = gen.next();
  while (!step.done) {
    step = gen.next();
  }

  assert.strictEqual(vm.operandStack.pop(), 90);
  console.log('✅ Test 1 Passed: Basic arithmetic & stack evaluation');
}

// Test 2: Local Variables: a = 5; b = 10; c = a + b; return c
{
  const program = new BytecodeProgram();
  const c5 = program.addConstant(5);
  const c10 = program.addConstant(10);

  program.emit(OP.CONST, c5);
  program.emit(OP.STORE_LOCAL, 0); // a = 5

  program.emit(OP.CONST, c10);
  program.emit(OP.STORE_LOCAL, 1); // b = 10

  program.emit(OP.LOAD_LOCAL, 0);  // load a
  program.emit(OP.LOAD_LOCAL, 1);  // load b
  program.emit(OP.ADD);            // a + b
  program.emit(OP.STORE_LOCAL, 2); // c = a + b

  program.emit(OP.LOAD_LOCAL, 2);  // load c
  program.emit(OP.HALT);

  const vm = new VirtualMachine();
  const gen = vm.execute(program);
  while (!gen.next().done) {}

  assert.strictEqual(vm.operandStack.pop(), 15);
  console.log('✅ Test 2 Passed: Local variable load/store');
}

// Test 3: Conditionals & Branching: if (x < 10) return 100 else return 200
{
  const testBranch = (x, expected) => {
    const program = new BytecodeProgram();
    const cX = program.addConstant(x);
    const c10 = program.addConstant(10);
    const c100 = program.addConstant(100);
    const c200 = program.addConstant(200);

    program.emit(OP.CONST, cX);
    program.emit(OP.CONST, c10);
    program.emit(OP.LT); // x < 10

    const jumpFalse = program.emit(OP.JUMP_IF_FALSE, 0);

    // Consequent
    program.emit(OP.CONST, c100);
    const jumpEnd = program.emit(OP.JUMP, 0);

    // Alternate
    program.patch(jumpFalse + 1, program.instructions.length);
    program.emit(OP.CONST, c200);

    // End
    program.patch(jumpEnd + 1, program.instructions.length);
    program.emit(OP.HALT);

    const vm = new VirtualMachine();
    const gen = vm.execute(program);
    while (!gen.next().done) {}

    assert.strictEqual(vm.operandStack.pop(), expected);
  };

  testBranch(5, 100);
  testBranch(15, 200);
  console.log('✅ Test 3 Passed: Conditional branching (JUMP_IF_FALSE)');
}

// Test 4: While Loop: sum 1..10 = 55
{
  const program = new BytecodeProgram();
  const c0 = program.addConstant(0);
  const c1 = program.addConstant(1);
  const c10 = program.addConstant(10);

  // slot 0 = i = 1
  program.emit(OP.CONST, c1);
  program.emit(OP.STORE_LOCAL, 0);

  // slot 1 = sum = 0
  program.emit(OP.CONST, c0);
  program.emit(OP.STORE_LOCAL, 1);

  // Loop Start
  const loopStart = program.instructions.length;
  program.emit(OP.LOAD_LOCAL, 0); // i
  program.emit(OP.CONST, c10);    // 10
  program.emit(OP.LTE);           // i <= 10

  const jumpExit = program.emit(OP.JUMP_IF_FALSE, 0);

  // sum = sum + i
  program.emit(OP.LOAD_LOCAL, 1);
  program.emit(OP.LOAD_LOCAL, 0);
  program.emit(OP.ADD);
  program.emit(OP.STORE_LOCAL, 1);

  // i = i + 1
  program.emit(OP.LOAD_LOCAL, 0);
  program.emit(OP.CONST, c1);
  program.emit(OP.ADD);
  program.emit(OP.STORE_LOCAL, 0);

  // Loop back
  program.emit(OP.JUMP, loopStart);

  // Loop Exit
  program.patch(jumpExit + 1, program.instructions.length);
  program.emit(OP.LOAD_LOCAL, 1); // load sum
  program.emit(OP.HALT);

  const vm = new VirtualMachine();
  const gen = vm.execute(program);
  while (!gen.next().done) {}

  assert.strictEqual(vm.operandStack.pop(), 55);
  console.log('✅ Test 4 Passed: While loop execution (sum 1..10)');
}

// Test 5: Recursive Function: fib(10) = 55
{
  const program = new BytecodeProgram();

  // Jump over fib function body
  const jumpOver = program.emit(OP.JUMP, 0);

  // --- fib(n) function entry ---
  const fibEntryPC = program.instructions.length;
  const c0 = program.addConstant(0);
  const c1 = program.addConstant(1);
  const c2 = program.addConstant(2);

  // if (n <= 1) return n;
  program.emit(OP.LOAD_LOCAL, 0); // n
  program.emit(OP.CONST, c1);
  program.emit(OP.LTE);
  const jumpElse = program.emit(OP.JUMP_IF_FALSE, 0);

  program.emit(OP.LOAD_LOCAL, 0); // return n
  program.emit(OP.RETURN);

  // return fib(n - 1) + fib(n - 2);
  program.patch(jumpElse + 1, program.instructions.length);

  // fib(n - 1)
  const cFibName = program.addConstant('fib');
  program.emit(OP.LOAD_GLOBAL, cFibName);
  program.emit(OP.LOAD_LOCAL, 0);
  program.emit(OP.CONST, c1);
  program.emit(OP.SUB);
  program.emit(OP.CALL, 1);

  // fib(n - 2)
  program.emit(OP.LOAD_GLOBAL, cFibName);
  program.emit(OP.LOAD_LOCAL, 0);
  program.emit(OP.CONST, c2);
  program.emit(OP.SUB);
  program.emit(OP.CALL, 1);

  program.emit(OP.ADD);
  program.emit(OP.RETURN);

  // --- Main ---
  program.patch(jumpOver + 1, program.instructions.length);

  const fibDesc = {
    name: 'fib',
    entryPC: fibEntryPC,
    paramCount: 1,
    localCount: 4
  };
  const cFibDesc = program.addConstant(fibDesc);
  program.emit(OP.CONST, cFibDesc);
  program.emit(OP.STORE_GLOBAL, cFibName);

  // Call fib(10)
  program.emit(OP.LOAD_GLOBAL, cFibName);
  const c10 = program.addConstant(10);
  program.emit(OP.CONST, c10);
  program.emit(OP.CALL, 1);
  program.emit(OP.HALT);

  const vm = new VirtualMachine();
  const gen = vm.execute(program);
  while (!gen.next().done) {}

  assert.strictEqual(vm.operandStack.pop(), 55);
  console.log('✅ Test 5 Passed: Recursive function call (fib(10) = 55)');
}

console.log('\n🎉 All UVM Core Tests Passed Successfully!');
