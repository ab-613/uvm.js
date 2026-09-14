// File: js/frontend/semantics.js

/**
 * Creates and binds AST emission semantics to an Ohm.js grammar.
 */
export function createASTSemantics(grammar) {
  const semantics = grammar.createSemantics();

  semantics.addOperation('toAST', {
    Program(topLevels) {
      const body = [];
      for (const child of topLevels.children) {
        const res = child.toAST();
        if (Array.isArray(res)) {
          body.push(...res);
        } else if (res) {
          body.push(res);
        }
      }
      return { type: 'Program', body };
    },

    TopLevel(child) {
      return child.toAST();
    },

    ClassDecl(modifiers, _class, name, _extends, superName, _implements, interfaces, _open, members, _close) {
      return {
        type: 'ClassDeclaration',
        name: name.sourceString,
        modifiers: modifiers.children.map(m => m.sourceString),
        body: members.children.map(m => m.toAST())
      };
    },

    Member(child) {
      return child.toAST();
    },

    MethodDecl(modifiers, returnType, name, _open, params, _close, _throws, body) {
      return {
        type: 'FunctionDeclaration',
        name: name.sourceString,
        modifiers: modifiers.children.map(m => m.sourceString),
        returnType: returnType.sourceString,
        params: params.asIteration().children.map(p => p.toAST()),
        body: body.toAST()
      };
    },

    FieldDecl(modifiers, varDecl) {
      const decl = varDecl.toAST();
      decl.modifiers = modifiers.children.map(m => m.sourceString);
      return decl;
    },

    FnDecl(returnType, name, _open, params, _close, body) {
      return {
        type: 'FunctionDeclaration',
        name: name.sourceString,
        returnType: returnType.sourceString,
        params: params.asIteration().children.map(p => p.toAST()),
        body: body.toAST()
      };
    },

    Param(type, name) {
      return {
        type: 'Identifier',
        name: name.sourceString,
        declaredType: type.sourceString
      };
    },

    Block(_open, statements, _close) {
      return statements.children.map(s => s.toAST());
    },

    IfStmt(_if, _open, test, _close, consequent, _else, alternate) {
      const consAst = consequent.toAST();
      const altAst = alternate.children.length > 0 ? alternate.children[0].toAST() : null;
      return {
        type: 'IfStatement',
        test: test.toAST(),
        consequent: Array.isArray(consAst) ? consAst : [consAst],
        alternate: altAst ? (Array.isArray(altAst) ? altAst : [altAst]) : null
      };
    },

    WhileStmt(_while, _open, test, _close, body) {
      const bodyAst = body.toAST();
      return {
        type: 'WhileStatement',
        test: test.toAST(),
        body: Array.isArray(bodyAst) ? bodyAst : [bodyAst]
      };
    },

    ForStmt(_for, _open, init, test, _semi2, update, _close, body) {
      const bodyAst = body.toAST();
      return {
        type: 'ForStatement',
        init: init.sourceString === ';' ? null : init.toAST(),
        condition: test.children.length > 0 ? test.children[0].toAST() : null,
        update: update.children.length > 0 ? update.children[0].toAST() : null,
        body: Array.isArray(bodyAst) ? bodyAst : [bodyAst]
      };
    },

    ReturnStmt(_ret, expr, _semi) {
      return {
        type: 'ReturnStatement',
        argument: expr.children.length > 0 ? expr.children[0].toAST() : null
      };
    },

    VarDecl(type, name, _eq, expr, _semi) {
      return {
        type: 'VariableDeclarationStatement',
        name: name.sourceString,
        declaredType: type.sourceString,
        expression: expr.children.length > 0 ? expr.children[0].toAST() : null
      };
    },

    ExprStmt(expr, _semi) {
      return {
        type: 'ExpressionStatement',
        expression: expr.toAST()
      };
    },

    // Expressions
    AssignExp_assign(target, op, value) {
      return {
        type: 'BinaryExpression',
        operator: op.sourceString,
        left: target.toAST(),
        right: value.toAST()
      };
    },

    OrExp_or(left, op, right) {
      return {
        type: 'BinaryExpression',
        operator: op.sourceString === 'or' ? '||' : op.sourceString,
        left: left.toAST(),
        right: right.toAST()
      };
    },

    AndExp_and(left, op, right) {
      return {
        type: 'BinaryExpression',
        operator: op.sourceString === 'and' ? '&&' : op.sourceString,
        left: left.toAST(),
        right: right.toAST()
      };
    },

    BitOrExp_bitor(left, op, right) {
      return { type: 'BinaryExpression', operator: '|', left: left.toAST(), right: right.toAST() };
    },

    BitXorExp_bitxor(left, op, right) {
      return { type: 'BinaryExpression', operator: '^', left: left.toAST(), right: right.toAST() };
    },

    BitAndExp_bitand(left, op, right) {
      return { type: 'BinaryExpression', operator: '&', left: left.toAST(), right: right.toAST() };
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
      return {
        type: 'IndexExpression',
        object: object.toAST(),
        index: index.toAST()
      };
    },

    PostfixExp_member(object, _dot, prop) {
      return {
        type: 'MemberExpression',
        object: object.toAST(),
        property: { type: 'Identifier', name: prop.sourceString }
      };
    },

    PrimaryExp_paren(_open, expr, _close) {
      return expr.toAST();
    },

    PrimaryExp_list(_open, items, _close) {
      return {
        type: 'ArrayExpression',
        elements: items.asIteration().children.map(i => i.toAST())
      };
    },

    PrimaryExp_true(_) {
      return { type: 'Literal', value: true };
    },

    PrimaryExp_false(_) {
      return { type: 'Literal', value: false };
    },

    PrimaryExp_null(_) {
      return { type: 'Literal', value: null };
    },

    number(_) {
      return { type: 'Literal', value: Number(this.sourceString) };
    },

    string(_open, _chars, _close) {
      // Parse string with escape characters safely
      try {
        return { type: 'Literal', value: JSON.parse(this.sourceString) };
      } catch {
        return { type: 'Literal', value: this.sourceString.slice(1, -1) };
      }
    },

    ident(_first, _rest) {
      return { type: 'Identifier', name: this.sourceString };
    }
  });

  return semantics;
}
