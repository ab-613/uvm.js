// File: js/frontend/python_semantics.js
/**
 * AST Semantics for Python 3 Frontend (Ohm.js)
 */

let forCounter = 0;

function instrumentBreaks(stmts, breakAction) {
  if (!stmts) return [];
  const list = Array.isArray(stmts) ? stmts : [stmts];
  const res = [];
  for (const s of list) {
    if (!s) continue;
    if (s.type === 'BreakStatement') {
      res.push(...breakAction);
      res.push(s);
    } else if (s.type === 'IfStatement') {
      res.push({
        ...s,
        consequent: instrumentBreaks(s.consequent, breakAction),
        alternate: s.alternate ? instrumentBreaks(s.alternate, breakAction) : null
      });
    } else if (s.type === 'WhileStatement' || s.type === 'ForStatement' || s.type === 'FunctionDeclaration') {
      res.push(s);
    } else if (s.body && Array.isArray(s.body)) {
      res.push({
        ...s,
        body: instrumentBreaks(s.body, breakAction)
      });
    } else {
      res.push(s);
    }
  }
  return res;
}

function desugarForLoop(targets, iterAst, loopBodyAst, elseBodyAst = null) {
  const id = ++forCounter;
  const tempIter = `__iter_${id}`;
  const tempIdx = `__idx_${id}`;
  const tempCompleted = `__completed_${id}`;

  const extractStmts = [];
  if (targets.length === 1 && targets[0].type === 'Identifier') {
    extractStmts.push({
      type: 'VariableDeclarationStatement',
      name: targets[0].name,
      expression: {
        type: 'IndexExpression',
        object: { type: 'Identifier', name: tempIter },
        index: { type: 'Identifier', name: tempIdx }
      }
    });
  } else {
    const tempItem = `__item_${id}`;
    extractStmts.push({
      type: 'VariableDeclarationStatement',
      name: tempItem,
      expression: {
        type: 'IndexExpression',
        object: { type: 'Identifier', name: tempIter },
        index: { type: 'Identifier', name: tempIdx }
      }
    });
    for (let i = 0; i < targets.length; i++) {
      const t = targets[i];
      const name = t.name || (t.type === 'Identifier' ? t.name : `__var_${i}`);
      extractStmts.push({
        type: 'VariableDeclarationStatement',
        name: name,
        expression: {
          type: 'IndexExpression',
          object: { type: 'Identifier', name: tempItem },
          index: { type: 'Literal', value: i }
        }
      });
    }
  }

  let finalBody = Array.isArray(loopBodyAst) ? loopBodyAst : [loopBodyAst];
  if (elseBodyAst) {
    finalBody = instrumentBreaks(finalBody, [
      {
        type: 'ExpressionStatement',
        expression: {
          type: 'BinaryExpression',
          operator: '=',
          left: { type: 'Identifier', name: tempCompleted },
          right: { type: 'Literal', value: false }
        }
      }
    ]);
  }

  const loopResult = [
    {
      type: 'VariableDeclarationStatement',
      name: tempIter,
      expression: {
        type: 'CallExpression',
        callee: { type: 'Identifier', name: '__iter_prep' },
        arguments: [iterAst]
      }
    },
    {
      type: 'VariableDeclarationStatement',
      name: tempIdx,
      expression: { type: 'Literal', value: 0 }
    }
  ];

  if (elseBodyAst) {
    loopResult.push({
      type: 'VariableDeclarationStatement',
      name: tempCompleted,
      expression: { type: 'Literal', value: true }
    });
  }

  loopResult.push({
    type: 'WhileStatement',
    test: {
      type: 'BinaryExpression',
      operator: '<',
      left: { type: 'Identifier', name: tempIdx },
      right: {
        type: 'CallExpression',
        callee: { type: 'Identifier', name: 'len' },
        arguments: [{ type: 'Identifier', name: tempIter }]
      }
    },
    body: [
      ...extractStmts,
      ...finalBody,
      {
        type: 'ExpressionStatement',
        expression: {
          type: 'BinaryExpression',
          operator: '=',
          left: { type: 'Identifier', name: tempIdx },
          right: {
            type: 'BinaryExpression',
            operator: '+',
            left: { type: 'Identifier', name: tempIdx },
            right: { type: 'Literal', value: 1 }
          }
        }
      }
    ]
  });

  if (elseBodyAst) {
    loopResult.push({
      type: 'IfStatement',
      test: { type: 'Identifier', name: tempCompleted },
      consequent: Array.isArray(elseBodyAst) ? elseBodyAst : [elseBodyAst],
      alternate: null
    });
  }

  return loopResult;
}

function hasYield(ast) {
  if (!ast) return false;
  if (Array.isArray(ast)) return ast.some(hasYield);
  if (ast.type === 'YieldStatement' || ast.type === 'YieldExpression') return true;
  if (ast.type === 'FunctionDeclaration' || ast.type === 'FunctionExpression') return false;
  for (const k of Object.keys(ast)) {
    if (typeof ast[k] === 'object' && hasYield(ast[k])) return true;
  }
  return false;
}

function transformYieldsInStmts(stmts, yieldListVar) {
  const result = [];
  const list = Array.isArray(stmts) ? stmts : [stmts];

  for (const s of list) {
    if (!s) continue;
    if (s.type === 'YieldStatement' || s.type === 'YieldExpression') {
      if (s.delegate) {
        result.push(...desugarForLoop(
          [{ type: 'Identifier', name: '__yield_item' }],
          s.argument,
          [{
            type: 'ExpressionStatement',
            expression: {
              type: 'CallExpression',
              callee: {
                type: 'MemberExpression',
                object: { type: 'Identifier', name: yieldListVar },
                property: { type: 'Identifier', name: 'append' }
              },
              arguments: [{ type: 'Identifier', name: '__yield_item' }]
            }
          }]
        ));
      } else {
        result.push({
          type: 'ExpressionStatement',
          expression: {
            type: 'CallExpression',
            callee: {
              type: 'MemberExpression',
              object: { type: 'Identifier', name: yieldListVar },
              property: { type: 'Identifier', name: 'append' }
            },
            arguments: s.argument ? [s.argument] : [{ type: 'Literal', value: null }]
          }
        });
      }
    } else if (s.type === 'IfStatement') {
      result.push({
        ...s,
        consequent: transformYieldsInStmts(s.consequent, yieldListVar),
        alternate: s.alternate ? transformYieldsInStmts(s.alternate, yieldListVar) : null
      });
    } else if (s.type === 'WhileStatement' || s.type === 'ForStatement') {
      result.push({
        ...s,
        body: transformYieldsInStmts(s.body, yieldListVar)
      });
    } else if (s.type === 'TryStatement') {
      result.push({
        ...s,
        block: transformYieldsInStmts(s.block, yieldListVar),
        handlers: s.handlers,
        elseBlock: s.elseBlock ? transformYieldsInStmts(s.elseBlock, yieldListVar) : null,
        finalizer: s.finalizer ? transformYieldsInStmts(s.finalizer, yieldListVar) : null
      });
    } else {
      result.push(s);
    }
  }
  return result;
}

