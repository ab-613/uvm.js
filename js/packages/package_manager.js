// File: js/packages/package_manager.js
/**
 * Universal Package & Install Manager for UVM
 * Manages Python modules, standard library packages, and VFS site-packages.
 */

export const POPULAR_REGISTRY = [
  {
    name: "cowsay",
    version: "6.1.0",
    category: "ASCII Art & Fun",
    description: "The famous character banner generator (cowsay.cow, cowsay.tux, cowsay.dragon).",
    author: "VaasuDevanS",
    type: "PyPI Package",
    officialUrl: "https://pypi.org/project/cowsay/"
  },
  {
    name: "shutil",
    version: "3.12.0",
    category: "System",
    description: "High-level file and directory operations (rmtree, copy, copytree, move).",
    author: "Python Software Foundation",
    type: "Host Native",
    officialUrl: "https://docs.python.org/3/library/shutil.html"
  },
  {
    name: "calendar",
    version: "3.12.0",
    category: "Date & Time",
    description: "General calendar functions, matrix generators, and date computations directly from CPython standard library.",
    author: "Python Software Foundation",
    officialUrl: "https://raw.githubusercontent.com/python/cpython/3.12/Lib/calendar.py"
  },
  {
    name: "functools",
    version: "3.12.0",
    category: "Functional",
    description: "Higher-order functions and operations on callable objects (reduce, partial, lru_cache, wraps, update_wrapper).",
    author: "Python Software Foundation",
    officialUrl: "https://raw.githubusercontent.com/python/cpython/3.12/Lib/functools.py"
  },
  {
    name: "string",
    version: "3.12.0",
    category: "Text",
    description: "Common string operations, ASCII constants, whitespace, and Template substitution class.",
    author: "Python Software Foundation",
    officialUrl: "https://raw.githubusercontent.com/python/cpython/3.12/Lib/string.py"
  },
  {
    name: "heapq",
    version: "3.12.0",
    category: "Data Structures",
    description: "Heap queue algorithm, priority queues (heappush, heappop, heapify, nlargest, nsmallest).",
    author: "Python Software Foundation",
    officialUrl: "https://raw.githubusercontent.com/python/cpython/3.12/Lib/heapq.py"
  },
  {
    name: "bisect",
    version: "3.12.0",
    category: "Algorithms",
    description: "Array bisection algorithm for binary searches and sorted insertions (bisect_left, insort).",
    author: "Python Software Foundation",
    officialUrl: "https://raw.githubusercontent.com/python/cpython/3.12/Lib/bisect.py"
  },
  {
    name: "colorsys",
    version: "3.12.0",
    category: "Graphics & Color",
    description: "Conversions between RGB, YIQ, HLS and HSV color systems.",
    author: "Python Software Foundation",
    officialUrl: "https://raw.githubusercontent.com/python/cpython/3.12/Lib/colorsys.py"
  },
  {
    name: "stat",
    version: "3.12.0",
    category: "System",
    description: "Interpreting stat() results, file mode constants (S_ISDIR, S_ISREG) and POSIX file attribute flags.",
    author: "Python Software Foundation",
    officialUrl: "https://raw.githubusercontent.com/python/cpython/3.12/Lib/stat.py"
  },
  {
    name: "queue",
    version: "3.12.0",
    category: "Concurrency",
    description: "Synchronized queue class for threading, FIFO, LIFO, and priority queue data structures.",
    author: "Python Software Foundation",
    officialUrl: "https://raw.githubusercontent.com/python/cpython/3.12/Lib/queue.py"
  },
  {
    name: "copy",
    version: "3.12.0",
    category: "Data Structures",
    description: "Generic shallow and deep copy operations for Python objects, lists, and dicts.",
    author: "Python Software Foundation",
    officialUrl: "https://raw.githubusercontent.com/python/cpython/3.12/Lib/copy.py"
  },
  {
    name: "operator",
    version: "3.12.0",
    category: "Functional",
    description: "Standard operators as functions (add, mul, itemgetter, attrgetter, methodcaller).",
    author: "Python Software Foundation",
    officialUrl: "https://raw.githubusercontent.com/python/cpython/3.12/Lib/operator.py"
  }
];

