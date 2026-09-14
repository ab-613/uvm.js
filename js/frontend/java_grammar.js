// File: js/frontend/java_grammar.js
import { BASE_GRAMMAR_SRC } from './base_grammar.js';

/**
 * C/Java-family Grammar Specification extending BaseSyntax.
 */
export const JAVA_GRAMMAR_SRC = `
${BASE_GRAMMAR_SRC}

JavaFamily <: BaseSyntax {
  Program = TopLevel*

  TopLevel
    = ClassDecl
    | FnDecl
    | Statement

  // Modifiers & Classes
  Modifier = "public" | "private" | "protected" | "static" | "final" | "abstract"
  ClassDecl = Modifier* "class" ident ("extends" ident)? ("implements" ListOf<ident, ",">)? "{" Member* "}"
  
  Member
    = MethodDecl
    | FieldDecl

  MethodDecl = Modifier* Type ident "(" ListOf<Param, ","> ")" ThrowsClause? Block
  ThrowsClause = "throws" ListOf<ident, ",">
  FieldDecl = Modifier* VarDecl

  // Functions & Methods
  FnDecl = Type ident "(" ListOf<Param, ","> ")" Block
  Param = Type ident
  Type = (PrimitiveType | ident) ("[" "]")*
  PrimitiveType = "void" | "int" | "double" | "float" | "long" | "boolean" | "String" | "char"

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
  IfStmt = "if" "(" Exp ")" Statement ("else" Statement)?
  WhileStmt = "while" "(" Exp ")" Statement
  ForStmt = "for" "(" (VarDecl | ExprStmt | ";") Exp? ";" Exp? ")" Statement
  ReturnStmt = "return" Exp? ";"
  VarDecl = Type ident ("=" Exp)? ";"
  ExprStmt = Exp ";"
}
`;
