/* UVM Studio - Bytecode Virtual Machine & Stepper (Universal Interpreter) */

var UVM = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // js/index.js
  var index_exports = {};
  __export(index_exports, {
    BytecodeCompiler: () => BytecodeCompiler,
    BytecodeProgram: () => BytecodeProgram,
    ModuleManager: () => ModuleManager,
    OP: () => OP,
    OP_NAMES: () => OP_NAMES,
    SYSCALL: () => SYSCALL,
    SYSCALL_NAMES: () => SYSCALL_NAMES,
    Scheduler: () => Scheduler,
    UniversalInterpreter: () => UniversalInterpreter,
    VirtualFileSystem: () => VirtualFileSystem,
    VirtualMachine: () => VirtualMachine,
    VirtualTerminal: () => VirtualTerminal,
    default: () => index_default,
    loadCExtension: () => loadCExtension,
    moduleManager: () => moduleManager,
    parseSource: () => parseSource,
    vfs: () => vfs
  });

  // node_modules/ohm-js/src/common.js
  var common_exports = {};
  __export(common_exports, {
    StringBuffer: () => StringBuffer,
    abstract: () => abstract,
    assert: () => assert,
    checkNotNull: () => checkNotNull,
    clone: () => clone,
    copyWithoutDuplicates: () => copyWithoutDuplicates,
    defineLazyProperty: () => defineLazyProperty,
    getDuplicates: () => getDuplicates,
    isLexical: () => isLexical,
    isSyntactic: () => isSyntactic,
    padLeft: () => padLeft,
    repeat: () => repeat,
    repeatFn: () => repeatFn,
    repeatStr: () => repeatStr,
    unescapeCodePoint: () => unescapeCodePoint,
    unexpectedObjToString: () => unexpectedObjToString
  });
  var escapeStringFor = {};
  for (let c = 0; c < 128; c++) {
    escapeStringFor[c] = String.fromCharCode(c);
  }
  escapeStringFor["'".charCodeAt(0)] = "\\'";
  escapeStringFor['"'.charCodeAt(0)] = '\\"';
  escapeStringFor["\\".charCodeAt(0)] = "\\\\";
  escapeStringFor["\b".charCodeAt(0)] = "\\b";
  escapeStringFor["\f".charCodeAt(0)] = "\\f";
  escapeStringFor["\n".charCodeAt(0)] = "\\n";
  escapeStringFor["\r".charCodeAt(0)] = "\\r";
  escapeStringFor["	".charCodeAt(0)] = "\\t";
  escapeStringFor["\v".charCodeAt(0)] = "\\v";
  function abstract(optMethodName) {
    const methodName = optMethodName || "";
    return function() {
      throw new Error(
        "this method " + methodName + " is abstract! (it has no implementation in class " + this.constructor.name + ")"
      );
    };
  }
  function assert(cond, message) {
    if (!cond) {
      throw new Error(message || "Assertion failed");
    }
  }
  function defineLazyProperty(obj, propName, getterFn) {
    let memo;
    Object.defineProperty(obj, propName, {
      get() {
        if (!memo) {
          memo = getterFn.call(this);
        }
        return memo;
      }
    });
  }
  function clone(obj) {
    if (obj) {
      return Object.assign({}, obj);
    }
    return obj;
  }
  function repeatFn(fn, n) {
    const arr = [];
    while (n-- > 0) {
      arr.push(fn());
    }
    return arr;
  }
  function repeatStr(str, n) {
    return new Array(n + 1).join(str);
  }
  function repeat(x, n) {
    return repeatFn(() => x, n);
  }
  function getDuplicates(array) {
    const duplicates = [];
    for (let idx = 0; idx < array.length; idx++) {
      const x = array[idx];
      if (array.lastIndexOf(x) !== idx && duplicates.indexOf(x) < 0) {
        duplicates.push(x);
      }
    }
    return duplicates;
  }
  function copyWithoutDuplicates(array) {
    const noDuplicates = [];
    array.forEach((entry) => {
      if (noDuplicates.indexOf(entry) < 0) {
        noDuplicates.push(entry);
      }
    });
    return noDuplicates;
  }
  function isSyntactic(ruleName) {
    const firstChar = ruleName[0];
    return firstChar === firstChar.toUpperCase();
  }
  function isLexical(ruleName) {
    return !isSyntactic(ruleName);
  }
  function padLeft(str, len, optChar) {
    const ch = optChar || " ";
    if (str.length < len) {
      return repeatStr(ch, len - str.length) + str;
    }
    return str;
  }
  function StringBuffer() {
    this.strings = [];
  }
  StringBuffer.prototype.append = function(str) {
    this.strings.push(str);
  };
  StringBuffer.prototype.contents = function() {
    return this.strings.join("");
  };
  var escapeUnicode = (str) => String.fromCodePoint(parseInt(str, 16));
  function unescapeCodePoint(s) {
    if (s.charAt(0) === "\\") {
      switch (s.charAt(1)) {
        case "b":
          return "\b";
        case "f":
          return "\f";
        case "n":
          return "\n";
        case "r":
          return "\r";
        case "t":
          return "	";
        case "v":
          return "\v";
        case "x":
          return escapeUnicode(s.slice(2, 4));
        case "u":
          return s.charAt(2) === "{" ? escapeUnicode(s.slice(3, -1)) : escapeUnicode(s.slice(2, 6));
        default:
          return s.charAt(1);
      }
    } else {
      return s;
    }
  }
  function unexpectedObjToString(obj) {
    if (obj == null) {
      return String(obj);
    }
    const baseToString = Object.prototype.toString.call(obj);
    try {
      let typeName;
      if (obj.constructor && obj.constructor.name) {
        typeName = obj.constructor.name;
      } else if (baseToString.indexOf("[object ") === 0) {
        typeName = baseToString.slice(8, -1);
      } else {
        typeName = typeof obj;
      }
      return typeName + ": " + JSON.stringify(String(obj));
    } catch {
      return baseToString;
    }
  }
  function checkNotNull(obj, message = "unexpected null value") {
    if (obj == null) {
      throw new Error(message);
    }
    return obj;
  }

  // node_modules/ohm-js/src/unicode.js
  var toRegExp = (val) => new RegExp(String.raw`\p{${val}}`, "u");
  var UnicodeCategories = Object.fromEntries(
    [
      "Cc",
      "Cf",
      "Cn",
      "Co",
      "Cs",
      "Ll",
      "Lm",
      "Lo",
      "Lt",
      "Lu",
      "Mc",
      "Me",
      "Mn",
      "Nd",
      "Nl",
      "No",
      "Pc",
      "Pd",
      "Pe",
      "Pf",
      "Pi",
      "Po",
      "Ps",
      "Sc",
      "Sk",
      "Sm",
      "So",
      "Zl",
      "Zp",
      "Zs"
    ].map((cat) => [cat, toRegExp(cat)])
  );
  UnicodeCategories["Ltmo"] = /\p{Lt}|\p{Lm}|\p{Lo}/u;
  var UnicodeBinaryProperties = Object.fromEntries(
    ["XID_Start", "XID_Continue", "White_Space"].map((prop) => [prop, toRegExp(prop)])
  );

  // node_modules/ohm-js/src/pexprs-main.js
  var PExpr = class _PExpr {
    constructor() {
      if (this.constructor === _PExpr) {
        throw new Error("PExpr cannot be instantiated -- it's abstract");
      }
    }
    // Set the `source` property to the interval containing the source for this expression.
    withSource(interval) {
      if (interval) {
        this.source = interval.trimmed();
      }
      return this;
    }
  };
  var any = Object.create(PExpr.prototype);
  var end = Object.create(PExpr.prototype);
  var Terminal = class extends PExpr {
    constructor(obj) {
      super();
      this.obj = obj;
    }
  };
  var Range = class extends PExpr {
    constructor(from, to) {
      super();
      this.from = from;
      this.to = to;
      this.matchCodePoint = from.length > 1 || to.length > 1;
    }
  };
  var Param = class extends PExpr {
    constructor(index) {
      super();
      this.index = index;
    }
  };
  var Alt = class extends PExpr {
    constructor(terms) {
      super();
      this.terms = terms;
    }
  };
  var Extend = class extends Alt {
    constructor(superGrammar, name, body) {
      const origBody = superGrammar.rules[name].body;
      super([body, origBody]);
      this.superGrammar = superGrammar;
      this.name = name;
      this.body = body;
    }
  };
  var Splice = class extends Alt {
    constructor(superGrammar, ruleName, beforeTerms, afterTerms) {
      const origBody = superGrammar.rules[ruleName].body;
      super([...beforeTerms, origBody, ...afterTerms]);
      this.superGrammar = superGrammar;
      this.ruleName = ruleName;
      this.expansionPos = beforeTerms.length;
    }
  };
  var Seq = class extends PExpr {
    constructor(factors) {
      super();
      this.factors = factors;
    }
  };
  var Iter = class extends PExpr {
    constructor(expr) {
      super();
      this.expr = expr;
    }
  };
  var Star = class extends Iter {
  };
  var Plus = class extends Iter {
  };
  var Opt = class extends Iter {
  };
  Star.prototype.operator = "*";
  Plus.prototype.operator = "+";
  Opt.prototype.operator = "?";
  Star.prototype.minNumMatches = 0;
  Plus.prototype.minNumMatches = 1;
  Opt.prototype.minNumMatches = 0;
  Star.prototype.maxNumMatches = Number.POSITIVE_INFINITY;
  Plus.prototype.maxNumMatches = Number.POSITIVE_INFINITY;
  Opt.prototype.maxNumMatches = 1;
  var Not = class extends PExpr {
    constructor(expr) {
      super();
      this.expr = expr;
    }
  };
  var Lookahead = class extends PExpr {
    constructor(expr) {
      super();
      this.expr = expr;
    }
  };
  var Lex = class extends PExpr {
    constructor(expr) {
      super();
      this.expr = expr;
    }
  };
  var Apply = class extends PExpr {
    constructor(ruleName, args = []) {
      super();
      this.ruleName = ruleName;
      this.args = args;
    }
    isSyntactic() {
      return isSyntactic(this.ruleName);
    }
    // This method just caches the result of `this.toString()` in a non-enumerable property.
    toMemoKey() {
      if (!this._memoKey) {
        Object.defineProperty(this, "_memoKey", { value: this.toString() });
      }
      return this._memoKey;
    }
  };
  var UnicodeChar = class extends PExpr {
    constructor(categoryOrProp) {
      super();
      this.categoryOrProp = categoryOrProp;
      if (categoryOrProp in UnicodeCategories) {
        this.pattern = UnicodeCategories[categoryOrProp];
      } else if (categoryOrProp in UnicodeBinaryProperties) {
        this.pattern = UnicodeBinaryProperties[categoryOrProp];
      } else {
        throw new Error(
          `Invalid Unicode category or property name: ${JSON.stringify(categoryOrProp)}`
        );
      }
    }
  };

  // node_modules/ohm-js/src/errors.js
  function createError(message, optInterval) {
    let e;
    if (optInterval) {
      e = new Error(optInterval.getLineAndColumnMessage() + message);
      e.shortMessage = message;
      e.interval = optInterval;
    } else {
      e = new Error(message);
    }
    return e;
  }
  function intervalSourcesDontMatch() {
    return createError("Interval sources don't match");
  }
  function grammarSyntaxError(matchFailure) {
    const e = new Error();
    Object.defineProperty(e, "message", {
      enumerable: true,
      get() {
        return matchFailure.message;
      }
    });
    Object.defineProperty(e, "shortMessage", {
      enumerable: true,
      get() {
        return "Expected " + matchFailure.getExpectedText();
      }
    });
    e.interval = matchFailure.getInterval();
    return e;
  }
  function undeclaredGrammar(grammarName, namespace, interval) {
    const message = namespace ? `Grammar ${grammarName} is not declared in namespace '${namespace}'` : "Undeclared grammar " + grammarName;
    return createError(message, interval);
  }
  function duplicateGrammarDeclaration(grammar2, namespace) {
    return createError("Grammar " + grammar2.name + " is already declared in this namespace");
  }
  function grammarDoesNotSupportIncrementalParsing(grammar2) {
    return createError(`Grammar '${grammar2.name}' does not support incremental parsing`);
  }
  function undeclaredRule(ruleName, grammarName, optInterval) {
    return createError(
      "Rule " + ruleName + " is not declared in grammar " + grammarName,
      optInterval
    );
  }
  function cannotOverrideUndeclaredRule(ruleName, grammarName, optSource) {
    return createError(
      "Cannot override rule " + ruleName + " because it is not declared in " + grammarName,
      optSource
    );
  }
  function cannotExtendUndeclaredRule(ruleName, grammarName, optSource) {
    return createError(
      "Cannot extend rule " + ruleName + " because it is not declared in " + grammarName,
      optSource
    );
  }
  function duplicateRuleDeclaration(ruleName, grammarName, declGrammarName, optSource) {
    let message = "Duplicate declaration for rule '" + ruleName + "' in grammar '" + grammarName + "'";
    if (grammarName !== declGrammarName) {
      message += " (originally declared in '" + declGrammarName + "')";
    }
    return createError(message, optSource);
  }
  function wrongNumberOfParameters(ruleName, expected, actual, source) {
    return createError(
      "Wrong number of parameters for rule " + ruleName + " (expected " + expected + ", got " + actual + ")",
      source
    );
  }
  function wrongNumberOfArguments(ruleName, expected, actual, expr) {
    return createError(
      "Wrong number of arguments for rule " + ruleName + " (expected " + expected + ", got " + actual + ")",
      expr
    );
  }
  function duplicateParameterNames(ruleName, duplicates, source) {
    return createError(
      "Duplicate parameter names in rule " + ruleName + ": " + duplicates.join(", "),
      source
    );
  }
  function invalidParameter(ruleName, expr) {
    return createError(
      "Invalid parameter to rule " + ruleName + ": " + expr + " has arity " + expr.getArity() + ", but parameter expressions must have arity 1",
      expr.source
    );
  }
  var syntacticVsLexicalNote = "NOTE: A _syntactic rule_ is a rule whose name begins with a capital letter. See https://ohmjs.org/d/svl for more details.";
  function applicationOfSyntacticRuleFromLexicalContext(ruleName, applyExpr) {
    return createError(
      "Cannot apply syntactic rule " + ruleName + " from here (inside a lexical context)",
      applyExpr.source
    );
  }
  function applySyntacticWithLexicalRuleApplication(applyExpr) {
    const { ruleName } = applyExpr;
    return createError(
      `applySyntactic is for syntactic rules, but '${ruleName}' is a lexical rule. ` + syntacticVsLexicalNote,
      applyExpr.source
    );
  }
  function unnecessaryExperimentalApplySyntactic(applyExpr) {
    return createError(
      "applySyntactic is not required here (in a syntactic context)",
      applyExpr.source
    );
  }
  function incorrectArgumentType(expectedType, expr) {
    return createError("Incorrect argument type: expected " + expectedType, expr.source);
  }
  function multipleSuperSplices(expr) {
    return createError("'...' can appear at most once in a rule body", expr.source);
  }
  function invalidCodePoint(applyWrapper) {
    const node = applyWrapper._node;
    assert(node && node.isNonterminal() && node.ctorName === "escapeChar_unicodeCodePoint");
    const digitIntervals = applyWrapper.children.slice(1, -1).map((d) => d.source);
    const fullInterval = digitIntervals[0].coverageWith(...digitIntervals.slice(1));
    return createError(
      `U+${fullInterval.contents} is not a valid Unicode code point`,
      fullInterval
    );
  }
  function kleeneExprHasNullableOperand(kleeneExpr, applicationStack) {
    const actuals = applicationStack.length > 0 ? applicationStack[applicationStack.length - 1].args : [];
    const expr = kleeneExpr.expr.substituteParams(actuals);
    let message = "Nullable expression " + expr + " is not allowed inside '" + kleeneExpr.operator + "' (possible infinite loop)";
    if (applicationStack.length > 0) {
      const stackTrace = applicationStack.map((app) => new Apply(app.ruleName, app.args)).join("\n");
      message += "\nApplication stack (most recent application last):\n" + stackTrace;
    }
    return createError(message, kleeneExpr.expr.source);
  }
  function inconsistentArity(ruleName, expected, actual, expr) {
    return createError(
      "Rule " + ruleName + " involves an alternation which has inconsistent arity (expected " + expected + ", got " + actual + ")",
      expr.source
    );
  }
  function multipleErrors(errors) {
    const messages = errors.map((e) => e.message);
    return createError(["Errors:"].concat(messages).join("\n- "), errors[0].interval);
  }
  function missingSemanticAction(ctorName, name, type, stack) {
    let stackTrace = stack.slice(0, -1).map((info) => {
      const ans = "  " + info[0].name + " > " + info[1];
      return info.length === 3 ? ans + " for '" + info[2] + "'" : ans;
    }).join("\n");
    stackTrace += "\n  " + name + " > " + ctorName;
    let moreInfo = "";
    if (ctorName === "_iter") {
      moreInfo = [
        "\nNOTE: as of Ohm v16, there is no default action for iteration nodes \u2014 see ",
        "  https://ohmjs.org/d/dsa for details."
      ].join("\n");
    }
    const message = [
      `Missing semantic action for '${ctorName}' in ${type} '${name}'.${moreInfo}`,
      "Action stack (most recent call last):",
      stackTrace
    ].join("\n");
    const e = createError(message);
    e.name = "missingSemanticAction";
    return e;
  }
  function throwErrors(errors) {
    if (errors.length === 1) {
      throw errors[0];
    }
    if (errors.length > 1) {
      throw multipleErrors(errors);
    }
  }

  // node_modules/ohm-js/src/util.js
  function padNumbersToEqualLength(arr) {
    let maxLen = 0;
    const strings = arr.map((n) => {
      const str = n.toString();
      maxLen = Math.max(maxLen, str.length);
      return str;
    });
    return strings.map((s) => padLeft(s, maxLen));
  }
  function strcpy(dest, src, offset) {
    const origDestLen = dest.length;
    const start = dest.slice(0, offset);
    const end2 = dest.slice(offset + src.length);
    return (start + src + end2).substr(0, origDestLen);
  }
  function lineAndColumnToMessage(...ranges) {
    const lineAndCol = this;
    const { offset } = lineAndCol;
    const { repeatStr: repeatStr2 } = common_exports;
    const sb = new StringBuffer();
    sb.append("Line " + lineAndCol.lineNum + ", col " + lineAndCol.colNum + ":\n");
    const lineNumbers = padNumbersToEqualLength([
      lineAndCol.prevLine == null ? 0 : lineAndCol.lineNum - 1,
      lineAndCol.lineNum,
      lineAndCol.nextLine == null ? 0 : lineAndCol.lineNum + 1
    ]);
    const appendLine = (num, content, prefix) => {
      sb.append(prefix + lineNumbers[num] + " | " + content + "\n");
    };
    if (lineAndCol.prevLine != null) {
      appendLine(0, lineAndCol.prevLine, "  ");
    }
    appendLine(1, lineAndCol.line, "> ");
    const lineLen = lineAndCol.line.length;
    let indicationLine = repeatStr2(" ", lineLen + 1);
    for (let i = 0; i < ranges.length; ++i) {
      let startIdx = ranges[i][0];
      let endIdx = ranges[i][1];
      assert(startIdx >= 0 && startIdx <= endIdx, "range start must be >= 0 and <= end");
      const lineStartOffset = offset - lineAndCol.colNum + 1;
      startIdx = Math.max(0, startIdx - lineStartOffset);
      endIdx = Math.min(endIdx - lineStartOffset, lineLen);
      indicationLine = strcpy(indicationLine, repeatStr2("~", endIdx - startIdx), startIdx);
    }
    const gutterWidth = 2 + lineNumbers[1].length + 3;
    sb.append(repeatStr2(" ", gutterWidth));
    indicationLine = strcpy(indicationLine, "^", lineAndCol.colNum - 1);
    sb.append(indicationLine.replace(/ +$/, "") + "\n");
    if (lineAndCol.nextLine != null) {
      appendLine(2, lineAndCol.nextLine, "  ");
    }
    return sb.contents();
  }
  var builtInRulesCallbacks = [];
  function awaitBuiltInRules(cb) {
    builtInRulesCallbacks.push(cb);
  }
  function announceBuiltInRules(grammar2) {
    builtInRulesCallbacks.forEach((cb) => {
      cb(grammar2);
    });
    builtInRulesCallbacks = null;
  }
  function getLineAndColumn(str, offset) {
    let lineNum = 1;
    let colNum = 1;
    let currOffset = 0;
    let lineStartOffset = 0;
    let nextLine = null;
    let prevLine = null;
    let prevLineStartOffset = -1;
    while (currOffset < offset) {
      const c = str.charAt(currOffset++);
      if (c === "\n") {
        lineNum++;
        colNum = 1;
        prevLineStartOffset = lineStartOffset;
        lineStartOffset = currOffset;
      } else if (c !== "\r") {
        colNum++;
      }
    }
    let lineEndOffset = str.indexOf("\n", lineStartOffset);
    if (lineEndOffset === -1) {
      lineEndOffset = str.length;
    } else {
      const nextLineEndOffset = str.indexOf("\n", lineEndOffset + 1);
      nextLine = nextLineEndOffset === -1 ? str.slice(lineEndOffset) : str.slice(lineEndOffset, nextLineEndOffset);
      nextLine = nextLine.replace(/^\r?\n/, "").replace(/\r$/, "");
    }
    if (prevLineStartOffset >= 0) {
      prevLine = str.slice(prevLineStartOffset, lineStartOffset).replace(/\r?\n$/, "");
    }
    const line = str.slice(lineStartOffset, lineEndOffset).replace(/\r$/, "");
    return {
      offset,
      lineNum,
      colNum,
      line,
      prevLine,
      nextLine,
      toString: lineAndColumnToMessage
    };
  }
  function getLineAndColumnMessage(str, offset, ...ranges) {
    return getLineAndColumn(str, offset).toString(...ranges);
  }
  var uniqueId = /* @__PURE__ */ (() => {
    let idCounter = 0;
    return (prefix) => "" + prefix + idCounter++;
  })();

  // node_modules/ohm-js/src/Interval.js
  var Interval = class _Interval {
    constructor(sourceString, startIdx, endIdx) {
      Object.defineProperty(this, "_sourceString", {
        value: sourceString,
        configurable: false,
        enumerable: false,
        writable: false
      });
      this.startIdx = startIdx;
      this.endIdx = endIdx;
    }
    get sourceString() {
      return this._sourceString;
    }
    get contents() {
      if (this._contents === void 0) {
        this._contents = this.sourceString.slice(this.startIdx, this.endIdx);
      }
      return this._contents;
    }
    get length() {
      return this.endIdx - this.startIdx;
    }
    coverageWith(...intervals) {
      return _Interval.coverage(...intervals, this);
    }
    collapsedLeft() {
      return new _Interval(this.sourceString, this.startIdx, this.startIdx);
    }
    collapsedRight() {
      return new _Interval(this.sourceString, this.endIdx, this.endIdx);
    }
    getLineAndColumn() {
      return getLineAndColumn(this.sourceString, this.startIdx);
    }
    getLineAndColumnMessage() {
      const range = [this.startIdx, this.endIdx];
      return getLineAndColumnMessage(this.sourceString, this.startIdx, range);
    }
    // Returns an array of 0, 1, or 2 intervals that represents the result of the
    // interval difference operation.
    minus(that) {
      if (this.sourceString !== that.sourceString) {
        throw intervalSourcesDontMatch();
      } else if (this.startIdx === that.startIdx && this.endIdx === that.endIdx) {
        return [];
      } else if (this.startIdx < that.startIdx && that.endIdx < this.endIdx) {
        return [
          new _Interval(this.sourceString, this.startIdx, that.startIdx),
          new _Interval(this.sourceString, that.endIdx, this.endIdx)
        ];
      } else if (this.startIdx < that.endIdx && that.endIdx < this.endIdx) {
        return [new _Interval(this.sourceString, that.endIdx, this.endIdx)];
      } else if (this.startIdx < that.startIdx && that.startIdx < this.endIdx) {
        return [new _Interval(this.sourceString, this.startIdx, that.startIdx)];
      } else {
        return [this];
      }
    }
    // Returns a new Interval that has the same extent as this one, but which is relative
    // to `that`, an Interval that fully covers this one.
    relativeTo(that) {
      if (this.sourceString !== that.sourceString) {
        throw intervalSourcesDontMatch();
      }
      assert(
        this.startIdx >= that.startIdx && this.endIdx <= that.endIdx,
        "other interval does not cover this one"
      );
      return new _Interval(
        this.sourceString,
        this.startIdx - that.startIdx,
        this.endIdx - that.startIdx
      );
    }
    // Returns a new Interval which contains the same contents as this one,
    // but with whitespace trimmed from both ends.
    trimmed() {
      const { contents } = this;
      const startIdx = this.startIdx + contents.match(/^\s*/)[0].length;
      const endIdx = this.endIdx - contents.match(/\s*$/)[0].length;
      return new _Interval(this.sourceString, startIdx, endIdx);
    }
    subInterval(offset, len) {
      const newStartIdx = this.startIdx + offset;
      return new _Interval(this.sourceString, newStartIdx, newStartIdx + len);
    }
  };
  Interval.coverage = function(firstInterval, ...intervals) {
    let { startIdx, endIdx } = firstInterval;
    for (const interval of intervals) {
      if (interval.sourceString !== firstInterval.sourceString) {
        throw intervalSourcesDontMatch();
      } else {
        startIdx = Math.min(startIdx, interval.startIdx);
        endIdx = Math.max(endIdx, interval.endIdx);
      }
    }
    return new Interval(firstInterval.sourceString, startIdx, endIdx);
  };

  // node_modules/ohm-js/src/InputStream.js
  var MAX_CHAR_CODE = 65535;
  var MAX_CODE_POINT = 1114111;
  var InputStream = class {
    constructor(source) {
      this.source = source;
      this.pos = 0;
      this.examinedLength = 0;
    }
    atEnd() {
      const ans = this.pos >= this.source.length;
      this.examinedLength = Math.max(this.examinedLength, this.pos + 1);
      return ans;
    }
    next() {
      const ans = this.source[this.pos++];
      this.examinedLength = Math.max(this.examinedLength, this.pos);
      return ans;
    }
    nextCharCode() {
      const nextChar = this.next();
      return nextChar && nextChar.charCodeAt(0);
    }
    nextCodePoint() {
      const cp = this.source.slice(this.pos++).codePointAt(0);
      if (cp > MAX_CHAR_CODE) {
        this.pos += 1;
      }
      this.examinedLength = Math.max(this.examinedLength, this.pos);
      return cp;
    }
    matchString(s, optIgnoreCase) {
      let idx;
      if (optIgnoreCase) {
        for (idx = 0; idx < s.length; idx++) {
          const actual = this.next();
          const expected = s[idx];
          if (actual == null || actual.toUpperCase() !== expected.toUpperCase()) {
            return false;
          }
        }
        return true;
      }
      for (idx = 0; idx < s.length; idx++) {
        if (this.next() !== s[idx]) {
          return false;
        }
      }
      return true;
    }
    sourceSlice(startIdx, endIdx) {
      return this.source.slice(startIdx, endIdx);
    }
    interval(startIdx, optEndIdx) {
      return new Interval(this.source, startIdx, optEndIdx ? optEndIdx : this.pos);
    }
  };

  // node_modules/ohm-js/src/MatchResult.js
  var MatchResult = class {
    constructor(matcher, input, startExpr, cst, cstOffset, rightmostFailurePosition, optRecordedFailures) {
      this.matcher = matcher;
      this.input = input;
      this.startExpr = startExpr;
      this._cst = cst;
      this._cstOffset = cstOffset;
      this._rightmostFailurePosition = rightmostFailurePosition;
      this._rightmostFailures = optRecordedFailures;
      if (this.failed()) {
        defineLazyProperty(this, "message", function() {
          const detail = "Expected " + this.getExpectedText();
          return getLineAndColumnMessage(this.input, this.getRightmostFailurePosition()) + detail;
        });
        defineLazyProperty(this, "shortMessage", function() {
          const detail = "expected " + this.getExpectedText();
          const errorInfo = getLineAndColumn(
            this.input,
            this.getRightmostFailurePosition()
          );
          return "Line " + errorInfo.lineNum + ", col " + errorInfo.colNum + ": " + detail;
        });
      }
    }
    succeeded() {
      return !!this._cst;
    }
    failed() {
      return !this.succeeded();
    }
    getRightmostFailurePosition() {
      return this._rightmostFailurePosition;
    }
    getRightmostFailures() {
      if (!this._rightmostFailures) {
        this.matcher.setInput(this.input);
        const matchResultWithFailures = this.matcher._match(this.startExpr, {
          tracing: false,
          positionToRecordFailures: this.getRightmostFailurePosition()
        });
        this._rightmostFailures = matchResultWithFailures.getRightmostFailures();
      }
      return this._rightmostFailures;
    }
    toString() {
      return this.succeeded() ? "[match succeeded]" : "[match failed at position " + this.getRightmostFailurePosition() + "]";
    }
    // Return a string summarizing the expected contents of the input stream when
    // the match failure occurred.
    getExpectedText() {
      if (this.succeeded()) {
        throw new Error("cannot get expected text of a successful MatchResult");
      }
      const sb = new StringBuffer();
      let failures = this.getRightmostFailures();
      failures = failures.filter((failure) => !failure.isFluffy());
      for (let idx = 0; idx < failures.length; idx++) {
        if (idx > 0) {
          if (idx === failures.length - 1) {
            sb.append(failures.length > 2 ? ", or " : " or ");
          } else {
            sb.append(", ");
          }
        }
        sb.append(failures[idx].toString());
      }
      return sb.contents();
    }
    getInterval() {
      const pos = this.getRightmostFailurePosition();
      return new Interval(this.input, pos, pos);
    }
  };

  // node_modules/ohm-js/src/PosInfo.js
  var PosInfo = class {
    constructor() {
      this.applicationMemoKeyStack = [];
      this.memo = {};
      this.maxExaminedLength = 0;
      this.maxRightmostFailureOffset = -1;
      this.currentLeftRecursion = void 0;
    }
    isActive(application) {
      return this.applicationMemoKeyStack.indexOf(application.toMemoKey()) >= 0;
    }
    enter(application) {
      this.applicationMemoKeyStack.push(application.toMemoKey());
    }
    exit() {
      this.applicationMemoKeyStack.pop();
    }
    startLeftRecursion(headApplication, memoRec) {
      memoRec.isLeftRecursion = true;
      memoRec.headApplication = headApplication;
      memoRec.nextLeftRecursion = this.currentLeftRecursion;
      this.currentLeftRecursion = memoRec;
      const { applicationMemoKeyStack } = this;
      const indexOfFirstInvolvedRule = applicationMemoKeyStack.indexOf(headApplication.toMemoKey()) + 1;
      const involvedApplicationMemoKeys = applicationMemoKeyStack.slice(
        indexOfFirstInvolvedRule
      );
      memoRec.isInvolved = function(applicationMemoKey) {
        return involvedApplicationMemoKeys.indexOf(applicationMemoKey) >= 0;
      };
      memoRec.updateInvolvedApplicationMemoKeys = function() {
        for (let idx = indexOfFirstInvolvedRule; idx < applicationMemoKeyStack.length; idx++) {
          const applicationMemoKey = applicationMemoKeyStack[idx];
          if (!this.isInvolved(applicationMemoKey)) {
            involvedApplicationMemoKeys.push(applicationMemoKey);
          }
        }
      };
    }
    endLeftRecursion() {
      this.currentLeftRecursion = this.currentLeftRecursion.nextLeftRecursion;
    }
    // Note: this method doesn't get called for the "head" of a left recursion -- for LR heads,
    // the memoized result (which starts out being a failure) is always used.
    shouldUseMemoizedResult(memoRec) {
      if (!memoRec.isLeftRecursion) {
        return true;
      }
      const { applicationMemoKeyStack } = this;
      for (let idx = 0; idx < applicationMemoKeyStack.length; idx++) {
        const applicationMemoKey = applicationMemoKeyStack[idx];
        if (memoRec.isInvolved(applicationMemoKey)) {
          return false;
        }
      }
      return true;
    }
    memoize(memoKey, memoRec) {
      this.memo[memoKey] = memoRec;
      this.maxExaminedLength = Math.max(this.maxExaminedLength, memoRec.examinedLength);
      this.maxRightmostFailureOffset = Math.max(
        this.maxRightmostFailureOffset,
        memoRec.rightmostFailureOffset
      );
      return memoRec;
    }
    clearObsoleteEntries(pos, invalidatedIdx) {
      if (pos + this.maxExaminedLength <= invalidatedIdx) {
        return;
      }
      const { memo } = this;
      this.maxExaminedLength = 0;
      this.maxRightmostFailureOffset = -1;
      Object.keys(memo).forEach((k) => {
        const memoRec = memo[k];
        if (pos + memoRec.examinedLength > invalidatedIdx) {
          delete memo[k];
        } else {
          this.maxExaminedLength = Math.max(this.maxExaminedLength, memoRec.examinedLength);
          this.maxRightmostFailureOffset = Math.max(
            this.maxRightmostFailureOffset,
            memoRec.rightmostFailureOffset
          );
        }
      });
    }
  };

  // node_modules/ohm-js/src/Trace.js
  var BALLOT_X = "\u2717";
  var CHECK_MARK = "\u2713";
  var DOT_OPERATOR = "\u22C5";
  var RIGHTWARDS_DOUBLE_ARROW = "\u21D2";
  var SYMBOL_FOR_HORIZONTAL_TABULATION = "\u2409";
  var SYMBOL_FOR_LINE_FEED = "\u240A";
  var SYMBOL_FOR_CARRIAGE_RETURN = "\u240D";
  var Flags = {
    succeeded: 1 << 0,
    isRootNode: 1 << 1,
    isImplicitSpaces: 1 << 2,
    isMemoized: 1 << 3,
    isHeadOfLeftRecursion: 1 << 4,
    terminatesLR: 1 << 5
  };
  function spaces(n) {
    return repeat(" ", n).join("");
  }
  function getInputExcerpt(input, pos, len) {
    const excerpt = asEscapedString(input.slice(pos, pos + len));
    if (excerpt.length < len) {
      return excerpt + repeat(" ", len - excerpt.length).join("");
    }
    return excerpt;
  }
  function asEscapedString(obj) {
    if (typeof obj === "string") {
      return obj.replace(/ /g, DOT_OPERATOR).replace(/\t/g, SYMBOL_FOR_HORIZONTAL_TABULATION).replace(/\n/g, SYMBOL_FOR_LINE_FEED).replace(/\r/g, SYMBOL_FOR_CARRIAGE_RETURN);
    }
    return String(obj);
  }
  var Trace = class _Trace {
    constructor(input, pos1, pos2, expr, succeeded, bindings, optChildren) {
      this.input = input;
      this.pos = this.pos1 = pos1;
      this.pos2 = pos2;
      this.source = new Interval(input, pos1, pos2);
      this.expr = expr;
      this.bindings = bindings;
      this.children = optChildren || [];
      this.terminatingLREntry = null;
      this._flags = succeeded ? Flags.succeeded : 0;
    }
    get displayString() {
      return this.expr.toDisplayString();
    }
    clone() {
      return this.cloneWithExpr(this.expr);
    }
    cloneWithExpr(expr) {
      const ans = new _Trace(
        this.input,
        this.pos,
        this.pos2,
        expr,
        this.succeeded,
        this.bindings,
        this.children
      );
      ans.isHeadOfLeftRecursion = this.isHeadOfLeftRecursion;
      ans.isImplicitSpaces = this.isImplicitSpaces;
      ans.isMemoized = this.isMemoized;
      ans.isRootNode = this.isRootNode;
      ans.terminatesLR = this.terminatesLR;
      ans.terminatingLREntry = this.terminatingLREntry;
      return ans;
    }
    // Record the trace information for the terminating condition of the LR loop.
    recordLRTermination(ruleBodyTrace, value) {
      this.terminatingLREntry = new _Trace(
        this.input,
        this.pos,
        this.pos2,
        this.expr,
        false,
        [value],
        [ruleBodyTrace]
      );
      this.terminatingLREntry.terminatesLR = true;
    }
    // Recursively traverse this trace node and all its descendents, calling a visitor function
    // for each node that is visited. If `vistorObjOrFn` is an object, then its 'enter' property
    // is a function to call before visiting the children of a node, and its 'exit' property is
    // a function to call afterwards. If `visitorObjOrFn` is a function, it represents the 'enter'
    // function.
    //
    // The functions are called with three arguments: the Trace node, its parent Trace, and a number
    // representing the depth of the node in the tree. (The root node has depth 0.) `optThisArg`, if
    // specified, is the value to use for `this` when executing the visitor functions.
    walk(visitorObjOrFn, optThisArg) {
      let visitor = visitorObjOrFn;
      if (typeof visitor === "function") {
        visitor = { enter: visitor };
      }
      function _walk(node, parent, depth) {
        let recurse = true;
        if (visitor.enter) {
          if (visitor.enter.call(optThisArg, node, parent, depth) === _Trace.prototype.SKIP) {
            recurse = false;
          }
        }
        if (recurse) {
          node.children.forEach((child) => {
            _walk(child, node, depth + 1);
          });
          if (visitor.exit) {
            visitor.exit.call(optThisArg, node, parent, depth);
          }
        }
      }
      if (this.isRootNode) {
        this.children.forEach((c) => {
          _walk(c, null, 0);
        });
      } else {
        _walk(this, null, 0);
      }
    }
    // Return a string representation of the trace.
    // Sample:
    //     12⋅+⋅2⋅*⋅3 ✓ exp ⇒  "12"
    //     12⋅+⋅2⋅*⋅3   ✓ addExp (LR) ⇒  "12"
    //     12⋅+⋅2⋅*⋅3       ✗ addExp_plus
    toString() {
      const sb = new StringBuffer();
      this.walk((node, parent, depth) => {
        if (!node) {
          return this.SKIP;
        }
        const ctorName = node.expr.constructor.name;
        if (ctorName === "Alt") {
          return;
        }
        sb.append(getInputExcerpt(node.input, node.pos, 10) + spaces(depth * 2 + 1));
        sb.append((node.succeeded ? CHECK_MARK : BALLOT_X) + " " + node.displayString);
        if (node.isHeadOfLeftRecursion) {
          sb.append(" (LR)");
        }
        if (node.succeeded) {
          const contents = asEscapedString(node.source.contents);
          sb.append(" " + RIGHTWARDS_DOUBLE_ARROW + "  ");
          sb.append(typeof contents === "string" ? '"' + contents + '"' : contents);
        }
        sb.append("\n");
      });
      return sb.contents();
    }
  };
  Trace.prototype.SKIP = {};
  Object.keys(Flags).forEach((name) => {
    const mask = Flags[name];
    Object.defineProperty(Trace.prototype, name, {
      get() {
        return (this._flags & mask) !== 0;
      },
      set(val) {
        if (val) {
          this._flags |= mask;
        } else {
          this._flags &= ~mask;
        }
      }
    });
  });

  // node_modules/ohm-js/src/pexprs-allowsSkippingPrecedingSpace.js
  PExpr.prototype.allowsSkippingPrecedingSpace = abstract("allowsSkippingPrecedingSpace");
  any.allowsSkippingPrecedingSpace = end.allowsSkippingPrecedingSpace = Apply.prototype.allowsSkippingPrecedingSpace = Terminal.prototype.allowsSkippingPrecedingSpace = Range.prototype.allowsSkippingPrecedingSpace = UnicodeChar.prototype.allowsSkippingPrecedingSpace = function() {
    return true;
  };
  Alt.prototype.allowsSkippingPrecedingSpace = Iter.prototype.allowsSkippingPrecedingSpace = Lex.prototype.allowsSkippingPrecedingSpace = Lookahead.prototype.allowsSkippingPrecedingSpace = Not.prototype.allowsSkippingPrecedingSpace = Param.prototype.allowsSkippingPrecedingSpace = Seq.prototype.allowsSkippingPrecedingSpace = function() {
    return false;
  };

  // node_modules/ohm-js/src/pexprs-assertAllApplicationsAreValid.js
  var BuiltInRules;
  awaitBuiltInRules((g) => {
    BuiltInRules = g;
  });
  var lexifyCount;
  PExpr.prototype.assertAllApplicationsAreValid = function(ruleName, grammar2) {
    lexifyCount = 0;
    this._assertAllApplicationsAreValid(ruleName, grammar2);
  };
  PExpr.prototype._assertAllApplicationsAreValid = abstract(
    "_assertAllApplicationsAreValid"
  );
  any._assertAllApplicationsAreValid = end._assertAllApplicationsAreValid = Terminal.prototype._assertAllApplicationsAreValid = Range.prototype._assertAllApplicationsAreValid = Param.prototype._assertAllApplicationsAreValid = UnicodeChar.prototype._assertAllApplicationsAreValid = function(ruleName, grammar2) {
  };
  Lex.prototype._assertAllApplicationsAreValid = function(ruleName, grammar2) {
    lexifyCount++;
    this.expr._assertAllApplicationsAreValid(ruleName, grammar2);
    lexifyCount--;
  };
  Alt.prototype._assertAllApplicationsAreValid = function(ruleName, grammar2) {
    for (let idx = 0; idx < this.terms.length; idx++) {
      this.terms[idx]._assertAllApplicationsAreValid(ruleName, grammar2);
    }
  };
  Seq.prototype._assertAllApplicationsAreValid = function(ruleName, grammar2) {
    for (let idx = 0; idx < this.factors.length; idx++) {
      this.factors[idx]._assertAllApplicationsAreValid(ruleName, grammar2);
    }
  };
  Iter.prototype._assertAllApplicationsAreValid = Not.prototype._assertAllApplicationsAreValid = Lookahead.prototype._assertAllApplicationsAreValid = function(ruleName, grammar2) {
    this.expr._assertAllApplicationsAreValid(ruleName, grammar2);
  };
  Apply.prototype._assertAllApplicationsAreValid = function(ruleName, grammar2, skipSyntacticCheck = false) {
    const ruleInfo = grammar2.rules[this.ruleName];
    const isContextSyntactic = isSyntactic(ruleName) && lexifyCount === 0;
    if (!ruleInfo) {
      throw undeclaredRule(this.ruleName, grammar2.name, this.source);
    }
    if (!skipSyntacticCheck && isSyntactic(this.ruleName) && !isContextSyntactic) {
      throw applicationOfSyntacticRuleFromLexicalContext(this.ruleName, this);
    }
    const actual = this.args.length;
    const expected = ruleInfo.formals.length;
    if (actual !== expected) {
      throw wrongNumberOfArguments(this.ruleName, expected, actual, this.source);
    }
    const isBuiltInApplySyntactic = BuiltInRules && ruleInfo === BuiltInRules.rules.applySyntactic;
    const isBuiltInCaseInsensitive = BuiltInRules && ruleInfo === BuiltInRules.rules.caseInsensitive;
    if (isBuiltInCaseInsensitive) {
      if (!(this.args[0] instanceof Terminal)) {
        throw incorrectArgumentType('a Terminal (e.g. "abc")', this.args[0]);
      }
    }
    if (isBuiltInApplySyntactic) {
      const arg = this.args[0];
      if (!(arg instanceof Apply)) {
        throw incorrectArgumentType("a syntactic rule application", arg);
      }
      if (!isSyntactic(arg.ruleName)) {
        throw applySyntacticWithLexicalRuleApplication(arg);
      }
      if (isContextSyntactic) {
        throw unnecessaryExperimentalApplySyntactic(this);
      }
    }
    this.args.forEach((arg) => {
      arg._assertAllApplicationsAreValid(ruleName, grammar2, isBuiltInApplySyntactic);
      if (arg.getArity() !== 1) {
        throw invalidParameter(this.ruleName, arg);
      }
    });
  };

  // node_modules/ohm-js/src/pexprs-assertChoicesHaveUniformArity.js
  PExpr.prototype.assertChoicesHaveUniformArity = abstract(
    "assertChoicesHaveUniformArity"
  );
  any.assertChoicesHaveUniformArity = end.assertChoicesHaveUniformArity = Terminal.prototype.assertChoicesHaveUniformArity = Range.prototype.assertChoicesHaveUniformArity = Param.prototype.assertChoicesHaveUniformArity = Lex.prototype.assertChoicesHaveUniformArity = UnicodeChar.prototype.assertChoicesHaveUniformArity = function(ruleName) {
  };
  Alt.prototype.assertChoicesHaveUniformArity = function(ruleName) {
    if (this.terms.length === 0) {
      return;
    }
    const arity = this.terms[0].getArity();
    for (let idx = 0; idx < this.terms.length; idx++) {
      const term = this.terms[idx];
      term.assertChoicesHaveUniformArity();
      const otherArity = term.getArity();
      if (arity !== otherArity) {
        throw inconsistentArity(ruleName, arity, otherArity, term);
      }
    }
  };
  Extend.prototype.assertChoicesHaveUniformArity = function(ruleName) {
    const actualArity = this.terms[0].getArity();
    const expectedArity = this.terms[1].getArity();
    if (actualArity !== expectedArity) {
      throw inconsistentArity(ruleName, expectedArity, actualArity, this.terms[0]);
    }
  };
  Seq.prototype.assertChoicesHaveUniformArity = function(ruleName) {
    for (let idx = 0; idx < this.factors.length; idx++) {
      this.factors[idx].assertChoicesHaveUniformArity(ruleName);
    }
  };
  Iter.prototype.assertChoicesHaveUniformArity = function(ruleName) {
    this.expr.assertChoicesHaveUniformArity(ruleName);
  };
  Not.prototype.assertChoicesHaveUniformArity = function(ruleName) {
  };
  Lookahead.prototype.assertChoicesHaveUniformArity = function(ruleName) {
    this.expr.assertChoicesHaveUniformArity(ruleName);
  };
  Apply.prototype.assertChoicesHaveUniformArity = function(ruleName) {
  };

  // node_modules/ohm-js/src/pexprs-assertIteratedExprsAreNotNullable.js
  PExpr.prototype.assertIteratedExprsAreNotNullable = abstract(
    "assertIteratedExprsAreNotNullable"
  );
  any.assertIteratedExprsAreNotNullable = end.assertIteratedExprsAreNotNullable = Terminal.prototype.assertIteratedExprsAreNotNullable = Range.prototype.assertIteratedExprsAreNotNullable = Param.prototype.assertIteratedExprsAreNotNullable = UnicodeChar.prototype.assertIteratedExprsAreNotNullable = function(grammar2) {
  };
  Alt.prototype.assertIteratedExprsAreNotNullable = function(grammar2) {
    for (let idx = 0; idx < this.terms.length; idx++) {
      this.terms[idx].assertIteratedExprsAreNotNullable(grammar2);
    }
  };
  Seq.prototype.assertIteratedExprsAreNotNullable = function(grammar2) {
    for (let idx = 0; idx < this.factors.length; idx++) {
      this.factors[idx].assertIteratedExprsAreNotNullable(grammar2);
    }
  };
  Iter.prototype.assertIteratedExprsAreNotNullable = function(grammar2) {
    this.expr.assertIteratedExprsAreNotNullable(grammar2);
    if (this.expr.isNullable(grammar2)) {
      throw kleeneExprHasNullableOperand(this, []);
    }
  };
  Opt.prototype.assertIteratedExprsAreNotNullable = Not.prototype.assertIteratedExprsAreNotNullable = Lookahead.prototype.assertIteratedExprsAreNotNullable = Lex.prototype.assertIteratedExprsAreNotNullable = function(grammar2) {
    this.expr.assertIteratedExprsAreNotNullable(grammar2);
  };
  Apply.prototype.assertIteratedExprsAreNotNullable = function(grammar2) {
    this.args.forEach((arg) => {
      arg.assertIteratedExprsAreNotNullable(grammar2);
    });
  };

  // node_modules/ohm-js/src/nodes.js
  var Node = class {
    constructor(matchLength) {
      this.matchLength = matchLength;
    }
    get ctorName() {
      throw new Error("subclass responsibility");
    }
    numChildren() {
      return this.children ? this.children.length : 0;
    }
    childAt(idx) {
      if (this.children) {
        return this.children[idx];
      }
    }
    indexOfChild(arg) {
      return this.children.indexOf(arg);
    }
    hasChildren() {
      return this.numChildren() > 0;
    }
    hasNoChildren() {
      return !this.hasChildren();
    }
    onlyChild() {
      if (this.numChildren() !== 1) {
        throw new Error(
          "cannot get only child of a node of type " + this.ctorName + " (it has " + this.numChildren() + " children)"
        );
      } else {
        return this.firstChild();
      }
    }
    firstChild() {
      if (this.hasNoChildren()) {
        throw new Error(
          "cannot get first child of a " + this.ctorName + " node, which has no children"
        );
      } else {
        return this.childAt(0);
      }
    }
    lastChild() {
      if (this.hasNoChildren()) {
        throw new Error(
          "cannot get last child of a " + this.ctorName + " node, which has no children"
        );
      } else {
        return this.childAt(this.numChildren() - 1);
      }
    }
    childBefore(child) {
      const childIdx = this.indexOfChild(child);
      if (childIdx < 0) {
        throw new Error("Node.childBefore() called w/ an argument that is not a child");
      } else if (childIdx === 0) {
        throw new Error("cannot get child before first child");
      } else {
        return this.childAt(childIdx - 1);
      }
    }
    childAfter(child) {
      const childIdx = this.indexOfChild(child);
      if (childIdx < 0) {
        throw new Error("Node.childAfter() called w/ an argument that is not a child");
      } else if (childIdx === this.numChildren() - 1) {
        throw new Error("cannot get child after last child");
      } else {
        return this.childAt(childIdx + 1);
      }
    }
    isTerminal() {
      return false;
    }
    isNonterminal() {
      return false;
    }
    isIteration() {
      return false;
    }
    isOptional() {
      return false;
    }
  };
  var TerminalNode = class extends Node {
    get ctorName() {
      return "_terminal";
    }
    isTerminal() {
      return true;
    }
    get primitiveValue() {
      throw new Error("The `primitiveValue` property was removed in Ohm v17.");
    }
  };
  var NonterminalNode = class extends Node {
    constructor(ruleName, children, childOffsets, matchLength) {
      super(matchLength);
      this.ruleName = ruleName;
      this.children = children;
      this.childOffsets = childOffsets;
    }
    get ctorName() {
      return this.ruleName;
    }
    isNonterminal() {
      return true;
    }
    isLexical() {
      return isLexical(this.ctorName);
    }
    isSyntactic() {
      return isSyntactic(this.ctorName);
    }
  };
  var IterationNode = class extends Node {
    constructor(children, childOffsets, matchLength, isOptional) {
      super(matchLength);
      this.children = children;
      this.childOffsets = childOffsets;
      this.optional = isOptional;
    }
    get ctorName() {
      return "_iter";
    }
    isIteration() {
      return true;
    }
    isOptional() {
      return this.optional;
    }
  };

  // node_modules/ohm-js/src/pexprs-eval.js
  PExpr.prototype.eval = abstract("eval");
  any.eval = function(state) {
    const { inputStream } = state;
    const origPos = inputStream.pos;
    const cp = inputStream.nextCodePoint();
    if (cp !== void 0) {
      state.pushBinding(new TerminalNode(String.fromCodePoint(cp).length), origPos);
      return true;
    } else {
      state.processFailure(origPos, this);
      return false;
    }
  };
  end.eval = function(state) {
    const { inputStream } = state;
    const origPos = inputStream.pos;
    if (inputStream.atEnd()) {
      state.pushBinding(new TerminalNode(0), origPos);
      return true;
    } else {
      state.processFailure(origPos, this);
      return false;
    }
  };
  Terminal.prototype.eval = function(state) {
    const { inputStream } = state;
    const origPos = inputStream.pos;
    if (!inputStream.matchString(this.obj)) {
      state.processFailure(origPos, this);
      return false;
    } else {
      state.pushBinding(new TerminalNode(this.obj.length), origPos);
      return true;
    }
  };
  Range.prototype.eval = function(state) {
    const { inputStream } = state;
    const origPos = inputStream.pos;
    const cp = this.matchCodePoint ? inputStream.nextCodePoint() : inputStream.nextCharCode();
    if (cp !== void 0 && this.from.codePointAt(0) <= cp && cp <= this.to.codePointAt(0)) {
      state.pushBinding(new TerminalNode(String.fromCodePoint(cp).length), origPos);
      return true;
    } else {
      state.processFailure(origPos, this);
      return false;
    }
  };
  Param.prototype.eval = function(state) {
    return state.eval(state.currentApplication().args[this.index]);
  };
  Lex.prototype.eval = function(state) {
    state.enterLexifiedContext();
    const ans = state.eval(this.expr);
    state.exitLexifiedContext();
    return ans;
  };
  Alt.prototype.eval = function(state) {
    for (let idx = 0; idx < this.terms.length; idx++) {
      if (state.eval(this.terms[idx])) {
        return true;
      }
    }
    return false;
  };
  Seq.prototype.eval = function(state) {
    for (let idx = 0; idx < this.factors.length; idx++) {
      const factor = this.factors[idx];
      if (!state.eval(factor)) {
        return false;
      }
    }
    return true;
  };
  Iter.prototype.eval = function(state) {
    const { inputStream } = state;
    const origPos = inputStream.pos;
    const arity = this.getArity();
    const cols = [];
    const colOffsets = [];
    while (cols.length < arity) {
      cols.push([]);
      colOffsets.push([]);
    }
    let numMatches = 0;
    let prevPos = origPos;
    let idx;
    while (numMatches < this.maxNumMatches && state.eval(this.expr)) {
      if (inputStream.pos === prevPos) {
        throw kleeneExprHasNullableOperand(this, state._applicationStack);
      }
      prevPos = inputStream.pos;
      numMatches++;
      const row = state._bindings.splice(state._bindings.length - arity, arity);
      const rowOffsets = state._bindingOffsets.splice(
        state._bindingOffsets.length - arity,
        arity
      );
      for (idx = 0; idx < row.length; idx++) {
        cols[idx].push(row[idx]);
        colOffsets[idx].push(rowOffsets[idx]);
      }
    }
    if (numMatches < this.minNumMatches) {
      return false;
    }
    let offset = state.posToOffset(origPos);
    let matchLength = 0;
    if (numMatches > 0) {
      const lastCol = cols[arity - 1];
      const lastColOffsets = colOffsets[arity - 1];
      const endOffset = lastColOffsets[lastColOffsets.length - 1] + lastCol[lastCol.length - 1].matchLength;
      offset = colOffsets[0][0];
      matchLength = endOffset - offset;
    }
    const isOptional = this instanceof Opt;
    for (idx = 0; idx < cols.length; idx++) {
      state._bindings.push(
        new IterationNode(cols[idx], colOffsets[idx], matchLength, isOptional)
      );
      state._bindingOffsets.push(offset);
    }
    return true;
  };
  Not.prototype.eval = function(state) {
    const { inputStream } = state;
    const origPos = inputStream.pos;
    state.pushFailuresInfo();
    const ans = state.eval(this.expr);
    state.popFailuresInfo();
    if (ans) {
      state.processFailure(origPos, this);
      return false;
    }
    inputStream.pos = origPos;
    return true;
  };
  Lookahead.prototype.eval = function(state) {
    const { inputStream } = state;
    const origPos = inputStream.pos;
    if (state.eval(this.expr)) {
      inputStream.pos = origPos;
      return true;
    } else {
      return false;
    }
  };
  Apply.prototype.eval = function(state) {
    const caller = state.currentApplication();
    const actuals = caller ? caller.args : [];
    const app = this.substituteParams(actuals);
    const posInfo = state.getCurrentPosInfo();
    if (posInfo.isActive(app)) {
      return app.handleCycle(state);
    }
    const memoKey = app.toMemoKey();
    const memoRec = posInfo.memo[memoKey];
    if (memoRec && posInfo.shouldUseMemoizedResult(memoRec)) {
      if (state.hasNecessaryInfo(memoRec)) {
        return state.useMemoizedResult(state.inputStream.pos, memoRec);
      }
      delete posInfo.memo[memoKey];
    }
    return app.reallyEval(state);
  };
  Apply.prototype.handleCycle = function(state) {
    const posInfo = state.getCurrentPosInfo();
    const { currentLeftRecursion } = posInfo;
    const memoKey = this.toMemoKey();
    let memoRec = posInfo.memo[memoKey];
    if (currentLeftRecursion && currentLeftRecursion.headApplication.toMemoKey() === memoKey) {
      memoRec.updateInvolvedApplicationMemoKeys();
    } else if (!memoRec) {
      memoRec = posInfo.memoize(memoKey, {
        matchLength: 0,
        examinedLength: 0,
        value: false,
        rightmostFailureOffset: -1
      });
      posInfo.startLeftRecursion(this, memoRec);
    }
    return state.useMemoizedResult(state.inputStream.pos, memoRec);
  };
  Apply.prototype.reallyEval = function(state) {
    const { inputStream } = state;
    const origPos = inputStream.pos;
    const origPosInfo = state.getCurrentPosInfo();
    const ruleInfo = state.grammar.rules[this.ruleName];
    const { body } = ruleInfo;
    const { description } = ruleInfo;
    state.enterApplication(origPosInfo, this);
    if (description) {
      state.pushFailuresInfo();
    }
    const origInputStreamExaminedLength = inputStream.examinedLength;
    inputStream.examinedLength = 0;
    let value = this.evalOnce(body, state);
    const currentLR = origPosInfo.currentLeftRecursion;
    const memoKey = this.toMemoKey();
    const isHeadOfLeftRecursion = currentLR && currentLR.headApplication.toMemoKey() === memoKey;
    let memoRec;
    if (state.doNotMemoize) {
      state.doNotMemoize = false;
    } else if (isHeadOfLeftRecursion) {
      value = this.growSeedResult(body, state, origPos, currentLR, value);
      origPosInfo.endLeftRecursion();
      memoRec = currentLR;
      memoRec.examinedLength = inputStream.examinedLength - origPos;
      memoRec.rightmostFailureOffset = state._getRightmostFailureOffset();
      origPosInfo.memoize(memoKey, memoRec);
    } else if (!currentLR || !currentLR.isInvolved(memoKey)) {
      memoRec = origPosInfo.memoize(memoKey, {
        matchLength: inputStream.pos - origPos,
        examinedLength: inputStream.examinedLength - origPos,
        value,
        failuresAtRightmostPosition: state.cloneRecordedFailures(),
        rightmostFailureOffset: state._getRightmostFailureOffset()
      });
    }
    const succeeded = !!value;
    if (description) {
      state.popFailuresInfo();
      if (!succeeded) {
        state.processFailure(origPos, this);
      }
      if (memoRec) {
        memoRec.failuresAtRightmostPosition = state.cloneRecordedFailures();
        memoRec.rightmostFailureOffset = state._getRightmostFailureOffset();
      }
    }
    if (state.isTracing() && memoRec) {
      const entry = state.getTraceEntry(origPos, this, succeeded, succeeded ? [value] : []);
      if (isHeadOfLeftRecursion) {
        assert(entry.terminatingLREntry != null || !succeeded);
        entry.isHeadOfLeftRecursion = true;
      }
      memoRec.traceEntry = entry;
    }
    inputStream.examinedLength = Math.max(
      inputStream.examinedLength,
      origInputStreamExaminedLength
    );
    state.exitApplication(origPosInfo, value);
    return succeeded;
  };
  Apply.prototype.evalOnce = function(expr, state) {
    const { inputStream } = state;
    const origPos = inputStream.pos;
    if (state.eval(expr)) {
      const arity = expr.getArity();
      const bindings = state._bindings.splice(state._bindings.length - arity, arity);
      const offsets = state._bindingOffsets.splice(state._bindingOffsets.length - arity, arity);
      const matchLength = inputStream.pos - origPos;
      return new NonterminalNode(this.ruleName, bindings, offsets, matchLength);
    } else {
      return false;
    }
  };
  Apply.prototype.growSeedResult = function(body, state, origPos, lrMemoRec, newValue) {
    if (!newValue) {
      return false;
    }
    const { inputStream } = state;
    while (true) {
      lrMemoRec.matchLength = inputStream.pos - origPos;
      lrMemoRec.value = newValue;
      lrMemoRec.failuresAtRightmostPosition = state.cloneRecordedFailures();
      if (state.isTracing()) {
        const seedTrace = state.trace[state.trace.length - 1];
        lrMemoRec.traceEntry = new Trace(
          state.input,
          origPos,
          inputStream.pos,
          this,
          true,
          [newValue],
          [seedTrace.clone()]
        );
      }
      inputStream.pos = origPos;
      newValue = this.evalOnce(body, state);
      if (inputStream.pos - origPos <= lrMemoRec.matchLength) {
        break;
      }
      if (state.isTracing()) {
        state.trace.splice(-2, 1);
      }
    }
    if (state.isTracing()) {
      lrMemoRec.traceEntry.recordLRTermination(state.trace.pop(), newValue);
    }
    inputStream.pos = origPos + lrMemoRec.matchLength;
    return lrMemoRec.value;
  };
  UnicodeChar.prototype.eval = function(state) {
    const { inputStream } = state;
    const origPos = inputStream.pos;
    const cp = inputStream.nextCodePoint();
    if (cp !== void 0 && cp <= MAX_CODE_POINT) {
      const ch = String.fromCodePoint(cp);
      if (this.pattern.test(ch)) {
        state.pushBinding(new TerminalNode(ch.length), origPos);
        return true;
      }
    }
    state.processFailure(origPos, this);
    return false;
  };

  // node_modules/ohm-js/src/pexprs-getArity.js
  PExpr.prototype.getArity = abstract("getArity");
  any.getArity = end.getArity = Terminal.prototype.getArity = Range.prototype.getArity = Param.prototype.getArity = Apply.prototype.getArity = UnicodeChar.prototype.getArity = function() {
    return 1;
  };
  Alt.prototype.getArity = function() {
    return this.terms.length === 0 ? 0 : this.terms[0].getArity();
  };
  Seq.prototype.getArity = function() {
    let arity = 0;
    for (let idx = 0; idx < this.factors.length; idx++) {
      arity += this.factors[idx].getArity();
    }
    return arity;
  };
  Iter.prototype.getArity = function() {
    return this.expr.getArity();
  };
  Not.prototype.getArity = function() {
    return 0;
  };
  Lookahead.prototype.getArity = Lex.prototype.getArity = function() {
    return this.expr.getArity();
  };

  // node_modules/ohm-js/src/pexprs-outputRecipe.js
  function getMetaInfo(expr, grammarInterval) {
    const metaInfo = {};
    if (expr.source && grammarInterval) {
      const adjusted = expr.source.relativeTo(grammarInterval);
      metaInfo.sourceInterval = [adjusted.startIdx, adjusted.endIdx];
    }
    return metaInfo;
  }
  PExpr.prototype.outputRecipe = abstract("outputRecipe");
  any.outputRecipe = function(formals, grammarInterval) {
    return ["any", getMetaInfo(this, grammarInterval)];
  };
  end.outputRecipe = function(formals, grammarInterval) {
    return ["end", getMetaInfo(this, grammarInterval)];
  };
  Terminal.prototype.outputRecipe = function(formals, grammarInterval) {
    return ["terminal", getMetaInfo(this, grammarInterval), this.obj];
  };
  Range.prototype.outputRecipe = function(formals, grammarInterval) {
    return ["range", getMetaInfo(this, grammarInterval), this.from, this.to];
  };
  Param.prototype.outputRecipe = function(formals, grammarInterval) {
    return ["param", getMetaInfo(this, grammarInterval), this.index];
  };
  Alt.prototype.outputRecipe = function(formals, grammarInterval) {
    return ["alt", getMetaInfo(this, grammarInterval)].concat(
      this.terms.map((term) => term.outputRecipe(formals, grammarInterval))
    );
  };
  Extend.prototype.outputRecipe = function(formals, grammarInterval) {
    const extension = this.terms[0];
    return extension.outputRecipe(formals, grammarInterval);
  };
  Splice.prototype.outputRecipe = function(formals, grammarInterval) {
    const beforeTerms = this.terms.slice(0, this.expansionPos);
    const afterTerms = this.terms.slice(this.expansionPos + 1);
    return [
      "splice",
      getMetaInfo(this, grammarInterval),
      beforeTerms.map((term) => term.outputRecipe(formals, grammarInterval)),
      afterTerms.map((term) => term.outputRecipe(formals, grammarInterval))
    ];
  };
  Seq.prototype.outputRecipe = function(formals, grammarInterval) {
    return ["seq", getMetaInfo(this, grammarInterval)].concat(
      this.factors.map((factor) => factor.outputRecipe(formals, grammarInterval))
    );
  };
  Star.prototype.outputRecipe = Plus.prototype.outputRecipe = Opt.prototype.outputRecipe = Not.prototype.outputRecipe = Lookahead.prototype.outputRecipe = Lex.prototype.outputRecipe = function(formals, grammarInterval) {
    return [
      this.constructor.name.toLowerCase(),
      getMetaInfo(this, grammarInterval),
      this.expr.outputRecipe(formals, grammarInterval)
    ];
  };
  Apply.prototype.outputRecipe = function(formals, grammarInterval) {
    return [
      "app",
      getMetaInfo(this, grammarInterval),
      this.ruleName,
      this.args.map((arg) => arg.outputRecipe(formals, grammarInterval))
    ];
  };
  UnicodeChar.prototype.outputRecipe = function(formals, grammarInterval) {
    return ["unicodeChar", getMetaInfo(this, grammarInterval), this.categoryOrProp];
  };

  // node_modules/ohm-js/src/pexprs-introduceParams.js
  PExpr.prototype.introduceParams = abstract("introduceParams");
  any.introduceParams = end.introduceParams = Terminal.prototype.introduceParams = Range.prototype.introduceParams = Param.prototype.introduceParams = UnicodeChar.prototype.introduceParams = function(formals) {
    return this;
  };
  Alt.prototype.introduceParams = function(formals) {
    this.terms.forEach((term, idx, terms) => {
      terms[idx] = term.introduceParams(formals);
    });
    return this;
  };
  Seq.prototype.introduceParams = function(formals) {
    this.factors.forEach((factor, idx, factors) => {
      factors[idx] = factor.introduceParams(formals);
    });
    return this;
  };
  Iter.prototype.introduceParams = Not.prototype.introduceParams = Lookahead.prototype.introduceParams = Lex.prototype.introduceParams = function(formals) {
    this.expr = this.expr.introduceParams(formals);
    return this;
  };
  Apply.prototype.introduceParams = function(formals) {
    const index = formals.indexOf(this.ruleName);
    if (index >= 0) {
      if (this.args.length > 0) {
        throw new Error("Parameterized rules cannot be passed as arguments to another rule.");
      }
      return new Param(index).withSource(this.source);
    } else {
      this.args.forEach((arg, idx, args) => {
        args[idx] = arg.introduceParams(formals);
      });
      return this;
    }
  };

  // node_modules/ohm-js/src/pexprs-isNullable.js
  PExpr.prototype.isNullable = function(grammar2) {
    return this._isNullable(grammar2, /* @__PURE__ */ Object.create(null));
  };
  PExpr.prototype._isNullable = abstract("_isNullable");
  any._isNullable = Range.prototype._isNullable = Param.prototype._isNullable = Plus.prototype._isNullable = UnicodeChar.prototype._isNullable = function(grammar2, memo) {
    return false;
  };
  end._isNullable = function(grammar2, memo) {
    return true;
  };
  Terminal.prototype._isNullable = function(grammar2, memo) {
    if (typeof this.obj === "string") {
      return this.obj === "";
    } else {
      return false;
    }
  };
  Alt.prototype._isNullable = function(grammar2, memo) {
    return this.terms.length === 0 || this.terms.some((term) => term._isNullable(grammar2, memo));
  };
  Seq.prototype._isNullable = function(grammar2, memo) {
    return this.factors.every((factor) => factor._isNullable(grammar2, memo));
  };
  Star.prototype._isNullable = Opt.prototype._isNullable = Not.prototype._isNullable = Lookahead.prototype._isNullable = function(grammar2, memo) {
    return true;
  };
  Lex.prototype._isNullable = function(grammar2, memo) {
    return this.expr._isNullable(grammar2, memo);
  };
  Apply.prototype._isNullable = function(grammar2, memo) {
    const key = this.toMemoKey();
    if (!Object.prototype.hasOwnProperty.call(memo, key)) {
      const { body } = grammar2.rules[this.ruleName];
      const inlined = body.substituteParams(this.args);
      memo[key] = false;
      memo[key] = inlined._isNullable(grammar2, memo);
    }
    return memo[key];
  };

  // node_modules/ohm-js/src/pexprs-substituteParams.js
  PExpr.prototype.substituteParams = abstract("substituteParams");
  any.substituteParams = end.substituteParams = Terminal.prototype.substituteParams = Range.prototype.substituteParams = UnicodeChar.prototype.substituteParams = function(actuals) {
    return this;
  };
  Param.prototype.substituteParams = function(actuals) {
    return checkNotNull(actuals[this.index]);
  };
  Alt.prototype.substituteParams = function(actuals) {
    return new Alt(this.terms.map((term) => term.substituteParams(actuals)));
  };
  Seq.prototype.substituteParams = function(actuals) {
    return new Seq(this.factors.map((factor) => factor.substituteParams(actuals)));
  };
  Iter.prototype.substituteParams = Not.prototype.substituteParams = Lookahead.prototype.substituteParams = Lex.prototype.substituteParams = function(actuals) {
    return new this.constructor(this.expr.substituteParams(actuals));
  };
  Apply.prototype.substituteParams = function(actuals) {
    if (this.args.length === 0) {
      return this;
    } else {
      const args = this.args.map((arg) => arg.substituteParams(actuals));
      return new Apply(this.ruleName, args);
    }
  };

  // node_modules/ohm-js/src/pexprs-toArgumentNameList.js
  function isRestrictedJSIdentifier(str) {
    return /^[a-zA-Z_$][0-9a-zA-Z_$]*$/.test(str);
  }
  function resolveDuplicatedNames(argumentNameList) {
    const count = /* @__PURE__ */ Object.create(null);
    argumentNameList.forEach((argName) => {
      count[argName] = (count[argName] || 0) + 1;
    });
    Object.keys(count).forEach((dupArgName) => {
      if (count[dupArgName] <= 1) {
        return;
      }
      let subscript = 1;
      argumentNameList.forEach((argName, idx) => {
        if (argName === dupArgName) {
          argumentNameList[idx] = argName + "_" + subscript++;
        }
      });
    });
  }
  PExpr.prototype.toArgumentNameList = abstract("toArgumentNameList");
  any.toArgumentNameList = function(firstArgIndex, noDupCheck) {
    return ["any"];
  };
  end.toArgumentNameList = function(firstArgIndex, noDupCheck) {
    return ["end"];
  };
  Terminal.prototype.toArgumentNameList = function(firstArgIndex, noDupCheck) {
    if (typeof this.obj === "string" && /^[_a-zA-Z0-9]+$/.test(this.obj)) {
      return ["_" + this.obj];
    } else {
      return ["$" + firstArgIndex];
    }
  };
  Range.prototype.toArgumentNameList = function(firstArgIndex, noDupCheck) {
    let argName = this.from + "_to_" + this.to;
    if (!isRestrictedJSIdentifier(argName)) {
      argName = "_" + argName;
    }
    if (!isRestrictedJSIdentifier(argName)) {
      argName = "$" + firstArgIndex;
    }
    return [argName];
  };
  Alt.prototype.toArgumentNameList = function(firstArgIndex, noDupCheck) {
    const termArgNameLists = this.terms.map(
      (term) => term.toArgumentNameList(firstArgIndex, true)
    );
    const argumentNameList = [];
    const numArgs = termArgNameLists[0].length;
    for (let colIdx = 0; colIdx < numArgs; colIdx++) {
      const col = [];
      for (let rowIdx = 0; rowIdx < this.terms.length; rowIdx++) {
        col.push(termArgNameLists[rowIdx][colIdx]);
      }
      const uniqueNames = copyWithoutDuplicates(col);
      argumentNameList.push(uniqueNames.join("_or_"));
    }
    if (!noDupCheck) {
      resolveDuplicatedNames(argumentNameList);
    }
    return argumentNameList;
  };
  Seq.prototype.toArgumentNameList = function(firstArgIndex, noDupCheck) {
    let argumentNameList = [];
    this.factors.forEach((factor) => {
      const factorArgumentNameList = factor.toArgumentNameList(firstArgIndex, true);
      argumentNameList = argumentNameList.concat(factorArgumentNameList);
      firstArgIndex += factorArgumentNameList.length;
    });
    if (!noDupCheck) {
      resolveDuplicatedNames(argumentNameList);
    }
    return argumentNameList;
  };
  Iter.prototype.toArgumentNameList = function(firstArgIndex, noDupCheck) {
    const argumentNameList = this.expr.toArgumentNameList(firstArgIndex, noDupCheck).map(
      (exprArgumentString) => exprArgumentString[exprArgumentString.length - 1] === "s" ? exprArgumentString + "es" : exprArgumentString + "s"
    );
    if (!noDupCheck) {
      resolveDuplicatedNames(argumentNameList);
    }
    return argumentNameList;
  };
  Opt.prototype.toArgumentNameList = function(firstArgIndex, noDupCheck) {
    return this.expr.toArgumentNameList(firstArgIndex, noDupCheck).map((argName) => {
      return "opt" + argName[0].toUpperCase() + argName.slice(1);
    });
  };
  Not.prototype.toArgumentNameList = function(firstArgIndex, noDupCheck) {
    return [];
  };
  Lookahead.prototype.toArgumentNameList = Lex.prototype.toArgumentNameList = function(firstArgIndex, noDupCheck) {
    return this.expr.toArgumentNameList(firstArgIndex, noDupCheck);
  };
  Apply.prototype.toArgumentNameList = function(firstArgIndex, noDupCheck) {
    return [this.ruleName];
  };
  UnicodeChar.prototype.toArgumentNameList = function(firstArgIndex, noDupCheck) {
    return ["$" + firstArgIndex];
  };
  Param.prototype.toArgumentNameList = function(firstArgIndex, noDupCheck) {
    return ["param" + this.index];
  };

  // node_modules/ohm-js/src/pexprs-toDisplayString.js
  PExpr.prototype.toDisplayString = abstract("toDisplayString");
  Alt.prototype.toDisplayString = Seq.prototype.toDisplayString = function() {
    if (this.source) {
      return this.source.trimmed().contents;
    }
    return "[" + this.constructor.name + "]";
  };
  any.toDisplayString = end.toDisplayString = Iter.prototype.toDisplayString = Not.prototype.toDisplayString = Lookahead.prototype.toDisplayString = Lex.prototype.toDisplayString = Terminal.prototype.toDisplayString = Range.prototype.toDisplayString = Param.prototype.toDisplayString = function() {
    return this.toString();
  };
  Apply.prototype.toDisplayString = function() {
    if (this.args.length > 0) {
      const ps = this.args.map((arg) => arg.toDisplayString());
      return this.ruleName + "<" + ps.join(",") + ">";
    } else {
      return this.ruleName;
    }
  };
  UnicodeChar.prototype.toDisplayString = function() {
    return "Unicode [" + this.categoryOrProp + "] character";
  };

  // node_modules/ohm-js/src/Failure.js
  function isValidType(type) {
    return type === "description" || type === "string" || type === "code";
  }
  var Failure = class _Failure {
    constructor(pexpr, text, type) {
      if (!isValidType(type)) {
        throw new Error("invalid Failure type: " + type);
      }
      this.pexpr = pexpr;
      this.text = text;
      this.type = type;
      this.fluffy = false;
    }
    getPExpr() {
      return this.pexpr;
    }
    getText() {
      return this.text;
    }
    getType() {
      return this.type;
    }
    isDescription() {
      return this.type === "description";
    }
    isStringTerminal() {
      return this.type === "string";
    }
    isCode() {
      return this.type === "code";
    }
    isFluffy() {
      return this.fluffy;
    }
    makeFluffy() {
      this.fluffy = true;
    }
    clearFluffy() {
      this.fluffy = false;
    }
    subsumes(that) {
      return this.getText() === that.getText() && this.type === that.type && (!this.isFluffy() || this.isFluffy() && that.isFluffy());
    }
    toString() {
      return this.type === "string" ? JSON.stringify(this.getText()) : this.getText();
    }
    clone() {
      const failure = new _Failure(this.pexpr, this.text, this.type);
      if (this.isFluffy()) {
        failure.makeFluffy();
      }
      return failure;
    }
    toKey() {
      return this.toString() + "#" + this.type;
    }
  };

  // node_modules/ohm-js/src/pexprs-toFailure.js
  PExpr.prototype.toFailure = abstract("toFailure");
  any.toFailure = function(grammar2) {
    return new Failure(this, "any object", "description");
  };
  end.toFailure = function(grammar2) {
    return new Failure(this, "end of input", "description");
  };
  Terminal.prototype.toFailure = function(grammar2) {
    return new Failure(this, this.obj, "string");
  };
  Range.prototype.toFailure = function(grammar2) {
    return new Failure(this, JSON.stringify(this.from) + ".." + JSON.stringify(this.to), "code");
  };
  Not.prototype.toFailure = function(grammar2) {
    const description = this.expr === any ? "nothing" : "not " + this.expr.toFailure(grammar2);
    return new Failure(this, description, "description");
  };
  Lookahead.prototype.toFailure = function(grammar2) {
    return this.expr.toFailure(grammar2);
  };
  Apply.prototype.toFailure = function(grammar2) {
    let { description } = grammar2.rules[this.ruleName];
    if (!description) {
      const article = /^[aeiouAEIOU]/.test(this.ruleName) ? "an" : "a";
      description = article + " " + this.ruleName;
    }
    return new Failure(this, description, "description");
  };
  UnicodeChar.prototype.toFailure = function(grammar2) {
    return new Failure(this, "a Unicode [" + this.categoryOrProp + "] character", "description");
  };
  Alt.prototype.toFailure = function(grammar2) {
    const fs = this.terms.map((t) => t.toFailure(grammar2));
    const description = "(" + fs.join(" or ") + ")";
    return new Failure(this, description, "description");
  };
  Seq.prototype.toFailure = function(grammar2) {
    const fs = this.factors.map((f) => f.toFailure(grammar2));
    const description = "(" + fs.join(" ") + ")";
    return new Failure(this, description, "description");
  };
  Iter.prototype.toFailure = function(grammar2) {
    const description = "(" + this.expr.toFailure(grammar2) + this.operator + ")";
    return new Failure(this, description, "description");
  };

  // node_modules/ohm-js/src/pexprs-toString.js
  PExpr.prototype.toString = abstract("toString");
  any.toString = function() {
    return "any";
  };
  end.toString = function() {
    return "end";
  };
  Terminal.prototype.toString = function() {
    return JSON.stringify(this.obj);
  };
  Range.prototype.toString = function() {
    return JSON.stringify(this.from) + ".." + JSON.stringify(this.to);
  };
  Param.prototype.toString = function() {
    return "$" + this.index;
  };
  Lex.prototype.toString = function() {
    return "#(" + this.expr.toString() + ")";
  };
  Alt.prototype.toString = function() {
    return this.terms.length === 1 ? this.terms[0].toString() : "(" + this.terms.map((term) => term.toString()).join(" | ") + ")";
  };
  Seq.prototype.toString = function() {
    return this.factors.length === 1 ? this.factors[0].toString() : "(" + this.factors.map((factor) => factor.toString()).join(" ") + ")";
  };
  Iter.prototype.toString = function() {
    return this.expr + this.operator;
  };
  Not.prototype.toString = function() {
    return "~" + this.expr;
  };
  Lookahead.prototype.toString = function() {
    return "&" + this.expr;
  };
  Apply.prototype.toString = function() {
    if (this.args.length > 0) {
      const ps = this.args.map((arg) => arg.toString());
      return this.ruleName + "<" + ps.join(",") + ">";
    } else {
      return this.ruleName;
    }
  };
  UnicodeChar.prototype.toString = function() {
    return "\\p{" + this.categoryOrProp + "}";
  };

  // node_modules/ohm-js/src/CaseInsensitiveTerminal.js
  var CaseInsensitiveTerminal = class _CaseInsensitiveTerminal extends PExpr {
    constructor(param) {
      super();
      this.obj = param;
    }
    _getString(state) {
      const terminal = state.currentApplication().args[this.obj.index];
      assert(terminal instanceof Terminal, "expected a Terminal expression");
      return terminal.obj;
    }
    // Implementation of the PExpr API
    allowsSkippingPrecedingSpace() {
      return true;
    }
    eval(state) {
      const { inputStream } = state;
      const origPos = inputStream.pos;
      const matchStr = this._getString(state);
      if (!inputStream.matchString(matchStr, true)) {
        state.processFailure(origPos, this);
        return false;
      } else {
        state.pushBinding(new TerminalNode(matchStr.length), origPos);
        return true;
      }
    }
    getArity() {
      return 1;
    }
    substituteParams(actuals) {
      return new _CaseInsensitiveTerminal(this.obj.substituteParams(actuals));
    }
    toDisplayString() {
      return this.obj.toDisplayString() + " (case-insensitive)";
    }
    toFailure(grammar2) {
      return new Failure(
        this,
        this.obj.toFailure(grammar2) + " (case-insensitive)",
        "description"
      );
    }
    _isNullable(grammar2, memo) {
      return this.obj._isNullable(grammar2, memo);
    }
  };

  // node_modules/ohm-js/src/MatchState.js
  var builtInApplySyntacticBody;
  awaitBuiltInRules((builtInRules) => {
    builtInApplySyntacticBody = builtInRules.rules.applySyntactic.body;
  });
  var applySpaces = new Apply("spaces");
  var MatchState = class {
    constructor(matcher, startExpr, optPositionToRecordFailures) {
      this.matcher = matcher;
      this.startExpr = startExpr;
      this.grammar = matcher.grammar;
      this.input = matcher.getInput();
      this.inputStream = new InputStream(this.input);
      this.memoTable = matcher._memoTable;
      this.userData = void 0;
      this.doNotMemoize = false;
      this._bindings = [];
      this._bindingOffsets = [];
      this._applicationStack = [];
      this._posStack = [0];
      this.inLexifiedContextStack = [false];
      this.rightmostFailurePosition = -1;
      this._rightmostFailurePositionStack = [];
      this._recordedFailuresStack = [];
      if (optPositionToRecordFailures !== void 0) {
        this.positionToRecordFailures = optPositionToRecordFailures;
        this.recordedFailures = /* @__PURE__ */ Object.create(null);
      }
    }
    posToOffset(pos) {
      return pos - this._posStack[this._posStack.length - 1];
    }
    enterApplication(posInfo, app) {
      this._posStack.push(this.inputStream.pos);
      this._applicationStack.push(app);
      this.inLexifiedContextStack.push(false);
      posInfo.enter(app);
      this._rightmostFailurePositionStack.push(this.rightmostFailurePosition);
      this.rightmostFailurePosition = -1;
    }
    exitApplication(posInfo, optNode) {
      const origPos = this._posStack.pop();
      this._applicationStack.pop();
      this.inLexifiedContextStack.pop();
      posInfo.exit();
      this.rightmostFailurePosition = Math.max(
        this.rightmostFailurePosition,
        this._rightmostFailurePositionStack.pop()
      );
      if (optNode) {
        this.pushBinding(optNode, origPos);
      }
    }
    enterLexifiedContext() {
      this.inLexifiedContextStack.push(true);
    }
    exitLexifiedContext() {
      this.inLexifiedContextStack.pop();
    }
    currentApplication() {
      return this._applicationStack[this._applicationStack.length - 1];
    }
    inSyntacticContext() {
      const currentApplication = this.currentApplication();
      if (currentApplication) {
        return currentApplication.isSyntactic() && !this.inLexifiedContext();
      } else {
        return this.startExpr.factors[0].isSyntactic();
      }
    }
    inLexifiedContext() {
      return this.inLexifiedContextStack[this.inLexifiedContextStack.length - 1];
    }
    skipSpaces() {
      this.pushFailuresInfo();
      this.eval(applySpaces);
      this.popBinding();
      this.popFailuresInfo();
      return this.inputStream.pos;
    }
    skipSpacesIfInSyntacticContext() {
      return this.inSyntacticContext() ? this.skipSpaces() : this.inputStream.pos;
    }
    maybeSkipSpacesBefore(expr) {
      if (expr.allowsSkippingPrecedingSpace() && expr !== applySpaces) {
        return this.skipSpacesIfInSyntacticContext();
      } else {
        return this.inputStream.pos;
      }
    }
    pushBinding(node, origPos) {
      this._bindings.push(node);
      this._bindingOffsets.push(this.posToOffset(origPos));
    }
    popBinding() {
      this._bindings.pop();
      this._bindingOffsets.pop();
    }
    numBindings() {
      return this._bindings.length;
    }
    truncateBindings(newLength) {
      while (this._bindings.length > newLength) {
        this.popBinding();
      }
    }
    getCurrentPosInfo() {
      return this.getPosInfo(this.inputStream.pos);
    }
    getPosInfo(pos) {
      let posInfo = this.memoTable[pos];
      if (!posInfo) {
        posInfo = this.memoTable[pos] = new PosInfo();
      }
      return posInfo;
    }
    processFailure(pos, expr) {
      this.rightmostFailurePosition = Math.max(this.rightmostFailurePosition, pos);
      if (this.recordedFailures && pos === this.positionToRecordFailures) {
        const app = this.currentApplication();
        if (app) {
          expr = expr.substituteParams(app.args);
        } else {
        }
        this.recordFailure(expr.toFailure(this.grammar), false);
      }
    }
    recordFailure(failure, shouldCloneIfNew) {
      const key = failure.toKey();
      if (!this.recordedFailures[key]) {
        this.recordedFailures[key] = shouldCloneIfNew ? failure.clone() : failure;
      } else if (this.recordedFailures[key].isFluffy() && !failure.isFluffy()) {
        this.recordedFailures[key].clearFluffy();
      }
    }
    recordFailures(failures, shouldCloneIfNew) {
      Object.keys(failures).forEach((key) => {
        this.recordFailure(failures[key], shouldCloneIfNew);
      });
    }
    cloneRecordedFailures() {
      if (!this.recordedFailures) {
        return void 0;
      }
      const ans = /* @__PURE__ */ Object.create(null);
      Object.keys(this.recordedFailures).forEach((key) => {
        ans[key] = this.recordedFailures[key].clone();
      });
      return ans;
    }
    getRightmostFailurePosition() {
      return this.rightmostFailurePosition;
    }
    _getRightmostFailureOffset() {
      return this.rightmostFailurePosition >= 0 ? this.posToOffset(this.rightmostFailurePosition) : -1;
    }
    // Returns the memoized trace entry for `expr` at `pos`, if one exists, `null` otherwise.
    getMemoizedTraceEntry(pos, expr) {
      const posInfo = this.memoTable[pos];
      if (posInfo && expr instanceof Apply) {
        const memoRec = posInfo.memo[expr.toMemoKey()];
        if (memoRec && memoRec.traceEntry) {
          const entry = memoRec.traceEntry.cloneWithExpr(expr);
          entry.isMemoized = true;
          return entry;
        }
      }
      return null;
    }
    // Returns a new trace entry, with the currently active trace array as its children.
    getTraceEntry(pos, expr, succeeded, bindings) {
      if (expr instanceof Apply) {
        const app = this.currentApplication();
        const actuals = app ? app.args : [];
        expr = expr.substituteParams(actuals);
      }
      return this.getMemoizedTraceEntry(pos, expr) || new Trace(this.input, pos, this.inputStream.pos, expr, succeeded, bindings, this.trace);
    }
    isTracing() {
      return !!this.trace;
    }
    hasNecessaryInfo(memoRec) {
      if (this.trace && !memoRec.traceEntry) {
        return false;
      }
      if (this.recordedFailures && this.inputStream.pos + memoRec.rightmostFailureOffset === this.positionToRecordFailures) {
        return !!memoRec.failuresAtRightmostPosition;
      }
      return true;
    }
    useMemoizedResult(origPos, memoRec) {
      if (this.trace) {
        this.trace.push(memoRec.traceEntry);
      }
      const memoRecRightmostFailurePosition = this.inputStream.pos + memoRec.rightmostFailureOffset;
      this.rightmostFailurePosition = Math.max(
        this.rightmostFailurePosition,
        memoRecRightmostFailurePosition
      );
      if (this.recordedFailures && this.positionToRecordFailures === memoRecRightmostFailurePosition && memoRec.failuresAtRightmostPosition) {
        this.recordFailures(memoRec.failuresAtRightmostPosition, true);
      }
      this.inputStream.examinedLength = Math.max(
        this.inputStream.examinedLength,
        memoRec.examinedLength + origPos
      );
      if (memoRec.value) {
        this.inputStream.pos += memoRec.matchLength;
        this.pushBinding(memoRec.value, origPos);
        return true;
      }
      return false;
    }
    // Evaluate `expr` and return `true` if it succeeded, `false` otherwise. On success, `bindings`
    // will have `expr.getArity()` more elements than before, and the input stream's position may
    // have increased. On failure, `bindings` and position will be unchanged.
    eval(expr) {
      const { inputStream } = this;
      const origNumBindings = this._bindings.length;
      const origUserData = this.userData;
      let origRecordedFailures;
      if (this.recordedFailures) {
        origRecordedFailures = this.recordedFailures;
        this.recordedFailures = /* @__PURE__ */ Object.create(null);
      }
      const origPos = inputStream.pos;
      const memoPos = this.maybeSkipSpacesBefore(expr);
      let origTrace;
      if (this.trace) {
        origTrace = this.trace;
        this.trace = [];
      }
      const ans = expr.eval(this);
      if (this.trace) {
        const bindings = this._bindings.slice(origNumBindings);
        const traceEntry = this.getTraceEntry(memoPos, expr, ans, bindings);
        traceEntry.isImplicitSpaces = expr === applySpaces;
        traceEntry.isRootNode = expr === this.startExpr;
        origTrace.push(traceEntry);
        this.trace = origTrace;
      }
      if (ans) {
        if (this.recordedFailures && inputStream.pos === this.positionToRecordFailures) {
          Object.keys(this.recordedFailures).forEach((key) => {
            this.recordedFailures[key].makeFluffy();
          });
        }
      } else {
        inputStream.pos = origPos;
        this.truncateBindings(origNumBindings);
        this.userData = origUserData;
      }
      if (this.recordedFailures) {
        this.recordFailures(origRecordedFailures, false);
      }
      if (expr === builtInApplySyntacticBody) {
        this.skipSpaces();
      }
      return ans;
    }
    getMatchResult() {
      this.grammar._setUpMatchState(this);
      this.eval(this.startExpr);
      let rightmostFailures;
      if (this.recordedFailures) {
        rightmostFailures = Object.keys(this.recordedFailures).map(
          (key) => this.recordedFailures[key]
        );
      }
      const cst = this._bindings[0];
      if (cst) {
        cst.grammar = this.grammar;
      }
      return new MatchResult(
        this.matcher,
        this.input,
        this.startExpr,
        cst,
        this._bindingOffsets[0],
        this.rightmostFailurePosition,
        rightmostFailures
      );
    }
    getTrace() {
      this.trace = [];
      const matchResult = this.getMatchResult();
      const rootTrace = this.trace[this.trace.length - 1];
      rootTrace.result = matchResult;
      return rootTrace;
    }
    pushFailuresInfo() {
      this._rightmostFailurePositionStack.push(this.rightmostFailurePosition);
      this._recordedFailuresStack.push(this.recordedFailures);
    }
    popFailuresInfo() {
      this.rightmostFailurePosition = this._rightmostFailurePositionStack.pop();
      this.recordedFailures = this._recordedFailuresStack.pop();
    }
  };

  // node_modules/ohm-js/src/Matcher.js
  var Matcher = class {
    constructor(grammar2) {
      this.grammar = grammar2;
      this._memoTable = [];
      this._input = "";
      this._isMemoTableStale = false;
    }
    _resetMemoTable() {
      this._memoTable = [];
      this._isMemoTableStale = false;
    }
    getInput() {
      return this._input;
    }
    setInput(str) {
      if (this._input !== str) {
        this.replaceInputRange(0, this._input.length, str);
      }
      return this;
    }
    replaceInputRange(startIdx, endIdx, str) {
      const prevInput = this._input;
      const memoTable = this._memoTable;
      if (startIdx < 0 || startIdx > prevInput.length || endIdx < 0 || endIdx > prevInput.length || startIdx > endIdx) {
        throw new Error("Invalid indices: " + startIdx + " and " + endIdx);
      }
      this._input = prevInput.slice(0, startIdx) + str + prevInput.slice(endIdx);
      if (this._input !== prevInput && memoTable.length > 0) {
        this._isMemoTableStale = true;
      }
      const restOfMemoTable = memoTable.slice(endIdx);
      memoTable.length = startIdx;
      for (let idx = 0; idx < str.length; idx++) {
        memoTable.push(void 0);
      }
      for (const posInfo of restOfMemoTable) {
        memoTable.push(posInfo);
      }
      for (let pos = 0; pos < startIdx; pos++) {
        const posInfo = memoTable[pos];
        if (posInfo) {
          posInfo.clearObsoleteEntries(pos, startIdx);
        }
      }
      return this;
    }
    match(optStartApplicationStr, options = { incremental: true }) {
      return this._match(this._getStartExpr(optStartApplicationStr), {
        incremental: options.incremental,
        tracing: false
      });
    }
    trace(optStartApplicationStr, options = { incremental: true }) {
      return this._match(this._getStartExpr(optStartApplicationStr), {
        incremental: options.incremental,
        tracing: true
      });
    }
    _match(startExpr, options = {}) {
      const opts = {
        tracing: false,
        incremental: true,
        positionToRecordFailures: void 0,
        ...options
      };
      if (!opts.incremental) {
        this._resetMemoTable();
      } else if (this._isMemoTableStale && !this.grammar.supportsIncrementalParsing) {
        throw grammarDoesNotSupportIncrementalParsing(this.grammar);
      }
      const state = new MatchState(this, startExpr, opts.positionToRecordFailures);
      return opts.tracing ? state.getTrace() : state.getMatchResult();
    }
    /*
      Returns the starting expression for this Matcher's associated grammar. If
      `optStartApplicationStr` is specified, it is a string expressing a rule application in the
      grammar. If not specified, the grammar's default start rule will be used.
    */
    _getStartExpr(optStartApplicationStr) {
      const applicationStr = optStartApplicationStr || this.grammar.defaultStartRule;
      if (!applicationStr) {
        throw new Error("Missing start rule argument -- the grammar has no default start rule.");
      }
      const startApp = this.grammar.parseApplication(applicationStr);
      return new Seq([startApp, end]);
    }
  };

  // node_modules/ohm-js/src/Semantics.js
  var globalActionStack = [];
  var hasOwnProperty = (x, prop) => Object.prototype.hasOwnProperty.call(x, prop);
  var Wrapper = class {
    constructor(node, sourceInterval, baseInterval) {
      this._node = node;
      this.source = sourceInterval;
      this._baseInterval = baseInterval;
      if (node.isNonterminal()) {
        assert(sourceInterval === baseInterval);
      }
      this._childWrappers = [];
    }
    _forgetMemoizedResultFor(attributeName) {
      delete this._node[this._semantics.attributeKeys[attributeName]];
      this.children.forEach((child) => {
        child._forgetMemoizedResultFor(attributeName);
      });
    }
    // Returns the wrapper of the specified child node. Child wrappers are created lazily and
    // cached in the parent wrapper's `_childWrappers` instance variable.
    child(idx) {
      if (!(0 <= idx && idx < this._node.numChildren())) {
        return void 0;
      }
      let childWrapper = this._childWrappers[idx];
      if (!childWrapper) {
        const childNode = this._node.childAt(idx);
        const offset = this._node.childOffsets[idx];
        const source = this._baseInterval.subInterval(offset, childNode.matchLength);
        const base = childNode.isNonterminal() ? source : this._baseInterval;
        childWrapper = this._childWrappers[idx] = this._semantics.wrap(childNode, source, base);
      }
      return childWrapper;
    }
    // Returns an array containing the wrappers of all of the children of the node associated
    // with this wrapper.
    _children() {
      for (let idx = 0; idx < this._node.numChildren(); idx++) {
        this.child(idx);
      }
      return this._childWrappers;
    }
    // Returns `true` if the CST node associated with this wrapper corresponds to an iteration
    // expression, i.e., a Kleene-*, Kleene-+, or an optional. Returns `false` otherwise.
    isIteration() {
      return this._node.isIteration();
    }
    // Returns `true` if the CST node associated with this wrapper is a terminal node, `false`
    // otherwise.
    isTerminal() {
      return this._node.isTerminal();
    }
    // Returns `true` if the CST node associated with this wrapper is a nonterminal node, `false`
    // otherwise.
    isNonterminal() {
      return this._node.isNonterminal();
    }
    // Returns `true` if the CST node associated with this wrapper is a nonterminal node
    // corresponding to a syntactic rule, `false` otherwise.
    isSyntactic() {
      return this.isNonterminal() && this._node.isSyntactic();
    }
    // Returns `true` if the CST node associated with this wrapper is a nonterminal node
    // corresponding to a lexical rule, `false` otherwise.
    isLexical() {
      return this.isNonterminal() && this._node.isLexical();
    }
    // Returns `true` if the CST node associated with this wrapper is an iterator node
    // having either one or no child (? operator), `false` otherwise.
    // Otherwise, throws an exception.
    isOptional() {
      return this._node.isOptional();
    }
    // Create a new _iter wrapper in the same semantics as this wrapper.
    iteration(optChildWrappers) {
      const childWrappers = optChildWrappers || [];
      const childNodes = childWrappers.map((c) => c._node);
      const iter = new IterationNode(childNodes, [], -1, false);
      const wrapper = this._semantics.wrap(iter, null, null);
      wrapper._childWrappers = childWrappers;
      return wrapper;
    }
    // Returns an array containing the children of this CST node.
    get children() {
      return this._children();
    }
    // Returns the name of grammar rule that created this CST node.
    get ctorName() {
      return this._node.ctorName;
    }
    // Returns the number of children of this CST node.
    get numChildren() {
      return this._node.numChildren();
    }
    // Returns the contents of the input stream consumed by this CST node.
    get sourceString() {
      return this.source.contents;
    }
  };
  var Semantics = class _Semantics {
    constructor(grammar2, superSemantics) {
      const self = this;
      this.grammar = grammar2;
      this.checkedActionDicts = false;
      this.Wrapper = class extends (superSemantics ? superSemantics.Wrapper : Wrapper) {
        constructor(node, sourceInterval, baseInterval) {
          super(node, sourceInterval, baseInterval);
          self.checkActionDictsIfHaventAlready();
          this._semantics = self;
        }
        toString() {
          return "[semantics wrapper for " + self.grammar.name + "]";
        }
      };
      this.super = superSemantics;
      if (superSemantics) {
        if (!(grammar2.equals(this.super.grammar) || grammar2._inheritsFrom(this.super.grammar))) {
          throw new Error(
            "Cannot extend a semantics for grammar '" + this.super.grammar.name + "' for use with grammar '" + grammar2.name + "' (not a sub-grammar)"
          );
        }
        this.operations = Object.create(this.super.operations);
        this.attributes = Object.create(this.super.attributes);
        this.attributeKeys = /* @__PURE__ */ Object.create(null);
        for (const attributeName in this.attributes) {
          Object.defineProperty(this.attributeKeys, attributeName, {
            value: uniqueId(attributeName)
          });
        }
      } else {
        this.operations = /* @__PURE__ */ Object.create(null);
        this.attributes = /* @__PURE__ */ Object.create(null);
        this.attributeKeys = /* @__PURE__ */ Object.create(null);
      }
    }
    toString() {
      return "[semantics for " + this.grammar.name + "]";
    }
    checkActionDictsIfHaventAlready() {
      if (!this.checkedActionDicts) {
        this.checkActionDicts();
        this.checkedActionDicts = true;
      }
    }
    // Checks that the action dictionaries for all operations and attributes in this semantics,
    // including the ones that were inherited from the super-semantics, agree with the grammar.
    // Throws an exception if one or more of them doesn't.
    checkActionDicts() {
      let name;
      for (name in this.operations) {
        this.operations[name].checkActionDict(this.grammar);
      }
      for (name in this.attributes) {
        this.attributes[name].checkActionDict(this.grammar);
      }
    }
    toRecipe(semanticsOnly) {
      function hasSuperSemantics(s) {
        return s.super !== _Semantics.BuiltInSemantics._getSemantics();
      }
      let str = "(function(g) {\n";
      if (hasSuperSemantics(this)) {
        str += "  var semantics = " + this.super.toRecipe(true) + "(g";
        const superSemanticsGrammar = this.super.grammar;
        let relatedGrammar = this.grammar;
        while (relatedGrammar !== superSemanticsGrammar) {
          str += ".superGrammar";
          relatedGrammar = relatedGrammar.superGrammar;
        }
        str += ");\n";
        str += "  return g.extendSemantics(semantics)";
      } else {
        str += "  return g.createSemantics()";
      }
      ["Operation", "Attribute"].forEach((type) => {
        const semanticOperations = this[type.toLowerCase() + "s"];
        Object.keys(semanticOperations).forEach((name) => {
          const { actionDict, formals, builtInDefault } = semanticOperations[name];
          let signature = name;
          if (formals.length > 0) {
            signature += "(" + formals.join(", ") + ")";
          }
          let method;
          if (hasSuperSemantics(this) && this.super[type.toLowerCase() + "s"][name]) {
            method = "extend" + type;
          } else {
            method = "add" + type;
          }
          str += "\n    ." + method + "(" + JSON.stringify(signature) + ", {";
          const srcArray = [];
          Object.keys(actionDict).forEach((actionName) => {
            if (actionDict[actionName] !== builtInDefault) {
              let source = actionDict[actionName].toString().trim();
              source = source.replace(/^.*\(/, "function(");
              srcArray.push("\n      " + JSON.stringify(actionName) + ": " + source);
            }
          });
          str += srcArray.join(",") + "\n    })";
        });
      });
      str += ";\n  })";
      if (!semanticsOnly) {
        str = "(function() {\n  var grammar = this.fromRecipe(" + this.grammar.toRecipe() + ");\n  var semantics = " + str + "(grammar);\n  return semantics;\n});\n";
      }
      return str;
    }
    addOperationOrAttribute(type, signature, actionDict) {
      const typePlural = type + "s";
      const parsedNameAndFormalArgs = parseSignature(signature, type);
      const { name } = parsedNameAndFormalArgs;
      const { formals } = parsedNameAndFormalArgs;
      this.assertNewName(name, type);
      const builtInDefault = newDefaultAction(type, name, doIt);
      const realActionDict = { _default: builtInDefault };
      Object.keys(actionDict).forEach((name2) => {
        realActionDict[name2] = actionDict[name2];
      });
      const entry = type === "operation" ? new Operation(name, formals, realActionDict, builtInDefault) : new Attribute(name, realActionDict, builtInDefault);
      entry.checkActionDict(this.grammar);
      this[typePlural][name] = entry;
      function doIt(...args) {
        const thisThing = this._semantics[typePlural][name];
        if (arguments.length !== thisThing.formals.length) {
          throw new Error(
            "Invalid number of arguments passed to " + name + " " + type + " (expected " + thisThing.formals.length + ", got " + arguments.length + ")"
          );
        }
        const argsObj = /* @__PURE__ */ Object.create(null);
        for (const [idx, val] of Object.entries(args)) {
          const formal = thisThing.formals[idx];
          argsObj[formal] = val;
        }
        const oldArgs = this.args;
        this.args = argsObj;
        const ans = thisThing.execute(this._semantics, this);
        this.args = oldArgs;
        return ans;
      }
      if (type === "operation") {
        this.Wrapper.prototype[name] = doIt;
        this.Wrapper.prototype[name].toString = function() {
          return "[" + name + " operation]";
        };
      } else {
        Object.defineProperty(this.Wrapper.prototype, name, {
          get: doIt,
          configurable: true
          // So the property can be deleted.
        });
        Object.defineProperty(this.attributeKeys, name, {
          value: uniqueId(name)
        });
      }
    }
    extendOperationOrAttribute(type, name, actionDict) {
      const typePlural = type + "s";
      parseSignature(name, "attribute");
      if (!(this.super && name in this.super[typePlural])) {
        throw new Error(
          "Cannot extend " + type + " '" + name + "': did not inherit an " + type + " with that name"
        );
      }
      if (hasOwnProperty(this[typePlural], name)) {
        throw new Error("Cannot extend " + type + " '" + name + "' again");
      }
      const inheritedFormals = this[typePlural][name].formals;
      const inheritedActionDict = this[typePlural][name].actionDict;
      const newActionDict = Object.create(inheritedActionDict);
      Object.keys(actionDict).forEach((name2) => {
        newActionDict[name2] = actionDict[name2];
      });
      this[typePlural][name] = type === "operation" ? new Operation(name, inheritedFormals, newActionDict) : new Attribute(name, newActionDict);
      this[typePlural][name].checkActionDict(this.grammar);
    }
    assertNewName(name, type) {
      if (hasOwnProperty(Wrapper.prototype, name)) {
        throw new Error("Cannot add " + type + " '" + name + "': that's a reserved name");
      }
      if (name in this.operations) {
        throw new Error(
          "Cannot add " + type + " '" + name + "': an operation with that name already exists"
        );
      }
      if (name in this.attributes) {
        throw new Error(
          "Cannot add " + type + " '" + name + "': an attribute with that name already exists"
        );
      }
    }
    // Returns a wrapper for the given CST `node` in this semantics.
    // If `node` is already a wrapper, returns `node` itself.  // TODO: why is this needed?
    wrap(node, source, optBaseInterval) {
      const baseInterval = optBaseInterval || source;
      return node instanceof this.Wrapper ? node : new this.Wrapper(node, source, baseInterval);
    }
  };
  function parseSignature(signature, type) {
    if (!Semantics.prototypeGrammar) {
      assert(signature.indexOf("(") === -1);
      return {
        name: signature,
        formals: []
      };
    }
    const r = Semantics.prototypeGrammar.match(
      signature,
      type === "operation" ? "OperationSignature" : "AttributeSignature"
    );
    if (r.failed()) {
      throw new Error(r.message);
    }
    return Semantics.prototypeGrammarSemantics(r).parse();
  }
  function newDefaultAction(type, name, doIt) {
    return function(...children) {
      const thisThing = this._semantics.operations[name] || this._semantics.attributes[name];
      const args = thisThing.formals.map((formal) => this.args[formal]);
      if (!this.isIteration() && children.length === 1) {
        return doIt.apply(children[0], args);
      } else {
        throw missingSemanticAction(this.ctorName, name, type, globalActionStack);
      }
    };
  }
  Semantics.createSemantics = function(grammar2, optSuperSemantics) {
    const s = new Semantics(
      grammar2,
      optSuperSemantics !== void 0 ? optSuperSemantics : Semantics.BuiltInSemantics._getSemantics()
    );
    const proxy = function ASemantics(matchResult) {
      if (!(matchResult instanceof MatchResult)) {
        throw new TypeError(
          "Semantics expected a MatchResult, but got " + unexpectedObjToString(matchResult)
        );
      }
      if (matchResult.failed()) {
        throw new TypeError("cannot apply Semantics to " + matchResult.toString());
      }
      const cst = matchResult._cst;
      if (cst.grammar !== grammar2) {
        throw new Error(
          "Cannot use a MatchResult from grammar '" + cst.grammar.name + "' with a semantics for '" + grammar2.name + "'"
        );
      }
      const inputStream = new InputStream(matchResult.input);
      return s.wrap(cst, inputStream.interval(matchResult._cstOffset, matchResult.input.length));
    };
    proxy.addOperation = function(signature, actionDict) {
      s.addOperationOrAttribute("operation", signature, actionDict);
      return proxy;
    };
    proxy.extendOperation = function(name, actionDict) {
      s.extendOperationOrAttribute("operation", name, actionDict);
      return proxy;
    };
    proxy.addAttribute = function(name, actionDict) {
      s.addOperationOrAttribute("attribute", name, actionDict);
      return proxy;
    };
    proxy.extendAttribute = function(name, actionDict) {
      s.extendOperationOrAttribute("attribute", name, actionDict);
      return proxy;
    };
    proxy._getActionDict = function(operationOrAttributeName) {
      const action = s.operations[operationOrAttributeName] || s.attributes[operationOrAttributeName];
      if (!action) {
        throw new Error(
          '"' + operationOrAttributeName + '" is not a valid operation or attribute name in this semantics for "' + grammar2.name + '"'
        );
      }
      return action.actionDict;
    };
    proxy._remove = function(operationOrAttributeName) {
      let semantic;
      if (operationOrAttributeName in s.operations) {
        semantic = s.operations[operationOrAttributeName];
        delete s.operations[operationOrAttributeName];
      } else if (operationOrAttributeName in s.attributes) {
        semantic = s.attributes[operationOrAttributeName];
        delete s.attributes[operationOrAttributeName];
      }
      delete s.Wrapper.prototype[operationOrAttributeName];
      return semantic;
    };
    proxy.getOperationNames = function() {
      return Object.keys(s.operations);
    };
    proxy.getAttributeNames = function() {
      return Object.keys(s.attributes);
    };
    proxy.getGrammar = function() {
      return s.grammar;
    };
    proxy.toRecipe = function(semanticsOnly) {
      return s.toRecipe(semanticsOnly);
    };
    proxy.toString = s.toString.bind(s);
    proxy._getSemantics = function() {
      return s;
    };
    return proxy;
  };
  var Operation = class {
    constructor(name, formals, actionDict, builtInDefault) {
      this.name = name;
      this.formals = formals;
      this.actionDict = actionDict;
      this.builtInDefault = builtInDefault;
    }
    checkActionDict(grammar2) {
      grammar2._checkTopDownActionDict(this.typeName, this.name, this.actionDict);
    }
    // Execute this operation on the CST node associated with `nodeWrapper` in the context of the
    // given Semantics instance.
    execute(semantics, nodeWrapper) {
      try {
        const { ctorName } = nodeWrapper._node;
        let actionFn = this.actionDict[ctorName];
        if (actionFn) {
          globalActionStack.push([this, ctorName]);
          return actionFn.apply(nodeWrapper, nodeWrapper._children());
        }
        if (nodeWrapper.isNonterminal()) {
          actionFn = this.actionDict._nonterminal;
          if (actionFn) {
            globalActionStack.push([this, "_nonterminal", ctorName]);
            return actionFn.apply(nodeWrapper, nodeWrapper._children());
          }
        }
        globalActionStack.push([this, "default action", ctorName]);
        return this.actionDict._default.apply(nodeWrapper, nodeWrapper._children());
      } finally {
        globalActionStack.pop();
      }
    }
  };
  Operation.prototype.typeName = "operation";
  var Attribute = class extends Operation {
    constructor(name, actionDict, builtInDefault) {
      super(name, [], actionDict, builtInDefault);
    }
    execute(semantics, nodeWrapper) {
      const node = nodeWrapper._node;
      const key = semantics.attributeKeys[this.name];
      if (!hasOwnProperty(node, key)) {
        node[key] = Operation.prototype.execute.call(this, semantics, nodeWrapper);
      }
      return node[key];
    }
  };
  Attribute.prototype.typeName = "attribute";

  // node_modules/ohm-js/src/Grammar.js
  var SPECIAL_ACTION_NAMES = ["_iter", "_terminal", "_nonterminal", "_default"];
  function getSortedRuleValues(grammar2) {
    return Object.keys(grammar2.rules).sort().map((name) => grammar2.rules[name]);
  }
  var jsonToJS = (str) => str.replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
  var ohmGrammar;
  var buildGrammar;
  var Grammar = class _Grammar {
    constructor(name, superGrammar, rules, optDefaultStartRule) {
      this.name = name;
      this.superGrammar = superGrammar;
      this.rules = rules;
      if (optDefaultStartRule) {
        if (!(optDefaultStartRule in rules)) {
          throw new Error(
            "Invalid start rule: '" + optDefaultStartRule + "' is not a rule in grammar '" + name + "'"
          );
        }
        this.defaultStartRule = optDefaultStartRule;
      }
      this._matchStateInitializer = void 0;
      this.supportsIncrementalParsing = true;
    }
    matcher() {
      return new Matcher(this);
    }
    // Return true if the grammar is a built-in grammar, otherwise false.
    // NOTE: This might give an unexpected result if called before BuiltInRules is defined!
    isBuiltIn() {
      return this === _Grammar.ProtoBuiltInRules || this === _Grammar.BuiltInRules;
    }
    equals(g) {
      if (this === g) {
        return true;
      }
      if (g == null || this.name !== g.name || this.defaultStartRule !== g.defaultStartRule || !(this.superGrammar === g.superGrammar || this.superGrammar.equals(g.superGrammar))) {
        return false;
      }
      const myRules = getSortedRuleValues(this);
      const otherRules = getSortedRuleValues(g);
      return myRules.length === otherRules.length && myRules.every((rule, i) => {
        return rule.description === otherRules[i].description && rule.formals.join(",") === otherRules[i].formals.join(",") && rule.body.toString() === otherRules[i].body.toString();
      });
    }
    match(input, optStartApplication) {
      const m = this.matcher();
      m.replaceInputRange(0, 0, input);
      return m.match(optStartApplication);
    }
    trace(input, optStartApplication) {
      const m = this.matcher();
      m.replaceInputRange(0, 0, input);
      return m.trace(optStartApplication);
    }
    createSemantics() {
      return Semantics.createSemantics(this);
    }
    extendSemantics(superSemantics) {
      return Semantics.createSemantics(this, superSemantics._getSemantics());
    }
    // Check that every key in `actionDict` corresponds to a semantic action, and that it maps to
    // a function of the correct arity. If not, throw an exception.
    _checkTopDownActionDict(what, name, actionDict) {
      const problems = [];
      for (const k in actionDict) {
        const v = actionDict[k];
        const isSpecialAction = SPECIAL_ACTION_NAMES.includes(k);
        if (!isSpecialAction && !(k in this.rules)) {
          problems.push(`'${k}' is not a valid semantic action for '${this.name}'`);
          continue;
        }
        if (typeof v !== "function") {
          problems.push(`'${k}' must be a function in an action dictionary for '${this.name}'`);
          continue;
        }
        const actual = v.length;
        const expected = this._topDownActionArity(k);
        if (actual !== expected) {
          let details;
          if (k === "_iter" || k === "_nonterminal") {
            details = `it should use a rest parameter, e.g. \`${k}(...children) {}\`. NOTE: this is new in Ohm v16 \u2014 see https://ohmjs.org/d/ati for details.`;
          } else {
            details = `expected ${expected}, got ${actual}`;
          }
          problems.push(`Semantic action '${k}' has the wrong arity: ${details}`);
        }
      }
      if (problems.length > 0) {
        const prettyProblems = problems.map((problem) => "- " + problem);
        const error = new Error(
          [
            `Found errors in the action dictionary of the '${name}' ${what}:`,
            ...prettyProblems
          ].join("\n")
        );
        error.problems = problems;
        throw error;
      }
    }
    // Return the expected arity for a semantic action named `actionName`, which
    // is either a rule name or a special action name like '_nonterminal'.
    _topDownActionArity(actionName) {
      return SPECIAL_ACTION_NAMES.includes(actionName) ? 0 : this.rules[actionName].body.getArity();
    }
    _inheritsFrom(grammar2) {
      let g = this.superGrammar;
      while (g) {
        if (g.equals(grammar2, true)) {
          return true;
        }
        g = g.superGrammar;
      }
      return false;
    }
    toRecipe(superGrammarExpr = void 0) {
      const metaInfo = {};
      if (this.source) {
        metaInfo.source = this.source.contents;
      }
      let startRule = null;
      if (this.defaultStartRule) {
        startRule = this.defaultStartRule;
      }
      const rules = {};
      Object.keys(this.rules).forEach((ruleName) => {
        const ruleInfo = this.rules[ruleName];
        const { body } = ruleInfo;
        const isDefinition = !this.superGrammar || !this.superGrammar.rules[ruleName];
        let operation;
        if (isDefinition) {
          operation = "define";
        } else {
          operation = body instanceof Extend ? "extend" : "override";
        }
        const metaInfo2 = {};
        if (ruleInfo.source && this.source) {
          const adjusted = ruleInfo.source.relativeTo(this.source);
          metaInfo2.sourceInterval = [adjusted.startIdx, adjusted.endIdx];
        }
        const description = isDefinition ? ruleInfo.description : null;
        const bodyRecipe = body.outputRecipe(ruleInfo.formals, this.source);
        rules[ruleName] = [
          operation,
          // "define"/"extend"/"override"
          metaInfo2,
          description,
          ruleInfo.formals,
          bodyRecipe
        ];
      });
      let superGrammarOutput = "null";
      if (superGrammarExpr) {
        superGrammarOutput = superGrammarExpr;
      } else if (this.superGrammar && !this.superGrammar.isBuiltIn()) {
        superGrammarOutput = this.superGrammar.toRecipe();
      }
      const recipeElements = [
        ...["grammar", metaInfo, this.name].map(JSON.stringify),
        superGrammarOutput,
        ...[startRule, rules].map(JSON.stringify)
      ];
      return jsonToJS(`[${recipeElements.join(",")}]`);
    }
    // TODO: Come up with better names for these methods.
    // TODO: Write the analog of these methods for inherited attributes.
    toOperationActionDictionaryTemplate() {
      return this._toOperationOrAttributeActionDictionaryTemplate();
    }
    toAttributeActionDictionaryTemplate() {
      return this._toOperationOrAttributeActionDictionaryTemplate();
    }
    _toOperationOrAttributeActionDictionaryTemplate() {
      const sb = new StringBuffer();
      sb.append("{");
      let first = true;
      for (const ruleName in this.rules) {
        const { body } = this.rules[ruleName];
        if (first) {
          first = false;
        } else {
          sb.append(",");
        }
        sb.append("\n");
        sb.append("  ");
        this.addSemanticActionTemplate(ruleName, body, sb);
      }
      sb.append("\n}");
      return sb.contents();
    }
    addSemanticActionTemplate(ruleName, body, sb) {
      sb.append(ruleName);
      sb.append(": function(");
      const arity = this._topDownActionArity(ruleName);
      sb.append(repeat("_", arity).join(", "));
      sb.append(") {\n");
      sb.append("  }");
    }
    // Parse a string which expresses a rule application in this grammar, and return the
    // resulting Apply node.
    parseApplication(str) {
      let app;
      if (str.indexOf("<") === -1) {
        app = new Apply(str);
      } else {
        const cst = ohmGrammar.match(str, "Base_application");
        app = buildGrammar(cst, {});
      }
      if (!(app.ruleName in this.rules)) {
        throw undeclaredRule(app.ruleName, this.name);
      }
      const { formals } = this.rules[app.ruleName];
      if (formals.length !== app.args.length) {
        const { source } = this.rules[app.ruleName];
        throw wrongNumberOfParameters(
          app.ruleName,
          formals.length,
          app.args.length,
          source
        );
      }
      return app;
    }
    _setUpMatchState(state) {
      if (this._matchStateInitializer) {
        this._matchStateInitializer(state);
      }
    }
  };
  Grammar.ProtoBuiltInRules = new Grammar(
    "ProtoBuiltInRules",
    // name
    void 0,
    // supergrammar
    {
      any: {
        body: any,
        formals: [],
        description: "any character",
        primitive: true
      },
      end: {
        body: end,
        formals: [],
        description: "end of input",
        primitive: true
      },
      caseInsensitive: {
        body: new CaseInsensitiveTerminal(new Param(0)),
        formals: ["str"],
        primitive: true
      },
      lower: {
        body: new UnicodeChar("Ll"),
        formals: [],
        description: "a lowercase letter",
        primitive: true
      },
      upper: {
        body: new UnicodeChar("Lu"),
        formals: [],
        description: "an uppercase letter",
        primitive: true
      },
      // Union of Lt (titlecase), Lm (modifier), and Lo (other), i.e. any letter not in Ll or Lu.
      unicodeLtmo: {
        body: new UnicodeChar("Ltmo"),
        formals: [],
        description: "a Unicode character in Lt, Lm, or Lo",
        primitive: true
      },
      // These rules are not truly primitive (they could be written in userland) but are defined
      // here for bootstrapping purposes.
      spaces: {
        body: new Star(new Apply("space")),
        formals: []
      },
      space: {
        body: new Range("\0", " "),
        formals: [],
        description: "a space"
      }
    }
  );
  Grammar.initApplicationParser = function(grammar2, builderFn) {
    ohmGrammar = grammar2;
    buildGrammar = builderFn;
  };

  // node_modules/ohm-js/src/GrammarDecl.js
  var GrammarDecl = class {
    constructor(name) {
      this.name = name;
    }
    // Helpers
    sourceInterval(startIdx, endIdx) {
      return this.source.subInterval(startIdx, endIdx - startIdx);
    }
    ensureSuperGrammar() {
      if (!this.superGrammar) {
        this.withSuperGrammar(
          // TODO: The conditional expression below is an ugly hack. It's kind of ok because
          // I doubt anyone will ever try to declare a grammar called `BuiltInRules`. Still,
          // we should try to find a better way to do this.
          this.name === "BuiltInRules" ? Grammar.ProtoBuiltInRules : Grammar.BuiltInRules
        );
      }
      return this.superGrammar;
    }
    ensureSuperGrammarRuleForOverriding(name, source) {
      const ruleInfo = this.ensureSuperGrammar().rules[name];
      if (!ruleInfo) {
        throw cannotOverrideUndeclaredRule(name, this.superGrammar.name, source);
      }
      return ruleInfo;
    }
    installOverriddenOrExtendedRule(name, formals, body, source) {
      const duplicateParameterNames2 = getDuplicates(formals);
      if (duplicateParameterNames2.length > 0) {
        throw duplicateParameterNames(name, duplicateParameterNames2, source);
      }
      const ruleInfo = this.ensureSuperGrammar().rules[name];
      const expectedFormals = ruleInfo.formals;
      const expectedNumFormals = expectedFormals ? expectedFormals.length : 0;
      if (formals.length !== expectedNumFormals) {
        throw wrongNumberOfParameters(name, expectedNumFormals, formals.length, source);
      }
      return this.install(name, formals, body, ruleInfo.description, source);
    }
    install(name, formals, body, description, source, primitive = false) {
      this.rules[name] = {
        body: body.introduceParams(formals),
        formals,
        description,
        source,
        primitive
      };
      return this;
    }
    // Stuff that you should only do once
    withSuperGrammar(superGrammar) {
      if (this.superGrammar) {
        throw new Error("the super grammar of a GrammarDecl cannot be set more than once");
      }
      this.superGrammar = superGrammar;
      this.rules = Object.create(superGrammar.rules);
      if (!superGrammar.isBuiltIn()) {
        this.defaultStartRule = superGrammar.defaultStartRule;
      }
      return this;
    }
    withDefaultStartRule(ruleName) {
      this.defaultStartRule = ruleName;
      return this;
    }
    withSource(source) {
      this.source = new InputStream(source).interval(0, source.length);
      return this;
    }
    // Creates a Grammar instance, and if it passes the sanity checks, returns it.
    build() {
      const grammar2 = new Grammar(
        this.name,
        this.ensureSuperGrammar(),
        this.rules,
        this.defaultStartRule
      );
      grammar2._matchStateInitializer = grammar2.superGrammar._matchStateInitializer;
      grammar2.supportsIncrementalParsing = grammar2.superGrammar.supportsIncrementalParsing;
      const grammarErrors = [];
      let grammarHasInvalidApplications = false;
      Object.keys(grammar2.rules).forEach((ruleName) => {
        const { body } = grammar2.rules[ruleName];
        try {
          body.assertChoicesHaveUniformArity(ruleName);
        } catch (e) {
          grammarErrors.push(e);
        }
        try {
          body.assertAllApplicationsAreValid(ruleName, grammar2);
        } catch (e) {
          grammarErrors.push(e);
          grammarHasInvalidApplications = true;
        }
      });
      if (!grammarHasInvalidApplications) {
        Object.keys(grammar2.rules).forEach((ruleName) => {
          const { body } = grammar2.rules[ruleName];
          try {
            body.assertIteratedExprsAreNotNullable(grammar2, []);
          } catch (e) {
            grammarErrors.push(e);
          }
        });
      }
      if (grammarErrors.length > 0) {
        throwErrors(grammarErrors);
      }
      if (this.source) {
        grammar2.source = this.source;
      }
      return grammar2;
    }
    // Rule declarations
    define(name, formals, body, description, source, primitive) {
      this.ensureSuperGrammar();
      if (this.superGrammar.rules[name]) {
        throw duplicateRuleDeclaration(name, this.name, this.superGrammar.name, source);
      } else if (this.rules[name]) {
        throw duplicateRuleDeclaration(name, this.name, this.name, source);
      }
      const duplicateParameterNames2 = getDuplicates(formals);
      if (duplicateParameterNames2.length > 0) {
        throw duplicateParameterNames(name, duplicateParameterNames2, source);
      }
      return this.install(name, formals, body, description, source, primitive);
    }
    override(name, formals, body, descIgnored, source) {
      this.ensureSuperGrammarRuleForOverriding(name, source);
      this.installOverriddenOrExtendedRule(name, formals, body, source);
      return this;
    }
    extend(name, formals, fragment, descIgnored, source) {
      const ruleInfo = this.ensureSuperGrammar().rules[name];
      if (!ruleInfo) {
        throw cannotExtendUndeclaredRule(name, this.superGrammar.name, source);
      }
      const body = new Extend(this.superGrammar, name, fragment);
      body.source = fragment.source;
      this.installOverriddenOrExtendedRule(name, formals, body, source);
      return this;
    }
  };

  // node_modules/ohm-js/src/Builder.js
  var Builder = class {
    constructor(options) {
      this.currentDecl = null;
      this.currentRuleName = null;
      this.options = options || {};
    }
    newGrammar(name) {
      return new GrammarDecl(name);
    }
    grammar(metaInfo, name, superGrammar, defaultStartRule, rules) {
      const gDecl = new GrammarDecl(name);
      if (superGrammar) {
        gDecl.withSuperGrammar(
          superGrammar instanceof Grammar ? superGrammar : this.fromRecipe(superGrammar)
        );
      }
      if (defaultStartRule) {
        gDecl.withDefaultStartRule(defaultStartRule);
      }
      if (metaInfo && metaInfo.source) {
        gDecl.withSource(metaInfo.source);
      }
      this.currentDecl = gDecl;
      Object.keys(rules).forEach((ruleName) => {
        this.currentRuleName = ruleName;
        const ruleRecipe = rules[ruleName];
        const action = ruleRecipe[0];
        const metaInfo2 = ruleRecipe[1];
        const description = ruleRecipe[2];
        const formals = ruleRecipe[3];
        const body = this.fromRecipe(ruleRecipe[4]);
        let source;
        if (gDecl.source && metaInfo2 && metaInfo2.sourceInterval) {
          source = gDecl.source.subInterval(
            metaInfo2.sourceInterval[0],
            metaInfo2.sourceInterval[1] - metaInfo2.sourceInterval[0]
          );
        }
        gDecl[action](ruleName, formals, body, description, source);
      });
      this.currentRuleName = this.currentDecl = null;
      return gDecl.build();
    }
    terminal(x) {
      return new Terminal(x);
    }
    range(from, to) {
      return new Range(from, to);
    }
    param(index) {
      return new Param(index);
    }
    alt(...termArgs) {
      let terms = [];
      for (let arg of termArgs) {
        if (!(arg instanceof PExpr)) {
          arg = this.fromRecipe(arg);
        }
        if (arg instanceof Alt) {
          terms = terms.concat(arg.terms);
        } else {
          terms.push(arg);
        }
      }
      return terms.length === 1 ? terms[0] : new Alt(terms);
    }
    seq(...factorArgs) {
      let factors = [];
      for (let arg of factorArgs) {
        if (!(arg instanceof PExpr)) {
          arg = this.fromRecipe(arg);
        }
        if (arg instanceof Seq) {
          factors = factors.concat(arg.factors);
        } else {
          factors.push(arg);
        }
      }
      return factors.length === 1 ? factors[0] : new Seq(factors);
    }
    star(expr) {
      if (!(expr instanceof PExpr)) {
        expr = this.fromRecipe(expr);
      }
      return new Star(expr);
    }
    plus(expr) {
      if (!(expr instanceof PExpr)) {
        expr = this.fromRecipe(expr);
      }
      return new Plus(expr);
    }
    opt(expr) {
      if (!(expr instanceof PExpr)) {
        expr = this.fromRecipe(expr);
      }
      return new Opt(expr);
    }
    not(expr) {
      if (!(expr instanceof PExpr)) {
        expr = this.fromRecipe(expr);
      }
      return new Not(expr);
    }
    lookahead(expr) {
      if (!(expr instanceof PExpr)) {
        expr = this.fromRecipe(expr);
      }
      if (this.options.eliminateLookaheads) {
        return new Not(new Not(expr));
      }
      return new Lookahead(expr);
    }
    lex(expr) {
      if (!(expr instanceof PExpr)) {
        expr = this.fromRecipe(expr);
      }
      return new Lex(expr);
    }
    app(ruleName, optParams) {
      if (optParams && optParams.length > 0) {
        optParams = optParams.map(function(param) {
          return param instanceof PExpr ? param : this.fromRecipe(param);
        }, this);
      }
      return new Apply(ruleName, optParams);
    }
    // Note that unlike other methods in this class, this method cannot be used as a
    // convenience constructor. It only works with recipes, because it relies on
    // `this.currentDecl` and `this.currentRuleName` being set.
    splice(beforeTerms, afterTerms) {
      return new Splice(
        this.currentDecl.superGrammar,
        this.currentRuleName,
        beforeTerms.map((term) => this.fromRecipe(term)),
        afterTerms.map((term) => this.fromRecipe(term))
      );
    }
    fromRecipe(recipe) {
      const args = recipe[0] === "grammar" ? recipe.slice(1) : recipe.slice(2);
      const result = this[recipe[0]](...args);
      const metaInfo = recipe[1];
      if (metaInfo) {
        if (metaInfo.sourceInterval && this.currentDecl) {
          result.withSource(this.currentDecl.sourceInterval(...metaInfo.sourceInterval));
        }
      }
      return result;
    }
  };

  // node_modules/ohm-js/src/makeRecipe.js
  function makeRecipe(recipe) {
    if (typeof recipe === "function") {
      return recipe.call(new Builder());
    } else {
      if (typeof recipe === "string") {
        recipe = JSON.parse(recipe);
      }
      return new Builder().fromRecipe(recipe);
    }
  }

  // node_modules/ohm-js/dist/built-in-rules.js
  var built_in_rules_default = makeRecipe(["grammar", { "source": 'BuiltInRules {\n\n  alnum  (an alpha-numeric character)\n    = letter\n    | digit\n\n  letter  (a letter)\n    = lower\n    | upper\n    | unicodeLtmo\n\n  digit  (a digit)\n    = "0".."9"\n\n  hexDigit  (a hexadecimal digit)\n    = digit\n    | "a".."f"\n    | "A".."F"\n\n  ListOf<elem, sep>\n    = NonemptyListOf<elem, sep>\n    | EmptyListOf<elem, sep>\n\n  NonemptyListOf<elem, sep>\n    = elem (sep elem)*\n\n  EmptyListOf<elem, sep>\n    = /* nothing */\n\n  listOf<elem, sep>\n    = nonemptyListOf<elem, sep>\n    | emptyListOf<elem, sep>\n\n  nonemptyListOf<elem, sep>\n    = elem (sep elem)*\n\n  emptyListOf<elem, sep>\n    = /* nothing */\n\n  // Allows a syntactic rule application within a lexical context.\n  applySyntactic<app> = app\n}' }, "BuiltInRules", null, null, { "alnum": ["define", { "sourceInterval": [18, 78] }, "an alpha-numeric character", [], ["alt", { "sourceInterval": [60, 78] }, ["app", { "sourceInterval": [60, 66] }, "letter", []], ["app", { "sourceInterval": [73, 78] }, "digit", []]]], "letter": ["define", { "sourceInterval": [82, 142] }, "a letter", [], ["alt", { "sourceInterval": [107, 142] }, ["app", { "sourceInterval": [107, 112] }, "lower", []], ["app", { "sourceInterval": [119, 124] }, "upper", []], ["app", { "sourceInterval": [131, 142] }, "unicodeLtmo", []]]], "digit": ["define", { "sourceInterval": [146, 177] }, "a digit", [], ["range", { "sourceInterval": [169, 177] }, "0", "9"]], "hexDigit": ["define", { "sourceInterval": [181, 254] }, "a hexadecimal digit", [], ["alt", { "sourceInterval": [219, 254] }, ["app", { "sourceInterval": [219, 224] }, "digit", []], ["range", { "sourceInterval": [231, 239] }, "a", "f"], ["range", { "sourceInterval": [246, 254] }, "A", "F"]]], "ListOf": ["define", { "sourceInterval": [258, 336] }, null, ["elem", "sep"], ["alt", { "sourceInterval": [282, 336] }, ["app", { "sourceInterval": [282, 307] }, "NonemptyListOf", [["param", { "sourceInterval": [297, 301] }, 0], ["param", { "sourceInterval": [303, 306] }, 1]]], ["app", { "sourceInterval": [314, 336] }, "EmptyListOf", [["param", { "sourceInterval": [326, 330] }, 0], ["param", { "sourceInterval": [332, 335] }, 1]]]]], "NonemptyListOf": ["define", { "sourceInterval": [340, 388] }, null, ["elem", "sep"], ["seq", { "sourceInterval": [372, 388] }, ["param", { "sourceInterval": [372, 376] }, 0], ["star", { "sourceInterval": [377, 388] }, ["seq", { "sourceInterval": [378, 386] }, ["param", { "sourceInterval": [378, 381] }, 1], ["param", { "sourceInterval": [382, 386] }, 0]]]]], "EmptyListOf": ["define", { "sourceInterval": [392, 434] }, null, ["elem", "sep"], ["seq", { "sourceInterval": [438, 438] }]], "listOf": ["define", { "sourceInterval": [438, 516] }, null, ["elem", "sep"], ["alt", { "sourceInterval": [462, 516] }, ["app", { "sourceInterval": [462, 487] }, "nonemptyListOf", [["param", { "sourceInterval": [477, 481] }, 0], ["param", { "sourceInterval": [483, 486] }, 1]]], ["app", { "sourceInterval": [494, 516] }, "emptyListOf", [["param", { "sourceInterval": [506, 510] }, 0], ["param", { "sourceInterval": [512, 515] }, 1]]]]], "nonemptyListOf": ["define", { "sourceInterval": [520, 568] }, null, ["elem", "sep"], ["seq", { "sourceInterval": [552, 568] }, ["param", { "sourceInterval": [552, 556] }, 0], ["star", { "sourceInterval": [557, 568] }, ["seq", { "sourceInterval": [558, 566] }, ["param", { "sourceInterval": [558, 561] }, 1], ["param", { "sourceInterval": [562, 566] }, 0]]]]], "emptyListOf": ["define", { "sourceInterval": [572, 682] }, null, ["elem", "sep"], ["seq", { "sourceInterval": [685, 685] }]], "applySyntactic": ["define", { "sourceInterval": [685, 710] }, null, ["app"], ["param", { "sourceInterval": [707, 710] }, 0]] }]);

  // node_modules/ohm-js/src/main-kernel.js
  Grammar.BuiltInRules = built_in_rules_default;
  announceBuiltInRules(Grammar.BuiltInRules);

  // node_modules/ohm-js/dist/ohm-grammar.js
  var ohm_grammar_default = makeRecipe(["grammar", { "source": `Ohm {

  Grammars
    = Grammar*

  Grammar
    = ident SuperGrammar? "{" Rule* "}"

  SuperGrammar
    = "<:" ident

  Rule
    = ident Formals? ruleDescr? "="  RuleBody  -- define
    | ident Formals?            ":=" OverrideRuleBody  -- override
    | ident Formals?            "+=" RuleBody  -- extend

  RuleBody
    = "|"? NonemptyListOf<TopLevelTerm, "|">

  TopLevelTerm
    = Seq caseName  -- inline
    | Seq

  OverrideRuleBody
    = "|"? NonemptyListOf<OverrideTopLevelTerm, "|">

  OverrideTopLevelTerm
    = "..."  -- superSplice
    | TopLevelTerm

  Formals
    = "<" ListOf<ident, ","> ">"

  Params
    = "<" ListOf<Seq, ","> ">"

  Alt
    = NonemptyListOf<Seq, "|">

  Seq
    = Iter*

  Iter
    = Pred "*"  -- star
    | Pred "+"  -- plus
    | Pred "?"  -- opt
    | Pred

  Pred
    = "~" Lex  -- not
    | "&" Lex  -- lookahead
    | Lex

  Lex
    = "#" Base  -- lex
    | Base

  Base
    = ident Params? ~(ruleDescr? "=" | ":=" | "+=")  -- application
    | oneCharTerminal ".." oneCharTerminal           -- range
    | terminal                                       -- terminal
    | "(" Alt ")"                                    -- paren

  ruleDescr  (a rule description)
    = "(" ruleDescrText ")"

  ruleDescrText
    = (~")" any)*

  caseName
    = "--" (~"\\n" space)* name (~"\\n" space)* ("\\n" | &"}")

  name  (a name)
    = nameFirst nameRest*

  nameFirst
    = "_"
    | letter

  nameRest
    = "_"
    | alnum

  ident  (an identifier)
    = name

  terminal
    = "\\"" terminalChar* "\\""

  oneCharTerminal
    = "\\"" terminalChar "\\""

  terminalChar
    = escapeChar
      | ~"\\\\" ~"\\"" ~"\\n" "\\u{0}".."\\u{10FFFF}"

  escapeChar  (an escape sequence)
    = "\\\\\\\\"                                     -- backslash
    | "\\\\\\""                                     -- doubleQuote
    | "\\\\\\'"                                     -- singleQuote
    | "\\\\b"                                      -- backspace
    | "\\\\n"                                      -- lineFeed
    | "\\\\r"                                      -- carriageReturn
    | "\\\\t"                                      -- tab
    | "\\\\u{" hexDigit hexDigit? hexDigit?
             hexDigit? hexDigit? hexDigit? "}"   -- unicodeCodePoint
    | "\\\\u" hexDigit hexDigit hexDigit hexDigit  -- unicodeEscape
    | "\\\\x" hexDigit hexDigit                    -- hexEscape

  space
   += comment

  comment
    = "//" (~"\\n" any)* &("\\n" | end)  -- singleLine
    | "/*" (~"*/" any)* "*/"  -- multiLine

  tokens = token*

  token = caseName | comment | ident | operator | punctuation | terminal | any

  operator = "<:" | "=" | ":=" | "+=" | "*" | "+" | "?" | "~" | "&"

  punctuation = "<" | ">" | "," | "--"
}` }, "Ohm", null, "Grammars", { "Grammars": ["define", { "sourceInterval": [9, 32] }, null, [], ["star", { "sourceInterval": [24, 32] }, ["app", { "sourceInterval": [24, 31] }, "Grammar", []]]], "Grammar": ["define", { "sourceInterval": [36, 83] }, null, [], ["seq", { "sourceInterval": [50, 83] }, ["app", { "sourceInterval": [50, 55] }, "ident", []], ["opt", { "sourceInterval": [56, 69] }, ["app", { "sourceInterval": [56, 68] }, "SuperGrammar", []]], ["terminal", { "sourceInterval": [70, 73] }, "{"], ["star", { "sourceInterval": [74, 79] }, ["app", { "sourceInterval": [74, 78] }, "Rule", []]], ["terminal", { "sourceInterval": [80, 83] }, "}"]]], "SuperGrammar": ["define", { "sourceInterval": [87, 116] }, null, [], ["seq", { "sourceInterval": [106, 116] }, ["terminal", { "sourceInterval": [106, 110] }, "<:"], ["app", { "sourceInterval": [111, 116] }, "ident", []]]], "Rule_define": ["define", { "sourceInterval": [131, 181] }, null, [], ["seq", { "sourceInterval": [131, 170] }, ["app", { "sourceInterval": [131, 136] }, "ident", []], ["opt", { "sourceInterval": [137, 145] }, ["app", { "sourceInterval": [137, 144] }, "Formals", []]], ["opt", { "sourceInterval": [146, 156] }, ["app", { "sourceInterval": [146, 155] }, "ruleDescr", []]], ["terminal", { "sourceInterval": [157, 160] }, "="], ["app", { "sourceInterval": [162, 170] }, "RuleBody", []]]], "Rule_override": ["define", { "sourceInterval": [188, 248] }, null, [], ["seq", { "sourceInterval": [188, 235] }, ["app", { "sourceInterval": [188, 193] }, "ident", []], ["opt", { "sourceInterval": [194, 202] }, ["app", { "sourceInterval": [194, 201] }, "Formals", []]], ["terminal", { "sourceInterval": [214, 218] }, ":="], ["app", { "sourceInterval": [219, 235] }, "OverrideRuleBody", []]]], "Rule_extend": ["define", { "sourceInterval": [255, 305] }, null, [], ["seq", { "sourceInterval": [255, 294] }, ["app", { "sourceInterval": [255, 260] }, "ident", []], ["opt", { "sourceInterval": [261, 269] }, ["app", { "sourceInterval": [261, 268] }, "Formals", []]], ["terminal", { "sourceInterval": [281, 285] }, "+="], ["app", { "sourceInterval": [286, 294] }, "RuleBody", []]]], "Rule": ["define", { "sourceInterval": [120, 305] }, null, [], ["alt", { "sourceInterval": [131, 305] }, ["app", { "sourceInterval": [131, 170] }, "Rule_define", []], ["app", { "sourceInterval": [188, 235] }, "Rule_override", []], ["app", { "sourceInterval": [255, 294] }, "Rule_extend", []]]], "RuleBody": ["define", { "sourceInterval": [309, 362] }, null, [], ["seq", { "sourceInterval": [324, 362] }, ["opt", { "sourceInterval": [324, 328] }, ["terminal", { "sourceInterval": [324, 327] }, "|"]], ["app", { "sourceInterval": [329, 362] }, "NonemptyListOf", [["app", { "sourceInterval": [344, 356] }, "TopLevelTerm", []], ["terminal", { "sourceInterval": [358, 361] }, "|"]]]]], "TopLevelTerm_inline": ["define", { "sourceInterval": [385, 408] }, null, [], ["seq", { "sourceInterval": [385, 397] }, ["app", { "sourceInterval": [385, 388] }, "Seq", []], ["app", { "sourceInterval": [389, 397] }, "caseName", []]]], "TopLevelTerm": ["define", { "sourceInterval": [366, 418] }, null, [], ["alt", { "sourceInterval": [385, 418] }, ["app", { "sourceInterval": [385, 397] }, "TopLevelTerm_inline", []], ["app", { "sourceInterval": [415, 418] }, "Seq", []]]], "OverrideRuleBody": ["define", { "sourceInterval": [422, 491] }, null, [], ["seq", { "sourceInterval": [445, 491] }, ["opt", { "sourceInterval": [445, 449] }, ["terminal", { "sourceInterval": [445, 448] }, "|"]], ["app", { "sourceInterval": [450, 491] }, "NonemptyListOf", [["app", { "sourceInterval": [465, 485] }, "OverrideTopLevelTerm", []], ["terminal", { "sourceInterval": [487, 490] }, "|"]]]]], "OverrideTopLevelTerm_superSplice": ["define", { "sourceInterval": [522, 543] }, null, [], ["terminal", { "sourceInterval": [522, 527] }, "..."]], "OverrideTopLevelTerm": ["define", { "sourceInterval": [495, 562] }, null, [], ["alt", { "sourceInterval": [522, 562] }, ["app", { "sourceInterval": [522, 527] }, "OverrideTopLevelTerm_superSplice", []], ["app", { "sourceInterval": [550, 562] }, "TopLevelTerm", []]]], "Formals": ["define", { "sourceInterval": [566, 606] }, null, [], ["seq", { "sourceInterval": [580, 606] }, ["terminal", { "sourceInterval": [580, 583] }, "<"], ["app", { "sourceInterval": [584, 602] }, "ListOf", [["app", { "sourceInterval": [591, 596] }, "ident", []], ["terminal", { "sourceInterval": [598, 601] }, ","]]], ["terminal", { "sourceInterval": [603, 606] }, ">"]]], "Params": ["define", { "sourceInterval": [610, 647] }, null, [], ["seq", { "sourceInterval": [623, 647] }, ["terminal", { "sourceInterval": [623, 626] }, "<"], ["app", { "sourceInterval": [627, 643] }, "ListOf", [["app", { "sourceInterval": [634, 637] }, "Seq", []], ["terminal", { "sourceInterval": [639, 642] }, ","]]], ["terminal", { "sourceInterval": [644, 647] }, ">"]]], "Alt": ["define", { "sourceInterval": [651, 685] }, null, [], ["app", { "sourceInterval": [661, 685] }, "NonemptyListOf", [["app", { "sourceInterval": [676, 679] }, "Seq", []], ["terminal", { "sourceInterval": [681, 684] }, "|"]]]], "Seq": ["define", { "sourceInterval": [689, 704] }, null, [], ["star", { "sourceInterval": [699, 704] }, ["app", { "sourceInterval": [699, 703] }, "Iter", []]]], "Iter_star": ["define", { "sourceInterval": [719, 736] }, null, [], ["seq", { "sourceInterval": [719, 727] }, ["app", { "sourceInterval": [719, 723] }, "Pred", []], ["terminal", { "sourceInterval": [724, 727] }, "*"]]], "Iter_plus": ["define", { "sourceInterval": [743, 760] }, null, [], ["seq", { "sourceInterval": [743, 751] }, ["app", { "sourceInterval": [743, 747] }, "Pred", []], ["terminal", { "sourceInterval": [748, 751] }, "+"]]], "Iter_opt": ["define", { "sourceInterval": [767, 783] }, null, [], ["seq", { "sourceInterval": [767, 775] }, ["app", { "sourceInterval": [767, 771] }, "Pred", []], ["terminal", { "sourceInterval": [772, 775] }, "?"]]], "Iter": ["define", { "sourceInterval": [708, 794] }, null, [], ["alt", { "sourceInterval": [719, 794] }, ["app", { "sourceInterval": [719, 727] }, "Iter_star", []], ["app", { "sourceInterval": [743, 751] }, "Iter_plus", []], ["app", { "sourceInterval": [767, 775] }, "Iter_opt", []], ["app", { "sourceInterval": [790, 794] }, "Pred", []]]], "Pred_not": ["define", { "sourceInterval": [809, 824] }, null, [], ["seq", { "sourceInterval": [809, 816] }, ["terminal", { "sourceInterval": [809, 812] }, "~"], ["app", { "sourceInterval": [813, 816] }, "Lex", []]]], "Pred_lookahead": ["define", { "sourceInterval": [831, 852] }, null, [], ["seq", { "sourceInterval": [831, 838] }, ["terminal", { "sourceInterval": [831, 834] }, "&"], ["app", { "sourceInterval": [835, 838] }, "Lex", []]]], "Pred": ["define", { "sourceInterval": [798, 862] }, null, [], ["alt", { "sourceInterval": [809, 862] }, ["app", { "sourceInterval": [809, 816] }, "Pred_not", []], ["app", { "sourceInterval": [831, 838] }, "Pred_lookahead", []], ["app", { "sourceInterval": [859, 862] }, "Lex", []]]], "Lex_lex": ["define", { "sourceInterval": [876, 892] }, null, [], ["seq", { "sourceInterval": [876, 884] }, ["terminal", { "sourceInterval": [876, 879] }, "#"], ["app", { "sourceInterval": [880, 884] }, "Base", []]]], "Lex": ["define", { "sourceInterval": [866, 903] }, null, [], ["alt", { "sourceInterval": [876, 903] }, ["app", { "sourceInterval": [876, 884] }, "Lex_lex", []], ["app", { "sourceInterval": [899, 903] }, "Base", []]]], "Base_application": ["define", { "sourceInterval": [918, 979] }, null, [], ["seq", { "sourceInterval": [918, 963] }, ["app", { "sourceInterval": [918, 923] }, "ident", []], ["opt", { "sourceInterval": [924, 931] }, ["app", { "sourceInterval": [924, 930] }, "Params", []]], ["not", { "sourceInterval": [932, 963] }, ["alt", { "sourceInterval": [934, 962] }, ["seq", { "sourceInterval": [934, 948] }, ["opt", { "sourceInterval": [934, 944] }, ["app", { "sourceInterval": [934, 943] }, "ruleDescr", []]], ["terminal", { "sourceInterval": [945, 948] }, "="]], ["terminal", { "sourceInterval": [951, 955] }, ":="], ["terminal", { "sourceInterval": [958, 962] }, "+="]]]]], "Base_range": ["define", { "sourceInterval": [986, 1041] }, null, [], ["seq", { "sourceInterval": [986, 1022] }, ["app", { "sourceInterval": [986, 1001] }, "oneCharTerminal", []], ["terminal", { "sourceInterval": [1002, 1006] }, ".."], ["app", { "sourceInterval": [1007, 1022] }, "oneCharTerminal", []]]], "Base_terminal": ["define", { "sourceInterval": [1048, 1106] }, null, [], ["app", { "sourceInterval": [1048, 1056] }, "terminal", []]], "Base_paren": ["define", { "sourceInterval": [1113, 1168] }, null, [], ["seq", { "sourceInterval": [1113, 1124] }, ["terminal", { "sourceInterval": [1113, 1116] }, "("], ["app", { "sourceInterval": [1117, 1120] }, "Alt", []], ["terminal", { "sourceInterval": [1121, 1124] }, ")"]]], "Base": ["define", { "sourceInterval": [907, 1168] }, null, [], ["alt", { "sourceInterval": [918, 1168] }, ["app", { "sourceInterval": [918, 963] }, "Base_application", []], ["app", { "sourceInterval": [986, 1022] }, "Base_range", []], ["app", { "sourceInterval": [1048, 1056] }, "Base_terminal", []], ["app", { "sourceInterval": [1113, 1124] }, "Base_paren", []]]], "ruleDescr": ["define", { "sourceInterval": [1172, 1231] }, "a rule description", [], ["seq", { "sourceInterval": [1210, 1231] }, ["terminal", { "sourceInterval": [1210, 1213] }, "("], ["app", { "sourceInterval": [1214, 1227] }, "ruleDescrText", []], ["terminal", { "sourceInterval": [1228, 1231] }, ")"]]], "ruleDescrText": ["define", { "sourceInterval": [1235, 1266] }, null, [], ["star", { "sourceInterval": [1255, 1266] }, ["seq", { "sourceInterval": [1256, 1264] }, ["not", { "sourceInterval": [1256, 1260] }, ["terminal", { "sourceInterval": [1257, 1260] }, ")"]], ["app", { "sourceInterval": [1261, 1264] }, "any", []]]]], "caseName": ["define", { "sourceInterval": [1270, 1338] }, null, [], ["seq", { "sourceInterval": [1285, 1338] }, ["terminal", { "sourceInterval": [1285, 1289] }, "--"], ["star", { "sourceInterval": [1290, 1304] }, ["seq", { "sourceInterval": [1291, 1302] }, ["not", { "sourceInterval": [1291, 1296] }, ["terminal", { "sourceInterval": [1292, 1296] }, "\n"]], ["app", { "sourceInterval": [1297, 1302] }, "space", []]]], ["app", { "sourceInterval": [1305, 1309] }, "name", []], ["star", { "sourceInterval": [1310, 1324] }, ["seq", { "sourceInterval": [1311, 1322] }, ["not", { "sourceInterval": [1311, 1316] }, ["terminal", { "sourceInterval": [1312, 1316] }, "\n"]], ["app", { "sourceInterval": [1317, 1322] }, "space", []]]], ["alt", { "sourceInterval": [1326, 1337] }, ["terminal", { "sourceInterval": [1326, 1330] }, "\n"], ["lookahead", { "sourceInterval": [1333, 1337] }, ["terminal", { "sourceInterval": [1334, 1337] }, "}"]]]]], "name": ["define", { "sourceInterval": [1342, 1382] }, "a name", [], ["seq", { "sourceInterval": [1363, 1382] }, ["app", { "sourceInterval": [1363, 1372] }, "nameFirst", []], ["star", { "sourceInterval": [1373, 1382] }, ["app", { "sourceInterval": [1373, 1381] }, "nameRest", []]]]], "nameFirst": ["define", { "sourceInterval": [1386, 1418] }, null, [], ["alt", { "sourceInterval": [1402, 1418] }, ["terminal", { "sourceInterval": [1402, 1405] }, "_"], ["app", { "sourceInterval": [1412, 1418] }, "letter", []]]], "nameRest": ["define", { "sourceInterval": [1422, 1452] }, null, [], ["alt", { "sourceInterval": [1437, 1452] }, ["terminal", { "sourceInterval": [1437, 1440] }, "_"], ["app", { "sourceInterval": [1447, 1452] }, "alnum", []]]], "ident": ["define", { "sourceInterval": [1456, 1489] }, "an identifier", [], ["app", { "sourceInterval": [1485, 1489] }, "name", []]], "terminal": ["define", { "sourceInterval": [1493, 1531] }, null, [], ["seq", { "sourceInterval": [1508, 1531] }, ["terminal", { "sourceInterval": [1508, 1512] }, '"'], ["star", { "sourceInterval": [1513, 1526] }, ["app", { "sourceInterval": [1513, 1525] }, "terminalChar", []]], ["terminal", { "sourceInterval": [1527, 1531] }, '"']]], "oneCharTerminal": ["define", { "sourceInterval": [1535, 1579] }, null, [], ["seq", { "sourceInterval": [1557, 1579] }, ["terminal", { "sourceInterval": [1557, 1561] }, '"'], ["app", { "sourceInterval": [1562, 1574] }, "terminalChar", []], ["terminal", { "sourceInterval": [1575, 1579] }, '"']]], "terminalChar": ["define", { "sourceInterval": [1583, 1660] }, null, [], ["alt", { "sourceInterval": [1602, 1660] }, ["app", { "sourceInterval": [1602, 1612] }, "escapeChar", []], ["seq", { "sourceInterval": [1621, 1660] }, ["not", { "sourceInterval": [1621, 1626] }, ["terminal", { "sourceInterval": [1622, 1626] }, "\\"]], ["not", { "sourceInterval": [1627, 1632] }, ["terminal", { "sourceInterval": [1628, 1632] }, '"']], ["not", { "sourceInterval": [1633, 1638] }, ["terminal", { "sourceInterval": [1634, 1638] }, "\n"]], ["range", { "sourceInterval": [1639, 1660] }, "\0", "\u{10FFFF}"]]]], "escapeChar_backslash": ["define", { "sourceInterval": [1703, 1758] }, null, [], ["terminal", { "sourceInterval": [1703, 1709] }, "\\\\"]], "escapeChar_doubleQuote": ["define", { "sourceInterval": [1765, 1822] }, null, [], ["terminal", { "sourceInterval": [1765, 1771] }, '\\"']], "escapeChar_singleQuote": ["define", { "sourceInterval": [1829, 1886] }, null, [], ["terminal", { "sourceInterval": [1829, 1835] }, "\\'"]], "escapeChar_backspace": ["define", { "sourceInterval": [1893, 1948] }, null, [], ["terminal", { "sourceInterval": [1893, 1898] }, "\\b"]], "escapeChar_lineFeed": ["define", { "sourceInterval": [1955, 2009] }, null, [], ["terminal", { "sourceInterval": [1955, 1960] }, "\\n"]], "escapeChar_carriageReturn": ["define", { "sourceInterval": [2016, 2076] }, null, [], ["terminal", { "sourceInterval": [2016, 2021] }, "\\r"]], "escapeChar_tab": ["define", { "sourceInterval": [2083, 2132] }, null, [], ["terminal", { "sourceInterval": [2083, 2088] }, "\\t"]], "escapeChar_unicodeCodePoint": ["define", { "sourceInterval": [2139, 2243] }, null, [], ["seq", { "sourceInterval": [2139, 2221] }, ["terminal", { "sourceInterval": [2139, 2145] }, "\\u{"], ["app", { "sourceInterval": [2146, 2154] }, "hexDigit", []], ["opt", { "sourceInterval": [2155, 2164] }, ["app", { "sourceInterval": [2155, 2163] }, "hexDigit", []]], ["opt", { "sourceInterval": [2165, 2174] }, ["app", { "sourceInterval": [2165, 2173] }, "hexDigit", []]], ["opt", { "sourceInterval": [2188, 2197] }, ["app", { "sourceInterval": [2188, 2196] }, "hexDigit", []]], ["opt", { "sourceInterval": [2198, 2207] }, ["app", { "sourceInterval": [2198, 2206] }, "hexDigit", []]], ["opt", { "sourceInterval": [2208, 2217] }, ["app", { "sourceInterval": [2208, 2216] }, "hexDigit", []]], ["terminal", { "sourceInterval": [2218, 2221] }, "}"]]], "escapeChar_unicodeEscape": ["define", { "sourceInterval": [2250, 2309] }, null, [], ["seq", { "sourceInterval": [2250, 2291] }, ["terminal", { "sourceInterval": [2250, 2255] }, "\\u"], ["app", { "sourceInterval": [2256, 2264] }, "hexDigit", []], ["app", { "sourceInterval": [2265, 2273] }, "hexDigit", []], ["app", { "sourceInterval": [2274, 2282] }, "hexDigit", []], ["app", { "sourceInterval": [2283, 2291] }, "hexDigit", []]]], "escapeChar_hexEscape": ["define", { "sourceInterval": [2316, 2371] }, null, [], ["seq", { "sourceInterval": [2316, 2339] }, ["terminal", { "sourceInterval": [2316, 2321] }, "\\x"], ["app", { "sourceInterval": [2322, 2330] }, "hexDigit", []], ["app", { "sourceInterval": [2331, 2339] }, "hexDigit", []]]], "escapeChar": ["define", { "sourceInterval": [1664, 2371] }, "an escape sequence", [], ["alt", { "sourceInterval": [1703, 2371] }, ["app", { "sourceInterval": [1703, 1709] }, "escapeChar_backslash", []], ["app", { "sourceInterval": [1765, 1771] }, "escapeChar_doubleQuote", []], ["app", { "sourceInterval": [1829, 1835] }, "escapeChar_singleQuote", []], ["app", { "sourceInterval": [1893, 1898] }, "escapeChar_backspace", []], ["app", { "sourceInterval": [1955, 1960] }, "escapeChar_lineFeed", []], ["app", { "sourceInterval": [2016, 2021] }, "escapeChar_carriageReturn", []], ["app", { "sourceInterval": [2083, 2088] }, "escapeChar_tab", []], ["app", { "sourceInterval": [2139, 2221] }, "escapeChar_unicodeCodePoint", []], ["app", { "sourceInterval": [2250, 2291] }, "escapeChar_unicodeEscape", []], ["app", { "sourceInterval": [2316, 2339] }, "escapeChar_hexEscape", []]]], "space": ["extend", { "sourceInterval": [2375, 2394] }, null, [], ["app", { "sourceInterval": [2387, 2394] }, "comment", []]], "comment_singleLine": ["define", { "sourceInterval": [2412, 2458] }, null, [], ["seq", { "sourceInterval": [2412, 2443] }, ["terminal", { "sourceInterval": [2412, 2416] }, "//"], ["star", { "sourceInterval": [2417, 2429] }, ["seq", { "sourceInterval": [2418, 2427] }, ["not", { "sourceInterval": [2418, 2423] }, ["terminal", { "sourceInterval": [2419, 2423] }, "\n"]], ["app", { "sourceInterval": [2424, 2427] }, "any", []]]], ["lookahead", { "sourceInterval": [2430, 2443] }, ["alt", { "sourceInterval": [2432, 2442] }, ["terminal", { "sourceInterval": [2432, 2436] }, "\n"], ["app", { "sourceInterval": [2439, 2442] }, "end", []]]]]], "comment_multiLine": ["define", { "sourceInterval": [2465, 2501] }, null, [], ["seq", { "sourceInterval": [2465, 2487] }, ["terminal", { "sourceInterval": [2465, 2469] }, "/*"], ["star", { "sourceInterval": [2470, 2482] }, ["seq", { "sourceInterval": [2471, 2480] }, ["not", { "sourceInterval": [2471, 2476] }, ["terminal", { "sourceInterval": [2472, 2476] }, "*/"]], ["app", { "sourceInterval": [2477, 2480] }, "any", []]]], ["terminal", { "sourceInterval": [2483, 2487] }, "*/"]]], "comment": ["define", { "sourceInterval": [2398, 2501] }, null, [], ["alt", { "sourceInterval": [2412, 2501] }, ["app", { "sourceInterval": [2412, 2443] }, "comment_singleLine", []], ["app", { "sourceInterval": [2465, 2487] }, "comment_multiLine", []]]], "tokens": ["define", { "sourceInterval": [2505, 2520] }, null, [], ["star", { "sourceInterval": [2514, 2520] }, ["app", { "sourceInterval": [2514, 2519] }, "token", []]]], "token": ["define", { "sourceInterval": [2524, 2600] }, null, [], ["alt", { "sourceInterval": [2532, 2600] }, ["app", { "sourceInterval": [2532, 2540] }, "caseName", []], ["app", { "sourceInterval": [2543, 2550] }, "comment", []], ["app", { "sourceInterval": [2553, 2558] }, "ident", []], ["app", { "sourceInterval": [2561, 2569] }, "operator", []], ["app", { "sourceInterval": [2572, 2583] }, "punctuation", []], ["app", { "sourceInterval": [2586, 2594] }, "terminal", []], ["app", { "sourceInterval": [2597, 2600] }, "any", []]]], "operator": ["define", { "sourceInterval": [2604, 2669] }, null, [], ["alt", { "sourceInterval": [2615, 2669] }, ["terminal", { "sourceInterval": [2615, 2619] }, "<:"], ["terminal", { "sourceInterval": [2622, 2625] }, "="], ["terminal", { "sourceInterval": [2628, 2632] }, ":="], ["terminal", { "sourceInterval": [2635, 2639] }, "+="], ["terminal", { "sourceInterval": [2642, 2645] }, "*"], ["terminal", { "sourceInterval": [2648, 2651] }, "+"], ["terminal", { "sourceInterval": [2654, 2657] }, "?"], ["terminal", { "sourceInterval": [2660, 2663] }, "~"], ["terminal", { "sourceInterval": [2666, 2669] }, "&"]]], "punctuation": ["define", { "sourceInterval": [2673, 2709] }, null, [], ["alt", { "sourceInterval": [2687, 2709] }, ["terminal", { "sourceInterval": [2687, 2690] }, "<"], ["terminal", { "sourceInterval": [2693, 2696] }, ">"], ["terminal", { "sourceInterval": [2699, 2702] }, ","], ["terminal", { "sourceInterval": [2705, 2709] }, "--"]]] }]);

  // node_modules/ohm-js/src/buildGrammar.js
  var superSplicePlaceholder = Object.create(PExpr.prototype);
  function namespaceHas(ns, name) {
    for (const prop in ns) {
      if (prop === name) return true;
    }
    return false;
  }
  function buildGrammar2(match, namespace, optOhmGrammarForTesting, options) {
    const builder = new Builder(options);
    let decl;
    let currentRuleName;
    let currentRuleFormals;
    let overriding = false;
    const metaGrammar = optOhmGrammarForTesting || ohm_grammar_default;
    const helpers = metaGrammar.createSemantics().addOperation("visit", {
      Grammars(grammarIter) {
        return grammarIter.children.map((c) => c.visit());
      },
      Grammar(id, s, _open, rules, _close) {
        const grammarName = id.visit();
        decl = builder.newGrammar(grammarName);
        s.child(0) && s.child(0).visit();
        rules.children.map((c) => c.visit());
        const g = decl.build();
        g.source = this.source.trimmed();
        if (namespaceHas(namespace, grammarName)) {
          throw duplicateGrammarDeclaration(g, namespace);
        }
        namespace[grammarName] = g;
        return g;
      },
      SuperGrammar(_, n) {
        const superGrammarName = n.visit();
        if (superGrammarName === "null") {
          decl.withSuperGrammar(null);
        } else {
          if (!namespace || !namespaceHas(namespace, superGrammarName)) {
            throw undeclaredGrammar(superGrammarName, namespace, n.source);
          }
          decl.withSuperGrammar(namespace[superGrammarName]);
        }
      },
      Rule_define(n, fs, d, _, b) {
        currentRuleName = n.visit();
        currentRuleFormals = fs.children.map((c) => c.visit())[0] || [];
        if (!decl.defaultStartRule && decl.ensureSuperGrammar() !== Grammar.ProtoBuiltInRules) {
          decl.withDefaultStartRule(currentRuleName);
        }
        const body = b.visit();
        const description = d.children.map((c) => c.visit())[0];
        const source = this.source.trimmed();
        return decl.define(currentRuleName, currentRuleFormals, body, description, source);
      },
      Rule_override(n, fs, _, b) {
        currentRuleName = n.visit();
        currentRuleFormals = fs.children.map((c) => c.visit())[0] || [];
        const source = this.source.trimmed();
        decl.ensureSuperGrammarRuleForOverriding(currentRuleName, source);
        overriding = true;
        const body = b.visit();
        overriding = false;
        return decl.override(currentRuleName, currentRuleFormals, body, null, source);
      },
      Rule_extend(n, fs, _, b) {
        currentRuleName = n.visit();
        currentRuleFormals = fs.children.map((c) => c.visit())[0] || [];
        const body = b.visit();
        const source = this.source.trimmed();
        return decl.extend(currentRuleName, currentRuleFormals, body, null, source);
      },
      RuleBody(_, terms) {
        return builder.alt(...terms.visit()).withSource(this.source);
      },
      OverrideRuleBody(_, terms) {
        const args = terms.visit();
        const expansionPos = args.indexOf(superSplicePlaceholder);
        if (expansionPos >= 0) {
          const beforeTerms = args.slice(0, expansionPos);
          const afterTerms = args.slice(expansionPos + 1);
          afterTerms.forEach((t) => {
            if (t === superSplicePlaceholder) throw multipleSuperSplices(t);
          });
          return new Splice(
            decl.superGrammar,
            currentRuleName,
            beforeTerms,
            afterTerms
          ).withSource(this.source);
        } else {
          return builder.alt(...args).withSource(this.source);
        }
      },
      Formals(opointy, fs, cpointy) {
        return fs.visit();
      },
      Params(opointy, ps, cpointy) {
        return ps.visit();
      },
      Alt(seqs) {
        return builder.alt(...seqs.visit()).withSource(this.source);
      },
      TopLevelTerm_inline(b, n) {
        const inlineRuleName = currentRuleName + "_" + n.visit();
        const body = b.visit();
        const source = this.source.trimmed();
        const isNewRuleDeclaration = !(decl.superGrammar && decl.superGrammar.rules[inlineRuleName]);
        if (overriding && !isNewRuleDeclaration) {
          decl.override(inlineRuleName, currentRuleFormals, body, null, source);
        } else {
          decl.define(inlineRuleName, currentRuleFormals, body, null, source);
        }
        const params = currentRuleFormals.map((formal) => builder.app(formal));
        return builder.app(inlineRuleName, params).withSource(body.source);
      },
      OverrideTopLevelTerm_superSplice(_) {
        return superSplicePlaceholder;
      },
      Seq(expr) {
        return builder.seq(...expr.children.map((c) => c.visit())).withSource(this.source);
      },
      Iter_star(x, _) {
        return builder.star(x.visit()).withSource(this.source);
      },
      Iter_plus(x, _) {
        return builder.plus(x.visit()).withSource(this.source);
      },
      Iter_opt(x, _) {
        return builder.opt(x.visit()).withSource(this.source);
      },
      Pred_not(_, x) {
        return builder.not(x.visit()).withSource(this.source);
      },
      Pred_lookahead(_, x) {
        return builder.lookahead(x.visit()).withSource(this.source);
      },
      Lex_lex(_, x) {
        return builder.lex(x.visit()).withSource(this.source);
      },
      Base_application(rule, ps) {
        const params = ps.children.map((c) => c.visit())[0] || [];
        return builder.app(rule.visit(), params).withSource(this.source);
      },
      Base_range(from, _, to) {
        return builder.range(from.visit(), to.visit()).withSource(this.source);
      },
      Base_terminal(expr) {
        return builder.terminal(expr.visit()).withSource(this.source);
      },
      Base_paren(open, x, close) {
        return x.visit();
      },
      ruleDescr(open, t, close) {
        return t.visit();
      },
      ruleDescrText(_) {
        return this.sourceString.trim();
      },
      caseName(_, space1, n, space2, end2) {
        return n.visit();
      },
      name(first, rest) {
        return this.sourceString;
      },
      nameFirst(expr) {
      },
      nameRest(expr) {
      },
      terminal(open, cs, close) {
        return cs.children.map((c) => c.visit()).join("");
      },
      oneCharTerminal(open, c, close) {
        return c.visit();
      },
      escapeChar(c) {
        try {
          return unescapeCodePoint(this.sourceString);
        } catch (err) {
          if (err instanceof RangeError && err.message.startsWith("Invalid code point ")) {
            throw invalidCodePoint(c);
          }
          throw err;
        }
      },
      NonemptyListOf(x, _, xs) {
        return [x.visit()].concat(xs.children.map((c) => c.visit()));
      },
      EmptyListOf() {
        return [];
      },
      _terminal() {
        return this.sourceString;
      }
    });
    return helpers(match).visit();
  }

  // node_modules/ohm-js/dist/operations-and-attributes.js
  var operations_and_attributes_default = makeRecipe(["grammar", { "source": 'OperationsAndAttributes {\n\n  AttributeSignature =\n    name\n\n  OperationSignature =\n    name Formals?\n\n  Formals\n    = "(" ListOf<name, ","> ")"\n\n  name  (a name)\n    = nameFirst nameRest*\n\n  nameFirst\n    = "_"\n    | letter\n\n  nameRest\n    = "_"\n    | alnum\n\n}' }, "OperationsAndAttributes", null, "AttributeSignature", { "AttributeSignature": ["define", { "sourceInterval": [29, 58] }, null, [], ["app", { "sourceInterval": [54, 58] }, "name", []]], "OperationSignature": ["define", { "sourceInterval": [62, 100] }, null, [], ["seq", { "sourceInterval": [87, 100] }, ["app", { "sourceInterval": [87, 91] }, "name", []], ["opt", { "sourceInterval": [92, 100] }, ["app", { "sourceInterval": [92, 99] }, "Formals", []]]]], "Formals": ["define", { "sourceInterval": [104, 143] }, null, [], ["seq", { "sourceInterval": [118, 143] }, ["terminal", { "sourceInterval": [118, 121] }, "("], ["app", { "sourceInterval": [122, 139] }, "ListOf", [["app", { "sourceInterval": [129, 133] }, "name", []], ["terminal", { "sourceInterval": [135, 138] }, ","]]], ["terminal", { "sourceInterval": [140, 143] }, ")"]]], "name": ["define", { "sourceInterval": [147, 187] }, "a name", [], ["seq", { "sourceInterval": [168, 187] }, ["app", { "sourceInterval": [168, 177] }, "nameFirst", []], ["star", { "sourceInterval": [178, 187] }, ["app", { "sourceInterval": [178, 186] }, "nameRest", []]]]], "nameFirst": ["define", { "sourceInterval": [191, 223] }, null, [], ["alt", { "sourceInterval": [207, 223] }, ["terminal", { "sourceInterval": [207, 210] }, "_"], ["app", { "sourceInterval": [217, 223] }, "letter", []]]], "nameRest": ["define", { "sourceInterval": [227, 257] }, null, [], ["alt", { "sourceInterval": [242, 257] }, ["terminal", { "sourceInterval": [242, 245] }, "_"], ["app", { "sourceInterval": [252, 257] }, "alnum", []]]] }]);

  // node_modules/ohm-js/src/semanticsDeferredInit.js
  initBuiltInSemantics(Grammar.BuiltInRules);
  initPrototypeParser(operations_and_attributes_default);
  function initBuiltInSemantics(builtInRules) {
    const actions = {
      empty() {
        return this.iteration();
      },
      nonEmpty(first, _, rest) {
        return this.iteration([first].concat(rest.children));
      },
      self(..._children) {
        return this;
      }
    };
    Semantics.BuiltInSemantics = Semantics.createSemantics(builtInRules, null).addOperation(
      "asIteration",
      {
        emptyListOf: actions.empty,
        nonemptyListOf: actions.nonEmpty,
        EmptyListOf: actions.empty,
        NonemptyListOf: actions.nonEmpty,
        _iter: actions.self
      }
    );
  }
  function initPrototypeParser(grammar2) {
    Semantics.prototypeGrammarSemantics = grammar2.createSemantics().addOperation("parse", {
      AttributeSignature(name) {
        return {
          name: name.parse(),
          formals: []
        };
      },
      OperationSignature(name, optFormals) {
        return {
          name: name.parse(),
          formals: optFormals.children.map((c) => c.parse())[0] || []
        };
      },
      Formals(oparen, fs, cparen) {
        return fs.asIteration().children.map((c) => c.parse());
      },
      name(first, rest) {
        return this.sourceString;
      }
    });
    Semantics.prototypeGrammar = grammar2;
  }

  // node_modules/ohm-js/src/findIndentation.js
  function findIndentation(input) {
    let pos = 0;
    const stack = [0];
    const topOfStack = () => stack[stack.length - 1];
    const result = {};
    const regex = /( *).*(?:$|\r?\n|\r)/g;
    let match;
    while ((match = regex.exec(input)) != null) {
      const [line, indent] = match;
      if (line.length === 0) break;
      const indentSize = indent.length;
      const prevSize = topOfStack();
      const indentPos = pos + indentSize;
      if (indentSize > prevSize) {
        stack.push(indentSize);
        result[indentPos] = 1;
      } else if (indentSize < prevSize) {
        const prevLength = stack.length;
        while (topOfStack() !== indentSize) {
          stack.pop();
        }
        result[indentPos] = -1 * (prevLength - stack.length);
      }
      pos += line.length;
    }
    if (stack.length > 1) {
      result[pos] = 1 - stack.length;
    }
    return result;
  }

  // node_modules/ohm-js/src/IndentationSensitive.js
  var INDENT_DESCRIPTION = "an indented block";
  var DEDENT_DESCRIPTION = "a dedent";
  var INVALID_CODE_POINT = 1114111 + 1;
  var InputStreamWithIndentation = class extends InputStream {
    constructor(state) {
      super(state.input);
      this.state = state;
    }
    _indentationAt(pos) {
      return this.state.userData[pos] || 0;
    }
    atEnd() {
      return super.atEnd() && this._indentationAt(this.pos) === 0;
    }
    next() {
      if (this._indentationAt(this.pos) !== 0) {
        this.examinedLength = Math.max(this.examinedLength, this.pos);
        return void 0;
      }
      return super.next();
    }
    nextCharCode() {
      if (this._indentationAt(this.pos) !== 0) {
        this.examinedLength = Math.max(this.examinedLength, this.pos);
        return INVALID_CODE_POINT;
      }
      return super.nextCharCode();
    }
    nextCodePoint() {
      if (this._indentationAt(this.pos) !== 0) {
        this.examinedLength = Math.max(this.examinedLength, this.pos);
        return INVALID_CODE_POINT;
      }
      return super.nextCodePoint();
    }
  };
  var Indentation = class extends PExpr {
    constructor(isIndent = true) {
      super();
      this.isIndent = isIndent;
    }
    allowsSkippingPrecedingSpace() {
      return true;
    }
    eval(state) {
      const { inputStream } = state;
      const pseudoTokens = state.userData;
      state.doNotMemoize = true;
      const origPos = inputStream.pos;
      const sign = this.isIndent ? 1 : -1;
      const count = (pseudoTokens[origPos] || 0) * sign;
      if (count > 0) {
        state.userData = Object.create(pseudoTokens);
        state.userData[origPos] -= sign;
        state.pushBinding(new TerminalNode(0), origPos);
        return true;
      } else {
        state.processFailure(origPos, this);
        return false;
      }
    }
    getArity() {
      return 1;
    }
    _assertAllApplicationsAreValid(ruleName, grammar2) {
    }
    _isNullable(grammar2, memo) {
      return false;
    }
    assertChoicesHaveUniformArity(ruleName) {
    }
    assertIteratedExprsAreNotNullable(grammar2) {
    }
    introduceParams(formals) {
      return this;
    }
    substituteParams(actuals) {
      return this;
    }
    toString() {
      return this.isIndent ? "indent" : "dedent";
    }
    toDisplayString() {
      return this.toString();
    }
    toFailure(grammar2) {
      const description = this.isIndent ? INDENT_DESCRIPTION : DEDENT_DESCRIPTION;
      return new Failure(this, description, "description");
    }
  };
  var applyIndent = new Apply("indent");
  var applyDedent = new Apply("dedent");
  var newAnyBody = new Splice(built_in_rules_default, "any", [applyIndent, applyDedent], []);
  var IndentationSensitive = new Builder().newGrammar("IndentationSensitive").withSuperGrammar(built_in_rules_default).define("indent", [], new Indentation(true), INDENT_DESCRIPTION, void 0, true).define("dedent", [], new Indentation(false), DEDENT_DESCRIPTION, void 0, true).extend("any", [], newAnyBody, "any character", void 0).build();
  Object.assign(IndentationSensitive, {
    _matchStateInitializer(state) {
      state.userData = findIndentation(state.input);
      state.inputStream = new InputStreamWithIndentation(state);
    },
    supportsIncrementalParsing: false
  });

  // node_modules/ohm-js/src/main.js
  Grammar.initApplicationParser(ohm_grammar_default, buildGrammar2);
  var isBuffer = (obj) => !!obj.constructor && typeof obj.constructor.isBuffer === "function" && obj.constructor.isBuffer(obj);
  function compileAndLoad(source, namespace, buildOptions) {
    const m = ohm_grammar_default.match(source, "Grammars");
    if (m.failed()) {
      throw grammarSyntaxError(m);
    }
    return buildGrammar2(m, namespace, void 0, buildOptions);
  }
  function _grammars(source, optNamespace, buildOptions) {
    const ns = Object.create(optNamespace || {});
    if (typeof source !== "string") {
      if (isBuffer(source)) {
        source = source.toString();
      } else {
        throw new TypeError(
          "Expected string as first argument, got " + unexpectedObjToString(source)
        );
      }
    }
    compileAndLoad(source, ns, buildOptions);
    return ns;
  }
  function grammars(source, optNamespace) {
    return _grammars(source, optNamespace);
  }

  // js/frontend/base_grammar.js
  var BASE_GRAMMAR_SRC = `
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

  // js/frontend/java_grammar.js
  var JAVA_GRAMMAR_SRC = `
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

  // js/frontend/c_grammar.js
  var C_GRAMMAR_SRC = `
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

  // js/frontend/semantics.js
  function createASTSemantics(grammar2) {
    const semantics = grammar2.createSemantics();
    semantics.addOperation("toAST", {
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
        return { type: "Program", body };
      },
      TopLevel(child) {
        return child.toAST();
      },
      ClassDecl(modifiers, _class, name, _extends, superName, _implements, interfaces, _open, members, _close) {
        return {
          type: "ClassDeclaration",
          name: name.sourceString,
          modifiers: modifiers.children.map((m) => m.sourceString),
          body: members.children.map((m) => m.toAST())
        };
      },
      Member(child) {
        return child.toAST();
      },
      MethodDecl(modifiers, returnType, name, _open, params, _close, _throws, body) {
        return {
          type: "FunctionDeclaration",
          name: name.sourceString,
          modifiers: modifiers.children.map((m) => m.sourceString),
          returnType: returnType.sourceString,
          params: params.asIteration().children.map((p) => p.toAST()),
          body: body.toAST()
        };
      },
      FieldDecl(modifiers, varDecl) {
        const decl = varDecl.toAST();
        decl.modifiers = modifiers.children.map((m) => m.sourceString);
        return decl;
      },
      FnDecl(returnType, name, _open, params, _close, body) {
        return {
          type: "FunctionDeclaration",
          name: name.sourceString,
          returnType: returnType.sourceString,
          params: params.asIteration().children.map((p) => p.toAST()),
          body: body.toAST()
        };
      },
      Param(type, name) {
        return {
          type: "Identifier",
          name: name.sourceString,
          declaredType: type.sourceString
        };
      },
      Block(_open, statements, _close) {
        return statements.children.map((s) => s.toAST());
      },
      IfStmt(_if, _open, test, _close, consequent, _else, alternate) {
        const consAst = consequent.toAST();
        const altAst = alternate.children.length > 0 ? alternate.children[0].toAST() : null;
        return {
          type: "IfStatement",
          test: test.toAST(),
          consequent: Array.isArray(consAst) ? consAst : [consAst],
          alternate: altAst ? Array.isArray(altAst) ? altAst : [altAst] : null
        };
      },
      WhileStmt(_while, _open, test, _close, body) {
        const bodyAst = body.toAST();
        return {
          type: "WhileStatement",
          test: test.toAST(),
          body: Array.isArray(bodyAst) ? bodyAst : [bodyAst]
        };
      },
      ForStmt(_for, _open, init, test, _semi2, update, _close, body) {
        const bodyAst = body.toAST();
        return {
          type: "ForStatement",
          init: init.sourceString === ";" ? null : init.toAST(),
          condition: test.children.length > 0 ? test.children[0].toAST() : null,
          update: update.children.length > 0 ? update.children[0].toAST() : null,
          body: Array.isArray(bodyAst) ? bodyAst : [bodyAst]
        };
      },
      ReturnStmt(_ret, expr, _semi) {
        return {
          type: "ReturnStatement",
          argument: expr.children.length > 0 ? expr.children[0].toAST() : null
        };
      },
      VarDecl(type, name, _eq, expr, _semi) {
        return {
          type: "VariableDeclarationStatement",
          name: name.sourceString,
          declaredType: type.sourceString,
          expression: expr.children.length > 0 ? expr.children[0].toAST() : null
        };
      },
      ExprStmt(expr, _semi) {
        return {
          type: "ExpressionStatement",
          expression: expr.toAST()
        };
      },
      // Expressions
      AssignExp_assign(target, op, value) {
        return {
          type: "BinaryExpression",
          operator: op.sourceString,
          left: target.toAST(),
          right: value.toAST()
        };
      },
      OrExp_or(left, op, right) {
        return {
          type: "BinaryExpression",
          operator: op.sourceString === "or" ? "||" : op.sourceString,
          left: left.toAST(),
          right: right.toAST()
        };
      },
      AndExp_and(left, op, right) {
        return {
          type: "BinaryExpression",
          operator: op.sourceString === "and" ? "&&" : op.sourceString,
          left: left.toAST(),
          right: right.toAST()
        };
      },
      BitOrExp_bitor(left, op, right) {
        return { type: "BinaryExpression", operator: "|", left: left.toAST(), right: right.toAST() };
      },
      BitXorExp_bitxor(left, op, right) {
        return { type: "BinaryExpression", operator: "^", left: left.toAST(), right: right.toAST() };
      },
      BitAndExp_bitand(left, op, right) {
        return { type: "BinaryExpression", operator: "&", left: left.toAST(), right: right.toAST() };
      },
      EqExp_eq(left, op, right) {
        return { type: "BinaryExpression", operator: op.sourceString, left: left.toAST(), right: right.toAST() };
      },
      RelExp_rel(left, op, right) {
        return { type: "BinaryExpression", operator: op.sourceString, left: left.toAST(), right: right.toAST() };
      },
      ShiftExp_shift(left, op, right) {
        return { type: "BinaryExpression", operator: op.sourceString, left: left.toAST(), right: right.toAST() };
      },
      AddExp_add(left, op, right) {
        return { type: "BinaryExpression", operator: op.sourceString, left: left.toAST(), right: right.toAST() };
      },
      MulExp_mul(left, op, right) {
        return { type: "BinaryExpression", operator: op.sourceString, left: left.toAST(), right: right.toAST() };
      },
      UnaryExp_not(op, arg) {
        return { type: "UnaryExpression", operator: "!", argument: arg.toAST() };
      },
      UnaryExp_neg(_op, arg) {
        return { type: "UnaryExpression", operator: "-", argument: arg.toAST() };
      },
      UnaryExp_bitnot(_op, arg) {
        return { type: "UnaryExpression", operator: "~", argument: arg.toAST() };
      },
      UnaryExp_preinc(op, arg) {
        return { type: "UpdateExpression", operator: op.sourceString, argument: arg.toAST(), prefix: true };
      },
      PostfixExp_postinc(arg, op) {
        return { type: "UpdateExpression", operator: op.sourceString, argument: arg.toAST(), prefix: false };
      },
      PostfixExp_call(callee, _open, args, _close) {
        return {
          type: "CallExpression",
          callee: callee.toAST(),
          arguments: args.asIteration().children.map((a) => a.toAST())
        };
      },
      PostfixExp_index(object, _open, index, _close) {
        return {
          type: "IndexExpression",
          object: object.toAST(),
          index: index.toAST()
        };
      },
      PostfixExp_member(object, _dot, prop) {
        return {
          type: "MemberExpression",
          object: object.toAST(),
          property: { type: "Identifier", name: prop.sourceString }
        };
      },
      PrimaryExp_paren(_open, expr, _close) {
        return expr.toAST();
      },
      PrimaryExp_list(_open, items, _close) {
        return {
          type: "ArrayExpression",
          elements: items.asIteration().children.map((i) => i.toAST())
        };
      },
      PrimaryExp_true(_) {
        return { type: "Literal", value: true };
      },
      PrimaryExp_false(_) {
        return { type: "Literal", value: false };
      },
      PrimaryExp_null(_) {
        return { type: "Literal", value: null };
      },
      number(_) {
        return { type: "Literal", value: Number(this.sourceString) };
      },
      string(_open, _chars, _close) {
        try {
          return { type: "Literal", value: JSON.parse(this.sourceString) };
        } catch {
          return { type: "Literal", value: this.sourceString.slice(1, -1) };
        }
      },
      ident(_first, _rest) {
        return { type: "Identifier", name: this.sourceString };
      }
    });
    return semantics;
  }

  // js/frontend/c_semantics.js
  function createCSemantics(grammar2) {
    const s = grammar2.createSemantics();
    s.addOperation("toAST()", {
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
        return { type: "Program", body };
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
          type: "CMethodTable",
          name: name.sourceString,
          entries: entries.asIteration().children.map((e) => e.toAST()).filter(Boolean)
        };
      },
      MethodEntry(_b1, name, _c1, fnName, _c2, flags, _c3, doc, _b2) {
        if (name.sourceString === "NULL") return null;
        return {
          name: JSON.parse(name.sourceString),
          cFunction: fnName.sourceString,
          flags: flags.sourceString,
          doc: doc.sourceString === "NULL" ? "" : JSON.parse(doc.sourceString)
        };
      },
      CFunction(_st, _type, name, _op, params, _cp, body) {
        const fnName = name.sourceString;
        const rawStmts = body.toAST();
        let extractedParams = [];
        const filteredStmts = [];
        for (const stmt of rawStmts) {
          if (stmt.type === "IfStatement" && stmt.test && stmt.test.type === "UnaryExpression" && stmt.test.argument && stmt.test.argument.type === "CallExpression" && stmt.test.argument.callee.name === "PyArg_ParseTuple") {
            const callArgs = stmt.test.argument.arguments;
            for (let i = 2; i < callArgs.length; i++) {
              const arg = callArgs[i];
              if (arg.type === "AddressOf") {
                extractedParams.push(arg.argument.name);
              } else if (arg.type === "Identifier") {
                extractedParams.push(arg.name);
              }
            }
            continue;
          }
          filteredStmts.push(stmt);
        }
        const cleanStmts = [];
        for (const stmt of filteredStmts) {
          if (stmt.type === "VariableDeclarationStatement" && extractedParams.includes(stmt.name) && !stmt.expression) {
            continue;
          }
          cleanStmts.push(stmt);
        }
        return {
          type: "FunctionDeclaration",
          name: fnName,
          params: extractedParams.length > 0 ? extractedParams : params.asIteration().children.map((p) => p.toAST()),
          body: cleanStmts
        };
      },
      Param(type, name) {
        return { type: "Identifier", name: name.sourceString };
      },
      Statement(child) {
        return child.toAST();
      },
      Block(_ob, stmts, _cb) {
        const res = [];
        for (const s2 of stmts.children) {
          const ast = s2.toAST();
          if (Array.isArray(ast)) res.push(...ast);
          else if (ast) res.push(ast);
        }
        return res;
      },
      VarDecl(type, inits, _semi) {
        return inits.asIteration().children.map((i) => i.toAST());
      },
      VarInit(name, _eq, val) {
        return {
          type: "VariableDeclarationStatement",
          name: name.sourceString,
          expression: val.children.length > 0 ? val.children[0].toAST() : null
        };
      },
      IfStmt(_if, _op, test, _cp, cons, _el, alt) {
        const consAst = cons.toAST();
        return {
          type: "IfStatement",
          test: test.toAST(),
          consequent: Array.isArray(consAst) ? consAst : [consAst],
          alternate: alt.children.length > 0 ? Array.isArray(alt.children[0].toAST()) ? alt.children[0].toAST() : [alt.children[0].toAST()] : null
        };
      },
      WhileStmt(_while, _op, test, _cp, body) {
        const bodyAst = body.toAST();
        return {
          type: "WhileStatement",
          test: test.toAST(),
          body: Array.isArray(bodyAst) ? bodyAst : [bodyAst]
        };
      },
      ForStmt(_for, _op, init, test, _s2, upd, _cp, body) {
        const bodyAst = body.toAST();
        return {
          type: "ForStatement",
          init: init.sourceString === ";" ? null : Array.isArray(init.toAST()) ? init.toAST()[0] : init.toAST(),
          condition: test.children.length > 0 ? test.children[0].toAST() : null,
          update: upd.children.length > 0 ? upd.children[0].toAST() : null,
          body: Array.isArray(bodyAst) ? bodyAst : [bodyAst]
        };
      },
      ReturnStmt(_ret, expr, _semi) {
        let arg = expr.children.length > 0 ? expr.children[0].toAST() : null;
        if (arg && arg.type === "CallExpression" && (arg.callee.name === "PyLong_FromLong" || arg.callee.name === "PyFloat_FromDouble" || arg.callee.name === "Py_BuildValue")) {
          arg = arg.arguments.length === 1 ? arg.arguments[0] : arg.arguments[1];
        }
        return {
          type: "ReturnStatement",
          argument: arg
        };
      },
      ExprStmt(exp, _semi) {
        return {
          type: "ExpressionStatement",
          expression: exp.toAST()
        };
      },
      UnaryExp_addressof(_amp, exp) {
        return { type: "AddressOf", argument: exp.toAST() };
      },
      UnaryExp_deref(_star, exp) {
        return { type: "Deref", argument: exp.toAST() };
      },
      PrimaryExp_c_null(_kw) {
        return { type: "Literal", value: null };
      },
      // Expressions
      AssignExp_assign(target, op, value) {
        return { type: "BinaryExpression", operator: op.sourceString, left: target.toAST(), right: value.toAST() };
      },
      OrExp_or(left, op, right) {
        return { type: "BinaryExpression", operator: op.sourceString, left: left.toAST(), right: right.toAST() };
      },
      AndExp_and(left, op, right) {
        return { type: "BinaryExpression", operator: op.sourceString, left: left.toAST(), right: right.toAST() };
      },
      BitOrExp_bitor(left, op, right) {
        return { type: "BinaryExpression", operator: op.sourceString, left: left.toAST(), right: right.toAST() };
      },
      BitXorExp_bitxor(left, op, right) {
        return { type: "BinaryExpression", operator: op.sourceString, left: left.toAST(), right: right.toAST() };
      },
      BitAndExp_bitand(left, op, right) {
        return { type: "BinaryExpression", operator: op.sourceString, left: left.toAST(), right: right.toAST() };
      },
      EqExp_eq(left, op, right) {
        return { type: "BinaryExpression", operator: op.sourceString, left: left.toAST(), right: right.toAST() };
      },
      RelExp_rel(left, op, right) {
        return { type: "BinaryExpression", operator: op.sourceString, left: left.toAST(), right: right.toAST() };
      },
      ShiftExp_shift(left, op, right) {
        return { type: "BinaryExpression", operator: op.sourceString, left: left.toAST(), right: right.toAST() };
      },
      AddExp_add(left, op, right) {
        return { type: "BinaryExpression", operator: op.sourceString, left: left.toAST(), right: right.toAST() };
      },
      MulExp_mul(left, op, right) {
        return { type: "BinaryExpression", operator: op.sourceString, left: left.toAST(), right: right.toAST() };
      },
      UnaryExp_not(op, arg) {
        return { type: "UnaryExpression", operator: "!", argument: arg.toAST() };
      },
      UnaryExp_neg(_op, arg) {
        return { type: "UnaryExpression", operator: "-", argument: arg.toAST() };
      },
      UnaryExp_bitnot(_op, arg) {
        return { type: "UnaryExpression", operator: "~", argument: arg.toAST() };
      },
      UnaryExp_preinc(op, arg) {
        return { type: "UpdateExpression", operator: op.sourceString, argument: arg.toAST(), prefix: true };
      },
      PostfixExp_postinc(arg, op) {
        return { type: "UpdateExpression", operator: op.sourceString, argument: arg.toAST(), prefix: false };
      },
      PostfixExp_call(callee, _open, args, _close) {
        return {
          type: "CallExpression",
          callee: callee.toAST(),
          arguments: args.asIteration().children.map((a) => a.toAST())
        };
      },
      PostfixExp_index(object, _open, index, _close) {
        return { type: "IndexExpression", object: object.toAST(), index: index.toAST() };
      },
      PostfixExp_member(object, _dot, prop) {
        return { type: "MemberExpression", object: object.toAST(), property: { type: "Identifier", name: prop.sourceString } };
      },
      number(_) {
        return { type: "Literal", value: Number(this.sourceString) };
      },
      string(_open, _chars, _close) {
        try {
          return { type: "Literal", value: JSON.parse(this.sourceString) };
        } catch {
          return { type: "Literal", value: this.sourceString.slice(1, -1) };
        }
      },
      PrimaryExp_true(_) {
        return { type: "Literal", value: true };
      },
      PrimaryExp_false(_) {
        return { type: "Literal", value: false };
      },
      PrimaryExp_null(_) {
        return { type: "Literal", value: null };
      },
      PrimaryExp_paren(_ob, e, _cb) {
        return e.toAST();
      },
      PrimaryExp_list(_ob, items, _cb) {
        return { type: "ArrayExpression", elements: items.asIteration().children.map((i) => i.toAST()) };
      },
      ident(_head, _tail) {
        return { type: "Identifier", name: this.sourceString };
      }
    });
    return s;
  }

  // js/frontend/python_grammar.js
  var PYTHON_GRAMMAR_SRC = `
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

  // js/frontend/python_semantics.js
  var forCounter = 0;
  function instrumentBreaks(stmts, breakAction) {
    if (!stmts) return [];
    const list = Array.isArray(stmts) ? stmts : [stmts];
    const res = [];
    for (const s of list) {
      if (!s) continue;
      if (s.type === "BreakStatement") {
        res.push(...breakAction);
        res.push(s);
      } else if (s.type === "IfStatement") {
        res.push({
          ...s,
          consequent: instrumentBreaks(s.consequent, breakAction),
          alternate: s.alternate ? instrumentBreaks(s.alternate, breakAction) : null
        });
      } else if (s.type === "WhileStatement" || s.type === "ForStatement" || s.type === "FunctionDeclaration") {
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
    if (targets.length === 1 && targets[0].type === "Identifier") {
      extractStmts.push({
        type: "VariableDeclarationStatement",
        name: targets[0].name,
        expression: {
          type: "IndexExpression",
          object: { type: "Identifier", name: tempIter },
          index: { type: "Identifier", name: tempIdx }
        }
      });
    } else {
      const tempItem = `__item_${id}`;
      extractStmts.push({
        type: "VariableDeclarationStatement",
        name: tempItem,
        expression: {
          type: "IndexExpression",
          object: { type: "Identifier", name: tempIter },
          index: { type: "Identifier", name: tempIdx }
        }
      });
      for (let i = 0; i < targets.length; i++) {
        const t = targets[i];
        const name = t.name || (t.type === "Identifier" ? t.name : `__var_${i}`);
        extractStmts.push({
          type: "VariableDeclarationStatement",
          name,
          expression: {
            type: "IndexExpression",
            object: { type: "Identifier", name: tempItem },
            index: { type: "Literal", value: i }
          }
        });
      }
    }
    let finalBody = Array.isArray(loopBodyAst) ? loopBodyAst : [loopBodyAst];
    if (elseBodyAst) {
      finalBody = instrumentBreaks(finalBody, [
        {
          type: "ExpressionStatement",
          expression: {
            type: "BinaryExpression",
            operator: "=",
            left: { type: "Identifier", name: tempCompleted },
            right: { type: "Literal", value: false }
          }
        }
      ]);
    }
    const loopResult = [
      {
        type: "VariableDeclarationStatement",
        name: tempIter,
        expression: iterAst
      },
      {
        type: "VariableDeclarationStatement",
        name: tempIdx,
        expression: { type: "Literal", value: 0 }
      }
    ];
    if (elseBodyAst) {
      loopResult.push({
        type: "VariableDeclarationStatement",
        name: tempCompleted,
        expression: { type: "Literal", value: true }
      });
    }
    loopResult.push({
      type: "WhileStatement",
      test: {
        type: "BinaryExpression",
        operator: "<",
        left: { type: "Identifier", name: tempIdx },
        right: {
          type: "CallExpression",
          callee: { type: "Identifier", name: "len" },
          arguments: [{ type: "Identifier", name: tempIter }]
        }
      },
      body: [
        ...extractStmts,
        ...finalBody,
        {
          type: "ExpressionStatement",
          expression: {
            type: "BinaryExpression",
            operator: "=",
            left: { type: "Identifier", name: tempIdx },
            right: {
              type: "BinaryExpression",
              operator: "+",
              left: { type: "Identifier", name: tempIdx },
              right: { type: "Literal", value: 1 }
            }
          }
        }
      ]
    });
    if (elseBodyAst) {
      loopResult.push({
        type: "IfStatement",
        test: { type: "Identifier", name: tempCompleted },
        consequent: Array.isArray(elseBodyAst) ? elseBodyAst : [elseBodyAst],
        alternate: null
      });
    }
    return loopResult;
  }
  function hasYield(ast) {
    if (!ast) return false;
    if (Array.isArray(ast)) return ast.some(hasYield);
    if (ast.type === "YieldStatement" || ast.type === "YieldExpression") return true;
    if (ast.type === "FunctionDeclaration" || ast.type === "FunctionExpression") return false;
    for (const k of Object.keys(ast)) {
      if (typeof ast[k] === "object" && hasYield(ast[k])) return true;
    }
    return false;
  }
  function transformYieldsInStmts(stmts, yieldListVar) {
    const result = [];
    const list = Array.isArray(stmts) ? stmts : [stmts];
    for (const s of list) {
      if (!s) continue;
      if (s.type === "YieldStatement" || s.type === "YieldExpression") {
        if (s.delegate) {
          result.push(...desugarForLoop(
            [{ type: "Identifier", name: "__yield_item" }],
            s.argument,
            [{
              type: "ExpressionStatement",
              expression: {
                type: "CallExpression",
                callee: {
                  type: "MemberExpression",
                  object: { type: "Identifier", name: yieldListVar },
                  property: { type: "Identifier", name: "append" }
                },
                arguments: [{ type: "Identifier", name: "__yield_item" }]
              }
            }]
          ));
        } else {
          result.push({
            type: "ExpressionStatement",
            expression: {
              type: "CallExpression",
              callee: {
                type: "MemberExpression",
                object: { type: "Identifier", name: yieldListVar },
                property: { type: "Identifier", name: "append" }
              },
              arguments: s.argument ? [s.argument] : [{ type: "Literal", value: null }]
            }
          });
        }
      } else if (s.type === "IfStatement") {
        result.push({
          ...s,
          consequent: transformYieldsInStmts(s.consequent, yieldListVar),
          alternate: s.alternate ? transformYieldsInStmts(s.alternate, yieldListVar) : null
        });
      } else if (s.type === "WhileStatement" || s.type === "ForStatement") {
        result.push({
          ...s,
          body: transformYieldsInStmts(s.body, yieldListVar)
        });
      } else if (s.type === "TryStatement") {
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
        type: "VariableDeclarationStatement",
        name: ctxVar,
        expression: exprAst
      }
    ];
    const enterCall = {
      type: "CallExpression",
      callee: {
        type: "MemberExpression",
        object: { type: "Identifier", name: ctxVar },
        property: { type: "Identifier", name: "__enter__" }
      },
      arguments: []
    };
    if (targetAst) {
      const targetName = targetAst.name || (targetAst.type === "Identifier" ? targetAst.name : Array.isArray(targetAst) && targetAst[0] ? targetAst[0].name || targetAst[0] : `__var_${id}`);
      stmts.push({
        type: "VariableDeclarationStatement",
        name: targetName,
        expression: enterCall
      });
    } else {
      stmts.push({
        type: "ExpressionStatement",
        expression: enterCall
      });
    }
    const exitCall = {
      type: "CallExpression",
      callee: {
        type: "MemberExpression",
        object: { type: "Identifier", name: ctxVar },
        property: { type: "Identifier", name: "__exit__" }
      },
      arguments: [
        { type: "Literal", value: null },
        { type: "Literal", value: null },
        { type: "Literal", value: null }
      ]
    };
    stmts.push({
      type: "TryStatement",
      block: Array.isArray(bodyAst) ? bodyAst : [bodyAst],
      handlers: [],
      finalizer: [
        {
          type: "ExpressionStatement",
          expression: exitCall
        }
      ]
    });
    return stmts;
  }
  function createPythonSemantics(grammar2) {
    const s = grammar2.createSemantics();
    s.addOperation("toAST()", {
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
        return { type: "Program", body };
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
        const decos = decorators.children.map((d) => d.toAST());
        let wrapped = { type: "Identifier", name: fnName };
        for (let i = decos.length - 1; i >= 0; i--) {
          wrapped = {
            type: "CallExpression",
            callee: decos[i],
            arguments: [wrapped]
          };
        }
        return [
          fnAst,
          {
            type: "ExpressionStatement",
            expression: {
              type: "BinaryExpression",
              operator: "=",
              left: { type: "Identifier", name: fnName },
              right: wrapped
            }
          }
        ];
      },
      DecoratedClass(decorators, classStmt) {
        const classAsts = classStmt.toAST();
        const list = Array.isArray(classAsts) ? classAsts : [classAsts];
        const constructorDecl = list.find((node) => node.type === "FunctionDeclaration");
        const className = constructorDecl ? constructorDecl.name : null;
        const decos = decorators.children.map((d) => d.toAST());
        let wrapped = { type: "Identifier", name: className };
        for (let i = decos.length - 1; i >= 0; i--) {
          wrapped = {
            type: "CallExpression",
            callee: decos[i],
            arguments: [wrapped]
          };
        }
        return [
          ...list,
          {
            type: "ExpressionStatement",
            expression: {
              type: "BinaryExpression",
              operator: "=",
              left: { type: "Identifier", name: className },
              right: wrapped
            }
          }
        ];
      },
      Param_kwrest(_stars, id) {
        return { type: "Identifier", name: id.sourceString, isKwRest: true };
      },
      Param_rest(_star, id) {
        return { type: "Identifier", name: id.sourceString, isRest: true };
      },
      Param_bare_star(_star) {
        return { type: "BareStar" };
      },
      Param_pos_only(_slash) {
        return { type: "PosOnly" };
      },
      Param_default(id, _eq, defaultExp) {
        return { type: "Identifier", name: id.sourceString, isRest: false, defaultValue: defaultExp.toAST() };
      },
      Param_normal(id) {
        return { type: "Identifier", name: id.sourceString, isRest: false };
      },
      DefStmt(_def, name, _op, params, _optComma, _cp, _colon, suite) {
        const bodyAst = suite.toAST();
        const rawParams = params.asIteration().children.map((p) => p.toAST());
        const filteredParams = rawParams.filter((p) => p && p.type !== "BareStar" && p.type !== "PosOnly");
        const bodyList = Array.isArray(bodyAst) ? bodyAst : [bodyAst];
        if (hasYield(bodyList)) {
          const yieldVar = `__yield_list_${name.sourceString}`;
          const transformedBody = [
            {
              type: "VariableDeclarationStatement",
              name: yieldVar,
              expression: { type: "ListLiteral", elements: [] }
            },
            ...transformYieldsInStmts(bodyList, yieldVar),
            {
              type: "ReturnStatement",
              argument: { type: "Identifier", name: yieldVar }
            }
          ];
          return {
            type: "FunctionDeclaration",
            name: name.sourceString,
            params: filteredParams,
            body: transformedBody
          };
        }
        return {
          type: "FunctionDeclaration",
          name: name.sourceString,
          params: filteredParams,
          body: bodyList
        };
      },
      ClassBase_kwarg(id, _eq, exp) {
        return { type: "KeywordArg", name: id.sourceString, value: exp.toAST() };
      },
      ClassBase_base(exp) {
        return exp.toAST();
      },
      ClassStmt(_kw, name, _ob, bases, _optComma, _cb, _colon, suite) {
        const className = name.sourceString;
        const baseAsts = bases.children.length > 0 ? bases.children[0].asIteration().children.map((b) => b.toAST()) : [];
        const baseClassExprs = baseAsts.filter((b) => b && b.type !== "KeywordArg");
        const bodyItems = suite.toAST();
        const itemsList = Array.isArray(bodyItems) ? bodyItems : [bodyItems];
        const methodDeclarations = [];
        const methodBindings = [];
        const classAttrAssignments = [];
        let initParams = null;
        let hasNew = false;
        for (const item of itemsList) {
          if (!item) continue;
          if (item.type === "FunctionDeclaration") {
            const originalName = item.name;
            const mangledName = `__class_${className}_${originalName}`;
            methodDeclarations.push({
              ...item,
              name: mangledName
            });
            methodBindings.push({
              type: "ExpressionStatement",
              expression: {
                type: "BinaryExpression",
                operator: "=",
                left: {
                  type: "MemberExpression",
                  object: { type: "Identifier", name: "self" },
                  property: { type: "Identifier", name: originalName }
                },
                right: {
                  type: "ObjectExpression",
                  properties: [
                    { key: { type: "Literal", value: "__is_bound__" }, value: { type: "Literal", value: true } },
                    { key: { type: "Literal", value: "self" }, value: { type: "Identifier", name: "self" } },
                    { key: { type: "Literal", value: "fn" }, value: { type: "Identifier", name: mangledName } }
                  ]
                }
              }
            });
            classAttrAssignments.push({
              type: "ExpressionStatement",
              expression: {
                type: "BinaryExpression",
                operator: "=",
                left: {
                  type: "MemberExpression",
                  object: { type: "Identifier", name: className },
                  property: { type: "Identifier", name: originalName }
                },
                right: { type: "Identifier", name: mangledName }
              }
            });
            if (originalName === "__init__") {
              initParams = item.params.slice(1);
            } else if (originalName === "__new__") {
              hasNew = true;
            }
          } else if (item.type === "VariableDeclarationStatement") {
            methodDeclarations.push(item);
            classAttrAssignments.push({
              type: "ExpressionStatement",
              expression: {
                type: "BinaryExpression",
                operator: "=",
                left: {
                  type: "MemberExpression",
                  object: { type: "Identifier", name: className },
                  property: { type: "Identifier", name: item.name }
                },
                right: { type: "Identifier", name: item.name }
              }
            });
            methodBindings.push({
              type: "ExpressionStatement",
              expression: {
                type: "BinaryExpression",
                operator: "=",
                left: {
                  type: "MemberExpression",
                  object: { type: "Identifier", name: "self" },
                  property: { type: "Identifier", name: item.name }
                },
                right: { type: "Identifier", name: item.name }
              }
            });
          } else if (item.type === "ExpressionStatement" && item.expression && item.expression.type === "BinaryExpression" && item.expression.operator === "=") {
            const target = item.expression.left;
            if (target && target.type === "Identifier") {
              methodDeclarations.push(item);
              classAttrAssignments.push({
                type: "ExpressionStatement",
                expression: {
                  type: "BinaryExpression",
                  operator: "=",
                  left: {
                    type: "MemberExpression",
                    object: { type: "Identifier", name: className },
                    property: { type: "Identifier", name: target.name }
                  },
                  right: { type: "Identifier", name: target.name }
                }
              });
              methodBindings.push({
                type: "ExpressionStatement",
                expression: {
                  type: "BinaryExpression",
                  operator: "=",
                  left: {
                    type: "MemberExpression",
                    object: { type: "Identifier", name: "self" },
                    property: { type: "Identifier", name: target.name }
                  },
                  right: { type: "Identifier", name: target.name }
                }
              });
            } else {
              methodDeclarations.push(item);
            }
          } else {
            methodDeclarations.push(item);
          }
        }
        const constructorBody = [];
        if (hasNew) {
          constructorBody.push({
            type: "ReturnStatement",
            argument: {
              type: "CallExpression",
              callee: {
                type: "Identifier",
                name: `__class_${className}___new__`
              },
              arguments: [
                { type: "Identifier", name: className },
                { type: "SpreadElement", argument: { type: "Identifier", name: "__args" } }
              ]
            }
          });
        } else {
          if (baseClassExprs.length > 0) {
            constructorBody.push({
              type: "VariableDeclarationStatement",
              name: "self",
              expression: {
                type: "CallExpression",
                callee: baseClassExprs[0],
                arguments: [{ type: "SpreadElement", argument: { type: "Identifier", name: "__args" } }]
              }
            });
          } else {
            constructorBody.push({
              type: "VariableDeclarationStatement",
              name: "self",
              expression: {
                type: "ObjectExpression",
                properties: [
                  { key: { type: "Literal", value: "__class__" }, value: { type: "Identifier", name: className } }
                ]
              }
            });
          }
          constructorBody.push(...methodBindings);
          if (initParams !== null) {
            constructorBody.push({
              type: "ExpressionStatement",
              expression: {
                type: "CallExpression",
                callee: {
                  type: "MemberExpression",
                  object: { type: "Identifier", name: "self" },
                  property: { type: "Identifier", name: "__init__" }
                },
                arguments: [{ type: "SpreadElement", argument: { type: "Identifier", name: "__args" } }]
              }
            });
          }
          constructorBody.push({
            type: "ReturnStatement",
            argument: { type: "Identifier", name: "self" }
          });
        }
        const constructorDecl = {
          type: "FunctionDeclaration",
          name: className,
          params: [{ type: "Identifier", name: "__args", isRest: true }],
          body: constructorBody
        };
        return [...methodDeclarations, constructorDecl, ...classAttrAssignments];
      },
      Suite_block(_ob, stmts, _cb) {
        const res = [];
        for (const s2 of stmts.children) {
          const ast = s2.toAST();
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
          type: "IfStatement",
          test: test.toAST(),
          consequent: Array.isArray(consAst) ? consAst : [consAst],
          alternate: null
        };
        let curr = root;
        const elifCount = elifTests.children.length;
        for (let i = 0; i < elifCount; i++) {
          const elifCons = elifSuites.children[i].toAST();
          const elifNode = {
            type: "IfStatement",
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
            type: "WhileStatement",
            test: test.toAST(),
            body: Array.isArray(bodyAst) ? bodyAst : [bodyAst]
          };
        }
        const id = ++forCounter;
        const tempCompleted = `__completed_${id}`;
        const instrumentedBody = instrumentBreaks(Array.isArray(bodyAst) ? bodyAst : [bodyAst], [
          {
            type: "ExpressionStatement",
            expression: {
              type: "BinaryExpression",
              operator: "=",
              left: { type: "Identifier", name: tempCompleted },
              right: { type: "Literal", value: false }
            }
          }
        ]);
        return [
          {
            type: "VariableDeclarationStatement",
            name: tempCompleted,
            expression: { type: "Literal", value: true }
          },
          {
            type: "WhileStatement",
            test: test.toAST(),
            body: instrumentedBody
          },
          {
            type: "IfStatement",
            test: { type: "Identifier", name: tempCompleted },
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
        const handlers = excepts.children.map((e) => e.toAST());
        const elseAst = elseC.toAST();
        const finalizer = fin.toAST();
        return {
          type: "TryStatement",
          block: Array.isArray(bodyAst) ? bodyAst : [bodyAst],
          handlers,
          elseBlock: Array.isArray(elseAst) ? elseAst : [elseAst],
          finalizer: Array.isArray(finalizer) ? finalizer : [finalizer]
        };
      },
      TryStmt_except_else(_try, _colon, body, excepts, elseC) {
        const bodyAst = body.toAST();
        const handlers = excepts.children.map((e) => e.toAST());
        const elseAst = elseC.toAST();
        return {
          type: "TryStatement",
          block: Array.isArray(bodyAst) ? bodyAst : [bodyAst],
          handlers,
          elseBlock: Array.isArray(elseAst) ? elseAst : [elseAst],
          finalizer: null
        };
      },
      TryStmt_except_finally(_try, _colon, body, excepts, fin) {
        const bodyAst = body.toAST();
        const handlers = excepts.children.map((e) => e.toAST());
        const finalizer = fin.toAST();
        return {
          type: "TryStatement",
          block: Array.isArray(bodyAst) ? bodyAst : [bodyAst],
          handlers,
          elseBlock: null,
          finalizer: Array.isArray(finalizer) ? finalizer : [finalizer]
        };
      },
      TryStmt_except(_try, _colon, body, excepts) {
        const bodyAst = body.toAST();
        const handlers = excepts.children.map((e) => e.toAST());
        return {
          type: "TryStatement",
          block: Array.isArray(bodyAst) ? bodyAst : [bodyAst],
          handlers,
          elseBlock: null,
          finalizer: null
        };
      },
      TryStmt_finally(_try, _colon, body, fin) {
        const bodyAst = body.toAST();
        const finalizer = fin.toAST();
        return {
          type: "TryStatement",
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
          type: "CatchClause",
          param: { type: "Identifier", name: id.sourceString },
          errorClass: exp.toAST(),
          body: Array.isArray(bodyAst) ? bodyAst : [bodyAst]
        };
      },
      ExceptClause_typed(_except, exp, _colon, suite) {
        const bodyAst = suite.toAST();
        return {
          type: "CatchClause",
          param: null,
          errorClass: exp.toAST(),
          body: Array.isArray(bodyAst) ? bodyAst : [bodyAst]
        };
      },
      ExceptClause_bare(_except, _colon, suite) {
        const bodyAst = suite.toAST();
        return {
          type: "CatchClause",
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
          type: "ThrowStatement",
          argument: exp.toAST()
        };
      },
      RaiseStmt_with_exp(_raise, exp, _semi) {
        return {
          type: "ThrowStatement",
          argument: exp.toAST()
        };
      },
      RaiseStmt_bare(_raise, _semi) {
        return {
          type: "ThrowStatement",
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
        const res = items.asIteration().children.map((it) => {
          const parsed = it.toAST();
          return {
            type: "ImportStatement",
            module: parsed.module,
            alias: parsed.alias
          };
        });
        return res.length === 1 ? res[0] : res;
      },
      ImportStmt_from_import(_from, mod, _imp, items, _semi) {
        const isStar = items.sourceString.trim() === "*";
        return {
          type: "ImportStatement",
          module: mod.sourceString,
          specifiers: isStar ? [{ imported: "*", local: "*" }] : items.asIteration().children.map((it) => {
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
        const elements = exprs.asIteration().children.map((e) => e.toAST());
        return {
          type: "ReturnStatement",
          argument: elements.length === 1 ? elements[0] : { type: "ArrayExpression", elements }
        };
      },
      ReturnStmt_empty(_ret, _semi) {
        return {
          type: "ReturnStatement",
          argument: null
        };
      },
      YieldStmt_from(_yield, _from, exp, _semi) {
        return { type: "YieldStatement", delegate: true, argument: exp.toAST() };
      },
      YieldStmt_values(_yield, exprs, _optComma, _semi) {
        const elements = exprs.asIteration().children.map((e) => e.toAST());
        return {
          type: "YieldStatement",
          delegate: false,
          argument: elements.length === 1 ? elements[0] : { type: "ArrayExpression", elements }
        };
      },
      YieldStmt_empty(_yield, _semi) {
        return { type: "YieldStatement", delegate: false, argument: null };
      },
      YieldExp_from(_yield, _from, exp) {
        return { type: "YieldExpression", delegate: true, argument: exp.toAST() };
      },
      YieldExp_values(_yield, exprs, _optComma) {
        const elements = exprs.asIteration().children.map((e) => e.toAST());
        return {
          type: "YieldExpression",
          delegate: false,
          argument: elements.length === 1 ? elements[0] : { type: "ArrayExpression", elements }
        };
      },
      YieldExp_empty(_yield) {
        return { type: "YieldExpression", delegate: false, argument: null };
      },
      BreakStmt(_break, _semi) {
        return { type: "BreakStatement" };
      },
      ContinueStmt(_continue, _semi) {
        return { type: "ContinueStatement" };
      },
      GlobalStmt(_global, names, _semi) {
        return {
          type: "GlobalStatement",
          names: names.asIteration().children.map((n) => n.sourceString)
        };
      },
      NonlocalStmt(_nonlocal, names, _semi) {
        return {
          type: "NonlocalStatement",
          names: names.asIteration().children.map((n) => n.sourceString)
        };
      },
      PassStmt(_pass, _semi) {
        return null;
      },
      AssertStmt(_assert, test, _optComma, msg, _semi) {
        const testAst = test.toAST();
        const msgAst = msg.children.length > 0 ? msg.children[0].toAST() : { type: "Literal", value: "assertion failed" };
        return {
          type: "IfStatement",
          test: { type: "UnaryExpression", operator: "!", argument: testAst },
          consequent: [
            {
              type: "ExpressionStatement",
              expression: {
                type: "CallExpression",
                callee: { type: "Identifier", name: "print" },
                arguments: [
                  {
                    type: "BinaryExpression",
                    operator: "+",
                    left: { type: "Literal", value: "AssertionError: " },
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
        const flat = targets.asIteration().children.flatMap((t) => {
          const ast = t.toAST();
          return Array.isArray(ast) ? ast : [ast];
        });
        return flat.map((target) => {
          if (target.type === "IndexExpression") {
            return {
              type: "ExpressionStatement",
              expression: {
                type: "CallExpression",
                callee: { type: "Identifier", name: "__delitem" },
                arguments: [target.object, target.index]
              }
            };
          }
          if (target.type === "MemberExpression") {
            return {
              type: "ExpressionStatement",
              expression: {
                type: "CallExpression",
                callee: { type: "Identifier", name: "delattr" },
                arguments: [target.object, { type: "Literal", value: target.property.name }]
              }
            };
          }
          return {
            type: "ExpressionStatement",
            expression: {
              type: "BinaryExpression",
              operator: "=",
              left: target,
              right: { type: "Literal", value: null }
            }
          };
        });
      },
      AssignLHS_list(_ob, items, _optComma, _cb) {
        return items.asIteration().children.map((i) => i.toAST());
      },
      AssignLHS_tuple(_ob, items, _optComma, _cb) {
        return items.asIteration().children.map((i) => i.toAST());
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
        return values.asIteration().children.map((v) => v.toAST());
      },
      AssignStmt_aug(target, op, value, _semi) {
        const targets = target.toAST();
        const values = value.toAST();
        const opStr = op.sourceString;
        const binOp = opStr.slice(0, -1);
        return {
          type: "ExpressionStatement",
          expression: {
            type: "BinaryExpression",
            operator: "=",
            left: targets[0],
            right: {
              type: "BinaryExpression",
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
        const rhsValue = values.length > 1 ? { type: "ArrayExpression", elements: values } : values[0];
        const stmts = [
          {
            type: "VariableDeclarationStatement",
            name: tempVar,
            expression: rhsValue
          }
        ];
        for (const tNode of allTargetNodes) {
          const targets = tNode.toAST();
          if (targets.length === 1) {
            stmts.push({
              type: "ExpressionStatement",
              expression: {
                type: "BinaryExpression",
                operator: "=",
                left: targets[0],
                right: { type: "Identifier", name: tempVar }
              }
            });
          } else {
            for (let i = 0; i < targets.length; i++) {
              stmts.push({
                type: "ExpressionStatement",
                expression: {
                  type: "BinaryExpression",
                  operator: "=",
                  left: targets[i],
                  right: {
                    type: "IndexExpression",
                    object: { type: "Identifier", name: tempVar },
                    index: { type: "Literal", value: i }
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
            type: "ExpressionStatement",
            expression: {
              type: "BinaryExpression",
              operator: "=",
              left: targets[0],
              right: values[0]
            }
          };
        }
        const id = ++forCounter;
        const tempVar = `__unpack_${id}`;
        let rhsValue;
        if (values.length > 1) {
          rhsValue = { type: "ArrayExpression", elements: values };
        } else {
          rhsValue = values[0];
        }
        const stmts = [
          {
            type: "VariableDeclarationStatement",
            name: tempVar,
            expression: rhsValue
          }
        ];
        for (let i = 0; i < targets.length; i++) {
          stmts.push({
            type: "ExpressionStatement",
            expression: {
              type: "BinaryExpression",
              operator: "=",
              left: targets[i],
              right: {
                type: "IndexExpression",
                object: { type: "Identifier", name: tempVar },
                index: { type: "Literal", value: i }
              }
            }
          });
        }
        return stmts;
      },
      ExprStmt(expr, _semi) {
        return {
          type: "ExpressionStatement",
          expression: expr.toAST()
        };
      },
      CondExp_py_ternary(left, _if, cond, _else, right) {
        return {
          type: "ConditionalExpression",
          test: cond.toAST(),
          consequent: left.toAST(),
          alternate: right.toAST()
        };
      },
      CompOp_not_in(_op) {
        return "not in";
      },
      CompOp_in(_op) {
        return "in";
      },
      CompOp_is_not(_op) {
        return "!=";
      },
      CompOp_is(_op) {
        return "==";
      },
      EqExp(first, ops, rests) {
        const firstAst = first.toAST();
        if (ops.children.length === 0) {
          return firstAst;
        }
        const opStrings = ops.children.map((o) => o.sourceString);
        const restAsts = rests.children.map((r) => r.toAST());
        if (opStrings.length === 1) {
          const op = opStrings[0];
          const right = restAsts[0];
          if (op === "not in") {
            return {
              type: "UnaryExpression",
              operator: "!",
              argument: { type: "BinaryExpression", operator: "in", left: firstAst, right }
            };
          }
          if (op === "is") return { type: "BinaryExpression", operator: "==", left: firstAst, right };
          if (op === "is not") return { type: "BinaryExpression", operator: "!=", left: firstAst, right };
          return { type: "BinaryExpression", operator: op, left: firstAst, right };
        }
        const operands = [firstAst, ...restAsts];
        let chained = null;
        for (let i = 0; i < opStrings.length; i++) {
          let op = opStrings[i];
          const left = operands[i];
          const right = operands[i + 1];
          let cond;
          if (op === "not in") {
            cond = {
              type: "UnaryExpression",
              operator: "!",
              argument: { type: "BinaryExpression", operator: "in", left, right }
            };
          } else if (op === "is") {
            cond = { type: "BinaryExpression", operator: "==", left, right };
          } else if (op === "is not") {
            cond = { type: "BinaryExpression", operator: "!=", left, right };
          } else {
            cond = { type: "BinaryExpression", operator: op, left, right };
          }
          if (chained === null) {
            chained = cond;
          } else {
            chained = {
              type: "BinaryExpression",
              operator: "and",
              left: chained,
              right: cond
            };
          }
        }
        return chained;
      },
      MulExp_idiv(left, _op, right) {
        return {
          type: "BinaryExpression",
          operator: "//",
          left: left.toAST(),
          right: right.toAST()
        };
      },
      MulExp_matmul(left, _op, right) {
        return {
          type: "BinaryExpression",
          operator: "@",
          left: left.toAST(),
          right: right.toAST()
        };
      },
      MulExp_pow(left, _op, right) {
        return {
          type: "BinaryExpression",
          operator: "**",
          left: left.toAST(),
          right: right.toAST()
        };
      },
      _iter(...children) {
        return children.map((c) => c.toAST());
      },
      SliceExp(start, _c1, stop, _optC2, step) {
        let stepAst = null;
        if (step && step.children.length > 0) {
          const inner = step.children[0];
          if (inner && typeof inner.toAST === "function") {
            const res = inner.toAST();
            stepAst = Array.isArray(res) ? res.length > 0 ? res[0] : null : res;
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
          type: "KeywordArgument",
          name: id.sourceString,
          value: exp.toAST()
        };
      },
      Arg_kwspread(_stars, exp) {
        return { type: "SpreadElement", isKwSpread: true, argument: exp.toAST() };
      },
      Arg_spread(_star, exp) {
        return { type: "SpreadElement", argument: exp.toAST() };
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
        const allArgs = args.asIteration().children.map((a) => a.toAST());
        const posArgs = [];
        const kwArgs = [];
        const kwSpreads = [];
        for (const a of allArgs) {
          if (a && a.type === "KeywordArgument") {
            kwArgs.push(a);
          } else if (a && a.type === "SpreadElement" && a.isKwSpread) {
            kwSpreads.push(a);
          } else {
            posArgs.push(a);
          }
        }
        if (kwArgs.length > 0 || kwSpreads.length > 0) {
          const kwProps = [];
          for (const kwSpread of kwSpreads) {
            kwProps.push({
              type: "SpreadElement",
              argument: kwSpread.argument
            });
          }
          for (const kw of kwArgs) {
            kwProps.push({
              key: { type: "Literal", value: kw.name },
              value: kw.value
            });
          }
          kwProps.push({
            key: { type: "Literal", value: "__is_py_kwargs__" },
            value: { type: "Literal", value: true }
          });
          const kwObj = {
            type: "ObjectExpression",
            properties: kwProps
          };
          posArgs.push(kwObj);
        }
        return {
          type: "CallExpression",
          callee: callee.toAST(),
          arguments: posArgs
        };
      },
      PostfixExp_slice(object, _ob, slice, _cb) {
        const s2 = slice.toAST();
        return {
          type: "CallExpression",
          callee: { type: "Identifier", name: "__slice" },
          arguments: [
            object.toAST(),
            s2.start !== null ? s2.start : { type: "Literal", value: null },
            s2.stop !== null ? s2.stop : { type: "Literal", value: null },
            s2.step !== null ? s2.step : { type: "Literal", value: null }
          ]
        };
      },
      ListComp(_ob, expr, _for, target, _in, iter, _ifOpt, condOpt, _cb) {
        const id = ++forCounter;
        const targets = target.toAST();
        const exprAst = expr.toAST();
        const condAst = condOpt.children.length > 0 ? condOpt.children[0].toAST() : null;
        const appendStmt = {
          type: "ExpressionStatement",
          expression: {
            type: "CallExpression",
            callee: {
              type: "MemberExpression",
              object: { type: "Identifier", name: "__res" },
              property: { type: "Identifier", name: "append" }
            },
            arguments: [exprAst]
          }
        };
        const loopBody = condAst ? [{ type: "IfStatement", test: condAst, consequent: [appendStmt], alternate: null }] : [appendStmt];
        const forStmt = desugarForLoop(targets, iter.toAST(), loopBody);
        return {
          type: "CallExpression",
          callee: {
            type: "FunctionExpression",
            params: [],
            body: [
              {
                type: "VariableDeclarationStatement",
                name: "__res",
                expression: { type: "ArrayExpression", elements: [] }
              },
              ...Array.isArray(forStmt) ? forStmt : [forStmt],
              {
                type: "ReturnStatement",
                argument: { type: "Identifier", name: "__res" }
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
          type: "ExpressionStatement",
          expression: {
            type: "CallExpression",
            callee: {
              type: "MemberExpression",
              object: { type: "Identifier", name: "__res" },
              property: { type: "Identifier", name: "append" }
            },
            arguments: [exprAst]
          }
        };
        const loopBody = condAst ? [{ type: "IfStatement", test: condAst, consequent: [appendStmt], alternate: null }] : [appendStmt];
        const forStmt = desugarForLoop(targets, iter.toAST(), loopBody);
        return {
          type: "CallExpression",
          callee: {
            type: "FunctionExpression",
            params: [],
            body: [
              {
                type: "VariableDeclarationStatement",
                name: "__res",
                expression: { type: "ArrayExpression", elements: [] }
              },
              ...Array.isArray(forStmt) ? forStmt : [forStmt],
              {
                type: "ReturnStatement",
                argument: { type: "Identifier", name: "__res" }
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
          type: "ExpressionStatement",
          expression: {
            type: "BinaryExpression",
            operator: "=",
            left: {
              type: "IndexExpression",
              object: { type: "Identifier", name: "__res" },
              index: keyAst
            },
            right: valAst
          }
        };
        const loopBody = condAst ? [{ type: "IfStatement", test: condAst, consequent: [setStmt], alternate: null }] : [setStmt];
        const forStmt = desugarForLoop(targets, iter.toAST(), loopBody);
        return {
          type: "CallExpression",
          callee: {
            type: "FunctionExpression",
            params: [],
            body: [
              {
                type: "VariableDeclarationStatement",
                name: "__res",
                expression: { type: "DictLiteral", properties: [] }
              },
              ...Array.isArray(forStmt) ? forStmt : [forStmt],
              {
                type: "ReturnStatement",
                argument: { type: "Identifier", name: "__res" }
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
          type: "IfStatement",
          test: {
            type: "UnaryExpression",
            operator: "!",
            argument: {
              type: "BinaryExpression",
              operator: "in",
              left: exprAst,
              right: { type: "Identifier", name: "__res" }
            }
          },
          consequent: [
            {
              type: "ExpressionStatement",
              expression: {
                type: "CallExpression",
                callee: {
                  type: "MemberExpression",
                  object: { type: "Identifier", name: "__res" },
                  property: { type: "Identifier", name: "append" }
                },
                arguments: [exprAst]
              }
            }
          ],
          alternate: null
        };
        const loopBody = condAst ? [{ type: "IfStatement", test: condAst, consequent: [appendStmt], alternate: null }] : [appendStmt];
        const forStmt = desugarForLoop(targets, iter.toAST(), loopBody);
        return {
          type: "CallExpression",
          callee: {
            type: "FunctionExpression",
            params: [],
            body: [
              {
                type: "VariableDeclarationStatement",
                name: "__res",
                expression: { type: "ArrayExpression", elements: [] }
              },
              ...Array.isArray(forStmt) ? forStmt : [forStmt],
              {
                type: "ReturnStatement",
                argument: { type: "Identifier", name: "__res" }
              }
            ]
          },
          arguments: []
        };
      },
      LambdaExp(_lambda, params, _colon, body) {
        return {
          type: "FunctionExpression",
          name: "<lambda>",
          params: params.asIteration().children.map((p) => ({ type: "Identifier", name: p.sourceString })),
          body: [
            {
              type: "ReturnStatement",
              argument: body.toAST()
            }
          ]
        };
      },
      WalrusExp(id, _op, expr) {
        return {
          type: "BinaryExpression",
          operator: "=",
          left: { type: "Identifier", name: id.sourceString },
          right: expr.toAST()
        };
      },
      PrimaryExp_py_true(_kw) {
        return { type: "Literal", value: true };
      },
      PrimaryExp_py_false(_kw) {
        return { type: "Literal", value: false };
      },
      PrimaryExp_py_none(_kw) {
        return { type: "Literal", value: null };
      },
      PrimaryExp_py_list(_ob, items, _optComma, _cb) {
        return {
          type: "ArrayExpression",
          elements: items.asIteration().children.map((i) => i.toAST())
        };
      },
      PrimaryExp_py_dict(_ob, entries, _optComma, _cb) {
        return {
          type: "DictLiteral",
          properties: entries.asIteration().children.map((e) => e.toAST())
        };
      },
      PrimaryExp_py_set(_ob, items, _optComma, _cb) {
        return {
          type: "CallExpression",
          callee: { type: "Identifier", name: "set" },
          arguments: [{
            type: "ArrayExpression",
            elements: items.asIteration().children.map((i) => i.toAST())
          }]
        };
      },
      PrimaryExp_py_tuple(_ob, items, _optComma, _cb) {
        const elms = items.asIteration().children.map((i) => i.toAST());
        if (elms.length === 1 && _optComma.children.length === 0) {
          return elms[0];
        }
        return {
          type: "ArrayExpression",
          elements: elms
        };
      },
      PrimaryExp_py_empty_tuple(_ob, _cb) {
        return {
          type: "ArrayExpression",
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
          type: "SpreadElement",
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
        return { type: "BinaryExpression", operator: op.sourceString, left: target.toAST(), right: value.toAST() };
      },
      OrExp_or(left, op, right) {
        return { type: "BinaryExpression", operator: op.sourceString, left: left.toAST(), right: right.toAST() };
      },
      AndExp_and(left, op, right) {
        return { type: "BinaryExpression", operator: op.sourceString, left: left.toAST(), right: right.toAST() };
      },
      BitOrExp_bitor(left, op, right) {
        return { type: "BinaryExpression", operator: op.sourceString, left: left.toAST(), right: right.toAST() };
      },
      BitXorExp_bitxor(left, op, right) {
        return { type: "BinaryExpression", operator: op.sourceString, left: left.toAST(), right: right.toAST() };
      },
      BitAndExp_bitand(left, op, right) {
        return { type: "BinaryExpression", operator: op.sourceString, left: left.toAST(), right: right.toAST() };
      },
      EqExp_eq(left, op, right) {
        return { type: "BinaryExpression", operator: op.sourceString, left: left.toAST(), right: right.toAST() };
      },
      RelExp_rel(left, op, right) {
        return { type: "BinaryExpression", operator: op.sourceString, left: left.toAST(), right: right.toAST() };
      },
      ShiftExp_shift(left, op, right) {
        return { type: "BinaryExpression", operator: op.sourceString, left: left.toAST(), right: right.toAST() };
      },
      AddExp_add(left, op, right) {
        return { type: "BinaryExpression", operator: op.sourceString, left: left.toAST(), right: right.toAST() };
      },
      MulExp_mul(left, op, right) {
        return { type: "BinaryExpression", operator: op.sourceString, left: left.toAST(), right: right.toAST() };
      },
      NotExp_not(_op, arg) {
        return { type: "UnaryExpression", operator: "not", argument: arg.toAST(), prefix: true };
      },
      UnaryExp_not(_op, arg) {
        return { type: "UnaryExpression", operator: "!", argument: arg.toAST(), prefix: true };
      },
      UnaryExp_not_kw(_op, arg) {
        return { type: "UnaryExpression", operator: "not", argument: arg.toAST(), prefix: true };
      },
      UnaryExp_neg(_op, arg) {
        return { type: "UnaryExpression", operator: "-", argument: arg.toAST() };
      },
      UnaryExp_bitnot(_op, arg) {
        return { type: "UnaryExpression", operator: "~", argument: arg.toAST() };
      },
      UnaryExp_pos(_op, arg) {
        return { type: "UnaryExpression", operator: "+", argument: arg.toAST() };
      },
      UnaryExp_preinc(op, arg) {
        return { type: "UpdateExpression", operator: op.sourceString, argument: arg.toAST(), prefix: true };
      },
      PostfixExp_postinc(arg, op) {
        return { type: "UpdateExpression", operator: op.sourceString, argument: arg.toAST(), prefix: false };
      },
      PostfixExp_call(callee, _open, args, _close) {
        return {
          type: "CallExpression",
          callee: callee.toAST(),
          arguments: args.asIteration().children.map((a) => a.toAST())
        };
      },
      PostfixExp_index(object, _open, index, _close) {
        return { type: "IndexExpression", object: object.toAST(), index: index.toAST() };
      },
      PostfixExp_member(object, _dot, prop) {
        return { type: "MemberExpression", object: object.toAST(), property: { type: "Identifier", name: prop.sourceString } };
      },
      number(_) {
        return { type: "Literal", value: Number(this.sourceString) };
      },
      string(_prefix, _open, _chars, _close) {
        const prefixStr = _prefix.sourceString.toLowerCase();
        const isRaw = prefixStr.includes("r");
        const regex = /"([^"\\]*(?:\\.[^"\\]*)*)"|'([^'\\]*(?:\\.[^'\\]*)*)'/g;
        let match;
        let combined = "";
        while ((match = regex.exec(this.sourceString)) !== null) {
          const inner = match[1] !== void 0 ? match[1] : match[2];
          if (isRaw) {
            combined += inner;
          } else {
            const unescaped = inner.replace(/\\([nrtbfav0'"\\]|x[0-9a-fA-F]{2}|u[0-9a-fA-F]{4})/g, (m, esc) => {
              switch (esc[0]) {
                case "n":
                  return "\n";
                case "r":
                  return "\r";
                case "t":
                  return "	";
                case "b":
                  return "\b";
                case "f":
                  return "\f";
                case "v":
                  return "\v";
                case "0":
                  return "\0";
                case "'":
                  return "'";
                case '"':
                  return '"';
                case "\\":
                  return "\\";
                case "x":
                  return String.fromCharCode(parseInt(esc.slice(1), 16));
                case "u":
                  return String.fromCharCode(parseInt(esc.slice(1), 16));
                default:
                  return m;
              }
            });
            combined += unescaped;
          }
        }
        return { type: "Literal", value: combined };
      },
      PrimaryExp_py_str_concat(first, rest) {
        const firstVal = first.toAST().value;
        const restVals = rest.children.map((s2) => s2.toAST().value);
        return { type: "Literal", value: firstVal + restVals.join("") };
      },
      PrimaryExp_true(_) {
        return { type: "Literal", value: true };
      },
      PrimaryExp_false(_) {
        return { type: "Literal", value: false };
      },
      PrimaryExp_null(_) {
        return { type: "Literal", value: null };
      },
      PrimaryExp_paren(_ob, e, _cb) {
        return e.toAST();
      },
      PrimaryExp_list(_ob, items, _cb) {
        return { type: "ArrayExpression", elements: items.asIteration().children.map((i) => i.toAST()) };
      },
      ident(_head, _tail) {
        return { type: "Identifier", name: this.sourceString };
      }
    });
    return s;
  }

  // js/frontend/python_preprocessor.js
  function unescapeFStringLiteral(str) {
    return str.replace(/\\([abfnrtv'"\\]|x[0-9a-fA-F]{2}|u[0-9a-fA-F]{4}|U[0-9a-fA-F]{8}|[0-7]{1,3})/g, (match, esc) => {
      switch (esc[0]) {
        case "a":
          return "\x07";
        case "b":
          return "\b";
        case "f":
          return "\f";
        case "n":
          return "\n";
        case "r":
          return "\r";
        case "t":
          return "	";
        case "v":
          return "\v";
        case "'":
          return "'";
        case '"':
          return '"';
        case "\\":
          return "\\";
        case "x":
          return String.fromCharCode(parseInt(esc.slice(1), 16));
        case "u":
          return String.fromCharCode(parseInt(esc.slice(1), 16));
        case "U":
          return String.fromCodePoint(parseInt(esc.slice(1), 16));
        default:
          if (/^[0-7]{1,3}$/.test(esc)) {
            return String.fromCharCode(parseInt(esc, 8));
          }
          return match;
      }
    });
  }
  function transformFStrings(line) {
    let result = "";
    let i = 0;
    while (i < line.length) {
      if (line[i] === '"' || line[i] === "'") {
        const quote = line[i];
        result += quote;
        i++;
        while (i < line.length) {
          if (line[i] === "\\" && i + 1 < line.length) {
            result += line[i] + line[i + 1];
            i += 2;
          } else if (line[i] === quote) {
            result += quote;
            i++;
            break;
          } else {
            result += line[i];
            i++;
          }
        }
        continue;
      }
      const prevChar = i > 0 ? line[i - 1] : "";
      const isWordChar = /[a-zA-Z0-9_]/.test(prevChar);
      if (!isWordChar && (line[i] === "r" || line[i] === "R" || line[i] === "b" || line[i] === "B" || line[i] === "u" || line[i] === "U") && i + 1 < line.length && (line[i + 1] === '"' || line[i + 1] === "'")) {
        const pfx = line[i];
        const quote = line[i + 1];
        result += pfx + quote;
        i += 2;
        while (i < line.length) {
          if (line[i] === "\\" && i + 1 < line.length) {
            result += line[i] + line[i + 1];
            i += 2;
          } else if (line[i] === quote) {
            result += quote;
            i++;
            break;
          } else {
            result += line[i];
            i++;
          }
        }
        continue;
      }
      let isFString = false;
      let prefixLen = 0;
      if (!isWordChar) {
        if ((line[i] === "f" || line[i] === "F") && i + 1 < line.length && (line[i + 1] === '"' || line[i + 1] === "'")) {
          isFString = true;
          prefixLen = 1;
        } else if (i + 2 < line.length && ((line[i] === "f" || line[i] === "F") && (line[i + 1] === "r" || line[i + 1] === "R") || (line[i] === "r" || line[i] === "R") && (line[i + 1] === "f" || line[i + 1] === "F")) && (line[i + 2] === '"' || line[i + 2] === "'")) {
          isFString = true;
          prefixLen = 2;
        }
      }
      if (isFString) {
        const isRawFString = prefixLen === 2;
        const quote = line[i + prefixLen];
        let j = i + prefixLen + 1;
        let rawContent = "";
        let closed = false;
        while (j < line.length) {
          if (line[j] === "\\" && j + 1 < line.length) {
            rawContent += line[j] + line[j + 1];
            j += 2;
          } else if (line[j] === quote) {
            closed = true;
            j++;
            break;
          } else {
            rawContent += line[j];
            j++;
          }
        }
        if (!closed) {
          result += line.substring(i);
          break;
        }
        const processed = rawContent.replaceAll("{{", "").replaceAll("}}", "");
        const parts = [];
        let lastIdx = 0;
        let k = 0;
        while (k < processed.length) {
          if (processed[k] === "{") {
            if (k > lastIdx) {
              const literalText = processed.substring(lastIdx, k).replaceAll("", "{").replaceAll("", "}");
              const unescaped = isRawFString ? literalText : unescapeFStringLiteral(literalText);
              parts.push(JSON.stringify(unescaped));
            }
            let depth = 1;
            let m = k + 1;
            while (m < processed.length && depth > 0) {
              if (processed[m] === "{") depth++;
              else if (processed[m] === "}") depth--;
              m++;
            }
            const inside = processed.substring(k + 1, m - 1).trim();
            let depthParen = 0;
            let depthBracket = 0;
            let depthBrace = 0;
            let inQuote = null;
            let colonIdx = -1;
            let exclamIdx = -1;
            for (let p = 0; p < inside.length; p++) {
              const ch = inside[p];
              if (inQuote) {
                if (ch === "\\") p++;
                else if (ch === inQuote) inQuote = null;
                continue;
              }
              if (ch === '"' || ch === "'") {
                inQuote = ch;
              } else if (ch === "(") depthParen++;
              else if (ch === ")") depthParen--;
              else if (ch === "[") depthBracket++;
              else if (ch === "]") depthBracket--;
              else if (ch === "{") depthBrace++;
              else if (ch === "}") depthBrace--;
              else if (depthParen === 0 && depthBracket === 0 && depthBrace === 0) {
                if (ch === ":" && colonIdx === -1) {
                  colonIdx = p;
                  break;
                } else if (ch === "!" && exclamIdx === -1) {
                  exclamIdx = p;
                }
              }
            }
            let exprPart = inside;
            let formatSpec = null;
            let conversion = null;
            if (colonIdx !== -1) {
              formatSpec = inside.substring(colonIdx + 1);
              exprPart = inside.substring(0, colonIdx);
            }
            if (exclamIdx !== -1 && (colonIdx === -1 || exclamIdx < colonIdx)) {
              conversion = exprPart.substring(exclamIdx + 1).trim();
              exprPart = exprPart.substring(0, exclamIdx);
            }
            let prefix = "";
            const trimmedExpr = exprPart.trim();
            if (trimmedExpr.endsWith("=")) {
              prefix = JSON.stringify(inside.substring(0, colonIdx !== -1 ? colonIdx : inside.length) + " ");
              exprPart = trimmedExpr.slice(0, -1).trim();
            }
            let valExpr = "";
            if (formatSpec !== null) {
              valExpr = `__format(${exprPart}, ${JSON.stringify(formatSpec)})`;
            } else if (conversion === "r") {
              valExpr = `repr(${exprPart})`;
            } else {
              valExpr = `str(${exprPart})`;
            }
            if (prefix) {
              parts.push(`(${prefix} + ${valExpr})`);
            } else {
              parts.push(valExpr);
            }
            k = m;
            lastIdx = k;
          } else {
            k++;
          }
        }
        if (lastIdx < processed.length) {
          const literalText = processed.substring(lastIdx).replaceAll("", "{").replaceAll("", "}");
          const unescaped = isRawFString ? literalText : unescapeFStringLiteral(literalText);
          parts.push(JSON.stringify(unescaped));
        }
        if (parts.length === 0) {
          result += '""';
        } else if (parts.length === 1 && parts[0].startsWith('"')) {
          result += parts[0];
        } else {
          result += "(" + parts.join(" + ") + ")";
        }
        i = j;
      } else {
        result += line[i];
        i++;
      }
    }
    return result;
  }
  function normalizePythonSource(src) {
    let result = "";
    let i = 0;
    let bracketDepth = 0;
    function checkAdjacentString(endIdx) {
      let k = endIdx;
      while (k < src.length) {
        if (src[k] === " " || src[k] === "	") {
          k++;
        } else if (src[k] === "#" && bracketDepth > 0) {
          while (k < src.length && src[k] !== "\n") k++;
        } else if ((src[k] === "\n" || src[k] === "\r" && src[k + 1] === "\n") && bracketDepth > 0) {
          if (src[k] === "\r") k += 2;
          else k++;
        } else if (src[k] === "\\" && (src[k + 1] === "\n" || src[k + 1] === "\r" && src[k + 2] === "\n")) {
          k += src[k + 1] === "\r" ? 3 : 2;
        } else {
          break;
        }
      }
      let nextP = k;
      while (nextP < src.length && "rRbBuUfF".includes(src[nextP])) nextP++;
      if (nextP < src.length && (src[nextP] === '"' || src[nextP] === "'")) {
        return k;
      }
      return -1;
    }
    while (i < src.length) {
      const ch = src[i];
      if (ch === "(" || ch === "[" || ch === "{") bracketDepth++;
      else if (ch === ")" || ch === "]" || ch === "}") {
        if (bracketDepth > 0) bracketDepth--;
      }
      if (ch === "#") {
        let j = i;
        while (j < src.length && src[j] !== "\n") j++;
        result += src.substring(i, j);
        i = j;
        continue;
      }
      if (ch === "\\") {
        let j = i + 1;
        while (j < src.length && (src[j] === " " || src[j] === "	")) j++;
        if (src[j] === "\n") {
          result += " ";
          i = j + 1;
          continue;
        } else if (src[j] === "\r" && src[j + 1] === "\n") {
          result += " ";
          i = j + 2;
          continue;
        }
      }
      let p = i;
      let isRaw = false;
      let isFormat = false;
      while (p < src.length && "rRbBuUfF".includes(src[p])) {
        if (src[p] === "r" || src[p] === "R") isRaw = true;
        if (src[p] === "f" || src[p] === "F") isFormat = true;
        p++;
      }
      if (src.startsWith('"""', p) || src.startsWith("'''", p)) {
        const delim = src.startsWith('"""', p) ? '"""' : "'''";
        const start = p + 3;
        let j = start;
        let closed = false;
        while (j < src.length) {
          if (src[j] === "\\") {
            j += 2;
          } else if (src.startsWith(delim, j)) {
            closed = true;
            break;
          } else {
            j++;
          }
        }
        const raw = src.substring(start, j);
        const prefix = isRaw && isFormat ? "fr" : isFormat ? "f" : isRaw ? "r" : "";
        result += prefix + JSON.stringify(raw);
        const endIdx = closed ? j + 3 : j;
        const nextStr = checkAdjacentString(endIdx);
        if (nextStr !== -1) {
          result += " + ";
          i = nextStr;
        } else {
          i = endIdx;
        }
        continue;
      }
      if (isRaw && !isFormat && (src[p] === '"' || src[p] === "'")) {
        const quote = src[p];
        let j = p + 1;
        let rawVal = "";
        while (j < src.length && src[j] !== "\n") {
          if (src[j] === "\\" && j + 1 < src.length) {
            rawVal += src[j] + src[j + 1];
            j += 2;
          } else if (src[j] === quote) {
            j++;
            break;
          } else {
            rawVal += src[j];
            j++;
          }
        }
        result += JSON.stringify(rawVal);
        const nextStr = checkAdjacentString(j);
        if (nextStr !== -1) {
          result += " + ";
          i = nextStr;
        } else {
          i = j;
        }
        continue;
      }
      if (ch === '"' || ch === "'") {
        const quote = ch;
        let j = i + 1;
        while (j < src.length && src[j] !== "\n") {
          if (src[j] === "\\" && j + 1 < src.length) {
            j += 2;
          } else if (src[j] === quote) {
            j++;
            break;
          } else {
            j++;
          }
        }
        result += src.substring(i, j);
        const nextStr = checkAdjacentString(j);
        if (nextStr !== -1) {
          result += " + ";
          i = nextStr;
        } else {
          i = j;
        }
        continue;
      }
      result += ch;
      i++;
    }
    return result;
  }
  function preprocessPython(rawSrc) {
    if (!rawSrc || typeof rawSrc !== "string") return "";
    const src = normalizePythonSource(rawSrc);
    const lines = src.split("\n");
    const indentStack = [0];
    const out = [];
    let bracketDepth = 0;
    for (let i = 0; i < lines.length; i++) {
      const rawLine = lines[i];
      let line = rawLine;
      let inSingle = false;
      let inDouble = false;
      let commentIdx = -1;
      for (let c = 0; c < line.length; c++) {
        const char = line[c];
        if (char === "\\" && (inSingle || inDouble)) {
          c++;
          continue;
        }
        if (char === "'" && !inDouble) inSingle = !inSingle;
        else if (char === '"' && !inSingle) inDouble = !inDouble;
        else if (char === "#" && !inSingle && !inDouble) {
          commentIdx = c;
          break;
        }
      }
      if (commentIdx !== -1) {
        line = line.substring(0, commentIdx);
      }
      line = transformFStrings(line);
      const trimmed = line.trim();
      if (!trimmed) {
        continue;
      }
      let lineBrackets = 0;
      inSingle = false;
      inDouble = false;
      for (let c = 0; c < trimmed.length; c++) {
        const char = trimmed[c];
        if (char === "\\" && (inSingle || inDouble)) {
          c++;
          continue;
        }
        if (char === "'" && !inDouble) inSingle = !inSingle;
        else if (char === '"' && !inSingle) inDouble = !inDouble;
        else if (!inSingle && !inDouble) {
          if (char === "(" || char === "[" || char === "{") lineBrackets++;
          else if (char === ")" || char === "]" || char === "}") lineBrackets--;
        }
      }
      if (bracketDepth === 0) {
        let indent = 0;
        while (indent < line.length && (line[indent] === " " || line[indent] === "	")) {
          indent += line[indent] === "	" ? 4 : 1;
        }
        const currentIndent = indentStack[indentStack.length - 1];
        if (indent > currentIndent) {
          indentStack.push(indent);
          out.push("{\n");
        } else if (indent < currentIndent) {
          while (indentStack.length > 1 && indent < indentStack[indentStack.length - 1]) {
            indentStack.pop();
            out.push("}\n");
          }
          if (indent !== indentStack[indentStack.length - 1]) {
            throw new Error(`IndentationError: line ${i + 1}: unindent does not match any outer indentation level`);
          }
        }
      }
      bracketDepth += lineBrackets;
      if (bracketDepth < 0) bracketDepth = 0;
      if (trimmed.endsWith(";") || trimmed.endsWith(":") || trimmed.startsWith("@")) {
        out.push(trimmed + "\n");
      } else if (bracketDepth > 0) {
        out.push(trimmed + " ");
      } else {
        out.push(trimmed + ";\n");
      }
    }
    while (indentStack.length > 1) {
      indentStack.pop();
      out.push("}\n");
    }
    return out.join("");
  }

  // js/frontend/python.js
  var pythonGrammar = null;
  var pythonSemantics = null;
  function initPythonFrontend() {
    if (!pythonGrammar) {
      const bundle = grammars(PYTHON_GRAMMAR_SRC);
      pythonGrammar = bundle.PythonSyntax;
      pythonSemantics = createPythonSemantics(pythonGrammar);
    }
    return { grammar: pythonGrammar, semantics: pythonSemantics };
  }
  function parsePythonSource(sourceCode) {
    const { grammar: grammar2, semantics } = initPythonFrontend();
    const preprocessed = preprocessPython(sourceCode);
    const match = grammar2.match(preprocessed, "PyProgram");
    if (!match.succeeded()) {
      throw new SyntaxError(`Python Syntax Error:
${match.message}`);
    }
    return semantics(match).toAST();
  }

  // js/frontend/index.js
  var javaGrammar = null;
  var javaSemantics = null;
  var cGrammar = null;
  var cSemantics = null;
  function initJavaFrontend() {
    if (!javaGrammar) {
      const grammars2 = grammars(JAVA_GRAMMAR_SRC);
      javaGrammar = grammars2.JavaFamily;
      javaSemantics = createASTSemantics(javaGrammar);
    }
    return { grammar: javaGrammar, semantics: javaSemantics };
  }
  function initCFrontend() {
    if (!cGrammar) {
      const grammars2 = grammars(C_GRAMMAR_SRC);
      cGrammar = grammars2.CSyntax;
      cSemantics = createCSemantics(cGrammar);
    }
    return { grammar: cGrammar, semantics: cSemantics };
  }
  function parseSource(sourceCode, language = "auto") {
    let lang = language;
    if (lang === "auto") {
      const trimmed = sourceCode.trim();
      if (trimmed.startsWith("#include") || trimmed.includes("PyMethodDef") || trimmed.includes("PyMODINIT_FUNC")) {
        lang = "c";
      } else if (trimmed.startsWith("#") || trimmed.startsWith("def ") || trimmed.startsWith("import ") || trimmed.startsWith("from ") || trimmed.includes("def ") || trimmed.includes("import ")) {
        lang = "python";
      } else if (trimmed.startsWith("//") || trimmed.startsWith("/*")) {
        if (trimmed.includes("public class") || trimmed.includes("class ") || trimmed.includes("public static")) {
          lang = "java";
        } else {
          lang = "c";
        }
      } else if (trimmed.includes("public class") || trimmed.includes("public static void main") || trimmed.startsWith("class ") && trimmed.includes("{")) {
        lang = "java";
      } else if (/\b(int|void|double|float|long|boolean|char|String)\s+[a-zA-Z_0-9]+\s*(=|[;(])/.test(trimmed) && trimmed.includes(";")) {
        lang = "c";
      } else {
        lang = "python";
      }
    }
    if (lang === "python") {
      return parsePythonSource(sourceCode);
    }
    if (lang === "c") {
      if (sourceCode.includes("#include") || sourceCode.includes("PyMethodDef") || sourceCode.includes("PyMODINIT_FUNC")) {
        const { grammar: grammar4, semantics: semantics3 } = initCFrontend();
        const match3 = grammar4.match(sourceCode, "CProgram");
        if (match3.succeeded()) {
          return semantics3(match3).toAST();
        }
      }
      const { grammar: grammar3, semantics: semantics2 } = initJavaFrontend();
      const match2 = grammar3.match(sourceCode, "Program");
      if (match2.failed()) {
        throw new SyntaxError(`C Syntax Error:
${match2.message}`);
      }
      return semantics2(match2).toAST();
    }
    const { grammar: grammar2, semantics } = initJavaFrontend();
    const match = grammar2.match(sourceCode, "Program");
    if (match.failed()) {
      throw new SyntaxError(`Syntax Error:
${match.message}`);
    }
    return semantics(match).toAST();
  }

  // js/vm/opcodes.js
  var OP = {
    // Stack operations
    NOP: 0,
    CONST: 1,
    // [CONST, const_idx] -> push constants[const_idx]
    POP: 2,
    // pop value from stack
    DUP: 3,
    // duplicate top of stack
    SWAP: 4,
    // swap top two stack values
    // Literals
    TRUE: 5,
    // push true
    FALSE: 6,
    // push false
    NIL: 7,
    // push null
    // Local variables (stack-frame indexed slots)
    LOAD_LOCAL: 16,
    // [LOAD_LOCAL, slot_idx]
    STORE_LOCAL: 17,
    // [STORE_LOCAL, slot_idx]
    // Global variables (named)
    LOAD_GLOBAL: 18,
    // [LOAD_GLOBAL, name_const_idx]
    STORE_GLOBAL: 19,
    // [STORE_GLOBAL, name_const_idx]
    // Closures & Upvalues (lexical enclosing scopes)
    LOAD_UPVALUE: 20,
    // [LOAD_UPVALUE, slot_idx, hops]
    STORE_UPVALUE: 21,
    // [STORE_UPVALUE, slot_idx, hops]
    // Arithmetic
    ADD: 32,
    // b = pop(), a = pop(), push(a + b)
    SUB: 33,
    // b = pop(), a = pop(), push(a - b)
    MUL: 34,
    // b = pop(), a = pop(), push(a * b)
    DIV: 35,
    // b = pop(), a = pop(), push(a / b)
    MOD: 36,
    // b = pop(), a = pop(), push(a % b)
    POW: 37,
    // b = pop(), a = pop(), push(a ** b)
    NEG: 38,
    // a = pop(), push(-a)
    IDIV: 39,
    // b = pop(), a = pop(), push(Math.floor(a / b))
    MATMUL: 40,
    // b = pop(), a = pop(), push(a @ b)
    POS: 41,
    // a = pop(), push(+a or a.__pos__())
    // Bitwise
    BIT_AND: 48,
    BIT_OR: 49,
    BIT_XOR: 50,
    BIT_NOT: 51,
    SHL: 52,
    SHR: 53,
    // Comparison & Logic
    EQ: 64,
    // push(a === b)
    NEQ: 65,
    // push(a !== b)
    LT: 66,
    // push(a < b)
    LTE: 67,
    // push(a <= b)
    GT: 68,
    // push(a > b)
    GTE: 69,
    // push(a >= b)
    NOT: 70,
    // push(!isTruthy(a))
    IN: 71,
    // b = pop(), a = pop(), push(b.includes(a) or a in b)
    // Branching & Control Flow
    JUMP: 80,
    // [JUMP, target_pc]
    JUMP_IF_FALSE: 81,
    // [JUMP_IF_FALSE, target_pc] -> pops condition; jumps if falsy
    JUMP_IF_TRUE: 82,
    // [JUMP_IF_TRUE, target_pc]  -> pops condition; jumps if truthy
    PUSH_TRY: 83,
    // [PUSH_TRY, catch_pc, finally_pc] -> pushes try frame
    POP_TRY: 84,
    // pops try frame
    RAISE: 85,
    // pops error and unwinds stack
    // Functions & Calls
    CALL: 96,
    // [CALL, argc] -> callee and args on stack
    RETURN: 97,
    // returns top stack value
    CALL_SPREAD: 98,
    // pops args array, pops callee, invokes with spread args
    // Data structures
    BUILD_LIST: 112,
    // [BUILD_LIST, count] -> pops count elements, pushes array
    BUILD_MAP: 113,
    // [BUILD_MAP, count]  -> pops count*2 elements, pushes object
    GET_INDEX: 114,
    // idx = pop(), obj = pop(), push(obj[idx])
    SET_INDEX: 115,
    // val = pop(), idx = pop(), obj = pop(), obj[idx] = val
    GET_MEMBER: 116,
    // [GET_MEMBER, prop_const_idx]
    SET_MEMBER: 117,
    // [SET_MEMBER, prop_const_idx]
    DICT_UPDATE: 118,
    // pops src, pops target, merges src into target, pushes target
    // Modules & Imports
    IMPORT: 128,
    // [IMPORT, module_name_const_idx] -> pushes module object
    IMPORT_STAR: 129,
    // pops module object, copies exports to current frame globals
    // System & VM lifecycle
    SYSCALL: 240,
    // [SYSCALL, syscall_id] -> invokes host syscall
    HALT: 255
    // stops VM execution
  };
  var OP_NAMES = Object.fromEntries(
    Object.entries(OP).map(([name, code]) => [code, name])
  );

  // js/vm/syscalls.js
  var SYSCALL = {
    PRINT: 1,
    // Prints argument to stdout / virtual console
    INPUT: 2,
    // Requests user input from UI (cooperatively suspends)
    SLEEP: 3,
    // Suspends execution for specified milliseconds
    TIME: 4,
    // High-resolution timestamp
    RANDOM: 5,
    // Random float between 0 and 1
    STR: 6,
    // Convert value to string
    INT: 7,
    // Convert value to integer
    LEN: 8
    // Get length of array/string/object
  };
  var SYSCALL_NAMES = Object.fromEntries(
    Object.entries(SYSCALL).map(([name, code]) => [code, name])
  );

  // js/vm/program.js
  var BytecodeProgram = class {
    constructor() {
      this.constants = [];
      this.instructions = [];
      this.sourceMap = /* @__PURE__ */ new Map();
      this.functionTable = /* @__PURE__ */ new Map();
      this.entryPoint = 0;
    }
    /**
     * Adds a constant to the constant pool, returning its index.
     * Reuses existing primitive constants if present.
     */
    addConstant(value) {
      if (typeof value === "number" || typeof value === "string" || typeof value === "boolean") {
        const existingIdx = this.constants.indexOf(value);
        if (existingIdx !== -1) return existingIdx;
      }
      this.constants.push(value);
      return this.constants.length - 1;
    }
    /**
     * Emits an opcode with optional operands to the instruction stream.
     * @returns {number} The starting PC index of the emitted instruction.
     */
    emit(opcode, ...operands) {
      const pc = this.instructions.length;
      this.instructions.push(opcode);
      for (const operand of operands) {
        this.instructions.push(operand);
      }
      return pc;
    }
    /**
     * Patches an operand at a specific instruction index (used for jump targets).
     */
    patch(index, value) {
      this.instructions[index] = value;
    }
    /**
     * Disassembles the bytecode instructions into human-readable assembly text.
     * @returns {string} Formatted disassembly.
     */
    disassemble() {
      const lines = [];
      lines.push("=== Bytecode Disassembly ===");
      lines.push(`Constants: [${this.constants.map((c, i) => `${i}: ${JSON.stringify(c)}`).join(", ")}]`);
      lines.push("Instructions:");
      let pc = 0;
      while (pc < this.instructions.length) {
        const startPc = pc;
        const op = this.instructions[pc++];
        const opName = OP_NAMES[op] || `UNKNOWN(0x${op.toString(16)})`;
        let operandStr = "";
        switch (op) {
          case OP.CONST: {
            const idx = this.instructions[pc++];
            operandStr = `#${idx} (${JSON.stringify(this.constants[idx])})`;
            break;
          }
          case OP.LOAD_LOCAL:
          case OP.STORE_LOCAL: {
            const slot = this.instructions[pc++];
            operandStr = `slot[${slot}]`;
            break;
          }
          case OP.LOAD_GLOBAL:
          case OP.STORE_GLOBAL: {
            const nameIdx = this.instructions[pc++];
            operandStr = `@${this.constants[nameIdx]} (#${nameIdx})`;
            break;
          }
          case OP.JUMP:
          case OP.JUMP_IF_FALSE:
          case OP.JUMP_IF_TRUE: {
            const target = this.instructions[pc++];
            operandStr = `-> ${String(target).padStart(4, "0")}`;
            break;
          }
          case OP.CALL: {
            const argc = this.instructions[pc++];
            operandStr = `argc=${argc}`;
            break;
          }
          case OP.BUILD_LIST:
          case OP.BUILD_MAP: {
            const count = this.instructions[pc++];
            operandStr = `count=${count}`;
            break;
          }
          case OP.GET_MEMBER:
          case OP.SET_MEMBER: {
            const propIdx = this.instructions[pc++];
            operandStr = `.${this.constants[propIdx]} (#${propIdx})`;
            break;
          }
          case OP.IMPORT: {
            const modIdx = this.instructions[pc++];
            operandStr = `${this.constants[modIdx]} (#${modIdx})`;
            break;
          }
          case OP.SYSCALL: {
            const id = this.instructions[pc++];
            const sysName = SYSCALL_NAMES[id] || `0x${id.toString(16)}`;
            operandStr = `SYS_${sysName} (${id})`;
            break;
          }
          default:
            break;
        }
        const pcFormatted = String(startPc).padStart(4, "0");
        lines.push(`  ${pcFormatted}:  ${opName.padEnd(16)} ${operandStr}`);
      }
      return lines.join("\n");
    }
    /**
     * Returns structured instructions array for UI inspection and step debugging.
     */
    getInstructionList() {
      const list = [];
      let pc = 0;
      while (pc < this.instructions.length) {
        const startPc = pc;
        const op = this.instructions[pc++];
        const opName = OP_NAMES[op] || `UNKNOWN(0x${op.toString(16)})`;
        let operandStr = "";
        switch (op) {
          case OP.CONST: {
            const idx = this.instructions[pc++];
            operandStr = `#${idx} (${JSON.stringify(this.constants[idx])})`;
            break;
          }
          case OP.LOAD_LOCAL:
          case OP.STORE_LOCAL: {
            const slot = this.instructions[pc++];
            operandStr = `slot[${slot}]`;
            break;
          }
          case OP.LOAD_GLOBAL:
          case OP.STORE_GLOBAL: {
            const nameIdx = this.instructions[pc++];
            operandStr = `@${this.constants[nameIdx]} (#${nameIdx})`;
            break;
          }
          case OP.JUMP:
          case OP.JUMP_IF_FALSE:
          case OP.JUMP_IF_TRUE: {
            const target = this.instructions[pc++];
            operandStr = `-> ${String(target).padStart(4, "0")}`;
            break;
          }
          case OP.CALL: {
            const argc = this.instructions[pc++];
            operandStr = `argc=${argc}`;
            break;
          }
          case OP.BUILD_LIST:
          case OP.BUILD_MAP: {
            const count = this.instructions[pc++];
            operandStr = `count=${count}`;
            break;
          }
          case OP.GET_MEMBER:
          case OP.SET_MEMBER: {
            const propIdx = this.instructions[pc++];
            operandStr = `.${this.constants[propIdx]} (#${propIdx})`;
            break;
          }
          case OP.IMPORT: {
            const modIdx = this.instructions[pc++];
            operandStr = `${this.constants[modIdx]} (#${modIdx})`;
            break;
          }
          case OP.SYSCALL: {
            const id = this.instructions[pc++];
            const sysName = SYSCALL_NAMES[id] || `0x${id.toString(16)}`;
            operandStr = `SYS_${sysName} (${id})`;
            break;
          }
          default:
            break;
        }
        list.push({
          pc: startPc,
          endPc: pc,
          op,
          opName,
          operandStr
        });
      }
      return list;
    }
  };

  // js/vm/terminal.js
  var VirtualTerminal = class {
    constructor(options = {}) {
      this.maxLines = options.maxLines || 5e3;
      this.onUpdate = options.onUpdate || null;
      this.clear();
    }
    /**
     * Resets terminal buffer and cursor.
     */
    clear() {
      this.lines = [""];
      this.cursorRow = 0;
      this.cursorCol = 0;
      if (this.onUpdate) this.onUpdate(this.getText());
    }
    /**
     * Writes a chunk of text through the terminal control processor.
     */
    write(chunk) {
      if (chunk === null || chunk === void 0) return;
      const str = String(chunk);
      let i = 0;
      while (i < str.length) {
        if (str[i] === "\x1B" && str[i + 1] === "[") {
          const match = str.slice(i).match(/^\x1b\[([?0-9;]*)([a-zA-Z])/);
          if (match) {
            const fullSeq = match[0];
            const rawParams = match[1];
            const cmd = match[2];
            const params = rawParams ? rawParams.replace(/^\?/, "").split(";").map((p) => parseInt(p, 10)) : [];
            this._handleAnsiCsi(cmd, params);
            i += fullSeq.length;
            continue;
          } else {
            i++;
            continue;
          }
        }
        if (str[i] === "\x1B" && str[i + 1] === "]") {
          const oscMatch = str.slice(i).match(/^\x1b\].*?(\x07|\x1b\\)/);
          if (oscMatch) {
            i += oscMatch[0].length;
            continue;
          }
        }
        if (str[i] === "\r") {
          if (str[i + 1] === "\n") {
            this._newLine();
            i += 2;
          } else {
            this.cursorCol = 0;
            i++;
          }
          continue;
        }
        if (str[i] === "\n") {
          this._newLine();
          i++;
          continue;
        }
        if (str[i] === "\b") {
          if (this.cursorCol > 0) {
            this.cursorCol--;
          }
          i++;
          continue;
        }
        if (str[i] === "	") {
          const tabSize = 4;
          const nextCol = (Math.floor(this.cursorCol / tabSize) + 1) * tabSize;
          while (this.cursorCol < nextCol) {
            this._writeChar(" ");
          }
          i++;
          continue;
        }
        this._writeChar(str[i]);
        i++;
      }
      if (this.onUpdate) {
        this.onUpdate(this.getText());
      }
    }
    _newLine() {
      this.cursorRow++;
      this.cursorCol = 0;
      while (this.lines.length <= this.cursorRow) {
        this.lines.push("");
      }
      if (this.lines.length > this.maxLines) {
        const dropCount = this.lines.length - this.maxLines;
        this.lines.splice(0, dropCount);
        this.cursorRow = Math.max(0, this.cursorRow - dropCount);
      }
    }
    _writeChar(ch) {
      while (this.lines.length <= this.cursorRow) {
        this.lines.push("");
      }
      let curLine = this.lines[this.cursorRow];
      if (this.cursorCol > curLine.length) {
        curLine = curLine.padEnd(this.cursorCol, " ");
      }
      this.lines[this.cursorRow] = curLine.slice(0, this.cursorCol) + ch + curLine.slice(this.cursorCol + 1);
      this.cursorCol++;
    }
    _handleAnsiCsi(cmd, params) {
      const p1 = params[0] !== void 0 && !isNaN(params[0]) ? params[0] : 0;
      const p2 = params[1] !== void 0 && !isNaN(params[1]) ? params[1] : 0;
      switch (cmd) {
        case "J":
          if (p1 === 2 || p1 === 3) {
            this.lines = [""];
            this.cursorRow = 0;
            this.cursorCol = 0;
          } else if (p1 === 0) {
            if (this.cursorRow < this.lines.length) {
              this.lines[this.cursorRow] = (this.lines[this.cursorRow] || "").slice(0, this.cursorCol);
              this.lines = this.lines.slice(0, this.cursorRow + 1);
            }
          }
          break;
        case "K":
          while (this.lines.length <= this.cursorRow) this.lines.push("");
          if (p1 === 2) {
            this.lines[this.cursorRow] = "";
            this.cursorCol = 0;
          } else if (p1 === 1) {
            const rest = (this.lines[this.cursorRow] || "").slice(this.cursorCol);
            this.lines[this.cursorRow] = " ".repeat(this.cursorCol) + rest;
          } else {
            this.lines[this.cursorRow] = (this.lines[this.cursorRow] || "").slice(0, this.cursorCol);
          }
          break;
        case "H":
        case "f":
          const targetRow = Math.max(0, (p1 || 1) - 1);
          const targetCol = Math.max(0, (p2 || 1) - 1);
          this.cursorRow = targetRow;
          this.cursorCol = targetCol;
          while (this.lines.length <= this.cursorRow) this.lines.push("");
          break;
        case "A":
          this.cursorRow = Math.max(0, this.cursorRow - (p1 || 1));
          break;
        case "B":
          this.cursorRow += p1 || 1;
          while (this.lines.length <= this.cursorRow) this.lines.push("");
          break;
        case "C":
          this.cursorCol += p1 || 1;
          break;
        case "D":
          this.cursorCol = Math.max(0, this.cursorCol - (p1 || 1));
          break;
        case "m":
          break;
        default:
          break;
      }
    }
    /**
     * Returns current terminal buffer as formatted text.
     */
    getText() {
      return this.lines.join("\n");
    }
  };

  // js/vm/vm.js
  var CallFrame = class {
    constructor(returnPC, fnName = "<anonymous>", localCount = 16, globals = null) {
      this.returnPC = returnPC;
      this.fnName = fnName;
      this.locals = new Array(localCount).fill(null);
      this.globals = globals;
    }
  };
  function formatValue(val, spec) {
    if (spec === null || spec === void 0 || spec === "") {
      if (typeof val === "boolean") return val ? "True" : "False";
      if (val === null || val === void 0) return "None";
      return String(val);
    }
    const match = String(spec).match(/^(?:(.)?([<>=^]))?([+\- ])?(#)?(0)?(\d+)?([,_])?(?:\.(\d+))?([bcdeEfFgGnosxX%])?$/);
    if (!match) {
      if (typeof val === "boolean") return val ? "True" : "False";
      if (val === null || val === void 0) return "None";
      if (typeof val === "number" && !isNaN(parseFloat(spec))) {
        return val.toFixed(parseInt(spec, 10));
      }
      return String(val);
    }
    let [_, fill, align, sign, alt, zero, width, grouping, prec, type] = match;
    width = width ? parseInt(width, 10) : 0;
    prec = prec !== void 0 ? parseInt(prec, 10) : void 0;
    fill = fill || (zero ? "0" : " ");
    align = align || (zero ? "=" : typeof val === "number" ? ">" : "<");
    let formatted = "";
    const num = Number(val);
    if (typeof val === "boolean" && (!type || type === "s")) {
      formatted = val ? "True" : "False";
    } else if ((val === null || val === void 0) && (!type || type === "s")) {
      formatted = "None";
    } else {
      switch (type) {
        case "b":
          formatted = Math.floor(num).toString(2);
          break;
        case "o":
          formatted = Math.floor(num).toString(8);
          break;
        case "x":
          formatted = Math.floor(num).toString(16);
          break;
        case "X":
          formatted = Math.floor(num).toString(16).toUpperCase();
          break;
        case "d":
          formatted = String(Math.floor(num));
          break;
        case "f":
        case "F":
          formatted = prec !== void 0 ? num.toFixed(prec) : String(num);
          break;
        case "e":
          formatted = prec !== void 0 ? num.toExponential(prec) : num.toExponential();
          break;
        case "E":
          formatted = (prec !== void 0 ? num.toExponential(prec) : num.toExponential()).toUpperCase();
          break;
        case "%":
          formatted = (prec !== void 0 ? (num * 100).toFixed(prec) : (num * 100).toFixed(6)) + "%";
          break;
        case "s":
          formatted = String(val);
          break;
        default:
          if (prec !== void 0 && !isNaN(num)) {
            formatted = num.toFixed(prec);
          } else {
            formatted = String(val);
          }
          break;
      }
    }
    if (grouping === ",") {
      const parts = formatted.split(".");
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      formatted = parts.join(".");
    } else if (grouping === "_") {
      const parts = formatted.split(".");
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, "_");
      formatted = parts.join("_");
    }
    if (typeof val === "number" && num >= 0) {
      if (sign === "+") formatted = "+" + formatted;
      else if (sign === " ") formatted = " " + formatted;
    }
    if (formatted.length < width) {
      const padLen = width - formatted.length;
      if (align === "<") {
        formatted = formatted + fill.repeat(padLen);
      } else if (align === ">") {
        formatted = fill.repeat(padLen) + formatted;
      } else if (align === "^") {
        const left = Math.floor(padLen / 2);
        const right = padLen - left;
        formatted = fill.repeat(left) + formatted + fill.repeat(right);
      } else if (align === "=") {
        if (formatted.startsWith("+") || formatted.startsWith("-")) {
          formatted = formatted[0] + fill.repeat(padLen) + formatted.slice(1);
        } else {
          formatted = fill.repeat(padLen) + formatted;
        }
      }
    }
    return formatted;
  }
  function formatPrintfString(fmt, args) {
    if (typeof fmt !== "string") return fmt;
    const isDict = args && typeof args === "object" && !Array.isArray(args);
    let argIdx = 0;
    const argList = Array.isArray(args) ? args : [args];
    return fmt.replace(/%(\(([^)]+)\))?([#0\- +]*)?(\*|\d+)?(?:\.(\*|\d+))?[hlL]?([diouxXeEfFgGcrs%])/g, (match, _p1, key, flags, width, prec, type) => {
      if (type === "%") return "%";
      let val;
      if (key) {
        val = isDict ? args[key] : void 0;
      } else {
        val = argList[argIdx++];
      }
      if (val === void 0) val = "None";
      flags = flags || "";
      const leftAlign = flags.includes("-");
      const zeroPad = flags.includes("0") && !leftAlign;
      const sign = flags.includes("+") ? "+" : flags.includes(" ") ? " " : "";
      const w = width ? parseInt(width, 10) : 0;
      const p = prec ? parseInt(prec, 10) : void 0;
      let str = "";
      switch (type) {
        case "s":
          str = String(val);
          if (p !== void 0) str = str.slice(0, p);
          break;
        case "r":
          str = typeof val === "string" ? `'${val}'` : Array.isArray(val) ? JSON.stringify(val) : String(val);
          break;
        case "d":
        case "i": {
          const num = Math.trunc(Number(val) || 0);
          str = String(Math.abs(num));
          if (p !== void 0) str = str.padStart(p, "0");
          if (num < 0) str = "-" + str;
          else if (sign) str = sign + str;
          break;
        }
        case "f":
        case "F": {
          const num = Number(val) || 0;
          str = p !== void 0 ? num.toFixed(p) : num.toFixed(6);
          if (num >= 0 && sign) str = sign + str;
          break;
        }
        case "x":
          str = Math.floor(Number(val) || 0).toString(16);
          break;
        case "X":
          str = Math.floor(Number(val) || 0).toString(16).toUpperCase();
          break;
        case "o":
          str = Math.floor(Number(val) || 0).toString(8);
          break;
        case "c":
          str = typeof val === "number" ? String.fromCharCode(val) : String(val)[0] || "";
          break;
        default:
          str = String(val);
          break;
      }
      if (str.length < w) {
        const pad = " ".repeat(w - str.length);
        str = leftAlign ? str + pad : zeroPad ? str.padStart(w, "0") : pad + str;
      }
      return str;
    });
  }
  function floatFromHex(s) {
    s = String(s || "").trim().toLowerCase();
    let sign = 1;
    if (s.startsWith("-")) {
      sign = -1;
      s = s.slice(1);
    } else if (s.startsWith("+")) {
      s = s.slice(1);
    }
    if (s.startsWith("0x")) s = s.slice(2);
    let exp = 0;
    const pIdx = s.indexOf("p");
    if (pIdx !== -1) {
      exp = parseInt(s.slice(pIdx + 1), 10) || 0;
      s = s.slice(0, pIdx);
    }
    const dotIdx = s.indexOf(".");
    let intPart = 0;
    let fracPart = 0;
    if (dotIdx === -1) {
      intPart = parseInt(s, 16) || 0;
    } else {
      const intStr = s.slice(0, dotIdx);
      const fracStr = s.slice(dotIdx + 1);
      intPart = intStr ? parseInt(intStr, 16) || 0 : 0;
      let frac = 0;
      for (let i = 0; i < fracStr.length && i < 14; i++) {
        const digit = parseInt(fracStr[i], 16);
        if (!isNaN(digit)) {
          frac += digit * Math.pow(16, -(i + 1));
        }
      }
      fracPart = frac;
    }
    return sign * (intPart + fracPart) * Math.pow(2, exp);
  }
  function resolveMember(obj, prop) {
    if (obj === null || obj === void 0) {
      throw new TypeError(`UVM TypeError: cannot read property '${prop}' of null/undefined`);
    }
    if (typeof obj === "string") {
      switch (prop) {
        case "split":
          return (sep, maxsplit) => {
            if (sep === void 0 || sep === null) {
              const parts = obj.trim().split(/\s+/);
              return parts.length === 1 && parts[0] === "" ? [] : parts;
            }
            if (maxsplit !== void 0 && maxsplit >= 0) {
              const parts = obj.split(sep);
              if (parts.length <= maxsplit + 1) return parts;
              const res = parts.slice(0, maxsplit);
              res.push(parts.slice(maxsplit).join(sep));
              return res;
            }
            return obj.split(sep);
          };
        case "join":
          return (iterable) => Array.from(iterable || []).map((x) => String(x)).join(obj);
        case "strip":
          return (chars) => {
            if (!chars) return obj.trim();
            const esc = chars.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            return obj.replace(new RegExp(`^[${esc}]+|[${esc}]+$`, "g"), "");
          };
        case "lstrip":
          return (chars) => {
            if (!chars) return obj.trimStart();
            const esc = chars.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            return obj.replace(new RegExp(`^[${esc}]+`, "g"), "");
          };
        case "rstrip":
          return (chars) => {
            if (!chars) return obj.trimEnd();
            const esc = chars.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            return obj.replace(new RegExp(`[${esc}]+$`, "g"), "");
          };
        case "replace":
          return (oldStr, newStr, count) => {
            if (count === void 0) return obj.replaceAll(oldStr, newStr);
            let res = obj;
            for (let i = 0; i < count; i++) {
              const idx = res.indexOf(oldStr);
              if (idx === -1) break;
              res = res.slice(0, idx) + newStr + res.slice(idx + oldStr.length);
            }
            return res;
          };
        case "startswith":
          return (prefix) => obj.startsWith(prefix);
        case "endswith":
          return (suffix) => obj.endsWith(suffix);
        case "find":
          return (sub, start = 0) => obj.indexOf(sub, start);
        case "rfind":
          return (sub, start = 0) => obj.lastIndexOf(sub);
        case "index":
          return (sub, start = 0) => {
            const idx = obj.indexOf(sub, start);
            if (idx === -1) throw new Error("ValueError: substring not found");
            return idx;
          };
        case "expandtabs":
          return (tabsize = 8) => {
            let result = "";
            let col = 0;
            for (let i = 0; i < obj.length; i++) {
              const ch = obj[i];
              if (ch === "	") {
                const numSpaces = tabsize - col % tabsize;
                result += " ".repeat(numSpaces);
                col += numSpaces;
              } else {
                result += ch;
                if (ch === "\n" || ch === "\r") col = 0;
                else col++;
              }
            }
            return result;
          };
        case "translate":
          return (table) => {
            if (!table) return obj;
            let result = "";
            for (let i = 0; i < obj.length; i++) {
              const code = obj.charCodeAt(i);
              const ch = obj[i];
              let repl = table[code] !== void 0 ? table[code] : table[ch] !== void 0 ? table[ch] : void 0;
              if (repl === void 0) {
                result += ch;
              } else if (repl === null) {
              } else if (typeof repl === "number") {
                result += String.fromCharCode(repl);
              } else {
                result += String(repl);
              }
            }
            return result;
          };
        case "count":
          return (sub) => {
            if (!sub) return 0;
            let count = 0, pos = 0;
            while ((pos = obj.indexOf(sub, pos)) !== -1) {
              count++;
              pos += sub.length;
            }
            return count;
          };
        case "lower":
          return () => obj.toLowerCase();
        case "upper":
          return () => obj.toUpperCase();
        case "capitalize":
          return () => obj.length ? obj[0].toUpperCase() + obj.slice(1).toLowerCase() : "";
        case "title":
          return () => obj.replace(/\b\w/g, (c) => c.toUpperCase());
        case "isdigit":
          return () => /^\d+$/.test(obj);
        case "isalpha":
          return () => /^[a-zA-Z]+$/.test(obj);
        case "isalnum":
          return () => /^[a-zA-Z0-9]+$/.test(obj);
        case "isspace":
          return () => /^\s+$/.test(obj);
        case "format":
          return (...args) => {
            let idx = 0;
            return obj.replace(/{(\w*)}/g, (match, key) => {
              if (key === "") return args[idx++];
              const kIdx = parseInt(key, 10);
              if (!isNaN(kIdx)) return args[kIdx];
              return match;
            });
          };
        case "center":
          return (width, fillchar = " ") => {
            if (width <= obj.length) return obj;
            const margin = width - obj.length;
            const left = Math.floor(margin / 2);
            const right = margin - left;
            return fillchar.repeat(left) + obj + fillchar.repeat(right);
          };
        case "ljust":
          return (width, fillchar = " ") => {
            if (width <= obj.length) return obj;
            return obj + fillchar.repeat(width - obj.length);
          };
        case "rjust":
          return (width, fillchar = " ") => {
            if (width <= obj.length) return obj;
            return fillchar.repeat(width - obj.length) + obj;
          };
        case "zfill":
          return (width) => {
            if (width <= obj.length) return obj;
            const sign = obj[0] === "+" || obj[0] === "-" ? obj[0] : "";
            const body = sign ? obj.slice(1) : obj;
            const pad = Math.max(0, width - obj.length);
            return sign + "0".repeat(pad) + body;
          };
        case "splitlines":
          return (keepends = false) => {
            if (keepends) {
              return obj.match(/[^\r\n]*(\r\n|\r|\n|$)/g).filter((x) => x.length > 0);
            }
            return obj.split(/\r\n|\r|\n/);
          };
        default:
          return obj[prop] !== void 0 ? typeof obj[prop] === "function" ? obj[prop].bind(obj) : obj[prop] : void 0;
      }
    }
    if (Array.isArray(obj)) {
      switch (prop) {
        case "append":
          return (item) => {
            obj.push(item);
            return null;
          };
        case "extend":
          return (items) => {
            obj.push(...items || []);
            return null;
          };
        case "insert":
          return (index, item) => {
            obj.splice(index, 0, item);
            return null;
          };
        case "remove":
          return (item) => {
            const idx = obj.indexOf(item);
            if (idx === -1) throw new Error("ValueError: list.remove(x): x not in list");
            obj.splice(idx, 1);
            return null;
          };
        case "pop":
          return (index = -1) => {
            if (obj.length === 0) {
              console.log("POP ON EMPTY LIST! Stack:", new Error().stack);
              throw new Error("IndexError: pop from empty list");
            }
            if (index === -1) return obj.pop();
            const resolved = index < 0 ? obj.length + index : index;
            return obj.splice(resolved, 1)[0];
          };
        case "clear":
          return () => {
            obj.length = 0;
            return null;
          };
        case "index":
          return (item) => {
            const idx = obj.indexOf(item);
            if (idx === -1) throw new Error("ValueError: item is not in list");
            return idx;
          };
        case "count":
          return (item) => obj.filter((x) => x === item).length;
        case "reverse":
          return () => {
            obj.reverse();
            return null;
          };
        case "sort":
          return (key = null, reverse = false) => {
            obj.sort((a, b) => {
              const va = key ? key(a) : a;
              const vb = key ? key(b) : b;
              if (va < vb) return reverse ? 1 : -1;
              if (va > vb) return reverse ? -1 : 1;
              return 0;
            });
            return null;
          };
        case "copy":
          return () => [...obj];
        default:
          break;
      }
    }
    if (typeof obj === "object" && !obj.__is_class_instance__) {
      if (typeof obj[prop] === "function") {
        const fn = obj[prop];
        const bound = fn.bind(obj);
        if (fn.__uvm_mod_vm__) bound.__uvm_mod_vm__ = fn.__uvm_mod_vm__;
        if (fn.__uvm_callable__) bound.__uvm_callable__ = fn.__uvm_callable__;
        return bound;
      }
      if (prop === "keys") return () => Object.keys(obj);
      if (prop === "values") return () => Object.values(obj);
      if (prop === "items") return () => Object.entries(obj);
      if (prop === "get") return (key, defaultVal = null) => key in obj ? obj[key] : defaultVal;
      if (prop === "pop") return (key, defaultVal) => {
        if (key in obj) {
          const val2 = obj[key];
          delete obj[key];
          return val2;
        }
        if (defaultVal !== void 0) return defaultVal;
        throw new Error(`KeyError: '${key}'`);
      };
      if (prop === "update") return (other) => {
        if (other && typeof other === "object") {
          Object.assign(obj, other);
        }
        return null;
      };
      if (prop === "clear") return () => {
        for (const k of Object.keys(obj)) delete obj[k];
        return null;
      };
      if (prop === "copy") return () => ({ ...obj });
    }
    if (prop === "__dict__") {
      return obj;
    }
    let val = obj[prop];
    if (val === void 0 && obj && obj.__class__ && typeof obj.__class__ === "object") {
      val = obj.__class__[prop];
    }
    if (val && typeof val === "object" && val.__is_property__) {
      if (val.fget) {
        if (typeof val.fget === "function") return val.fget.call(obj, obj);
        if (val.fget.entryPC !== void 0) return { __is_bound__: true, self: obj, fn: val.fget };
      }
      return void 0;
    }
    if (val && typeof val === "object" && val.entryPC !== void 0) {
      if (val.isClassMethod || val.name && val.name.startsWith("__class_")) {
        return { __is_bound__: true, self: obj, fn: val };
      }
      return val;
    }
    if (val && typeof val === "function") {
      const bound = val.bind(obj);
      if (val.__uvm_mod_vm__) bound.__uvm_mod_vm__ = val.__uvm_mod_vm__;
      if (val.__uvm_callable__) bound.__uvm_callable__ = val.__uvm_callable__;
      return bound;
    }
    return val;
  }
  function bindCallArguments(newFrame, callee, args) {
    if (callee.paramNames && args.length > 0) {
      const remainingArgs = [...args];
      const kwObjects = [];
      const lastArg = remainingArgs[remainingArgs.length - 1];
      if (lastArg && typeof lastArg === "object" && !Array.isArray(lastArg) && !lastArg.entryPC && !lastArg.__is_bound__ && !lastArg.__is_module__ && !lastArg.__class__) {
        if (lastArg.__is_py_kwargs__) {
          const cleanKw = { ...lastArg };
          delete cleanKw.__is_py_kwargs__;
          kwObjects.push(cleanKw);
          remainingArgs.pop();
        } else {
          const keys = Object.keys(lastArg);
          if (keys.length > 0 && keys.every((k) => callee.paramNames.includes(k))) {
            kwObjects.push(remainingArgs.pop());
          }
        }
      }
      if (callee.restParamIndex !== void 0) {
        const regularCount = callee.restParamIndex;
        for (let i = 0; i < regularCount; i++) {
          newFrame.locals[i] = remainingArgs[i] !== void 0 ? remainingArgs[i] : null;
        }
        newFrame.locals[regularCount] = remainingArgs.slice(regularCount);
      } else {
        for (let i = 0; i < remainingArgs.length; i++) {
          newFrame.locals[i] = remainingArgs[i];
        }
      }
      for (const kw of kwObjects) {
        for (const [k, v] of Object.entries(kw)) {
          const idx = callee.paramNames.indexOf(k);
          if (idx !== -1) {
            newFrame.locals[idx] = v;
          }
        }
      }
    } else if (callee.restParamIndex !== void 0) {
      const regularCount = callee.restParamIndex;
      for (let i = 0; i < regularCount; i++) {
        newFrame.locals[i] = args[i] !== void 0 ? args[i] : null;
      }
      newFrame.locals[regularCount] = args.slice(regularCount);
    } else {
      for (let i = 0; i < args.length; i++) {
        newFrame.locals[i] = args[i];
      }
    }
  }
  var VirtualMachine = class _VirtualMachine {
    constructor(options = {}) {
      this.operandStack = [];
      this.callStack = [];
      this.tryStack = [];
      this.globals = /* @__PURE__ */ new Map();
      this.pc = 0;
      this.isHalted = false;
      this.instructionCount = 0;
      this.timeSliceInterval = options.timeSliceInterval || 5e3;
      this.terminal = options.terminal || new VirtualTerminal();
      this.consoleOutput = this.terminal.getText();
      this.program = null;
      this.onPrint = options.onPrint || null;
      this.onWrite = options.onWrite || null;
      this.moduleManager = options.moduleManager || _VirtualMachine.defaultModuleManager || null;
      this.initBuiltins();
    }
    initBuiltins() {
      this.globals.set("len", (obj) => obj ? obj.length !== void 0 ? obj.length : Object.keys(obj).length : 0);
      this.globals.set("range", (start, stop, step = 1) => {
        if (stop === void 0) {
          stop = start;
          start = 0;
        }
        const res = [];
        if (step > 0) for (let i = start; i < stop; i += step) res.push(i);
        else if (step < 0) for (let i = start; i > stop; i += step) res.push(i);
        return res;
      });
      this.globals.set("abs", Math.abs);
      const pyMin = (...args) => {
        let items = args;
        let keyFn = null;
        let defVal = void 0;
        if (items.length > 0 && typeof items[items.length - 1] === "object" && items[items.length - 1] !== null && !Array.isArray(items[items.length - 1])) {
          const kw = items.pop();
          if (kw.key) keyFn = kw.key;
          if (kw.default !== void 0) defVal = kw.default;
        }
        if (items.length === 1 && (Array.isArray(items[0]) || items[0] && typeof items[0][Symbol.iterator] === "function")) {
          items = Array.from(items[0]);
        }
        if (items.length === 0) {
          if (defVal !== void 0) return defVal;
          throw new RangeError("ValueError: min() arg is an empty sequence");
        }
        let best = items[0];
        let bestVal = keyFn ? keyFn(best) : best;
        for (let i = 1; i < items.length; i++) {
          const val = keyFn ? keyFn(items[i]) : items[i];
          if (val < bestVal) {
            bestVal = val;
            best = items[i];
          }
        }
        return best;
      };
      this.globals.set("min", pyMin);
      const pyMax = (...args) => {
        let items = args;
        let keyFn = null;
        let defVal = void 0;
        if (items.length > 0 && typeof items[items.length - 1] === "object" && items[items.length - 1] !== null && !Array.isArray(items[items.length - 1])) {
          const kw = items.pop();
          if (kw.key) keyFn = kw.key;
          if (kw.default !== void 0) defVal = kw.default;
        }
        if (items.length === 1 && (Array.isArray(items[0]) || items[0] && typeof items[0][Symbol.iterator] === "function")) {
          items = Array.from(items[0]);
        }
        if (items.length === 0) {
          if (defVal !== void 0) return defVal;
          throw new RangeError("ValueError: max() arg is an empty sequence");
        }
        let best = items[0];
        let bestVal = keyFn ? keyFn(best) : best;
        for (let i = 1; i < items.length; i++) {
          const val = keyFn ? keyFn(items[i]) : items[i];
          if (val > bestVal) {
            bestVal = val;
            best = items[i];
          }
        }
        return best;
      };
      this.globals.set("max", pyMax);
      this.globals.set("sum", (lst) => Array.isArray(lst) ? lst.reduce((a, b) => a + b, 0) : 0);
      this.globals.set("sorted", (lst) => Array.isArray(lst) ? [...lst].sort((a, b) => typeof a === "number" && typeof b === "number" ? a - b : String(a).localeCompare(String(b))) : []);
      this.globals.set("int", (x) => parseInt(x, 10));
      const floatFn = (x) => parseFloat(x);
      floatFn.fromhex = (s) => floatFromHex(s);
      this.globals.set("float", floatFn);
      const strFn = (x) => this.stringify(x);
      const strMethods = ["capitalize", "lower", "upper", "strip", "lstrip", "rstrip", "split", "splitlines", "join", "replace", "startswith", "endswith", "find", "index", "count", "center", "ljust", "rjust", "zfill", "title", "isdigit", "isalpha", "isalnum", "isspace"];
      for (const m of strMethods) {
        strFn[m] = (self, ...args) => {
          const boundFn = resolveMember(String(self), m);
          return boundFn(...args);
        };
      }
      this.globals.set("str", strFn);
      this.globals.set("repr", (x) => typeof x === "string" ? JSON.stringify(x) : this.stringify(x));
      this.globals.set("round", (x, n = 0) => {
        const factor = Math.pow(10, n);
        return Math.round(x * factor) / factor;
      });
      this.globals.set("bool", (x) => this.isTruthy(x));
      const dictFn = (entries) => {
        if (!entries) return {};
        const res = {};
        for (const [k, v] of entries) res[k] = v;
        return res;
      };
      dictFn.fromkeys = (iterable, value = null) => {
        const res = {};
        for (const k of iterable || []) res[k] = value;
        return res;
      };
      this.globals.set("dict", dictFn);
      this.globals.set("ord", (c) => String(c).charCodeAt(0));
      this.globals.set("chr", (n) => String.fromCharCode(n));
      this.globals.set("map", (fn, ...iterables) => {
        if (iterables.length === 0) return [];
        const arrays = iterables.map((it) => Array.from(it || []));
        const minLen = Math.min(...arrays.map((a) => a.length));
        const res = [];
        for (let i = 0; i < minLen; i++) {
          const args = arrays.map((a) => a[i]);
          res.push(fn(...args));
        }
        return res;
      });
      this.globals.set("filter", (fn, iterable) => {
        const arr = Array.from(iterable || []);
        return arr.filter((x) => fn ? fn(x) : Boolean(x));
      });
      this.globals.set("list", (x) => Array.from(x));
      this.globals.set("format", (val, spec) => formatValue(val, spec));
      this.globals.set("__format", (val, spec) => formatValue(val, spec));
      this.globals.set("__slice", (seq, start, stop, step) => {
        if (step === 0) throw new RangeError("ValueError: slice step cannot be zero");
        if (step === null || step === void 0) step = 1;
        const len = seq && seq.length !== void 0 ? seq.length : 0;
        if (step > 0) {
          if (start === null || start === void 0) start = 0;
          else if (start < 0) start = Math.max(0, len + start);
          else start = Math.min(len, start);
          if (stop === null || stop === void 0) stop = len;
          else if (stop < 0) stop = Math.max(0, len + stop);
          else stop = Math.min(len, stop);
        } else {
          if (start === null || start === void 0) start = len - 1;
          else if (start < 0) start = Math.max(-1, len + start);
          else start = Math.min(len - 1, start);
          if (stop === null || stop === void 0) stop = -1;
          else if (stop < 0) stop = Math.max(-1, len + stop);
          else stop = Math.min(len - 1, stop);
        }
        const res = [];
        if (step > 0) {
          for (let i = start; i < stop; i += step) res.push(seq[i]);
        } else {
          for (let i = start; i > stop; i += step) res.push(seq[i]);
        }
        return typeof seq === "string" ? res.join("") : res;
      });
      this.globals.set("__delitem", (obj, idx) => {
        if (Array.isArray(obj)) {
          const i = idx < 0 ? obj.length + idx : idx;
          if (i >= 0 && i < obj.length) {
            obj.splice(i, 1);
          }
        } else if (obj && typeof obj === "object") {
          delete obj[idx];
        }
      });
      this.globals.set("enumerate", (iterable) => {
        const arr = Array.from(iterable || []);
        return arr.map((item, idx) => [idx, item]);
      });
      this.globals.set("zip", (...iterables) => {
        if (iterables.length === 0) return [];
        const arrays = iterables.map((it) => Array.from(it || []));
        const minLen = Math.min(...arrays.map((a) => a.length));
        const res = [];
        for (let i = 0; i < minLen; i++) {
          res.push(arrays.map((a) => a[i]));
        }
        return res;
      });
      this.globals.set("all", (iterable) => {
        for (const item of iterable || []) {
          if (!this.isTruthy(item)) return false;
        }
        return true;
      });
      this.globals.set("any", (iterable) => {
        for (const item of iterable || []) {
          if (this.isTruthy(item)) return true;
        }
        return false;
      });
      this.globals.set("reversed", (iterable) => {
        const arr = Array.from(iterable || []);
        return arr.reverse();
      });
      this.globals.set("set", (iterable) => {
        if (!iterable) return [];
        const seen = /* @__PURE__ */ new Set();
        const res = [];
        for (const item of iterable) {
          if (!seen.has(item)) {
            seen.add(item);
            res.push(item);
          }
        }
        return res;
      });
      this.globals.set("classmethod", (fn) => fn);
      this.globals.set("staticmethod", (fn) => fn);
      this.globals.set("property", (fn) => fn);
      this.globals.set("print", (...args) => {
        let sep = " ";
        let end2 = "\n";
        const items = [...args];
        if (items.length > 0 && typeof items[items.length - 1] === "object" && items[items.length - 1] !== null && !Array.isArray(items[items.length - 1])) {
          const last = items[items.length - 1];
          if (last.__is_py_kwargs__ || (last.sep !== void 0 || last.end !== void 0)) {
            const kw = items.pop();
            if (kw.sep !== void 0) sep = this.stringify(kw.sep);
            if (kw.end !== void 0) end2 = this.stringify(kw.end);
          }
        }
        const text = items.map((a) => this.stringify(a)).join(sep);
        if (end2 === "\n") {
          this.log(text);
        } else {
          this.write(text + end2);
        }
        return null;
      });
      class PyException extends Error {
        constructor(msg = "") {
          super(msg);
          this.name = "Exception";
          this.message = msg;
        }
        toString() {
          return `${this.name}: ${this.message}`;
        }
      }
      class PyValueError extends PyException {
        constructor(msg) {
          super(msg);
          this.name = "ValueError";
        }
      }
      class PyTypeError extends PyException {
        constructor(msg) {
          super(msg);
          this.name = "TypeError";
        }
      }
      class PyKeyError extends PyException {
        constructor(msg) {
          super(msg);
          this.name = "KeyError";
        }
      }
      class PyIndexError extends PyException {
        constructor(msg) {
          super(msg);
          this.name = "IndexError";
        }
      }
      this.globals.set("Exception", (msg) => new PyException(msg));
      this.globals.set("ValueError", (msg) => new PyValueError(msg));
      this.globals.set("TypeError", (msg) => new PyTypeError(msg));
      this.globals.set("KeyError", (msg) => new PyKeyError(msg));
      this.globals.set("IndexError", (msg) => new PyIndexError(msg));
      this.globals.set("__name__", "__main__");
      this.globals.set("open", (filename, mode = "r") => {
        const vfs2 = this.moduleManager && this.moduleManager.vfs || null;
        let closed = false;
        let lineIndex = 0;
        let writeBuffer = mode.includes("a") && vfs2 && vfs2.exists(filename) ? vfs2.readFile(filename) : "";
        if (mode.includes("w") && vfs2) {
          vfs2.writeFile(filename, "");
        }
        return {
          filename,
          mode,
          read() {
            if (closed) throw new Error("ValueError: I/O operation on closed file.");
            if (vfs2 && vfs2.exists(filename)) {
              return typeof vfs2.readFile === "function" ? vfs2.readFile(filename) : vfs2.read(filename);
            }
            return "";
          },
          readline() {
            if (closed) throw new Error("ValueError: I/O operation on closed file.");
            const content = this.read();
            const lines = content.split("\n");
            if (lineIndex < lines.length) {
              const line = lines[lineIndex++];
              return line + (lineIndex < lines.length ? "\n" : "");
            }
            return "";
          },
          write(data) {
            if (closed) throw new Error("ValueError: I/O operation on closed file.");
            writeBuffer += String(data);
            if (vfs2) {
              vfs2.writeFile(filename, writeBuffer);
            }
            return data ? data.length : 0;
          },
          close() {
            closed = true;
            if (vfs2 && writeBuffer.length > 0) {
              vfs2.writeFile(filename, writeBuffer);
            }
            return null;
          },
          __enter__() {
            return this;
          },
          __exit__(exc_type, exc_val, exc_tb) {
            this.close();
            return false;
          }
        };
      });
      class PySlice {
        constructor(start = null, stop = null, step = null) {
          this.start = start;
          this.stop = stop;
          this.step = step;
          this.__class__ = PySlice;
        }
      }
      const sliceFn = (start, stop, step) => {
        if (stop === void 0 && step === void 0) {
          return new PySlice(null, start, null);
        }
        return new PySlice(start, stop, step);
      };
      sliceFn.__class__ = PySlice;
      this.globals.set("slice", sliceFn);
      this.globals.set("isinstance", (obj, cls) => {
        if (Array.isArray(cls)) {
          return cls.some((c) => this.globals.get("isinstance")(obj, c));
        }
        const intRef = this.globals.get("int");
        const floatRef = this.globals.get("float");
        const strRef = this.globals.get("str");
        const listRef = this.globals.get("list");
        const boolRef = this.globals.get("bool");
        const dictRef = this.globals.get("dict");
        const sliceRef = this.globals.get("slice");
        if (cls === "int" || cls === intRef) return typeof obj === "number" && Number.isInteger(obj);
        if (cls === "float" || cls === floatRef) return typeof obj === "number";
        if (cls === "str" || cls === strRef) return typeof obj === "string";
        if (cls === "list" || cls === listRef) return Array.isArray(obj);
        if (cls === "dict" || cls === dictRef) return typeof obj === "object" && obj !== null && !Array.isArray(obj);
        if (cls === "bool" || cls === boolRef) return typeof obj === "boolean";
        if (cls === PySlice || cls === sliceRef) return obj instanceof PySlice || obj && obj.__class__ === PySlice;
        if (obj && obj.__class__) return obj.__class__ === cls;
        return false;
      });
      this.globals.set("hasattr", (obj, name) => obj !== null && obj !== void 0 && (name in obj || obj[name] !== void 0));
      this.globals.set("getattr", (obj, name, defaultVal) => {
        if (obj !== null && obj !== void 0 && (name in obj || obj[name] !== void 0)) {
          return obj[name];
        }
        if (defaultVal !== void 0) return defaultVal;
        throw new Error(`AttributeError: object has no attribute '${name}'`);
      });
      this.globals.set("setattr", (obj, name, val) => {
        if (obj === null || obj === void 0) throw new TypeError("cannot setattr on null/undefined");
        obj[name] = val;
        return null;
      });
      this.globals.set("type", (obj) => {
        if (obj === null) return "NoneType";
        if (Array.isArray(obj)) return "list";
        if (typeof obj === "number") return Number.isInteger(obj) ? "int" : "float";
        if (typeof obj === "string") return "str";
        if (typeof obj === "boolean") return "bool";
        if (typeof obj === "function") return "function";
        if (obj && obj.__class__) return obj.__class__.name || "type";
        return typeof obj;
      });
      this.globals.set("ord", (ch) => String(ch).charCodeAt(0));
      this.globals.set("chr", (code) => String.fromCharCode(code));
      this.globals.set("bin", (n) => "0b" + Math.floor(n).toString(2));
      this.globals.set("hex", (n) => "0x" + Math.floor(n).toString(16));
      this.globals.set("oct", (n) => "0o" + Math.floor(n).toString(8));
      this.globals.set("map", (fn, it) => {
        const arr = Array.from(it || []);
        return arr.map((item) => this.callCallable(fn, item));
      });
      this.globals.set("filter", (fn, it) => {
        const arr = Array.from(it || []);
        return arr.filter((item) => this.isTruthy(this.callCallable(fn, item)));
      });
      this.globals.set("pow", (x, y, mod) => mod !== void 0 ? Math.pow(x, y) % mod : Math.pow(x, y));
      this.globals.set("property", (fget, fset, fdel) => ({
        __is_property__: true,
        fget,
        fset,
        fdel,
        setter: (setterFn) => ({ __is_property__: true, fget, fset: setterFn, fdel }),
        getter: (getterFn) => ({ __is_property__: true, fget: getterFn, fset, fdel })
      }));
      this.globals.set("iter", (obj) => Array.isArray(obj) ? [...obj] : obj && typeof obj[Symbol.iterator] === "function" ? [...obj] : Object.keys(obj || {}));
      this.globals.set("next", (it, def) => it && typeof it.next === "function" ? it.next().value : Array.isArray(it) && it.length > 0 ? it.shift() : def);
      this.globals.set("callable", (obj) => typeof obj === "function" || obj && (obj.entryPC !== void 0 || obj.__call__ !== void 0));
      this.globals.set("id", (obj) => typeof obj === "object" && obj ? obj.__id__ || (obj.__id__ = Math.floor(Math.random() * 1e7)) : 0);
      this.globals.set("AttributeError", (msg) => new Error("AttributeError: " + msg));
      const objectClass = function() {
        return {};
      };
      objectClass.__new__ = (cls) => {
        const inst = {};
        if (cls && typeof cls === "object") {
          for (const [k, v] of Object.entries(cls)) {
            if (["entryPC", "paramCount", "localCount", "restParamIndex", "name", "globals"].includes(k)) continue;
            if (typeof v === "object" && v && v.entryPC !== void 0) {
              inst[k] = { __is_bound__: true, self: inst, fn: v };
            } else if (typeof v === "function") {
              inst[k] = v.bind ? v.bind(inst) : v;
            } else {
              inst[k] = v;
            }
          }
        }
        return inst;
      };
      this.globals.set("object", objectClass);
      this.globals.set("super", (cls, self) => {
        const currentFrame = this.callStack[this.callStack.length - 1];
        const target = self || currentFrame && currentFrame.locals[0];
        return new Proxy(target || {}, {
          get(t, prop) {
            if (prop === "__new__") return (targetCls) => objectClass.__new__(targetCls);
            if (prop === "__init_subclass__") return () => null;
            if (prop === "__init__") return () => null;
            return t[prop];
          }
        });
      });
    }
    /**
     * Resets the VM state for a fresh execution.
     */
    reset(preserveStepMode = false) {
      this.operandStack = [];
      this.callStack = [new CallFrame(0, "<main>", 64, this.globals)];
      this.tryStack = [];
      this.pc = 0;
      this.isHalted = false;
      this.instructionCount = 0;
      if (this.terminal) {
        this.terminal.clear();
      }
      this.consoleOutput = "";
      if (!preserveStepMode) {
        this.singleStepMode = false;
      }
    }
    /**
     * Returns a lightweight snapshot of VM state for the UI memory & call stack inspector.
     */
    getExecutionSnapshot() {
      const currentFrame = this.callStack[this.callStack.length - 1];
      const formattedStack = this.operandStack.map((val) => this._formatValue(val));
      return {
        pc: this.pc,
        isHalted: this.isHalted,
        instructionCount: this.instructionCount,
        stack: formattedStack,
        operandStack: formattedStack,
        callStack: this.callStack.map((f) => ({
          fnName: f.fnName,
          returnPC: f.returnPC,
          locals: (f.locals || []).map((l) => this._formatValue(l))
        })),
        currentFrame: currentFrame ? {
          fnName: currentFrame.fnName,
          returnPC: currentFrame.returnPC,
          locals: (currentFrame.locals || []).map((l) => this._formatValue(l))
        } : null,
        globals: Array.from(this.globals.keys()).filter((k) => !k.startsWith("__")).slice(0, 50)
      };
    }
    _formatValue(val) {
      if (val === null) return "null";
      if (val === void 0) return "undefined";
      if (typeof val === "function") return "[Native Function]";
      if (typeof val === "object") {
        if (val.entryPC !== void 0) return `[Function ${val.name || "anon"}]`;
        if (Array.isArray(val)) {
          if (val.length > 5) return `[${val.slice(0, 5).map((x) => this._formatValue(x)).join(", ")}, ... (${val.length} items)]`;
          return `[${val.map((x) => this._formatValue(x)).join(", ")}]`;
        }
        try {
          const keys = Object.keys(val);
          if (keys.length > 4) {
            return `{ ${keys.slice(0, 4).map((k) => `${k}: ${this._formatValue(val[k])}`).join(", ")}, ... }`;
          }
          return JSON.stringify(val);
        } catch {
          return "[Object]";
        }
      }
      if (typeof val === "string") return JSON.stringify(val);
      return String(val);
    }
    /**
     * Handles an exception by checking for active try frames and unwinding the stacks.
     */
    handleException(err) {
      if (!this.tryStack || this.tryStack.length === 0) {
        return false;
      }
      const handler = this.tryStack.pop();
      while (this.callStack.length > handler.callStackDepth) {
        this.callStack.pop();
      }
      this.operandStack.length = handler.operandStackHeight;
      const errObj = typeof err === "object" && err !== null ? err : new Error(String(err));
      if ((errObj.name === "Error" || !errObj.name) && typeof errObj.message === "string") {
        const match = errObj.message.match(/^([A-Za-z0-9_]+Error):/);
        if (match) {
          errObj.name = match[1];
        }
      }
      this.lastException = errObj;
      if (handler.catchPC !== null && handler.catchPC !== void 0 && handler.catchPC >= 0) {
        this.operandStack.push(errObj);
        this.pc = handler.catchPC;
        return true;
      } else if (handler.finallyPC !== null && handler.finallyPC !== void 0 && handler.finallyPC >= 0) {
        this.pc = handler.finallyPC;
        return true;
      }
      return false;
    }
    /**
     * Appends a chunk to the virtual console/terminal buffer.
     */
    write(chunk) {
      if (chunk === null || chunk === void 0) return;
      const str = String(chunk);
      if (this.terminal) {
        this.terminal.write(str);
        this.consoleOutput = this.terminal.getText();
      } else {
        this.consoleOutput += str;
      }
      if (this.onWrite) {
        this.onWrite(str, this.consoleOutput);
      }
      if (this.onPrint) {
        this.onPrint(str);
      }
    }
    /**
     * Appends output to the virtual console followed by a newline.
     */
    log(msg) {
      const text = this.stringify(msg);
      if (this.terminal) {
        this.terminal.write(text + "\n");
        this.consoleOutput = this.terminal.getText();
      } else {
        this.consoleOutput += text + "\n";
      }
      if (this.onWrite) {
        this.onWrite(text + "\n", this.consoleOutput);
      }
      if (this.onPrint) {
        this.onPrint(text);
      }
    }
    /**
     * Clears the virtual console buffer and resets cursor position.
     */
    clearConsole() {
      if (this.terminal) {
        this.terminal.clear();
      }
      this.consoleOutput = "";
      if (this.onWrite) {
        this.onWrite("", "");
      }
      if (this.onPrint) {
        this.onPrint("");
      }
    }
    /**
     * Formats a value for console display.
     */
    stringify(val) {
      if (val === null || val === void 0) return "None";
      if (typeof val === "boolean") return val ? "True" : "False";
      if (val && val.__is_module__) {
        return `<module '${val.__name__ || "module"}'>`;
      }
      if (val instanceof Error || typeof val === "object" && val.message !== void 0 && val.name !== void 0) {
        return val.message ? `${val.name}: ${val.message}` : String(val.name);
      }
      if (typeof val === "object") {
        try {
          return JSON.stringify(val);
        } catch {
          return String(val);
        }
      }
      return String(val);
    }
    /**
     * Evaluates truthiness according to standard runtime conventions.
     */
    isTruthy(val) {
      if (val === false || val === null || val === void 0 || val === 0 || val === "" || Number.isNaN(val)) {
        return false;
      }
      if (Array.isArray(val)) {
        return val.length > 0;
      }
      if (typeof val === "object" && val !== null) {
        return Object.keys(val).length > 0;
      }
      return true;
    }
    /**
     * Invokes a callable (either host JS function or UVM bytecode function).
     */
    callCallable(callee, ...args) {
      if (callee && callee.__is_bound__) {
        args.unshift(callee.self);
        callee = callee.fn;
      }
      if (typeof callee === "function") {
        return callee(...args);
      }
      if (callee && typeof callee === "object" && callee.entryPC !== void 0) {
        const subVm = new _VirtualMachine({
          moduleManager: this.moduleManager,
          onPrint: (msg) => this.log(msg)
        });
        subVm.globals = callee.globals || this.globals;
        subVm.program = callee.program || this.program;
        subVm.reset();
        const newFrame = new CallFrame(this.program.instructions.length, callee.name || "<function>", callee.localCount || 16, callee.globals || this.globals);
        newFrame.closureFrame = callee.closureFrame || null;
        bindCallArguments(newFrame, callee, args);
        subVm.callStack = [newFrame];
        subVm.pc = callee.entryPC;
        const iter = subVm.executeLoop();
        let step;
        let res = null;
        while (!(step = iter.next()).done) {
          res = step.value;
        }
        return step.value !== void 0 ? step.value : res;
      }
      throw new TypeError(`'${this.stringify(callee)}' is not callable`);
    }
    /**
     * Main VM execution loop.
     * Runs as a Generator function yielding to the Scheduler for cooperative multitasking.
     */
    *execute(program, singleStepMode = null) {
      if (singleStepMode !== null) {
        this.singleStepMode = Boolean(singleStepMode);
      }
      const keepStep = Boolean(this.singleStepMode);
      this.program = program;
      this.reset(keepStep);
      this.singleStepMode = keepStep;
      this.pc = program.entryPoint || 0;
      return yield* this.executeLoop();
    }
    *executeLoop() {
      let instructions = this.program.instructions;
      let constants = this.program.constants;
      const prevActive = _VirtualMachine.activeVM;
      _VirtualMachine.activeVM = this;
      try {
        while (!this.isHalted && this.pc < instructions.length) {
          if (this.singleStepMode) {
            yield { type: "STEP", pc: this.pc };
          } else if (++this.instructionCount % this.timeSliceInterval === 0) {
            yield { type: "YIELD" };
          }
          try {
            const op = instructions[this.pc++];
            const currentFrame = this.callStack[this.callStack.length - 1];
            switch (op) {
              case OP.NOP:
                break;
              case OP.CONST: {
                const constIdx = instructions[this.pc++];
                let val = constants[constIdx];
                if (val && typeof val === "object" && val.entryPC !== void 0) {
                  val = { ...val, closureFrame: currentFrame, program: this.program, globals: currentFrame && currentFrame.globals || this.globals };
                }
                this.operandStack.push(val);
                break;
              }
              case OP.POP: {
                this.operandStack.pop();
                break;
              }
              case OP.DUP: {
                const val = this.operandStack[this.operandStack.length - 1];
                this.operandStack.push(val);
                break;
              }
              case OP.SWAP: {
                const len = this.operandStack.length;
                if (len >= 2) {
                  const temp = this.operandStack[len - 1];
                  this.operandStack[len - 1] = this.operandStack[len - 2];
                  this.operandStack[len - 2] = temp;
                }
                break;
              }
              case OP.TRUE:
                this.operandStack.push(true);
                break;
              case OP.FALSE:
                this.operandStack.push(false);
                break;
              case OP.NIL:
                this.operandStack.push(null);
                break;
              // Local variable access (frame slot indexed)
              case OP.LOAD_LOCAL: {
                const slot = instructions[this.pc++];
                this.operandStack.push(currentFrame.locals[slot]);
                break;
              }
              case OP.STORE_LOCAL: {
                const slot = instructions[this.pc++];
                currentFrame.locals[slot] = this.operandStack.pop();
                break;
              }
              // Global variable access (named)
              case OP.LOAD_GLOBAL: {
                const nameIdx = instructions[this.pc++];
                const name = constants[nameIdx];
                const frameGlobals = currentFrame && currentFrame.globals;
                if (frameGlobals && frameGlobals.has(name)) {
                  this.operandStack.push(frameGlobals.get(name));
                } else if (this.globals.has(name)) {
                  this.operandStack.push(this.globals.get(name));
                } else {
                  throw new ReferenceError(`UVM ReferenceError: '${name}' is not defined`);
                }
                break;
              }
              case OP.STORE_GLOBAL: {
                const nameIdx = instructions[this.pc++];
                const name = constants[nameIdx];
                const val = this.operandStack.pop();
                const targetGlobals = currentFrame && currentFrame.globals || this.globals;
                targetGlobals.set(name, val);
                break;
              }
              // Closures & Upvalues
              case OP.LOAD_UPVALUE: {
                const slot = instructions[this.pc++];
                const hops = instructions[this.pc++];
                let frame = currentFrame;
                for (let h = 0; h < hops; h++) {
                  frame = frame ? frame.closureFrame : null;
                }
                if (!frame) throw new ReferenceError("UVM ClosureError: enclosing scope destroyed");
                this.operandStack.push(frame.locals[slot]);
                break;
              }
              case OP.STORE_UPVALUE: {
                const slot = instructions[this.pc++];
                const hops = instructions[this.pc++];
                let frame = currentFrame;
                for (let h = 0; h < hops; h++) {
                  frame = frame ? frame.closureFrame : null;
                }
                if (!frame) throw new ReferenceError("UVM ClosureError: enclosing scope destroyed");
                frame.locals[slot] = this.operandStack.pop();
                break;
              }
              // Arithmetic
              case OP.ADD: {
                const b = this.operandStack.pop();
                const a = this.operandStack.pop();
                this.operandStack.push(a + b);
                break;
              }
              case OP.SUB: {
                const b = this.operandStack.pop();
                const a = this.operandStack.pop();
                this.operandStack.push(a - b);
                break;
              }
              case OP.MUL: {
                const b = this.operandStack.pop();
                const a = this.operandStack.pop();
                if (typeof a === "string" && typeof b === "number") {
                  this.operandStack.push(a.repeat(Math.max(0, Math.floor(b))));
                } else if (typeof b === "string" && typeof a === "number") {
                  this.operandStack.push(b.repeat(Math.max(0, Math.floor(a))));
                } else if (Array.isArray(a) && typeof b === "number") {
                  const count = Math.max(0, Math.floor(b));
                  const rep = [];
                  for (let i = 0; i < count; i++) rep.push(...a);
                  this.operandStack.push(rep);
                } else if (Array.isArray(b) && typeof a === "number") {
                  const count = Math.max(0, Math.floor(a));
                  const rep = [];
                  for (let i = 0; i < count; i++) rep.push(...b);
                  this.operandStack.push(rep);
                } else {
                  this.operandStack.push(a * b);
                }
                break;
              }
              case OP.DIV: {
                const b = this.operandStack.pop();
                const a = this.operandStack.pop();
                if (b === 0) throw new RangeError("UVM ZeroDivisionError: division by zero");
                this.operandStack.push(a / b);
                break;
              }
              case OP.IDIV: {
                const b = this.operandStack.pop();
                const a = this.operandStack.pop();
                if (b === 0) throw new RangeError("UVM ZeroDivisionError: integer division by zero");
                this.operandStack.push(Math.floor(a / b));
                break;
              }
              case OP.MOD: {
                const b = this.operandStack.pop();
                const a = this.operandStack.pop();
                if (typeof a === "string") {
                  this.operandStack.push(formatPrintfString(a, b));
                  break;
                }
                if (b === 0) throw new RangeError("UVM ZeroDivisionError: integer division by zero");
                this.operandStack.push((a % b + b) % b);
                break;
              }
              case OP.POW: {
                const b = this.operandStack.pop();
                const a = this.operandStack.pop();
                this.operandStack.push(a ** b);
                break;
              }
              case OP.MATMUL: {
                const b = this.operandStack.pop();
                const a = this.operandStack.pop();
                if (a && typeof a.__matmul__ === "function") {
                  this.operandStack.push(this.callCallable(a.__matmul__, b));
                } else {
                  throw new TypeError(`TypeError: unsupported operand type(s) for @: '${typeof a}' and '${typeof b}'`);
                }
                break;
              }
              case OP.NEG: {
                const a = this.operandStack.pop();
                this.operandStack.push(-a);
                break;
              }
              case OP.POS: {
                const a = this.operandStack.pop();
                if (a && typeof a.__pos__ === "function") {
                  this.operandStack.push(this.callCallable(a.__pos__));
                } else {
                  this.operandStack.push(+a);
                }
                break;
              }
              // Bitwise
              case OP.BIT_AND: {
                const b = this.operandStack.pop();
                const a = this.operandStack.pop();
                this.operandStack.push(a & b);
                break;
              }
              case OP.BIT_OR: {
                const b = this.operandStack.pop();
                const a = this.operandStack.pop();
                this.operandStack.push(a | b);
                break;
              }
              case OP.BIT_XOR: {
                const b = this.operandStack.pop();
                const a = this.operandStack.pop();
                this.operandStack.push(a ^ b);
                break;
              }
              case OP.BIT_NOT: {
                const a = this.operandStack.pop();
                this.operandStack.push(~a);
                break;
              }
              case OP.SHL: {
                const b = this.operandStack.pop();
                const a = this.operandStack.pop();
                this.operandStack.push(a << b);
                break;
              }
              case OP.SHR: {
                const b = this.operandStack.pop();
                const a = this.operandStack.pop();
                this.operandStack.push(a >> b);
                break;
              }
              // Comparisons
              case OP.EQ: {
                const b = this.operandStack.pop();
                const a = this.operandStack.pop();
                this.operandStack.push(a === b);
                break;
              }
              case OP.NEQ: {
                const b = this.operandStack.pop();
                const a = this.operandStack.pop();
                this.operandStack.push(a !== b);
                break;
              }
              case OP.LT: {
                const b = this.operandStack.pop();
                const a = this.operandStack.pop();
                this.operandStack.push(a < b);
                break;
              }
              case OP.LTE: {
                const b = this.operandStack.pop();
                const a = this.operandStack.pop();
                this.operandStack.push(a <= b);
                break;
              }
              case OP.GT: {
                const b = this.operandStack.pop();
                const a = this.operandStack.pop();
                this.operandStack.push(a > b);
                break;
              }
              case OP.GTE: {
                const b = this.operandStack.pop();
                const a = this.operandStack.pop();
                this.operandStack.push(a >= b);
                break;
              }
              case OP.NOT: {
                const a = this.operandStack.pop();
                this.operandStack.push(!this.isTruthy(a));
                break;
              }
              case OP.IN: {
                const b = this.operandStack.pop();
                const a = this.operandStack.pop();
                if (b === null || b === void 0) {
                  this.operandStack.push(false);
                } else if (Array.isArray(b) || typeof b === "string") {
                  this.operandStack.push(b.includes(a));
                } else if (typeof b === "object") {
                  this.operandStack.push(a in b);
                } else {
                  this.operandStack.push(false);
                }
                break;
              }
              // Branching
              case OP.JUMP: {
                const target = instructions[this.pc];
                this.pc = target;
                break;
              }
              case OP.JUMP_IF_FALSE: {
                const target = instructions[this.pc++];
                const cond = this.operandStack.pop();
                if (!this.isTruthy(cond)) {
                  this.pc = target;
                }
                break;
              }
              case OP.JUMP_IF_TRUE: {
                const target = instructions[this.pc++];
                const cond = this.operandStack.pop();
                if (this.isTruthy(cond)) {
                  this.pc = target;
                }
                break;
              }
              // Exception Handling & Stack Unwinding
              case OP.PUSH_TRY: {
                const catchPC = instructions[this.pc++];
                const finallyPC = instructions[this.pc++];
                this.tryStack.push({
                  catchPC,
                  finallyPC,
                  callStackDepth: this.callStack.length,
                  operandStackHeight: this.operandStack.length
                });
                break;
              }
              case OP.POP_TRY: {
                this.tryStack.pop();
                break;
              }
              case OP.RAISE: {
                const errVal = this.operandStack.pop();
                let errObj;
                if (errVal === null || errVal === void 0) {
                  errObj = this.lastException || new Error("RuntimeError: No active exception to reraise");
                } else {
                  errObj = typeof errVal === "object" && errVal !== null ? errVal : new Error(String(errVal));
                }
                if (!this.handleException(errObj)) {
                  throw errObj;
                }
                break;
              }
              // Functions & Call Frames
              case OP.CALL: {
                const argc = instructions[this.pc++];
                const args = [];
                for (let i = 0; i < argc; i++) {
                  args.unshift(this.operandStack.pop());
                }
                let callee = this.operandStack.pop();
                if (callee && callee.__is_bound__) {
                  args.unshift(callee.self);
                  callee = callee.fn;
                } else if (callee && typeof callee === "object" && callee.__call__) {
                  const callFn = callee.__call__;
                  if (callFn && callFn.__is_bound__) {
                    args.unshift(callFn.self);
                    callee = callFn.fn;
                  } else {
                    args.unshift(callee);
                    callee = callFn;
                  }
                }
                if (typeof callee === "function") {
                  let oldOnPrint = null;
                  const modVmRef = callee.__uvm_mod_vm__;
                  if (modVmRef) {
                    oldOnPrint = modVmRef.onPrint;
                    modVmRef.onPrint = (msg) => this.log(msg);
                  }
                  try {
                    const result = callee(...args);
                    if (result && typeof result.then === "function") {
                      const resolved = yield {
                        type: "ASYNC_PROMISE",
                        promise: result
                      };
                      this.operandStack.push(resolved !== void 0 ? resolved : null);
                    } else {
                      this.operandStack.push(result !== void 0 ? result : null);
                    }
                  } catch (err) {
                    console.log("Error calling host/bound fn in frame:", currentFrame?.fnName, "pc:", this.pc, "callee:", callee?.name || callee, "args:", args);
                    throw err;
                  } finally {
                    if (modVmRef) {
                      modVmRef.onPrint = oldOnPrint;
                    }
                  }
                } else if (callee && typeof callee === "object" && callee.entryPC !== void 0) {
                  const frameGlobals = callee.globals || currentFrame && currentFrame.globals || this.globals;
                  const newFrame = new CallFrame(this.pc, callee.name || "<function>", callee.localCount || 16, frameGlobals);
                  newFrame.closureFrame = callee.closureFrame || currentFrame || null;
                  newFrame.program = this.program;
                  if (callee.program && callee.program !== this.program) {
                    this.program = callee.program;
                    instructions = this.program.instructions;
                    constants = this.program.constants;
                  }
                  bindCallArguments(newFrame, callee, args);
                  this.callStack.push(newFrame);
                  this.pc = callee.entryPC;
                } else {
                  throw new TypeError(`UVM TypeError: '${this.stringify(callee)}' is not callable`);
                }
                break;
              }
              case OP.CALL_SPREAD: {
                const argsArray = this.operandStack.pop();
                const args = Array.isArray(argsArray) ? argsArray : Array.from(argsArray || []);
                let callee = this.operandStack.pop();
                if (callee && callee.__is_bound__) {
                  args.unshift(callee.self);
                  callee = callee.fn;
                } else if (callee && typeof callee === "object" && callee.__call__) {
                  const callFn = callee.__call__;
                  if (callFn && callFn.__is_bound__) {
                    args.unshift(callFn.self);
                    callee = callFn.fn;
                  } else {
                    args.unshift(callee);
                    callee = callFn;
                  }
                }
                if (typeof callee === "function") {
                  let oldOnPrint = null;
                  const modVmRef = callee.__uvm_mod_vm__;
                  if (modVmRef) {
                    oldOnPrint = modVmRef.onPrint;
                    modVmRef.onPrint = (msg) => this.log(msg);
                  }
                  try {
                    const result = callee(...args);
                    this.operandStack.push(result !== void 0 ? result : null);
                  } finally {
                    if (modVmRef) {
                      modVmRef.onPrint = oldOnPrint;
                    }
                  }
                } else if (callee && typeof callee === "object" && callee.entryPC !== void 0) {
                  const frameGlobals = callee.globals || currentFrame && currentFrame.globals || this.globals;
                  const newFrame = new CallFrame(this.pc, callee.name || "<function>", callee.localCount || 16, frameGlobals);
                  newFrame.closureFrame = callee.closureFrame || currentFrame || null;
                  newFrame.program = this.program;
                  if (callee.program && callee.program !== this.program) {
                    this.program = callee.program;
                    instructions = this.program.instructions;
                    constants = this.program.constants;
                  }
                  bindCallArguments(newFrame, callee, args);
                  this.callStack.push(newFrame);
                  this.pc = callee.entryPC;
                } else {
                  throw new TypeError(`UVM TypeError: '${this.stringify(callee)}' is not callable`);
                }
                break;
              }
              case OP.RETURN: {
                const retVal = this.operandStack.pop();
                const finishedFrame = this.callStack.pop();
                if (finishedFrame.program && finishedFrame.program !== this.program) {
                  this.program = finishedFrame.program;
                  instructions = this.program.instructions;
                  constants = this.program.constants;
                }
                if (this.callStack.length === 0) {
                  this.isHalted = true;
                  this.operandStack.push(retVal !== void 0 ? retVal : null);
                  return retVal;
                }
                this.pc = finishedFrame.returnPC;
                this.operandStack.push(retVal !== void 0 ? retVal : null);
                break;
              }
              // Data structures
              case OP.BUILD_LIST: {
                const count = instructions[this.pc++];
                const list = [];
                for (let i = 0; i < count; i++) {
                  list.unshift(this.operandStack.pop());
                }
                this.operandStack.push(list);
                break;
              }
              case OP.BUILD_MAP: {
                const count = instructions[this.pc++];
                const map = {};
                for (let i = 0; i < count; i++) {
                  const val = this.operandStack.pop();
                  const key = this.operandStack.pop();
                  map[key] = val;
                }
                this.operandStack.push(map);
                break;
              }
              case OP.DICT_UPDATE: {
                const src = this.operandStack.pop();
                const target = this.operandStack.pop();
                if (target && typeof target === "object" && src && typeof src === "object") {
                  Object.assign(target, src);
                }
                this.operandStack.push(target);
                break;
              }
              case OP.GET_INDEX: {
                const idx = this.operandStack.pop();
                const obj = this.operandStack.pop();
                if (obj === null || obj === void 0) {
                  throw new TypeError(`UVM TypeError: cannot index into null or undefined`);
                }
                if (obj && typeof obj === "object" && !Array.isArray(obj) && obj.__getitem__) {
                  const itemFn = obj.__getitem__;
                  const res = itemFn.__is_bound__ ? this.callCallable(itemFn, idx) : this.callCallable(itemFn, obj, idx);
                  this.operandStack.push(res);
                  break;
                }
                let resolvedIdx = idx;
                if ((Array.isArray(obj) || typeof obj === "string") && typeof resolvedIdx === "number" && resolvedIdx < 0) {
                  resolvedIdx = obj.length + resolvedIdx;
                }
                this.operandStack.push(obj[resolvedIdx]);
                break;
              }
              case OP.SET_INDEX: {
                const val = this.operandStack.pop();
                const idx = this.operandStack.pop();
                const obj = this.operandStack.pop();
                if (obj === null || obj === void 0) {
                  throw new TypeError(`UVM TypeError: cannot index into null or undefined`);
                }
                if (obj && typeof obj === "object" && !Array.isArray(obj) && obj.__setitem__) {
                  const setFn = obj.__setitem__;
                  if (setFn.__is_bound__) {
                    this.callCallable(setFn, idx, val);
                  } else {
                    this.callCallable(setFn, obj, idx, val);
                  }
                  this.operandStack.push(val);
                  break;
                }
                let resolvedIdx = idx;
                if (Array.isArray(obj) && typeof resolvedIdx === "number" && resolvedIdx < 0) {
                  resolvedIdx = obj.length + resolvedIdx;
                }
                obj[resolvedIdx] = val;
                this.operandStack.push(val);
                break;
              }
              case OP.GET_MEMBER: {
                const propIdx = instructions[this.pc++];
                const prop = constants[propIdx];
                const obj = this.operandStack.pop();
                const val = resolveMember(obj, prop);
                this.operandStack.push(val !== void 0 ? val : null);
                break;
              }
              case OP.SET_MEMBER: {
                const propIdx = instructions[this.pc++];
                const prop = constants[propIdx];
                const val = this.operandStack.pop();
                const obj = this.operandStack.pop();
                if (obj === null || obj === void 0) {
                  throw new TypeError(`UVM TypeError: cannot set property '${prop}' on null/undefined`);
                }
                obj[prop] = val;
                this.operandStack.push(val);
                break;
              }
              case OP.IMPORT: {
                const nameIdx = instructions[this.pc++];
                const name = constants[nameIdx];
                const mm = this.moduleManager || _VirtualMachine.defaultModuleManager;
                if (!mm) {
                  throw new Error(`UVM ImportError: no ModuleManager configured on VM for '${name}'`);
                }
                let mod;
                if (mm.hasModule && mm.hasModule(name)) {
                  mod = mm.getOrLoad(name, this);
                } else {
                  mod = yield {
                    type: "ASYNC_IMPORT",
                    moduleName: name,
                    vm: this
                  };
                  if (!mod) {
                    mod = mm.getOrLoad(name, this);
                  }
                }
                this.operandStack.push(mod);
                break;
              }
              case OP.IMPORT_STAR: {
                const mod = this.operandStack.pop();
                if (mod && typeof mod === "object") {
                  const targetGlobals = currentFrame ? currentFrame.globals : this.globals;
                  if (Array.isArray(mod.__all__)) {
                    for (const name of mod.__all__) {
                      if (mod[name] !== void 0) {
                        targetGlobals.set(name, mod[name]);
                      }
                    }
                  } else {
                    for (const [k, v] of Object.entries(mod)) {
                      if (!k.startsWith("_") && k !== "__is_module__" && k !== "__name__") {
                        targetGlobals.set(k, v);
                      }
                    }
                  }
                }
                break;
              }
              // V-OS System Calls
              case OP.SYSCALL: {
                const syscallId = instructions[this.pc++];
                switch (syscallId) {
                  case SYSCALL.PRINT: {
                    const arg = this.operandStack.pop();
                    const text = arg === null || arg === void 0 ? "" : this.stringify(arg);
                    this.log(text);
                    this.operandStack.push(null);
                    break;
                  }
                  case SYSCALL.INPUT: {
                    const promptArg = this.operandStack.pop();
                    const promptText = promptArg !== null && promptArg !== void 0 ? this.stringify(promptArg) : "";
                    const userInput = yield {
                      type: "SUSPEND_FOR_INPUT",
                      prompt: promptText
                    };
                    this.operandStack.push(userInput !== void 0 && userInput !== null ? String(userInput) : "");
                    break;
                  }
                  case SYSCALL.SLEEP: {
                    const duration = Number(this.operandStack.pop()) || 0;
                    yield {
                      type: "SLEEP",
                      duration
                    };
                    this.operandStack.push(null);
                    break;
                  }
                  case SYSCALL.TIME: {
                    this.operandStack.push(typeof performance !== "undefined" ? performance.now() : Date.now());
                    break;
                  }
                  case SYSCALL.RANDOM: {
                    this.operandStack.push(Math.random());
                    break;
                  }
                  case SYSCALL.STR: {
                    const val = this.operandStack.pop();
                    this.operandStack.push(this.stringify(val));
                    break;
                  }
                  case SYSCALL.INT: {
                    const val = this.operandStack.pop();
                    this.operandStack.push(parseInt(val, 10) || 0);
                    break;
                  }
                  case SYSCALL.LEN: {
                    const val = this.operandStack.pop();
                    if (val === null || val === void 0) {
                      this.operandStack.push(0);
                    } else if (typeof val === "string" || Array.isArray(val)) {
                      this.operandStack.push(val.length);
                    } else if (typeof val === "object") {
                      this.operandStack.push(Object.keys(val).length);
                    } else {
                      this.operandStack.push(0);
                    }
                    break;
                  }
                  default:
                    throw new Error(`UVM Syscall Error: unknown syscall ID 0x${syscallId.toString(16)}`);
                }
                break;
              }
              case OP.HALT: {
                this.isHalted = true;
                break;
              }
              default:
                throw new Error(`UVM Bytecode Error: invalid opcode 0x${op.toString(16)} at PC ${this.pc - 1}`);
            }
          } catch (err) {
            if (!this.handleException(err)) {
              throw err;
            }
          }
        }
      } finally {
        _VirtualMachine.activeVM = prevActive;
      }
      const top = this.operandStack[this.operandStack.length - 1];
      return top !== void 0 ? top : null;
    }
  };
  VirtualMachine.defaultModuleManager = null;
  VirtualMachine.activeVM = null;

  // js/vm/compiler.js
  var BytecodeCompiler = class {
    constructor() {
      this.program = new BytecodeProgram();
      this.scopes = [/* @__PURE__ */ new Map()];
      this.scopeIsFunction = [true];
      this.nextSlot = [0];
      this.globalVariables = /* @__PURE__ */ new Set();
      this.loopBreakJumps = [];
      this.loopContinueTargets = [];
      this.nodeCounter = 0;
    }
    /**
     * Main compile entry point.
     */
    compile(ast) {
      this.program = new BytecodeProgram();
      this.scopes = [/* @__PURE__ */ new Map()];
      this.scopeIsFunction = [true];
      this.nextSlot = [0];
      this.globalVariables = /* @__PURE__ */ new Set();
      this.loopBreakJumps = [];
      this.loopContinueTargets = [];
      this.nodeCounter = 0;
      this.visit(ast);
      this.program.emit(OP.HALT);
      return this.program;
    }
    // Scope helper methods
    enterScope(isFunction = false) {
      this.scopes.push(/* @__PURE__ */ new Map());
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
        return { type: "global", name };
      }
      let functionHops = 0;
      for (let i = this.scopes.length - 1; i >= 0; i--) {
        if (this.scopes[i].has(name)) {
          return { type: "local", slot: this.scopes[i].get(name), hops: functionHops };
        }
        if (this.scopeIsFunction[i]) {
          functionHops++;
        }
      }
      return { type: "global", name };
    }
    collectAssignedVariables(node, targetSet = /* @__PURE__ */ new Set(), explicitGlobals = /* @__PURE__ */ new Set()) {
      if (!node) return targetSet;
      if (Array.isArray(node)) {
        for (const item of node) this.collectAssignedVariables(item, targetSet, explicitGlobals);
        return targetSet;
      }
      if (node.type === "GlobalStatement" || node.type === "NonlocalStatement") {
        for (const name of node.names || []) explicitGlobals.add(name);
        return targetSet;
      }
      if (node.type === "FunctionDeclaration" || node.type === "FunctionExpression") {
        return targetSet;
      }
      if (node.type === "VariableDeclarationStatement" || node.type === "VariableDeclaration") {
        const name = node.name || node.target && node.target.name;
        if (name && !explicitGlobals.has(name)) targetSet.add(name);
      } else if (node.type === "BinaryExpression" && node.operator === "=") {
        if (node.left && node.left.type === "Identifier") {
          const name = node.left.name;
          if (!explicitGlobals.has(name)) targetSet.add(name);
        }
      }
      for (const key of Object.keys(node)) {
        const val = node[key];
        if (val && typeof val === "object") {
          this.collectAssignedVariables(val, targetSet, explicitGlobals);
        }
      }
      return targetSet;
    }
    // AST Visitor
    visit(node) {
      if (!node) return;
      if (typeof node === "object") {
        if (node._nodeId === void 0) {
          node._nodeId = ++this.nodeCounter;
        }
        if (node.type && node.type !== "Program") {
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
        case "Program": {
          const body = node.body || [];
          for (const stmt of body) {
            this.visit(stmt);
          }
          break;
        }
        case "ClassDeclaration": {
          const members = node.body || [];
          for (const member of members) {
            this.visit(member);
          }
          break;
        }
        case "Literal": {
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
        case "Identifier": {
          const resolved = this.resolveVariable(node.name);
          if (resolved.type === "local") {
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
        case "VariableDeclarationStatement":
        case "VariableDeclaration": {
          const name = node.name || node.target && node.target.name;
          if (node.expression) {
            this.visit(node.expression);
          } else {
            this.program.emit(OP.NIL);
          }
          const slot = this.declareLocal(name);
          this.program.emit(OP.STORE_LOCAL, slot);
          break;
        }
        case "ExpressionStatement": {
          this.visit(node.expression);
          this.program.emit(OP.POP);
          break;
        }
        case "BinaryExpression": {
          if (node.operator === "=") {
            if (node.left.type === "Identifier") {
              this.visit(node.right);
              const resolved = this.resolveVariable(node.left.name);
              if (resolved.type === "local") {
                this.program.emit(OP.DUP);
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
            } else if (node.left.type === "IndexExpression" || node.left.type === "SubscriptExpression") {
              this.visit(node.left.object);
              this.visit(node.left.index);
              this.visit(node.right);
              this.program.emit(OP.SET_INDEX);
            } else if (node.left.type === "MemberExpression") {
              this.visit(node.left.object);
              this.visit(node.right);
              const prop = node.left.property.name !== void 0 ? node.left.property.name : node.left.property.value;
              const propIdx = this.program.addConstant(prop);
              this.program.emit(OP.SET_MEMBER, propIdx);
            }
            break;
          }
          if (node.operator === "and" || node.operator === "&&") {
            this.visit(node.left);
            this.program.emit(OP.DUP);
            const jumpFalsePc = this.program.emit(OP.JUMP_IF_FALSE, 0);
            this.program.emit(OP.POP);
            this.visit(node.right);
            this.program.patch(jumpFalsePc + 1, this.program.instructions.length);
            break;
          }
          if (node.operator === "or" || node.operator === "||") {
            this.visit(node.left);
            this.program.emit(OP.DUP);
            const jumpTruePc = this.program.emit(OP.JUMP_IF_TRUE, 0);
            this.program.emit(OP.POP);
            this.visit(node.right);
            this.program.patch(jumpTruePc + 1, this.program.instructions.length);
            break;
          }
          this.visit(node.left);
          this.visit(node.right);
          switch (node.operator) {
            case "+":
              this.program.emit(OP.ADD);
              break;
            case "-":
              this.program.emit(OP.SUB);
              break;
            case "*":
              this.program.emit(OP.MUL);
              break;
            case "/":
              this.program.emit(OP.DIV);
              break;
            case "//":
              this.program.emit(OP.IDIV);
              break;
            case "%":
              this.program.emit(OP.MOD);
              break;
            case "**":
              this.program.emit(OP.POW);
              break;
            case "@":
              this.program.emit(OP.MATMUL);
              break;
            case "==":
            case "===":
              this.program.emit(OP.EQ);
              break;
            case "!=":
            case "!==":
              this.program.emit(OP.NEQ);
              break;
            case "<":
              this.program.emit(OP.LT);
              break;
            case "<=":
              this.program.emit(OP.LTE);
              break;
            case ">":
              this.program.emit(OP.GT);
              break;
            case ">=":
              this.program.emit(OP.GTE);
              break;
            case "&":
              this.program.emit(OP.BIT_AND);
              break;
            case "|":
              this.program.emit(OP.BIT_OR);
              break;
            case "^":
              this.program.emit(OP.BIT_XOR);
              break;
            case "<<":
              this.program.emit(OP.SHL);
              break;
            case ">>":
              this.program.emit(OP.SHR);
              break;
            case "in":
              this.program.emit(OP.IN);
              break;
            default:
              throw new Error(`Compiler Error: unsupported binary operator '${node.operator}'`);
          }
          break;
        }
        case "UnaryExpression": {
          this.visit(node.argument);
          if (node.operator === "-") {
            this.program.emit(OP.NEG);
          } else if (node.operator === "+") {
            this.program.emit(OP.POS);
          } else if (node.operator === "!" || node.operator === "not") {
            this.program.emit(OP.NOT);
          } else if (node.operator === "~") {
            this.program.emit(OP.BIT_NOT);
          }
          break;
        }
        case "UpdateExpression": {
          const name = node.argument.name;
          const resolved = this.resolveVariable(name);
          if (resolved.type === "local") {
            this.program.emit(OP.LOAD_LOCAL, resolved.slot);
            if (!node.prefix) {
              this.program.emit(OP.DUP);
            }
            const constOne = this.program.addConstant(1);
            this.program.emit(OP.CONST, constOne);
            if (node.operator === "++") {
              this.program.emit(OP.ADD);
            } else {
              this.program.emit(OP.SUB);
            }
            if (node.prefix) {
              this.program.emit(OP.DUP);
            }
            this.program.emit(OP.STORE_LOCAL, resolved.slot);
            if (node.prefix) {
            }
          }
          break;
        }
        case "IfStatement": {
          const testNode = node.test || node.expression;
          this.visit(testNode);
          const jumpFalsePc = this.program.emit(OP.JUMP_IF_FALSE, 0);
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
        case "WhileStatement": {
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
        case "CStyleForStatement":
        case "ForStatement": {
          if (node.init) {
            this.visit(node.init);
            if (node.init.type !== "VariableDeclarationStatement" && node.init.type !== "VariableDeclaration") {
              this.program.emit(OP.POP);
            }
          }
          const loopStartPc = this.program.instructions.length;
          let jumpExitPc = null;
          if (node.condition || node.test) {
            this.visit(node.condition || node.test);
            jumpExitPc = this.program.emit(OP.JUMP_IF_FALSE, 0);
          }
          this.loopBreakJumps.push([]);
          this.loopContinueTargets.push(loopStartPc);
          const body = node.body;
          if (Array.isArray(body)) {
            for (const stmt of body) this.visit(stmt);
          } else {
            this.visit(body);
          }
          if (node.update) {
            this.visit(node.update);
            this.program.emit(OP.POP);
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
        case "BreakStatement": {
          if (this.loopBreakJumps.length > 0) {
            const jumpPc = this.program.emit(OP.JUMP, 0);
            this.loopBreakJumps[this.loopBreakJumps.length - 1].push(jumpPc);
          }
          break;
        }
        case "ContinueStatement": {
          if (this.loopContinueTargets.length > 0) {
            const targetPc = this.loopContinueTargets[this.loopContinueTargets.length - 1];
            this.program.emit(OP.JUMP, targetPc);
          }
          break;
        }
        case "GlobalStatement":
        case "NonlocalStatement": {
          for (const name of node.names || []) {
            this.globalVariables.add(name);
          }
          break;
        }
        case "CallExpression": {
          const callee = node.callee;
          if (callee.type === "Identifier") {
            if (callee.name === "print") {
              const args = node.arguments || [];
              const hasKw = args.some((a) => a && (a.type === "KeywordArgument" || a.isKwSpread || a.type === "ObjectExpression" && a.properties && a.properties.some((p) => p.key && (p.key.name === "__is_py_kwargs__" || p.key.name === "end" || p.key.name === "sep" || p.key.value === "end" || p.key.value === "sep"))));
              if (!hasKw && args.length <= 1) {
                if (args.length === 0) {
                  this.program.emit(OP.NIL);
                } else {
                  this.visit(args[0]);
                }
                this.program.emit(OP.SYSCALL, SYSCALL.PRINT);
                return;
              }
              const printConst = this.program.addConstant("print");
              this.program.emit(OP.LOAD_GLOBAL, printConst);
              for (const arg of args) {
                this.visit(arg);
              }
              this.program.emit(OP.CALL, args.length);
              return;
            } else if (callee.name === "sleep") {
              const arg = node.arguments[0];
              if (arg) this.visit(arg);
              else {
                const constZero = this.program.addConstant(0);
                this.program.emit(OP.CONST, constZero);
              }
              this.program.emit(OP.SYSCALL, SYSCALL.SLEEP);
              return;
            } else if (callee.name === "input") {
              const arg = node.arguments[0];
              if (arg) this.visit(arg);
              else this.program.emit(OP.NIL);
              this.program.emit(OP.SYSCALL, SYSCALL.INPUT);
              return;
            }
          }
          if (callee.type === "MemberExpression" && callee.property && (callee.property.name === "println" || callee.property.name === "print")) {
            const isPrintln = callee.property.name === "println";
            if (isPrintln) {
              const args = node.arguments || [];
              if (args.length === 0) {
                this.program.emit(OP.NIL);
                this.program.emit(OP.SYSCALL, SYSCALL.PRINT);
              } else if (args.length === 1) {
                this.visit(args[0]);
                this.program.emit(OP.SYSCALL, SYSCALL.PRINT);
              } else {
                const printConst2 = this.program.addConstant("print");
                this.program.emit(OP.LOAD_GLOBAL, printConst2);
                for (const arg2 of args) this.visit(arg2);
                this.program.emit(OP.CALL, args.length);
              }
              return;
            }
            const printConst = this.program.addConstant("print");
            this.program.emit(OP.LOAD_GLOBAL, printConst);
            const arg = node.arguments && node.arguments[0] ? node.arguments[0] : null;
            if (arg) {
              this.visit(arg);
            } else {
              const emptyConst = this.program.addConstant("");
              this.program.emit(OP.CONST, emptyConst);
            }
            const endConst = this.program.addConstant({ end: "", __is_py_kwargs__: true });
            this.program.emit(OP.CONST, endConst);
            this.program.emit(OP.CALL, 2);
            return;
          }
          const hasSpread = (node.arguments || []).some((a) => a && a.type === "SpreadElement");
          if (hasSpread) {
            this.visit(callee);
            this.program.emit(OP.BUILD_LIST, 0);
            for (const arg of node.arguments) {
              this.program.emit(OP.DUP);
              if (arg && arg.type === "SpreadElement") {
                if (arg.isKwSpread) {
                  const appIdx = this.program.addConstant("append");
                  this.program.emit(OP.GET_MEMBER, appIdx);
                  this.visit(arg.argument);
                  this.program.emit(OP.CALL, 1);
                  this.program.emit(OP.POP);
                } else {
                  const extIdx = this.program.addConstant("extend");
                  this.program.emit(OP.GET_MEMBER, extIdx);
                  this.visit(arg.argument);
                  this.program.emit(OP.CALL, 1);
                  this.program.emit(OP.POP);
                }
              } else {
                const appIdx = this.program.addConstant("append");
                this.program.emit(OP.GET_MEMBER, appIdx);
                this.visit(arg);
                this.program.emit(OP.CALL, 1);
                this.program.emit(OP.POP);
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
        case "FunctionDeclaration": {
          const jumpOverPc = this.program.emit(OP.JUMP, 0);
          const entryPC = this.program.instructions.length;
          this.enterScope(true);
          let restParamIndex = void 0;
          const paramDefaultInits = [];
          for (let i = 0; i < (node.params || []).length; i++) {
            const param = node.params[i];
            const paramName = typeof param === "string" ? param : param.name || param.id;
            const slot = this.declareLocal(paramName);
            if (param && param.isRest) {
              restParamIndex = i;
            } else if (param && param.isKwRest) {
              paramDefaultInits.push({ slot, defaultValue: { type: "DictLiteral", properties: [] } });
            }
            if (param && param.defaultValue) {
              paramDefaultInits.push({ slot, defaultValue: param.defaultValue });
            }
          }
          const body = node.body || [];
          const explicitGlobals = /* @__PURE__ */ new Set();
          const autoLocals = this.collectAssignedVariables(body, /* @__PURE__ */ new Set(), explicitGlobals);
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
            name: node.name,
            entryPC,
            paramCount: (node.params || []).length,
            paramNames: (node.params || []).map((p) => typeof p === "string" ? p : p.name || p.id),
            localCount,
            restParamIndex
          };
          const constIdx = this.program.addConstant(fnDescriptor);
          this.program.emit(OP.CONST, constIdx);
          const resolved = this.resolveVariable(node.name);
          if (resolved.type === "local") {
            this.program.emit(OP.STORE_LOCAL, resolved.slot);
          } else {
            const nameIdx = this.program.addConstant(node.name);
            this.program.emit(OP.STORE_GLOBAL, nameIdx);
          }
          break;
        }
        case "FunctionExpression": {
          const jumpOverPc = this.program.emit(OP.JUMP, 0);
          const entryPC = this.program.instructions.length;
          this.enterScope(true);
          let restParamIndex = void 0;
          const paramDefaultInits = [];
          for (let i = 0; i < (node.params || []).length; i++) {
            const param = node.params[i];
            const paramName = typeof param === "string" ? param : param.name || param.id;
            const slot = this.declareLocal(paramName);
            if (param && param.isRest) {
              restParamIndex = i;
            } else if (param && param.isKwRest) {
              paramDefaultInits.push({ slot, defaultValue: { type: "DictLiteral", properties: [] } });
            }
            if (param && param.defaultValue) {
              paramDefaultInits.push({ slot, defaultValue: param.defaultValue });
            }
          }
          const body = node.body || [];
          const explicitGlobals = /* @__PURE__ */ new Set();
          const autoLocals = this.collectAssignedVariables(body, /* @__PURE__ */ new Set(), explicitGlobals);
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
            name: node.name || "<anonymous>",
            entryPC,
            paramCount: (node.params || []).length,
            paramNames: (node.params || []).map((p) => typeof p === "string" ? p : p.name || p.id),
            localCount,
            restParamIndex
          };
          const constIdx = this.program.addConstant(fnDescriptor);
          this.program.emit(OP.CONST, constIdx);
          break;
        }
        case "ConditionalExpression": {
          this.visit(node.test);
          const jumpFalsePc = this.program.emit(OP.JUMP_IF_FALSE, 0);
          this.visit(node.consequent);
          const jumpEndPc = this.program.emit(OP.JUMP, 0);
          this.program.patch(jumpFalsePc + 1, this.program.instructions.length);
          this.visit(node.alternate);
          this.program.patch(jumpEndPc + 1, this.program.instructions.length);
          break;
        }
        case "ReturnStatement": {
          if (node.argument || node.expression) {
            this.visit(node.argument || node.expression);
          } else {
            this.program.emit(OP.NIL);
          }
          this.program.emit(OP.RETURN);
          break;
        }
        case "ArrayExpression":
        case "ListLiteral": {
          const elements = node.elements || [];
          for (const elem of elements) {
            this.visit(elem);
          }
          this.program.emit(OP.BUILD_LIST, elements.length);
          break;
        }
        case "IndexExpression":
        case "SubscriptExpression": {
          this.visit(node.object);
          this.visit(node.index);
          this.program.emit(OP.GET_INDEX);
          break;
        }
        case "MemberExpression": {
          this.visit(node.object);
          const prop = node.property.name !== void 0 ? node.property.name : node.property.value;
          const propIdx = this.program.addConstant(prop);
          this.program.emit(OP.GET_MEMBER, propIdx);
          break;
        }
        case "ObjectExpression":
        case "DictLiteral": {
          const props = node.properties || [];
          const hasSpread = props.some((p) => p && p.type === "SpreadElement");
          if (!hasSpread) {
            for (const p of props) {
              this.visit(p.key);
              this.visit(p.value);
            }
            this.program.emit(OP.BUILD_MAP, props.length);
          } else {
            this.program.emit(OP.BUILD_MAP, 0);
            for (const p of props) {
              if (p.type === "SpreadElement") {
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
        case "ImportStatement": {
          const modIdx = this.program.addConstant(node.module);
          this.program.emit(OP.IMPORT, modIdx);
          if (node.specifiers && node.specifiers.length > 0) {
            if (node.specifiers.length === 1 && (node.specifiers[0].imported === "*" || node.specifiers[0].local === "*")) {
              this.program.emit(OP.IMPORT_STAR);
            } else {
              for (const spec of node.specifiers) {
                this.program.emit(OP.DUP);
                const propIdx = this.program.addConstant(spec.imported);
                this.program.emit(OP.GET_MEMBER, propIdx);
                const resolved = this.resolveVariable(spec.local);
                if (resolved.type === "local") {
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
            if (resolved.type === "local") {
              this.program.emit(OP.STORE_LOCAL, resolved.slot);
            } else {
              const nameIdx = this.program.addConstant(targetName);
              this.program.emit(OP.STORE_GLOBAL, nameIdx);
            }
          }
          break;
        }
        case "TryStatement": {
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
            this.program.emit(OP.POP);
          } else {
            const handlerEndJumps = [];
            for (let h = 0; h < handlers.length; h++) {
              const handler = handlers[h];
              let nextHandlerPc = null;
              if (handler.errorClass) {
                this.program.emit(OP.DUP);
                const namePropIdx = this.program.addConstant("name");
                this.program.emit(OP.GET_MEMBER, namePropIdx);
                const targetName = handler.errorClass.name || handler.errorClass.value || "Exception";
                const targetNameIdx = this.program.addConstant(targetName);
                this.program.emit(OP.CONST, targetNameIdx);
                this.program.emit(OP.EQ);
                nextHandlerPc = this.program.emit(OP.JUMP_IF_FALSE, 0);
              }
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
            this.program.emit(OP.RAISE);
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
        case "ThrowStatement": {
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
  };

  // js/vfs/vfs.js
  var VirtualFileSystem = class {
    constructor() {
      this.files = /* @__PURE__ */ new Map();
      this.directories = /* @__PURE__ */ new Set(["/", "/lib", "/lib/python3", "/lib/c"]);
      this.seedDefaultFiles();
    }
    normalizePath(rawPath) {
      if (!rawPath || typeof rawPath !== "string") return "/";
      let p = rawPath.replace(/\\/g, "/");
      if (!p.startsWith("/")) p = "/" + p;
      const parts = p.split("/").filter(Boolean);
      const resolved = [];
      for (const part of parts) {
        if (part === ".") continue;
        if (part === "..") {
          resolved.pop();
        } else {
          resolved.push(part);
        }
      }
      return "/" + resolved.join("/");
    }
    mkdir(dirPath) {
      const norm = this.normalizePath(dirPath);
      const parts = norm.split("/").filter(Boolean);
      let curr = "";
      for (const part of parts) {
        curr += "/" + part;
        this.directories.add(curr);
      }
    }
    writeFile(filePath, content) {
      const norm = this.normalizePath(filePath);
      const parent = norm.substring(0, norm.lastIndexOf("/")) || "/";
      this.mkdir(parent);
      this.files.set(norm, typeof content === "string" ? content : String(content));
    }
    readFile(filePath) {
      const norm = this.normalizePath(filePath);
      if (!this.files.has(norm)) {
        throw new Error(`FileNotFoundError: [Errno 2] No such file: '${filePath}'`);
      }
      return this.files.get(norm);
    }
    exists(filePath) {
      const norm = this.normalizePath(filePath);
      return this.files.has(norm) || this.directories.has(norm);
    }
    readdir(dirPath) {
      const norm = this.normalizePath(dirPath);
      const prefix = norm === "/" ? "/" : norm + "/";
      const entries = /* @__PURE__ */ new Set();
      for (const file of this.files.keys()) {
        if (file.startsWith(prefix)) {
          const rest = file.slice(prefix.length);
          const name = rest.split("/")[0];
          entries.add(name);
        }
      }
      for (const dir of this.directories) {
        if (dir !== norm && dir.startsWith(prefix)) {
          const rest = dir.slice(prefix.length);
          const name = rest.split("/")[0];
          entries.add(name);
        }
      }
      return Array.from(entries).sort();
    }
    unlink(filePath) {
      const norm = this.normalizePath(filePath);
      if (this.directories.has(norm)) {
        throw new Error(`IsADirectoryError: [Errno 21] Is a directory: '${filePath}'`);
      }
      if (!this.files.has(norm)) {
        throw new Error(`FileNotFoundError: [Errno 2] No such file: '${filePath}'`);
      }
      this.files.delete(norm);
      return true;
    }
    rmdir(dirPath) {
      const norm = this.normalizePath(dirPath);
      if (this.files.has(norm)) {
        throw new Error(`NotADirectoryError: [Errno 20] Not a directory: '${dirPath}'`);
      }
      if (!this.directories.has(norm)) {
        throw new Error(`FileNotFoundError: [Errno 2] No such directory: '${dirPath}'`);
      }
      if (norm === "/") {
        throw new Error(`PermissionError: [Errno 13] Cannot remove root directory`);
      }
      const entries = this.readdir(norm);
      if (entries.length > 0) {
        throw new Error(`OSError: [Errno 39] Directory not empty: '${dirPath}'`);
      }
      this.directories.delete(norm);
      return true;
    }
    rmtree(dirPath) {
      const norm = this.normalizePath(dirPath);
      if (norm === "/") {
        throw new Error(`PermissionError: [Errno 13] Cannot remove root directory`);
      }
      if (this.files.has(norm)) {
        throw new Error(`NotADirectoryError: [Errno 20] Not a directory: '${dirPath}'`);
      }
      if (!this.directories.has(norm)) {
        throw new Error(`FileNotFoundError: [Errno 2] No such directory: '${dirPath}'`);
      }
      const prefix = norm + "/";
      for (const filePath of Array.from(this.files.keys())) {
        if (filePath.startsWith(prefix)) {
          this.files.delete(filePath);
        }
      }
      for (const subDir of Array.from(this.directories)) {
        if (subDir === norm || subDir.startsWith(prefix)) {
          this.directories.delete(subDir);
        }
      }
      return true;
    }
    stat(targetPath) {
      const norm = this.normalizePath(targetPath);
      if (this.directories.has(norm)) {
        return {
          isDirectory: true,
          isFile: false,
          size: 4096,
          mtime: Date.now()
        };
      }
      if (this.files.has(norm)) {
        const content = this.files.get(norm);
        return {
          isDirectory: false,
          isFile: true,
          size: typeof content === "string" ? content.length : 0,
          mtime: Date.now()
        };
      }
      throw new Error(`FileNotFoundError: [Errno 2] No such file or directory: '${targetPath}'`);
    }
    isDirectory(targetPath) {
      const norm = this.normalizePath(targetPath);
      return this.directories.has(norm);
    }
    isFile(targetPath) {
      const norm = this.normalizePath(targetPath);
      return this.files.has(norm);
    }
    copyFile(src, dst) {
      const content = this.readFile(src);
      let dstNorm = this.normalizePath(dst);
      if (this.isDirectory(dstNorm)) {
        const base = this.normalizePath(src).split("/").pop();
        dstNorm = (dstNorm === "/" ? "" : dstNorm) + "/" + base;
      }
      this.writeFile(dstNorm, content);
      return dstNorm;
    }
    copyTree(src, dst) {
      const srcNorm = this.normalizePath(src);
      if (!this.isDirectory(srcNorm)) {
        throw new Error(`NotADirectoryError: [Errno 20] Not a directory: '${src}'`);
      }
      const dstNorm = this.normalizePath(dst);
      this.mkdir(dstNorm);
      const prefix = srcNorm === "/" ? "/" : srcNorm + "/";
      for (const [filePath, content] of this.files.entries()) {
        if (filePath.startsWith(prefix)) {
          const rel = filePath.slice(prefix.length);
          const targetPath = (dstNorm === "/" ? "" : dstNorm) + "/" + rel;
          this.writeFile(targetPath, content);
        }
      }
      for (const subDir of this.directories) {
        if (subDir !== srcNorm && subDir.startsWith(prefix)) {
          const rel = subDir.slice(prefix.length);
          const targetDir = (dstNorm === "/" ? "" : dstNorm) + "/" + rel;
          this.mkdir(targetDir);
        }
      }
      return dstNorm;
    }
    move(src, dst) {
      const srcNorm = this.normalizePath(src);
      if (this.isFile(srcNorm)) {
        this.copyFile(src, dst);
        this.unlink(src);
      } else if (this.isDirectory(srcNorm)) {
        this.copyTree(src, dst);
        this.rmtree(src);
      } else {
        throw new Error(`FileNotFoundError: [Errno 2] No such file or directory: '${src}'`);
      }
      return dst;
    }
    seedDefaultFiles() {
      this.writeFile("/workspace/main.py", `# Universal Interpreter Workspace
# Welcome to UVM 3.5 Interactive Studio

def calculate_fibonacci(n):
    if n <= 1:
        return n
    a, b = 0, 1
    for _ in range(2, n + 1):
        a, b = b, a + b
    return b

print("UVM Runtime Active.")
for i in range(1, 9):
    print(f"fib({i}) = {calculate_fibonacci(i)}")
`);
      this.writeFile("/workspace/utils.py", `# Utility helper functions
def is_even(n):
    return n % 2 == 0

def clamp(val, low, high):
    if val < low:
        return low
    if val > high:
        return high
    return val

def greeting(name):
    return f"Hello, {name} from UVM VFS!"
`);
      this.writeFile("/workspace/native.c", `/* Genuine C Extension for UVM Bytecode Stepper */
#include <stdio.h>

int add(int a, int b) {
    return a + b;
}

int square(int n) {
    return n * n;
}
`);
      this.writeFile("/workspace/config.json", `{
  "project": "Universal Interpreter Studio",
  "version": "3.5.0",
  "target": "uvm-stack",
  "compiler": "ohm-js",
  "languages": ["python", "c", "java"]
}
`);
      this.writeFile("/workspace/README.md", `# Universal Interpreter

A sandboxed multi-language execution engine and bytecode virtual machine.

## Features
- **Ohm AST Parser**: Python 3, ANSI C, and Java grammars.
- **UVM Bytecode Stepper**: Instruction-by-instruction execution.
- **In-Memory POSIX VFS**: Sandboxed virtual filesystem with tiered modules.
`);
      this.writeFile("/lib/python3/statistics.py", `
# Python Standard Library: statistics (Pure Python)

def mean(data):
    total = 0
    for x in data:
        total = total + x
    return total / len(data)

def fmean(data):
    return mean(data)

def _sort(lst):
    # In-place bubble/selection sort copy
    res = []
    for item in lst:
        res.append(item)
    n = len(res)
    i = 0
    while i < n:
        j = 0
        while j < n - i - 1:
            if res[j] > res[j + 1]:
                temp = res[j]
                res[j] = res[j + 1]
                res[j + 1] = temp
            j = j + 1
        i = i + 1
    return res

def median(data):
    s = _sort(data)
    n = len(s)
    mid = n // 2
    if n % 2 == 1:
        return s[mid]
    return (s[mid - 1] + s[mid]) / 2

def variance(data):
    m = mean(data)
    total_sq = 0
    for x in data:
        diff = x - m
        total_sq = total_sq + diff * diff
    return total_sq / (len(data) - 1)

def stdev(data):
    import math
    return math.sqrt(variance(data))
`);
      this.writeFile("/lib/c/_fastmath.c", `
#include <Python.h>

/* Genuine C implementation of fast GCD using Euclidean algorithm */
static PyObject* py_fast_gcd(PyObject* self, PyObject* args) {
    long a, b;
    if (!PyArg_ParseTuple(args, "ll", &a, &b)) {
        return NULL;
    }
    while (b != 0) {
        long temp = b;
        b = a % b;
        a = temp;
    }
    return PyLong_FromLong(a);
}

/* Genuine C implementation of fast iterative Fibonacci */
static PyObject* py_fast_fib(PyObject* self, PyObject* args) {
    long n;
    if (!PyArg_ParseTuple(args, "l", &n)) {
        return NULL;
    }
    if (n <= 0) return PyLong_FromLong(0);
    long a = 0;
    long b = 1;
    for (long i = 1; i < n; i++) {
        long temp = a + b;
        a = b;
        b = temp;
    }
    return PyLong_FromLong(b);
}

/* Genuine C implementation of trial-division primality test */
static PyObject* py_is_prime(PyObject* self, PyObject* args) {
    long n;
    if (!PyArg_ParseTuple(args, "l", &n)) {
        return NULL;
    }
    if (n <= 1) return PyLong_FromLong(0);
    for (long d = 2; d * d <= n; d++) {
        if (n % d == 0) return PyLong_FromLong(0);
    }
    return PyLong_FromLong(1);
}

/* Method Table definition (Standard Python.h convention) */
static PyMethodDef FastMathMethods[] = {
    {"fast_gcd", py_fast_gcd, METH_VARARGS, "Calculate greatest common divisor in C"},
    {"fast_fib", py_fast_fib, METH_VARARGS, "Calculate fast fibonacci in C"},
    {"is_prime", py_is_prime, METH_VARARGS, "Check primality in C"},
    {NULL, NULL, 0, NULL}
};

/* Module Initialization function */
PyMODINIT_FUNC PyInit__fastmath(void) {
    return PyModule_Create(&fastmathmodule);
}
`);
    }
  };
  var vfs = new VirtualFileSystem();

  // js/vm/c_extension.js
  var cGrammar2 = null;
  var cSemantics2 = null;
  function initCGrammar() {
    if (!cGrammar2) {
      const bundle = grammars(C_GRAMMAR_SRC);
      cGrammar2 = bundle.CSyntax;
      cSemantics2 = createCSemantics(cGrammar2);
    }
    return { grammar: cGrammar2, semantics: cSemantics2 };
  }
  function createModuleCallable(fnName, cProgram) {
    return function(...args) {
      const prog = new BytecodeProgram();
      prog.constants = [...cProgram.constants];
      prog.instructions = [...cProgram.instructions];
      if (prog.instructions[prog.instructions.length - 1] === OP.HALT) {
        prog.instructions.pop();
      }
      const nameIdx = prog.addConstant(fnName);
      prog.emit(OP.LOAD_GLOBAL, nameIdx);
      for (const arg of args) {
        const idx = prog.addConstant(arg);
        prog.emit(OP.CONST, idx);
      }
      prog.emit(OP.CALL, args.length);
      prog.emit(OP.HALT);
      const subVm = new VirtualMachine();
      const iter = subVm.execute(prog);
      let step;
      let res;
      while (!(step = iter.next()).done) {
        res = step.value;
      }
      return step.value !== void 0 ? step.value : res;
    };
  }
  function loadCExtension(cSource) {
    const { grammar: grammar2, semantics } = initCGrammar();
    const match = grammar2.match(cSource, "CProgram");
    if (!match.succeeded()) {
      throw new SyntaxError(`C Extension Compilation Error:
${match.message}`);
    }
    const ast = semantics(match).toAST();
    const methodTables = ast.body.filter((n) => n.type === "CMethodTable");
    const codeNodes = ast.body.filter((n) => n.type !== "CMethodTable");
    const compiler = new BytecodeCompiler();
    const program = compiler.compile({ type: "Program", body: codeNodes });
    const vm = new VirtualMachine();
    const iter = vm.execute(program);
    while (!iter.next().done) {
    }
    const moduleExports = {};
    for (const table of methodTables) {
      for (const entry of table.entries) {
        if (vm.globals.has(entry.cFunction)) {
          moduleExports[entry.name] = createModuleCallable(entry.cFunction, program);
          moduleExports[entry.name].doc = entry.doc;
        }
      }
    }
    return moduleExports;
  }

  // js/vm/modules.js
  function createPythonModuleCallable(fnVal, modVm) {
    const fn = function(...args) {
      return modVm.callCallable(fnVal, ...args);
    };
    fn.__uvm_callable__ = fnVal;
    fn.__uvm_mod_vm__ = modVm;
    return fn;
  }
  var ModuleManager = class {
    constructor(virtualFs = vfs) {
      this.vfs = virtualFs;
      this.cache = /* @__PURE__ */ new Map();
      this.hostBridges = /* @__PURE__ */ new Map();
      this.initHostBridges();
    }
    initHostBridges() {
      this.hostBridges.set("math", {
        pi: Math.PI,
        e: Math.E,
        tau: 2 * Math.PI,
        inf: Infinity,
        nan: NaN,
        sqrt: (x) => Math.sqrt(x),
        sin: (x) => Math.sin(x),
        cos: (x) => Math.cos(x),
        tan: (x) => Math.tan(x),
        asin: (x) => Math.asin(x),
        acos: (x) => Math.acos(x),
        atan: (x) => Math.atan(x),
        atan2: (y, x) => Math.atan2(y, x),
        log: (x, base) => base !== void 0 ? Math.log(x) / Math.log(base) : Math.log(x),
        log10: (x) => Math.log10(x),
        exp: (x) => Math.exp(x),
        pow: (x, y) => Math.pow(x, y),
        floor: (x) => Math.floor(x),
        ceil: (x) => Math.ceil(x),
        trunc: (x) => Math.trunc(x),
        fabs: (x) => Math.abs(x),
        gcd: (a, b) => {
          let x = Math.abs(a);
          let y = Math.abs(b);
          while (y) {
            const t = y;
            y = x % y;
            x = t;
          }
          return x;
        },
        factorial: (n) => {
          if (n < 0) throw new RangeError("ValueError: factorial() not defined for negative values");
          let r = 1;
          for (let i = 2; i <= n; i++) r *= i;
          return r;
        }
      });
      this.hostBridges.set("time", {
        time: () => Date.now() / 1e3,
        perf_counter: () => typeof performance !== "undefined" ? performance.now() / 1e3 : Date.now() / 1e3,
        sleep: (s) => new Promise((resolve) => setTimeout(resolve, Math.max(0, Math.round((Number(s) || 0) * 1e3))))
      });
      this.hostBridges.set("json", {
        dumps: (obj, indent) => JSON.stringify(obj, null, indent),
        loads: (str) => JSON.parse(str)
      });
      const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const compilePattern = (pat, flags = 0) => {
        let jsFlags = "g";
        if (flags & 2) jsFlags += "i";
        if (flags & 8) jsFlags += "m";
        if (flags & 16) jsFlags += "s";
        let cleanPat = String(pat);
        if (flags & 64) {
          const lines = cleanPat.split(/\r?\n|\\n/);
          let cleaned = "";
          for (const line of lines) {
            let inClass = false;
            let lineClean = "";
            for (let i = 0; i < line.length; i++) {
              const ch = line[i];
              if (ch === "\\" && i + 1 < line.length) {
                lineClean += ch + line[i + 1];
                i++;
                continue;
              }
              if (ch === "[" && !inClass) {
                inClass = true;
                lineClean += ch;
                continue;
              }
              if (ch === "]" && inClass) {
                inClass = false;
                lineClean += ch;
                continue;
              }
              if (ch === "#" && !inClass) {
                break;
              }
              if (!inClass && /\s/.test(ch)) {
                continue;
              }
              lineClean += ch;
            }
            cleaned += lineClean;
          }
          cleanPat = cleaned;
        }
        return {
          pattern: pat,
          split: (str, maxsplit = 0) => {
            const rx = new RegExp(cleanPat, jsFlags);
            if (maxsplit > 0) {
              return String(str).split(rx, maxsplit);
            }
            return String(str).split(rx);
          },
          search: (str) => {
            const rx = new RegExp(cleanPat, jsFlags.replace("g", ""));
            const m = String(str).match(rx);
            if (!m) return null;
            const groups = m.groups || {};
            return {
              group: (name = 0) => name === 0 ? m[0] : groups && groups[name] !== void 0 ? groups[name] : m[name],
              groups: () => groups,
              start: () => m.index
            };
          },
          match: (str) => {
            const rx = new RegExp("^(?:" + cleanPat + ")", jsFlags.replace("g", ""));
            const m = String(str).match(rx);
            if (!m) return null;
            const groups = m.groups || {};
            return {
              group: (name = 0) => name === 0 ? m[0] : groups && groups[name] !== void 0 ? groups[name] : m[name],
              groups: () => groups,
              start: () => 0
            };
          },
          findall: (str) => {
            const rx = new RegExp(cleanPat, jsFlags.includes("g") ? jsFlags : jsFlags + "g");
            return Array.from(String(str).matchAll(rx), (m) => m[0]);
          },
          sub: (repl, str) => {
            if (typeof repl === "function") {
              return String(str).replace(new RegExp(cleanPat, jsFlags), (...m) => {
                const groups = m[m.length - 1];
                const matchObj = {
                  group: (name = 0) => name === 0 ? m[0] : groups && groups[name] !== void 0 ? groups[name] : null,
                  groups: () => groups || {},
                  start: (name = 0) => m[m.length - 2]
                };
                return repl(matchObj);
              });
            }
            return String(str).replace(new RegExp(cleanPat, jsFlags), repl);
          },
          finditer: (str) => {
            const matches = [];
            const rx = new RegExp(cleanPat, jsFlags);
            let m;
            while ((m = rx.exec(String(str))) !== null) {
              const groups = m.groups || {};
              matches.push({
                group: (name = 0) => name === 0 ? m[0] : groups[name] !== void 0 ? groups[name] : null,
                start: () => m.index
              });
              if (!rx.global) break;
            }
            return matches;
          }
        };
      };
      this.hostBridges.set("re", {
        search: (pat, str) => {
          const m = String(str).match(new RegExp(pat));
          return m ? m[0] : null;
        },
        match: (pat, str) => {
          const m = String(str).match(new RegExp("^" + pat));
          return m ? m[0] : null;
        },
        findall: (pat, str) => Array.from(String(str).matchAll(new RegExp(pat, "g")), (m) => m[0]),
        sub: (pat, repl, str) => String(str).replace(new RegExp(pat, "g"), repl),
        split: (pat, str) => String(str).split(new RegExp(pat)),
        escape: escapeRegex,
        compile: compilePattern,
        IGNORECASE: 2,
        I: 2,
        MULTILINE: 8,
        M: 8,
        DOTALL: 16,
        S: 16,
        VERBOSE: 64,
        X: 64,
        ASCII: 256,
        A: 256
      });
      this.hostBridges.set("regex", this.hostBridges.get("re"));
      this.hostBridges.set("random", {
        random: () => Math.random(),
        randint: (a, b) => Math.floor(Math.random() * (b - a + 1)) + a,
        choice: (seq) => seq && seq.length > 0 ? seq[Math.floor(Math.random() * seq.length)] : null,
        uniform: (a, b) => a + Math.random() * (b - a)
      });
      class _RequestException extends Error {
        constructor(msg) {
          super(msg || "RequestException");
          this.name = "RequestException";
        }
        toString() {
          return `${this.name}: ${this.message}`;
        }
      }
      const RequestException = function(msg) {
        return new _RequestException(msg);
      };
      class _HTTPAdapter {
        constructor(options = {}) {
          this.max_retries = options.max_retries || null;
        }
      }
      const HTTPAdapter = function(options = {}) {
        return new _HTTPAdapter(options);
      };
      class _Retry {
        constructor(options = {}) {
          this.total = options.total !== void 0 ? options.total : 3;
          this.backoff_factor = options.backoff_factor !== void 0 ? options.backoff_factor : 0;
          this.status_forcelist = options.status_forcelist || [500, 502, 503, 504];
        }
      }
      const Retry = function(options = {}) {
        return new _Retry(options);
      };
      const createResponseObj = async (res, startTime = 0) => {
        const textBody = await res.text();
        const elapsedSecs = startTime > 0 ? (performance.now() - startTime) / 1e3 : 0.05;
        let cachedJson = void 0;
        const resp = {
          status_code: res.status,
          ok: res.ok,
          text: textBody,
          url: res.url,
          headers: res.headers ? Object.fromEntries(res.headers.entries()) : {},
          elapsed: {
            total_seconds: () => elapsedSecs,
            toString: () => `${elapsedSecs.toFixed(3)}s`
          },
          raise_for_status: () => {
            if (!res.ok) {
              throw new RequestException(`HTTP ${res.status}: ${res.statusText || "Error"} for url: ${res.url}`);
            }
            return null;
          },
          iter_content: (options = 128) => {
            let size = 128;
            if (typeof options === "number") {
              size = options;
            } else if (options && typeof options === "object") {
              size = options.chunk_size || 128;
            }
            const chunks = [];
            for (let i = 0; i < textBody.length; i += size) {
              chunks.push(textBody.slice(i, i + size));
            }
            return chunks.length > 0 ? chunks : [""];
          },
          json: () => {
            if (cachedJson !== void 0) return cachedJson;
            try {
              cachedJson = JSON.parse(textBody);
              return cachedJson;
            } catch (e) {
              throw new RequestException(`JSONDecodeError: ${e.message}`);
            }
          },
          __enter__: function() {
            return this;
          },
          __exit__: function() {
            return null;
          },
          __str__: () => `<Response [${res.status}]>`,
          toString: () => `<Response [${res.status}]>`
        };
        return resp;
      };
      class Session {
        constructor() {
          this.headers = {
            _data: {},
            update(d) {
              if (d && typeof d === "object") {
                Object.assign(this._data, d);
              }
            },
            get(k, def) {
              return this._data[k] !== void 0 ? this._data[k] : def;
            }
          };
          this.adapters = {};
        }
        mount(prefix, adapter) {
          this.adapters[prefix] = adapter;
        }
        async get(url, options = {}) {
          const mergedHeaders = { ...this.headers._data, ...options && options.headers || {} };
          return requestsModule.get(url, { ...options, headers: mergedHeaders });
        }
        async post(url, options = {}) {
          const mergedHeaders = { ...this.headers._data, ...options && options.headers || {} };
          return requestsModule.post(url, { ...options, headers: mergedHeaders });
        }
        __enter__() {
          return this;
        }
        __exit__() {
          return null;
        }
      }
      const requestsModule = {
        Session: () => new Session(),
        RequestException,
        HTTPAdapter,
        get: async (url, options = {}) => {
          const startTime = performance.now();
          let reqUrl = String(url);
          if (options && options.params && typeof options.params === "object") {
            const query = new URLSearchParams(options.params).toString();
            reqUrl += (reqUrl.includes("?") ? "&" : "?") + query;
          }
          const fetchOpts = {
            method: "GET",
            headers: options && options.headers || {}
          };
          const res = await fetch(reqUrl, fetchOpts);
          const elapsed = (performance.now() - startTime).toFixed(1);
          if (this.onTelemetry) this.onTelemetry("NETWORK", `HTTP GET ${reqUrl} -> ${res.status} ${res.statusText || "OK"} (${elapsed}ms)`);
          return createResponseObj(res, startTime);
        },
        post: async (url, options = {}) => {
          const startTime = performance.now();
          let reqUrl = String(url);
          if (options && options.params && typeof options.params === "object") {
            const query = new URLSearchParams(options.params).toString();
            reqUrl += (reqUrl.includes("?") ? "&" : "?") + query;
          }
          const fetchOpts = {
            method: "POST",
            headers: { ...options && options.headers || {} }
          };
          if (options && options.json !== void 0) {
            fetchOpts.body = JSON.stringify(options.json);
            fetchOpts.headers["Content-Type"] = "application/json";
          } else if (options && options.data !== void 0) {
            fetchOpts.body = typeof options.data === "string" ? options.data : JSON.stringify(options.data);
          }
          const res = await fetch(reqUrl, fetchOpts);
          const elapsed = (performance.now() - startTime).toFixed(1);
          if (this.onTelemetry) this.onTelemetry("NETWORK", `HTTP POST ${reqUrl} -> ${res.status} ${res.statusText || "OK"} (${elapsed}ms)`);
          return createResponseObj(res, startTime);
        },
        put: async (url, options = {}) => {
          const startTime = performance.now();
          const fetchOpts = {
            method: "PUT",
            headers: { ...options && options.headers || {} }
          };
          if (options && options.json !== void 0) {
            fetchOpts.body = JSON.stringify(options.json);
            fetchOpts.headers["Content-Type"] = "application/json";
          } else if (options && options.data !== void 0) {
            fetchOpts.body = String(options.data);
          }
          const res = await fetch(url, fetchOpts);
          const elapsed = (performance.now() - startTime).toFixed(1);
          if (this.onTelemetry) this.onTelemetry("NETWORK", `HTTP PUT ${url} -> ${res.status} (${elapsed}ms)`);
          return createResponseObj(res, startTime);
        },
        delete: async (url, options = {}) => {
          const startTime = performance.now();
          const res = await fetch(url, { method: "DELETE", headers: options && options.headers || {} });
          const elapsed = (performance.now() - startTime).toFixed(1);
          if (this.onTelemetry) this.onTelemetry("NETWORK", `HTTP DELETE ${url} -> ${res.status} (${elapsed}ms)`);
          return createResponseObj(res, startTime);
        }
      };
      this.hostBridges.set("requests", requestsModule);
      this.hostBridges.set("requests.adapters", { HTTPAdapter });
      this.hostBridges.set("requests.exceptions", { RequestException });
      this.hostBridges.set("urllib3.util", { Retry });
      this.hostBridges.set("urllib3", { util: { Retry } });
      const webbrowserModule = {
        open: (url, newWindow = 0, autoraise = true) => {
          const urlStr = String(url || "");
          if (typeof window !== "undefined" && typeof window.open === "function") {
            try {
              window.open(urlStr, "_blank");
            } catch (e) {
              console.warn("[webbrowser] Popup blocked or failed:", e);
            }
          }
          if (this.onTelemetry) this.onTelemetry("BROWSER", `Opened URL in browser: ${urlStr}`);
          return true;
        },
        open_new: (url) => webbrowserModule.open(url, 1),
        open_new_tab: (url) => webbrowserModule.open(url, 2),
        get: () => ({ open: webbrowserModule.open })
      };
      this.hostBridges.set("webbrowser", webbrowserModule);
      function calcMd5(str) {
        let bytes;
        if (typeof str === "string") {
          bytes = new TextEncoder().encode(str);
        } else if (Array.isArray(str) || typeof Uint8Array !== "undefined" && str instanceof Uint8Array) {
          bytes = str;
        } else {
          bytes = new TextEncoder().encode(String(str || ""));
        }
        function toHex(n) {
          let s = "";
          for (let i = 0; i < 4; i++) {
            s += (n >> i * 8 & 255).toString(16).padStart(2, "0");
          }
          return s;
        }
        const bitLen = bytes.length * 8;
        const newLen = (bytes.length + 8 >> 6) + 1 << 6;
        const words = new Uint32Array(newLen >> 2);
        for (let i = 0; i < bytes.length; i++) {
          words[i >> 2] |= bytes[i] << i % 4 * 8;
        }
        words[bytes.length >> 2] |= 128 << bytes.length % 4 * 8;
        words[(newLen >> 2) - 2] = bitLen & 4294967295;
        words[(newLen >> 2) - 1] = Math.floor(bitLen / 4294967296);
        let a = 1732584193;
        let b = 4023233417;
        let c = 2562383102;
        let d = 271733878;
        const K = [
          3614090360,
          3905402710,
          606105819,
          3250441966,
          4118548399,
          1200080426,
          2821735955,
          4249261313,
          1770035416,
          2336552879,
          4294925233,
          2304563134,
          1804603682,
          4254626195,
          2792965006,
          1236535329,
          4129170786,
          3225465664,
          643717713,
          3921069994,
          3593408605,
          38016083,
          3634488961,
          3889429448,
          568446438,
          3275163606,
          4107603335,
          1163531501,
          2850285829,
          4243563512,
          1735328473,
          2368359562,
          4294588738,
          2272392833,
          1839030562,
          4259657740,
          2763975236,
          1272893353,
          4139469664,
          3200236656,
          681279174,
          3936430074,
          3572445317,
          76029189,
          3654602809,
          3873151461,
          530742520,
          3299628645,
          4096336452,
          1126891415,
          2878612391,
          4237533241,
          1700485571,
          2399980690,
          4293915773,
          2240044497,
          1873313359,
          4264355552,
          2734768916,
          1309151649,
          4149444226,
          3174756917,
          718787259,
          3951481745
        ];
        const S = [
          7,
          12,
          17,
          22,
          7,
          12,
          17,
          22,
          7,
          12,
          17,
          22,
          7,
          12,
          17,
          22,
          5,
          9,
          14,
          20,
          5,
          9,
          14,
          20,
          5,
          9,
          14,
          20,
          5,
          9,
          14,
          20,
          4,
          11,
          16,
          23,
          4,
          11,
          16,
          23,
          4,
          11,
          16,
          23,
          4,
          11,
          16,
          23,
          6,
          10,
          15,
          21,
          6,
          10,
          15,
          21,
          6,
          10,
          15,
          21,
          6,
          10,
          15,
          21
        ];
        for (let i = 0; i < words.length; i += 16) {
          let AA = a, BB = b, CC = c, DD = d;
          for (let j = 0; j < 64; j++) {
            let F, g;
            if (j < 16) {
              F = b & c | ~b & d;
              g = j;
            } else if (j < 32) {
              F = d & b | ~d & c;
              g = (5 * j + 1) % 16;
            } else if (j < 48) {
              F = b ^ c ^ d;
              g = (3 * j + 5) % 16;
            } else {
              F = c ^ (b | ~d);
              g = 7 * j % 16;
            }
            F = F + a + K[j] + words[i + g] | 0;
            a = d;
            d = c;
            c = b;
            b = b + (F << S[j] | F >>> 32 - S[j]) | 0;
          }
          a = a + AA | 0;
          b = b + BB | 0;
          c = c + CC | 0;
          d = d + DD | 0;
        }
        return toHex(a) + toHex(b) + toHex(c) + toHex(d);
      }
      function createHashInstance(algo) {
        let dataBuffer = "";
        return {
          update: (chunk) => {
            dataBuffer += typeof chunk === "string" ? chunk : Array.isArray(chunk) ? String.fromCharCode(...chunk) : String(chunk || "");
          },
          hexdigest: () => {
            return calcMd5(dataBuffer);
          },
          digest: () => {
            const hex = calcMd5(dataBuffer);
            const out = [];
            for (let i = 0; i < hex.length; i += 2) {
              out.push(parseInt(hex.slice(i, i + 2), 16));
            }
            return out;
          }
        };
      }
      const hashlibModule = {
        md5: (data = "", opts = {}) => {
          const inst = createHashInstance("md5");
          if (data) inst.update(data);
          return inst;
        },
        sha1: (data = "", opts = {}) => {
          const inst = createHashInstance("sha1");
          if (data) inst.update(data);
          return inst;
        },
        sha256: (data = "", opts = {}) => {
          const inst = createHashInstance("sha256");
          if (data) inst.update(data);
          return inst;
        }
      };
      this.hostBridges.set("hashlib", hashlibModule);
      const osPath = {
        abspath: (p) => {
          const str = String(p || "");
          return str.startsWith("/") ? str : "/" + str;
        },
        join: (...parts) => parts.map(String).join("/").replace(/\/+/g, "/"),
        basename: (p) => String(p || "").split("/").pop(),
        dirname: (p) => {
          const parts = String(p || "").split("/");
          parts.pop();
          return parts.join("/") || "/";
        },
        exists: (p) => this.vfs.exists(String(p)),
        isdir: (p) => this.vfs.isDirectory(String(p)),
        isfile: (p) => this.vfs.isFile(String(p)),
        islink: (p) => false,
        getsize: (p) => this.vfs.stat(String(p)).size,
        split: (p) => {
          const str = String(p || "");
          const idx = str.lastIndexOf("/");
          if (idx === -1) return ["", str];
          return [str.slice(0, idx) || "/", str.slice(idx + 1)];
        },
        splitext: (p) => {
          const str = String(p || "");
          const lastSlash = str.lastIndexOf("/");
          const lastDot = str.lastIndexOf(".");
          if (lastDot > lastSlash) {
            return [str.slice(0, lastDot), str.slice(lastDot)];
          }
          return [str, ""];
        }
      };
      this.hostBridges.set("os", {
        name: "posix",
        environ: {},
        sep: "/",
        path: osPath,
        listdir: (dir = ".") => this.vfs.readdir(String(dir)),
        mkdir: (dir) => this.vfs.mkdir(String(dir)),
        makedirs: (dir) => this.vfs.mkdir(String(dir)),
        remove: (file) => this.vfs.unlink(String(file)),
        unlink: (file) => this.vfs.unlink(String(file)),
        rmdir: (dir) => this.vfs.rmdir(String(dir)),
        stat: (target) => this.vfs.stat(String(target)),
        getcwd: () => "/workspace",
        system: (cmd) => {
          const cmdStr = String(cmd || "").trim().toLowerCase();
          const vm = VirtualMachine.activeVM;
          if (["clear", "cls"].includes(cmdStr)) {
            if (vm && vm.clearConsole) {
              vm.clearConsole();
            }
            return 0;
          }
          return 0;
        }
      });
      this.hostBridges.set("os.path", osPath);
      class ShutilError extends Error {
        constructor(msg) {
          super(msg);
          this.name = "shutil.Error";
        }
      }
      class SameFileError extends ShutilError {
        constructor(msg) {
          super(msg);
          this.name = "shutil.SameFileError";
        }
      }
      this.hostBridges.set("shutil", {
        rmtree: (path, ignore_errors = false, onerror = null) => {
          try {
            return this.vfs.rmtree(String(path));
          } catch (err) {
            if (ignore_errors) return false;
            if (typeof onerror === "function") {
              try {
                onerror(this.vfs.rmtree, path, [err]);
                return false;
              } catch (e) {
              }
            }
            throw err;
          }
        },
        copy: (src, dst) => this.vfs.copyFile(String(src), String(dst)),
        copy2: (src, dst) => this.vfs.copyFile(String(src), String(dst)),
        copyfile: (src, dst) => this.vfs.copyFile(String(src), String(dst)),
        copytree: (src, dst) => this.vfs.copyTree(String(src), String(dst)),
        move: (src, dst) => this.vfs.move(String(src), String(dst)),
        which: (cmd) => null,
        disk_usage: (path) => [107374182400, 5368709120, 102005473280],
        Error: ShutilError,
        SameFileError
      });
      this.hostBridges.set("sys", {
        version: "3.12.0 (main, UVM)",
        version_info: [3, 12, 0, "final", 0],
        platform: "browser",
        argv: ["uvm"],
        maxsize: Number.MAX_SAFE_INTEGER,
        intern: (s) => String(s),
        exit: (code = 0) => {
          const err = new Error(`SystemExit: ${code}`);
          err.name = "SystemExit";
          throw err;
        },
        modules: {},
        stdout: {
          write: (s) => {
            const vm = VirtualMachine.activeVM;
            if (vm && vm.write) {
              vm.write(s);
            } else if (typeof console !== "undefined") {
              console.log(s);
            }
            return s !== null && s !== void 0 ? String(s).length : 0;
          },
          flush: () => {
          }
        },
        stderr: {
          write: (s) => {
            const vm = VirtualMachine.activeVM;
            if (vm && vm.write) {
              vm.write(s);
            } else if (typeof console !== "undefined") {
              console.error(s);
            }
            return s !== null && s !== void 0 ? String(s).length : 0;
          },
          flush: () => {
          }
        }
      });
      class DateObj {
        constructor(year, month, day) {
          this.year = year;
          this.month = month;
          this.day = day;
          this._d = new Date(year, month - 1, day);
          this.strftime = this.strftime.bind(this);
          this.weekday = this.weekday.bind(this);
          this.isoweekday = this.isoweekday.bind(this);
          this.toordinal = this.toordinal.bind(this);
        }
        weekday() {
          const jsDay = this._d.getDay();
          return (jsDay + 6) % 7;
        }
        isoweekday() {
          return this.weekday() + 1;
        }
        toordinal() {
          const y = this.year;
          const m = this.month;
          const d = this.day;
          const daysBeforeMonth = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
          const isLeap = y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0);
          let ord = (y - 1) * 365 + Math.floor((y - 1) / 4) - Math.floor((y - 1) / 100) + Math.floor((y - 1) / 400);
          ord += daysBeforeMonth[m - 1] + d;
          if (m > 2 && isLeap) ord += 1;
          return ord;
        }
        strftime(fmt) {
          const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
          const monthAbbrs = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
          const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
          const dayAbbrs = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
          const wd = this.weekday();
          const mIdx = this.month - 1;
          return fmt.replace(/%B/g, monthNames[mIdx] || "").replace(/%b/g, monthAbbrs[mIdx] || "").replace(/%A/g, dayNames[wd] || "").replace(/%a/g, dayAbbrs[wd] || "").replace(/%Y/g, String(this.year)).replace(/%m/g, String(this.month).padStart(2, "0")).replace(/%d/g, String(this.day).padStart(2, "0"));
        }
        __repr__() {
          return `datetime.date(${this.year}, ${this.month}, ${this.day})`;
        }
        toString() {
          return `${this.year}-${String(this.month).padStart(2, "0")}-${String(this.day).padStart(2, "0")}`;
        }
      }
      class TimeDeltaObj {
        constructor(days = 0, seconds = 0, microseconds = 0) {
          this.days = days;
          this.seconds = seconds;
          this.microseconds = microseconds;
        }
        total_seconds() {
          return this.days * 86400 + this.seconds + this.microseconds / 1e6;
        }
      }
      const datetimeModule = {
        MINYEAR: 1,
        MAXYEAR: 9999,
        date: (y, m, d) => new DateObj(y, m, d),
        timedelta: (d, s, us) => new TimeDeltaObj(d, s, us),
        datetime: {
          now: () => {
            const now = /* @__PURE__ */ new Date();
            return new DateObj(now.getFullYear(), now.getMonth() + 1, now.getDate());
          }
        }
      };
      datetimeModule.date.today = () => {
        const now = /* @__PURE__ */ new Date();
        return new DateObj(now.getFullYear(), now.getMonth() + 1, now.getDate());
      };
      this.hostBridges.set("datetime", datetimeModule);
      this.hostBridges.set("locale", {
        LC_ALL: 0,
        LC_COLLATE: 1,
        LC_CTYPE: 2,
        LC_MONETARY: 3,
        LC_NUMERIC: 4,
        LC_TIME: 5,
        Error,
        getlocale: () => ["en_US", "UTF-8"],
        setlocale: (cat, loc = null) => "C",
        normalize: (loc) => loc || "en_US.UTF-8",
        nl_langinfo: (key) => ""
      });
      const global_enum = (cls) => cls;
      function Enum(val) {
        return Object(val !== void 0 ? val : 0);
      }
      function IntEnum(val) {
        return Object(val !== void 0 ? val : 0);
      }
      this.hostBridges.set("enum", {
        Enum,
        IntEnum,
        global_enum
      });
      this.hostBridges.set("warnings", {
        warn: (msg, category = null, stacklevel = 1) => {
          if (this.onTelemetry) this.onTelemetry("WARNING", String(msg));
        },
        filterwarnings: () => {
        },
        simplefilter: () => {
        },
        DeprecationWarning: class DeprecationWarning extends Error {
        }
      });
      this.hostBridges.set("itertools", {
        count: (start = 0, step = 1) => {
          let n = start;
          return {
            [Symbol.iterator]: function* () {
              while (true) {
                yield n;
                n += step;
              }
            }
          };
        },
        cycle: (iterable) => {
          const items = Array.from(iterable || []);
          return {
            [Symbol.iterator]: function* () {
              if (items.length === 0) return;
              while (true) {
                for (const it of items) yield it;
              }
            }
          };
        },
        repeat: (object, times = null) => {
          if (times === null || times === void 0) {
            return {
              [Symbol.iterator]: function* () {
                while (true) yield object;
              }
            };
          }
          const res = [];
          for (let i = 0; i < times; i++) res.push(object);
          return res;
        },
        chain: (...iterables) => {
          const res = [];
          for (const it of iterables) res.push(...Array.from(it || []));
          return res;
        },
        accumulate: (iterable, func = null) => {
          const items = Array.from(iterable || []);
          const res = [];
          let acc = void 0;
          for (const it of items) {
            if (acc === void 0) {
              acc = it;
            } else {
              acc = func ? func(acc, it) : acc + it;
            }
            res.push(acc);
          }
          return res;
        }
      });
      const operatorModule = {
        add: (a, b) => a + b,
        sub: (a, b) => a - b,
        mul: (a, b) => a * b,
        truediv: (a, b) => a / b,
        floordiv: (a, b) => Math.floor(a / b),
        mod: (a, b) => a % b,
        pow: (a, b) => Math.pow(a, b),
        neg: (a) => -a,
        pos: (a) => +a,
        not_: (a) => !a,
        eq: (a, b) => a === b,
        ne: (a, b) => a !== b,
        lt: (a, b) => a < b,
        le: (a, b) => a <= b,
        gt: (a, b) => a > b,
        ge: (a, b) => a >= b,
        getitem: (a, b) => a[b],
        setitem: (a, b, c) => {
          a[b] = c;
        },
        delitem: (a, b) => {
          if (Array.isArray(a)) a.splice(b, 1);
          else delete a[b];
        },
        contains: (a, b) => Array.isArray(a) || typeof a === "string" ? a.includes(b) : b in a,
        indexOf: (a, b) => a.indexOf(b),
        countOf: (a, b) => {
          let count = 0;
          for (const x of a) if (x === b) count++;
          return count;
        },
        itemgetter: (...items) => (obj) => items.length === 1 ? obj[items[0]] : items.map((k) => obj[k]),
        attrgetter: (...attrs) => (obj) => attrs.length === 1 ? obj[attrs[0]] : attrs.map((k) => obj[k])
      };
      this.hostBridges.set("_operator", operatorModule);
      this.hostBridges.set("_bisect", {});
      this.hostBridges.set("_heapq", {});
      this.hostBridges.set("_stat", {});
      this.hostBridges.set("_string", {});
      this.hostBridges.set("_abc", {
        get_cache_token: () => 0,
        _abc_init: (self) => {
        },
        _abc_register: (self, subclass) => {
        },
        _abc_instancecheck: (self, instance) => false,
        _abc_subclasscheck: (self, subclass) => false
      });
      this.hostBridges.set("abc", {
        get_cache_token: () => 0,
        ABC: class ABC {
        },
        ABCMeta: class ABCMeta {
        },
        abstractmethod: (func) => func
      });
      this.hostBridges.set("reprlib", {
        recursive_repr: (fillvalue = "...") => (fn) => fn
      });
      class DummyLock {
        acquire() {
          return true;
        }
        release() {
        }
        __enter__() {
          return this;
        }
        __exit__() {
        }
      }
      this.hostBridges.set("_thread", {
        RLock: () => new DummyLock(),
        allocate_lock: () => new DummyLock(),
        get_ident: () => 1
      });
      this.hostBridges.set("types", {
        GenericAlias: class GenericAlias {
        },
        UnionType: class UnionType {
        },
        MethodType: (fn, obj) => fn.bind ? fn.bind(obj) : fn,
        FunctionType: Function
      });
      class ChainMap {
        constructor(...maps) {
          this.maps = maps.length ? maps : [{}];
        }
        get(k, def = null) {
          for (const m of this.maps) {
            if (m && k in m) return m[k];
          }
          return def;
        }
        __getitem__(k) {
          for (const m of this.maps) {
            if (m && k in m) return m[k];
          }
          throw new Error(`KeyError: '${k}'`);
        }
      }
      this.hostBridges.set("collections", {
        ChainMap,
        namedtuple: (typename, fieldNames) => {
          const fields = Array.isArray(fieldNames) ? fieldNames : typeof fieldNames === "string" ? fieldNames.replace(/,/g, " ").trim().split(/\s+/) : [];
          class NamedTuple extends Array {
            constructor(...args) {
              super(...args);
              for (let i = 0; i < fields.length; i++) {
                this[fields[i]] = args[i];
              }
            }
          }
          return (...args) => new NamedTuple(...args);
        },
        defaultdict: class defaultdict {
          constructor(defaultFactory = null) {
            this.defaultFactory = defaultFactory;
            this._data = {};
          }
        },
        deque: class deque extends Array {
        },
        Counter: class Counter extends Map {
        },
        OrderedDict: class OrderedDict extends Map {
        }
      });
      this.hostBridges.set("builtins", {
        abs: Math.abs,
        min: Math.min,
        max: Math.max,
        sum: (arr, start = 0) => Array.from(arr || []).reduce((a, b) => a + b, start),
        len: (x) => x ? x.length !== void 0 ? x.length : x.size !== void 0 ? x.size : Object.keys(x).length : 0,
        range: (start, stop, step = 1) => {
          if (stop === void 0) {
            stop = start;
            start = 0;
          }
          const res = [];
          for (let i = start; step > 0 ? i < stop : i > stop; i += step) res.push(i);
          return res;
        },
        enumerate: (iter, start = 0) => Array.from(iter || []).map((v, i) => [i + start, v]),
        zip: (...iters) => {
          const minLen = Math.min(...iters.map((it) => it ? it.length || 0 : 0));
          const res = [];
          for (let i = 0; i < minLen; i++) res.push(iters.map((it) => it[i]));
          return res;
        },
        repr: (x) => JSON.stringify(x),
        str: (x) => String(x),
        int: (x) => parseInt(x, 10),
        float: (x) => parseFloat(x),
        bool: (x) => Boolean(x),
        list: (x) => x ? Array.from(x) : [],
        dict: (entries) => entries ? Object.fromEntries(entries) : {},
        set: (x) => new Set(x || []),
        tuple: (x) => x ? Array.from(x) : [],
        any: (iter) => Array.from(iter || []).some(Boolean),
        all: (iter) => Array.from(iter || []).every(Boolean),
        callable: (x) => typeof x === "function" || x && (x.entryPC !== void 0 || typeof x.__call__ === "function"),
        hasattr: (obj, attr) => obj != null && attr in obj,
        getattr: (obj, attr, def) => obj != null && attr in obj ? obj[attr] : def,
        setattr: (obj, attr, val) => {
          if (obj != null) obj[attr] = val;
        },
        delattr: (obj, attr) => {
          if (obj != null) delete obj[attr];
        },
        Exception: Error,
        ValueError: Error,
        TypeError,
        KeyError: Error,
        IndexError: RangeError,
        AttributeError: Error,
        ImportError: Error
      });
      this.hostBridges.set("__future__", {
        nested_scopes: null,
        generators: null,
        division: null,
        absolute_import: null,
        with_statement: null,
        print_function: null,
        unicode_literals: null,
        barry_as_FLUFL: null,
        generator_stop: null,
        annotations: null
      });
    }
    /**
     * Checks if a module is locally available in cache, host bridges, or VFS.
     */
    hasModule(name) {
      if (this.cache.has(name) || this.hostBridges.has(name)) return true;
      const subPath = name.replace(/\./g, "/");
      const pyCandidates = [
        `/lib/python3/${subPath}.py`,
        `/site-packages/${subPath}.py`,
        `/${subPath}.py`,
        `/lib/python3/${subPath}/__init__.py`,
        `/site-packages/${subPath}/__init__.py`,
        `/lib/python3/${name}.py`,
        `/site-packages/${name}.py`,
        `/${name}.py`
      ];
      for (const p of pyCandidates) {
        if (this.vfs.exists(p)) return true;
      }
      const cCandidates = [
        `/lib/c/${subPath}.c`,
        `/lib/c/_${subPath}.c`,
        `/${subPath}.c`,
        `/lib/c/${name}.c`,
        `/lib/c/_${name}.c`,
        `/${name}.c`
      ];
      for (const p of cCandidates) {
        if (this.vfs.exists(p)) return true;
      }
      return false;
    }
    clearCache() {
      this.cache.clear();
    }
    /**
     * Dynamically fetches a standard library module from CPython GitHub and caches it in VFS.
     */
    async fetchAndCacheModule(name, callingVm = null) {
      if (this.hasModule(name)) {
        return callingVm ? this.getOrLoad(name, callingVm) : null;
      }
      if (typeof fetch === "undefined") {
        throw new Error(`ImportError: Cannot dynamically fetch '${name}': fetch() API is unavailable`);
      }
      const cpythonUrl = `https://raw.githubusercontent.com/python/cpython/3.12/Lib/${name}.py`;
      try {
        const resp = await fetch(cpythonUrl);
        if (resp.ok) {
          const source = await resp.text();
          const vfsPath = `/lib/python3/${name}.py`;
          this.vfs.writeFile(vfsPath, source);
          return callingVm ? this.getOrLoad(name, callingVm) : null;
        }
      } catch (err) {
      }
      const communityUrls = {
        cowsay: "https://raw.githubusercontent.com/jcn/cowsay-py/master/cowsay.py",
        pyfiglet: "https://raw.githubusercontent.com/pwaller/pyfiglet/master/pyfiglet/__init__.py",
        six: "https://raw.githubusercontent.com/benjaminp/six/master/six.py"
      };
      if (communityUrls[name]) {
        try {
          const resp = await fetch(communityUrls[name]);
          if (resp.ok) {
            let source = await resp.text();
            if (name === "cowsay" && !source.includes("def cow(") && source.includes("def cowsay(")) {
              source += "\ncow = cowsay\n";
            }
            const vfsPath = `/lib/python3/${name}.py`;
            this.vfs.writeFile(vfsPath, source);
            if (name === "cowsay" && !this.hasModule("textwrap")) {
              await this.fetchAndCacheModule("textwrap", callingVm);
            }
            return callingVm ? this.getOrLoad(name, callingVm) : null;
          }
        } catch (err) {
        }
      }
      throw new Error(`ImportError: No module named '${name}' (not found in local VFS or official CPython stdlib)`);
    }
    /**
     * Resolves, compiles, and caches modules across all three tiers.
     * @param {string} name - Module name
     * @param {VirtualMachine} callingVm - VM instance requesting the import
     * @returns {object} Module namespace dictionary
     */
    getOrLoad(name, callingVm = null) {
      if (this.cache.has(name)) {
        return this.cache.get(name);
      }
      if (this.hostBridges.has(name)) {
        const bridge = this.hostBridges.get(name);
        if (bridge && typeof bridge === "object" && !bridge.__is_module__) {
          bridge.__is_module__ = true;
          bridge.__name__ = name;
        }
        this.cache.set(name, bridge);
        return bridge;
      }
      const subPath = name.replace(/\./g, "/");
      const pyCandidates = [
        `/lib/python3/${subPath}.py`,
        `/site-packages/${subPath}.py`,
        `/${subPath}.py`,
        `/lib/python3/${subPath}/__init__.py`,
        `/site-packages/${subPath}/__init__.py`,
        `/lib/python3/${name}.py`,
        `/site-packages/${name}.py`,
        `/${name}.py`
      ];
      for (const path of pyCandidates) {
        if (this.vfs.exists(path)) {
          const source = this.vfs.readFile(path);
          const ast = parsePythonSource(source);
          const compiler = new BytecodeCompiler();
          const program = compiler.compile(ast);
          const parentVm = callingVm || VirtualMachine.activeVM;
          const modVm = new VirtualMachine({
            onPrint: parentVm && parentVm.onPrint ? (msg) => parentVm.log(msg) : null
          });
          if (parentVm && parentVm.write) {
            modVm.write = (s) => parentVm.write(s);
          }
          modVm.moduleManager = this;
          modVm.globals.set("__name__", name);
          const iter = modVm.execute(program);
          while (!iter.next().done) {
          }
          const moduleExports = { __is_module__: true, __name__: name };
          for (const [k, v] of modVm.globals.entries()) {
            if (v && typeof v === "object" && (v.entryPC !== void 0 || v.__is_bound__)) {
              moduleExports[k] = createPythonModuleCallable(v, modVm);
            } else {
              moduleExports[k] = v;
            }
          }
          this.cache.set(name, moduleExports);
          return moduleExports;
        }
      }
      const cCandidates = [
        `/lib/c/${subPath}.c`,
        `/lib/c/_${subPath}.c`,
        `/${subPath}.c`,
        `/lib/c/${name}.c`,
        `/lib/c/_${name}.c`,
        `/${name}.c`
      ];
      for (const path of cCandidates) {
        if (this.vfs.exists(path)) {
          const cSource = this.vfs.readFile(path);
          const cExports = loadCExtension(cSource);
          if (cExports && typeof cExports === "object" && !cExports.__is_module__) {
            cExports.__is_module__ = true;
            cExports.__name__ = name;
          }
          this.cache.set(name, cExports);
          return cExports;
        }
      }
      const impErr = new Error(`ImportError: No module named '${name}'`);
      impErr.name = "ImportError";
      throw impErr;
    }
  };
  var moduleManager = new ModuleManager();
  VirtualMachine.defaultModuleManager = moduleManager;

  // js/vm/scheduler.js
  var queueNextFrame = typeof requestAnimationFrame !== "undefined" ? requestAnimationFrame : (cb) => setTimeout(cb, 16);
  var Scheduler = class {
    constructor(interpreter = null) {
      this.interpreter = interpreter;
      this.fibers = [];
      this.nextFiberId = 1;
      this.macroTasks = [];
      this.microTasks = [];
      this.isRunning = false;
      this.stopRequested = false;
      this.onComplete = null;
      this.onError = null;
      this.onInputRequired = null;
      this.onConsoleSync = null;
      this.rootError = null;
    }
    spawn(generator, parent = null) {
      const fiber = {
        id: this.nextFiberId++,
        generator,
        status: "ready",
        // "ready", "running", "sleeping", "suspended_for_input", "suspended_on_join", "completed", "failed"
        wakeTime: 0,
        parent,
        currentStep: null,
        error: null,
        result: null,
        joiners: []
      };
      this.fibers.push(fiber);
      return fiber;
    }
    queueMacroTask(callback, args = [], delay = 0) {
      this.macroTasks.push({
        callback,
        args,
        time: performance.now() + delay
      });
    }
    queueMicroTask(callback) {
      this.microTasks.push(callback);
    }
    pause() {
      this.isPaused = true;
    }
    resume() {
      if (this.isPaused) {
        this.isPaused = false;
        this.loop();
      }
    }
    stop() {
      this.stopRequested = true;
      this.isRunning = false;
      this.isPaused = false;
      this.rootError = null;
      this.fibers = [];
      this.macroTasks = [];
      this.microTasks = [];
    }
    run(onComplete, onError) {
      this.onComplete = onComplete;
      this.onError = onError;
      this.isRunning = true;
      this.isPaused = false;
      this.stopRequested = false;
      this.rootError = null;
      this.loop();
    }
    loop() {
      if (!this.isRunning || this.stopRequested || this.isPaused) return;
      try {
        const sliceStart = performance.now();
        while (this.microTasks.length > 0 && performance.now() - sliceStart < 16) {
          const task = this.microTasks.shift();
          task();
        }
        let hasActiveFibers = true;
        while (hasActiveFibers && performance.now() - sliceStart < 16) {
          let activeFibers = this.fibers.filter(
            (f) => f.status === "ready" || f.status === "running" || f.status === "sleeping" && performance.now() >= f.wakeTime
          );
          if (activeFibers.length === 0) {
            hasActiveFibers = false;
            break;
          }
          for (let fiber of activeFibers) {
            if (performance.now() - sliceStart >= 16) break;
            if (fiber.status === "sleeping") {
              fiber.status = "ready";
            }
            fiber.status = "running";
            try {
              let step = fiber.currentStep;
              fiber.currentStep = null;
              if (!step) {
                step = fiber.generator.next();
              }
              if (step.done) {
                fiber.status = "completed";
                fiber.result = step.value;
                this.resolveFiber(fiber);
              } else {
                const cmd = step.value;
                if (cmd && typeof cmd === "object") {
                  if (cmd.type === "SUSPEND_FOR_INPUT") {
                    fiber.status = "suspended_for_input";
                    fiber.currentStep = step;
                    if (this.onInputRequired) {
                      this.onInputRequired(cmd.prompt, (userInput) => {
                        fiber.status = "ready";
                        fiber.currentStep = fiber.generator.next(userInput);
                        setTimeout(() => this.loop(), 0);
                      });
                    }
                    break;
                  } else if (cmd.type === "ASYNC_PROMISE") {
                    fiber.status = "suspended_for_async";
                    cmd.promise.then((resolvedVal) => {
                      fiber.status = "ready";
                      fiber.currentStep = fiber.generator.next(resolvedVal);
                      setTimeout(() => this.loop(), 0);
                    }).catch((err) => {
                      fiber.status = "ready";
                      fiber.currentStep = fiber.generator.throw(err);
                      setTimeout(() => this.loop(), 0);
                    });
                    break;
                  } else if (cmd.type === "ASYNC_IMPORT") {
                    fiber.status = "suspended_for_async";
                    const callerVm = cmd.vm || fiber.vm || this.interpreter && this.interpreter.vm || null;
                    const mm = callerVm && callerVm.moduleManager || this.interpreter && this.interpreter.moduleManager || null;
                    if (!mm || typeof mm.fetchAndCacheModule !== "function") {
                      fiber.status = "ready";
                      fiber.currentStep = fiber.generator.throw(
                        new Error(
                          `ImportError: Dynamic module fetcher unavailable for '${cmd.moduleName}'`
                        )
                      );
                      break;
                    }
                    mm.fetchAndCacheModule(cmd.moduleName, callerVm).then((mod) => {
                      fiber.status = "ready";
                      fiber.currentStep = fiber.generator.next(mod);
                      setTimeout(() => this.loop(), 0);
                    }).catch((err) => {
                      fiber.status = "ready";
                      fiber.currentStep = fiber.generator.throw(err);
                      setTimeout(() => this.loop(), 0);
                    });
                    break;
                  } else if (cmd.type === "SLEEP") {
                    fiber.status = "sleeping";
                    fiber.wakeTime = performance.now() + cmd.duration;
                  } else if (cmd.type === "SPAWN") {
                    const newFiber = this.spawn(cmd.generator, fiber);
                    fiber.currentStep = fiber.generator.next(newFiber);
                    fiber.status = "ready";
                  } else if (cmd.type === "JOIN") {
                    const target = cmd.target;
                    if (target.status === "completed" || target.status === "failed") {
                      if (target.status === "failed") {
                        fiber.currentStep = fiber.generator.throw(target.error);
                      } else {
                        fiber.currentStep = fiber.generator.next(target.result);
                      }
                      fiber.status = "ready";
                    } else {
                      fiber.status = "suspended_on_join";
                      target.joiners.push(fiber);
                    }
                  } else if (cmd.type === "YIELD") {
                    fiber.status = "ready";
                  } else {
                    fiber.currentStep = fiber.generator.next(cmd);
                    fiber.status = "ready";
                  }
                } else {
                  fiber.currentStep = fiber.generator.next(cmd);
                  fiber.status = "ready";
                }
              }
            } catch (err) {
              fiber.status = "failed";
              fiber.error = err;
              this.rejectFiber(fiber, err);
            }
          }
        }
        if (this.onConsoleSync) {
          this.onConsoleSync();
        }
        this.fibers = this.fibers.filter(
          (f) => f.status !== "completed" && f.status !== "failed"
        );
        const ongoingFibers = this.fibers.length > 0;
        if (!ongoingFibers) {
          const now = performance.now();
          const dueTasks = this.macroTasks.filter((t) => t.time <= now);
          if (dueTasks.length > 0) {
            this.macroTasks = this.macroTasks.filter((t) => t.time > now);
            for (let task of dueTasks) {
              const fiberGen = task.callback(...task.args);
              if (fiberGen && typeof fiberGen.next === "function") {
                this.spawn(fiberGen);
              }
            }
            queueNextFrame(() => this.loop());
            return;
          }
        }
        if (this.fibers.length > 0 || this.microTasks.length > 0) {
          queueNextFrame(() => this.loop());
        } else if (this.macroTasks.length > 0) {
          const nextTask = this.macroTasks.reduce(
            (min, t) => t.time < min.time ? t : min,
            this.macroTasks[0]
          );
          const delay = Math.max(0, nextTask.time - performance.now());
          setTimeout(() => this.loop(), delay);
        } else {
          this.isRunning = false;
          if (this.rootError) {
            const err = this.rootError;
            this.rootError = null;
            if (this.onError) {
              this.onError(err);
              return;
            }
          }
          if (this.onComplete) {
            this.onComplete();
          }
        }
      } catch (err) {
        this.isRunning = false;
        if (this.onError) {
          this.onError(err);
        }
      }
    }
    resolveFiber(fiber) {
      for (let joiner of fiber.joiners) {
        joiner.status = "ready";
        joiner.currentStep = joiner.generator.next(fiber.result);
      }
      fiber.joiners = [];
    }
    rejectFiber(fiber, err) {
      let handled = false;
      for (let joiner of fiber.joiners) {
        joiner.status = "ready";
        try {
          joiner.currentStep = joiner.generator.throw(err);
          handled = true;
        } catch (innerErr) {
          this.rejectFiber(joiner, innerErr);
          handled = true;
        }
      }
      fiber.joiners = [];
      if (fiber.parent && (fiber.parent.status === "suspended_on_join" || fiber.parent.status === "running" || fiber.parent.status === "ready")) {
        fiber.parent.status = "ready";
        try {
          fiber.parent.currentStep = fiber.parent.generator.throw(err);
          handled = true;
        } catch (innerErr) {
          this.rejectFiber(fiber.parent, innerErr);
          handled = true;
        }
      }
      if (!handled) {
        if (fiber.id === 1 || !fiber.parent) {
          this.rootError = err;
        }
        console.error(
          `[Scheduler] Unhandled exception in background Fiber #${fiber.id}:`
        );
        console.error(err.stack || err.message || err);
        if (this.interpreter && typeof this.interpreter.log === "function") {
          this.interpreter.log(
            `
[!] Unhandled exception in background thread (Fiber #${fiber.id}): ${err.message}`
          );
        }
      }
    }
  };

  // js/index.js
  var UniversalInterpreter = class {
    /**
     * @param {Object} [options={}]
     * @param {VirtualFileSystem} [options.vfs] - Custom virtual filesystem instance
     * @param {ModuleManager} [options.moduleManager] - Custom module manager instance
     * @param {function(string): void} [options.onPrint] - Callback for stdout messages
     * @param {function(string, function(string): void): void} [options.onInputRequired] - Prompt handler for interactive input
     * @param {number} [options.timeSliceInterval] - Max instructions before yielding slice
     */
    constructor(options = {}) {
      this.options = options;
      this.vfs = options.vfs || vfs;
      this.moduleManager = options.moduleManager || moduleManager;
    }
    /**
     * Parses source code into a standardized AST.
     *
     * @param {string} sourceCode - Raw code string (Python, Java, or C)
     * @param {string} [language='auto'] - Language mode ('auto', 'python', 'java', 'c')
     * @returns {Object} AST node tree
     */
    parse(sourceCode, language = "auto") {
      return parseSource(sourceCode, language);
    }
    /**
     * Compiles source code into an executable BytecodeProgram.
     *
     * @param {string} sourceCode - Raw code string
     * @param {string} [language='auto'] - Language mode
     * @returns {BytecodeProgram} Compiled bytecode program
     */
    compile(sourceCode, language = "auto") {
      const ast = this.parse(sourceCode, language);
      if (ast && Array.isArray(ast.body)) {
        const hasMainDecl = ast.body.some((node) => {
          if (node.type === "FunctionDeclaration" && node.name === "main") return true;
          if (node.type === "ClassDeclaration" && Array.isArray(node.body)) {
            return node.body.some((m) => m.type === "FunctionDeclaration" && m.name === "main");
          }
          return false;
        });
        const hasMainCall = ast.body.some((node) => {
          if (node.type === "ExpressionStatement" && node.expression) {
            const exp = node.expression;
            if (exp.type === "CallExpression" && exp.callee && exp.callee.name === "main") {
              return true;
            }
          }
          return false;
        });
        if (hasMainDecl && !hasMainCall) {
          ast.body.push({
            type: "ExpressionStatement",
            expression: {
              type: "CallExpression",
              callee: { type: "Identifier", name: "main" },
              arguments: []
            }
          });
        }
      }
      const compiler = new BytecodeCompiler();
      return compiler.compile(ast);
    }
    /**
     * Pre-fetches any missing standard library imports over the network before compiling.
     */
    async prefetchImports(sourceCode) {
      if (typeof fetch === "undefined" || !this.moduleManager) return;
      const matches = sourceCode.matchAll(/(?:from\s+([a-zA-Z0-9_.]+)\s+import|import\s+([a-zA-Z0-9_.]+))/g);
      for (const match of matches) {
        const modName = match[1] || match[2];
        if (modName && this.moduleManager.hasModule && !this.moduleManager.hasModule(modName)) {
          if (!modName.includes(".")) {
            try {
              await this.moduleManager.fetchAndCacheModule(modName);
            } catch (e) {
            }
          }
        }
      }
    }
    /**
     * Executes source code or a compiled program asynchronously.
     * Supports cooperative multitasking, non-blocking sleep(), and interactive input prompts.
     *
     * @param {string|BytecodeProgram} input - Source code string or BytecodeProgram instance
     * @param {Object} [options={}] - Execution options overriding constructor defaults
     * @param {string} [options.language='auto'] - Language mode if input is a string
     * @param {function(string): void} [options.onPrint] - Callback invoked whenever text is printed
     * @param {function(string, function(string): void): void} [options.onInputRequired] - Input handler
     * @returns {Promise<{ output: string, value: any, durationMs: number, program: BytecodeProgram, vm: VirtualMachine }>}
     */
    async run(input, options = {}) {
      const language = options.language || this.options.language || "auto";
      if (typeof input === "string" && (language === "python" || language === "auto")) {
        await this.prefetchImports(input);
      }
      const program = typeof input === "string" ? this.compile(input, language) : input;
      let consoleBuffer = "";
      const onPrint = options.onPrint || this.options.onPrint || ((text) => {
        consoleBuffer += text + "\n";
      });
      const vm = new VirtualMachine({
        moduleManager: this.moduleManager,
        timeSliceInterval: options.timeSliceInterval || this.options.timeSliceInterval || 1e4,
        onPrint
      });
      const scheduler = new Scheduler(vm);
      scheduler.spawn(vm.execute(program));
      const inputHandler = options.onInputRequired || this.options.onInputRequired;
      if (inputHandler) {
        scheduler.onInputRequired = inputHandler;
      }
      const startTime = performance.now();
      return new Promise((resolve, reject) => {
        scheduler.run(
          () => {
            const durationMs = performance.now() - startTime;
            resolve({
              output: vm.consoleOutput || consoleBuffer,
              value: vm.operandStack.length > 0 ? vm.operandStack[vm.operandStack.length - 1] : null,
              durationMs,
              program,
              vm
            });
          },
          (err) => reject(err)
        );
      });
    }
    /**
     * Executes source code synchronously to completion (suited for non-fiber workloads).
     *
     * @param {string|BytecodeProgram} input - Source code string or BytecodeProgram instance
     * @param {Object} [options={}] - Execution options
     * @returns {{ output: string, value: any, durationMs: number, program: BytecodeProgram, vm: VirtualMachine }}
     */
    runSync(input, options = {}) {
      const language = options.language || this.options.language || "auto";
      const program = typeof input === "string" ? this.compile(input, language) : input;
      const vm = new VirtualMachine({
        moduleManager: this.moduleManager,
        onPrint: options.onPrint || this.options.onPrint
      });
      const startTime = performance.now();
      const gen = vm.execute(program);
      let lastStep = gen.next();
      while (!lastStep.done) {
        lastStep = gen.next();
      }
      const durationMs = performance.now() - startTime;
      return {
        output: vm.consoleOutput,
        value: lastStep.value !== void 0 ? lastStep.value : vm.operandStack.length > 0 ? vm.operandStack[vm.operandStack.length - 1] : null,
        durationMs,
        program,
        vm
      };
    }
  };
  var index_default = UniversalInterpreter;
  return __toCommonJS(index_exports);
})();
if (typeof window !== "undefined") { window.UniversalInterpreter = UVM.UniversalInterpreter || UVM.default; }
//# sourceMappingURL=uvm.bundle.js.map
