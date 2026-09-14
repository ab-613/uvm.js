// File: tests/test_terminal_buffer.js
import assert from 'assert';
import { UniversalInterpreter } from '../js/index.js';
import { VirtualTerminal } from '../js/vm/terminal.js';

async function run() {
  console.log('--- Testing VirtualTerminal & Console Control Codes ---');

  // 1. Direct VirtualTerminal Buffer Tests
  const term = new VirtualTerminal();

  // Overwriting with carriage return
  term.write('Loading: 0%');
  term.write('\rLoading: 50%');
  term.write('\rLoading: 100%\n');
  assert.strictEqual(term.getText(), 'Loading: 100%\n');

  // Backspace support
  term.write('Helo\b\blo');
  assert.strictEqual(term.lines[1], 'Helo');

  // Clear screen escape sequence
  term.write('\x1b[2J\x1b[HBrand New Screen\n');
  assert.strictEqual(term.getText(), 'Brand New Screen\n');

  // ANSI color code stripping
  term.write('\x1b[32m[PASS]\x1b[0m All tests green');
  assert.strictEqual(term.lines[1], '[PASS] All tests green');

  console.log('✅ VirtualTerminal unit tests passed');

  // 2. Python print(..., end='', sep='') tests
  const interp = new UniversalInterpreter();

  const res1 = await interp.run(`
print("Hello", end="")
print(" ", end="")
print("World!")
`);
  assert.strictEqual(res1.output.trim(), 'Hello World!');
  console.log('✅ Python print(end="") passed');

  const res2 = await interp.run(`
print("apple", "banana", "cherry", sep=" -> ")
`);
  assert.strictEqual(res2.output.trim(), 'apple -> banana -> cherry');
  console.log('✅ Python print(sep="...") passed');

  // 3. Python Carriage Return Line Replacement
  const res3 = await interp.run(`
print("Download: [===       ] 30%", end="\r")
print("Download: [======    ] 60%", end="\r")
print("Download: [==========] 100%")
`);
  assert.strictEqual(res3.output.trim(), 'Download: [==========] 100%');
  console.log('✅ Python line replacement via \\r passed');

  // 4. sys.stdout.write
  const res4 = await interp.run(`
import sys
sys.stdout.write("Dot")
sys.stdout.write(".")
sys.stdout.write(".")
sys.stdout.write("\\n")
`);
  assert.strictEqual(res4.output.trim(), 'Dot..');
  console.log('✅ sys.stdout.write passed');

  // 5. os.system('clear') and os.system('cls')
  const res5 = await interp.run(`
import os
print("First line to be cleared")
os.system("clear")
print("Clean slate!")
`);
  assert.strictEqual(res5.output.trim(), 'Clean slate!');
  console.log('✅ os.system("clear") passed');

  const res6 = await interp.run(`
import os
print("Windows clear test")
os.system("cls")
print("Clean slate Windows!")
`);
  assert.strictEqual(res6.output.trim(), 'Clean slate Windows!');
  console.log('✅ os.system("cls") passed');

  // 6. Direct ANSI screen clearing from Python
  const res7 = await interp.run(`
print("Old text")
print("\x1b[2J\x1b[HReplaced by ANSI clear!")
`);
  assert.strictEqual(res7.output.trim(), 'Replaced by ANSI clear!');
  console.log('✅ Python ANSI screen clearing passed');

  console.log('🎉 ALL TERMINAL & CONSOLE BUFFER TESTS PASSED!');
}

run().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});