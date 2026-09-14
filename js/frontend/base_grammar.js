// File: js/frontend/base_grammar.js
/**
 * Shared Base Syntax Specification (Ohm.js PEG)
 * Defines lexical primitives and the operator precedence hierarchy.
 */

export const BASE_GRAMMAR_SRC = `
BaseSyntax {
  // Lexical Primitives
  ident = ~keyword (letter | "_") (letter | digit | "_")*
  keyword = ("if" | "else" | "while" | "for" | "return" | "class" | "true" | "false" | "null" | "void" | "int" | "double" | "String" | "boolean" | "float" | "long") ~alnum
  
  number = hex | octal | binary | float | integer
  hex = ("0x" | "0X") hexDigit+
  octal = ("0o" | "0O") ("0".."7")+
  binary = ("0b" | "0B") ("0" | "1")+
  float = digit+ "." digit+
  integer = digit+
  
  string = "\\"" (~"\\"" (escape | any))* "\\""
         | "'" (~"'" (escape | any))* "'"
  escape = "\\\\" any

  comment = "//" (~"\\n" any)* ("\\n" | end)
          | "/*" (~"*/" any)* "*/"
  space += comment

  // Expressions (Top-down operator precedence)
  Exp = AssignExp

  AssignExp
    = PrimaryExp ("=" | "+=" | "-=" | "*=" | "/=") Exp  -- assign
    | CondExp

  CondExp
    = OrExp "?" Exp ":" Exp                              -- ternary
    | OrExp

  OrExp
    = OrExp ("||" | "or") AndExp                         -- or
    | AndExp

  AndExp
    = AndExp ("&&" | "and") BitOrExp                     -- and
    | BitOrExp

  BitOrExp
    = BitOrExp "|" BitXorExp                             -- bitor
    | BitXorExp

  BitXorExp
    = BitXorExp "^" BitAndExp                            -- bitxor
    | BitAndExp

  BitAndExp
    = BitAndExp "&" EqExp                                -- bitand
    | EqExp

  EqExp
    = EqExp ("==" | "!=" | "===" | "!==") RelExp         -- eq
    | RelExp

  RelExp
    = RelExp ("<=" | ">=" | "<" | ">") ShiftExp          -- rel
    | ShiftExp

  ShiftExp
    = ShiftExp ("<<" | ">>") AddExp                      -- shift
    | AddExp

  AddExp
    = AddExp ("+" | "-") MulExp                          -- add
    | MulExp

  MulExp
    = MulExp ("*" | "/" | "%") UnaryExp                  -- mul
    | UnaryExp

  UnaryExp
    = "!" UnaryExp                                       -- not
    | "-" UnaryExp                                       -- neg
    | "~" UnaryExp                                       -- bitnot
    | ("++" | "--") UnaryExp                             -- preinc
    | PostfixExp

  PostfixExp
    = PostfixExp ("++" | "--")                           -- postinc
    | PostfixExp "(" ListOf<Exp, ","> ")"                -- call
    | PostfixExp "[" Exp "]"                             -- index
    | PostfixExp "." ident                               -- member
    | PrimaryExp

  PrimaryExp
    = number
    | string
    | "true" ~alnum                                      -- true
    | "false" ~alnum                                     -- false
    | "null" ~alnum                                      -- null
    | ident
    | "(" Exp ")"                                        -- paren
    | "[" ListOf<Exp, ","> "]"                           -- list
}
`;
