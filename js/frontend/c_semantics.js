// File: js/frontend/c_semantics.js
/**
 * AST Semantics for C Python Extensions (Ohm.js)
 */

export function createCSemantics(grammar) {
  const s = grammar.createSemantics();

  s.addOperation('toAST()', {
    CProgram(items, _end) {
      const body = [];
      for (const item of items.children) {
        const res = item.toAST();
        if (Array.isArray(res)) {
          body.push(...res);
        } else if (res) {
          body.push(res);
        }
      }
      return { type: 'Program', body };
    },

    CTopLevel(child) {
      return child.toAST();
    },

    includeDirective(_hash, _inc, _chars, _nl) {
      return null;
    },

    ModuleInit(_kw, _name, _op, _v, _cp, _body) {
      return null;
    },

    MethodTable(_st, _def, name, _b1, _eq, _b2, entries, _optComma, _b3, _semi) {
      return {
        type: 'CMethodTable',
        name: name.sourceString,
        entries: entries.asIteration().children.map(e => e.toAST()).filter(Boolean)
      };
    },

    MethodEntry(_b1, name, _c1, fnName, _c2, flags, _c3, doc, _b2) {
      if (name.sourceString === 'NULL') return null;
      return {
        name: JSON.parse(name.sourceString),
        cFunction: fnName.sourceString,
        flags: flags.sourceString,
        doc: doc.sourceString === 'NULL' ? '' : JSON.parse(doc.sourceString)
      };
    },

    CFunction(_st, _type, name, _op, params, _cp, body) {
      const fnName = name.sourceString;
      const rawStmts = body.toAST();

      // Discover logical parameters from PyArg_ParseTuple if present
      let extractedParams = [];
      const filteredStmts = [];

      for (const stmt of rawStmts) {
        if (stmt.type === 'IfStatement' && stmt.test && stmt.test.type === 'UnaryExpression' &&
            stmt.test.argument && stmt.test.argument.type === 'CallExpression' &&
            stmt.test.argument.callee.name === 'PyArg_ParseTuple') {
          // Arguments: args, fmt, &p1, &p2...
          const callArgs = stmt.test.argument.arguments;
          for (let i = 2; i < callArgs.length; i++) {
            const arg = callArgs[i];
            if (arg.type === 'AddressOf') {
              extractedParams.push(arg.argument.name);
            } else if (arg.type === 'Identifier') {
              extractedParams.push(arg.name);
            }
          }
          // Do not include PyArg_ParseTuple guard statement in the compiled body
          continue;
        }
        filteredStmts.push(stmt);
      }

      // Filter out redundant parameter variable declarations without initializers (e.g. long a, b;)
      const cleanStmts = [];
      for (const stmt of filteredStmts) {
        if (stmt.type === 'VariableDeclarationStatement' && extractedParams.includes(stmt.name) && !stmt.expression) {
          continue; // Already bound as parameter
        }
        cleanStmts.push(stmt);
      }

      return {
        type: 'FunctionDeclaration',
        name: fnName,
        params: extractedParams.length > 0 ? extractedParams : params.asIteration().children.map(p => p.toAST()),
        body: cleanStmts
      };
    },

    Param(type, name) {
      return { type: 'Identifier', name: name.sourceString };
    },

    Statement(child) {
      return child.toAST();
    },

    Block(_ob, stmts, _cb) {
      const res = [];
      for (const s of stmts.children) {
        const ast = s.toAST();
        if (Array.isArray(ast)) res.push(...ast);
        else if (ast) res.push(ast);
      }
      return res;
    },

    VarDecl(type, inits, _semi) {
      return inits.asIteration().children.map(i => i.toAST());
    },

    VarInit(name, _eq, val) {
      return {
        type: 'VariableDeclarationStatement',
        name: name.sourceString,
        expression: val.children.length > 0 ? val.children[0].toAST() : null
      };
    },

    IfStmt(_if, _op, test, _cp, cons, _el, alt) {
      const consAst = cons.toAST();
      return {
        type: 'IfStatement',
        test: test.toAST(),
        consequent: Array.isArray(consAst) ? consAst : [consAst],
        alternate: alt.children.length > 0
          ? (Array.isArray(alt.children[0].toAST()) ? alt.children[0].toAST() : [alt.children[0].toAST()])
          : null
      };
    },

    WhileStmt(_while, _op, test, _cp, body) {
      const bodyAst = body.toAST();
      return {
        type: 'WhileStatement',
        test: test.toAST(),
        body: Array.isArray(bodyAst) ? bodyAst : [bodyAst]
      };
    },

    ForStmt(_for, _op, init, test, _s2, upd, _cp, body) {
      const bodyAst = body.toAST();
      return {
        type: 'ForStatement',
        init: init.sourceString === ';' ? null : (Array.isArray(init.toAST()) ? init.toAST()[0] : init.toAST()),
        condition: test.children.length > 0 ? test.children[0].toAST() : null,
        update: upd.children.length > 0 ? upd.children[0].toAST() : null,
        body: Array.isArray(bodyAst) ? bodyAst : [bodyAst]
      };
    },

    ReturnStmt(_ret, expr, _semi) {
      let arg = expr.children.length > 0 ? expr.children[0].toAST() : null;
      // Unwrap PyLong_FromLong(x), PyFloat_FromDouble(x), Py_BuildValue(x)
      if (arg && arg.type === 'CallExpression' && 
          (arg.callee.name === 'PyLong_FromLong' || 
           arg.callee.name === 'PyFloat_FromDouble' ||
           arg.callee.name === 'Py_BuildValue')) {
        arg = arg.arguments.length === 1 ? arg.arguments[0] : arg.arguments[1];
      }
      return {
        type: 'ReturnStatement',
        argument: arg
      };
    },

    ExprStmt(exp, _semi) {
      return {
        type: 'ExpressionStatement',
        expression: exp.toAST()
      };
    },

    UnaryExp_addressof(_amp, exp) {
      return { type: 'AddressOf', argument: exp.toAST() };
    },

    UnaryExp_deref(_star, exp) {
      return { type: 'Deref', argument: exp.toAST() };
    },

    PrimaryExp_c_null(_kw) {
      return { type: 'Literal', value: null };
    },

    // Expressions
    AssignExp_assign(target, op, value) {
      return { type: 'BinaryExpression', operator: op.sourceString, left: target.toAST(), right: value.toAST() };
    },
    OrExp_or(left, op, right) {
      return { type: 'BinaryExpression', operator: op.sourceString, left: left.toAST(), right: right.toAST() };
    },
    AndExp_and(left, op, right) {
      return { type: 'BinaryExpression', operator: op.sourceString, left: left.toAST(), right: right.toAST() };
    },
    BitOrExp_bitor(left, op, right) {
      return { type: 'BinaryExpression', operator: op.sourceString, left: left.toAST(), right: right.toAST() };
    },
    BitXorExp_bitxor(left, op, right) {
      return { type: 'BinaryExpression', operator: op.sourceString, left: left.toAST(), right: right.toAST() };
    },
    BitAndExp_bitand(left, op, right) {
      return { type: 'BinaryExpression', operator: op.sourceString, left: left.toAST(), right: right.toAST() };
    },
    EqExp_eq(left, op, right) {
      return { type: 'BinaryExpression', operator: op.sourceString, left: left.toAST(), right: right.toAST() };
    },
    RelExp_rel(left, op, right) {
      return { type: 'BinaryExpression', operator: op.sourceString, left: left.toAST(), right: right.toAST() };
    },
    ShiftExp_shift(left, op, right) {
      return { type: 'BinaryExpression', operator: op.sourceString, left: left.toAST(), right: right.toAST() };
    },
    AddExp_add(left, op, right) {
      return { type: 'BinaryExpression', operator: op.sourceString, left: left.toAST(), right: right.toAST() };
    },
    MulExp_mul(left, op, right) {
      return { type: 'BinaryExpression', operator: op.sourceString, left: left.toAST(), right: right.toAST() };
    },
    UnaryExp_not(op, arg) {
      return { type: 'UnaryExpression', operator: '!', argument: arg.toAST() };
    },
    UnaryExp_neg(_op, arg) {
      return { type: 'UnaryExpression', operator: '-', argument: arg.toAST() };
    },
    UnaryExp_bitnot(_op, arg) {
      return { type: 'UnaryExpression', operator: '~', argument: arg.toAST() };
    },
    UnaryExp_preinc(op, arg) {
      return { type: 'UpdateExpression', operator: op.sourceString, argument: arg.toAST(), prefix: true };
    },
    PostfixExp_postinc(arg, op) {
      return { type: 'UpdateExpression', operator: op.sourceString, argument: arg.toAST(), prefix: false };
    },
    PostfixExp_call(callee, _open, args, _close) {
      return {
        type: 'CallExpression',
        callee: callee.toAST(),
        arguments: args.asIteration().children.map(a => a.toAST())
      };
    },
    PostfixExp_index(object, _open, index, _close) {
      return { type: 'IndexExpression', object: object.toAST(), index: index.toAST() };
    },
    PostfixExp_member(object, _dot, prop) {
      return { type: 'MemberExpression', object: object.toAST(), property: { type: 'Identifier', name: prop.sourceString } };
    },
    number(_) {
      return { type: 'Literal', value: Number(this.sourceString) };
    },
    string(_open, _chars, _close) {
      try {
        return { type: 'Literal', value: JSON.parse(this.sourceString) };
      } catch {
        return { type: 'Literal', value: this.sourceString.slice(1, -1) };
      }
    },
    PrimaryExp_true(_) { return { type: 'Literal', value: true }; },
    PrimaryExp_false(_) { return { type: 'Literal', value: false }; },
    PrimaryExp_null(_) { return { type: 'Literal', value: null }; },
    PrimaryExp_paren(_ob, e, _cb) { return e.toAST(); },
    PrimaryExp_list(_ob, items, _cb) {
      return { type: 'ArrayExpression', elements: items.asIteration().children.map(i => i.toAST()) };
    },
    ident(_head, _tail) {
      return { type: 'Identifier', name: this.sourceString };
    }
  });

  return s;
}
