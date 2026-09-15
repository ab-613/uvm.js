// File: js/vm/vm.js
import { OP, OP_NAMES } from './opcodes.js';
import { SYSCALL } from './syscalls.js';
import { VirtualTerminal } from './terminal.js';

/**
 * Call frame representing an active function activation record.
 */
export class CallFrame {
  constructor(returnPC, fnName = '<anonymous>', localCount = 16, globals = null) {
    this.returnPC = returnPC;
    this.fnName = fnName;
    this.locals = new Array(localCount).fill(null);
    this.globals = globals;
  }
}

/**
 * Formats a value according to Python format specification mini-language.
 */
export function formatValue(val, spec) {
  if (spec === null || spec === undefined || spec === '') {
    if (typeof val === 'boolean') return val ? 'True' : 'False';
    if (val === null || val === undefined) return 'None';
    return String(val);
  }
  const match = String(spec).match(/^(?:(.)?([<>=^]))?([+\- ])?(#)?(0)?(\d+)?([,_])?(?:\.(\d+))?([bcdeEfFgGnosxX%])?$/);
  if (!match) {
    if (typeof val === 'boolean') return val ? 'True' : 'False';
    if (val === null || val === undefined) return 'None';
    if (typeof val === 'number' && !isNaN(parseFloat(spec))) {
      return val.toFixed(parseInt(spec, 10));
    }
    return String(val);
  }
  let [_, fill, align, sign, alt, zero, width, grouping, prec, type] = match;
  width = width ? parseInt(width, 10) : 0;
  prec = prec !== undefined ? parseInt(prec, 10) : undefined;
  fill = fill || (zero ? '0' : ' ');
  align = align || (zero ? '=' : (typeof val === 'number' ? '>' : '<'));

  let formatted = '';
  const num = Number(val);
  if (typeof val === 'boolean' && (!type || type === 's')) {
    formatted = val ? 'True' : 'False';
  } else if ((val === null || val === undefined) && (!type || type === 's')) {
    formatted = 'None';
  } else {
    switch (type) {
      case 'b':
        formatted = Math.floor(num).toString(2);
        break;
      case 'o':
        formatted = Math.floor(num).toString(8);
        break;
      case 'x':
        formatted = Math.floor(num).toString(16);
        break;
      case 'X':
        formatted = Math.floor(num).toString(16).toUpperCase();
        break;
      case 'd':
        formatted = String(Math.floor(num));
        break;
      case 'f':
      case 'F':
        formatted = prec !== undefined ? num.toFixed(prec) : String(num);
        break;
      case 'e':
        formatted = prec !== undefined ? num.toExponential(prec) : num.toExponential();
        break;
      case 'E':
        formatted = (prec !== undefined ? num.toExponential(prec) : num.toExponential()).toUpperCase();
        break;
      case '%':
        formatted = (prec !== undefined ? (num * 100).toFixed(prec) : (num * 100).toFixed(6)) + '%';
        break;
      case 's':
        formatted = String(val);
        break;
      default:
        if (prec !== undefined && !isNaN(num)) {
          formatted = num.toFixed(prec);
        } else {
          formatted = String(val);
        }
        break;
    }
  }

  // grouping
  if (grouping === ',') {
    const parts = formatted.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    formatted = parts.join('.');
  } else if (grouping === '_') {
    const parts = formatted.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '_');
    formatted = parts.join('_');
  }

  // sign
  if (typeof val === 'number' && num >= 0) {
    if (sign === '+') formatted = '+' + formatted;
    else if (sign === ' ') formatted = ' ' + formatted;
  }

  // width and alignment
  if (formatted.length < width) {
    const padLen = width - formatted.length;
    if (align === '<') {
      formatted = formatted + fill.repeat(padLen);
    } else if (align === '>') {
      formatted = fill.repeat(padLen) + formatted;
    } else if (align === '^') {
      const left = Math.floor(padLen / 2);
      const right = padLen - left;
      formatted = fill.repeat(left) + formatted + fill.repeat(right);
    } else if (align === '=') {
      if (formatted.startsWith('+') || formatted.startsWith('-')) {
        formatted = formatted[0] + fill.repeat(padLen) + formatted.slice(1);
      } else {
        formatted = fill.repeat(padLen) + formatted;
      }
    }
  }

  return formatted;
}

/**
 * Formats a string using Python printf-style % formatting.
 */
export function formatPrintfString(fmt, args) {
  if (typeof fmt !== 'string') return fmt;
  const isDict = args && typeof args === 'object' && !Array.isArray(args);
  let argIdx = 0;
  const argList = Array.isArray(args) ? args : [args];

  return fmt.replace(/%(\(([^)]+)\))?([#0\- +]*)?(\*|\d+)?(?:\.(\*|\d+))?[hlL]?([diouxXeEfFgGcrs%])/g, (match, _p1, key, flags, width, prec, type) => {
    if (type === '%') return '%';

    let val;
    if (key) {
      val = isDict ? args[key] : undefined;
    } else {
      val = argList[argIdx++];
    }

    if (val === undefined) val = 'None';

    flags = flags || '';
    const leftAlign = flags.includes('-');
    const zeroPad = flags.includes('0') && !leftAlign;
    const sign = flags.includes('+') ? '+' : (flags.includes(' ') ? ' ' : '');
    const w = width ? parseInt(width, 10) : 0;
    const p = prec ? parseInt(prec, 10) : undefined;

    let str = '';
    switch (type) {
      case 's':
        str = String(val);
        if (p !== undefined) str = str.slice(0, p);
        break;
      case 'r':
        str = typeof val === 'string' ? `'${val}'` : (Array.isArray(val) ? JSON.stringify(val) : String(val));
        break;
      case 'd':
      case 'i': {
        const num = Math.trunc(Number(val) || 0);
        str = String(Math.abs(num));
        if (p !== undefined) str = str.padStart(p, '0');
        if (num < 0) str = '-' + str;
        else if (sign) str = sign + str;
        break;
      }
      case 'f':
      case 'F': {
        const num = Number(val) || 0;
        str = (p !== undefined ? num.toFixed(p) : num.toFixed(6));
        if (num >= 0 && sign) str = sign + str;
        break;
      }
      case 'x':
        str = (Math.floor(Number(val) || 0)).toString(16);
        break;
      case 'X':
        str = (Math.floor(Number(val) || 0)).toString(16).toUpperCase();
        break;
      case 'o':
        str = (Math.floor(Number(val) || 0)).toString(8);
        break;
      case 'c':
        str = typeof val === 'number' ? String.fromCharCode(val) : String(val)[0] || '';
        break;
      default:
        str = String(val);
        break;
    }

    if (str.length < w) {
      const pad = ' '.repeat(w - str.length);
      str = leftAlign ? str + pad : (zeroPad ? str.padStart(w, '0') : pad + str);
    }
    return str;
  });
}

/**
 * Converts hexadecimal floating-point string representation (e.g. '0.5d414' or '0x1.ffffp+1023') to number.
 */
export function floatFromHex(s) {
  s = String(s || '').trim().toLowerCase();
  let sign = 1;
  if (s.startsWith('-')) { sign = -1; s = s.slice(1); }
  else if (s.startsWith('+')) { s = s.slice(1); }
  if (s.startsWith('0x')) s = s.slice(2);
  let exp = 0;
  const pIdx = s.indexOf('p');
  if (pIdx !== -1) {
    exp = parseInt(s.slice(pIdx + 1), 10) || 0;
    s = s.slice(0, pIdx);
  }
  const dotIdx = s.indexOf('.');
  let intPart = 0;
  let fracPart = 0;
  if (dotIdx === -1) {
    intPart = parseInt(s, 16) || 0;
  } else {
    const intStr = s.slice(0, dotIdx);
    const fracStr = s.slice(dotIdx + 1);
    intPart = intStr ? (parseInt(intStr, 16) || 0) : 0;
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

/**
 * Resolves properties and Python standard methods on built-in types (str, list, dict, set).
 */
export function resolveMember(obj, prop) {
  if (obj === null || obj === undefined) {
    const err = new Error(`AttributeError: 'NoneType' object has no attribute '${prop}'`);
    err.name = 'AttributeError';
    throw err;
  }

  // 1. Strings
  if (typeof obj === 'string') {
    switch (prop) {
      case 'split':
        return (sep, maxsplit) => {
          if (sep === undefined || sep === null) {
            const parts = obj.trim().split(/\s+/);
            return parts.length === 1 && parts[0] === '' ? [] : parts;
          }
          if (maxsplit !== undefined && maxsplit >= 0) {
            const parts = obj.split(sep);
            if (parts.length <= maxsplit + 1) return parts;
            const res = parts.slice(0, maxsplit);
            res.push(parts.slice(maxsplit).join(sep));
            return res;
          }
          return obj.split(sep);
        };
      case 'join':
        return (iterable) => Array.from(iterable || []).map(x => String(x)).join(obj);
      case 'strip':
        return (chars) => {
          if (!chars) return obj.trim();
          const esc = chars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          return obj.replace(new RegExp(`^[${esc}]+|[${esc}]+$`, 'g'), '');
        };
      case 'lstrip':
        return (chars) => {
          if (!chars) return obj.trimStart();
          const esc = chars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          return obj.replace(new RegExp(`^[${esc}]+`, 'g'), '');
        };
      case 'rstrip':
        return (chars) => {
          if (!chars) return obj.trimEnd();
          const esc = chars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          return obj.replace(new RegExp(`[${esc}]+$`, 'g'), '');
        };
      case 'replace':
        return (oldStr, newStr, count) => {
          if (count === undefined) return obj.replaceAll(oldStr, newStr);
          let res = obj;
          for (let i = 0; i < count; i++) {
            const idx = res.indexOf(oldStr);
            if (idx === -1) break;
            res = res.slice(0, idx) + newStr + res.slice(idx + oldStr.length);
          }
          return res;
        };
      case 'startswith':
        return (prefix) => obj.startsWith(prefix);
      case 'endswith':
        return (suffix) => obj.endsWith(suffix);
      case 'find':
        return (sub, start = 0) => obj.indexOf(sub, start);
      case 'rfind':
        return (sub, start = 0) => obj.lastIndexOf(sub);
      case 'index':
        return (sub, start = 0) => {
          const idx = obj.indexOf(sub, start);
          if (idx === -1) throw new Error('ValueError: substring not found');
          return idx;
        };
      case 'expandtabs':
        return (tabsize = 8) => {
          let result = '';
          let col = 0;
          for (let i = 0; i < obj.length; i++) {
            const ch = obj[i];
            if (ch === '\t') {
              const numSpaces = tabsize - (col % tabsize);
              result += ' '.repeat(numSpaces);
              col += numSpaces;
            } else {
              result += ch;
              if (ch === '\n' || ch === '\r') col = 0;
              else col++;
            }
          }
          return result;
        };
      case 'translate':
        return (table) => {
          if (!table) return obj;
          let result = '';
          for (let i = 0; i < obj.length; i++) {
            const code = obj.charCodeAt(i);
            const ch = obj[i];
            let repl = (table[code] !== undefined) ? table[code] : (table[ch] !== undefined ? table[ch] : undefined);
            if (repl === undefined) {
              result += ch;
            } else if (repl === null) {
              // Skip (deleted)
            } else if (typeof repl === 'number') {
              result += String.fromCharCode(repl);
            } else {
              result += String(repl);
            }
          }
          return result;
        };
      case 'count':
        return (sub) => {
          if (!sub) return 0;
          let count = 0, pos = 0;
          while ((pos = obj.indexOf(sub, pos)) !== -1) { count++; pos += sub.length; }
          return count;
        };
      case 'lower':
        return () => obj.toLowerCase();
      case 'upper':
        return () => obj.toUpperCase();
      case 'capitalize':
        return () => obj.length ? obj[0].toUpperCase() + obj.slice(1).toLowerCase() : '';
      case 'title':
        return () => obj.replace(/\b\w/g, c => c.toUpperCase());
      case 'isdigit':
        return () => /^\d+$/.test(obj);
      case 'isalpha':
        return () => /^[a-zA-Z]+$/.test(obj);
      case 'isalnum':
        return () => /^[a-zA-Z0-9]+$/.test(obj);
      case 'isspace':
        return () => /^\s+$/.test(obj);
      case 'format':
        return (...args) => {
          let idx = 0;
          return obj.replace(/{(\w*)}/g, (match, key) => {
            if (key === '') return args[idx++];
            const kIdx = parseInt(key, 10);
            if (!isNaN(kIdx)) return args[kIdx];
            return match;
          });
        };
      case 'center':
        return (width, fillchar = ' ') => {
          if (width <= obj.length) return obj;
          const margin = width - obj.length;
          const left = Math.floor(margin / 2);
          const right = margin - left;
          return fillchar.repeat(left) + obj + fillchar.repeat(right);
        };
      case 'ljust':
        return (width, fillchar = ' ') => {
          if (width <= obj.length) return obj;
          return obj + fillchar.repeat(width - obj.length);
        };
      case 'rjust':
        return (width, fillchar = ' ') => {
          if (width <= obj.length) return obj;
          return fillchar.repeat(width - obj.length) + obj;
        };
      case 'zfill':
        return (width) => {
          if (width <= obj.length) return obj;
          const sign = (obj[0] === '+' || obj[0] === '-') ? obj[0] : '';
          const body = sign ? obj.slice(1) : obj;
          const pad = Math.max(0, width - obj.length);
          return sign + '0'.repeat(pad) + body;
        };
      case 'splitlines':
        return (keepends = false) => {
          if (keepends) {
            return obj.match(/[^\r\n]*(\r\n|\r|\n|$)/g).filter(x => x.length > 0);
          }
          return obj.split(/\r\n|\r|\n/);
        };
      default:
        return obj[prop] !== undefined ? (typeof obj[prop] === 'function' ? obj[prop].bind(obj) : obj[prop]) : undefined;
    }
  }

  // 2. Arrays (Lists)
  if (Array.isArray(obj)) {
    switch (prop) {
      case 'append':
        return (item) => { obj.push(item); return null; };
      case 'extend':
        return (items) => { obj.push(...(items || [])); return null; };
      case 'insert':
        return (index, item) => { obj.splice(index, 0, item); return null; };
      case 'remove':
        return (item) => {
          const idx = obj.indexOf(item);
          if (idx === -1) throw new Error('ValueError: list.remove(x): x not in list');
          obj.splice(idx, 1);
          return null;
        };
      case 'pop':
        return (index = -1) => {
          if (obj.length === 0) {
            const err = new RangeError('IndexError: pop from empty list');
            err.name = 'IndexError';
            throw err;
          }
          const resolved = index < 0 ? obj.length + index : index;
          if (resolved < 0 || resolved >= obj.length) {
            const err = new RangeError('IndexError: pop index out of range');
            err.name = 'IndexError';
            throw err;
          }
          return obj.splice(resolved, 1)[0];
        };
      case 'clear':
        return () => { obj.length = 0; return null; };
      case 'index':
        return (item) => {
          const idx = obj.indexOf(item);
          if (idx === -1) throw new Error('ValueError: item is not in list');
          return idx;
        };
      case 'count':
        return (item) => obj.filter(x => x === item).length;
      case 'reverse':
        return () => { obj.reverse(); return null; };
      case 'sort':
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
      case 'copy':
        return () => [...obj];
      default:
        break;
    }
  }

  // 3. Objects (Dicts / Modules)
  if (typeof obj === 'object' && !obj.__is_class_instance__) {
    if (typeof obj[prop] === 'function') {
      const fn = obj[prop];
      const bound = fn.bind(obj);
      if (fn.__uvm_mod_vm__) bound.__uvm_mod_vm__ = fn.__uvm_mod_vm__;
      if (fn.__uvm_callable__) bound.__uvm_callable__ = fn.__uvm_callable__;
      return bound;
    }
    if (prop === 'keys') return () => Object.keys(obj);
    if (prop === 'values') return () => Object.values(obj);
    if (prop === 'items') return () => Object.entries(obj);
    if (prop === 'get') return (key, defaultVal = null) => (key in obj ? obj[key] : defaultVal);
    if (prop === 'pop') return (key, defaultVal) => {
      if (key in obj) {
        const val = obj[key];
        delete obj[key];
        return val;
      }
      if (defaultVal !== undefined) return defaultVal;
      throw new Error(`KeyError: '${key}'`);
    };
    if (prop === 'update') return (other) => {
      if (other && typeof other === 'object') {
        Object.assign(obj, other);
      }
      return null;
    };
    if (prop === 'clear') return () => {
      for (const k of Object.keys(obj)) delete obj[k];
      return null;
    };
    if (prop === 'copy') return () => ({ ...obj });
  }

  // 4. Properties and Bound methods on custom class instances or host functions
  if (prop === '__dict__') {
    return obj;
  }
  let val = obj[prop];
  if (val === undefined && obj && obj.__class__ && typeof obj.__class__ === 'object') {
    val = obj.__class__[prop];
  }
  if (val && typeof val === 'object' && val.__is_property__) {
    if (val.fget) {
      if (typeof val.fget === 'function') return val.fget.call(obj, obj);
      if (val.fget.entryPC !== undefined) return { __is_bound__: true, self: obj, fn: val.fget };
    }
    return undefined;
  }
  if (val && typeof val === 'object' && val.entryPC !== undefined) {
    if (val.isClassMethod || (val.name && val.name.startsWith('__class_'))) {
      return { __is_bound__: true, self: obj, fn: val };
    }
    return val;
  }
  if (val && typeof val === 'function') {
    const bound = val.bind(obj);
    if (val.__uvm_mod_vm__) bound.__uvm_mod_vm__ = val.__uvm_mod_vm__;
    if (val.__uvm_callable__) bound.__uvm_callable__ = val.__uvm_callable__;
    return bound;
  }
  return val;
}

/**
 * Robust Python argument binder: maps positional arguments, kwargs objects, and rest parameters.
 */
export function bindCallArguments(newFrame, callee, args) {
  if (callee.paramNames && args.length > 0) {
    const remainingArgs = [...args];
    const kwObjects = [];

    // Only inspect the last argument as a potential keyword argument map.
    // Class instances (__class__), bound methods, and modules must never be treated as kwargs.
    const lastArg = remainingArgs[remainingArgs.length - 1];
    if (lastArg && typeof lastArg === 'object' && !Array.isArray(lastArg) &&
        !lastArg.entryPC && !lastArg.__is_bound__ && !lastArg.__is_module__ && !lastArg.__class__) {
      if (lastArg.__is_py_kwargs__) {
        const cleanKw = { ...lastArg };
        delete cleanKw.__is_py_kwargs__;
        kwObjects.push(cleanKw);
        remainingArgs.pop();
      } else {
        const keys = Object.keys(lastArg);
        if (keys.length > 0 && keys.every(k => callee.paramNames.includes(k))) {
          kwObjects.push(remainingArgs.pop());
        }
      }
    }

    if (callee.restParamIndex !== undefined) {
      const regularCount = callee.restParamIndex;
      for (let i = 0; i < regularCount; i++) {
        newFrame.locals[i] = remainingArgs[i] !== undefined ? remainingArgs[i] : null;
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
  } else if (callee.restParamIndex !== undefined) {
    const regularCount = callee.restParamIndex;
    for (let i = 0; i < regularCount; i++) {
      newFrame.locals[i] = args[i] !== undefined ? args[i] : null;
    }
    newFrame.locals[regularCount] = args.slice(regularCount);
  } else {
    for (let i = 0; i < args.length; i++) {
      newFrame.locals[i] = args[i];
    }
  }
}

/**
 * Universal Virtual Machine (UVM)
 *
 * A stack-based bytecode virtual machine running inside an ES6 Generator.
 * Integrates directly with Scheduler.js fibers for zero-cost cooperative time-slicing,
 * non-blocking sleep(), and interactive UI input().
 */
/**
 * Deep equality comparison matching Python semantics for lists, dicts, and primitives.
 */
function pyEquals(a, b) {
  if (a === b) return true;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!pyEquals(a[i], b[i])) return false;
    }
    return true;
  }
  if (a && b && typeof a === 'object' && typeof b === 'object' && !a.__class__ && !b.__class__) {
    const kA = Object.keys(a), kB = Object.keys(b);
    if (kA.length !== kB.length) return false;
    return kA.every(k => k in b && pyEquals(a[k], b[k]));
  }
  return false;
}

export class VirtualMachine {
  constructor(options = {}) {
    this.operandStack = [];
    this.callStack = [];
    this.tryStack = [];
    this.globals = new Map();
    this.pc = 0;
    this.isHalted = false;
    this.instructionCount = 0;
    this.timeSliceInterval = options.timeSliceInterval || 5000;
    this.terminal = options.terminal || new VirtualTerminal();
    this.consoleOutput = this.terminal.getText();
    this.program = null;

    // Optional callbacks for UI integration
    this.onPrint = options.onPrint || null;
    this.onWrite = options.onWrite || null;
    this.moduleManager = options.moduleManager || VirtualMachine.defaultModuleManager || null;

    this.initBuiltins();
  }

  initBuiltins() {
    this.globals.set('len', (obj) => {
      if (obj === null || obj === undefined) {
        throw new TypeError("TypeError: object of type 'NoneType' has no len()");
      }
      if (typeof obj === 'string' || Array.isArray(obj)) {
        return obj.length;
      }
      if (obj instanceof Set || obj instanceof Map) {
        return obj.size;
      }
      if (typeof obj === 'object') {
        if (typeof obj.__len__ === 'function') return obj.__len__();
        return Object.keys(obj).length;
      }
      throw new TypeError(`TypeError: object of type '${typeof obj}' has no len()`);
    });
    this.globals.set('range', (start, stop, step = 1) => {
      if (step === 0) throw new RangeError('ValueError: range() arg 3 must not be zero');
      if (stop === undefined) { stop = start; start = 0; }
      const res = [];
      if (step > 0) for (let i = start; i < stop; i += step) res.push(i);
      else if (step < 0) for (let i = start; i > stop; i += step) res.push(i);
      return res;
    });
    this.globals.set('abs', Math.abs);
    const pyMin = (...args) => {
      let items = args;
      let keyFn = null;
      let defVal = undefined;
      if (items.length > 0 && typeof items[items.length - 1] === 'object' && items[items.length - 1] !== null && !Array.isArray(items[items.length - 1])) {
        const kw = items.pop();
        if (kw.key) keyFn = kw.key;
        if (kw.default !== undefined) defVal = kw.default;
      }
      if (items.length === 1 && (Array.isArray(items[0]) || (items[0] && typeof items[0][Symbol.iterator] === 'function'))) {
        items = Array.from(items[0]);
      }
      if (items.length === 0) {
        if (defVal !== undefined) return defVal;
        throw new RangeError('ValueError: min() arg is an empty sequence');
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
    this.globals.set('min', pyMin);

    const pyMax = (...args) => {
      let items = args;
      let keyFn = null;
      let defVal = undefined;
      if (items.length > 0 && typeof items[items.length - 1] === 'object' && items[items.length - 1] !== null && !Array.isArray(items[items.length - 1])) {
        const kw = items.pop();
        if (kw.key) keyFn = kw.key;
        if (kw.default !== undefined) defVal = kw.default;
      }
      if (items.length === 1 && (Array.isArray(items[0]) || (items[0] && typeof items[0][Symbol.iterator] === 'function'))) {
        items = Array.from(items[0]);
      }
      if (items.length === 0) {
        if (defVal !== undefined) return defVal;
        throw new RangeError('ValueError: max() arg is an empty sequence');
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
    this.globals.set('max', pyMax);

    this.globals.set('sum', (lst) => (Array.isArray(lst) ? lst.reduce((a, b) => a + b, 0) : 0));
    this.globals.set('sorted', (lst) => (Array.isArray(lst) ? [...lst].sort((a, b) => (typeof a === 'number' && typeof b === 'number' ? a - b : String(a).localeCompare(String(b)))) : []));
    this.globals.set('int', (x) => parseInt(x, 10));
    const floatFn = (x) => parseFloat(x);
    floatFn.fromhex = (s) => floatFromHex(s);
    this.globals.set('float', floatFn);
    const strFn = (x) => this.stringify(x);
    const strMethods = ['capitalize', 'lower', 'upper', 'strip', 'lstrip', 'rstrip', 'split', 'splitlines', 'join', 'replace', 'startswith', 'endswith', 'find', 'index', 'count', 'center', 'ljust', 'rjust', 'zfill', 'title', 'isdigit', 'isalpha', 'isalnum', 'isspace'];
    for (const m of strMethods) {
      strFn[m] = (self, ...args) => {
        const boundFn = resolveMember(String(self), m);
        return boundFn(...args);
      };
    }
    this.globals.set('str', strFn);
    this.globals.set('repr', (x) => (typeof x === 'string' ? JSON.stringify(x) : this.stringify(x)));
    this.globals.set('round', (x, n = 0) => {
      const factor = Math.pow(10, n);
      return Math.round(x * factor) / factor;
    });
    this.globals.set('bool', (x) => this.isTruthy(x));
    const dictFn = (entries) => {
      if (!entries) return {};
      const res = {};
      for (const [k, v] of entries) res[k] = v;
      return res;
    };
    dictFn.fromkeys = (iterable, value = null) => {
      const res = {};
      for (const k of (iterable || [])) res[k] = value;
      return res;
    };
    this.globals.set('dict', dictFn);
    this.globals.set('ord', (c) => String(c).charCodeAt(0));
    this.globals.set('chr', (n) => String.fromCharCode(n));
    this.globals.set('map', (fn, ...iterables) => {
      if (iterables.length === 0) return [];
      const arrays = iterables.map(it => Array.from(it || []));
      const minLen = Math.min(...arrays.map(a => a.length));
      const res = [];
      for (let i = 0; i < minLen; i++) {
        const args = arrays.map(a => a[i]);
        res.push(fn(...args));
      }
      return res;
    });
    this.globals.set('filter', (fn, iterable) => {
      const arr = Array.from(iterable || []);
      return arr.filter(x => (fn ? fn(x) : Boolean(x)));
    });
    this.globals.set('list', (x) => Array.from(x));
    this.globals.set('format', (val, spec) => formatValue(val, spec));
    this.globals.set('__format', (val, spec) => formatValue(val, spec));

    // Sequence Slicing helper
    this.globals.set('__slice', (seq, start, stop, step) => {
      if (step === 0) throw new RangeError('ValueError: slice step cannot be zero');
      if (step === null || step === undefined) step = 1;
      const len = seq && seq.length !== undefined ? seq.length : 0;

      if (step > 0) {
        if (start === null || start === undefined) start = 0;
        else if (start < 0) start = Math.max(0, len + start);
        else start = Math.min(len, start);

        if (stop === null || stop === undefined) stop = len;
        else if (stop < 0) stop = Math.max(0, len + stop);
        else stop = Math.min(len, stop);
      } else {
        if (start === null || start === undefined) start = len - 1;
        else if (start < 0) start = Math.max(-1, len + start);
        else start = Math.min(len - 1, start);

        if (stop === null || stop === undefined) stop = -1;
        else if (stop < 0) stop = Math.max(-1, len + stop);
        else stop = Math.min(len - 1, stop);
      }

      const res = [];
      if (step > 0) {
        for (let i = start; i < stop; i += step) res.push(seq[i]);
      } else {
        for (let i = start; i > stop; i += step) res.push(seq[i]);
      }
      return typeof seq === 'string' ? res.join('') : res;
    });

    this.globals.set('__delitem', (obj, idx) => {
      if (Array.isArray(obj)) {
        const i = idx < 0 ? obj.length + idx : idx;
        if (i >= 0 && i < obj.length) {
          obj.splice(i, 1);
        }
      } else if (obj && typeof obj === 'object') {
        delete obj[idx];
      }
    });

    // Iteration & Aggregation builtins
    this.globals.set('enumerate', (iterable) => {
      const arr = Array.from(iterable || []);
      return arr.map((item, idx) => [idx, item]);
    });
    this.globals.set('zip', (...iterables) => {
      if (iterables.length === 0) return [];
      const arrays = iterables.map(it => Array.from(it || []));
      const minLen = Math.min(...arrays.map(a => a.length));
      const res = [];
      for (let i = 0; i < minLen; i++) {
        res.push(arrays.map(a => a[i]));
      }
      return res;
    });
    this.globals.set('all', (iterable) => {
      for (const item of (iterable || [])) {
        if (!this.isTruthy(item)) return false;
      }
      return true;
    });
    this.globals.set('any', (iterable) => {
      for (const item of (iterable || [])) {
        if (this.isTruthy(item)) return true;
      }
      return false;
    });
    this.globals.set('reversed', (iterable) => {
      const arr = Array.from(iterable || []);
      return arr.reverse();
    });
    this.globals.set('set', (iterable) => {
      if (!iterable) return [];
      const seen = new Set();
      const res = [];
      for (const item of iterable) {
        if (!seen.has(item)) {
          seen.add(item);
          res.push(item);
        }
      }
      return res;
    });
    this.globals.set('__iter_prep', (obj) => {
      if (obj === null || obj === undefined) {
        throw new TypeError("TypeError: 'NoneType' object is not iterable");
      }
      if (typeof obj === 'number' || typeof obj === 'boolean') {
        throw new TypeError(`TypeError: '${typeof obj}' object is not iterable`);
      }
      if (Array.isArray(obj) || typeof obj === 'string') {
        return obj;
      }
      if (obj instanceof Set || obj instanceof Map) {
        return Array.from(obj);
      }
      if (typeof obj === 'object') {
        return Object.keys(obj);
      }
      return Array.from(obj);
    });
    this.globals.set('classmethod', (fn) => fn);
    this.globals.set('staticmethod', (fn) => fn);
    this.globals.set('property', (fn) => fn);
    this.globals.set('print', (...args) => {
      let sep = ' ';
      let end = '\n';
      const items = [...args];
      if (items.length > 0 && typeof items[items.length - 1] === 'object' && items[items.length - 1] !== null && !Array.isArray(items[items.length - 1])) {
        const last = items[items.length - 1];
        if (last.__is_py_kwargs__ || (last.sep !== undefined || last.end !== undefined)) {
          const kw = items.pop();
          if (kw.sep !== undefined) sep = this.stringify(kw.sep);
          if (kw.end !== undefined) end = this.stringify(kw.end);
        }
      }
      const text = items.map(a => this.stringify(a)).join(sep);
      if (end === '\n') {
        this.log(text);
      } else {
        this.write(text + end);
      }
      return null;
    });

    // Exception Hierarchy Builtins
    class PyException extends Error {
      constructor(msg = '') {
        super(msg);
        this.name = 'Exception';
        this.message = msg;
      }
      toString() { return `${this.name}: ${this.message}`; }
    }
    class PyValueError extends PyException { constructor(msg) { super(msg); this.name = 'ValueError'; } }
    class PyTypeError extends PyException { constructor(msg) { super(msg); this.name = 'TypeError'; } }
    class PyKeyError extends PyException { constructor(msg) { super(msg); this.name = 'KeyError'; } }
    class PyIndexError extends PyException { constructor(msg) { super(msg); this.name = 'IndexError'; } }

    this.globals.set('Exception', (msg) => new PyException(msg));
    this.globals.set('ValueError', (msg) => new PyValueError(msg));
    this.globals.set('TypeError', (msg) => new PyTypeError(msg));
    this.globals.set('KeyError', (msg) => new PyKeyError(msg));
    this.globals.set('IndexError', (msg) => new PyIndexError(msg));
    this.globals.set('__name__', '__main__');

    // VFS File I/O
    this.globals.set('open', (filename, mode = 'r') => {
      const vfs = (this.moduleManager && this.moduleManager.vfs) || null;
      let closed = false;
      let lineIndex = 0;
      let writeBuffer = (mode.includes('a') && vfs && vfs.exists(filename)) ? vfs.readFile(filename) : '';
      if (mode.includes('w') && vfs) {
        vfs.writeFile(filename, '');
      }
      return {
        filename,
        mode,
        read() {
          if (closed) throw new Error('ValueError: I/O operation on closed file.');
          if (vfs && vfs.exists(filename)) {
            return typeof vfs.readFile === 'function' ? vfs.readFile(filename) : vfs.read(filename);
          }
          return '';
        },
        readline() {
          if (closed) throw new Error('ValueError: I/O operation on closed file.');
          const content = this.read();
          const lines = content.split('\n');
          if (lineIndex < lines.length) {
            const line = lines[lineIndex++];
            return line + (lineIndex < lines.length ? '\n' : '');
          }
          return '';
        },
        write(data) {
          if (closed) throw new Error('ValueError: I/O operation on closed file.');
          writeBuffer += String(data);
          if (vfs) {
            vfs.writeFile(filename, writeBuffer);
          }
          return data ? data.length : 0;
        },
        close() {
          closed = true;
          if (vfs && writeBuffer.length > 0) {
            vfs.writeFile(filename, writeBuffer);
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
      if (stop === undefined && step === undefined) {
        return new PySlice(null, start, null);
      }
      return new PySlice(start, stop, step);
    };
    sliceFn.__class__ = PySlice;
    this.globals.set('slice', sliceFn);

    // Standard Built-in Utilities & Reflection
    this.globals.set('isinstance', (obj, cls) => {
      if (Array.isArray(cls)) {
        return cls.some(c => this.globals.get('isinstance')(obj, c));
      }
      const intRef = this.globals.get('int');
      const floatRef = this.globals.get('float');
      const strRef = this.globals.get('str');
      const listRef = this.globals.get('list');
      const boolRef = this.globals.get('bool');
      const dictRef = this.globals.get('dict');
      const sliceRef = this.globals.get('slice');

      if (cls === 'int' || cls === intRef) return typeof obj === 'number' && Number.isInteger(obj);
      if (cls === 'float' || cls === floatRef) return typeof obj === 'number';
      if (cls === 'str' || cls === strRef) return typeof obj === 'string';
      if (cls === 'list' || cls === listRef) return Array.isArray(obj);
      if (cls === 'dict' || cls === dictRef) return typeof obj === 'object' && obj !== null && !Array.isArray(obj);
      if (cls === 'bool' || cls === boolRef) return typeof obj === 'boolean';
      if (cls === PySlice || cls === sliceRef) return obj instanceof PySlice || (obj && obj.__class__ === PySlice);
      if (obj && obj.__class__) return obj.__class__ === cls;
      return false;
    });
    this.globals.set('hasattr', (obj, name) => obj !== null && obj !== undefined && (name in obj || obj[name] !== undefined));
    this.globals.set('getattr', (obj, name, defaultVal) => {
      if (obj !== null && obj !== undefined && (name in obj || obj[name] !== undefined)) {
        return obj[name];
      }
      if (defaultVal !== undefined) return defaultVal;
      throw new Error(`AttributeError: object has no attribute '${name}'`);
    });
    this.globals.set('setattr', (obj, name, val) => {
      if (obj === null || obj === undefined) throw new TypeError('cannot setattr on null/undefined');
      obj[name] = val;
      return null;
    });
    this.globals.set('type', (obj) => {
      if (obj === null) return 'NoneType';
      if (Array.isArray(obj)) return 'list';
      if (typeof obj === 'number') return Number.isInteger(obj) ? 'int' : 'float';
      if (typeof obj === 'string') return 'str';
      if (typeof obj === 'boolean') return 'bool';
      if (typeof obj === 'function') return 'function';
      if (obj && obj.__class__) return obj.__class__.name || 'type';
      return typeof obj;
    });
    this.globals.set('ord', (ch) => String(ch).charCodeAt(0));
    this.globals.set('chr', (code) => String.fromCharCode(code));
    this.globals.set('bin', (n) => '0b' + Math.floor(n).toString(2));
    this.globals.set('hex', (n) => '0x' + Math.floor(n).toString(16));
    this.globals.set('oct', (n) => '0o' + Math.floor(n).toString(8));
    this.globals.set('map', (fn, it) => {
      const arr = Array.from(it || []);
      return arr.map(item => this.callCallable(fn, item));
    });
    this.globals.set('filter', (fn, it) => {
      const arr = Array.from(it || []);
      return arr.filter(item => this.isTruthy(this.callCallable(fn, item)));
    });
    this.globals.set('pow', (x, y, mod) => (mod !== undefined ? Math.pow(x, y) % mod : Math.pow(x, y)));
    this.globals.set('property', (fget, fset, fdel) => ({
      __is_property__: true,
      fget,
      fset,
      fdel,
      setter: (setterFn) => ({ __is_property__: true, fget, fset: setterFn, fdel }),
      getter: (getterFn) => ({ __is_property__: true, fget: getterFn, fset, fdel })
    }));
    this.globals.set('iter', (obj) => (Array.isArray(obj) ? [...obj] : (obj && typeof obj[Symbol.iterator] === 'function' ? [...obj] : Object.keys(obj || {}))));
    this.globals.set('next', (it, def) => (it && typeof it.next === 'function' ? it.next().value : (Array.isArray(it) && it.length > 0 ? it.shift() : def)));
    this.globals.set('callable', (obj) => typeof obj === 'function' || (obj && (obj.entryPC !== undefined || obj.__call__ !== undefined)));
    this.globals.set('id', (obj) => (typeof obj === 'object' && obj ? (obj.__id__ || (obj.__id__ = Math.floor(Math.random() * 10000000))) : 0));
    this.globals.set('AttributeError', (msg) => new Error('AttributeError: ' + msg));
    const objectClass = function() { return {}; };
    objectClass.__new__ = (cls) => {
      const inst = {};
      if (cls && typeof cls === 'object') {
        for (const [k, v] of Object.entries(cls)) {
          if (['entryPC', 'paramCount', 'localCount', 'restParamIndex', 'name', 'globals'].includes(k)) continue;
          if (typeof v === 'object' && v && v.entryPC !== undefined) {
            inst[k] = { __is_bound__: true, self: inst, fn: v };
          } else if (typeof v === 'function') {
            inst[k] = v.bind ? v.bind(inst) : v;
          } else {
            inst[k] = v;
          }
        }
      }
      return inst;
    };
    this.globals.set('object', objectClass);
    this.globals.set('super', (cls, self) => {
      const currentFrame = this.callStack[this.callStack.length - 1];
      const target = self || (currentFrame && currentFrame.locals[0]);
      return new Proxy(target || {}, {
        get(t, prop) {
          if (prop === '__new__') return (targetCls) => objectClass.__new__(targetCls);
          if (prop === '__init_subclass__') return () => null;
          if (prop === '__init__') return () => null;
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
    this.callStack = [new CallFrame(0, '<main>', 64, this.globals)];
    this.tryStack = [];
    this.pc = 0;
    this.isHalted = false;
    this.instructionCount = 0;
    if (this.terminal) {
      this.terminal.clear();
    }
    this.consoleOutput = '';
    if (!preserveStepMode) {
      this.singleStepMode = false;
    }
  }

  /**
   * Returns a lightweight snapshot of VM state for the UI memory & call stack inspector.
   */
  getExecutionSnapshot() {
    const currentFrame = this.callStack[this.callStack.length - 1];
    const formattedStack = this.operandStack.map(val => this._formatValue(val));
    return {
      pc: this.pc,
      isHalted: this.isHalted,
      instructionCount: this.instructionCount,
      stack: formattedStack,
      operandStack: formattedStack,
      callStack: this.callStack.map(f => ({
        fnName: f.fnName,
        returnPC: f.returnPC,
        locals: (f.locals || []).map(l => this._formatValue(l))
      })),
      currentFrame: currentFrame ? {
        fnName: currentFrame.fnName,
        returnPC: currentFrame.returnPC,
        locals: (currentFrame.locals || []).map(l => this._formatValue(l))
      } : null,
      globals: Array.from(this.globals.keys()).filter(k => !k.startsWith('__')).slice(0, 50)
    };
  }

  _formatValue(val) {
    if (val === null) return 'null';
    if (val === undefined) return 'undefined';
    if (typeof val === 'function') return '[Native Function]';
    if (typeof val === 'object') {
      if (val.entryPC !== undefined) return `[Function ${val.name || 'anon'}]`;
      if (Array.isArray(val)) {
        if (val.length > 5) return `[${val.slice(0, 5).map(x => this._formatValue(x)).join(', ')}, ... (${val.length} items)]`;
        return `[${val.map(x => this._formatValue(x)).join(', ')}]`;
      }
      try {
        const keys = Object.keys(val);
        if (keys.length > 4) {
          return `{ ${keys.slice(0, 4).map(k => `${k}: ${this._formatValue(val[k])}`).join(', ')}, ... }`;
        }
        return JSON.stringify(val);
      } catch {
        return '[Object]';
      }
    }
    if (typeof val === 'string') return JSON.stringify(val);
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

    // Unwind call frames back to the depth where try was registered
    while (this.callStack.length > handler.callStackDepth) {
      this.callStack.pop();
    }
    // Restore operand stack height
    this.operandStack.length = handler.operandStackHeight;

    const errObj = (typeof err === 'object' && err !== null) ? err : new Error(String(err));
    if ((errObj.name === 'Error' || !errObj.name) && typeof errObj.message === 'string') {
      const match = errObj.message.match(/^([A-Za-z0-9_]+Error):/);
      if (match) {
        errObj.name = match[1];
      }
    }
    this.lastException = errObj;

    if (handler.catchPC !== null && handler.catchPC !== undefined && handler.catchPC >= 0) {
      this.operandStack.push(errObj);
      this.pc = handler.catchPC;
      return true;
    } else if (handler.finallyPC !== null && handler.finallyPC !== undefined && handler.finallyPC >= 0) {
      this.pc = handler.finallyPC;
      return true;
    }

    return false;
  }

  /**
   * Appends a chunk to the virtual console/terminal buffer.
   */
  write(chunk) {
    if (chunk === null || chunk === undefined) return;
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
      this.terminal.write(text + '\n');
      this.consoleOutput = this.terminal.getText();
    } else {
      this.consoleOutput += text + '\n';
    }
    if (this.onWrite) {
      this.onWrite(text + '\n', this.consoleOutput);
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
    this.consoleOutput = '';
    if (this.onWrite) {
      this.onWrite('', '');
    }
    if (this.onPrint) {
      this.onPrint('');
    }
  }

  /**
   * Formats a value for console display.
   */
  stringify(val) {
    if (val === null || val === undefined) return 'None';
    if (typeof val === 'boolean') return val ? 'True' : 'False';
    if (val && val.__is_module__) {
      return `<module '${val.__name__ || "module"}'>`;
    }
    if (val instanceof Error || (typeof val === 'object' && val.message !== undefined && val.name !== undefined)) {
      return val.message ? `${val.name}: ${val.message}` : String(val.name);
    }
    if (typeof val === 'object') {
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
    if (val === false || val === null || val === undefined || val === 0 || val === '' || Number.isNaN(val)) {
      return false;
    }
    if (Array.isArray(val)) {
      return val.length > 0;
    }
    if (val instanceof Set || val instanceof Map) {
      return val.size > 0;
    }
    if (typeof val === 'object' && val !== null) {
      if (typeof val.__bool__ === 'function') return Boolean(val.__bool__());
      if (typeof val.__len__ === 'function') return val.__len__() > 0;
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
    if (typeof callee === 'function') {
      return callee(...args);
    }
    if (callee && typeof callee === 'object' && callee.entryPC !== undefined) {
      const subVm = new VirtualMachine({
        moduleManager: this.moduleManager,
        onPrint: (msg) => this.log(msg),
      });
      subVm.globals = callee.globals || this.globals;
      subVm.program = callee.program || this.program;
      subVm.reset();
      const newFrame = new CallFrame(this.program.instructions.length, callee.name || '<function>', callee.localCount || 16, callee.globals || this.globals);
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
      return step.value !== undefined ? step.value : res;
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
    const prevActive = VirtualMachine.activeVM;
    VirtualMachine.activeVM = this;

    try {
      while (!this.isHalted && this.pc < instructions.length) {
      if (this.singleStepMode) {
        yield { type: 'STEP', pc: this.pc };
      } else if (++this.instructionCount % this.timeSliceInterval === 0) {
        yield { type: 'YIELD' };
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
          if (val && typeof val === 'object' && val.entryPC !== undefined) {
            val = { ...val, closureFrame: currentFrame, program: this.program, globals: (currentFrame && currentFrame.globals) || this.globals };
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
          const targetGlobals = (currentFrame && currentFrame.globals) || this.globals;
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
          if (!frame) throw new ReferenceError('UVM ClosureError: enclosing scope destroyed');
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
          if (!frame) throw new ReferenceError('UVM ClosureError: enclosing scope destroyed');
          frame.locals[slot] = this.operandStack.pop();
          break;
        }

        // Arithmetic
        case OP.ADD: {
          const b = this.operandStack.pop();
          const a = this.operandStack.pop();
          if (Array.isArray(a) && Array.isArray(b)) {
            this.operandStack.push([...a, ...b]);
          } else if (typeof a === 'string' && typeof b !== 'string') {
            throw new TypeError(`TypeError: can only concatenate str (not "${typeof b}") to str`);
          } else if (typeof b === 'string' && typeof a !== 'string') {
            throw new TypeError(`TypeError: can only concatenate ${typeof a} (not "str") to ${typeof a}`);
          } else if (Array.isArray(a) && !Array.isArray(b)) {
            throw new TypeError(`TypeError: can only concatenate list (not "${typeof b}") to list`);
          } else {
            this.operandStack.push(a + b);
          }
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
          if (typeof a === 'string' && typeof b === 'number') {
            this.operandStack.push(a.repeat(Math.max(0, Math.floor(b))));
          } else if (typeof b === 'string' && typeof a === 'number') {
            this.operandStack.push(b.repeat(Math.max(0, Math.floor(a))));
          } else if (Array.isArray(a) && typeof b === 'number') {
            const count = Math.max(0, Math.floor(b));
            const rep = [];
            for (let i = 0; i < count; i++) rep.push(...a);
            this.operandStack.push(rep);
          } else if (Array.isArray(b) && typeof a === 'number') {
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
          if (b === 0) throw new RangeError('UVM ZeroDivisionError: division by zero');
          this.operandStack.push(a / b);
          break;
        }

        case OP.IDIV: {
          const b = this.operandStack.pop();
          const a = this.operandStack.pop();
          if (b === 0) throw new RangeError('UVM ZeroDivisionError: integer division by zero');
          this.operandStack.push(Math.floor(a / b));
          break;
        }

        case OP.MOD: {
          const b = this.operandStack.pop();
          const a = this.operandStack.pop();
          if (typeof a === 'string') {
            this.operandStack.push(formatPrintfString(a, b));
            break;
          }
          if (b === 0) throw new RangeError('UVM ZeroDivisionError: integer division by zero');
          // Floored modulo standard: ((a % b) + b) % b
          this.operandStack.push(((a % b) + b) % b);
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
          if (a && typeof a.__matmul__ === 'function') {
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
          if (a && typeof a.__pos__ === 'function') {
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
          this.operandStack.push(pyEquals(a, b));
          break;
        }

        case OP.NEQ: {
          const b = this.operandStack.pop();
          const a = this.operandStack.pop();
          this.operandStack.push(!pyEquals(a, b));
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
          if (b === null || b === undefined) {
            throw new TypeError(`TypeError: argument of type 'NoneType' is not iterable`);
          }
          if (typeof b === 'number' || typeof b === 'boolean') {
            throw new TypeError(`TypeError: argument of type '${typeof b}' is not iterable`);
          }
          if (Array.isArray(b) || typeof b === 'string') {
            this.operandStack.push(b.includes(a));
          } else if (b instanceof Set || b instanceof Map) {
            this.operandStack.push(b.has(a));
          } else if (typeof b === 'object') {
            this.operandStack.push(a in b);
          } else {
            throw new TypeError(`TypeError: argument of type '${typeof b}' is not iterable`);
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
          if (errVal === null || errVal === undefined) {
            errObj = this.lastException || new Error('RuntimeError: No active exception to reraise');
          } else {
            errObj = (typeof errVal === 'object' && errVal !== null) ? errVal : new Error(String(errVal));
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
          } else if (callee && typeof callee === 'object' && callee.__call__) {
            const callFn = callee.__call__;
            if (callFn && callFn.__is_bound__) {
              args.unshift(callFn.self);
              callee = callFn.fn;
            } else {
              args.unshift(callee);
              callee = callFn;
            }
          }

          if (typeof callee === 'function') {
            // Host JavaScript Function Bridge
            let oldOnPrint = null;
            const modVmRef = callee.__uvm_mod_vm__;
            if (modVmRef) {
              oldOnPrint = modVmRef.onPrint;
              modVmRef.onPrint = (msg) => this.log(msg);
            }
            try {
              const result = callee(...args);
              if (result && typeof result.then === 'function') {
                const resolved = yield {
                  type: 'ASYNC_PROMISE',
                  promise: result,
                };
                this.operandStack.push(resolved !== undefined ? resolved : null);
              } else {
                this.operandStack.push(result !== undefined ? result : null);
              }
            } catch (err) {
              console.log('Error calling host/bound fn in frame:', currentFrame?.fnName, 'pc:', this.pc, 'callee:', callee?.name || callee, 'args:', args);
              throw err;
            } finally {
              if (modVmRef) {
                modVmRef.onPrint = oldOnPrint;
              }
            }
          } else if (callee && typeof callee === 'object' && callee.entryPC !== undefined) {
            // Compiled Bytecode Function Call
            const frameGlobals = callee.globals || (currentFrame && currentFrame.globals) || this.globals;
            const newFrame = new CallFrame(this.pc, callee.name || '<function>', callee.localCount || 16, frameGlobals);
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
          } else if (callee && typeof callee === 'object' && callee.__call__) {
            const callFn = callee.__call__;
            if (callFn && callFn.__is_bound__) {
              args.unshift(callFn.self);
              callee = callFn.fn;
            } else {
              args.unshift(callee);
              callee = callFn;
            }
          }

          if (typeof callee === 'function') {
            let oldOnPrint = null;
            const modVmRef = callee.__uvm_mod_vm__;
            if (modVmRef) {
              oldOnPrint = modVmRef.onPrint;
              modVmRef.onPrint = (msg) => this.log(msg);
            }
            try {
              const result = callee(...args);
              this.operandStack.push(result !== undefined ? result : null);
            } finally {
              if (modVmRef) {
                modVmRef.onPrint = oldOnPrint;
              }
            }
          } else if (callee && typeof callee === 'object' && callee.entryPC !== undefined) {
            const frameGlobals = callee.globals || (currentFrame && currentFrame.globals) || this.globals;
            const newFrame = new CallFrame(this.pc, callee.name || '<function>', callee.localCount || 16, frameGlobals);
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
            // Returned from main frame
            this.isHalted = true;
            this.operandStack.push(retVal !== undefined ? retVal : null);
            return retVal;
          }

          this.pc = finishedFrame.returnPC;
          this.operandStack.push(retVal !== undefined ? retVal : null);
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
          if (target && typeof target === 'object' && src && typeof src === 'object') {
            Object.assign(target, src);
          }
          this.operandStack.push(target);
          break;
        }

        case OP.GET_INDEX: {
          const idx = this.operandStack.pop();
          const obj = this.operandStack.pop();
          if (obj === null || obj === undefined) {
            throw new TypeError("'NoneType' object is not subscriptable");
          }
          if (obj && typeof obj === 'object' && !Array.isArray(obj) && obj.__getitem__) {
            const itemFn = obj.__getitem__;
            const res = itemFn.__is_bound__ ? this.callCallable(itemFn, idx) : this.callCallable(itemFn, obj, idx);
            this.operandStack.push(res);
            break;
          }
          if (Array.isArray(obj)) {
            if (typeof idx !== 'number' || !Number.isInteger(idx)) {
              throw new TypeError("list indices must be integers or slices, not " + typeof idx);
            }
            let resolvedIdx = idx < 0 ? obj.length + idx : idx;
            if (resolvedIdx < 0 || resolvedIdx >= obj.length) {
              const err = new RangeError("IndexError: list index out of range");
              err.name = "IndexError";
              throw err;
            }
            this.operandStack.push(obj[resolvedIdx]);
            break;
          }
          if (typeof obj === 'string') {
            if (typeof idx !== 'number' || !Number.isInteger(idx)) {
              throw new TypeError("string indices must be integers, not " + typeof idx);
            }
            let resolvedIdx = idx < 0 ? obj.length + idx : idx;
            if (resolvedIdx < 0 || resolvedIdx >= obj.length) {
              const err = new RangeError("IndexError: string index out of range");
              err.name = "IndexError";
              throw err;
            }
            this.operandStack.push(obj[resolvedIdx]);
            break;
          }
          if (typeof obj === 'object') {
            if (!(idx in obj)) {
              const err = new Error(`KeyError: ${JSON.stringify(idx)}`);
              err.name = "KeyError";
              throw err;
            }
            this.operandStack.push(obj[idx]);
            break;
          }
          throw new TypeError(`'${typeof obj}' object is not subscriptable`);
        }

        case OP.SET_INDEX: {
          const val = this.operandStack.pop();
          const idx = this.operandStack.pop();
          const obj = this.operandStack.pop();
          if (obj === null || obj === undefined) {
            throw new TypeError("'NoneType' object does not support item assignment");
          }
          if (typeof obj === 'string') {
            throw new TypeError("'str' object does not support item assignment");
          }
          if (obj && typeof obj === 'object' && !Array.isArray(obj) && obj.__setitem__) {
            const setFn = obj.__setitem__;
            if (setFn.__is_bound__) {
              this.callCallable(setFn, idx, val);
            } else {
              this.callCallable(setFn, obj, idx, val);
            }
            this.operandStack.push(val);
            break;
          }
          if (Array.isArray(obj)) {
            if (typeof idx !== 'number' || !Number.isInteger(idx)) {
              throw new TypeError("list indices must be integers or slices, not " + typeof idx);
            }
            let resolvedIdx = idx < 0 ? obj.length + idx : idx;
            if (resolvedIdx < 0 || resolvedIdx >= obj.length) {
              const err = new RangeError("IndexError: list assignment index out of range");
              err.name = "IndexError";
              throw err;
            }
            obj[resolvedIdx] = val;
            this.operandStack.push(val);
            break;
          }
          if (typeof obj === 'object') {
            obj[idx] = val;
            this.operandStack.push(val);
            break;
          }
          throw new TypeError(`'${typeof obj}' object does not support item assignment`);
        }

        case OP.GET_MEMBER: {
          const propIdx = instructions[this.pc++];
          const prop = constants[propIdx];
          const obj = this.operandStack.pop();
          const val = resolveMember(obj, prop);
          this.operandStack.push(val !== undefined ? val : null);
          break;
        }

        case OP.SET_MEMBER: {
          const propIdx = instructions[this.pc++];
          const prop = constants[propIdx];
          const val = this.operandStack.pop();
          const obj = this.operandStack.pop();
          if (obj === null || obj === undefined) {
            throw new TypeError(`UVM TypeError: cannot set property '${prop}' on null/undefined`);
          }
          obj[prop] = val;
          this.operandStack.push(val);
          break;
        }

        case OP.IMPORT: {
          const nameIdx = instructions[this.pc++];
          const name = constants[nameIdx];
          const mm = this.moduleManager || VirtualMachine.defaultModuleManager;
          if (!mm) {
            throw new Error(`UVM ImportError: no ModuleManager configured on VM for '${name}'`);
          }
          let mod;
          if (mm.hasModule && mm.hasModule(name)) {
            mod = mm.getOrLoad(name, this);
          } else {
            mod = yield {
              type: 'ASYNC_IMPORT',
              moduleName: name,
              vm: this,
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
          if (mod && typeof mod === 'object') {
            const targetGlobals = currentFrame ? currentFrame.globals : this.globals;
            if (Array.isArray(mod.__all__)) {
              for (const name of mod.__all__) {
                if (mod[name] !== undefined) {
                  targetGlobals.set(name, mod[name]);
                }
              }
            } else {
              for (const [k, v] of Object.entries(mod)) {
                if (!k.startsWith('_') && k !== '__is_module__' && k !== '__name__') {
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
              const text = (arg === null || arg === undefined) ? '' : this.stringify(arg);
              this.log(text);
              this.operandStack.push(null);
              break;
            }

            case SYSCALL.INPUT: {
              const promptArg = this.operandStack.pop();
              const promptText = promptArg !== null && promptArg !== undefined ? this.stringify(promptArg) : '';
              // Suspend fiber and wait for user input from host environment
              const userInput = yield {
                type: 'SUSPEND_FOR_INPUT',
                prompt: promptText
              };
              this.operandStack.push(userInput !== undefined && userInput !== null ? String(userInput) : '');
              break;
            }

            case SYSCALL.SLEEP: {
              const duration = Number(this.operandStack.pop()) || 0;
              // Suspend fiber until duration expires
              yield {
                type: 'SLEEP',
                duration: duration
              };
              this.operandStack.push(null);
              break;
            }

            case SYSCALL.TIME: {
              this.operandStack.push(typeof performance !== 'undefined' ? performance.now() : Date.now());
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
              if (val === null || val === undefined) {
                this.operandStack.push(0);
              } else if (typeof val === 'string' || Array.isArray(val)) {
                this.operandStack.push(val.length);
              } else if (typeof val === 'object') {
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
      VirtualMachine.activeVM = prevActive;
    }

    const top = this.operandStack[this.operandStack.length - 1];
    return top !== undefined ? top : null;
  }
}

VirtualMachine.defaultModuleManager = null;
VirtualMachine.activeVM = null;

