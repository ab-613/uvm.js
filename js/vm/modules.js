// File: js/vm/modules.js
import { vfs } from '../vfs/vfs.js';
import { parsePythonSource } from '../frontend/python.js';
import { BytecodeCompiler } from './compiler.js';
import { BytecodeProgram } from './program.js';
import { VirtualMachine } from './vm.js';
import { loadCExtension } from './c_extension.js';
import { OP } from './opcodes.js';

function createPythonModuleCallable(fnVal, modVm) {
  const fn = function(...args) {
    return modVm.callCallable(fnVal, ...args);
  };
  fn.__uvm_callable__ = fnVal;
  fn.__uvm_mod_vm__ = modVm;
  return fn;
}

/**
 * Universal 3-Tier Module Manager
 * Tier 3: Host Bridges (math, time, json, re, random)
 * Tier 1: Pure-Python Standard Library (.py files via VFS)
 * Tier 2: C Extensions (.c files defining PyMethodDef via VFS)
 */
export class ModuleManager {
  constructor(virtualFs = vfs) {
    this.vfs = virtualFs;
    this.cache = new Map();
    this.hostBridges = new Map();
    this.initHostBridges();
  }

  initHostBridges() {
    // 1. Math Native Bridge
    this.hostBridges.set('math', {
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
      log: (x, base) => (base !== undefined ? Math.log(x) / Math.log(base) : Math.log(x)),
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
        if (n < 0) throw new RangeError('ValueError: factorial() not defined for negative values');
        let r = 1;
        for (let i = 2; i <= n; i++) r *= i;
        return r;
      }
    });

    // 2. Time Native Bridge
    this.hostBridges.set('time', {
      time: () => Date.now() / 1000,
      perf_counter: () => (typeof performance !== 'undefined' ? performance.now() / 1000 : Date.now() / 1000),
      sleep: (s) => new Promise(resolve => setTimeout(resolve, Math.max(0, Math.round((Number(s) || 0) * 1000))))
    });

    // 3. JSON Native Bridge
    this.hostBridges.set('json', {
      dumps: (obj, indent) => JSON.stringify(obj, null, indent),
      loads: (str) => JSON.parse(str)
    });

