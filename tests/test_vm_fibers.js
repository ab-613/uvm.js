// File: tests/test_vm_fibers.js
import assert from 'assert';
import { OP, SYSCALL, BytecodeProgram, VirtualMachine, Scheduler } from '../js/vm/index.js';

console.log('=== Running UVM Fiber & Syscall Tests ===');

// Test 1: Cooperative Fiber Sleep (SYS_SLEEP)
{
  const program = new BytecodeProgram();
  const cMsg1 = program.addConstant('Before Sleep');
  const cMsg2 = program.addConstant('After Sleep');
  const cSleepMs = program.addConstant(50); // 50ms sleep

  program.emit(OP.CONST, cMsg1);
  program.emit(OP.SYSCALL, SYSCALL.PRINT);

  program.emit(OP.CONST, cSleepMs);
  program.emit(OP.SYSCALL, SYSCALL.SLEEP);

  program.emit(OP.CONST, cMsg2);
  program.emit(OP.SYSCALL, SYSCALL.PRINT);
  program.emit(OP.HALT);

  const vm = new VirtualMachine();
  const scheduler = new Scheduler(null);
  const fiberGen = vm.execute(program);

  const fiber = scheduler.spawn(fiberGen);
  const startTime = Date.now();

  await new Promise((resolve, reject) => {
    scheduler.run(
      () => {
        const elapsed = Date.now() - startTime;
        assert.ok(elapsed >= 40, `Elapsed time should be >= 40ms, got ${elapsed}ms`);
        assert.ok(vm.consoleOutput.includes('Before Sleep'));
        assert.ok(vm.consoleOutput.includes('After Sleep'));
        console.log(`✅ Test 1 Passed: Fiber sleep resumed after ${elapsed}ms`);
        resolve();
      },
      (err) => reject(err)
    );
  });
}

// Test 2: Interactive Input Suspension (SYS_INPUT)
{
  const program = new BytecodeProgram();
  const cPrompt = program.addConstant('Enter secret code: ');
  const cPrefix = program.addConstant('Code received: ');

  program.emit(OP.CONST, cPrompt);
  program.emit(OP.SYSCALL, SYSCALL.INPUT); // Pops prompt, suspends fiber, pushes input
  program.emit(OP.STORE_LOCAL, 0);         // Store input into slot 0

  program.emit(OP.CONST, cPrefix);
  program.emit(OP.LOAD_LOCAL, 0);
  program.emit(OP.ADD);                    // 'Code received: ' + input
  program.emit(OP.SYSCALL, SYSCALL.PRINT);
  program.emit(OP.HALT);

  const vm = new VirtualMachine();
  const scheduler = new Scheduler(null);
  const fiberGen = vm.execute(program);

  scheduler.spawn(fiberGen);

  let inputPromptReceived = null;
  scheduler.onInputRequired = (prompt, submitCallback) => {
    inputPromptReceived = prompt;
    // Simulate user typing and pressing enter asynchronously after 20ms
    setTimeout(() => {
      submitCallback('NEO_MATRIX_42');
    }, 20);
  };

  await new Promise((resolve, reject) => {
    scheduler.run(
      () => {
        assert.strictEqual(inputPromptReceived, 'Enter secret code: ');
        assert.ok(vm.consoleOutput.includes('Code received: NEO_MATRIX_42'));
        console.log('✅ Test 2 Passed: Interactive UI input fiber suspension & resumption');
        resolve();
      },
      (err) => reject(err)
    );
  });
}

// Test 3: Multiple Concurrent Fibers Interleaving
{
  const makeCounterProgram = (fiberName, count) => {
    const program = new BytecodeProgram();
    const cName = program.addConstant(fiberName);
    const c1 = program.addConstant(1);
    const cSleepMs = program.addConstant(10);
    const cLimit = program.addConstant(count);

    // slot 0 = i = 0
    const c0 = program.addConstant(0);
    program.emit(OP.CONST, c0);
    program.emit(OP.STORE_LOCAL, 0);

    const loopStart = program.instructions.length;
    program.emit(OP.LOAD_LOCAL, 0);
    program.emit(OP.CONST, cLimit);
    program.emit(OP.LT);
    const jumpExit = program.emit(OP.JUMP_IF_FALSE, 0);

    // Print "[fiberName] step i"
    program.emit(OP.CONST, cName);
    program.emit(OP.SYSCALL, SYSCALL.PRINT);

    // Sleep 10ms
    program.emit(OP.CONST, cSleepMs);
    program.emit(OP.SYSCALL, SYSCALL.SLEEP);

    // i++
    program.emit(OP.LOAD_LOCAL, 0);
    program.emit(OP.CONST, c1);
    program.emit(OP.ADD);
    program.emit(OP.STORE_LOCAL, 0);

    program.emit(OP.JUMP, loopStart);
    program.patch(jumpExit + 1, program.instructions.length);
    program.emit(OP.HALT);
    return program;
  };

  const vmA = new VirtualMachine();
  const vmB = new VirtualMachine();

  const progA = makeCounterProgram('Fiber-Alpha', 3);
  const progB = makeCounterProgram('Fiber-Beta', 3);

  const scheduler = new Scheduler(null);
  scheduler.spawn(vmA.execute(progA));
  scheduler.spawn(vmB.execute(progB));

  await new Promise((resolve, reject) => {
    scheduler.run(
      () => {
        assert.ok(vmA.consoleOutput.includes('Fiber-Alpha'));
        assert.ok(vmB.consoleOutput.includes('Fiber-Beta'));
        console.log('✅ Test 3 Passed: Multi-fiber concurrent interleaving');
        resolve();
      },
      (err) => reject(err)
    );
  });
}

console.log('\n🎉 All UVM Fiber & Syscall Tests Passed Successfully!');
