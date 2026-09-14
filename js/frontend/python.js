// File: js/frontend/python.js
import * as ohm from 'ohm-js';
import { PYTHON_GRAMMAR_SRC } from './python_grammar.js';
import { createPythonSemantics } from './python_semantics.js';
import { preprocessPython } from './python_preprocessor.js';

let pythonGrammar = null;
let pythonSemantics = null;

function initPythonFrontend() {
  if (!pythonGrammar) {
    const bundle = ohm.grammars(PYTHON_GRAMMAR_SRC);
    pythonGrammar = bundle.PythonSyntax;
    pythonSemantics = createPythonSemantics(pythonGrammar);
  }
  return { grammar: pythonGrammar, semantics: pythonSemantics };
}

/**
 * Parses Python source code into a standardized AST.
 * @param {string} sourceCode
 * @returns {object} AST
 */
export function parsePythonSource(sourceCode) {
  const { grammar, semantics } = initPythonFrontend();
  const preprocessed = preprocessPython(sourceCode);
  const match = grammar.match(preprocessed, 'PyProgram');

  if (!match.succeeded()) {
    throw new SyntaxError(`Python Syntax Error:\n${match.message}`);
  }

  return semantics(match).toAST();
}