export const COMMUNITY_FALLBACK_URLS = {
  cowsay: "https://raw.githubusercontent.com/jcn/cowsay-py/master/cowsay.py",
  pyfiglet: "https://raw.githubusercontent.com/pwaller/pyfiglet/master/pyfiglet/__init__.py",
  six: "https://raw.githubusercontent.com/benjaminp/six/master/six.py",
  whichcraft: "https://raw.githubusercontent.com/cookiecutter/whichcraft/master/whichcraft.py"
};

export class PackageManager {
  constructor(moduleManager, onTelemetry = null) {
    this.moduleManager = moduleManager;
    this.vfs = moduleManager.vfs;
    this.onTelemetry = onTelemetry;
  }

  /**
   * Returns a complete list of installed modules across Host, Stdlib, and VFS site-packages.
   */
  listInstalled() {
    const installed = [];

    // 1. Host Native Bridges
    const hostNames = [
      { name: "math", type: "Host Native", version: "3.12.0", desc: "V8 high-speed mathematical bridge (sqrt, sin, cos, pi, log)" },
      { name: "time", type: "Host Native", version: "3.12.0", desc: "Cooperative fiber sleep and high-resolution timer" },
      { name: "json", type: "Host Native", version: "3.12.0", desc: "Native JSON dumps and loads parsing bridge" },
      { name: "re", type: "Host Native", version: "3.12.0", desc: "Native regular expression matcher and substitution engine" },
      { name: "random", type: "Host Native", version: "3.12.0", desc: "Cryptographic and uniform pseudo-random number generator" },
      { name: "requests", type: "Host Native", version: "2.31.0", desc: "Full HTTP client with Session, Retry, headers, and async bridge" },
      { name: "os", type: "Host Native", version: "3.12.0", desc: "POSIX Virtual File System path abstraction and environment" },
      { name: "webbrowser", type: "Host Native", version: "3.12.0", desc: "Interfaces for displaying Web-based documents to users" },
      { name: "hashlib", type: "Host Native", version: "3.12.0", desc: "Secure hash and message digest algorithms (MD5, SHA1, SHA256)" },
      { name: "regex", type: "Host Native", version: "3.12.0", desc: "Native regular expression matcher and substitution engine (aliased to re)" },
      { name: "shutil", type: "Host Native", version: "3.12.0", desc: "High-level file and directory operations (rmtree, copy, copytree, move)" }
    ];
    for (const h of hostNames) {
      installed.push({
        name: h.name,
        type: h.type,
        version: h.version,
        description: h.desc,
        canUninstall: false
      });
    }

    // 2. Genuine C Extensions
    if (this.vfs.exists("/lib/c/_fastmath.c")) {
      installed.push({
        name: "_fastmath",
        type: "C Extension",
        version: "1.0.0",
        description: "Genuine C-extension compiled to UVM bytecode (fast_gcd, fast_fib, is_prime)",
        canUninstall: false
      });
    }

    // 3. VFS Standard Library & Site-Packages
    for (const [path, content] of this.vfs.files.entries()) {
      if (path.startsWith("/lib/python3/") && path.endsWith(".py")) {
        const modName = path.replace("/lib/python3/", "").replace(".py", "");
        if (!installed.some(i => i.name === modName)) {
          const regEntry = POPULAR_REGISTRY.find(r => r.name === modName);
          installed.push({
            name: modName,
            type: regEntry?.type || "CPython Stdlib",
            version: regEntry?.version || "3.12.0",
            description: regEntry?.description || `Pure-Python module loaded from VFS (${(content.length / 1024).toFixed(1)} KB)`,
            canUninstall: true
          });
        }
      } else if (path.startsWith("/site-packages/") && path.endsWith(".py")) {
        const modName = path.replace("/site-packages/", "").replace(".py", "");
        if (!installed.some(i => i.name === modName)) {
          installed.push({
            name: modName,
            type: "PyPI Package",
            version: "1.0.0",
            description: `Community package loaded from VFS (${(content.length / 1024).toFixed(1)} KB)`,
            canUninstall: true
          });
        }
      }
    }

    return installed;
  }

