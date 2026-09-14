// File: tests/test_vm_stepping.js
import { parsePythonSource } from '../js/frontend/python.js';
import { BytecodeCompiler } from '../js/vm/compiler.js';
import { VirtualMachine } from '../js/vm/vm.js';
import { moduleManager } from '../js/vm/modules.js';

function runSteppingTests() {
  console.log('=== Running UVM Instruction Stepping & Stepper Tests ===\n');

  const code = `
x = 10
y = 20
z = x + y
print("Sum is:", z)
`;

  const ast = parsePythonSource(code);
  const compiler = new BytecodeCompiler();
  const prog = compiler.compile(ast);

  const vm = new VirtualMachine({ moduleManager });
  vm.singleStepMode = true;
  const gen = vm.execute(prog);

  console.log('Testing single-step execution instruction by instruction...');
  let steps = 0;
  let lastPc = -1;
  const seenPcs = [];

  while (true) {
    const res = gen.next();
    steps++;
    if (res.done) {
      console.log(`Program finished after ${steps} step cycles (returned ${res.value})`);
      break;
    }

    if (res.value && res.value.type === 'STEP') {
      const pc = res.value.pc;
      seenPcs.push(pc);
      if (pc === lastPc && pc !== 0) {
        throw new Error(`Stepper stalled at PC ${pc}`);
      }
      lastPc = pc;
      const snapshot = vm.getExecutionSnapshot();
      if (!Array.isArray(snapshot.stack) || !Array.isArray(snapshot.operandStack)) {
        throw new Error(`Snapshot stack or operandStack missing array on PC ${pc}`);
      }
      if (snapshot.stack.length !== snapshot.operandStack.length) {
        throw new Error(`Snapshot stack and operandStack length mismatch`);
      }
    }

    if (steps > 100) {
      throw new Error('Infinite loop detected in stepper test');
    }
  }

  if (steps < 10) {
    throw new Error(`Expected at least 10 instructions, got only ${steps} steps`);
  }

  if (vm.consoleOutput.trim() !== 'Sum is: 30') {
    throw new Error(`Expected output "Sum is: 30", got "${vm.consoleOutput}"`);
  }

  console.log(`✅ Test Passed: Stepper executed ${seenPcs.length} opcodes individually without leaping to the end!`);
  console.log('Final output:', vm.consoleOutput.trim());
  console.log('Unique PCs visited:', seenPcs.length);
}

async function runAsyncSteppingTests() {
  console.log('\nTesting async request single-step execution...');
  const code = `
import requests
res = requests.get("https://jsonplaceholder.typicode.com/todos/1")
print("Status:", res.status_code)
`;

  const ast = parsePythonSource(code);
  const compiler = new BytecodeCompiler();
  const prog = compiler.compile(ast);

  const vm = new VirtualMachine({ moduleManager });
  vm.singleStepMode = true;
  const gen = vm.execute(prog);

  let stepRes = gen.next();
  let stepCount = 0;

  while (!stepRes.done) {
    stepCount++;
    stepRes = gen.next();
    if (stepRes.done) break;

    while (!stepRes.done && stepRes.value && stepRes.value.type !== 'STEP') {
      const cmd = stepRes.value;
      if (cmd.type === 'ASYNC_PROMISE') {
        const resolved = await cmd.promise;
        stepRes = gen.next(resolved);
      } else {
        stepRes = gen.next();
      }
    }
  }

  if (vm.consoleOutput.trim() !== 'Status: 200') {
    throw new Error(`Expected output "Status: 200", got "${vm.consoleOutput}"`);
  }

  console.log(`✅ Test Passed: Async stepping successfully executed across ${stepCount} steps without null pointer!`);
}

async function main() {
  runSteppingTests();
  await runAsyncSteppingTests();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
