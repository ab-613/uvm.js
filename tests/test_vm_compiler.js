// File: tests/test_vm_compiler.js
import assert from 'assert';
import { BytecodeCompiler, VirtualMachine } from '../js/vm/index.js';

console.log('=== Running UVM Compiler Integration Tests ===');

// Test 1: Compile and run variable declarations and arithmetic
{
  const ast = {
    type: 'Program',
    body: [
      {
        type: 'VariableDeclarationStatement',
        name: 'x',
        expression: { type: 'Literal', value: 10 }
      },
      {
        type: 'VariableDeclarationStatement',
        name: 'y',
        expression: {
          type: 'BinaryExpression',
          operator: '+',
          left: { type: 'Identifier', name: 'x' },
          right: { type: 'Literal', value: 25 }
        }
      },
      {
        type: 'ExpressionStatement',
        expression: {
          type: 'CallExpression',
          callee: { type: 'Identifier', name: 'print' },
          arguments: [{ type: 'Identifier', name: 'y' }]
        }
      }
    ]
  };

  const compiler = new BytecodeCompiler();
  const program = compiler.compile(ast);

  console.log('Compiled Program 1 Disassembly:\n' + program.disassemble());

  const vm = new VirtualMachine();
  const gen = vm.execute(program);
  while (!gen.next().done) {}

  assert.ok(vm.consoleOutput.includes('35'));
  console.log('✅ Test 1 Passed: Variable declaration and arithmetic compilation');
}

// Test 2: Compile and run If-Else condition
{
  const ast = {
    type: 'Program',
    body: [
      {
        type: 'VariableDeclarationStatement',
        name: 'score',
        expression: { type: 'Literal', value: 85 }
      },
      {
        type: 'IfStatement',
        test: {
          type: 'BinaryExpression',
          operator: '>=',
          left: { type: 'Identifier', name: 'score' },
          right: { type: 'Literal', value: 70 }
        },
        consequent: [
          {
            type: 'ExpressionStatement',
            expression: {
              type: 'CallExpression',
              callee: { type: 'Identifier', name: 'print' },
              arguments: [{ type: 'Literal', value: 'PASS' }]
            }
          }
        ],
        alternate: [
          {
            type: 'ExpressionStatement',
            expression: {
              type: 'CallExpression',
              callee: { type: 'Identifier', name: 'print' },
              arguments: [{ type: 'Literal', value: 'FAIL' }]
            }
          }
        ]
      }
    ]
  };

  const compiler = new BytecodeCompiler();
  const program = compiler.compile(ast);

  const vm = new VirtualMachine();
  const gen = vm.execute(program);
  while (!gen.next().done) {}

  assert.ok(vm.consoleOutput.includes('PASS'));
  assert.ok(!vm.consoleOutput.includes('FAIL'));
  console.log('✅ Test 2 Passed: If-Else branching compilation & execution');
}

// Test 3: Compile and run While loop
{
  const ast = {
    type: 'Program',
    body: [
      {
        type: 'VariableDeclarationStatement',
        name: 'count',
        expression: { type: 'Literal', value: 0 }
      },
      {
        type: 'VariableDeclarationStatement',
        name: 'total',
        expression: { type: 'Literal', value: 0 }
      },
      {
        type: 'WhileStatement',
        test: {
          type: 'BinaryExpression',
          operator: '<',
          left: { type: 'Identifier', name: 'count' },
          right: { type: 'Literal', value: 5 }
        },
        body: [
          {
            type: 'ExpressionStatement',
            expression: {
              type: 'BinaryExpression',
              operator: '=',
              left: { type: 'Identifier', name: 'total' },
              right: {
                type: 'BinaryExpression',
                operator: '+',
                left: { type: 'Identifier', name: 'total' },
                right: { type: 'Literal', value: 10 }
              }
            }
          },
          {
            type: 'ExpressionStatement',
            expression: {
              type: 'UpdateExpression',
              operator: '++',
              argument: { type: 'Identifier', name: 'count' },
              prefix: false
            }
          }
        ]
      },
      {
        type: 'ExpressionStatement',
        expression: {
          type: 'CallExpression',
          callee: { type: 'Identifier', name: 'print' },
          arguments: [{ type: 'Identifier', name: 'total' }]
        }
      }
    ]
  };

  const compiler = new BytecodeCompiler();
  const program = compiler.compile(ast);

  const vm = new VirtualMachine();
  const gen = vm.execute(program);
  while (!gen.next().done) {}

  assert.ok(vm.consoleOutput.includes('50'));
  console.log('✅ Test 3 Passed: While loop compilation & update expressions');
}

// Test 4: Compile and run user-defined function with return
{
  const ast = {
    type: 'Program',
    body: [
      {
        type: 'FunctionDeclaration',
        name: 'multiply',
        params: [{ name: 'a' }, { name: 'b' }],
        body: [
          {
            type: 'ReturnStatement',
            argument: {
              type: 'BinaryExpression',
              operator: '*',
              left: { type: 'Identifier', name: 'a' },
              right: { type: 'Identifier', name: 'b' }
            }
          }
        ]
      },
      {
        type: 'VariableDeclarationStatement',
        name: 'res',
        expression: {
          type: 'CallExpression',
          callee: { type: 'Identifier', name: 'multiply' },
          arguments: [
            { type: 'Literal', value: 7 },
            { type: 'Literal', value: 8 }
          ]
        }
      },
      {
        type: 'ExpressionStatement',
        expression: {
          type: 'CallExpression',
          callee: { type: 'Identifier', name: 'print' },
          arguments: [{ type: 'Identifier', name: 'res' }]
        }
      }
    ]
  };

  const compiler = new BytecodeCompiler();
  const program = compiler.compile(ast);

  console.log('Compiled Function Program Disassembly:\n' + program.disassemble());

  const vm = new VirtualMachine();
  const gen = vm.execute(program);
  while (!gen.next().done) {}

  assert.ok(vm.consoleOutput.includes('56'));
  console.log('✅ Test 4 Passed: Function declaration and call compilation');
}

console.log('\n🎉 All UVM Compiler Tests Passed Successfully!');
