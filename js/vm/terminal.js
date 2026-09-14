// File: js/vm/terminal.js
/**
 * Lightweight Zero-Dependency Virtual Terminal Buffer
 * Manages an in-memory 2D character/line grid to support:
 * - Line overwriting via carriage return ('\r')
 * - Backspace ('\b')
 * - Screen clearing ('\x1b[2J', '\x1b[H') and line clearing ('\x1b[2K', '\x1b[K')
 * - Cursor movements and ANSI color code stripping
 */

export class VirtualTerminal {
  constructor(options = {}) {
    this.maxLines = options.maxLines || 5000;
    this.onUpdate = options.onUpdate || null;
    this.clear();
  }

  /**
   * Resets terminal buffer and cursor.
   */
  clear() {
    this.lines = [''];
    this.cursorRow = 0;
    this.cursorCol = 0;
    if (this.onUpdate) this.onUpdate(this.getText());
  }

  /**
   * Writes a chunk of text through the terminal control processor.
   */
  write(chunk) {
    if (chunk === null || chunk === undefined) return;
    const str = String(chunk);
    let i = 0;

    while (i < str.length) {
      // 1. Check for ANSI Escape Sequences (\x1b[ or \033[)
      if (str[i] === '\x1b' && str[i + 1] === '[') {
        const match = str.slice(i).match(/^\x1b\[([?0-9;]*)([a-zA-Z])/);
        if (match) {
          const fullSeq = match[0];
          const rawParams = match[1];
          const cmd = match[2];
          const params = rawParams ? rawParams.replace(/^\?/, '').split(';').map(p => parseInt(p, 10)) : [];

          this._handleAnsiCsi(cmd, params);
          i += fullSeq.length;
          continue;
        } else {
          // Unrecognized or partial escape, advance past escape char
          i++;
          continue;
        }
      }

      // 1b. Check for OSC Sequences (\x1b] ... BEL or ST)
      if (str[i] === '\x1b' && str[i + 1] === ']') {
        const oscMatch = str.slice(i).match(/^\x1b\].*?(\x07|\x1b\\)/);
        if (oscMatch) {
          i += oscMatch[0].length;
          continue;
        }
      }

      // 2. Carriage Return (\r): Reset cursor to start of current row (column 0)
      if (str[i] === '\r') {
        if (str[i + 1] === '\n') {
          // Standard CRLF
          this._newLine();
          i += 2;
        } else {
          // Standalone CR (move cursor to column 0 of current line for in-place overwrite)
          this.cursorCol = 0;
          i++;
        }
        continue;
      }

      // 3. Line Feed (\n)
      if (str[i] === '\n') {
        this._newLine();
        i++;
        continue;
      }

      // 4. Backspace (\b)
      if (str[i] === '\b') {
        if (this.cursorCol > 0) {
          this.cursorCol--;
        }
        i++;
        continue;
      }

      // 5. Tab (\t): Advance to next 4-space tabstop
      if (str[i] === '\t') {
        const tabSize = 4;
        const nextCol = (Math.floor(this.cursorCol / tabSize) + 1) * tabSize;
        while (this.cursorCol < nextCol) {
          this._writeChar(' ');
        }
        i++;
        continue;
      }

      // 6. Regular printable character
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
      this.lines.push('');
    }
    // Limit memory retention to maxLines
    if (this.lines.length > this.maxLines) {
      const dropCount = this.lines.length - this.maxLines;
      this.lines.splice(0, dropCount);
      this.cursorRow = Math.max(0, this.cursorRow - dropCount);
    }
  }

  _writeChar(ch) {
    while (this.lines.length <= this.cursorRow) {
      this.lines.push('');
    }
    let curLine = this.lines[this.cursorRow];
    if (this.cursorCol > curLine.length) {
      curLine = curLine.padEnd(this.cursorCol, ' ');
    }
    this.lines[this.cursorRow] = curLine.slice(0, this.cursorCol) + ch + curLine.slice(this.cursorCol + 1);
    this.cursorCol++;
  }

  _handleAnsiCsi(cmd, params) {
    const p1 = params[0] !== undefined && !isNaN(params[0]) ? params[0] : 0;
    const p2 = params[1] !== undefined && !isNaN(params[1]) ? params[1] : 0;

    switch (cmd) {
      case 'J': // Erase in display
        if (p1 === 2 || p1 === 3) {
          // Clear entire screen & reset cursor
          this.lines = [''];
          this.cursorRow = 0;
          this.cursorCol = 0;
        } else if (p1 === 0) {
          // Clear from cursor down
          if (this.cursorRow < this.lines.length) {
            this.lines[this.cursorRow] = (this.lines[this.cursorRow] || '').slice(0, this.cursorCol);
            this.lines = this.lines.slice(0, this.cursorRow + 1);
          }
        }
        break;

      case 'K': // Erase in line
        while (this.lines.length <= this.cursorRow) this.lines.push('');
        if (p1 === 2) {
          // Clear entire line
          this.lines[this.cursorRow] = '';
          this.cursorCol = 0;
        } else if (p1 === 1) {
          // Clear from beginning to cursor
          const rest = (this.lines[this.cursorRow] || '').slice(this.cursorCol);
          this.lines[this.cursorRow] = ' '.repeat(this.cursorCol) + rest;
        } else {
          // Clear from cursor to end of line (default)
          this.lines[this.cursorRow] = (this.lines[this.cursorRow] || '').slice(0, this.cursorCol);
        }
        break;

      case 'H':
      case 'f': // Cursor Position
        const targetRow = Math.max(0, (p1 || 1) - 1);
        const targetCol = Math.max(0, (p2 || 1) - 1);
        this.cursorRow = targetRow;
        this.cursorCol = targetCol;
        while (this.lines.length <= this.cursorRow) this.lines.push('');
        break;

      case 'A': // Cursor Up
        this.cursorRow = Math.max(0, this.cursorRow - (p1 || 1));
        break;

      case 'B': // Cursor Down
        this.cursorRow += (p1 || 1);
        while (this.lines.length <= this.cursorRow) this.lines.push('');
        break;

      case 'C': // Cursor Forward
        this.cursorCol += (p1 || 1);
        break;

      case 'D': // Cursor Back
        this.cursorCol = Math.max(0, this.cursorCol - (p1 || 1));
        break;

      case 'm': // SGR Color & Styling (stripped for plain-text presentation)
        break;

      default:
        break;
    }
  }

  /**
   * Returns current terminal buffer as formatted text.
   */
  getText() {
    return this.lines.join('\n');
  }
}
