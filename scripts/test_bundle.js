import fs from 'fs';
import vm from 'vm';

console.log('Testing standalone dist/uvm.min.js bundle execution...');

const code = fs.readFileSync('dist/uvm.min.js', 'utf8');
const context = {
  window: {},
  console: console,
  performance: performance,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout
};
context.window = context;
context.globalThis = context;

vm.createContext(context);
vm.runInContext(code, context);

if (!context.UniversalInterpreter && !context.UVM) {
  throw new Error('UniversalInterpreter not found on global/window object!');
}

console.log('Found UniversalInterpreter on window / global context.');

const interpreter = new (context.UniversalInterpreter || context.UVM.UniversalInterpreter)();
const syncRes = interpreter.runSync('print(f"fib(7) = {13}")', { language: 'python' });
console.log('Sync execution output:', syncRes.output);

if (!syncRes.output.includes('fib(7) = 13')) {
  throw new Error('Unexpected output: ' + syncRes.output);
}

interpreter.run('x = [i * 2 for i in range(5)]\nprint("evens:", x)', { language: 'python' }).then(res => {
  console.log('Async execution output:', res.output);
  if (!res.output.includes('evens: [0,2,4,6,8]')) {
    throw new Error('Unexpected async output: ' + res.output);
  }
  console.log('✅ Standalone bundle test passed successfully!');
}).catch(err => {
  console.error('Execution error:', err);
  process.exit(1);
});
