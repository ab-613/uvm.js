// File: js/frontend/python_preprocessor.js
/**
 * Python Indentation Preprocessor
 * Converts Python whitespace-indented blocks into explicit brace blocks ({ ... })
 * and handles statement terminators while respecting multi-line brackets.
 * Also desugars f-strings (f"...") into string concatenation expressions.
 */

function unescapeFStringLiteral(str) {
  return str.replace(/\\([abfnrtv'"\\]|x[0-9a-fA-F]{2}|u[0-9a-fA-F]{4}|U[0-9a-fA-F]{8}|[0-7]{1,3})/g, (match, esc) => {
    switch (esc[0]) {
      case 'a': return '\x07';
      case 'b': return '\b';
      case 'f': return '\f';
      case 'n': return '\n';
      case 'r': return '\r';
      case 't': return '\t';
      case 'v': return '\v';
      case "'": return "'";
      case '"': return '"';
      case '\\': return '\\';
      case 'x': return String.fromCharCode(parseInt(esc.slice(1), 16));
      case 'u': return String.fromCharCode(parseInt(esc.slice(1), 16));
      case 'U': return String.fromCodePoint(parseInt(esc.slice(1), 16));
      default:
        if (/^[0-7]{1,3}$/.test(esc)) {
          return String.fromCharCode(parseInt(esc, 8));
        }
        return match;
    }
  });
}

function transformFStrings(line) {
  let result = '';
  let i = 0;
  while (i < line.length) {
    // 1. Regular string literals (not f-strings) must be preserved verbatim
    if (line[i] === '"' || line[i] === "'") {
      const quote = line[i];
      result += quote;
      i++;
      while (i < line.length) {
        if (line[i] === '\\' && i + 1 < line.length) {
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

    // 2. Non-format prefixed strings (r"...", b"...", u"...")
    const prevChar = i > 0 ? line[i - 1] : '';
    const isWordChar = /[a-zA-Z0-9_]/.test(prevChar);
    if (!isWordChar && (line[i] === 'r' || line[i] === 'R' || line[i] === 'b' || line[i] === 'B' || line[i] === 'u' || line[i] === 'U') && i + 1 < line.length && (line[i + 1] === '"' || line[i + 1] === "'")) {
      const pfx = line[i];
      const quote = line[i + 1];
      result += pfx + quote;
      i += 2;
      while (i < line.length) {
        if (line[i] === '\\' && i + 1 < line.length) {
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

    // 3. F-string literals (f"...", f'...', fr"...", rf"...")
    let isFString = false;
    let prefixLen = 0;
    if (!isWordChar) {
      if ((line[i] === 'f' || line[i] === 'F') && i + 1 < line.length && (line[i + 1] === '"' || line[i + 1] === "'")) {
        isFString = true;
        prefixLen = 1;
      } else if (i + 2 < line.length && (
        ((line[i] === 'f' || line[i] === 'F') && (line[i + 1] === 'r' || line[i + 1] === 'R')) ||
        ((line[i] === 'r' || line[i] === 'R') && (line[i + 1] === 'f' || line[i + 1] === 'F'))
      ) && (line[i + 2] === '"' || line[i + 2] === "'")) {
        isFString = true;
        prefixLen = 2;
      }
    }

    if (isFString) {
      const isRawFString = prefixLen === 2;
      const quote = line[i + prefixLen];
      let j = i + prefixLen + 1;
      let rawContent = '';
      let closed = false;
      while (j < line.length) {
        if (line[j] === '\\' && j + 1 < line.length) {
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

      // Handle escaped braces: {{ -> \u0001, }} -> \u0002
      const processed = rawContent.replaceAll('{{', '\u0001').replaceAll('}}', '\u0002');
      const parts = [];
      let lastIdx = 0;
      let k = 0;
      while (k < processed.length) {
        if (processed[k] === '{') {
          if (k > lastIdx) {
            const literalText = processed.substring(lastIdx, k).replaceAll('\u0001', '{').replaceAll('\u0002', '}');
            const unescaped = isRawFString ? literalText : unescapeFStringLiteral(literalText);
            parts.push(JSON.stringify(unescaped));
          }
          let depth = 1;
          let m = k + 1;
          while (m < processed.length && depth > 0) {
            if (processed[m] === '{') depth++;
            else if (processed[m] === '}') depth--;
            m++;
          }
          const inside = processed.substring(k + 1, m - 1).trim();

          // Scan inside for ':' (format specifier) or '!' (conversion) outside nested delimiters
          let depthParen = 0;
          let depthBracket = 0;
          let depthBrace = 0;
          let inQuote = null;
          let colonIdx = -1;
          let exclamIdx = -1;

          for (let p = 0; p < inside.length; p++) {
            const ch = inside[p];
            if (inQuote) {
              if (ch === '\\') p++;
              else if (ch === inQuote) inQuote = null;
              continue;
            }
            if (ch === '"' || ch === "'") {
              inQuote = ch;
            } else if (ch === '(') depthParen++;
            else if (ch === ')') depthParen--;
            else if (ch === '[') depthBracket++;
            else if (ch === ']') depthBracket--;
            else if (ch === '{') depthBrace++;
            else if (ch === '}') depthBrace--;
            else if (depthParen === 0 && depthBracket === 0 && depthBrace === 0) {
              if (ch === ':' && colonIdx === -1) {
                colonIdx = p;
                break;
              } else if (ch === '!' && exclamIdx === -1) {
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

          let prefix = '';
          const trimmedExpr = exprPart.trim();
          if (trimmedExpr.endsWith('=')) {
            prefix = JSON.stringify(inside.substring(0, colonIdx !== -1 ? colonIdx : inside.length) + ' ');
            exprPart = trimmedExpr.slice(0, -1).trim();
          }

          let valExpr = '';
          if (formatSpec !== null) {
            valExpr = `__format(${exprPart}, ${JSON.stringify(formatSpec)})`;
          } else if (conversion === 'r') {
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
        const literalText = processed.substring(lastIdx).replaceAll('\u0001', '{').replaceAll('\u0002', '}');
        const unescaped = isRawFString ? literalText : unescapeFStringLiteral(literalText);
        parts.push(JSON.stringify(unescaped));
      }

      if (parts.length === 0) {
        result += '""';
      } else if (parts.length === 1 && parts[0].startsWith('"')) {
        result += parts[0];
      } else {
        result += '(' + parts.join(' + ') + ')';
      }

      i = j;
    } else {
      result += line[i];
      i++;
    }
  }
  return result;
}

export function normalizePythonSource(src) {
  let result = '';
  let i = 0;
  let bracketDepth = 0;

  function checkAdjacentString(endIdx) {
    let k = endIdx;
    while (k < src.length) {
      if (src[k] === ' ' || src[k] === '\t') {
        k++;
      } else if (src[k] === '#' && bracketDepth > 0) {
        while (k < src.length && src[k] !== '\n') k++;
      } else if ((src[k] === '\n' || (src[k] === '\r' && src[k + 1] === '\n')) && bracketDepth > 0) {
        if (src[k] === '\r') k += 2; else k++;
      } else if (src[k] === '\\' && (src[k + 1] === '\n' || (src[k + 1] === '\r' && src[k + 2] === '\n'))) {
        k += (src[k + 1] === '\r') ? 3 : 2;
      } else {
        break;
      }
    }
    let nextP = k;
    while (nextP < src.length && 'rRbBuUfF'.includes(src[nextP])) nextP++;
    if (nextP < src.length && (src[nextP] === '"' || src[nextP] === "'")) {
      return k;
    }
    return -1;
  }

  while (i < src.length) {
    const ch = src[i];

    // Track brackets for multi-line context
    if (ch === '(' || ch === '[' || ch === '{') bracketDepth++;
    else if (ch === ')' || ch === ']' || ch === '}') {
      if (bracketDepth > 0) bracketDepth--;
    }

    // Single-line comment # ...
    if (ch === '#') {
      let j = i;
      while (j < src.length && src[j] !== '\n') j++;
      result += src.substring(i, j);
      i = j;
      continue;
    }

    // Line continuation backslash \ followed by newline
    if (ch === '\\') {
      let j = i + 1;
      while (j < src.length && (src[j] === ' ' || src[j] === '\t')) j++;
      if (src[j] === '\n') {
        result += ' ';
        i = j + 1;
        continue;
      } else if (src[j] === '\r' && src[j + 1] === '\n') {
        result += ' ';
        i = j + 2;
        continue;
      }
    }

    // Check for string prefix (r, b, u, f, etc.)
    let p = i;
    let isRaw = false;
    let isFormat = false;
    while (p < src.length && 'rRbBuUfF'.includes(src[p])) {
      if (src[p] === 'r' || src[p] === 'R') isRaw = true;
      if (src[p] === 'f' || src[p] === 'F') isFormat = true;
      p++;
    }

    // Check if followed by triple quote
    if (src.startsWith('"""', p) || src.startsWith("'''", p)) {
      const delim = src.startsWith('"""', p) ? '"""' : "'''";
      const start = p + 3;
      let j = start;
      let closed = false;
      while (j < src.length) {
        if (src[j] === '\\') {
          j += 2;
        } else if (src.startsWith(delim, j)) {
          closed = true;
          break;
        } else {
          j++;
        }
      }
      const raw = src.substring(start, j);
      const prefix = (isRaw && isFormat) ? 'fr' : isFormat ? 'f' : isRaw ? 'r' : '';
      result += prefix + JSON.stringify(raw);
      const endIdx = closed ? j + 3 : j;
      const nextStr = checkAdjacentString(endIdx);
      if (nextStr !== -1) {
        result += ' + ';
        i = nextStr;
      } else {
        i = endIdx;
      }
      continue;
    }

    // Check if raw single-line string r"..." or r'...'
    if (isRaw && !isFormat && (src[p] === '"' || src[p] === "'")) {
      const quote = src[p];
      let j = p + 1;
      let rawVal = '';
      while (j < src.length && src[j] !== '\n') {
        if (src[j] === '\\' && j + 1 < src.length) {
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
        result += ' + ';
        i = nextStr;
      } else {
        i = j;
      }
      continue;
    }

    // Regular single-line string "..." or '...'
    if (ch === '"' || ch === "'") {
      const quote = ch;
      let j = i + 1;
      while (j < src.length && src[j] !== '\n') {
        if (src[j] === '\\' && j + 1 < src.length) {
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
        result += ' + ';
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

export function preprocessPython(rawSrc) {
  if (!rawSrc || typeof rawSrc !== 'string') return '';
  const src = normalizePythonSource(rawSrc);
  const lines = src.split('\n');
  const indentStack = [0];
  const out = [];
  let bracketDepth = 0;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    
    // Strip comments unless inside quotes
    let line = rawLine;
    let inSingle = false;
    let inDouble = false;
    let commentIdx = -1;

    for (let c = 0; c < line.length; c++) {
      const char = line[c];
      if (char === '\\' && (inSingle || inDouble)) {
        c++;
        continue;
      }
      if (char === "'" && !inDouble) inSingle = !inSingle;
      else if (char === '"' && !inSingle) inDouble = !inDouble;
      else if (char === '#' && !inSingle && !inDouble) {
        commentIdx = c;
        break;
      }
    }

    if (commentIdx !== -1) {
      line = line.substring(0, commentIdx);
    }

    // Transform f-strings
    line = transformFStrings(line);

    const trimmed = line.trim();
    if (!trimmed) {
      continue; // Skip blank or comment-only lines
    }

    // Count bracket depth change for this line (outside quotes)
    let lineBrackets = 0;
    inSingle = false;
    inDouble = false;
    for (let c = 0; c < trimmed.length; c++) {
      const char = trimmed[c];
      if (char === '\\' && (inSingle || inDouble)) {
        c++;
        continue;
      }
      if (char === "'" && !inDouble) inSingle = !inSingle;
      else if (char === '"' && !inSingle) inDouble = !inDouble;
      else if (!inSingle && !inDouble) {
        if (char === '(' || char === '[' || char === '{') lineBrackets++;
        else if (char === ')' || char === ']' || char === '}') lineBrackets--;
      }
    }

    // Only process indentation if we are NOT inside brackets
    if (bracketDepth === 0) {
      let indent = 0;
      while (indent < line.length && (line[indent] === ' ' || line[indent] === '\t')) {
        indent += (line[indent] === '\t' ? 4 : 1);
      }

      const currentIndent = indentStack[indentStack.length - 1];

      if (indent > currentIndent) {
        indentStack.push(indent);
        out.push('{\n');
      } else if (indent < currentIndent) {
        while (indentStack.length > 1 && indent < indentStack[indentStack.length - 1]) {
          indentStack.pop();
          out.push('}\n');
        }
        if (indent !== indentStack[indentStack.length - 1]) {
          throw new Error(`IndentationError: line ${i + 1}: unindent does not match any outer indentation level`);
        }
      }
    }

    bracketDepth += lineBrackets;
    if (bracketDepth < 0) bracketDepth = 0;

    if (trimmed.endsWith(';') || trimmed.endsWith(':') || trimmed.startsWith('@')) {
      out.push(trimmed + '\n');
    } else if (bracketDepth > 0) {
      out.push(trimmed + ' ');
    } else {
      out.push(trimmed + ';\n');
    }
  }

  while (indentStack.length > 1) {
    indentStack.pop();
    out.push('}\n');
  }

  return out.join('');
}