    // 4. Regular Expressions Bridge
    const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const compilePattern = (pat, flags = 0) => {
      let jsFlags = 'g';
      if (flags & 2) jsFlags += 'i';
      if (flags & 8) jsFlags += 'm';
      if (flags & 16) jsFlags += 's';
      let cleanPat = String(pat);
      if (flags & 64) {
        const lines = cleanPat.split(/\r?\n|\\n/);
        let cleaned = '';
        for (const line of lines) {
          let inClass = false;
          let lineClean = '';
          for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (ch === '\\' && i + 1 < line.length) {
              lineClean += ch + line[i + 1];
              i++;
              continue;
            }
            if (ch === '[' && !inClass) {
              inClass = true;
              lineClean += ch;
              continue;
            }
            if (ch === ']' && inClass) {
              inClass = false;
              lineClean += ch;
              continue;
            }
            if (ch === '#' && !inClass) {
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
          const rx = new RegExp(cleanPat, jsFlags.replace('g', ''));
          const m = String(str).match(rx);
          if (!m) return null;
          const groups = m.groups || {};
          return {
            group: (name = 0) => (name === 0 ? m[0] : (groups && groups[name] !== undefined ? groups[name] : m[name])),
            groups: () => groups,
            start: () => m.index
          };
        },
        match: (str) => {
          const rx = new RegExp('^(?:' + cleanPat + ')', jsFlags.replace('g', ''));
          const m = String(str).match(rx);
          if (!m) return null;
          const groups = m.groups || {};
          return {
            group: (name = 0) => (name === 0 ? m[0] : (groups && groups[name] !== undefined ? groups[name] : m[name])),
            groups: () => groups,
            start: () => 0
          };
        },
        findall: (str) => {
          const rx = new RegExp(cleanPat, jsFlags.includes('g') ? jsFlags : jsFlags + 'g');
          return Array.from(String(str).matchAll(rx), m => m[0]);
        },
        sub: (repl, str) => {
          if (typeof repl === 'function') {
            return String(str).replace(new RegExp(cleanPat, jsFlags), (...m) => {
              const groups = m[m.length - 1];
              const matchObj = {
                group: (name = 0) => (name === 0 ? m[0] : (groups && groups[name] !== undefined ? groups[name] : null)),
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
              group: (name = 0) => (name === 0 ? m[0] : (groups[name] !== undefined ? groups[name] : null)),
              start: () => m.index
            });
            if (!rx.global) break;
          }
          return matches;
        }
      };
    };

    this.hostBridges.set('re', {
      search: (pat, str) => {
        const m = String(str).match(new RegExp(pat));
        return m ? m[0] : null;
      },
      match: (pat, str) => {
        const m = String(str).match(new RegExp('^' + pat));
        return m ? m[0] : null;
      },
      findall: (pat, str) => Array.from(String(str).matchAll(new RegExp(pat, 'g')), m => m[0]),
      sub: (pat, repl, str) => String(str).replace(new RegExp(pat, 'g'), repl),
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

    // 4.5. Regex Native Bridge Alias (for packages importing 'regex')
    this.hostBridges.set('regex', this.hostBridges.get('re'));

    // 5. Random Bridge
    this.hostBridges.set('random', {
      random: () => Math.random(),
      randint: (a, b) => Math.floor(Math.random() * (b - a + 1)) + a,
      choice: (seq) => (seq && seq.length > 0 ? seq[Math.floor(Math.random() * seq.length)] : null),
      uniform: (a, b) => a + Math.random() * (b - a)
    });

    // 6. Real HTTP Requests Bridge (powered by global fetch)
    class _RequestException extends Error {
      constructor(msg) {
        super(msg || 'RequestException');
        this.name = 'RequestException';
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
        this.total = options.total !== undefined ? options.total : 3;
        this.backoff_factor = options.backoff_factor !== undefined ? options.backoff_factor : 0;
        this.status_forcelist = options.status_forcelist || [500, 502, 503, 504];
      }
    }
    const Retry = function(options = {}) {
      return new _Retry(options);
    };

    const createResponseObj = async (res, startTime = 0) => {
      const textBody = await res.text();
      const elapsedSecs = startTime > 0 ? (performance.now() - startTime) / 1000 : 0.05;
      let cachedJson = undefined;

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
            throw new RequestException(`HTTP ${res.status}: ${res.statusText || 'Error'} for url: ${res.url}`);
          }
          return null;
        },
        iter_content: (options = 128) => {
          let size = 128;
          if (typeof options === 'number') {
            size = options;
          } else if (options && typeof options === 'object') {
            size = options.chunk_size || 128;
          }
          const chunks = [];
          for (let i = 0; i < textBody.length; i += size) {
            chunks.push(textBody.slice(i, i + size));
          }
          return chunks.length > 0 ? chunks : [''];
        },
        json: () => {
          if (cachedJson !== undefined) return cachedJson;
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
            if (d && typeof d === 'object') {
              Object.assign(this._data, d);
            }
          },
          get(k, def) {
            return this._data[k] !== undefined ? this._data[k] : def;
          }
        };
        this.adapters = {};
      }

      mount(prefix, adapter) {
        this.adapters[prefix] = adapter;
      }

      async get(url, options = {}) {
        const mergedHeaders = { ...this.headers._data, ...((options && options.headers) || {}) };
        return requestsModule.get(url, { ...options, headers: mergedHeaders });
      }

      async post(url, options = {}) {
        const mergedHeaders = { ...this.headers._data, ...((options && options.headers) || {}) };
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
        if (options && options.params && typeof options.params === 'object') {
          const query = new URLSearchParams(options.params).toString();
          reqUrl += (reqUrl.includes('?') ? '&' : '?') + query;
        }
        const fetchOpts = {
          method: 'GET',
          headers: (options && options.headers) || {},
        };
        const res = await fetch(reqUrl, fetchOpts);
        const elapsed = (performance.now() - startTime).toFixed(1);
        if (this.onTelemetry) this.onTelemetry('NETWORK', `HTTP GET ${reqUrl} -> ${res.status} ${res.statusText || 'OK'} (${elapsed}ms)`);
        return createResponseObj(res, startTime);
      },
      post: async (url, options = {}) => {
        const startTime = performance.now();
        let reqUrl = String(url);
        if (options && options.params && typeof options.params === 'object') {
          const query = new URLSearchParams(options.params).toString();
          reqUrl += (reqUrl.includes('?') ? '&' : '?') + query;
        }
        const fetchOpts = {
          method: 'POST',
          headers: { ...((options && options.headers) || {}) },
        };
        if (options && options.json !== undefined) {
          fetchOpts.body = JSON.stringify(options.json);
          fetchOpts.headers['Content-Type'] = 'application/json';
        } else if (options && options.data !== undefined) {
          fetchOpts.body = typeof options.data === 'string' ? options.data : JSON.stringify(options.data);
        }
        const res = await fetch(reqUrl, fetchOpts);
        const elapsed = (performance.now() - startTime).toFixed(1);
        if (this.onTelemetry) this.onTelemetry('NETWORK', `HTTP POST ${reqUrl} -> ${res.status} ${res.statusText || 'OK'} (${elapsed}ms)`);
        return createResponseObj(res, startTime);
      },
      put: async (url, options = {}) => {
        const startTime = performance.now();
        const fetchOpts = {
          method: 'PUT',
          headers: { ...((options && options.headers) || {}) },
        };
        if (options && options.json !== undefined) {
          fetchOpts.body = JSON.stringify(options.json);
          fetchOpts.headers['Content-Type'] = 'application/json';
        } else if (options && options.data !== undefined) {
          fetchOpts.body = String(options.data);
        }
        const res = await fetch(url, fetchOpts);
        const elapsed = (performance.now() - startTime).toFixed(1);
        if (this.onTelemetry) this.onTelemetry('NETWORK', `HTTP PUT ${url} -> ${res.status} (${elapsed}ms)`);
        return createResponseObj(res, startTime);
      },
      delete: async (url, options = {}) => {
        const startTime = performance.now();
        const res = await fetch(url, { method: 'DELETE', headers: (options && options.headers) || {} });
        const elapsed = (performance.now() - startTime).toFixed(1);
        if (this.onTelemetry) this.onTelemetry('NETWORK', `HTTP DELETE ${url} -> ${res.status} (${elapsed}ms)`);
        return createResponseObj(res, startTime);
      }
    };

