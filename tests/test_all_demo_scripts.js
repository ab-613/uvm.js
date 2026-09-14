// File: tests/test_all_demo_scripts.js
import assert from 'assert';
import { parseSource } from '../js/frontend/index.js';
import { BytecodeCompiler, VirtualMachine, moduleManager, Scheduler } from '../js/vm/index.js';
import { DEMO_SCRIPTS } from '../js/frontend/demo_scripts.js';

console.log('=== Verifying All Web UI Demo Scripts ===\n');

for (const [key, script] of Object.entries(DEMO_SCRIPTS)) {
  console.log(`Checking demo: ${key}...`);

  // 0. Pre-fetch remote imports if missing
  const matches = script.matchAll(/(?:from\s+([a-zA-Z0-9_]+)\s+import|import\s+([a-zA-Z0-9_]+))/g);
  for (const match of matches) {
    const modName = match[1] || match[2];
    if (modName && !moduleManager.hasModule(modName)) {
      try {
        await moduleManager.fetchAndCacheModule(modName);
      } catch (e) {}
    }
  }

  // 1. Parse
  const ast = parseSource(script);
  assert.ok(ast, `Failed to parse ${key}`);

  // 2. Compile
  const compiler = new BytecodeCompiler();
  const program = compiler.compile(ast);
  assert.ok(program.instructions.length > 0, `No instructions for ${key}`);

  // 3. Execute
  const vm = new VirtualMachine({ moduleManager });
  const scheduler = new Scheduler(null);
  scheduler.spawn(vm.execute(program));

  const origFetch = globalThis.fetch;
  if (key === 'real_api_requests') {
    globalThis.fetch = async (url, opts = {}) => {
      const urlStr = String(url);
      if (urlStr.includes('todos/1')) {
        return {
          status: 200,
          statusText: 'OK',
          ok: true,
          json: async () => ({ id: 1, title: 'delectus aut autem', completed: false }),
          text: async () => JSON.stringify({ id: 1, title: 'delectus aut autem', completed: false })
        };
      }
      if (urlStr.includes('posts')) {
        let parsedPayload = { title: 'UVM Polyglot Runtime', userId: 42 };
        try {
          if (opts.body) parsedPayload = JSON.parse(opts.body);
        } catch {}
        return {
          status: 201,
          statusText: 'Created',
          ok: true,
          json: async () => ({ id: 101, ...parsedPayload }),
          text: async () => JSON.stringify({ id: 101, ...parsedPayload })
        };
      }
      return origFetch ? origFetch(url, opts) : { status: 200, ok: true, json: async () => ({}), text: async () => '' };
    };
  }

  if (key === 'ascii_star_wars') {
    globalThis.fetch = async (url, opts = {}) => {
      let mockData = '';
      for (let f = 0; f < 3; f++) {
        mockData += '1\n' + ' '.repeat(10) + 'STAR WARS TEST FRAME ' + f + '\n' + '\n'.repeat(12);
      }
      return {
        status: 200,
        statusText: 'OK',
        ok: true,
        text: async () => mockData
      };
    };
  }

  if (key === 'interactive_input') {
    scheduler.onInputRequired = (prompt, callback) => {
      callback('MOCK_INPUT');
    };
  }

  try {
    await new Promise((resolve, reject) => {
      scheduler.run(
        () => {
          console.log(`  ✅ Passed: ${key} (${program.instructions.length} opcodes)\n`);
          resolve();
        },
        (err) => reject(err)
      );
    });
  } finally {
    globalThis.fetch = origFetch;
  }
}

console.log('🎉 All Demo Scripts Verified Successfully!\n');
