// File: js/vm/compiler.js
import { OP } from './opcodes.js';
import { SYSCALL } from './syscalls.js';
import { BytecodeProgram } from './program.js';

/**
 * Compiles a high-level AST into a BytecodeProgram.
 */
export class BytecodeCompiler {
  constructor() {
    this.program = new BytecodeProgram();
    this.scopes = [new Map()]; // Stack of variable name -> slot index
    this.scopeIsFunction = [true];
    this.nextSlot = [0];        // Stack of next available slot per scope
    this.globalVariables = new Set(); // Set of names declared via 'global'
    this.loopBreakJumps = [];   // Stack of arrays of break jump PCs
    this.loopContinueTargets = []; // Stack of continue target PCs
    this.nodeCounter = 0;
  }

  /**
   * Main compile entry point.
   */
  compile(ast) {
    this.program = new BytecodeProgram();
    this.scopes = [new Map()];
    this.scopeIsFunction = [true];
    this.nextSlot = [0];
    this.globalVariables = new Set();
    this.loopBreakJumps = [];
    this.loopContinueTargets = [];
    this.nodeCounter = 0;

    this.visit(ast);
    this.program.emit(OP.HALT);
    return this.program;
  }

  // Scope helper methods
  enterScope(isFunction = false) {
    this.scopes.push(new Map());
    this.scopeIsFunction.push(isFunction);
    this.nextSlot.push(isFunction ? 0 : this.nextSlot[this.nextSlot.length - 1]);
  }

  exitScope() {
    this.scopes.pop();
    this.scopeIsFunction.pop();
    this.nextSlot.pop();
  }

  declareLocal(name) {
    const currentScope = this.scopes[this.scopes.length - 1];
    if (currentScope.has(name)) {
      return currentScope.get(name);
    }
    const slot = this.nextSlot[this.nextSlot.length - 1]++;
    currentScope.set(name, slot);
    return slot;
  }

  resolveVariable(name) {
    if (this.globalVariables.has(name)) {
      return { type: 'global', name };
    }
    let functionHops = 0;
    for (let i = this.scopes.length - 1; i >= 0; i--) {
      if (this.scopes[i].has(name)) {
        return { type: 'local', slot: this.scopes[i].get(name), hops: functionHops };
      }
      if (this.scopeIsFunction[i]) {
        functionHops++;
      }
    }
    return { type: 'global', name };
  }

  collectAssignedVariables(node, targetSet = new Set(), explicitGlobals = new Set()) {
    if (!node) return targetSet;
    if (Array.isArray(node)) {
      for (const item of node) this.collectAssignedVariables(item, targetSet, explicitGlobals);
      return targetSet;
    }

    if (node.type === 'GlobalStatement' || node.type === 'NonlocalStatement') {
      for (const name of node.names || []) explicitGlobals.add(name);
      return targetSet;
    }

    // Do not recurse into nested function declarations or expressions
    if (node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression') {
      return targetSet;
    }

    if (node.type === 'VariableDeclarationStatement' || node.type === 'VariableDeclaration') {
      const name = node.name || (node.target && node.target.name);
      if (name && !explicitGlobals.has(name)) targetSet.add(name);
    } else if (node.type === 'BinaryExpression' && node.operator === '=') {
      if (node.left && node.left.type === 'Identifier') {
        const name = node.left.name;
        if (!explicitGlobals.has(name)) targetSet.add(name);
      }
    }

    for (const key of Object.keys(node)) {
      const val = node[key];
      if (val && typeof val === 'object') {
        this.collectAssignedVariables(val, targetSet, explicitGlobals);
      }
    }
    return targetSet;
  }

