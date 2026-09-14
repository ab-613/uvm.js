// File: js/frontend/python_grammar.js
import { BASE_GRAMMAR_SRC } from './base_grammar.js';

/**
 * Python 3 Syntax Specification (Ohm.js PEG)
 * Operates on brace-delimited Python code produced by python_preprocessor.js.
 */
export const PYTHON_GRAMMAR_SRC = `
${BASE_GRAMMAR_SRC}

PythonSyntax <: BaseSyntax {
  comment := "#" (~"\\n" any)* ("\\n" | end)
  id_char = alnum | "_"
  keyword := ("if" | "elif" | "else" | "while" | "for" | "return" | "yield" | "class" | "def" | "True" | "False" | "None" | "import" | "from" | "as" | "pass" | "assert" | "del" | "in" | "is" | "not" | "and" | "or" | "lambda" | "try" | "except" | "finally" | "raise" | "with" | "break" | "continue" | "global" | "nonlocal") ~id_char
  ident := ~keyword (letter | "_") (letter | digit | "_")*
  str_prefix = "rb" | "br" | "RB" | "BR" | "r" | "R" | "u" | "U" | "b" | "B"
  string := str_prefix? ("\\"" (~"\\"" (escape | any))* "\\"" | "'" (~"'" (escape | any))* "'")

  PyProgram = Stmt* end

  Stmt
    = DecoratedDef
    | DecoratedClass
    | DefStmt
    | ClassStmt
    | IfStmt
    | WhileStmt
    | ForStmt
    | TryStmt
    | RaiseStmt
    | WithStmt
    | ImportStmt
    | ReturnStmt
    | YieldStmt
    | BreakStmt
    | ContinueStmt
    | GlobalStmt
    | NonlocalStmt
    | PassStmt
    | AssertStmt
    | DelStmt
    | AssignStmt
    | ExprStmt

  Decorator = "@" PostfixExp ";"?
  DecoratedDef = Decorator+ DefStmt
  DecoratedClass = Decorator+ ClassStmt

  Param
    = "**" ident     -- kwrest
    | "*" ident      -- rest
    | "*"            -- bare_star
    | "/"            -- pos_only
    | ident "=" Exp  -- default
    | ident          -- normal

  kw_def = "def" ~id_char
  kw_class = "class" ~id_char
  kw_if = "if" ~id_char
  kw_elif = "elif" ~id_char
  kw_else = "else" ~id_char
  kw_while = "while" ~id_char
  kw_for = "for" ~id_char
  kw_try = "try" ~id_char
  kw_except = "except" ~id_char
  kw_finally = "finally" ~id_char
  kw_raise = "raise" ~id_char
  kw_with = "with" ~id_char
  kw_import = "import" ~id_char
  kw_from = "from" ~id_char
  kw_as = "as" ~id_char
  kw_return = "return" ~id_char
  kw_yield = "yield" ~id_char
  kw_break = "break" ~id_char
  kw_continue = "continue" ~id_char
  kw_global = "global" ~id_char
  kw_nonlocal = "nonlocal" ~id_char
  kw_pass = "pass" ~id_char
  kw_assert = "assert" ~id_char
  kw_del = "del" ~id_char

  DefStmt = kw_def ident "(" ListOf<Param, ","> ","? ")" ":" Suite
  
  ClassBase
    = ident "=" Exp  -- kwarg
    | PostfixExp     -- base

  ClassStmt = kw_class ident ("(" ListOf<ClassBase, ","> ","? ")")? ":" Suite

  Suite
    = "{" Stmt* "}" -- block
    | Stmt          -- simple

  IfStmt = kw_if Exp ":" Suite (kw_elif Exp ":" Suite)* (kw_else ":" Suite)?
  WhileStmt = kw_while Exp ":" Suite ElseClause?
  ForStmt = kw_for AssignTarget in_op Exp ":" Suite ElseClause?

  TryStmt
    = kw_try ":" Suite ExceptClause+ ElseClause FinallyClause -- except_else_finally
    | kw_try ":" Suite ExceptClause+ ElseClause               -- except_else
    | kw_try ":" Suite ExceptClause+ FinallyClause            -- except_finally
    | kw_try ":" Suite ExceptClause+                          -- except
    | kw_try ":" Suite FinallyClause                          -- finally

  ExceptClause
    = kw_except Exp kw_as ident ":" Suite -- as
    | kw_except Exp ":" Suite             -- typed
    | kw_except ":" Suite                 -- bare

  ElseClause = kw_else ":" Suite
  FinallyClause = kw_finally ":" Suite

  RaiseStmt
    = kw_raise Exp kw_from Exp ";"? -- from_exp
    | kw_raise Exp ";"?             -- with_exp
    | kw_raise ";"?                 -- bare

  WithStmt
    = kw_with Exp kw_as AssignLHS ":" Suite -- as
    | kw_with Exp ":" Suite                 -- bare

  DottedName = NonemptyListOf<ident, ".">

  ImportStmt
    = kw_from DottedName kw_import ("*" | NonemptyListOf<ImportItem, ",">) ";"? -- from_import
    | kw_import NonemptyListOf<ImportItem, ","> ";"?                             -- standard_import

  ImportItem = DottedName (kw_as ident)?

  ReturnStmt
    = kw_return NonemptyListOf<Exp, ","> ","? ";"? -- values
    | kw_return ";"?                               -- empty
  YieldStmt
    = kw_yield kw_from Exp ";"?                            -- from
    | kw_yield NonemptyListOf<Exp, ","> ","? ";"?          -- values
    | kw_yield ";"?                                        -- empty
  YieldExp
    = kw_yield kw_from Exp                                 -- from
    | kw_yield NonemptyListOf<Exp, ","> ","?               -- values
    | kw_yield                                             -- empty
  BreakStmt = kw_break ";"?
  ContinueStmt = kw_continue ";"?
  GlobalStmt = kw_global NonemptyListOf<ident, ","> ";"?
  NonlocalStmt = kw_nonlocal NonemptyListOf<ident, ","> ";"?
  PassStmt = kw_pass ";"?
  AssertStmt = kw_assert Exp ("," Exp)? ";"?
  DelStmt = kw_del NonemptyListOf<AssignLHS, ","> ";"?

  // Sequence Unpacking and Multi-Assignment Targets
  AssignLHS
    = "[" NonemptyListOf<AssignLHS, ","> ","? "]" -- list
    | "(" NonemptyListOf<AssignLHS, ","> ","? ")" -- tuple
    | PostfixExp
    | ident

  AssignTarget = NonemptyListOf<AssignLHS, ",">
  AssignValue = NonemptyListOf<Exp, ",">
  AssignStmt
    = AssignTarget ("+=" | "-=" | "*=" | "/=" | "//=" | "%=" | "**=" | "@=" | "&=" | "|=" | "^=" | "<<=" | ">>=") AssignValue ";"?    -- aug
    | AssignTarget ("=" AssignTarget &("="))+ "=" AssignValue ";"? -- chained
    | AssignTarget "=" AssignValue ";"?                            -- simple

  ExprStmt = Exp ";"?

  // Conditional / Ternary Expressions: x if cond else y
  CondExp := OrExp "if" OrExp "else" Exp -- py_ternary
           | OrExp

  or_op = "||" | ("or" ~id_char)
  and_op = "&&" | ("and" ~id_char)

  OrExp := OrExp or_op AndExp -- or
         | AndExp

  AndExp := AndExp and_op BitOrExp -- and
          | BitOrExp

  not_op = "not" ~id_char
  not_in_op = "not" spaces "in" ~id_char
  in_op = "in" ~id_char
  is_not_op = "is" spaces "not" ~id_char
  is_op = "is" ~id_char

  // Comparison chaining and membership (in, not in, is, is not)
  CompOp
    = "<=" | ">=" | "<" | ">" | "==" | "!="
    | not_in_op -- not_in
    | in_op     -- in
    | is_not_op -- is_not
    | is_op     -- is

  EqExp := ShiftExp (CompOp ShiftExp)*

  NotExp = not_op NotExp -- not
         | EqExp

  BitAndExp := BitAndExp "&" NotExp -- bitand
             | NotExp

  UnaryExp
    += not_op UnaryExp -- not_kw
     | "+" UnaryExp    -- pos

  // Extend MulExp to support Python integer division //, matrix multiplication @, and power **
  MulExp
    += MulExp "//" UnaryExp -- idiv
     | MulExp "@" UnaryExp  -- matmul
     | MulExp "**" UnaryExp -- pow

  SliceExp = Exp? ":" Exp? (":" Exp?)?
  KeywordArg = ident "=" Exp
  GenComp = Exp "for" AssignTarget "in" Exp ("if" Exp)?
  Arg = "**" Exp     -- kwspread
      | "*" Exp      -- spread
      | KeywordArg   -- kwarg
      | WalrusExp    -- walrus
      | GenComp      -- gencomp
      | Exp          -- normal

  PostfixExp
    := PostfixExp ("++" | "--")                           -- postinc
     | PostfixExp "(" ListOf<Arg, ","> ")"                -- py_call
     | PostfixExp "[" SliceExp "]"                        -- slice
     | PostfixExp "[" Exp "]"                             -- index
     | PostfixExp "." ident                               -- member
     | PrimaryExp

  // Comprehensions & Lambdas & Walrus
  ListComp = "[" Exp "for" AssignTarget "in" Exp ("if" Exp)? "]"
  DictComp = "{" Exp ":" Exp "for" AssignTarget "in" Exp ("if" Exp)? "}"
  SetComp  = "{" Exp "for" AssignTarget "in" Exp ("if" Exp)? "}"
  LambdaExp = "lambda" ListOf<ident, ","> ":" Exp
  WalrusExp = ident ":=" Exp

  py_true = "True" ~id_char
  py_false = "False" ~id_char
  py_none = "None" ~id_char

  PrimaryExp
    += py_true                                          -- py_true
    | py_false                                          -- py_false
    | py_none                                           -- py_none
    | string string+                                    -- py_str_concat
    | ListComp
    | DictComp
    | SetComp
    | "[" ListOf<Exp, ","> ","? "]"                     -- py_list
    | "{" ListOf<DictEntry, ","> ","? "}"              -- py_dict
    | "{" NonemptyListOf<Exp, ","> ","? "}"            -- py_set
    | LambdaExp
    | "(" NonemptyListOf<Exp, ","> ","? ")"             -- py_tuple
    | "(" WalrusExp ")"                                 -- walrus
    | "(" GenComp ")"                                   -- py_gencomp
    | "(" YieldExp ")"                                  -- py_yield_paren
    | YieldExp                                          -- py_yield
    | "(" ")"                                           -- py_empty_tuple

  DictEntry
    = "**" Exp     -- dict_spread
    | Exp ":" Exp  -- kv
}
`;
