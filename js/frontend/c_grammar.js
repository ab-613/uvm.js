// File: js/frontend/c_grammar.js
import { BASE_GRAMMAR_SRC } from './base_grammar.js';

/**
 * C Extension Syntax Specification (Ohm.js PEG)
 * Parses standard C source files targeting Python.h (PyMethodDef, PyArg_ParseTuple, C functions).
 */
export const C_GRAMMAR_SRC = `
${BASE_GRAMMAR_SRC}

CSyntax <: BaseSyntax {
  CProgram = CTopLevel* end

  CTopLevel
    = includeDirective
    | MethodTable
    | ModuleInit
    | CFunction
    | VarDecl

  includeDirective = "#" "include" (~"\\n" any)* ("\\n" | end)
  
  // Method table definition: static PyMethodDef Methods[] = { ... };
  MethodTable = "static"? "PyMethodDef" ident "[]" "=" "{" ListOf<MethodEntry, ","> ","? "}" ";"
  MethodEntry = "{" (string | "NULL") "," (ident | "NULL") "," (ident | digit+) "," (string | "NULL") "}"

  // PyMODINIT_FUNC PyInit_modulename(void) { ... }
  ModuleInit = "PyMODINIT_FUNC" ident "(" "void"? ")" Block

  // C Functions
  CFunction = "static"? Type ident "(" ListOf<Param, ","> ")" Block
  Param = Type ident
  
  Type = (PrimitiveType | ident) "*"?
  PrimitiveType = "void" | "int" | "double" | "float" | "long" | "char" | "PyObject"

  // Statements
  Statement
    = Block
    | IfStmt
    | WhileStmt
    | ForStmt
    | ReturnStmt
    | VarDecl
    | ExprStmt

  Block = "{" Statement* "}"
  IfStmt = "if" "(" Exp ")" (Block | Statement) ("else" (Block | Statement))?
  WhileStmt = "while" "(" Exp ")" (Block | Statement)
  ForStmt = "for" "(" (VarDecl | ExprStmt | ";") Exp? ";" Exp? ")" (Block | Statement)
  ReturnStmt = "return" Exp? ";"
  VarDecl = Type ListOf<VarInit, ","> ";"
  VarInit = ident ("=" Exp)?
  ExprStmt = Exp ";"

  // Extend UnaryExp for pointer dereference & address-of
  UnaryExp
    += "&" UnaryExp -- addressof
    | "*" UnaryExp -- deref

  PrimaryExp
    += "NULL" ~alnum -- c_null
}
`;