  // AST Visitor
  visit(node) {
    if (!node) return;

    if (typeof node === 'object') {
      if (node._nodeId === undefined) {
        node._nodeId = ++this.nodeCounter;
      }
      if (node.type && node.type !== 'Program') {
        const pc = this.program.instructions.length;
        if (!this.program.sourceMap.has(pc)) {
          this.program.sourceMap.set(pc, {
            nodeId: node._nodeId,
            type: node.type,
            node
          });
        }
      }
    }

    switch (node.type) {
      case 'Program': {
        const body = node.body || [];
        for (const stmt of body) {
          this.visit(stmt);
        }
        break;
      }

      case 'ClassDeclaration': {
        const members = node.body || [];
        for (const member of members) {
          this.visit(member);
        }
        break;
      }

      case 'Literal': {
        if (node.value === true) {
          this.program.emit(OP.TRUE);
        } else if (node.value === false) {
          this.program.emit(OP.FALSE);
        } else if (node.value === null) {
          this.program.emit(OP.NIL);
        } else {
          const constIdx = this.program.addConstant(node.value);
          this.program.emit(OP.CONST, constIdx);
        }
        break;
      }

      case 'Identifier': {
        const resolved = this.resolveVariable(node.name);
        if (resolved.type === 'local') {
          if (resolved.hops > 0) {
            this.program.emit(OP.LOAD_UPVALUE, resolved.slot, resolved.hops);
          } else {
            this.program.emit(OP.LOAD_LOCAL, resolved.slot);
          }
        } else {
          const constIdx = this.program.addConstant(resolved.name);
          this.program.emit(OP.LOAD_GLOBAL, constIdx);
        }
        break;
      }

      case 'VariableDeclarationStatement':
      case 'VariableDeclaration': {
        const name = node.name || (node.target && node.target.name);
        if (node.expression) {
          this.visit(node.expression);
        } else {
          this.program.emit(OP.NIL);
        }
        const slot = this.declareLocal(name);
        this.program.emit(OP.STORE_LOCAL, slot);
        break;
      }

      case 'ExpressionStatement': {
        this.visit(node.expression);
        // Clean up expression value from operand stack if not inside an assignment
        this.program.emit(OP.POP);
        break;
      }

      case 'BinaryExpression': {
        // Assignment operator handling (=, +=, -=, etc.)
        if (node.operator === '=') {
          if (node.left.type === 'Identifier') {
            this.visit(node.right);
            const resolved = this.resolveVariable(node.left.name);
            if (resolved.type === 'local') {
              this.program.emit(OP.DUP); // Keep assignment result on stack
              if (resolved.hops > 0) {
                this.program.emit(OP.STORE_UPVALUE, resolved.slot, resolved.hops);
              } else {
                this.program.emit(OP.STORE_LOCAL, resolved.slot);
              }
            } else {
              const constIdx = this.program.addConstant(resolved.name);
              this.program.emit(OP.DUP);
              this.program.emit(OP.STORE_GLOBAL, constIdx);
            }
          } else if (node.left.type === 'IndexExpression' || node.left.type === 'SubscriptExpression') {
            this.visit(node.left.object);
            this.visit(node.left.index);
            this.visit(node.right);
            this.program.emit(OP.SET_INDEX);
          } else if (node.left.type === 'MemberExpression') {
            this.visit(node.left.object);
            this.visit(node.right);
            const prop = node.left.property.name !== undefined ? node.left.property.name : node.left.property.value;
            const propIdx = this.program.addConstant(prop);
            this.program.emit(OP.SET_MEMBER, propIdx);
          }
          break;
        }

        // Short-circuit logical operators
        if (node.operator === 'and' || node.operator === '&&') {
          this.visit(node.left);
          this.program.emit(OP.DUP);
          const jumpFalsePc = this.program.emit(OP.JUMP_IF_FALSE, 0);
          this.program.emit(OP.POP);
          this.visit(node.right);
          this.program.patch(jumpFalsePc + 1, this.program.instructions.length);
          break;
        }

        if (node.operator === 'or' || node.operator === '||') {
          this.visit(node.left);
          this.program.emit(OP.DUP);
          const jumpTruePc = this.program.emit(OP.JUMP_IF_TRUE, 0);
          this.program.emit(OP.POP);
          this.visit(node.right);
          this.program.patch(jumpTruePc + 1, this.program.instructions.length);
          break;
        }

        // Standard binary operator
        this.visit(node.left);
        this.visit(node.right);

        switch (node.operator) {
          case '+':  this.program.emit(OP.ADD); break;
          case '-':  this.program.emit(OP.SUB); break;
          case '*':  this.program.emit(OP.MUL); break;
          case '/':  this.program.emit(OP.DIV); break;
          case '//': this.program.emit(OP.IDIV); break;
          case '%':  this.program.emit(OP.MOD); break;
          case '**': this.program.emit(OP.POW); break;
          case '@':  this.program.emit(OP.MATMUL); break;
          case '==':
          case '===': this.program.emit(OP.EQ); break;
          case '!=':
          case '!==': this.program.emit(OP.NEQ); break;
          case '<':  this.program.emit(OP.LT); break;
          case '<=': this.program.emit(OP.LTE); break;
          case '>':  this.program.emit(OP.GT); break;
          case '>=': this.program.emit(OP.GTE); break;
          case '&':  this.program.emit(OP.BIT_AND); break;
          case '|':  this.program.emit(OP.BIT_OR); break;
          case '^':  this.program.emit(OP.BIT_XOR); break;
          case '<<': this.program.emit(OP.SHL); break;
          case '>>': this.program.emit(OP.SHR); break;
          case 'in': this.program.emit(OP.IN); break;
          default:
            throw new Error(`Compiler Error: unsupported binary operator '${node.operator}'`);
        }
        break;
      }

      case 'UnaryExpression': {
        this.visit(node.argument);
        if (node.operator === '-') {
          this.program.emit(OP.NEG);
        } else if (node.operator === '+') {
          this.program.emit(OP.POS);
        } else if (node.operator === '!' || node.operator === 'not') {
          this.program.emit(OP.NOT);
        } else if (node.operator === '~') {
          this.program.emit(OP.BIT_NOT);
        }
        break;
      }

      case 'UpdateExpression': {
        // e.g. i++ or ++i
        const name = node.argument.name;
        const resolved = this.resolveVariable(name);

        if (resolved.type === 'local') {
          this.program.emit(OP.LOAD_LOCAL, resolved.slot);
          if (!node.prefix) {
            this.program.emit(OP.DUP); // Keep original value on stack for postfix
          }
          const constOne = this.program.addConstant(1);
          this.program.emit(OP.CONST, constOne);
          if (node.operator === '++') {
            this.program.emit(OP.ADD);
          } else {
            this.program.emit(OP.SUB);
          }
          if (node.prefix) {
            this.program.emit(OP.DUP); // Keep updated value on stack for prefix
          }
          this.program.emit(OP.STORE_LOCAL, resolved.slot);
          if (node.prefix) {
            // Already duplicated
          }
        }
        break;
      }

      case 'IfStatement': {
        const testNode = node.test || node.expression;
        this.visit(testNode);

        const jumpFalsePc = this.program.emit(OP.JUMP_IF_FALSE, 0);

        // Consequent block
        const consequent = node.consequent || node.block;
        if (Array.isArray(consequent)) {
          for (const stmt of consequent) this.visit(stmt);
        } else {
          this.visit(consequent);
        }

        const alternate = node.alternate || node.else_block;
        if (alternate) {
          const jumpEndPc = this.program.emit(OP.JUMP, 0);
          this.program.patch(jumpFalsePc + 1, this.program.instructions.length);

          if (Array.isArray(alternate)) {
            for (const stmt of alternate) this.visit(stmt);
          } else {
            this.visit(alternate);
          }
          this.program.patch(jumpEndPc + 1, this.program.instructions.length);
        } else {
          this.program.patch(jumpFalsePc + 1, this.program.instructions.length);
        }
        break;
      }

      case 'WhileStatement': {
        const loopStartPc = this.program.instructions.length;
        const testNode = node.test || node.condition;
        this.visit(testNode);

        const jumpExitPc = this.program.emit(OP.JUMP_IF_FALSE, 0);

        this.loopBreakJumps.push([]);
        this.loopContinueTargets.push(loopStartPc);

        const body = node.body;
        if (Array.isArray(body)) {
          for (const stmt of body) this.visit(stmt);
        } else {
          this.visit(body);
        }

        this.program.emit(OP.JUMP, loopStartPc);
        this.program.patch(jumpExitPc + 1, this.program.instructions.length);

        const breaks = this.loopBreakJumps.pop();
        this.loopContinueTargets.pop();
        for (const bPc of breaks) {
          this.program.patch(bPc + 1, this.program.instructions.length);
        }
        break;
      }

      case 'CStyleForStatement':
      case 'ForStatement': {
        // Init
        if (node.init) {
          this.visit(node.init);
          if (node.init.type !== 'VariableDeclarationStatement' && node.init.type !== 'VariableDeclaration') {
            this.program.emit(OP.POP);
          }
        }

        const loopStartPc = this.program.instructions.length;
        let jumpExitPc = null;

        // Condition
        if (node.condition || node.test) {
          this.visit(node.condition || node.test);
          jumpExitPc = this.program.emit(OP.JUMP_IF_FALSE, 0);
        }

        this.loopBreakJumps.push([]);
        this.loopContinueTargets.push(loopStartPc);

        // Body
        const body = node.body;
        if (Array.isArray(body)) {
          for (const stmt of body) this.visit(stmt);
        } else {
          this.visit(body);
        }

        // Update
        if (node.update) {
          this.visit(node.update);
          this.program.emit(OP.POP); // Discard update result
        }

        this.program.emit(OP.JUMP, loopStartPc);

        if (jumpExitPc !== null) {
          this.program.patch(jumpExitPc + 1, this.program.instructions.length);
        }

        const breaks = this.loopBreakJumps.pop();
        this.loopContinueTargets.pop();
        for (const bPc of breaks) {
          this.program.patch(bPc + 1, this.program.instructions.length);
        }
        break;
      }

      case 'BreakStatement': {
        if (this.loopBreakJumps.length > 0) {
          const jumpPc = this.program.emit(OP.JUMP, 0);
          this.loopBreakJumps[this.loopBreakJumps.length - 1].push(jumpPc);
        }
        break;
      }

      case 'ContinueStatement': {
        if (this.loopContinueTargets.length > 0) {
          const targetPc = this.loopContinueTargets[this.loopContinueTargets.length - 1];
          this.program.emit(OP.JUMP, targetPc);
        }
        break;
      }

      case 'GlobalStatement':
      case 'NonlocalStatement': {
        for (const name of node.names || []) {
          this.globalVariables.add(name);
        }
        break;
      }

      case 'CallExpression': {
        const callee = node.callee;

        // Builtin Syscall sugar checks: print(...), sleep(...), input(...)
        if (callee.type === 'Identifier') {
          if (callee.name === 'print') {
            const args = node.arguments || [];
            const hasKw = args.some(a => a && (
              a.type === 'KeywordArgument' ||
              a.isKwSpread ||
              (a.type === 'ObjectExpression' && a.properties && a.properties.some(p => p.key && (p.key.name === '__is_py_kwargs__' || p.key.name === 'end' || p.key.name === 'sep' || p.key.value === 'end' || p.key.value === 'sep')))
            ));
            if (!hasKw && args.length <= 1) {
              if (args.length === 0) {
                this.program.emit(OP.NIL);
              } else {
                this.visit(args[0]);
              }
              this.program.emit(OP.SYSCALL, SYSCALL.PRINT);
              return;
            }
            // Route through global print to support multiple args and kwargs (end, sep)
            const printConst = this.program.addConstant('print');
            this.program.emit(OP.LOAD_GLOBAL, printConst);
            for (const arg of args) {
              this.visit(arg);
            }
            this.program.emit(OP.CALL, args.length);
            return;
          } else if (callee.name === 'sleep') {
            const arg = node.arguments[0];
            if (arg) this.visit(arg);
            else {
              const constZero = this.program.addConstant(0);
              this.program.emit(OP.CONST, constZero);
            }
            this.program.emit(OP.SYSCALL, SYSCALL.SLEEP);
            return;
          } else if (callee.name === 'input') {
            const arg = node.arguments[0];
            if (arg) this.visit(arg);
            else this.program.emit(OP.NIL);
            this.program.emit(OP.SYSCALL, SYSCALL.INPUT);
            return;
          }
        }

        // System.out.println / System.out.print sugar
        if (callee.type === 'MemberExpression' &&
            callee.property && (callee.property.name === 'println' || callee.property.name === 'print')) {
          const isPrintln = callee.property.name === 'println';
          if (isPrintln) {
            const args = node.arguments || [];
            if (args.length === 0) {
              this.program.emit(OP.NIL);
              this.program.emit(OP.SYSCALL, SYSCALL.PRINT);
            } else if (args.length === 1) {
              this.visit(args[0]);
              this.program.emit(OP.SYSCALL, SYSCALL.PRINT);
            } else {
              const printConst = this.program.addConstant('print');
              this.program.emit(OP.LOAD_GLOBAL, printConst);
              for (const arg of args) this.visit(arg);
              this.program.emit(OP.CALL, args.length);
            }
            return;
          }
          // System.out.print (end='')
          const printConst = this.program.addConstant('print');
          this.program.emit(OP.LOAD_GLOBAL, printConst);
          const arg = (node.arguments && node.arguments[0]) ? node.arguments[0] : null;
          if (arg) {
            this.visit(arg);
          } else {
            const emptyConst = this.program.addConstant('');
            this.program.emit(OP.CONST, emptyConst);
          }
          const endConst = this.program.addConstant({ end: '', __is_py_kwargs__: true });
          this.program.emit(OP.CONST, endConst);
          this.program.emit(OP.CALL, 2);
          return;
        }

        // Standard function call or Spread call
        const hasSpread = (node.arguments || []).some(a => a && a.type === 'SpreadElement');
        if (hasSpread) {
          this.visit(callee);
          this.program.emit(OP.BUILD_LIST, 0); // stack: [callee, list]
          for (const arg of node.arguments) {
            this.program.emit(OP.DUP); // stack: [callee, list, list]
            if (arg && arg.type === 'SpreadElement') {
              if (arg.isKwSpread) {
                const appIdx = this.program.addConstant('append');
                this.program.emit(OP.GET_MEMBER, appIdx);
                this.visit(arg.argument);
                this.program.emit(OP.CALL, 1);
                this.program.emit(OP.POP);
              } else {
                const extIdx = this.program.addConstant('extend');
                this.program.emit(OP.GET_MEMBER, extIdx); // stack: [callee, list, list.extend]
                this.visit(arg.argument); // stack: [callee, list, list.extend, items]
                this.program.emit(OP.CALL, 1); // stack: [callee, list, null]
                this.program.emit(OP.POP); // stack: [callee, list]
              }
            } else {
              const appIdx = this.program.addConstant('append');
              this.program.emit(OP.GET_MEMBER, appIdx); // stack: [callee, list, list.append]
              this.visit(arg); // stack: [callee, list, list.append, arg]
              this.program.emit(OP.CALL, 1); // stack: [callee, list, null]
              this.program.emit(OP.POP); // stack: [callee, list]
            }
          }
          this.program.emit(OP.CALL_SPREAD);
          break;
        }

        this.visit(callee);
        for (const arg of node.arguments) {
          this.visit(arg);
        }
        this.program.emit(OP.CALL, node.arguments.length);
        break;
      }

      case 'FunctionDeclaration': {
        // Forward jump over function body during linear execution
        const jumpOverPc = this.program.emit(OP.JUMP, 0);
        const entryPC = this.program.instructions.length;

        // Enter function scope
        this.enterScope(true);
        let restParamIndex = undefined;
        const paramDefaultInits = [];

        for (let i = 0; i < (node.params || []).length; i++) {
          const param = node.params[i];
          const paramName = typeof param === 'string' ? param : (param.name || param.id);
          const slot = this.declareLocal(paramName);
          if (param && param.isRest) {
            restParamIndex = i;
          } else if (param && param.isKwRest) {
            paramDefaultInits.push({ slot, defaultValue: { type: 'DictLiteral', properties: [] } });
          }
          if (param && param.defaultValue) {
            paramDefaultInits.push({ slot, defaultValue: param.defaultValue });
          }
        }

        const body = node.body || [];

        // Pre-scan function body to automatically declare all assigned identifiers as locals
        const explicitGlobals = new Set();
        const autoLocals = this.collectAssignedVariables(body, new Set(), explicitGlobals);
        for (const localName of autoLocals) {
          this.declareLocal(localName);
        }

        // Emit default argument initializers: if local slot is nil, evaluate defaultValue and store into slot
        for (const { slot, defaultValue } of paramDefaultInits) {
          this.program.emit(OP.LOAD_LOCAL, slot);
          this.program.emit(OP.NIL);
          this.program.emit(OP.EQ);
          const skipInitPc = this.program.emit(OP.JUMP_IF_FALSE, 0);
          this.visit(defaultValue);
          this.program.emit(OP.STORE_LOCAL, slot);
          this.program.patch(skipInitPc + 1, this.program.instructions.length);
        }

        if (Array.isArray(body)) {
          for (const stmt of body) this.visit(stmt);
        } else {
          this.visit(body);
        }

        // Implicit return null if no return statement hit
        this.program.emit(OP.NIL);
        this.program.emit(OP.RETURN);

        const localCount = this.nextSlot[this.nextSlot.length - 1];
        this.exitScope();

        // Patch jump over function body
        this.program.patch(jumpOverPc + 1, this.program.instructions.length);

        // Register function descriptor
        const fnDescriptor = {
          name: node.name,
          entryPC: entryPC,
          paramCount: (node.params || []).length,
          paramNames: (node.params || []).map(p => typeof p === 'string' ? p : (p.name || p.id)),
          localCount: localCount,
          restParamIndex: restParamIndex
        };

        const constIdx = this.program.addConstant(fnDescriptor);
        this.program.emit(OP.CONST, constIdx);

        // Bind function to local or global slot
        const resolved = this.resolveVariable(node.name);
        if (resolved.type === 'local') {
          this.program.emit(OP.STORE_LOCAL, resolved.slot);
        } else {
          const nameIdx = this.program.addConstant(node.name);
          this.program.emit(OP.STORE_GLOBAL, nameIdx);
        }
        break;
      }

      case 'FunctionExpression': {
        const jumpOverPc = this.program.emit(OP.JUMP, 0);
        const entryPC = this.program.instructions.length;

        this.enterScope(true);
        let restParamIndex = undefined;
        const paramDefaultInits = [];

        for (let i = 0; i < (node.params || []).length; i++) {
          const param = node.params[i];
          const paramName = typeof param === 'string' ? param : (param.name || param.id);
          const slot = this.declareLocal(paramName);
          if (param && param.isRest) {
            restParamIndex = i;
          } else if (param && param.isKwRest) {
            paramDefaultInits.push({ slot, defaultValue: { type: 'DictLiteral', properties: [] } });
          }
          if (param && param.defaultValue) {
            paramDefaultInits.push({ slot, defaultValue: param.defaultValue });
          }
        }

        const body = node.body || [];
        const explicitGlobals = new Set();
        const autoLocals = this.collectAssignedVariables(body, new Set(), explicitGlobals);
        for (const localName of autoLocals) {
          this.declareLocal(localName);
        }

        for (const { slot, defaultValue } of paramDefaultInits) {
          this.program.emit(OP.LOAD_LOCAL, slot);
          this.program.emit(OP.NIL);
          this.program.emit(OP.EQ);
          const skipInitPc = this.program.emit(OP.JUMP_IF_FALSE, 0);
          this.visit(defaultValue);
          this.program.emit(OP.STORE_LOCAL, slot);
          this.program.patch(skipInitPc + 1, this.program.instructions.length);
        }

        if (Array.isArray(body)) {
          for (const stmt of body) this.visit(stmt);
        } else {
          this.visit(body);
        }

        this.program.emit(OP.NIL);
        this.program.emit(OP.RETURN);

        const localCount = this.nextSlot[this.nextSlot.length - 1];
        this.exitScope();

        this.program.patch(jumpOverPc + 1, this.program.instructions.length);

        const fnDescriptor = {
          name: node.name || '<anonymous>',
          entryPC: entryPC,
          paramCount: (node.params || []).length,
          paramNames: (node.params || []).map(p => typeof p === 'string' ? p : (p.name || p.id)),
          localCount: localCount,
          restParamIndex: restParamIndex
        };

        const constIdx = this.program.addConstant(fnDescriptor);
        this.program.emit(OP.CONST, constIdx);
        break;
      }

      case 'ConditionalExpression': {
        this.visit(node.test);
        const jumpFalsePc = this.program.emit(OP.JUMP_IF_FALSE, 0);
        this.visit(node.consequent);
        const jumpEndPc = this.program.emit(OP.JUMP, 0);
        this.program.patch(jumpFalsePc + 1, this.program.instructions.length);
        this.visit(node.alternate);
        this.program.patch(jumpEndPc + 1, this.program.instructions.length);
        break;
      }

      case 'ReturnStatement': {
        if (node.argument || node.expression) {
          this.visit(node.argument || node.expression);
        } else {
          this.program.emit(OP.NIL);
        }
        this.program.emit(OP.RETURN);
        break;
      }

      case 'ArrayExpression':
      case 'ListLiteral': {
        const elements = node.elements || [];
        for (const elem of elements) {
          this.visit(elem);
        }
        this.program.emit(OP.BUILD_LIST, elements.length);
        break;
      }

      case 'IndexExpression':
      case 'SubscriptExpression': {
        this.visit(node.object);
        this.visit(node.index);
        this.program.emit(OP.GET_INDEX);
        break;
      }

      case 'MemberExpression': {
        this.visit(node.object);
        const prop = node.property.name !== undefined ? node.property.name : node.property.value;
        const propIdx = this.program.addConstant(prop);
        this.program.emit(OP.GET_MEMBER, propIdx);
        break;
      }

      case 'ObjectExpression':
      case 'DictLiteral': {
        const props = node.properties || [];
        const hasSpread = props.some(p => p && p.type === 'SpreadElement');
        if (!hasSpread) {
          for (const p of props) {
            this.visit(p.key);
            this.visit(p.value);
          }
          this.program.emit(OP.BUILD_MAP, props.length);
        } else {
          this.program.emit(OP.BUILD_MAP, 0);
          for (const p of props) {
            if (p.type === 'SpreadElement') {
              this.visit(p.argument);
              this.program.emit(OP.DICT_UPDATE);
            } else {
              this.program.emit(OP.DUP);
              this.visit(p.key);
              this.visit(p.value);
              this.program.emit(OP.SET_INDEX);
              this.program.emit(OP.POP);
            }
          }
        }
        break;
      }

      case 'ImportStatement': {
        const modIdx = this.program.addConstant(node.module);
        this.program.emit(OP.IMPORT, modIdx);

        if (node.specifiers && node.specifiers.length > 0) {
          if (node.specifiers.length === 1 && (node.specifiers[0].imported === '*' || node.specifiers[0].local === '*')) {
            this.program.emit(OP.IMPORT_STAR);
          } else {
            for (const spec of node.specifiers) {
              this.program.emit(OP.DUP);
              const propIdx = this.program.addConstant(spec.imported);
              this.program.emit(OP.GET_MEMBER, propIdx);

              const resolved = this.resolveVariable(spec.local);
              if (resolved.type === 'local') {
                this.program.emit(OP.STORE_LOCAL, resolved.slot);
              } else {
                const nameIdx = this.program.addConstant(spec.local);
                this.program.emit(OP.STORE_GLOBAL, nameIdx);
              }
            }
            this.program.emit(OP.POP);
          }
        } else {
          const targetName = node.alias || node.module;
          const resolved = this.resolveVariable(targetName);
          if (resolved.type === 'local') {
            this.program.emit(OP.STORE_LOCAL, resolved.slot);
          } else {
            const nameIdx = this.program.addConstant(targetName);
            this.program.emit(OP.STORE_GLOBAL, nameIdx);
          }
        }
        break;
      }

      case 'TryStatement': {
        const pushTryIdx = this.program.instructions.length;
        this.program.emit(OP.PUSH_TRY, 0, 0);

        this.enterScope(false);
        const tryBody = node.block || [];
        if (Array.isArray(tryBody)) {
          for (const stmt of tryBody) this.visit(stmt);
        } else {
          this.visit(tryBody);
        }
        this.exitScope();

        this.program.emit(OP.POP_TRY);

        // If try block succeeded without exception, execute elseBlock (if present)
        if (node.elseBlock) {
          this.enterScope(false);
          const elseBody = node.elseBlock;
          if (Array.isArray(elseBody)) {
            for (const stmt of elseBody) this.visit(stmt);
          } else {
            this.visit(elseBody);
          }
          this.exitScope();
        }

        const jumpToFinally = this.program.emit(OP.JUMP, 0);

        const catchPC = this.program.instructions.length;
        this.program.instructions[pushTryIdx + 1] = catchPC;

        const handlers = node.handlers || [];
        if (handlers.length === 0) {
          this.program.emit(OP.POP); // Discard unhandled error
        } else {
          const handlerEndJumps = [];

          for (let h = 0; h < handlers.length; h++) {
            const handler = handlers[h];
            let nextHandlerPc = null;

            if (handler.errorClass) {
              // Duplicate error on stack: [err, err]
              this.program.emit(OP.DUP);
              // Read error.name: [err, err.name]
              const namePropIdx = this.program.addConstant('name');
              this.program.emit(OP.GET_MEMBER, namePropIdx);

              // Target exception name: [err, err.name, targetName]
              const targetName = handler.errorClass.name || handler.errorClass.value || 'Exception';
              const targetNameIdx = this.program.addConstant(targetName);
              this.program.emit(OP.CONST, targetNameIdx);

              // Compare: [err, matches]
              this.program.emit(OP.EQ);
              nextHandlerPc = this.program.emit(OP.JUMP_IF_FALSE, 0);
            }

            // Handler matched: stack has [err]
            this.enterScope(false);
            if (handler.param) {
              const slot = this.declareLocal(handler.param.name);
              this.program.emit(OP.STORE_LOCAL, slot);
            } else {
              this.program.emit(OP.POP);
            }

            const catchBody = handler.body || [];
            if (Array.isArray(catchBody)) {
              for (const stmt of catchBody) this.visit(stmt);
            } else {
              this.visit(catchBody);
            }
            this.exitScope();

            const jumpOut = this.program.emit(OP.JUMP, 0);
            handlerEndJumps.push(jumpOut);

            if (nextHandlerPc !== null) {
              this.program.patch(nextHandlerPc + 1, this.program.instructions.length);
            }
          }

          // If none of the typed handlers matched, re-raise the active exception
          this.program.emit(OP.RAISE);

          // Patch all matched handlers to jump here
          const afterHandlersPC = this.program.instructions.length;
          for (const jmp of handlerEndJumps) {
            this.program.patch(jmp + 1, afterHandlersPC);
          }
        }

        const finallyPC = this.program.instructions.length;
        this.program.instructions[pushTryIdx + 2] = node.finalizer ? finallyPC : -1;
        this.program.patch(jumpToFinally + 1, finallyPC);

        if (node.finalizer) {
          this.enterScope(false);
          const finBody = node.finalizer;
          if (Array.isArray(finBody)) {
            for (const stmt of finBody) this.visit(stmt);
          } else {
            this.visit(finBody);
          }
          this.exitScope();
        }
        break;
      }

      case 'ThrowStatement': {
        if (node.argument) {
          this.visit(node.argument);
        } else {
          this.program.emit(OP.NIL);
        }
        this.program.emit(OP.RAISE);
        break;
      }

      default:
        throw new Error(`Compiler Error: unhandled AST node type '${node.type}'`);
    }
  }
}
