import * as ohm from 'ohm-js';
import { JAVA_GRAMMAR_SRC } from './java_grammar.js';
import { C_GRAMMAR_SRC } from './c_grammar.js';
import { createASTSemantics } from './semantics.js';
import { createCSemantics } from './c_semantics.js';

import { parsePythonSource } from './python.js';

let javaGrammar = null;
let javaSemantics = null;
let cGrammar = null;
let cSemantics = null;

function initJavaFrontend() {
  if (!javaGrammar) {
    const grammars = ohm.grammars(JAVA_GRAMMAR_SRC);
    javaGrammar = grammars.JavaFamily;
    javaSemantics = createASTSemantics(javaGrammar);
  }
  return { grammar: javaGrammar, semantics: javaSemantics };
}

function initCFrontend() {
  if (!cGrammar) {
    const grammars = ohm.grammars(C_GRAMMAR_SRC);
    cGrammar = grammars.CSyntax;
    cSemantics = createCSemantics(cGrammar);
  }
  return { grammar: cGrammar, semantics: cSemantics };
}

/**
 * Parses source code into a standardized AST.
 *
 * @param {string} sourceCode - Raw source code string.
 * @param {string} [language='auto'] - Target language grammar ('auto', 'python', 'java', 'c').
 * @returns {Object} The generated AST tree.
 * @throws {Error} Detailed syntax error with line, column, and caret pointer on failure.
 */
export function parseSource(sourceCode, language = 'auto') {
  let lang = language;
  if (lang === 'auto') {
    const trimmed = sourceCode.trim();
    if (trimmed.startsWith('#include') || trimmed.includes('PyMethodDef') || trimmed.includes('PyMODINIT_FUNC')) {
      lang = 'c';
    } else if (trimmed.startsWith('#') || trimmed.startsWith('def ') || trimmed.startsWith('import ') || trimmed.startsWith('from ') || trimmed.includes('def ') || trimmed.includes('import ')) {
      lang = 'python';
    } else if (trimmed.startsWith('//') || trimmed.startsWith('/*')) {
      if (trimmed.includes('public class') || trimmed.includes('class ') || trimmed.includes('public static')) {
        lang = 'java';
      } else {
        lang = 'c';
      }
    } else if (trimmed.includes('public class') || trimmed.includes('public static void main') || (trimmed.startsWith('class ') && trimmed.includes('{'))) {
      lang = 'java';
    } else if (
      /\b(int|void|double|float|long|boolean|char|String)\s+[a-zA-Z_0-9]+\s*(=|[;(])/.test(trimmed) &&
      trimmed.includes(';')
    ) {
      lang = 'c';
    } else {
      lang = 'python';
    }
  }

  if (lang === 'python') {
    return parsePythonSource(sourceCode);
  }

  if (lang === 'c') {
    if (sourceCode.includes('#include') || sourceCode.includes('PyMethodDef') || sourceCode.includes('PyMODINIT_FUNC')) {
      const { grammar, semantics } = initCFrontend();
      const match = grammar.match(sourceCode, 'CProgram');
      if (match.succeeded()) {
        return semantics(match).toAST();
      }
    }
    const { grammar, semantics } = initJavaFrontend();
    const match = grammar.match(sourceCode, 'Program');
    if (match.failed()) {
      throw new SyntaxError(`C Syntax Error:\n${match.message}`);
    }
    return semantics(match).toAST();
  }

  const { grammar, semantics } = initJavaFrontend();
  const match = grammar.match(sourceCode, 'Program');
  if (match.failed()) {
    throw new SyntaxError(`Syntax Error:\n${match.message}`);
  }

  return semantics(match).toAST();
}

export { JAVA_GRAMMAR_SRC } from './java_grammar.js';
export { BASE_GRAMMAR_SRC } from './base_grammar.js';
export { PYTHON_GRAMMAR_SRC } from './python_grammar.js';
export { C_GRAMMAR_SRC } from './c_grammar.js';
export { createASTSemantics } from './semantics.js';
export { parsePythonSource } from './python.js';