function desugarWith(exprAst, targetAst, bodyAst) {
  const id = ++forCounter;
  const ctxVar = `__ctx_${id}`;
  const stmts = [
    {
      type: 'VariableDeclarationStatement',
      name: ctxVar,
      expression: exprAst
    }
  ];

  const enterCall = {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      object: { type: 'Identifier', name: ctxVar },
      property: { type: 'Identifier', name: '__enter__' }
    },
    arguments: []
  };

  if (targetAst) {
    const targetName = targetAst.name || (targetAst.type === 'Identifier' ? targetAst.name : (Array.isArray(targetAst) && targetAst[0] ? (targetAst[0].name || targetAst[0]) : `__var_${id}`));
    stmts.push({
      type: 'VariableDeclarationStatement',
      name: targetName,
      expression: enterCall
    });
  } else {
    stmts.push({
      type: 'ExpressionStatement',
      expression: enterCall
    });
  }

  const exitCall = {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      object: { type: 'Identifier', name: ctxVar },
      property: { type: 'Identifier', name: '__exit__' }
    },
    arguments: [
      { type: 'Literal', value: null },
      { type: 'Literal', value: null },
      { type: 'Literal', value: null }
    ]
  };

  stmts.push({
    type: 'TryStatement',
    block: Array.isArray(bodyAst) ? bodyAst : [bodyAst],
    handlers: [],
    finalizer: [
      {
        type: 'ExpressionStatement',
        expression: exitCall
      }
    ]
  });

  return stmts;
}

