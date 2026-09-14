// File: tests/test_ohm_frontend.js
import assert from 'assert';
import { parseSource } from '../js/frontend/index.js';
import { BytecodeCompiler, VirtualMachine, Scheduler } from '../js/vm/index.js';

console.log('=== Running Ohm.js Frontend & End-to-End Pipeline Tests ===\n');

// Test 1: Parse Java class with 'throws Exception' and typed array (the original failing test!)
{
  const code = `
    public class Main {
        public static void main(String[] args) throws Exception {
            int x = 10;
            int y = 20;
            int sum = x + y;
            print(sum);
        }
    }
  `;

  const ast = parseSource(code);
  assert.strictEqual(ast.type, 'Program');
  assert.strictEqual(ast.body[0].type, 'ClassDeclaration');
  assert.strictEqual(ast.body[0].name, 'Main');
  assert.strictEqual(ast.body[0].body[0].type, 'FunctionDeclaration');
  assert.strictEqual(ast.body[0].body[0].name, 'main');
  console.log('✅ Test 1 Passed: Parsed Java class with throws Exception and String[] args');
}

// Test 2: Operator precedence (2 + 3 * 4 == 14)
{
  const code = `
    int res = 2 + 3 * 4;
    print(res);
  `;

  const ast = parseSource(code);
  const compiler = new BytecodeCompiler();
  const program = compiler.compile(ast);

  const vm = new VirtualMachine();
  const gen = vm.execute(program);
  while (!gen.next().done) {}

  assert.ok(vm.consoleOutput.includes('14'));
  console.log('✅ Test 2 Passed: Operator precedence (2 + 3 * 4 = 14)');
}

// Test 3: C-Style For Loop (sum 1..10 = 55)
{
  const code = `
    int sum = 0;
    for (int i = 1; i <= 10; i++) {
        sum = sum + i;
    }
    print(sum);
  `;

  const ast = parseSource(code);
  const compiler = new BytecodeCompiler();
  const program = compiler.compile(ast);

  const vm = new VirtualMachine();
  const gen = vm.execute(program);
  while (!gen.next().done) {}

  assert.ok(vm.consoleOutput.includes('55'));
  console.log('✅ Test 3 Passed: C-style for loop execution (sum 1..10 = 55)');
}

// Test 4: Complete End-to-End: Source -> Ohm -> Bytecode -> VM -> Fiber Scheduler (with Sleep!)
{
  const code = `
    void runTask() {
        print("Starting task...");
        sleep(50);
        int a = 15;
        int b = 30;
        print("Result: " + (a + b));
    }
    runTask();
  `;

  const ast = parseSource(code);
  const compiler = new BytecodeCompiler();
  const program = compiler.compile(ast);

  console.log('Compiled Program Disassembly:\n' + program.disassemble());

  const vm = new VirtualMachine();
  const scheduler = new Scheduler(null);
  const fiberGen = vm.execute(program);
  scheduler.spawn(fiberGen);

  const startTime = Date.now();
  await new Promise((resolve, reject) => {
    scheduler.run(
      () => {
        const elapsed = Date.now() - startTime;
        assert.ok(elapsed >= 40, `Elapsed time should be >= 40ms, got ${elapsed}ms`);
        assert.ok(vm.consoleOutput.includes('Starting task...'));
        assert.ok(vm.consoleOutput.includes('Result: 45'));
        console.log(`✅ Test 4 Passed: Full pipeline Source -> Ohm -> Bytecode -> VM -> Scheduler (${elapsed}ms)`);
        resolve();
      },
      (err) => reject(err)
    );
  });
}

// Test 5: Syntax Error Quality Diagnostic
{
  const brokenCode = `
    int a = 10;
    int b = ; // Missing expression
  `;

  try {
    parseSource(brokenCode);
    assert.fail('Should have thrown a SyntaxError');
  } catch (err) {
    assert.ok(err.message.includes('Syntax Error:'));
    assert.ok(err.message.includes('Line 3, col 13'));
    console.log('✅ Test 5 Passed: Ohm.js produces exact, readable syntax error diagnostics:\n');
    console.log(err.message);
  }
}

console.log('🎉 All Ohm.js Frontend Tests Passed Successfully!\n');
