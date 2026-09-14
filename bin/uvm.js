#!/usr/bin/env node
// File: bin/uvm.js
/**
 * Universal Virtual Machine (UVM) CLI
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { UniversalInterpreter, OP_NAMES, SYSCALL_NAMES } from '../js/index.js';

const VERSION = '3.5.0';

function printHelp() {
  console.log(`
Universal Virtual Machine (UVM) CLI v${VERSION}

Usage:
  uvm run <file> [options]       Execute a source file (.py, .java, .c)
  uvm -e "<code>" [options]      Execute inline code string
  uvm dis <file> [options]       Disassemble source file into UVM bytecode
  uvm repl [options]             Launch interactive terminal REPL
  uvm --help, -h                 Show this help screen
  uvm --version, -v              Print version

Options:
  -l, --lang <language>          Language mode ('python', 'java', 'c', 'auto') [default: auto]
  -t, --time-slice <ms>          Scheduler time slice quantum in ms [default: 16]
  --trace                        Print VM execution trace during run
`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printHelp();
    process.exit(0);
  }

  if (args.includes('--version') || args.includes('-v')) {
    console.log(`uvm v${VERSION}`);
    process.exit(0);
  }

  let language = 'auto';
  const langIdx = args.findIndex((a) => a === '-l' || a === '--lang');
  if (langIdx !== -1 && args[langIdx + 1]) {
    language = args[langIdx + 1].toLowerCase();
    args.splice(langIdx, 2);
  }

  const command = args[0];

  const uvm = new UniversalInterpreter({
    language,
    onPrint: (text) => process.stdout.write(text + '\n'),
    onInputRequired: (promptText, callback) => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      rl.question(promptText, (ans) => {
        rl.close();
        callback(ans);
      });
    },
  });

  if (command === 'run') {
    const filePath = args[1];
    if (!filePath) {
      console.error('Error: Missing file path for "run" command.');
      process.exit(1);
    }
    const resolvedPath = path.resolve(process.cwd(), filePath);
    if (!fs.existsSync(resolvedPath)) {
      console.error(`Error: File not found: ${resolvedPath}`);
      process.exit(1);
    }

    // Auto-detect language by file extension if auto
    if (language === 'auto') {
      const ext = path.extname(resolvedPath).toLowerCase();
      if (ext === '.py') language = 'python';
      else if (ext === '.java') language = 'java';
      else if (ext === '.c') language = 'c';
    }

    const source = fs.readFileSync(resolvedPath, 'utf8');
    try {
      await uvm.run(source, { language });
    } catch (err) {
      console.error(`\n[Execution Error] ${err.message || err}`);
      process.exit(1);
    }
  } else if (command === '-e') {
    const code = args[1];
    if (!code) {
      console.error('Error: Missing code string for "-e" flag.');
      process.exit(1);
    }
    try {
      await uvm.run(code, { language });
    } catch (err) {
      console.error(`\n[Execution Error] ${err.message || err}`);
      process.exit(1);
    }
  } else if (command === 'dis') {
    const filePath = args[1];
    if (!filePath) {
      console.error('Error: Missing file path for "dis" command.');
      process.exit(1);
    }
    const resolvedPath = path.resolve(process.cwd(), filePath);
    if (!fs.existsSync(resolvedPath)) {
      console.error(`Error: File not found: ${resolvedPath}`);
      process.exit(1);
    }
    const source = fs.readFileSync(resolvedPath, 'utf8');
    try {
      const program = uvm.compile(source, language);
      console.log(program.disassemble());
    } catch (err) {
      console.error(`\n[Compilation Error] ${err.message || err}`);
      process.exit(1);
    }
  } else if (command === 'repl') {
    console.log(`=== UVM Interactive REPL (${language.toUpperCase()}) ===`);
    console.log('Type ".exit" or press Ctrl+C to quit.\n');

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: `${language}> `,
    });

    rl.prompt();

    rl.on('line', async (line) => {
      const trimmed = line.trim();
      if (trimmed === '.exit') {
        rl.close();
        return;
      }
      if (trimmed) {
        try {
          const res = await uvm.run(trimmed, { language });
          if (res.value !== null && res.value !== undefined && !res.output) {
            console.log(res.value);
          }
        } catch (err) {
          console.error(`Error: ${err.message || err}`);
        }
      }
      rl.prompt();
    });

    rl.on('close', () => {
      console.log('\nExiting UVM REPL.');
      process.exit(0);
    });
  } else {
    // Treat as run <file> if file exists
    const resolvedPath = path.resolve(process.cwd(), command);
    if (fs.existsSync(resolvedPath)) {
      const ext = path.extname(resolvedPath).toLowerCase();
      if (ext === '.py') language = 'python';
      else if (ext === '.java') language = 'java';
      else if (ext === '.c') language = 'c';

      const source = fs.readFileSync(resolvedPath, 'utf8');
      try {
        await uvm.run(source, { language });
      } catch (err) {
        console.error(`\n[Execution Error] ${err.message || err}`);
        process.exit(1);
      }
    } else {
      console.error(`Unknown command or file: ${command}`);
      printHelp();
      process.exit(1);
    }
  }
}

main();
