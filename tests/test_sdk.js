// File: tests/test_sdk.js
import assert from 'assert';
import { UniversalInterpreter, parseSource, BytecodeCompiler, VirtualMachine, vfs } from '../js/index.js';

console.log('=== Running Universal Interpreter SDK Tests ===\n');

const uvm = new UniversalInterpreter();

// Test 1: Python execution via SDK
{
  console.log('Testing Python via UniversalInterpreter.run()...');
  const code = `
def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n - 1)

print(f"5! = {factorial(5)}")
`;
  const result = await uvm.run(code, { language: 'python' });
  assert.strictEqual(result.output.trim(), '5! = 120');
  console.log(`  ✅ Passed: Python executed in ${result.durationMs.toFixed(1)}ms`);
}

// Test 2: Java execution via SDK
{
  console.log('Testing Java via UniversalInterpreter.run()...');
  const code = `
public class Main {
    public static void main(String[] args) {
        int a = 15;
        int b = 30;
        print(a + b);
    }
}
`;
  const result = await uvm.run(code, { language: 'java' });
  assert.strictEqual(result.output.trim(), '45');
  console.log(`  ✅ Passed: Java executed in ${result.durationMs.toFixed(1)}ms`);
}

// Test 3: C language subset via SDK
{
  console.log('Testing C via UniversalInterpreter.run()...');
  const code = `
int sum_up(int n) {
    int total = 0;
    for (int i = 1; i <= n; i = i + 1) {
        total = total + i;
    }
    return total;
}

void main() {
    print(sum_up(10));
}
`;
  const result = await uvm.run(code, { language: 'c' });
  assert.strictEqual(result.output.trim(), '55');
  console.log(`  ✅ Passed: C executed in ${result.durationMs.toFixed(1)}ms`);
}

// Test 4: Synchronous execution via UniversalInterpreter.runSync()
{
  console.log('Testing UniversalInterpreter.runSync()...');
  const result = uvm.runSync('print(100 * 20)', { language: 'python' });
  assert.strictEqual(result.output.trim(), '2000');
  console.log(`  ✅ Passed: runSync executed in ${result.durationMs.toFixed(1)}ms`);
}

// Test 5: Compilation and Disassembly
{
  console.log('Testing uvm.compile() and disassembly...');
  const program = uvm.compile('x = 10 + 20\nprint(x)', 'python');
  const dis = program.disassemble();
  assert.ok(dis.includes('ADD'), 'Disassembly should contain ADD opcode');
  assert.ok(dis.includes('SYS_PRINT'), 'Disassembly should contain SYS_PRINT syscall');
  console.log('  ✅ Passed: Program compiled and disassembled.');
}

console.log('\n🎉 All SDK Tests Passed with 100% Success!\n');