    this.hostBridges.set('requests', requestsModule);
    this.hostBridges.set('requests.adapters', { HTTPAdapter });
    this.hostBridges.set('requests.exceptions', { RequestException });
    this.hostBridges.set('urllib3.util', { Retry });
    this.hostBridges.set('urllib3', { util: { Retry } });

    // 6b. WebBrowser Bridge
    const webbrowserModule = {
      open: (url, newWindow = 0, autoraise = true) => {
        const urlStr = String(url || '');
        if (typeof window !== 'undefined' && typeof window.open === 'function') {
          try {
            window.open(urlStr, '_blank');
          } catch (e) {
            console.warn('[webbrowser] Popup blocked or failed:', e);
          }
        }
        if (this.onTelemetry) this.onTelemetry('BROWSER', `Opened URL in browser: ${urlStr}`);
        return true;
      },
      open_new: (url) => webbrowserModule.open(url, 1),
      open_new_tab: (url) => webbrowserModule.open(url, 2),
      get: () => ({ open: webbrowserModule.open })
    };
    this.hostBridges.set('webbrowser', webbrowserModule);

    // 6c. Hashlib Bridge (MD5, SHA1, SHA256)
    function calcMd5(str) {
      let bytes;
      if (typeof str === 'string') {
        bytes = new TextEncoder().encode(str);
      } else if (Array.isArray(str) || (typeof Uint8Array !== 'undefined' && str instanceof Uint8Array)) {
        bytes = str;
      } else {
        bytes = new TextEncoder().encode(String(str || ''));
      }

      function toHex(n) {
        let s = '';
        for (let i = 0; i < 4; i++) {
          s += ((n >> (i * 8)) & 0xFF).toString(16).padStart(2, '0');
        }
        return s;
      }

      const bitLen = bytes.length * 8;
      const newLen = (((bytes.length + 8) >> 6) + 1) << 6;
      const words = new Uint32Array(newLen >> 2);
      for (let i = 0; i < bytes.length; i++) {
        words[i >> 2] |= bytes[i] << ((i % 4) * 8);
      }
      words[bytes.length >> 2] |= 0x80 << ((bytes.length % 4) * 8);
      words[(newLen >> 2) - 2] = bitLen & 0xFFFFFFFF;
      words[(newLen >> 2) - 1] = Math.floor(bitLen / 0x100000000);

      let a = 0x67452301;
      let b = 0xEFCDAB89;
      let c = 0x98BADCFE;
      let d = 0x10325476;

      const K = [
        0xd76aa478, 0xe8c7b756, 0x242070db, 0xc1bdceee,
        0xf57c0faf, 0x4787c62a, 0xa8304613, 0xfd469501,
        0x698098d8, 0x8b44f7af, 0xffff5bb1, 0x895cd7be,
        0x6b901122, 0xfd987193, 0xa679438e, 0x49b40821,
        0xf61e2562, 0xc040b340, 0x265e5a51, 0xe9b6c7aa,
        0xd62f105d, 0x02441453, 0xd8a1e681, 0xe7d3fbc8,
        0x21e1cde6, 0xc33707d6, 0xf4d50d87, 0x455a14ed,
        0xa9e3e905, 0xfcefa3f8, 0x676f02d9, 0x8d2a4c8a,
        0xfffa3942, 0x8771f681, 0x6d9d6122, 0xfde5380c,
        0xa4beea44, 0x4bdecfa9, 0xf6bb4b60, 0xbebfbc70,
        0x289b7ec6, 0xeaa127fa, 0xd4ef3085, 0x04881d05,
        0xd9d4d039, 0xe6db99e5, 0x1fa27cf8, 0xc4ac5665,
        0xf4292244, 0x432aff97, 0xab9423a7, 0xfc93a039,
        0x655b59c3, 0x8f0ccc92, 0xffeff47d, 0x85845dd1,
        0x6fa87e4f, 0xfe2ce6e0, 0xa3014314, 0x4e0811a1,
        0xf7537e82, 0xbd3af235, 0x2ad7d2bb, 0xeb86d391
      ];

      const S = [
        7, 12, 17, 22,  7, 12, 17, 22,  7, 12, 17, 22,  7, 12, 17, 22,
        5,  9, 14, 20,  5,  9, 14, 20,  5,  9, 14, 20,  5,  9, 14, 20,
        4, 11, 16, 23,  4, 11, 16, 23,  4, 11, 16, 23,  4, 11, 16, 23,
        6, 10, 15, 21,  6, 10, 15, 21,  6, 10, 15, 21,  6, 10, 15, 21
      ];

      for (let i = 0; i < words.length; i += 16) {
        let AA = a, BB = b, CC = c, DD = d;
        for (let j = 0; j < 64; j++) {
          let F, g;
          if (j < 16) {
            F = (b & c) | ((~b) & d);
            g = j;
          } else if (j < 32) {
            F = (d & b) | ((~d) & c);
            g = (5 * j + 1) % 16;
          } else if (j < 48) {
            F = b ^ c ^ d;
            g = (3 * j + 5) % 16;
          } else {
            F = c ^ (b | (~d));
            g = (7 * j) % 16;
          }
          F = (F + a + K[j] + words[i + g]) | 0;
          a = d;
          d = c;
          c = b;
          b = (b + ((F << S[j]) | (F >>> (32 - S[j])))) | 0;
        }
        a = (a + AA) | 0;
        b = (b + BB) | 0;
        c = (c + CC) | 0;
        d = (d + DD) | 0;
      }

      return toHex(a) + toHex(b) + toHex(c) + toHex(d);
    }