  /**
   * Checks if a package is currently installed in VFS or Host.
   */
  isInstalled(packageName) {
    const name = packageName.trim().toLowerCase();
    return this.listInstalled().some(p => p.name === name);
  }

  /**
   * Installs a package by name using a 100% online multi-stage pipeline:
   * 1. Direct URL (if user supplies full http:// or https:// raw link).
   * 2. Official CPython 3.12 Lib GitHub repository.
   * 3. Community pure-Python upstream GitHub fallback map (for standalone packages like cowsay).
   * 4. Official PyPI REST API + Upstream GitHub source resolver.
   */
  async install(packageName) {
    let input = (packageName || "").trim();
    if (!input) throw new Error("Package name cannot be empty");

    let isDirectUrl = input.startsWith("http://") || input.startsWith("https://");
    let name = "";
    let directUrl = "";

    if (isDirectUrl) {
      directUrl = input;
      const urlParts = input.split("/");
      const lastPart = urlParts[urlParts.length - 1].split("?")[0].replace(/\.py$/, "");
      name = lastPart.toLowerCase().replace(/[^a-z0-9_]/g, "_");
      if (!name) name = "custom_module";
    } else {
      name = input.toLowerCase().replace(/-/g, "_");
    }

    const startTime = performance.now();

    // Check if already installed
    if (this.isInstalled(name)) {
      throw new Error(`Package '${name}' is already installed (found in /lib/python3/ or /site-packages/).`);
    }

    let source = "";
    let resolvedOrigin = "";
    let isPackageDir = false;
    let matchedOwner = "";
    let matchedRepo = "";

    // Stage 1: Direct URL
    if (isDirectUrl) {
      if (this.onTelemetry) this.onTelemetry("NETWORK", `GET ${directUrl}`);
      const resp = await fetch(directUrl);
      if (!resp.ok) throw new Error(`Failed to fetch from URL: HTTP ${resp.status} ${resp.statusText}`);
      source = await resp.text();
      resolvedOrigin = `Direct URL (${directUrl})`;
    }

    // Stage 2: Dynamic fetch from official CPython 3.12 Lib repository
    if (!source) {
      const cpythonCandidates = [
        `https://raw.githubusercontent.com/python/cpython/3.12/Lib/${name}.py`,
        `https://raw.githubusercontent.com/python/cpython/3.12/Lib/${name}/__init__.py`
      ];
      for (const url of cpythonCandidates) {
        try {
          if (this.onTelemetry) this.onTelemetry("NETWORK", `GET ${url}`);
          const resp = await fetch(url);
          if (resp.ok) {
            const text = await resp.text();
            if (text && !text.startsWith("404")) {
              source = text;
              resolvedOrigin = "CPython 3.12 Standard Library";
              break;
            }
          }
        } catch (e) {}
      }
    }

    // Stage 3: Community pure-Python repository fallback map
    if (!source && COMMUNITY_FALLBACK_URLS[name]) {
      const fallbackUrl = COMMUNITY_FALLBACK_URLS[name];
      try {
        if (this.onTelemetry) this.onTelemetry("NETWORK", `GET ${fallbackUrl}`);
        const resp = await fetch(fallbackUrl);
        if (resp.ok) {
          const text = await resp.text();
          if (text && !text.startsWith("404")) {
            source = text;
            resolvedOrigin = `Upstream GitHub Community Repository`;
          }
        }
      } catch (e) {}
    }

    // Stage 4: Query official PyPI REST API + Upstream GitHub Resolver
    if (!source) {
      try {
        if (this.onTelemetry) {
          this.onTelemetry("NETWORK", `Querying PyPI metadata for '${name}'...`);
        }
        const pypiResp = await fetch(`https://pypi.org/pypi/${name}/json`);
        if (pypiResp.ok) {
          const pypiData = await pypiResp.json();
          const info = pypiData.info || {};
          const latestFiles = pypiData.urls || [];
          const releases = pypiData.releases || {};
          const allFiles = latestFiles.length > 0 ? latestFiles : Object.values(releases).flat();

          // Diagnostic check: binary C extensions vs pure Python
          const hasPureWheel = allFiles.some(f => (f.filename || "").includes("-none-any.whl"));
          const hasBinaryWheels = allFiles.some(f => {
            const fn = (f.filename || "").toLowerCase();
            return fn.includes("manylinux") || fn.includes("win_amd64") || fn.includes("macosx") || (fn.endsWith(".whl") && !fn.includes("-none-any.whl"));
          });

          if (hasBinaryWheels && !hasPureWheel) {
            let hint = "";
            if (name === "regex") {
              hint = " Tip: UVM already provides a native regular expression engine: 'import re' or 'import regex'.";
            } else if (name === "numpy" || name === "pandas" || name === "scipy") {
              hint = " In browser UVM, use pure-Python algorithms or compiled C extensions in /lib/c/.";
            }
            throw new Error(
              `Package '${name}' requires compiled C/C++ or Fortran binary extensions (platform-specific wheels like .pyd/.so). UVM executes pure-Python bytecode and C files compiled to UVM opcodes in-browser; native platform wheels cannot run without WebAssembly compilation.${hint}`
            );
          }

          isPackageDir = false;
          matchedOwner = "";
          matchedRepo = "";

          const urls = [
            info.home_page,
            ...(info.project_urls ? Object.values(info.project_urls) : [])
          ].filter(Boolean);

          const ghUrl = urls.find(u => typeof u === "string" && u.includes("github.com"));
          if (ghUrl) {
            const m = ghUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
            if (m) {
              matchedOwner = m[1];
              matchedRepo = m[2].replace(/\.git$/, "");
              for (const branch of ["master", "main"]) {
                for (const candidate of [
                  `https://raw.githubusercontent.com/${matchedOwner}/${matchedRepo}/${branch}/${name}.py`,
                  `https://raw.githubusercontent.com/${matchedOwner}/${matchedRepo}/${branch}/src/${name}.py`,
                  `https://raw.githubusercontent.com/${matchedOwner}/${matchedRepo}/${branch}/${name}/__init__.py`,
                  `https://raw.githubusercontent.com/${matchedOwner}/${matchedRepo}/${branch}/src/${name}/__init__.py`,
                  `https://raw.githubusercontent.com/${matchedOwner}/${matchedRepo}/${branch}/${name}/${name}.py`,
                  `https://raw.githubusercontent.com/${matchedOwner}/${matchedRepo}/${branch}/${name}/main.py`
                ]) {
                  try {
                    const ghResp = await fetch(candidate);
                    if (ghResp.ok) {
                      const text = await ghResp.text();
                      if (text && !text.startsWith("404")) {
                        source = text;
                        if (candidate.endsWith("/__init__.py")) {
                          isPackageDir = true;
                        }
                        resolvedOrigin = `PyPI Upstream GitHub (${matchedOwner}/${matchedRepo})`;
                        break;
                      }
                    }
                  } catch (e) {}
                }
                if (source) break;
              }
            }
          }

          if (!source) {
            throw new Error(
              `Package '${name}' is on PyPI (v${info.version || "1.0.0"}: "${info.summary || "Python package"}"), but it is a complex multi-file/wheel package without an accessible standalone single-file module on GitHub. UVM currently loads pure-Python single-file modules or packages with single-file entrypoints.`
            );
          }
        } else if (pypiResp.status === 404) {
          throw new Error(
            `Could not find '${name}' on official CPython 3.12 stdlib, PyPI, or known repositories. Check spelling or paste a direct raw URL (e.g. https://raw.githubusercontent.com/...).`
          );
        } else {
          throw new Error(`Package '${name}' resolution failed (PyPI HTTP ${pypiResp.status}).`);
        }
      } catch (err) {
        throw new Error(err.message || `Could not fetch package '${name}'`);
      }
    }

    if (!source) {
      throw new Error(`Package '${name}' could not be resolved from any supported online repository.`);
    }

    // Auto-resolve any pure standard library dependencies required by the downloaded source
    const importRegex = /(?:^|\n)\s*(?:from\s+([a-zA-Z0-9_]+)\s+import|import\s+([a-zA-Z0-9_]+))/g;
    let match;
    const dependencies = new Set();
    while ((match = importRegex.exec(source)) !== null) {
      const dep = match[1] || match[2];
      if (dep && dep !== name && !this.isInstalled(dep)) {
        dependencies.add(dep);
      }
    }
    for (const dep of dependencies) {
      try {
        const depUrl = `https://raw.githubusercontent.com/python/cpython/3.12/Lib/${dep}.py`;
        const depResp = await fetch(depUrl);
        if (depResp.ok) {
          const depSource = await depResp.text();
          if (depSource && !depSource.startsWith("404")) {
            this.vfs.writeFile(`/lib/python3/${dep}.py`, depSource);
            if (this.onTelemetry) {
              this.onTelemetry("PACKAGE", `Auto-resolved stdlib dependency '${dep}' for '${name}'`);
            }
          }
        }
      } catch (e) {}
    }

    // Compatibility shim: if cowsay, add cow = cowsay if cow is not defined
    if (name === "cowsay" && !source.includes("def cow(") && source.includes("def cowsay(")) {
      source += "\ncow = cowsay\n";
    }

    // Write file to VFS
    let vfsPath = `/lib/python3/${name}.py`;
    if (isPackageDir) {
      vfsPath = `/lib/python3/${name}/__init__.py`;
      this.vfs.writeFile(vfsPath, source);

      // Multi-file crawler: inspect __init__.py for local package submodules
      const subRegex = new RegExp(`(?:from\\s+(?:\\.|${name}\\.)([a-zA-Z0-9_]+)|import\\s+${name}\\.([a-zA-Z0-9_]+))`, 'g');
      let subMatch;
      const submodules = new Set();
      while ((subMatch = subRegex.exec(source)) !== null) {
        const sub = subMatch[1] || subMatch[2];
        if (sub && sub !== name && sub !== '__init__') {
          submodules.add(sub);
        }
      }

      for (const sub of submodules) {
        for (const branch of ["master", "main"]) {
          for (const subCandidate of [
            `https://raw.githubusercontent.com/${matchedOwner}/${matchedRepo}/${branch}/${name}/${sub}.py`,
            `https://raw.githubusercontent.com/${matchedOwner}/${matchedRepo}/${branch}/src/${name}/${sub}.py`
          ]) {
            try {
              const subResp = await fetch(subCandidate);
              if (subResp.ok) {
                const subText = await subResp.text();
                if (subText && !subText.startsWith("404")) {
                  this.vfs.writeFile(`/lib/python3/${name}/${sub}.py`, subText);
                  if (this.onTelemetry) {
                    this.onTelemetry("PACKAGE", `Auto-crawled submodule '${name}.${sub}'`);
                  }
                  break;
                }
              }
            } catch (e) {}
          }
        }
      }
    } else {
      this.vfs.writeFile(vfsPath, source);
    }

    // Clear module manager cache for this name if any
    this.moduleManager.cache.delete(name);

    const elapsed = (performance.now() - startTime).toFixed(1);
    if (this.onTelemetry) {
      this.onTelemetry("PACKAGE", `Successfully installed '${name}' from ${resolvedOrigin} (${elapsed}ms)`);
    }

    return {
      name,
      path: vfsPath,
      size: source.length,
      elapsed,
      origin: resolvedOrigin
    };
  }

  /**
   * Uninstalls a package from VFS.
   */
  uninstall(packageName) {
    const name = packageName.trim().toLowerCase();
    const candidates = [
      `/lib/python3/${name}.py`,
      `/site-packages/${name}.py`
    ];

    let removed = false;
    for (const p of candidates) {
      if (this.vfs.files.has(p)) {
        this.vfs.files.delete(p);
        removed = true;
      }
    }

    this.moduleManager.cache.delete(name);

    if (removed && this.onTelemetry) {
      this.onTelemetry("PACKAGE", `Uninstalled package '${name}' from VFS`);
    }

    return removed;
  }
}