export function createPythonSemantics(grammar) {
  const s = grammar.createSemantics();

  s.addOperation('toAST()', {
    PyProgram(stmts, _end) {
      const body = [];
      for (const stmt of stmts.children) {
        const res = stmt.toAST();
        if (Array.isArray(res)) {
          body.push(...res);
        } else if (res) {
          body.push(res);
        }
      }
      return { type: 'Program', body };
    },

    Stmt(child) {
      return child.toAST();
    },

    Decorator(_at, exp, _semi) {
      return exp.toAST();
    },

    DecoratedDef(decorators, defStmt) {
      const fnAst = defStmt.toAST();
      const fnName = fnAst.name;
      const decos = decorators.children.map(d => d.toAST());
      
      // Wrap from bottom to top (inner to outer)
      let wrapped = { type: 'Identifier', name: fnName };
      for (let i = decos.length - 1; i >= 0; i--) {
        wrapped = {
          type: 'CallExpression',
          callee: decos[i],
          arguments: [wrapped]
        };
      }

      return [
        fnAst,
        {
          type: 'ExpressionStatement',
          expression: {
            type: 'BinaryExpression',
            operator: '=',
            left: { type: 'Identifier', name: fnName },
            right: wrapped
          }
        }
      ];
    },

    DecoratedClass(decorators, classStmt) {
      const classAsts = classStmt.toAST();
      const list = Array.isArray(classAsts) ? classAsts : [classAsts];
      const constructorDecl = list.find(node => node.type === 'FunctionDeclaration');
      const className = constructorDecl ? constructorDecl.name : null;
      const decos = decorators.children.map(d => d.toAST());
      
      let wrapped = { type: 'Identifier', name: className };
      for (let i = decos.length - 1; i >= 0; i--) {
        wrapped = {
          type: 'CallExpression',
          callee: decos[i],
          arguments: [wrapped]
        };
      }

      return [
        ...list,
        {
          type: 'ExpressionStatement',
          expression: {
            type: 'BinaryExpression',
            operator: '=',
            left: { type: 'Identifier', name: className },
            right: wrapped
          }
        }
      ];
    },

    Param_kwrest(_stars, id) {
      return { type: 'Identifier', name: id.sourceString, isKwRest: true };
    },

    Param_rest(_star, id) {
      return { type: 'Identifier', name: id.sourceString, isRest: true };
    },

    Param_bare_star(_star) {
      return { type: 'BareStar' };
    },

    Param_pos_only(_slash) {
      return { type: 'PosOnly' };
    },

    Param_default(id, _eq, defaultExp) {
      return { type: 'Identifier', name: id.sourceString, isRest: false, defaultValue: defaultExp.toAST() };
    },

    Param_normal(id) {
      return { type: 'Identifier', name: id.sourceString, isRest: false };
    },

    DefStmt(_def, name, _op, params, _optComma, _cp, _colon, suite) {
      const bodyAst = suite.toAST();
      const rawParams = params.asIteration().children.map(p => p.toAST());
      const filteredParams = rawParams.filter(p => p && p.type !== 'BareStar' && p.type !== 'PosOnly');
      const bodyList = Array.isArray(bodyAst) ? bodyAst : [bodyAst];

      if (hasYield(bodyList)) {
        const yieldVar = `__yield_list_${name.sourceString}`;
        const transformedBody = [
          {
            type: 'VariableDeclarationStatement',
            name: yieldVar,
            expression: { type: 'ListLiteral', elements: [] }
          },
          ...transformYieldsInStmts(bodyList, yieldVar),
          {
            type: 'ReturnStatement',
            argument: { type: 'Identifier', name: yieldVar }
          }
        ];
        return {
          type: 'FunctionDeclaration',
          name: name.sourceString,
          params: filteredParams,
          body: transformedBody
        };
      }

      return {
        type: 'FunctionDeclaration',
        name: name.sourceString,
        params: filteredParams,
        body: bodyList
      };
    },

    ClassBase_kwarg(id, _eq, exp) {
      return { type: 'KeywordArg', name: id.sourceString, value: exp.toAST() };
    },

    ClassBase_base(exp) {
      return exp.toAST();
    },

    ClassStmt(_kw, name, _ob, bases, _optComma, _cb, _colon, suite) {
      const className = name.sourceString;
      const baseAsts = bases.children.length > 0 ? bases.children[0].asIteration().children.map(b => b.toAST()) : [];
      const baseClassExprs = baseAsts.filter(b => b && b.type !== 'KeywordArg');
      const bodyItems = suite.toAST();
      const itemsList = Array.isArray(bodyItems) ? bodyItems : [bodyItems];
      
      const methodDeclarations = [];
      const methodBindings = [];
      const classAttrAssignments = [];
      let initParams = null;
      let hasNew = false;

      for (const item of itemsList) {
        if (!item) continue;
        if (item.type === 'FunctionDeclaration') {
          const originalName = item.name;
          const mangledName = `__class_${className}_${originalName}`;
          methodDeclarations.push({
            ...item,
            name: mangledName
          });

          methodBindings.push({
            type: 'ExpressionStatement',
            expression: {
              type: 'BinaryExpression',
              operator: '=',
              left: {
                type: 'MemberExpression',
                object: { type: 'Identifier', name: 'self' },
                property: { type: 'Identifier', name: originalName }
              },
              right: {
                type: 'ObjectExpression',
                properties: [
                  { key: { type: 'Literal', value: '__is_bound__' }, value: { type: 'Literal', value: true } },
                  { key: { type: 'Literal', value: 'self' }, value: { type: 'Identifier', name: 'self' } },
                  { key: { type: 'Literal', value: 'fn' }, value: { type: 'Identifier', name: mangledName } }
                ]
              }
            }
          });

          classAttrAssignments.push({
            type: 'ExpressionStatement',
            expression: {
              type: 'BinaryExpression',
              operator: '=',
              left: {
                type: 'MemberExpression',
                object: { type: 'Identifier', name: className },
                property: { type: 'Identifier', name: originalName }
              },
              right: { type: 'Identifier', name: mangledName }
            }
          });

          if (originalName === '__init__') {
            initParams = item.params.slice(1);
          } else if (originalName === '__new__') {
            hasNew = true;
          }
        } else if (item.type === 'VariableDeclarationStatement') {
          methodDeclarations.push(item);
          classAttrAssignments.push({
            type: 'ExpressionStatement',
            expression: {
              type: 'BinaryExpression',
              operator: '=',
              left: {
                type: 'MemberExpression',
                object: { type: 'Identifier', name: className },
                property: { type: 'Identifier', name: item.name }
              },
              right: { type: 'Identifier', name: item.name }
            }
          });
          methodBindings.push({
            type: 'ExpressionStatement',
            expression: {
              type: 'BinaryExpression',
              operator: '=',
              left: {
                type: 'MemberExpression',
                object: { type: 'Identifier', name: 'self' },
                property: { type: 'Identifier', name: item.name }
              },
              right: { type: 'Identifier', name: item.name }
            }
          });
        } else if (item.type === 'ExpressionStatement' && item.expression && item.expression.type === 'BinaryExpression' && item.expression.operator === '=') {
          const target = item.expression.left;
          if (target && target.type === 'Identifier') {
            methodDeclarations.push(item);
            classAttrAssignments.push({
              type: 'ExpressionStatement',
              expression: {
                type: 'BinaryExpression',
                operator: '=',
                left: {
                  type: 'MemberExpression',
                  object: { type: 'Identifier', name: className },
                  property: { type: 'Identifier', name: target.name }
                },
                right: { type: 'Identifier', name: target.name }
              }
            });
            methodBindings.push({
              type: 'ExpressionStatement',
              expression: {
                type: 'BinaryExpression',
                operator: '=',
                left: {
                  type: 'MemberExpression',
                  object: { type: 'Identifier', name: 'self' },
                  property: { type: 'Identifier', name: target.name }
                },
                right: { type: 'Identifier', name: target.name }
              }
            });
          } else {
            methodDeclarations.push(item);
          }
        } else {
          methodDeclarations.push(item);
        }
      }

      // Build constructor function
      const constructorBody = [];

      if (hasNew) {
        constructorBody.push({
          type: 'ReturnStatement',
          argument: {
            type: 'CallExpression',
            callee: {
              type: 'Identifier',
              name: `__class_${className}___new__`
            },
            arguments: [
              { type: 'Identifier', name: className },
              { type: 'SpreadElement', argument: { type: 'Identifier', name: '__args' } }
            ]
          }
        });
      } else {
        if (baseClassExprs.length > 0) {
          constructorBody.push({
            type: 'VariableDeclarationStatement',
            name: 'self',
            expression: {
              type: 'CallExpression',
              callee: baseClassExprs[0],
              arguments: [{ type: 'SpreadElement', argument: { type: 'Identifier', name: '__args' } }]
            }
          });
        } else {
          constructorBody.push({
            type: 'VariableDeclarationStatement',
            name: 'self',
            expression: {
              type: 'ObjectExpression',
              properties: [
                { key: { type: 'Literal', value: '__class__' }, value: { type: 'Identifier', name: className } }
              ]
            }
          });
        }

        constructorBody.push(...methodBindings);

        if (initParams !== null) {
          constructorBody.push({
            type: 'ExpressionStatement',
            expression: {
              type: 'CallExpression',
              callee: {
                type: 'MemberExpression',
                object: { type: 'Identifier', name: 'self' },
                property: { type: 'Identifier', name: '__init__' }
              },
              arguments: [{ type: 'SpreadElement', argument: { type: 'Identifier', name: '__args' } }]
            }
          });
        }

        constructorBody.push({
          type: 'ReturnStatement',
          argument: { type: 'Identifier', name: 'self' }
        });
      }

      const constructorDecl = {
        type: 'FunctionDeclaration',
        name: className,
        params: [{ type: 'Identifier', name: '__args', isRest: true }],
        body: constructorBody
      };

      return [...methodDeclarations, constructorDecl, ...classAttrAssignments];
    },

    Suite_block(_ob, stmts, _cb) {
      const res = [];
      for (const s of stmts.children) {
        const ast = s.toAST();
        if (Array.isArray(ast)) res.push(...ast);
        else if (ast) res.push(ast);
      }
      return res;
    },

    Suite_simple(stmt) {
      const res = stmt.toAST();
      return Array.isArray(res) ? res : [res];
    },

    IfStmt(_if, test, _c1, cons, _elifKw, elifTests, _c2, elifSuites, _elseKw, _c3, alt) {
      const consAst = cons.toAST();
      let root = {
        type: 'IfStatement',
        test: test.toAST(),
        consequent: Array.isArray(consAst) ? consAst : [consAst],
        alternate: null
      };

      let curr = root;
      const elifCount = elifTests.children.length;
      for (let i = 0; i < elifCount; i++) {
        const elifCons = elifSuites.children[i].toAST();
        const elifNode = {
          type: 'IfStatement',
          test: elifTests.children[i].toAST(),
          consequent: Array.isArray(elifCons) ? elifCons : [elifCons],
          alternate: null
        };
        curr.alternate = [elifNode];
        curr = elifNode;
      }

      if (alt.children.length > 0) {
        const altAst = alt.children[0].toAST();
        curr.alternate = Array.isArray(altAst) ? altAst : [altAst];
      }

      return root;
    },

    WhileStmt(_while, test, _colon, suite, optElse) {
      const bodyAst = suite.toAST();
      const elseAst = optElse.children.length > 0 ? optElse.children[0].toAST() : null;
      if (!elseAst) {
        return {
          type: 'WhileStatement',
          test: test.toAST(),
          body: Array.isArray(bodyAst) ? bodyAst : [bodyAst]
        };
      }
      const id = ++forCounter;
      const tempCompleted = `__completed_${id}`;
      const instrumentedBody = instrumentBreaks(Array.isArray(bodyAst) ? bodyAst : [bodyAst], [
        {
          type: 'ExpressionStatement',
          expression: {
            type: 'BinaryExpression',
            operator: '=',
            left: { type: 'Identifier', name: tempCompleted },
            right: { type: 'Literal', value: false }
          }
        }
      ]);
      return [
        {
          type: 'VariableDeclarationStatement',
          name: tempCompleted,
          expression: { type: 'Literal', value: true }
        },
        {
          type: 'WhileStatement',
          test: test.toAST(),
          body: instrumentedBody
        },
        {
          type: 'IfStatement',
          test: { type: 'Identifier', name: tempCompleted },
          consequent: Array.isArray(elseAst) ? elseAst : [elseAst],
          alternate: null
        }
      ];
    },

    ForStmt(_for, target, _in, iter, _colon, suite, optElse) {
      const elseAst = optElse.children.length > 0 ? optElse.children[0].toAST() : null;
      return desugarForLoop(target.toAST(), iter.toAST(), suite.toAST(), elseAst);
    },

    TryStmt_except_else_finally(_try, _colon, body, excepts, elseC, fin) {
      const bodyAst = body.toAST();
      const handlers = excepts.children.map(e => e.toAST());
      const elseAst = elseC.toAST();
      const finalizer = fin.toAST();
      return {
        type: 'TryStatement',
        block: Array.isArray(bodyAst) ? bodyAst : [bodyAst],
        handlers: handlers,
        elseBlock: Array.isArray(elseAst) ? elseAst : [elseAst],
        finalizer: Array.isArray(finalizer) ? finalizer : [finalizer]
      };
    },

    TryStmt_except_else(_try, _colon, body, excepts, elseC) {
      const bodyAst = body.toAST();
      const handlers = excepts.children.map(e => e.toAST());
      const elseAst = elseC.toAST();
      return {
        type: 'TryStatement',
        block: Array.isArray(bodyAst) ? bodyAst : [bodyAst],
        handlers: handlers,
        elseBlock: Array.isArray(elseAst) ? elseAst : [elseAst],
        finalizer: null
      };
    },

    TryStmt_except_finally(_try, _colon, body, excepts, fin) {
      const bodyAst = body.toAST();
      const handlers = excepts.children.map(e => e.toAST());
      const finalizer = fin.toAST();
      return {
        type: 'TryStatement',
        block: Array.isArray(bodyAst) ? bodyAst : [bodyAst],
        handlers: handlers,
        elseBlock: null,
        finalizer: Array.isArray(finalizer) ? finalizer : [finalizer]
      };
    },

    TryStmt_except(_try, _colon, body, excepts) {
      const bodyAst = body.toAST();
      const handlers = excepts.children.map(e => e.toAST());
      return {
        type: 'TryStatement',
        block: Array.isArray(bodyAst) ? bodyAst : [bodyAst],
        handlers: handlers,
        elseBlock: null,
        finalizer: null
      };
    },

    TryStmt_finally(_try, _colon, body, fin) {
      const bodyAst = body.toAST();
      const finalizer = fin.toAST();
      return {
        type: 'TryStatement',
        block: Array.isArray(bodyAst) ? bodyAst : [bodyAst],
        handlers: [],
        elseBlock: null,
        finalizer: Array.isArray(finalizer) ? finalizer : [finalizer]
      };
    },

    ElseClause(_else, _colon, suite) {
      return suite.toAST();
    },

    ExceptClause_as(_except, exp, _as, id, _colon, suite) {
      const bodyAst = suite.toAST();
      return {
        type: 'CatchClause',
        param: { type: 'Identifier', name: id.sourceString },
        errorClass: exp.toAST(),
        body: Array.isArray(bodyAst) ? bodyAst : [bodyAst]
      };
    },

    ExceptClause_typed(_except, exp, _colon, suite) {
      const bodyAst = suite.toAST();
      return {
        type: 'CatchClause',
        param: null,
        errorClass: exp.toAST(),
        body: Array.isArray(bodyAst) ? bodyAst : [bodyAst]
      };
    },

    ExceptClause_bare(_except, _colon, suite) {
      const bodyAst = suite.toAST();
      return {
        type: 'CatchClause',
        param: null,
        errorClass: null,
        body: Array.isArray(bodyAst) ? bodyAst : [bodyAst]
      };
    },

    FinallyClause(_finally, _colon, suite) {
      return suite.toAST();
    },

    RaiseStmt_from_exp(_raise, exp, _from, _cause, _semi) {
      return {
        type: 'ThrowStatement',
        argument: exp.toAST()
      };
    },

    RaiseStmt_with_exp(_raise, exp, _semi) {
      return {
        type: 'ThrowStatement',
        argument: exp.toAST()
      };
    },

    RaiseStmt_bare(_raise, _semi) {
      return {
        type: 'ThrowStatement',
        argument: null
      };
    },

    WithStmt_as(_with, exp, _as, target, _colon, suite) {
      return desugarWith(exp.toAST(), target.toAST(), suite.toAST());
    },

    WithStmt_bare(_with, exp, _colon, suite) {
      return desugarWith(exp.toAST(), null, suite.toAST());
    },

    ImportStmt_standard_import(_imp, items, _semi) {
      const res = items.asIteration().children.map(it => {
        const parsed = it.toAST();
        return {
          type: 'ImportStatement',
          module: parsed.module,
          alias: parsed.alias
        };
      });
      return res.length === 1 ? res[0] : res;
    },

    ImportStmt_from_import(_from, mod, _imp, items, _semi) {
      const isStar = items.sourceString.trim() === '*';
      return {
        type: 'ImportStatement',
        module: mod.sourceString,
        specifiers: isStar
          ? [{ imported: '*', local: '*' }]
          : items.asIteration().children.map(it => {
              const parsed = it.toAST();
              return {
                imported: parsed.module,
                local: parsed.alias || parsed.module
              };
            })
      };
    },

    ImportItem(mod, _as, alias) {
      return {
        module: mod.sourceString,
        alias: alias.children.length > 0 ? alias.children[0].sourceString : null
      };
    },

    ReturnStmt_values(_ret, exprs, _optComma, _semi) {
      const elements = exprs.asIteration().children.map(e => e.toAST());
      return {
        type: 'ReturnStatement',
        argument: elements.length === 1 ? elements[0] : { type: 'ArrayExpression', elements }
      };
    },

    ReturnStmt_empty(_ret, _semi) {
      return {
        type: 'ReturnStatement',
        argument: null
      };
    },

    YieldStmt_from(_yield, _from, exp, _semi) {
      return { type: 'YieldStatement', delegate: true, argument: exp.toAST() };
    },

    YieldStmt_values(_yield, exprs, _optComma, _semi) {
      const elements = exprs.asIteration().children.map(e => e.toAST());
      return {
        type: 'YieldStatement',
        delegate: false,
        argument: elements.length === 1 ? elements[0] : { type: 'ArrayExpression', elements }
      };
    },

    YieldStmt_empty(_yield, _semi) {
      return { type: 'YieldStatement', delegate: false, argument: null };
    },

    YieldExp_from(_yield, _from, exp) {
      return { type: 'YieldExpression', delegate: true, argument: exp.toAST() };
    },

    YieldExp_values(_yield, exprs, _optComma) {
      const elements = exprs.asIteration().children.map(e => e.toAST());
      return {
        type: 'YieldExpression',
        delegate: false,
        argument: elements.length === 1 ? elements[0] : { type: 'ArrayExpression', elements }
      };
    },

    YieldExp_empty(_yield) {
      return { type: 'YieldExpression', delegate: false, argument: null };
    },

    BreakStmt(_break, _semi) {
      return { type: 'BreakStatement' };
    },

    ContinueStmt(_continue, _semi) {
      return { type: 'ContinueStatement' };
    },

    GlobalStmt(_global, names, _semi) {
      return {
        type: 'GlobalStatement',
        names: names.asIteration().children.map(n => n.sourceString)
      };
    },

    NonlocalStmt(_nonlocal, names, _semi) {
      return {
        type: 'NonlocalStatement',
        names: names.asIteration().children.map(n => n.sourceString)
      };
    },

    PassStmt(_pass, _semi) {
      return null;
    },

    AssertStmt(_assert, test, _optComma, msg, _semi) {
      const testAst = test.toAST();
      const msgAst = msg.children.length > 0 ? msg.children[0].toAST() : { type: 'Literal', value: 'assertion failed' };
      return {
        type: 'IfStatement',
        test: { type: 'UnaryExpression', operator: '!', argument: testAst },
        consequent: [
          {
            type: 'ExpressionStatement',
            expression: {
              type: 'CallExpression',
              callee: { type: 'Identifier', name: 'print' },
              arguments: [
                {
                  type: 'BinaryExpression',
                  operator: '+',
                  left: { type: 'Literal', value: 'AssertionError: ' },
                  right: msgAst
                }
              ]
            }
          }
        ],
        alternate: null
      };
    },

    DelStmt(_del, targets, _semi) {
      const flat = targets.asIteration().children.flatMap(t => {
        const ast = t.toAST();
        return Array.isArray(ast) ? ast : [ast];
      });
      return flat.map(target => {
        if (target.type === 'IndexExpression') {
          return {
            type: 'ExpressionStatement',
            expression: {
              type: 'CallExpression',
              callee: { type: 'Identifier', name: '__delitem' },
              arguments: [target.object, target.index]
            }
          };
        }
        if (target.type === 'MemberExpression') {
          return {
            type: 'ExpressionStatement',
            expression: {
              type: 'CallExpression',
              callee: { type: 'Identifier', name: 'delattr' },
              arguments: [target.object, { type: 'Literal', value: target.property.name }]
            }
          };
        }
        return {
          type: 'ExpressionStatement',
          expression: {
            type: 'BinaryExpression',
            operator: '=',
            left: target,
            right: { type: 'Literal', value: null }
          }
        };
      });
    },

    AssignLHS_list(_ob, items, _optComma, _cb) {
      return items.asIteration().children.map(i => i.toAST());
    },

    AssignLHS_tuple(_ob, items, _optComma, _cb) {
      return items.asIteration().children.map(i => i.toAST());
    },

    AssignTarget(targets) {
      const flat = [];
      for (const t of targets.asIteration().children) {
        const ast = t.toAST();
        if (Array.isArray(ast)) flat.push(...ast);
        else flat.push(ast);
      }
      return flat;
    },

    AssignValue(values) {
      return values.asIteration().children.map(v => v.toAST());
    },

    AssignStmt_aug(target, op, value, _semi) {
      const targets = target.toAST();
      const values = value.toAST();
      const opStr = op.sourceString;
      const binOp = opStr.slice(0, -1);
      return {
        type: 'ExpressionStatement',
        expression: {
          type: 'BinaryExpression',
          operator: '=',
          left: targets[0],
          right: {
            type: 'BinaryExpression',
            operator: binOp,
            left: targets[0],
            right: values[0]
          }
        }
      };
    },

    AssignStmt_chained(first, _eqs, moreTargets, _lookahead, _finalEq, value, _semi) {
      const allTargetNodes = [first, ...moreTargets.children];
      const values = value.toAST();

      const id = ++forCounter;
      const tempVar = `__chain_${id}`;
      const rhsValue = values.length > 1 ? { type: 'ArrayExpression', elements: values } : values[0];
      const stmts = [
        {
          type: 'VariableDeclarationStatement',
          name: tempVar,
          expression: rhsValue
        }
      ];

      for (const tNode of allTargetNodes) {
        const targets = tNode.toAST();
        if (targets.length === 1) {
          stmts.push({
            type: 'ExpressionStatement',
            expression: {
              type: 'BinaryExpression',
              operator: '=',
              left: targets[0],
              right: { type: 'Identifier', name: tempVar }
            }
          });
        } else {
          for (let i = 0; i < targets.length; i++) {
            stmts.push({
              type: 'ExpressionStatement',
              expression: {
                type: 'BinaryExpression',
                operator: '=',
                left: targets[i],
                right: {
                  type: 'IndexExpression',
                  object: { type: 'Identifier', name: tempVar },
                  index: { type: 'Literal', value: i }
                }
              }
            });
          }
        }
      }

      return stmts;
    },

    AssignStmt_simple(target, _eq, value, _semi) {
      const targets = target.toAST();
      const values = value.toAST();

      if (targets.length === 1 && values.length === 1) {
        return {
          type: 'ExpressionStatement',
          expression: {
            type: 'BinaryExpression',
            operator: '=',
            left: targets[0],
            right: values[0]
          }
        };
      }

      // Multi-target unpacking: a, b = 1, 2 or a, b = b, a or a, b = seq
      const id = ++forCounter;
      const tempVar = `__unpack_${id}`;
      let rhsValue;

      if (values.length > 1) {
        rhsValue = { type: 'ArrayExpression', elements: values };
      } else {
        rhsValue = values[0];
      }

      const stmts = [
        {
          type: 'VariableDeclarationStatement',
          name: tempVar,
          expression: rhsValue
        }
      ];

      for (let i = 0; i < targets.length; i++) {
        stmts.push({
          type: 'ExpressionStatement',
          expression: {
            type: 'BinaryExpression',
            operator: '=',
            left: targets[i],
            right: {
              type: 'IndexExpression',
              object: { type: 'Identifier', name: tempVar },
              index: { type: 'Literal', value: i }
            }
          }
        });
      }

      return stmts;
    },

    ExprStmt(expr, _semi) {
      return {
        type: 'ExpressionStatement',
        expression: expr.toAST()
      };
    },

    CondExp_py_ternary(left, _if, cond, _else, right) {
      return {
        type: 'ConditionalExpression',
        test: cond.toAST(),
        consequent: left.toAST(),
        alternate: right.toAST()
      };
    },

    CompOp_not_in(_op) { return 'not in'; },
    CompOp_in(_op) { return 'in'; },
    CompOp_is_not(_op) { return '!='; },
    CompOp_is(_op) { return '=='; },

    EqExp(first, ops, rests) {
      const firstAst = first.toAST();
      if (ops.children.length === 0) {
        return firstAst;
      }

      const opStrings = ops.children.map(o => o.sourceString);
      const restAsts = rests.children.map(r => r.toAST());

      if (opStrings.length === 1) {
        const op = opStrings[0];
        const right = restAsts[0];
        if (op === 'not in') {
          return {
            type: 'UnaryExpression',
            operator: '!',
            argument: { type: 'BinaryExpression', operator: 'in', left: firstAst, right }
          };
        }
        if (op === 'is') return { type: 'BinaryExpression', operator: '==', left: firstAst, right };
        if (op === 'is not') return { type: 'BinaryExpression', operator: '!=', left: firstAst, right };
        return { type: 'BinaryExpression', operator: op, left: firstAst, right };
      }

      // Chained comparisons: 1 < x <= 10 -> (1 < x) and (x <= 10)
      const operands = [firstAst, ...restAsts];
      let chained = null;

      for (let i = 0; i < opStrings.length; i++) {
        let op = opStrings[i];
        const left = operands[i];
        const right = operands[i + 1];
        let cond;
        if (op === 'not in') {
          cond = {
            type: 'UnaryExpression',
            operator: '!',
            argument: { type: 'BinaryExpression', operator: 'in', left, right }
          };
        } else if (op === 'is') {
          cond = { type: 'BinaryExpression', operator: '==', left, right };
        } else if (op === 'is not') {
          cond = { type: 'BinaryExpression', operator: '!=', left, right };
        } else {
          cond = { type: 'BinaryExpression', operator: op, left, right };
        }

        if (chained === null) {
          chained = cond;
        } else {
          chained = {
            type: 'BinaryExpression',
            operator: 'and',
            left: chained,
            right: cond
          };
        }
      }

      return chained;
    },

    MulExp_idiv(left, _op, right) {
      return {
        type: 'BinaryExpression',
        operator: '//',
        left: left.toAST(),
        right: right.toAST()
      };
    },

    MulExp_matmul(left, _op, right) {
      return {
        type: 'BinaryExpression',
        operator: '@',
        left: left.toAST(),
        right: right.toAST()
      };
    },

    MulExp_pow(left, _op, right) {
      return {
        type: 'BinaryExpression',
        operator: '**',
        left: left.toAST(),
        right: right.toAST()
      };
    },

    _iter(...children) {
      return children.map(c => c.toAST());
    },

    SliceExp(start, _c1, stop, _optC2, step) {
      let stepAst = null;
      if (step && step.children.length > 0) {
        const inner = step.children[0];
        if (inner && typeof inner.toAST === 'function') {
          const res = inner.toAST();
          stepAst = Array.isArray(res) ? (res.length > 0 ? res[0] : null) : res;
        }
      }
      return {
        start: start.children.length > 0 ? start.children[0].toAST() : null,
        stop: stop.children.length > 0 ? stop.children[0].toAST() : null,
        step: stepAst
      };
    },

    KeywordArg(id, _eq, exp) {
      return {
        type: 'KeywordArgument',
        name: id.sourceString,
        value: exp.toAST()
      };
    },

    Arg_kwspread(_stars, exp) {
      return { type: 'SpreadElement', isKwSpread: true, argument: exp.toAST() };
    },

    Arg_spread(_star, exp) {
      return { type: 'SpreadElement', argument: exp.toAST() };
    },

    Arg_kwarg(kw) {
      return kw.toAST();
    },

    Arg_walrus(w) {
      return w.toAST();
    },

    Arg_gencomp(gc) {
      return gc.toAST();
    },

    Arg_normal(exp) {
      return exp.toAST();
    },

    PostfixExp_py_call(callee, _lp, args, _rp) {
      const allArgs = args.asIteration().children.map(a => a.toAST());
      const posArgs = [];
      const kwArgs = [];
      const kwSpreads = [];

      for (const a of allArgs) {
        if (a && a.type === 'KeywordArgument') {
          kwArgs.push(a);
        } else if (a && a.type === 'SpreadElement' && a.isKwSpread) {
          kwSpreads.push(a);
        } else {
          posArgs.push(a);
        }
      }

      if (kwArgs.length > 0 || kwSpreads.length > 0) {
        const kwProps = [];
        for (const kwSpread of kwSpreads) {
          kwProps.push({
            type: 'SpreadElement',
            argument: kwSpread.argument
          });
        }
        for (const kw of kwArgs) {
          kwProps.push({
            key: { type: 'Literal', value: kw.name },
            value: kw.value
          });
        }
        kwProps.push({
          key: { type: 'Literal', value: '__is_py_kwargs__' },
          value: { type: 'Literal', value: true }
        });
        const kwObj = {
          type: 'ObjectExpression',
          properties: kwProps
        };
        posArgs.push(kwObj);
      }

      return {
        type: 'CallExpression',
        callee: callee.toAST(),
        arguments: posArgs
      };
    },

    PostfixExp_slice(object, _ob, slice, _cb) {
      const s = slice.toAST();
      return {
        type: 'CallExpression',
        callee: { type: 'Identifier', name: '__slice' },
        arguments: [
          object.toAST(),
          s.start !== null ? s.start : { type: 'Literal', value: null },
          s.stop !== null ? s.stop : { type: 'Literal', value: null },
          s.step !== null ? s.step : { type: 'Literal', value: null }
        ]
      };
    },

    ListComp(_ob, expr, _for, target, _in, iter, _ifOpt, condOpt, _cb) {
      const id = ++forCounter;
      const targets = target.toAST();
      const exprAst = expr.toAST();
      const condAst = condOpt.children.length > 0 ? condOpt.children[0].toAST() : null;

      const appendStmt = {
        type: 'ExpressionStatement',
        expression: {
          type: 'CallExpression',
          callee: {
            type: 'MemberExpression',
            object: { type: 'Identifier', name: '__res' },
            property: { type: 'Identifier', name: 'append' }
          },
          arguments: [exprAst]
        }
      };

      const loopBody = condAst
        ? [{ type: 'IfStatement', test: condAst, consequent: [appendStmt], alternate: null }]
        : [appendStmt];

      const forStmt = desugarForLoop(targets, iter.toAST(), loopBody);

      return {
        type: 'CallExpression',
        callee: {
          type: 'FunctionExpression',
          params: [],
          body: [
            {
              type: 'VariableDeclarationStatement',
              name: '__res',
              expression: { type: 'ArrayExpression', elements: [] }
            },
            ...(Array.isArray(forStmt) ? forStmt : [forStmt]),
            {
              type: 'ReturnStatement',
              argument: { type: 'Identifier', name: '__res' }
            }
          ]
        },
        arguments: []
      };
    },

    GenComp(expr, _for, target, _in, iter, _ifOpt, condOpt) {
      const targets = target.toAST();
      const exprAst = expr.toAST();
      const condAst = condOpt.children.length > 0 ? condOpt.children[0].toAST() : null;

      const appendStmt = {
        type: 'ExpressionStatement',
        expression: {
          type: 'CallExpression',
          callee: {
            type: 'MemberExpression',
            object: { type: 'Identifier', name: '__res' },
            property: { type: 'Identifier', name: 'append' }
          },
          arguments: [exprAst]
        }
      };

      const loopBody = condAst
        ? [{ type: 'IfStatement', test: condAst, consequent: [appendStmt], alternate: null }]
        : [appendStmt];

      const forStmt = desugarForLoop(targets, iter.toAST(), loopBody);

      return {
        type: 'CallExpression',
        callee: {
          type: 'FunctionExpression',
          params: [],
          body: [
            {
              type: 'VariableDeclarationStatement',
              name: '__res',
              expression: { type: 'ArrayExpression', elements: [] }
            },
            ...(Array.isArray(forStmt) ? forStmt : [forStmt]),
            {
              type: 'ReturnStatement',
              argument: { type: 'Identifier', name: '__res' }
            }
          ]
        },
        arguments: []
      };
    },

    DictComp(_ob, key, _colon, value, _for, target, _in, iter, _ifOpt, condOpt, _cb) {
      const targets = target.toAST();
      const keyAst = key.toAST();
      const valAst = value.toAST();
      const condAst = condOpt.children.length > 0 ? condOpt.children[0].toAST() : null;

      const setStmt = {
        type: 'ExpressionStatement',
        expression: {
          type: 'BinaryExpression',
          operator: '=',
          left: {
            type: 'IndexExpression',
            object: { type: 'Identifier', name: '__res' },
            index: keyAst
          },
          right: valAst
        }
      };

      const loopBody = condAst
        ? [{ type: 'IfStatement', test: condAst, consequent: [setStmt], alternate: null }]
        : [setStmt];

      const forStmt = desugarForLoop(targets, iter.toAST(), loopBody);

      return {
        type: 'CallExpression',
        callee: {
          type: 'FunctionExpression',
          params: [],
          body: [
            {
              type: 'VariableDeclarationStatement',
              name: '__res',
              expression: { type: 'DictLiteral', properties: [] }
            },
            ...(Array.isArray(forStmt) ? forStmt : [forStmt]),
            {
              type: 'ReturnStatement',
              argument: { type: 'Identifier', name: '__res' }
            }
          ]
        },
        arguments: []
      };
    },

    SetComp(_ob, expr, _for, target, _in, iter, _ifOpt, condOpt, _cb) {
      const targets = target.toAST();
      const exprAst = expr.toAST();
      const condAst = condOpt.children.length > 0 ? condOpt.children[0].toAST() : null;

      const appendStmt = {
        type: 'IfStatement',
        test: {
          type: 'UnaryExpression',
          operator: '!',
          argument: {
            type: 'BinaryExpression',
            operator: 'in',
            left: exprAst,
            right: { type: 'Identifier', name: '__res' }
          }
        },
        consequent: [
          {
            type: 'ExpressionStatement',
            expression: {
              type: 'CallExpression',
              callee: {
                type: 'MemberExpression',
                object: { type: 'Identifier', name: '__res' },
                property: { type: 'Identifier', name: 'append' }
              },
              arguments: [exprAst]
            }
          }
        ],
        alternate: null
      };

      const loopBody = condAst
        ? [{ type: 'IfStatement', test: condAst, consequent: [appendStmt], alternate: null }]
        : [appendStmt];

      const forStmt = desugarForLoop(targets, iter.toAST(), loopBody);

      return {
        type: 'CallExpression',
        callee: {
          type: 'FunctionExpression',
          params: [],
          body: [
            {
              type: 'VariableDeclarationStatement',
              name: '__res',
              expression: { type: 'ArrayExpression', elements: [] }
            },
            ...(Array.isArray(forStmt) ? forStmt : [forStmt]),
            {
              type: 'ReturnStatement',
              argument: { type: 'Identifier', name: '__res' }
            }
          ]
        },
        arguments: []
      };
    },

    LambdaExp(_lambda, params, _colon, body) {
      return {
        type: 'FunctionExpression',
        name: '<lambda>',
        params: params.asIteration().children.map(p => ({ type: 'Identifier', name: p.sourceString })),
        body: [
          {
            type: 'ReturnStatement',
            argument: body.toAST()
          }
        ]
      };
    },

    WalrusExp(id, _op, expr) {
      return {
        type: 'BinaryExpression',
        operator: '=',
        left: { type: 'Identifier', name: id.sourceString },
        right: expr.toAST()
      };
    },

    PrimaryExp_py_true(_kw) {
      return { type: 'Literal', value: true };
    },

    PrimaryExp_py_false(_kw) {
      return { type: 'Literal', value: false };
    },

    PrimaryExp_py_none(_kw) {
      return { type: 'Literal', value: null };
    },

    PrimaryExp_py_list(_ob, items, _optComma, _cb) {
      return {
        type: 'ArrayExpression',
        elements: items.asIteration().children.map(i => i.toAST())
      };
    },

    PrimaryExp_py_dict(_ob, entries, _optComma, _cb) {
      return {
        type: 'DictLiteral',
        properties: entries.asIteration().children.map(e => e.toAST())
      };
    },

    PrimaryExp_py_set(_ob, items, _optComma, _cb) {
      return {
        type: 'CallExpression',
        callee: { type: 'Identifier', name: 'set' },
        arguments: [{
          type: 'ArrayExpression',
          elements: items.asIteration().children.map(i => i.toAST())
        }]
      };
    },

    PrimaryExp_py_tuple(_ob, items, _optComma, _cb) {
      const elms = items.asIteration().children.map(i => i.toAST());
      // A single element without comma is a parenthesized expression, with comma or multiple elements is a tuple
      if (elms.length === 1 && _optComma.children.length === 0) {
        return elms[0];
      }
      return {
        type: 'ArrayExpression',
        elements: elms
      };
    },

    PrimaryExp_py_empty_tuple(_ob, _cb) {
      return {
        type: 'ArrayExpression',
        elements: []
      };
    },

    PrimaryExp_walrus(_ob, walrus, _cb) {
      return walrus.toAST();
    },

    PrimaryExp_py_gencomp(_ob, gc, _cb) {
      return gc.toAST();
    },

    PrimaryExp_py_yield_paren(_ob, yExp, _cb) {
      return yExp.toAST();
    },

    PrimaryExp_py_yield(yExp) {
      return yExp.toAST();
    },

    DictEntry_dict_spread(_starstar, exp) {
      return {
        type: 'SpreadElement',
        argument: exp.toAST()
      };
    },

    DictEntry_kv(key, _colon, value) {
      return {
        key: key.toAST(),
        value: value.toAST()
      };
    },

    // Expressions inherited from BaseSyntax
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
    NotExp_not(_op, arg) {
      return { type: 'UnaryExpression', operator: 'not', argument: arg.toAST(), prefix: true };
    },
    UnaryExp_not(_op, arg) {
      return { type: 'UnaryExpression', operator: '!', argument: arg.toAST(), prefix: true };
    },
    UnaryExp_not_kw(_op, arg) {
      return { type: 'UnaryExpression', operator: 'not', argument: arg.toAST(), prefix: true };
    },
    UnaryExp_neg(_op, arg) {
      return { type: 'UnaryExpression', operator: '-', argument: arg.toAST() };
    },
    UnaryExp_bitnot(_op, arg) {
      return { type: 'UnaryExpression', operator: '~', argument: arg.toAST() };
    },
    UnaryExp_pos(_op, arg) {
      return { type: 'UnaryExpression', operator: '+', argument: arg.toAST() };
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
    string(_prefix, _open, _chars, _close) {
      const prefixStr = _prefix.sourceString.toLowerCase();
      const isRaw = prefixStr.includes('r');
      const regex = /"([^"\\]*(?:\\.[^"\\]*)*)"|'([^'\\]*(?:\\.[^'\\]*)*)'/g;
      let match;
      let combined = '';
      while ((match = regex.exec(this.sourceString)) !== null) {
        const inner = match[1] !== undefined ? match[1] : match[2];
        if (isRaw) {
          combined += inner;
        } else {
          const unescaped = inner.replace(/\\([nrtbfav0'"\\]|x[0-9a-fA-F]{2}|u[0-9a-fA-F]{4})/g, (m, esc) => {
            switch (esc[0]) {
              case 'n': return '\n';
              case 'r': return '\r';
              case 't': return '\t';
              case 'b': return '\b';
              case 'f': return '\f';
              case 'v': return '\v';
              case '0': return '\0';
              case "'": return "'";
              case '"': return '"';
              case '\\': return '\\';
              case 'x': return String.fromCharCode(parseInt(esc.slice(1), 16));
              case 'u': return String.fromCharCode(parseInt(esc.slice(1), 16));
              default: return m;
            }
          });
          combined += unescaped;
        }
      }
      return { type: 'Literal', value: combined };
    },
    PrimaryExp_py_str_concat(first, rest) {
      const firstVal = first.toAST().value;
      const restVals = rest.children.map(s => s.toAST().value);
      return { type: 'Literal', value: firstVal + restVals.join('') };
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