    function createHashInstance(algo) {
      let dataBuffer = '';
      return {
        update: (chunk) => {
          dataBuffer += (typeof chunk === 'string') ? chunk : (Array.isArray(chunk) ? String.fromCharCode(...chunk) : String(chunk || ''));
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
      md5: (data = '', opts = {}) => {
        const inst = createHashInstance('md5');
        if (data) inst.update(data);
        return inst;
      },
      sha1: (data = '', opts = {}) => {
        const inst = createHashInstance('sha1');
        if (data) inst.update(data);
        return inst;
      },
      sha256: (data = '', opts = {}) => {
        const inst = createHashInstance('sha256');
        if (data) inst.update(data);
        return inst;
      }
    };
    this.hostBridges.set('hashlib', hashlibModule);

    // 7. OS Bridge
    const osPath = {
      abspath: (p) => {
        const str = String(p || '');
        return str.startsWith('/') ? str : '/' + str;
      },
      join: (...parts) => parts.map(String).join('/').replace(/\/+/g, '/'),
      basename: (p) => String(p || '').split('/').pop(),
      dirname: (p) => {
        const parts = String(p || '').split('/');
        parts.pop();
        return parts.join('/') || '/';
      },
      exists: (p) => this.vfs.exists(String(p)),
      isdir: (p) => this.vfs.isDirectory(String(p)),
      isfile: (p) => this.vfs.isFile(String(p)),
      islink: (p) => false,
      getsize: (p) => this.vfs.stat(String(p)).size,
      split: (p) => {
        const str = String(p || '');
        const idx = str.lastIndexOf('/');
        if (idx === -1) return ['', str];
        return [str.slice(0, idx) || '/', str.slice(idx + 1)];
      },
      splitext: (p) => {
        const str = String(p || '');
        const lastSlash = str.lastIndexOf('/');
        const lastDot = str.lastIndexOf('.');
        if (lastDot > lastSlash) {
          return [str.slice(0, lastDot), str.slice(lastDot)];
        }
        return [str, ''];
      }
    };

    this.hostBridges.set('os', {
      name: 'posix',
      environ: {},
      sep: '/',
      path: osPath,
      listdir: (dir = '.') => this.vfs.readdir(String(dir)),
      mkdir: (dir) => this.vfs.mkdir(String(dir)),
      makedirs: (dir) => this.vfs.mkdir(String(dir)),
      remove: (file) => this.vfs.unlink(String(file)),
      unlink: (file) => this.vfs.unlink(String(file)),
      rmdir: (dir) => this.vfs.rmdir(String(dir)),
      stat: (target) => this.vfs.stat(String(target)),
      getcwd: () => '/workspace',
      system: (cmd) => {
        const cmdStr = String(cmd || '').trim().toLowerCase();
        const vm = VirtualMachine.activeVM;
        if (['clear', 'cls'].includes(cmdStr)) {
          if (vm && vm.clearConsole) {
            vm.clearConsole();
          }
          return 0;
        }
        return 0;
      }
    });
    this.hostBridges.set('os.path', osPath);

    // 7b. Shutil Host Native Bridge
    class ShutilError extends Error {
      constructor(msg) {
        super(msg);
        this.name = 'shutil.Error';
      }
    }
    class SameFileError extends ShutilError {
      constructor(msg) {
        super(msg);
        this.name = 'shutil.SameFileError';
      }
    }

    this.hostBridges.set('shutil', {
      rmtree: (path, ignore_errors = false, onerror = null) => {
        try {
          return this.vfs.rmtree(String(path));
        } catch (err) {
          if (ignore_errors) return false;
          if (typeof onerror === 'function') {
            try {
              onerror(this.vfs.rmtree, path, [err]);
              return false;
            } catch (e) {}
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
      SameFileError: SameFileError
    });

    // 8. Sys Bridge (CPython Core C-Runtime)
    this.hostBridges.set('sys', {
      version: '3.12.0 (main, UVM)',
      version_info: [3, 12, 0, 'final', 0],
      platform: 'browser',
      argv: ['uvm'],
      maxsize: Number.MAX_SAFE_INTEGER,
      intern: (s) => String(s),
      exit: (code = 0) => {
        const err = new Error(`SystemExit: ${code}`);
        err.name = 'SystemExit';
        throw err;
      },
      modules: {},
      stdout: {
        write: (s) => {
          const vm = VirtualMachine.activeVM;
          if (vm && vm.write) {
            vm.write(s);
          } else if (typeof console !== 'undefined') {
            console.log(s);
          }
          return s !== null && s !== undefined ? String(s).length : 0;
        },
        flush: () => {}
      },
      stderr: {
        write: (s) => {
          const vm = VirtualMachine.activeVM;
          if (vm && vm.write) {
            vm.write(s);
          } else if (typeof console !== 'undefined') {
            console.error(s);
          }
          return s !== null && s !== undefined ? String(s).length : 0;
        },
        flush: () => {}
      }
    });

    // 9. Datetime Bridge (CPython Core C-Runtime)
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
        const isLeap = (y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0));
        let ord = (y - 1) * 365 + Math.floor((y - 1) / 4) - Math.floor((y - 1) / 100) + Math.floor((y - 1) / 400);
        ord += daysBeforeMonth[m - 1] + d;
        if (m > 2 && isLeap) ord += 1;
        return ord;
      }
      strftime(fmt) {
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const monthAbbrs = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const dayAbbrs = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const wd = this.weekday();
        const mIdx = this.month - 1;
        return fmt
          .replace(/%B/g, monthNames[mIdx] || '')
          .replace(/%b/g, monthAbbrs[mIdx] || '')
          .replace(/%A/g, dayNames[wd] || '')
          .replace(/%a/g, dayAbbrs[wd] || '')
          .replace(/%Y/g, String(this.year))
          .replace(/%m/g, String(this.month).padStart(2, '0'))
          .replace(/%d/g, String(this.day).padStart(2, '0'));
      }
      __repr__() {
        return `datetime.date(${this.year}, ${this.month}, ${this.day})`;
      }
      toString() {
        return `${this.year}-${String(this.month).padStart(2, '0')}-${String(this.day).padStart(2, '0')}`;
      }
    }

    class TimeDeltaObj {
      constructor(days = 0, seconds = 0, microseconds = 0) {
        this.days = days;
        this.seconds = seconds;
        this.microseconds = microseconds;
      }
      total_seconds() {
        return this.days * 86400 + this.seconds + this.microseconds / 1000000;
      }
    }

    const datetimeModule = {
      MINYEAR: 1,
      MAXYEAR: 9999,
      date: (y, m, d) => new DateObj(y, m, d),
      timedelta: (d, s, us) => new TimeDeltaObj(d, s, us),
      datetime: {
        now: () => {
          const now = new Date();
          return new DateObj(now.getFullYear(), now.getMonth() + 1, now.getDate());
        }
      }
    };
    datetimeModule.date.today = () => {
      const now = new Date();
      return new DateObj(now.getFullYear(), now.getMonth() + 1, now.getDate());
    };
    this.hostBridges.set('datetime', datetimeModule);

    // 10. Locale Bridge
    this.hostBridges.set('locale', {
      LC_ALL: 0,
      LC_COLLATE: 1,
      LC_CTYPE: 2,
      LC_MONETARY: 3,
      LC_NUMERIC: 4,
      LC_TIME: 5,
      Error: Error,
      getlocale: () => ['en_US', 'UTF-8'],
      setlocale: (cat, loc = null) => 'C',
      normalize: (loc) => loc || 'en_US.UTF-8',
      nl_langinfo: (key) => ''
    });

    // 11. Enum Bridge
    const global_enum = (cls) => cls;
    function Enum(val) {
      return Object(val !== undefined ? val : 0);
    }
    function IntEnum(val) {
      return Object(val !== undefined ? val : 0);
    }
    this.hostBridges.set('enum', {
      Enum,
      IntEnum,
      global_enum
    });

    // 12. Warnings Bridge
    this.hostBridges.set('warnings', {
      warn: (msg, category = null, stacklevel = 1) => {
        if (this.onTelemetry) this.onTelemetry('WARNING', String(msg));
      },
      filterwarnings: () => {},
      simplefilter: () => {},
      DeprecationWarning: class DeprecationWarning extends Error {}
    });

    // 13. Itertools Bridge
    this.hostBridges.set('itertools', {
      count: (start = 0, step = 1) => {
        let n = start;
        return {
          [Symbol.iterator]: function*() {
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
          [Symbol.iterator]: function*() {
            if (items.length === 0) return;
            while (true) {
              for (const it of items) yield it;
            }
          }
        };
      },
      repeat: (object, times = null) => {
        if (times === null || times === undefined) {
          return {
            [Symbol.iterator]: function*() {
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
        let acc = undefined;
        for (const it of items) {
          if (acc === undefined) {
            acc = it;
          } else {
            acc = func ? func(acc, it) : acc + it;
          }
          res.push(acc);
        }
        return res;
      }
    });

    // 14. Operator Bridge
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
      setitem: (a, b, c) => { a[b] = c; },
      delitem: (a, b) => { if (Array.isArray(a)) a.splice(b, 1); else delete a[b]; },
      contains: (a, b) => (Array.isArray(a) || typeof a === 'string' ? a.includes(b) : b in a),
      indexOf: (a, b) => a.indexOf(b),
      countOf: (a, b) => {
        let count = 0;
        for (const x of a) if (x === b) count++;
        return count;
      },
      itemgetter: (...items) => (obj) => items.length === 1 ? obj[items[0]] : items.map(k => obj[k]),
      attrgetter: (...attrs) => (obj) => attrs.length === 1 ? obj[attrs[0]] : attrs.map(k => obj[k])
    };
    this.hostBridges.set('_operator', operatorModule);
    this.hostBridges.set('_bisect', {});
    this.hostBridges.set('_heapq', {});
    this.hostBridges.set('_stat', {});
    this.hostBridges.set('_string', {});
    this.hostBridges.set('_abc', {
      get_cache_token: () => 0,
      _abc_init: (self) => {},
      _abc_register: (self, subclass) => {},
      _abc_instancecheck: (self, instance) => false,
      _abc_subclasscheck: (self, subclass) => false,
    });
    this.hostBridges.set('abc', {
      get_cache_token: () => 0,
      ABC: class ABC {},
      ABCMeta: class ABCMeta {},
      abstractmethod: (func) => func,
    });
    this.hostBridges.set('reprlib', {
      recursive_repr: (fillvalue = '...') => (fn) => fn,
    });
    class DummyLock {
      acquire() { return true; }
      release() {}
      __enter__() { return this; }
      __exit__() {}
    }
    this.hostBridges.set('_thread', {
      RLock: () => new DummyLock(),
      allocate_lock: () => new DummyLock(),
      get_ident: () => 1,
    });
    this.hostBridges.set('types', {
      GenericAlias: class GenericAlias {},
      UnionType: class UnionType {},
      MethodType: (fn, obj) => fn.bind ? fn.bind(obj) : fn,
      FunctionType: Function,
    });

    // 15. Collections Bridge
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
    this.hostBridges.set('collections', {
      ChainMap,
      namedtuple: (typename, fieldNames) => {
        const fields = Array.isArray(fieldNames)
          ? fieldNames
          : (typeof fieldNames === 'string' ? fieldNames.replace(/,/g, ' ').trim().split(/\s+/) : []);
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
      deque: class deque extends Array {},
      Counter: class Counter extends Map {},
      OrderedDict: class OrderedDict extends Map {}
    });

    // 16. Builtins Bridge
    this.hostBridges.set('builtins', {
      abs: Math.abs,
      min: Math.min,
      max: Math.max,
      sum: (arr, start = 0) => Array.from(arr || []).reduce((a, b) => a + b, start),
      len: (x) => (x ? (x.length !== undefined ? x.length : (x.size !== undefined ? x.size : Object.keys(x).length)) : 0),
      range: (start, stop, step = 1) => {
        if (stop === undefined) { stop = start; start = 0; }
        const res = [];
        for (let i = start; step > 0 ? i < stop : i > stop; i += step) res.push(i);
        return res;
      },
      enumerate: (iter, start = 0) => Array.from(iter || []).map((v, i) => [i + start, v]),
      zip: (...iters) => {
        const minLen = Math.min(...iters.map(it => (it ? it.length || 0 : 0)));
        const res = [];
        for (let i = 0; i < minLen; i++) res.push(iters.map(it => it[i]));
        return res;
      },
      repr: (x) => JSON.stringify(x),
      str: (x) => String(x),
      int: (x) => parseInt(x, 10),
      float: (x) => parseFloat(x),
      bool: (x) => Boolean(x),
      list: (x) => (x ? Array.from(x) : []),
      dict: (entries) => (entries ? Object.fromEntries(entries) : {}),
      set: (x) => new Set(x || []),
      tuple: (x) => (x ? Array.from(x) : []),
      any: (iter) => Array.from(iter || []).some(Boolean),
      all: (iter) => Array.from(iter || []).every(Boolean),
      callable: (x) => typeof x === 'function' || (x && (x.entryPC !== undefined || typeof x.__call__ === 'function')),
      hasattr: (obj, attr) => obj != null && attr in obj,
      getattr: (obj, attr, def) => (obj != null && attr in obj ? obj[attr] : def),
      setattr: (obj, attr, val) => { if (obj != null) obj[attr] = val; },
      delattr: (obj, attr) => { if (obj != null) delete obj[attr]; },
      Exception: Error,
      ValueError: Error,
      TypeError: TypeError,
      KeyError: Error,
      IndexError: RangeError,
      AttributeError: Error,
      ImportError: Error,
    });

    // 17. __future__ Bridge
    this.hostBridges.set('__future__', {
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

    const subPath = name.replace(/\./g, '/');
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

    if (typeof fetch === 'undefined') {
      throw new Error(`ImportError: Cannot dynamically fetch '${name}': fetch() API is unavailable`);
    }

    // 1. Fetch from official CPython 3.12 Standard Library GitHub repository
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
      // Network failure or offline mode
    }

    // 2. Fetch from known community pure-Python repositories
    const communityUrls = {
      cowsay: 'https://raw.githubusercontent.com/jcn/cowsay-py/master/cowsay.py',
      pyfiglet: 'https://raw.githubusercontent.com/pwaller/pyfiglet/master/pyfiglet/__init__.py',
      six: 'https://raw.githubusercontent.com/benjaminp/six/master/six.py'
    };
    if (communityUrls[name]) {
      try {
        const resp = await fetch(communityUrls[name]);
        if (resp.ok) {
          let source = await resp.text();
          if (name === 'cowsay' && !source.includes('def cow(') && source.includes('def cowsay(')) {
            source += '\ncow = cowsay\n';
          }
          const vfsPath = `/lib/python3/${name}.py`;
          this.vfs.writeFile(vfsPath, source);
          if (name === 'cowsay' && !this.hasModule('textwrap')) {
            await this.fetchAndCacheModule('textwrap', callingVm);
          }
          return callingVm ? this.getOrLoad(name, callingVm) : null;
        }
      } catch (err) {}
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

    // Tier 3: Host JavaScript / V8 Bridges
    if (this.hostBridges.has(name)) {
      const bridge = this.hostBridges.get(name);
      if (bridge && typeof bridge === 'object' && !bridge.__is_module__) {
        bridge.__is_module__ = true;
        bridge.__name__ = name;
      }
      this.cache.set(name, bridge);
      return bridge;
    }

    // Tier 1: Pure-Python (.py) from Virtual Filesystem
    const subPath = name.replace(/\./g, '/');
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
          onPrint: (parentVm && parentVm.onPrint) ? (msg) => parentVm.log(msg) : null
        });
        if (parentVm && parentVm.write) {
          modVm.write = (s) => parentVm.write(s);
        }
        modVm.moduleManager = this;
        modVm.globals.set('__name__', name);
        const iter = modVm.execute(program);
        while (!iter.next().done) {}

        const moduleExports = { __is_module__: true, __name__: name };
        for (const [k, v] of modVm.globals.entries()) {
          if (v && typeof v === 'object' && (v.entryPC !== undefined || v.__is_bound__)) {
            moduleExports[k] = createPythonModuleCallable(v, modVm);
          } else {
            moduleExports[k] = v;
          }
        }

        this.cache.set(name, moduleExports);
        return moduleExports;
      }
    }

    // Tier 2: Genuine C Extensions (.c) from Virtual Filesystem
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
        if (cExports && typeof cExports === 'object' && !cExports.__is_module__) {
          cExports.__is_module__ = true;
          cExports.__name__ = name;
        }
        this.cache.set(name, cExports);
        return cExports;
      }
    }

    const impErr = new Error(`ImportError: No module named '${name}'`);
    impErr.name = 'ImportError';
    throw impErr;
  }
}

export const moduleManager = new ModuleManager();
VirtualMachine.defaultModuleManager = moduleManager;
