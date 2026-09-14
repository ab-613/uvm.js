import { parseSource } from "./frontend/index.js";
import { BytecodeCompiler, VirtualMachine, moduleManager, Scheduler } from "./vm/index.js";
import { DEMO_SCRIPTS } from "./frontend/demo_scripts.js";
import { PackageManager, POPULAR_REGISTRY } from "./packages/package_manager.js";

// Global Runtime State
let activeScheduler = null;
let activeLanguage = "python";
let activeProgram = null;
let stepVm = null;
let stepGenerator = null;
let replVm = null;
let monacoEditor = null;
let currentLoadedCode = "";
let isPaused = false;
let editorDecorations = [];
const replHistory = [];
let replHistoryIndex = -1;
let currentOpenFilePath = "/workspace/main.py";
const folderStateMap = { "/workspace": true, "/lib": true, "/lib/python3": true, "/lib/c": true };

// --- Real Vector SVG Icons for File Extensions (No hacky text ::before) ---
const CHEVRON_RIGHT_SVG = `<svg class="chevron-svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>`;
const CHEVRON_DOWN_SVG = `<svg class="chevron-svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>`;

const FOLDER_CLOSED_SVG = `<svg class="folder-svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dcb67a" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>`;
const FOLDER_OPEN_SVG = `<svg class="folder-svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dcb67a" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 19l2-8h14l-2 8H5z"></path><path d="M4 11V5a2 2 0 0 1 2-2h4l2 3h6a2 2 0 0 1 2 2v3"></path></svg>`;

function getFileIconSvg(filename) {
  const ext = (filename || "").split(".").pop().toLowerCase();
  if (ext === "py") {
    // Authentic Python dual-tone snake logo
    return `<svg class="file-ext-icon icon-py" width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M11.9 2c-3.1 0-5 1.4-5 3.3v2.2h5.1v.7H4.3C2.5 8.2 2 10.3 2 12.8c0 2.6.9 4.3 2.7 4.3h1.6v-2.1c0-1.6 1.4-3 3-3h5.1c1.3 0 2.4-1.1 2.4-2.4V5.3c0-1.9-2.1-3.3-4.9-3.3zm-1.8 1.8a.9.9 0 1 1 0 1.8.9.9 0 0 1 0-1.8z" fill="#388bfd"/>
      <path d="M12.1 22c3.1 0 5-1.4 5-3.3v-2.2H12v-.7h7.7c1.8 0 2.3-2.1 2.3-4.6 0-2.6-.9-4.3-2.7-4.3h-1.6v2.1c0 1.6-1.4 3-3 3H9.6c-1.3 0-2.4 1.1-2.4 2.4v4.3c0 1.9 2.1 3.4 4.9 3.4zm1.8-1.8a.9.9 0 1 1 0-1.8.9.9 0 0 1 0 1.8z" fill="#e3b341"/>
    </svg>`;
  }
  if (ext === "c" || ext === "h") {
    // Hexagonal C logo
    return `<svg class="file-ext-icon icon-c" width="14" height="14" viewBox="0 0 24 24">
      <polygon points="12 2 21 7 21 17 12 22 3 17 3 7" fill="none" stroke="#58a6ff" stroke-width="2" stroke-linejoin="round"/>
      <path d="M14.5 9.5a3.5 3.5 0 1 0 0 5" fill="none" stroke="#58a6ff" stroke-width="2" stroke-linecap="round"/>
    </svg>`;
  }
  if (ext === "java") {
    // Java cup
    return `<svg class="file-ext-icon icon-java" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ff7b72" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
      <line x1="6" y1="1" x2="6" y2="4"></line>
      <line x1="10" y1="1" x2="10" y2="4"></line>
      <line x1="14" y1="1" x2="14" y2="4"></line>
    </svg>`;
  }
  if (ext === "json") {
    // JSON braces
    return `<svg class="file-ext-icon icon-json" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d29922" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M8 3H6a2 2 0 0 0-2 2v4a2 2 0 0 1-2 2 2 2 0 0 1 2 2v4a2 2 0 0 0 2 2h2"></path>
      <path d="M16 3h2a2 2 0 0 1 2 2v4a2 2 0 0 0 2 2 2 2 0 0 0-2 2v4a2 2 0 0 1-2 2h-2"></path>
    </svg>`;
  }
  if (ext === "md") {
    // Markdown M logo
    return `<svg class="file-ext-icon icon-md" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#79c0ff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2"></rect>
      <path d="M6 15V9l3 3 3-3v6"></path>
      <polyline points="15 12 17 14 19 12"></polyline>
      <line x1="17" y1="9" x2="17" y2="14"></line>
    </svg>`;
  }
  if (ext === "js") {
    // JavaScript badge
    return `<svg class="file-ext-icon icon-js" width="14" height="14" viewBox="0 0 24 24">
      <rect x="2" y="2" width="20" height="20" rx="3" fill="#f7df1e"/>
      <path d="M11 16.5c0 .8-.5 1.5-1.5 1.5-1.2 0-1.5-.7-1.5-1.5" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round"/>
      <path d="M14 14.5c.3.7.8 1 1.5 1 .7 0 1.2-.4 1.2-.9 0-1.2-2.7-.8-2.7-2.6 0-.8.6-1.5 1.7-1.5 1 0 1.5.5 1.7 1" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round"/>
    </svg>`;
  }
  // Generic Document
  return `<svg class="file-ext-icon icon-txt" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8b949e" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <polyline points="14 2 14 8 20 8"></polyline>
    <line x1="8" y1="13" x2="16" y2="13"></line>
    <line x1="8" y1="17" x2="12" y2="17"></line>
  </svg>`;
}

// --- Helper Functions for Editor Abstraction (Monaco + Fallback) ---
function getCode() {
  if (monacoEditor) {
    return monacoEditor.getValue();
  }
  const el = document.getElementById("codeInput");
  if (el && typeof el.value === "string" && el.value.length > 0) {
    return el.value;
  }
  return currentLoadedCode || "";
}

function setCode(val, lang = null) {
  currentLoadedCode = val || "";
  const el = document.getElementById("codeInput");
  if (el) el.value = currentLoadedCode;
  if (monacoEditor) {
    monacoEditor.setValue(currentLoadedCode);
    if (lang && typeof window.monaco !== "undefined") {
      const mqlang = lang === "c" ? "c" : lang === "java" ? "java" : "python";
      window.monaco.editor.setModelLanguage(monacoEditor.getModel(), mqlang);
    }
  }
  updateEditorStats();
}

function updateEditorStats() {
  const code = getCode();
  const lines = (code ? code.split("\n").length : 0);
  const statusStats = document.getElementById("statusStats");
  if (statusStats) {
    statusStats.textContent = `${lines} lines`;
  }
}

function setVmStatus(status, text) {
  const badge = document.getElementById("vmStatusBadge");
  if (!badge) return;
  badge.className = "status-chip " + status;
  badge.textContent = text || status.toUpperCase();
}

function setLanguagePill(lang) {
  activeLanguage = lang;
  document.querySelectorAll(".lang-btn").forEach(btn => {
    if (btn.getAttribute("data-lang") === lang) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });

  const tabTitle = document.getElementById("editorFileName");
  const tabIcon = document.getElementById("editorTabIcon");
  if (tabTitle) {
    if (currentOpenFilePath) {
      tabTitle.textContent = currentOpenFilePath.split("/").pop();
    } else {
      if (lang === "python") {
        tabTitle.textContent = "main.py";
      } else if (lang === "c") {
        tabTitle.textContent = "main.c";
      } else {
        tabTitle.textContent = "Main.java";
      }
    }
    if (tabIcon) {
      tabIcon.innerHTML = getFileIconSvg(tabTitle.textContent);
    }
  }

  if (monacoEditor && typeof window.monaco !== "undefined") {
    const mqlang = lang === "c" ? "c" : lang === "java" ? "java" : lang === "python" ? "python" : "plaintext";
    window.monaco.editor.setModelLanguage(monacoEditor.getModel(), mqlang);
  }
}

function scrollElementToBottom(el) {
  if (!el) return;
  el.scrollTop = el.scrollHeight;
  if (typeof requestAnimationFrame === "function") {
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
  }
  setTimeout(() => {
    el.scrollTop = el.scrollHeight;
  }, 40);
}

function switchTab(tabId) {
  document.querySelectorAll(".nav-tab").forEach(t => {
    if (t.getAttribute("data-tab") === tabId) {
      t.classList.add("active");
    } else {
      t.classList.remove("active");
    }
  });

  document.querySelectorAll(".tab-body").forEach(p => {
    if (p.id === "tabContent-" + tabId) {
      p.classList.add("active");
    } else {
      p.classList.remove("active");
    }
  });

  if (tabId === "console") {
    scrollElementToBottom(document.getElementById("outputConsole"));
  } else if (tabId === "repl") {
    scrollElementToBottom(document.getElementById("replLog"));
  } else if (tabId === "memory" && stepVm) {
    renderMemorySnapshot(stepVm.getExecutionSnapshot());
  } else if (tabId === "vfs") {
    renderVfsTree();
  }
}

// --- Demo Scripts Language Mapping ---
export const SCRIPT_LANGUAGE_MAP = {
  flagship_tour: "python",
  ascii_star_wars: "python",
  dynamic_cpython_stdlib: "python",
  real_api_requests: "python",
  python_advanced_features: "python",
  python_complete_runtime: "python",
  autonomous_banking_core: "python",
  polyglot_scientific_pipeline: "python",
  multi_tier_imports: "python",
  c_fastmath_sample: "c",
  concurrency_sleep: "c",
  fibonacci_recursion: "c",
  interactive_input: "c",
  loops_and_logic: "c",
  class_and_methods: "java"
};

// --- Demo Scripts Loading ---
function loadSelectedScript() {
  const select = document.getElementById("scriptSelect");
  const scriptKey = select?.value || "flagship_tour";
  const code = DEMO_SCRIPTS[scriptKey] || "";

  const lang = SCRIPT_LANGUAGE_MAP[scriptKey] || "python";
  setLanguagePill(lang);
  setCode(code, lang);

  resetDebuggerState();

  try {
    const ast = parseSource(code, lang);
    const compiler = new BytecodeCompiler();
    activeProgram = compiler.compile(ast);
    renderVisualAST(ast);
    renderBytecode(activeProgram);
  } catch (e) {
    // Some demos require runtime imports; will fully compile on Run
  }

  const outputConsole = document.getElementById("outputConsole");
  if (outputConsole) {
    outputConsole.textContent = `Loaded demo: ${scriptKey}\nReady to execute. Click "Run" (Ctrl+Enter) or "Step" (F10).`;
  }
  const stats = document.getElementById("execStatsBadge");
  if (stats) stats.textContent = "Engine Ready";
  setVmStatus("ready", "Ready");
}

function resetDebuggerState() {
  activeProgram = null;
  stepVm = null;
  stepGenerator = null;
  isPaused = false;
  updatePauseButtonState(false);

  const stepBtn = document.getElementById("stepBtn");
  if (stepBtn) stepBtn.disabled = false;
  const dockStepBtn = document.getElementById("dockStepBtn");
  if (dockStepBtn) dockStepBtn.disabled = false;
  const runBtn = document.getElementById("runBtn");
  if (runBtn) runBtn.disabled = false;
  const stopBtn = document.getElementById("stopBtn");
  if (stopBtn) stopBtn.disabled = true;

  const ip = document.getElementById("ipDisplay");
  if (ip) ip.textContent = "0";
  const sp = document.getElementById("spDisplay");
  if (sp) sp.textContent = "0";
  const opCount = document.getElementById("opcodeCountDisplay");
  if (opCount) opCount.textContent = "0";

  const tbody = document.getElementById("bytecodeTbody");
  if (tbody) {
    tbody.innerHTML = '<tr><td colspan="4" class="empty-row">Run or Compile code to view bytecode.</td></tr>';
  }

  const dockAstBadge = document.getElementById("dockAstBadge");
  if (dockAstBadge) {
    dockAstBadge.className = "badge-mini badge-live";
    dockAstBadge.textContent = "AST: Ready";
  }

  clearActiveAstExecution();
  clearMonacoLineHighlight();
}

// --- Bytecode Rendering & Stepper ---
function renderBytecode(program, activePc = null) {
  const tbody = document.getElementById("bytecodeTbody");
  if (!tbody || !program) return;

  const instructions = program.getInstructionList();
  const opCount = document.getElementById("opcodeCountDisplay");
  if (opCount) opCount.textContent = String(instructions.length);

  let html = "";
  for (const item of instructions) {
    const isActive = activePc !== null && item.pc === activePc;
    const activeClass = isActive ? " pc-active" : "";
    const pcStr = String(item.pc).padStart(4, "0");
    const desc = item.description || "";
    html += `
      <tr class="bytecode-row${activeClass}" id="op-pc-${item.pc}">
        <td class="col-pc">${pcStr}</td>
        <td class="col-op"><strong>${item.opName}</strong></td>
        <td class="col-operand">${escapeHtml(item.operandStr)}</td>
        <td class="col-desc">${escapeHtml(desc)}</td>
      </tr>`;
  }
  tbody.innerHTML = html;

  if (activePc !== null) {
    highlightPc(activePc);
  }
}

function highlightPc(pc) {
  document.querySelectorAll("#bytecodeTbody tr.pc-active").forEach(r => r.classList.remove("pc-active"));
  const row = document.getElementById(`op-pc-${pc}`);
  if (row) {
    row.classList.add("pc-active");
    row.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }
  const ip = document.getElementById("ipDisplay");
  if (ip) ip.textContent = String(pc);
}

// --- Memory & Stack Rendering ---
function renderMemorySnapshot(snapshot) {
  if (!snapshot) return;

  const operandStack = snapshot.operandStack || snapshot.stack || [];
  const callStack = snapshot.callStack || [];
  const globals = snapshot.globals || [];

  // 1. Operand Stack
  const stackContainer = document.getElementById("operandStackList");
  const stackBadge = document.getElementById("stackCountBadge");
  if (stackContainer) {
    if (operandStack.length === 0) {
      stackContainer.innerHTML = `<div class="empty-micro">(Empty Stack)</div>`;
      if (stackBadge) stackBadge.textContent = "0 items";
    } else {
      if (stackBadge) stackBadge.textContent = `${operandStack.length} items`;
      stackContainer.innerHTML = operandStack.slice().reverse().map((item, idx) => {
        const isTop = idx === 0;
        return `
          <div class="stack-item${isTop ? " top" : ""}">
            <span class="stack-idx">[${operandStack.length - 1 - idx}]</span>
            <span class="stack-val">${escapeHtml(item)}</span>
          </div>`;
      }).join("");
    }
  }

  // 2. Call Stack Frames
  const framesContainer = document.getElementById("callStackList");
  const framesBadge = document.getElementById("framesCountBadge");
  if (framesContainer) {
    if (framesBadge) framesBadge.textContent = `${callStack.length} frames`;
    framesContainer.innerHTML = callStack.slice().reverse().map((f) => {
      const activeLocals = (f.locals || []).map((val, i) => `<span class="local-tag">s[${i}]: ${escapeHtml(val)}</span>`).join(" ");
      return `
        <div class="frame-item">
          <div class="frame-title">${escapeHtml(f.fnName || "anonymous")} (Ret: ${f.returnPC ?? 0})</div>
          <div class="frame-locals">${activeLocals || "No active locals"}</div>
        </div>`;
    }).join("");
  }

  // 3. User Globals
  const globalsContainer = document.getElementById("globalsList");
  const globalsBadge = document.getElementById("globalsCountBadge");
  if (globalsContainer) {
    if (globalsBadge) globalsBadge.textContent = `${globals.length} globals`;
    if (globals.length === 0) {
      globalsContainer.innerHTML = `<div class="empty-micro">No user globals active.</div>`;
    } else {
      globalsContainer.innerHTML = globals.map(g => `<span class="global-chip">${escapeHtml(g)}</span>`).join("");
    }
  }
}

// --- File Explorer & Workspace Tree ---
function openFileInEditor(filePath) {
  try {
    currentOpenFilePath = filePath;
    const content = moduleManager.vfs.readFile(filePath);
    const fileName = filePath.split("/").pop();
    const ext = fileName.split(".").pop().toLowerCase();
    const lang = (ext === "c" || ext === "h") ? "c" : (ext === "java") ? "java" : (ext === "py") ? "python" : "plaintext";

    setLanguagePill(lang);
    setCode(content, lang);

    const tabTitle = document.getElementById("editorFileName");
    const tabIcon = document.getElementById("editorTabIcon");
    if (tabTitle) tabTitle.textContent = fileName;
    if (tabIcon) tabIcon.innerHTML = getFileIconSvg(fileName);

    // Update active highlight in explorer tree
    document.querySelectorAll(".tree-row.file-row").forEach(row => {
      if (row.getAttribute("data-path") === filePath) {
        row.classList.add("active");
      } else {
        row.classList.remove("active");
      }
    });

    if (monacoEditor) {
      monacoEditor.layout();
    }
  } catch (err) {
    console.error("Failed to open file in editor:", err);
  }
}

function buildFileTree(filePaths) {
  const root = { name: "", path: "/", isFolder: true, children: {} };
  for (const path of filePaths) {
    const parts = path.split("/").filter(Boolean);
    let curr = root;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = (i === parts.length - 1);
      if (!curr.children[part]) {
        curr.children[part] = {
          name: part,
          path: "/" + parts.slice(0, i + 1).join("/"),
          isFolder: !isFile,
          children: isFile ? null : {}
        };
      }
      curr = curr.children[part];
    }
  }
  return root;
}

function renderTreeNode(node, depth = 0) {
  if (!node || !node.children) return "";
  const entries = Object.values(node.children).sort((a, b) => {
    if (a.isFolder !== b.isFolder) return a.isFolder ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  let html = "";
  for (const item of entries) {
    const indent = depth * 14;
    if (item.isFolder) {
      const isOpen = folderStateMap[item.path] !== false; // default open
      const chevron = isOpen ? CHEVRON_DOWN_SVG : CHEVRON_RIGHT_SVG;
      const folderIcon = isOpen ? FOLDER_OPEN_SVG : FOLDER_CLOSED_SVG;
      html += `
        <div class="tree-folder-group" data-path="${item.path}">
          <div class="tree-row folder-row ${isOpen ? "open" : "collapsed"}" style="padding-left: ${indent + 6}px;" data-path="${item.path}">
            <span class="chevron-wrapper">${chevron}</span>
            <span class="folder-icon-wrapper">${folderIcon}</span>
            <span class="tree-label">${item.name}</span>
          </div>
          <div class="tree-children" style="display: ${isOpen ? "block" : "none"};">
            ${renderTreeNode(item, depth + 1)}
          </div>
        </div>`;
    } else {
      const icon = getFileIconSvg(item.name);
      const isActive = currentOpenFilePath === item.path;
      html += `
        <div class="tree-row file-row ${isActive ? "active" : ""}" style="padding-left: ${indent + 6}px;" data-path="${item.path}">
          <span class="chevron-spacer"></span>
          <span class="file-icon-wrapper">${icon}</span>
          <span class="tree-label">${item.name}</span>
        </div>`;
    }
  }
  return html;
}

function renderExplorerTree() {
  const treeContainer = document.getElementById("explorerTree");
  if (!treeContainer) return;

  const filePaths = Array.from(moduleManager.vfs.files.keys()).sort();
  const root = buildFileTree(filePaths);

  treeContainer.innerHTML = renderTreeNode(root, 0);

  // Folder toggling
  treeContainer.querySelectorAll(".folder-row").forEach(row => {
    row.addEventListener("click", (e) => {
      e.stopPropagation();
      const path = row.getAttribute("data-path");
      const group = row.closest(".tree-folder-group");
      const children = group.querySelector(".tree-children");
      const chevron = row.querySelector(".chevron-wrapper");
      const folderIcon = row.querySelector(".folder-icon-wrapper");

      const isCurrentlyOpen = children.style.display !== "none";
      if (isCurrentlyOpen) {
        children.style.display = "none";
        row.classList.remove("open");
        row.classList.add("collapsed");
        folderStateMap[path] = false;
        if (chevron) chevron.innerHTML = CHEVRON_RIGHT_SVG;
        if (folderIcon) folderIcon.innerHTML = FOLDER_CLOSED_SVG;
      } else {
        children.style.display = "block";
        row.classList.add("open");
        row.classList.remove("collapsed");
        folderStateMap[path] = true;
        if (chevron) chevron.innerHTML = CHEVRON_DOWN_SVG;
        if (folderIcon) folderIcon.innerHTML = FOLDER_OPEN_SVG;
      }
    });
  });

  // File clicking
  treeContainer.querySelectorAll(".file-row").forEach(row => {
    row.addEventListener("click", (e) => {
      e.stopPropagation();
      const path = row.getAttribute("data-path");
      openFileInEditor(path);
    });
  });
}

function initSidebarExplorer() {
  const activityBtn = document.getElementById("activityExplorerBtn");
  const explorerPanel = document.getElementById("sidebarExplorer");
  const collapseBtn = document.getElementById("collapseExplorerBtn");
  const refreshBtn = document.getElementById("refreshExplorerBtn");

  const toggleExplorer = () => {
    if (!explorerPanel) return;
    const isCollapsed = explorerPanel.classList.contains("collapsed");
    if (isCollapsed) {
      explorerPanel.classList.remove("collapsed");
      document.getElementById("sidebarPackages")?.classList.add("collapsed");
      document.getElementById("activityPackagesBtn")?.classList.remove("active");
      if (activityBtn) activityBtn.classList.add("active");
    } else {
      explorerPanel.classList.add("collapsed");
      if (activityBtn) activityBtn.classList.remove("active");
    }
    setTimeout(() => {
      if (monacoEditor) monacoEditor.layout();
    }, 180);
  };

  if (activityBtn) {
    activityBtn.addEventListener("click", toggleExplorer);
  }

  if (collapseBtn) {
    collapseBtn.addEventListener("click", toggleExplorer);
  }

  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => {
      renderExplorerTree();
      renderVfsTree();
    });
  }

  renderExplorerTree();
}

// --- Global Toast & Package Notification System ---

function showToastNotification(title, message, type = "info", duration = 7000) {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `uvm-toast ${type}`;

  let iconSvg = "";
  if (type === "success") {
    iconSvg = `<svg class="uvm-toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
  } else if (type === "error") {
    iconSvg = `<svg class="uvm-toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
  } else if (type === "warning") {
    iconSvg = `<svg class="uvm-toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
  } else {
    iconSvg = `<svg class="uvm-toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
  }

  toast.innerHTML = `
    ${iconSvg}
    <div class="uvm-toast-content">
      <div class="uvm-toast-title">${title}</div>
      <div class="uvm-toast-desc">${message}</div>
    </div>
    <button class="uvm-toast-close" title="Dismiss">✕</button>
  `;

  const dismiss = () => {
    toast.classList.add("fade-out");
    setTimeout(() => toast.remove(), 200);
  };

  toast.querySelector(".uvm-toast-close")?.addEventListener("click", dismiss);
  container.appendChild(toast);

  if (duration > 0) {
    setTimeout(dismiss, duration);
  }
}

function showPackageInlineAlert(title, message, type = "info") {
  const banner = document.getElementById("pkgAlertBanner");
  if (!banner) return;

  banner.className = `pkg-alert-banner ${type}`;
  banner.innerHTML = `
    <div class="pkg-alert-banner-text">
      <strong>${title}</strong>
      <div>${message}</div>
    </div>
    <button class="pkg-alert-banner-close" title="Dismiss">✕</button>
  `;
  banner.style.display = "flex";

  banner.querySelector(".pkg-alert-banner-close")?.addEventListener("click", () => {
    banner.style.display = "none";
  });
}

// Autodetects package installability and specific architectural reasons
function diagnosePackageIntent(rawInput) {
  let name = (rawInput || "").replace(/^pip\s+install\s+/i, "").trim().toLowerCase();
  name = name.split(/[=<>~@]/)[0].trim();

  if (!name) {
    return {
      handled: true,
      title: "Package Name Required",
      message: "Please enter a valid package or module name to install.",
      type: "warning"
    };
  }

  // 1. Check if already installed in VFS
  if (packageManager && packageManager.isInstalled(name)) {
    return {
      handled: true,
      name,
      title: `'${name}' is Already Installed`,
      message: `Module <code>${name}</code> is already in your virtual filesystem at <code>/lib/python3/${name}.py</code> in the file tree. You can directly <code>import ${name}</code> in your code!`,
      type: "info"
    };
  }

  // 2. Built-in high-performance host bridge modules
  const BUILTIN_HOST_MODULES = {
    math: "Built-in high-performance Math bridge with full trigonometry, logarithms, and constants.",
    random: "Built-in Random number generator bridge with randint, uniform, choice, and shuffle.",
    json: "Built-in JSON bridge with dumps, loads, indentation, and object serialization.",
    re: "Built-in Regular Expressions bridge with search, match, findall, sub, and split.",
    regex: "Built-in Regular Expressions bridge (backed directly by the browser's high-speed engine).",
    requests: "Built-in asynchronous HTTP networking bridge with GET, POST, and non-blocking fiber suspension.",
    _fastmath: "Built-in C-extension compiled to UVM bytecode with fast_gcd, fast_fib, and is_prime."
  };
  if (BUILTIN_HOST_MODULES[name]) {
    return {
      handled: true,
      name,
      title: `'${name}' is Already Built-in`,
      message: `No installation needed! ${BUILTIN_HOST_MODULES[name]} You can directly type <code>import ${name}</code> in your script.`,
      type: "info"
    };
  }

  // 3. Heavy Native C/C++ / Fortran / Binary Extensions (Wheels with machine .so/.dll)
  const NATIVE_BINARY_PACKAGES = {
    numpy: "NumPy relies on precompiled C, Fortran BLAS/LAPACK linear algebra binaries, and low-level memory buffers.",
    scipy: "SciPy relies on precompiled Fortran/C scientific computation libraries and BLAS/LAPACK.",
    pandas: "Pandas relies on compiled C extensions, Cython routines, and native NumPy memory arrays.",
    matplotlib: "Matplotlib requires native C++ graphics renderers, FreeType fonts, and desktop GUI backends.",
    seaborn: "Seaborn requires Matplotlib and Pandas native graphical and array dependencies.",
    torch: "PyTorch requires gigabytes of native C++/CUDA GPU and CPU tensor acceleration binaries.",
    pytorch: "PyTorch requires gigabytes of native C++/CUDA GPU and CPU tensor acceleration binaries.",
    tensorflow: "TensorFlow requires massive native C++/XLA binaries and OS thread management.",
    keras: "Keras requires a native backend (TensorFlow, PyTorch, or JAX) with compiled C++ kernels.",
    jax: "JAX relies on native XLA (Accelerated Linear Algebra) C++ compilation targets.",
    cv2: "OpenCV (cv2) requires precompiled C++ computer vision shared libraries (.so/.dll).",
    opencv: "OpenCV requires precompiled C++ computer vision shared libraries (.so/.dll).",
    "opencv-python": "OpenCV requires precompiled C++ computer vision shared libraries.",
    pillow: "Pillow requires native C image codecs (libjpeg, zlib, libpng) and binary C extensions.",
    pil: "PIL/Pillow requires native C image codecs and binary extensions.",
    cryptography: "Cryptography relies on the OpenSSL C library, Rust cryptography bindings, and OS entropy syscalls.",
    bcrypt: "Bcrypt requires compiled C hashing routines.",
    polars: "Polars is implemented in native compiled Rust with SIMD and Apache Arrow memory layout.",
    pyarrow: "PyArrow relies on compiled C++ Apache Arrow libraries.",
    duckdb: "DuckDB is an in-process SQL OLAP engine compiled from C++ native code.",
    lxml: "lxml requires the native C libraries libxml2 and libxslt.",
    cffi: "cffi requires a native C compiler and libffi dynamic linker.",
    cython: "Cython is a C-extension compiler that outputs native C/C++ code requiring GCC/Clang.",
    psycopg2: "psycopg2 requires the native PostgreSQL libpq C client library.",
    mysqlclient: "mysqlclient requires native MySQL C client header and libraries."
  };
  if (NATIVE_BINARY_PACKAGES[name]) {
    return {
      handled: true,
      name,
      title: `Cannot install '${name}' (Binary Wheel)`,
      message: `Although UVM includes a C-extension bytecode compiler for single-file extensions (like <code>_fastmath.c</code>), <strong>${name}</strong> cannot run: ${NATIVE_BINARY_PACKAGES[name]} Client-side browser JavaScript cannot execute raw machine <code>.so</code> / <code>.dll</code> binaries without a full operating system container.`,
      type: "warning"
    };
  }

  // 4. OS Kernel Syscall / Socket / Subprocess Modules
  const OS_KERNEL_MODULES = {
    socket: "Raw TCP/UDP socket creation is blocked by browser security policies. For HTTP APIs, use UVM's built-in 'import requests'!",
    ssl: "Direct TLS socket wrapping is handled by the browser fetch stack, not userland raw sockets.",
    subprocess: "Child process spawning (fork/exec) requires an operating system kernel, which is unavailable in the browser sandbox.",
    multiprocessing: "Multiprocessing requires OS process creation and shared POSIX memory.",
    threading: "Native OS threads are not accessible in browser JS. UVM provides non-blocking cooperative Fibers and 'sleep()' instead!",
    ctypes: "ctypes loads native OS dynamic shared libraries (.dll/.so/.dylib), which cannot be loaded in a browser sandbox.",
    posix: "POSIX system calls are not exposed by the browser environment.",
    sys: "Core system internals are managed directly by UVM's virtual machine runtime."
  };
  if (OS_KERNEL_MODULES[name]) {
    return {
      handled: true,
      name,
      title: `Module '${name}' requires OS Kernel Privileges`,
      message: `${OS_KERNEL_MODULES[name]}`,
      type: "warning"
    };
  }

  // 5. Complex PyPI Frameworks
  const PYPI_FRAMEWORKS = {
    django: "Django is a full-stack server framework requiring complex WSGI/ASGI socket servers and multi-file PyPI wheels.",
    flask: "Flask requires WSGI server backends, Werkzeug routing, and Jinja2 template engines.",
    fastapi: "FastAPI requires ASGI server sockets (uvicorn), Pydantic type validation, and Starlette routing.",
    pydantic: "Pydantic requires compiled C/Rust core validators and complex metaclass introspection.",
    sqlalchemy: "SQLAlchemy requires native database client drivers and dialect engines.",
    pytest: "Pytest is a testing CLI runner designed for command-line file execution."
  };
  if (PYPI_FRAMEWORKS[name]) {
    return {
      handled: true,
      name,
      title: `'${name}' is a Complex PyPI Framework`,
      message: `${PYPI_FRAMEWORKS[name]} UVM's package manager dynamically installs pure-Python modules directly from official CPython 3.12 (e.g. <code>calendar</code>, <code>functools</code>, <code>heapq</code>, <code>colorsys</code>, <code>bisect</code>, <code>string</code>, <code>operator</code>, <code>copy</code>).`,
      type: "warning"
    };
  }

  // 6. Networking alternatives
  if (["urllib", "urllib3", "httpx", "aiohttp", "bs4", "beautifulsoup4"].includes(name)) {
    return {
      handled: true,
      name,
      title: `Use 'requests' for HTTP in UVM`,
      message: `For networking in UVM, use <code>import requests</code>. It is natively bridged to the browser fetch API with asynchronous fiber suspension!`,
      type: "info"
    };
  }

  return { handled: false, name };
}

// Unified package installation workflow with diagnostics and notifications
async function handlePackageInstallation(rawName, triggerButton = null) {
  const diag = diagnosePackageIntent(rawName);

  if (diag.handled) {
    showToastNotification(diag.title, diag.message, diag.type, 9000);
    showPackageInlineAlert(diag.title, diag.message, diag.type);
    logEngine("PACKAGE", `${diag.title}: ${diag.message.replace(/<[^>]+>/g, '')}`);
    return;
  }

  const name = diag.name;
  if (triggerButton) {
    triggerButton.disabled = true;
    triggerButton.textContent = "...";
  }

  try {
    logEngine("PACKAGE", `Fetching official '${name}' from CPython 3.12 repository...`);
    const res = await packageManager.install(name);
    const title = `✓ '${res.name}' Installed Successfully`;
    const message = `Package <code>${res.name}</code> is now in the <code>/lib/python3/</code> folder in the file tree (${(res.size / 1024).toFixed(1)} KB). You can now type <code>import ${res.name}</code> in your script!`;

    showToastNotification(title, message, "success", 8000);
    showPackageInlineAlert(title, message, "success");
    logEngine("PACKAGE", `Successfully installed '${res.name}' into /lib/python3/${res.name}.py`);

    const searchInput = document.getElementById("pkgSearchInput");
    if (searchInput) searchInput.value = "";
    renderPackageManager("");
    renderExplorerTree();
    renderVfsTree();
  } catch (err) {
    let title = `Could not install '${name}'`;
    let message = err.message;
    let type = "error";

    if (err.message.includes("404") || err.message.includes("not found")) {
      title = `Module '${name}' Not Found in CPython 3.12`;
      message = `Could not find <code>${name}.py</code> in the official CPython 3.12 standard library repository. Check spelling or choose an available module from the Popular Modules list below.`;
      type = "error";
    } else if (err.message.includes("Failed to fetch") || err.message.includes("network") || err.message.includes("Could not fetch")) {
      title = `Network Connection Error`;
      message = `Failed to connect to <code>raw.githubusercontent.com</code> to fetch '${name}'. Check your internet connection or network firewall.`;
      type = "error";
    }

    showToastNotification(title, message, type, 9000);
    showPackageInlineAlert(title, message, type);
    logEngine("ERROR", `${title}: ${message.replace(/<[^>]+>/g, '')}`);
  } finally {
    if (triggerButton) {
      triggerButton.disabled = false;
      triggerButton.textContent = triggerButton.getAttribute("data-original-text") || "Install";
    }
  }
}

// --- Package & PIP Manager Implementation ---
let packageManager = null;

function renderPackageManager(filterTerm = "") {
  if (!packageManager) return;
  const term = (filterTerm || "").trim().toLowerCase();

  // 1. Installed list
  const installedContainer = document.getElementById("pkgInstalledList");
  const installedCountEl = document.getElementById("installedCount");
  const installed = packageManager.listInstalled();

  const filteredInstalled = term 
    ? installed.filter(p => p.name.toLowerCase().includes(term) || (p.description && p.description.toLowerCase().includes(term)))
    : installed;

  if (installedCountEl) installedCountEl.textContent = String(installed.length);

  if (installedContainer) {
    if (filteredInstalled.length === 0) {
      installedContainer.innerHTML = `<div class="log-empty-state" style="padding: 4px 8px;">No matching installed packages.</div>`;
    } else {
      installedContainer.innerHTML = filteredInstalled.map(pkg => {
        const typeClass = pkg.type.includes("Host") ? "host" : pkg.type.includes("Stdlib") ? "stdlib" : "pypi";
        const uninstallBtn = pkg.canUninstall 
          ? `<button class="btn-pkg-action uninstall" data-action="uninstall" data-pkg="${pkg.name}" title="Uninstall package">Uninstall</button>` 
          : `<span class="pkg-version">built-in</span>`;
        return `
          <div class="pkg-item" id="pkg-card-${pkg.name}">
            <div class="pkg-item-top">
              <span class="pkg-name">${escapeHtml(pkg.name)}</span>
              <span class="pkg-type-badge ${typeClass}">${pkg.type}</span>
            </div>
            <div class="pkg-desc">${escapeHtml(pkg.description || "Python package")}</div>
            <div class="pkg-footer">
              <span class="pkg-version">v${pkg.version || "1.0.0"}</span>
              ${uninstallBtn}
            </div>
          </div>
        `;
      }).join("");

      // Bind uninstall buttons
      installedContainer.querySelectorAll(".btn-pkg-action.uninstall").forEach(btn => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          const pkgName = btn.getAttribute("data-pkg");
          btn.disabled = true;
          btn.textContent = "...";
          packageManager.uninstall(pkgName);
          renderPackageManager(document.getElementById("pkgSearchInput")?.value || "");
          renderExplorerTree();
          showToastNotification(`Uninstalled '${pkgName}'`, `Removed module <code>${pkgName}</code> from <code>/lib/python3/</code> in the file tree.`, "info", 5000);
          showPackageInlineAlert(`Uninstalled '${pkgName}'`, `Module removed from virtual filesystem.`, "info");
        });
      });
    }
  }

  // 2. Popular registry
  const registryContainer = document.getElementById("pkgRegistryList");
  if (registryContainer) {
    const filteredPopular = term
      ? POPULAR_REGISTRY.filter(p => p.name.toLowerCase().includes(term) || p.description.toLowerCase().includes(term) || (p.category && p.category.toLowerCase().includes(term)))
      : POPULAR_REGISTRY;

    if (filteredPopular.length === 0) {
      registryContainer.innerHTML = `<div class="log-empty-state" style="padding: 4px 8px;">No matching packages in registry. Type name above to install from CPython / PyPI.</div>`;
    } else {
      registryContainer.innerHTML = filteredPopular.map(pkg => {
        const isInstalled = packageManager.isInstalled(pkg.name);
        const actionBtn = isInstalled
          ? `<span class="btn-pkg-action installed">✓ Installed</span>`
          : `<button class="btn-pkg-action install" data-action="install" data-pkg="${pkg.name}" title="Install ${pkg.name}">Install</button>`;
        return `
          <div class="pkg-item" id="pkg-pop-${pkg.name}">
            <div class="pkg-item-top">
              <span class="pkg-name">${escapeHtml(pkg.name)}</span>
              <span class="pkg-type-badge stdlib">${escapeHtml(pkg.category || "Stdlib")}</span>
            </div>
            <div class="pkg-desc">${escapeHtml(pkg.description)}</div>
            <div class="pkg-footer">
              <span class="pkg-version">v${pkg.version}</span>
              ${actionBtn}
            </div>
          </div>
        `;
      }).join("");

      // Bind install buttons
      registryContainer.querySelectorAll(".btn-pkg-action.install").forEach(btn => {
        btn.addEventListener("click", async (e) => {
          e.stopPropagation();
          const pkgName = btn.getAttribute("data-pkg");
          btn.setAttribute("data-original-text", "Install");
          await handlePackageInstallation(pkgName, btn);
        });
      });
    }
  }
}

function initPackageSidebar() {
  packageManager = new PackageManager(moduleManager, (category, message) => {
    logEngine(category, message);
  });

  const activityPackagesBtn = document.getElementById("activityPackagesBtn");
  const activityExplorerBtn = document.getElementById("activityExplorerBtn");
  const packagesPanel = document.getElementById("sidebarPackages");
  const explorerPanel = document.getElementById("sidebarExplorer");
  const collapsePackagesBtn = document.getElementById("collapsePackagesBtn");
  const refreshPackagesBtn = document.getElementById("refreshPackagesBtn");
  const pkgSearchInput = document.getElementById("pkgSearchInput");
  const pkgInstallDirectBtn = document.getElementById("pkgInstallDirectBtn");

  const showPackages = () => {
    if (!packagesPanel) return;
    const isPackagesOpen = !packagesPanel.classList.contains("collapsed");
    if (isPackagesOpen) {
      // Toggle off
      packagesPanel.classList.add("collapsed");
      activityPackagesBtn?.classList.remove("active");
    } else {
      // Open packages, close explorer
      packagesPanel.classList.remove("collapsed");
      explorerPanel?.classList.add("collapsed");
      activityPackagesBtn?.classList.add("active");
      activityExplorerBtn?.classList.remove("active");
      renderPackageManager(pkgSearchInput?.value || "");
    }
    setTimeout(() => {
      if (monacoEditor) monacoEditor.layout();
    }, 180);
  };

  if (activityPackagesBtn) {
    activityPackagesBtn.addEventListener("click", showPackages);
  }

  if (collapsePackagesBtn) {
    collapsePackagesBtn.addEventListener("click", () => {
      packagesPanel?.classList.add("collapsed");
      activityPackagesBtn?.classList.remove("active");
      setTimeout(() => {
        if (monacoEditor) monacoEditor.layout();
      }, 180);
    });
  }

  if (refreshPackagesBtn) {
    refreshPackagesBtn.addEventListener("click", () => {
      renderPackageManager(pkgSearchInput?.value || "");
    });
  }

  // Real-time search filter
  if (pkgSearchInput) {
    pkgSearchInput.addEventListener("input", () => {
      renderPackageManager(pkgSearchInput.value);
    });
    pkgSearchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        pkgInstallDirectBtn?.click();
      }
    });
  }

  // Quick Direct Install
  if (pkgInstallDirectBtn) {
    pkgInstallDirectBtn.addEventListener("click", async () => {
      const rawName = (pkgSearchInput?.value || "").trim();
      if (!rawName) {
        pkgSearchInput?.focus();
        showPackageInlineAlert("Package Name Required", "Please enter a package name in the input box above.", "warning");
        return;
      }
      pkgInstallDirectBtn.setAttribute("data-original-text", "Install");
      await handlePackageInstallation(rawName, pkgInstallDirectBtn);
    });
  }

  // Accordion toggles
  document.getElementById("pkgInstalledToggle")?.addEventListener("click", () => {
    const list = document.getElementById("pkgInstalledList");
    if (list) list.style.display = list.style.display === "none" ? "flex" : "none";
  });
  document.getElementById("pkgRegistryToggle")?.addEventListener("click", () => {
    const list = document.getElementById("pkgRegistryList");
    if (list) list.style.display = list.style.display === "none" ? "flex" : "none";
  });

  renderPackageManager();
}

// --- VFS Tree Rendering ---
function renderVfsTree() {
  const listEl = document.getElementById("vfsTreeList");
  const drawerList = document.getElementById("vfsDrawerList");
  const files = Array.from(moduleManager.vfs.files.keys()).sort();

  const makeItemHtml = (filePath) => {
    const name = filePath.split("/").pop();
    const isPy = name.endsWith(".py");
    const isC = name.endsWith(".c");
    const icon = isPy ? "🐍" : isC ? "⚙️" : "📄";
    return `
      <div class="vfs-tree-item" data-path="${filePath}">
        <span>${icon} ${filePath}</span>
      </div>`;
  };

  const makeDrawerItem = (filePath) => {
    return `
      <div class="vfs-drawer-item" data-path="${filePath}">
        <span>${filePath}</span>
        <button class="btn-mini load-vfs-btn" data-path="${filePath}">Open</button>
      </div>`;
  };

  if (listEl) {
    listEl.innerHTML = files.map(makeItemHtml).join("");
    listEl.querySelectorAll(".vfs-tree-item").forEach(item => {
      item.addEventListener("click", () => {
        listEl.querySelectorAll(".vfs-tree-item").forEach(i => i.classList.remove("active"));
        item.classList.add("active");
        const path = item.getAttribute("data-path");
        showVfsFilePreview(path);
      });
    });
  }

  if (drawerList) {
    drawerList.innerHTML = files.map(makeDrawerItem).join("");
    drawerList.querySelectorAll(".load-vfs-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const path = btn.getAttribute("data-path");
        const content = moduleManager.vfs.readFile(path);
        const lang = path.endsWith(".c") ? "c" : "python";
        setLanguagePill(lang);
        setCode(content, lang);
        document.getElementById("vfsDrawer").style.display = "none";
        document.getElementById("editorFileName").textContent = path.split("/").pop();
      });
    });
  }
}

function showVfsFilePreview(filePath) {
  try {
    const content = moduleManager.vfs.readFile(filePath);
    document.getElementById("vfsPreviewTitle").textContent = filePath;
    document.getElementById("vfsPreviewContent").textContent = content;
    const loadBtn = document.getElementById("loadVfsIntoEditorBtn");
    loadBtn.style.display = "inline-block";
    loadBtn.onclick = () => {
      const lang = filePath.endsWith(".c") ? "c" : "python";
      setLanguagePill(lang);
      setCode(content, lang);
      document.getElementById("editorFileName").textContent = filePath.split("/").pop();
      switchTab("console");
    };
  } catch (err) {
    document.getElementById("vfsPreviewContent").textContent = "// Error: " + err.message;
  }
}

function escapeHtml(str) {
  if (typeof str !== "string") str = String(str);
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// --- Visual AST Tree Inspector ---
let activeAst = null;
let astViewMode = "tree";

function countAstNodes(node) {
  if (!node || typeof node !== "object") return 0;
  let count = 1;
  for (const val of Object.values(node)) {
    if (Array.isArray(val)) {
      for (const item of val) count += countAstNodes(item);
    } else if (val && typeof val === "object" && val.type) {
      count += countAstNodes(val);
    }
  }
  return count;
}

function getAstBadgeClass(type) {
  if (!type) return "ast-badge-general";
  if (type.endsWith("Statement") || type === "BlockStatement") return "ast-badge-statement";
  if (type.endsWith("Declaration")) return "ast-badge-declaration";
  if (type.endsWith("Expression")) return "ast-badge-expression";
  if (type.includes("Literal")) return "ast-badge-literal";
  if (type === "Identifier") return "ast-badge-identifier";
  return "ast-badge-general";
}

function createAstNodeElement(propName, node, depth = 0) {
  const isObject = node && typeof node === "object";
  const isAstNode = isObject && typeof node.type === "string";

  const nodeEl = document.createElement("div");
  nodeEl.className = "ast-node";
  if (node && node._nodeId) {
    nodeEl.id = `ast-node-${node._nodeId}`;
    nodeEl.dataset.nodeId = String(node._nodeId);
  }
  if (depth > 2) {
    nodeEl.classList.add("collapsed");
  }

  const header = document.createElement("div");
  header.className = "ast-node-header";

  const toggle = document.createElement("span");
  toggle.className = "ast-toggle";
  toggle.textContent = "▼";
  header.appendChild(toggle);

  if (propName) {
    const propSpan = document.createElement("span");
    propSpan.className = "ast-prop-label";
    propSpan.textContent = `${propName}:`;
    header.appendChild(propSpan);
  }

  if (isAstNode) {
    const badge = document.createElement("span");
    badge.className = `ast-badge ${getAstBadgeClass(node.type)}`;
    badge.textContent = node.type;
    header.appendChild(badge);

    let label = "";
    if (node.name !== undefined) label = `"${node.name}"`;
    else if (node.value !== undefined) label = JSON.stringify(node.value);
    else if (node.operator !== undefined) label = `(${node.operator})`;
    else if (node.id && node.id.name) label = `(${node.id.name})`;

    if (label) {
      const valSpan = document.createElement("span");
      valSpan.className = "ast-val-preview";
      valSpan.textContent = label;
      header.appendChild(valSpan);
    }

    const summary = document.createElement("span");
    summary.className = "ast-summary";
    summary.textContent = "...";
    header.appendChild(summary);
  } else {
    const valSpan = document.createElement("span");
    valSpan.className = "ast-val-preview";
    valSpan.textContent = JSON.stringify(node);
    header.appendChild(valSpan);
  }

  nodeEl.appendChild(header);

  if (isObject) {
    const childrenContainer = document.createElement("div");
    childrenContainer.className = "ast-node-children";

    let childCount = 0;
    const ignoredKeys = new Set(["type", "loc", "start", "end", "comments", "source", "raw", "_nodeId"]);

    for (const [key, value] of Object.entries(node)) {
      if (ignoredKeys.has(key)) continue;

      if (Array.isArray(value)) {
        if (value.length === 0) continue;
        childCount++;
        const arrayNode = document.createElement("div");
        arrayNode.className = "ast-node";
        if (depth > 2) arrayNode.classList.add("collapsed");

        const arrHeader = document.createElement("div");
        arrHeader.className = "ast-node-header";

        const arrToggle = document.createElement("span");
        arrToggle.className = "ast-toggle";
        arrToggle.textContent = "▼";
        arrHeader.appendChild(arrToggle);

        const arrLabel = document.createElement("span");
        arrLabel.className = "ast-prop-label";
        arrLabel.textContent = `${key} [${value.length}]`;
        arrHeader.appendChild(arrLabel);

        const arrSummary = document.createElement("span");
        arrSummary.className = "ast-summary";
        arrSummary.textContent = "...";
        arrHeader.appendChild(arrSummary);

        arrayNode.appendChild(arrHeader);

        const arrChildren = document.createElement("div");
        arrChildren.className = "ast-node-children";
        value.forEach((item, idx) => {
          arrChildren.appendChild(createAstNodeElement(`[${idx}]`, item, depth + 1));
        });
        arrayNode.appendChild(arrChildren);

        arrHeader.addEventListener("click", (e) => {
          e.stopPropagation();
          arrayNode.classList.toggle("collapsed");
        });

        childrenContainer.appendChild(arrayNode);
      } else if (value && typeof value === "object" && value.type) {
        childCount++;
        childrenContainer.appendChild(createAstNodeElement(key, value, depth + 1));
      } else if (value !== null && value !== undefined) {
        const propRow = document.createElement("div");
        propRow.className = "ast-node leaf";
        propRow.innerHTML = `
          <div class="ast-node-header">
            <span class="ast-toggle"></span>
            <span class="ast-prop-label">${escapeHtml(key)}:</span>
            <span class="ast-val-preview">${escapeHtml(JSON.stringify(value))}</span>
          </div>`;
        childrenContainer.appendChild(propRow);
        childCount++;
      }
    }

    if (childCount === 0) {
      nodeEl.classList.add("leaf");
    } else {
      header.addEventListener("click", (e) => {
        e.stopPropagation();
        nodeEl.classList.toggle("collapsed");
      });
      nodeEl.appendChild(childrenContainer);
    }
  } else {
    nodeEl.classList.add("leaf");
  }

  return nodeEl;
}

function renderVisualAST(ast) {
  activeAst = ast;
  const container = document.getElementById("astVisualContainer");
  const rawOutput = document.getElementById("astOutput");
  const countBadge = document.getElementById("dockAstBadge");

  if (!ast) {
    if (container) container.innerHTML = `<div class="empty-notice">No AST available.</div>`;
    if (rawOutput) rawOutput.textContent = "// No AST available.";
    if (countBadge) countBadge.textContent = "AST: Idle";
    return;
  }

  const totalNodes = countAstNodes(ast);
  if (countBadge) {
    countBadge.className = "badge-mini badge-live";
    countBadge.textContent = `AST: ${totalNodes} nodes`;
  }
  if (rawOutput) rawOutput.textContent = JSON.stringify(ast, null, 2);

  if (container) {
    container.innerHTML = "";
    const treeRoot = document.createElement("div");
    treeRoot.className = "ast-tree";
    treeRoot.appendChild(createAstNodeElement("Program", ast, 0));
    container.appendChild(treeRoot);
  }
}

function highlightAstForPc(pc) {
  clearActiveAstExecution();
  if (!activeProgram || !activeProgram.sourceMap) return;

  let matched = null;
  if (activeProgram.sourceMap.has(pc)) {
    matched = activeProgram.sourceMap.get(pc);
  } else {
    let bestPc = -1;
    for (const entryPc of activeProgram.sourceMap.keys()) {
      if (entryPc <= pc && entryPc > bestPc) {
        bestPc = entryPc;
      }
    }
    if (bestPc !== -1) {
      matched = activeProgram.sourceMap.get(bestPc);
    }
  }

  if (matched && matched.nodeId) {
    const el = document.getElementById(`ast-node-${matched.nodeId}`);
    if (el) {
      el.classList.remove("collapsed");
      let parent = el.parentElement;
      while (parent && parent.classList.contains("ast-node-children")) {
        const parentNode = parent.parentElement;
        if (parentNode && parentNode.classList.contains("ast-node")) {
          parentNode.classList.remove("collapsed");
        }
        parent = parentNode ? parentNode.parentElement : null;
      }

      const header = el.querySelector(".ast-node-header");
      if (header) {
        header.classList.add("active-exec");
        let indicator = header.querySelector(".ast-exec-indicator");
        if (!indicator) {
          indicator = document.createElement("span");
          indicator.className = "ast-exec-indicator";
          header.appendChild(indicator);
        }
        indicator.textContent = `▶ IP: ${pc}`;
        header.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }

      const badge = document.getElementById("dockAstBadge");
      if (badge) {
        badge.className = "badge-mini badge-live stepping";
        badge.textContent = `IP: ${pc} (${matched.type || 'AST'})`;
      }
    }
  }
}

function clearActiveAstExecution() {
  document.querySelectorAll(".ast-node-header.active-exec").forEach(el => {
    el.classList.remove("active-exec");
    const indicator = el.querySelector(".ast-exec-indicator");
    if (indicator) indicator.remove();
  });
}

function highlightMonacoLine(lineNumber) {
  if (!monacoEditor || typeof window.monaco === "undefined" || !lineNumber) return;
  try {
    editorDecorations = monacoEditor.deltaDecorations(editorDecorations, [
      {
        range: new window.monaco.Range(lineNumber, 1, lineNumber, 1),
        options: {
          isWholeLine: true,
          className: "monaco-exec-line"
        }
      }
    ]);
    monacoEditor.revealLineInCenterIfOutsideViewport(lineNumber);
  } catch (e) {}
}

function clearMonacoLineHighlight() {
  if (monacoEditor && editorDecorations && editorDecorations.length > 0) {
    editorDecorations = monacoEditor.deltaDecorations(editorDecorations, []);
  }
}

function initAstToolbar() {
  const treeBtn = document.getElementById("astViewTreeBtn");
  const jsonBtn = document.getElementById("astViewJsonBtn");
  const expandAllBtn = document.getElementById("astExpandAllBtn");
  const collapseAllBtn = document.getElementById("astCollapseAllBtn");
  const copyBtn = document.getElementById("copyAstBtn");
  const visualContainer = document.getElementById("astVisualContainer");
  const jsonContainer = document.getElementById("astOutput");

  if (treeBtn && jsonBtn) {
    treeBtn.addEventListener("click", () => {
      astViewMode = "tree";
      treeBtn.classList.add("active");
      jsonBtn.classList.remove("active");
      if (visualContainer) visualContainer.style.display = "block";
      if (jsonContainer) jsonContainer.style.display = "none";
    });

    jsonBtn.addEventListener("click", () => {
      astViewMode = "json";
      jsonBtn.classList.add("active");
      treeBtn.classList.remove("active");
      if (visualContainer) visualContainer.style.display = "none";
      if (jsonContainer) jsonContainer.style.display = "block";
    });
  }

  if (expandAllBtn && visualContainer) {
    expandAllBtn.addEventListener("click", () => {
      visualContainer.querySelectorAll(".ast-node.collapsed").forEach(el => el.classList.remove("collapsed"));
    });
  }

  if (collapseAllBtn && visualContainer) {
    collapseAllBtn.addEventListener("click", () => {
      visualContainer.querySelectorAll(".ast-node").forEach(el => {
        if (!el.classList.contains("leaf")) el.classList.add("collapsed");
      });
      const root = visualContainer.querySelector(".ast-tree > .ast-node");
      if (root) root.classList.remove("collapsed");
    });
  }

  if (copyBtn) {
    copyBtn.addEventListener("click", () => {
      if (activeAst) {
        navigator.clipboard.writeText(JSON.stringify(activeAst, null, 2));
        copyBtn.textContent = "Copied!";
        setTimeout(() => (copyBtn.textContent = "Copy"), 1500);
      }
    });
  }
}

function initDockTabs() {
  const tabAst = document.getElementById("dockTab-ast");
  const tabEngine = document.getElementById("dockTab-engine");
  const contentAst = document.getElementById("dockContent-ast");
  const contentEngine = document.getElementById("dockContent-engine");

  const switchDock = (target) => {
    if (target === "ast") {
      tabAst?.classList.add("active");
      tabEngine?.classList.remove("active");
      if (contentAst) {
        contentAst.style.display = "flex";
        contentAst.classList.add("active");
      }
      if (contentEngine) {
        contentEngine.style.display = "none";
        contentEngine.classList.remove("active");
      }
    } else {
      tabEngine?.classList.add("active");
      tabAst?.classList.remove("active");
      if (contentEngine) {
        contentEngine.style.display = "flex";
        contentEngine.classList.add("active");
      }
      if (contentAst) {
        contentAst.style.display = "none";
        contentAst.classList.remove("active");
      }
      scrollElementToBottom(document.getElementById("engineLogConsole"));
    }
  };

  tabAst?.addEventListener("click", () => switchDock("ast"));
  tabEngine?.addEventListener("click", () => switchDock("engine"));

  document.getElementById("dockStepBtn")?.addEventListener("click", stepInstruction);
  document.getElementById("dockPauseBtn")?.addEventListener("click", togglePauseExecution);
}

// --- Engine & Telemetry Diagnostics Logger ---
let engineLogCount = 0;

function logEngine(category, message, level = "info") {
  const consoleEl = document.getElementById("engineLogConsole");
  const badgeEl = document.getElementById("engineLogBadge");
  if (!consoleEl) return;

  const emptyState = consoleEl.querySelector(".log-empty-state");
  if (emptyState) {
    consoleEl.innerHTML = "";
  }

  const now = new Date();
  const timeStr = [
    String(now.getHours()).padStart(2, "0"),
    String(now.getMinutes()).padStart(2, "0"),
    String(now.getSeconds()).padStart(2, "0")
  ].join(":") + "." + String(now.getMilliseconds()).padStart(3, "0");

  const lineEl = document.createElement("div");
  lineEl.className = `log-line ${level}`;

  const catClass = `tag-${category.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
  lineEl.innerHTML = `
    <span class="log-time">${timeStr}</span>
    <span class="log-tag ${catClass}">${escapeHtml(category)}</span>
    <span class="log-msg">${escapeHtml(message)}</span>
  `;

  consoleEl.appendChild(lineEl);
  scrollElementToBottom(consoleEl);

  engineLogCount++;
  if (badgeEl) {
    badgeEl.textContent = `${engineLogCount} events`;
  }
}

// --- Execution Controller ---
function requestTerminalInput(promptText, vm) {
  return new Promise((resolve) => {
    const inputArea = document.getElementById("inputArea");
    const inputEl = document.getElementById("interactiveInput");
    const sendBtn = document.getElementById("sendInputBtn");
    const outputConsole = document.getElementById("outputConsole");
    if (!inputArea || !inputEl || !sendBtn) {
      resolve("");
      return;
    }
    inputArea.style.display = "flex";
    inputEl.value = "";
    inputEl.placeholder = promptText || "Enter input and press Enter...";
    inputEl.focus();

    const submit = () => {
      const val = inputEl.value;
      inputArea.style.display = "none";
      sendBtn.removeEventListener("click", submit);
      inputEl.removeEventListener("keydown", handleKey);
      if (vm) {
        vm.log(`> ${val}`);
        if (outputConsole) {
          outputConsole.textContent = vm.consoleOutput;
          outputConsole.scrollTop = outputConsole.scrollHeight;
        }
      }
      resolve(val);
    };

    const handleKey = (e) => {
      if (e.key === "Enter") submit();
    };

    sendBtn.addEventListener("click", submit);
    inputEl.addEventListener("keydown", handleKey);
  });
}

async function executeProgram() {
  const code = getCode();
  const startTime = performance.now();
  resetDebuggerState();

  const outputConsole = document.getElementById("outputConsole");
  const runBtn = document.getElementById("runBtn");
  const stepBtn = document.getElementById("stepBtn");
  const stopBtn = document.getElementById("stopBtn");
  const execStats = document.getElementById("execStatsBadge");
  const inputArea = document.getElementById("inputArea");

  outputConsole.textContent = "";
  logEngine("COMPILER", `Compiling source code into UVM Bytecode (${code.length} chars, mode: ${activeLanguage.toUpperCase()})...`);
  setVmStatus("running", "Running");
  runBtn.disabled = true;
  stepBtn.disabled = true;
  stopBtn.disabled = false;
  isPaused = false;
  updatePauseButtonState(false);
  clearActiveAstExecution();
  clearMonacoLineHighlight();
  inputArea.style.display = "none";

  try {
    moduleManager.clearCache();

    // 0. Pre-fetch missing remote standard library imports
    if (activeLanguage === "python") {
      const matches = code.matchAll(/(?:from\s+([a-zA-Z0-9_.]+)\s+import|import\s+([a-zA-Z0-9_.]+))/g);
      for (const match of matches) {
        const modName = match[1] || match[2];
        if (modName && moduleManager.hasModule && !moduleManager.hasModule(modName) && !modName.includes('.')) {
          try {
            logEngine("VFS", `Dynamically fetching official '${modName}' from CPython...`);
            await moduleManager.fetchAndCacheModule(modName);
            logEngine("VFS", `Successfully cached '${modName}' into in-memory VFS.`);
            renderVfsTree();
          } catch (e) {
            logEngine("VFS", `Notice: Remote fetch for '${modName}' deferred to runtime: ${e.message}`, "error");
          }
        }
      }
    }

    // 1. Parse source code
    const parseStart = performance.now();
    const ast = parseSource(code, activeLanguage);
    const parseDuration = (performance.now() - parseStart).toFixed(1);
    logEngine("AST", `Syntax tree generated in ${parseDuration}ms (${ast.body ? ast.body.length : 1} top-level nodes)`);

    // 2. Compile AST to Bytecode
    const compStart = performance.now();
    const compiler = new BytecodeCompiler();
    activeProgram = compiler.compile(ast);
    const compDuration = (performance.now() - compStart).toFixed(1);
    const instrCount = activeProgram.instructions ? activeProgram.instructions.length : 0;
    const constCount = activeProgram.constants ? activeProgram.constants.length : 0;
    logEngine("BYTECODE", `Compiled ${instrCount} instructions in ${compDuration}ms (${constCount} constants)`);

    // 3. Display AST in AST Tab (Visual Tree & Raw JSON)
    renderVisualAST(ast);

    // 4. Render Bytecode in Disassembler Tab
    renderBytecode(activeProgram);

    // 5. Setup Virtual Machine
    const vm = new VirtualMachine({
      moduleManager,
      onPrint: (text) => {
        outputConsole.textContent = vm.consoleOutput;
        outputConsole.scrollTop = outputConsole.scrollHeight;
      },
      onWrite: (chunk, fullText) => {
        outputConsole.textContent = fullText;
        outputConsole.scrollTop = outputConsole.scrollHeight;
      }
    });
    stepVm = vm;

    // 6. Spawn in Scheduler
    const scheduler = new Scheduler({ moduleManager, vm });
    activeScheduler = scheduler;
    scheduler.spawn(vm.execute(activeProgram));

    // 7. Interactive Terminal Input hook
    scheduler.onInputRequired = (promptText, onReceived) => {
      requestTerminalInput(promptText, vm).then(onReceived);
    };

    // 8. Run Scheduler
    scheduler.run(
      () => {
        const duration = (performance.now() - startTime).toFixed(1);
        outputConsole.textContent = vm.consoleOutput || "(Program executed with no standard output)";
        outputConsole.scrollTop = outputConsole.scrollHeight;
        logEngine("RUNTIME", `[Finished in ${duration}ms | ${vm.instructionCount} VM opcodes executed]`);
        execStats.textContent = `Completed in ${duration}ms (${vm.instructionCount} opcodes)`;
        setVmStatus("ready", "Ready");
        runBtn.disabled = false;
        stepBtn.disabled = false;
        stopBtn.disabled = true;
        isPaused = false;
        activeScheduler = null;
        updatePauseButtonState(false);
        const dockAstBadge = document.getElementById("dockAstBadge");
        if (dockAstBadge) {
          dockAstBadge.className = "badge-mini badge-live";
          dockAstBadge.textContent = "AST: Finished";
        }
        renderMemorySnapshot(vm.getExecutionSnapshot());
        renderVfsTree();
        clearActiveAstExecution();
        clearMonacoLineHighlight();
      },
      (err) => {
        const duration = (performance.now() - startTime).toFixed(1);
        outputConsole.textContent = (vm.consoleOutput ? vm.consoleOutput + "\n" : "") +
          `Traceback (most recent call last):\n  RuntimeError: ${err.message}`;
        outputConsole.scrollTop = outputConsole.scrollHeight;
        logEngine("ERROR", `Runtime Error: ${err.message} [Halted after ${duration}ms]`, "error");
        execStats.textContent = `Halted after ${duration}ms`;
        setVmStatus("error", "Error");
        runBtn.disabled = false;
        stepBtn.disabled = false;
        stopBtn.disabled = true;
        isPaused = false;
        activeScheduler = null;
        updatePauseButtonState(false);
        const dockAstBadge = document.getElementById("dockAstBadge");
        if (dockAstBadge) {
          dockAstBadge.className = "badge-mini badge-live";
          dockAstBadge.textContent = "AST: Error";
        }
        renderMemorySnapshot(vm.getExecutionSnapshot());
        clearActiveAstExecution();
        clearMonacoLineHighlight();
      }
    );

  } catch (err) {
    const duration = (performance.now() - startTime).toFixed(1);
    outputConsole.textContent = `SyntaxError: ${err.message}`;
    logEngine("ERROR", `Compilation Error: ${err.message} [Failed after ${duration}ms]`, "error");
    execStats.textContent = "Compile Error";
    setVmStatus("error", "Syntax Error");
    runBtn.disabled = false;
    stepBtn.disabled = false;
    stopBtn.disabled = true;
    isPaused = false;
    updatePauseButtonState(false);
    clearActiveAstExecution();
    clearMonacoLineHighlight();
  }
}

// --- Single-Step Debugger & AST Live Sync ---
let lastSteppedCode = "";

async function stepInstruction() {
  const code = getCode();

  // If code changed since last step and not running in scheduler, restart stepper
  if (code !== lastSteppedCode && !activeScheduler) {
    stepVm = null;
    stepGenerator = null;
  }
  lastSteppedCode = code;

  // Case 1: If a running program was paused, advance 1 instruction:
  if (activeScheduler && activeScheduler.isPaused) {
    const fiber = activeScheduler.fibers.find(f => f.status === "running" || f.status === "ready");
    if (fiber) {
      const stepBtn = document.getElementById("stepBtn");
      const dockStepBtn = document.getElementById("dockStepBtn");
      if (stepBtn) stepBtn.disabled = true;
      if (dockStepBtn) dockStepBtn.disabled = true;

      try {
        if (stepVm) {
          stepVm.singleStepMode = true;
        }
        let stepRes = fiber.currentStep || fiber.generator.next();
        fiber.currentStep = null;

        while (!stepRes.done && stepRes.value && stepRes.value.type !== "STEP") {
          const cmd = stepRes.value;
          if (cmd.type === "ASYNC_PROMISE") {
            logEngine("ASYNC", "Awaiting asynchronous network/promise resolution...");
            setVmStatus("running", "Waiting for Network");
            try {
              const resolved = await cmd.promise;
              setVmStatus("paused", "Paused");
              stepRes = fiber.generator.next(resolved);
            } catch (err) {
              setVmStatus("paused", "Paused");
              stepRes = fiber.generator.throw(err);
            }
          } else if (cmd.type === "ASYNC_IMPORT") {
            logEngine("VFS", `Dynamically fetching '${cmd.moduleName}'...`);
            try {
              const mm = (activeScheduler.interpreter && activeScheduler.interpreter.moduleManager) || moduleManager;
              const mod = await mm.fetchAndCacheModule(cmd.moduleName, fiber.vm);
              renderVfsTree();
              stepRes = fiber.generator.next(mod);
            } catch (err) {
              stepRes = fiber.generator.throw(err);
            }
          } else if (cmd.type === "SLEEP") {
            logEngine("SLEEP", `Sleeping for ${cmd.duration}ms...`);
            await new Promise(r => setTimeout(r, cmd.duration));
            stepRes = fiber.generator.next();
          } else if (cmd.type === "SUSPEND_FOR_INPUT") {
            const inputVal = await requestTerminalInput(cmd.prompt, stepVm);
            stepRes = fiber.generator.next(inputVal);
          } else {
            stepRes = fiber.generator.next();
          }
        }

        if (stepRes.done) {
          logEngine("STEPPER", "[Paused program completed execution]");
          setVmStatus("ready", "Done");
          activeScheduler.stop();
          activeScheduler = null;
          isPaused = false;
          updatePauseButtonState(false);
          document.getElementById("stopBtn").disabled = true;
          document.getElementById("runBtn").disabled = false;
          clearActiveAstExecution();
          clearMonacoLineHighlight();
          return;
        }
        if (stepVm) {
          const snapshot = stepVm.getExecutionSnapshot();
          highlightPc(snapshot.pc);
          highlightAstForPc(snapshot.pc);
          renderMemorySnapshot(snapshot);
          const instructions = activeProgram?.getInstructionList?.() || [];
          const nextInstr = instructions.find(i => i.pc === snapshot.pc);
          const opName = nextInstr ? nextInstr.opName : "OP";
          const stackDepth = (snapshot.stack || snapshot.operandStack || []).length;
          logEngine("STEPPER", `Step IP ${snapshot.pc}: ${opName} (Stack Depth: ${stackDepth})`);
        }
        return;
      } catch (err) {
        logEngine("ERROR", `Step error: ${err.message}`, "error");
        return;
      } finally {
        if (stepBtn) stepBtn.disabled = false;
        if (dockStepBtn) dockStepBtn.disabled = false;
      }
    }
  }

  // Case 2: Normal standalone single-stepping:
  if (!stepVm || !stepGenerator) {
    try {
      // Pre-fetch dynamic stdlib imports if any
      if (activeLanguage === "python") {
        const matches = code.matchAll(/(?:from\s+([a-zA-Z0-9_.]+)\s+import|import\s+([a-zA-Z0-9_.]+))/g);
        for (const match of matches) {
          const modName = match[1] || match[2];
          if (modName && moduleManager.hasModule && !moduleManager.hasModule(modName) && !modName.includes('.')) {
            try {
              logEngine("VFS", `Dynamically fetching official '${modName}' from CPython...`);
              await moduleManager.fetchAndCacheModule(modName);
              logEngine("VFS", `Successfully cached '${modName}' into in-memory VFS.`);
              renderVfsTree();
            } catch (e) {}
          }
        }
      }

      const ast = parseSource(code, activeLanguage);
      const compiler = new BytecodeCompiler();
      activeProgram = compiler.compile(ast);
      renderVisualAST(ast);
      renderBytecode(activeProgram);

      stepVm = new VirtualMachine({
        moduleManager,
        onPrint: (text) => {
          const out = document.getElementById("outputConsole");
          if (out) {
            out.textContent = stepVm.consoleOutput;
            out.scrollTop = out.scrollHeight;
          }
        },
        onWrite: (chunk, fullText) => {
          const out = document.getElementById("outputConsole");
          if (out) {
            out.textContent = fullText;
            out.scrollTop = out.scrollHeight;
          }
        }
      });
      stepVm.singleStepMode = true;
      stepGenerator = stepVm.execute(activeProgram, true);

      setVmStatus("stepping", "Stepping");
      document.getElementById("stopBtn").disabled = false;
      document.getElementById("runBtn").disabled = true;
    } catch (err) {
      logEngine("ERROR", `Compilation Error: ${err.message}`, "error");
      return;
    }
  }

  const stepBtn = document.getElementById("stepBtn");
  const dockStepBtn = document.getElementById("dockStepBtn");
  if (stepBtn) stepBtn.disabled = true;
  if (dockStepBtn) dockStepBtn.disabled = true;

  try {
    let stepRes = stepGenerator.next();

    while (!stepRes.done && stepRes.value && stepRes.value.type !== "STEP") {
      const cmd = stepRes.value;
      if (cmd.type === "ASYNC_PROMISE") {
        logEngine("ASYNC", "Awaiting asynchronous network/promise resolution...");
        setVmStatus("running", "Waiting for Network");
        try {
          const resolved = await cmd.promise;
          setVmStatus("stepping", "Stepping");
          stepRes = stepGenerator.next(resolved);
        } catch (err) {
          setVmStatus("stepping", "Stepping");
          stepRes = stepGenerator.throw(err);
        }
      } else if (cmd.type === "ASYNC_IMPORT") {
        logEngine("VFS", `Dynamically fetching '${cmd.moduleName}'...`);
        try {
          const mod = await moduleManager.fetchAndCacheModule(cmd.moduleName, stepVm);
          renderVfsTree();
          stepRes = stepGenerator.next(mod);
        } catch (err) {
          stepRes = stepGenerator.throw(err);
        }
      } else if (cmd.type === "SLEEP") {
        logEngine("SLEEP", `Sleeping for ${cmd.duration}ms...`);
        await new Promise(r => setTimeout(r, cmd.duration));
        stepRes = stepGenerator.next();
      } else if (cmd.type === "SUSPEND_FOR_INPUT") {
        const inputVal = await requestTerminalInput(cmd.prompt, stepVm);
        stepRes = stepGenerator.next(inputVal);
      } else {
        stepRes = stepGenerator.next();
      }
    }

    if (stepRes.done) {
      const totalInstr = activeProgram?.instructions?.length || 0;
      highlightPc(totalInstr);
      logEngine("STEPPER", `[Single-step finished! ${stepVm ? stepVm.instructionCount : 0} VM opcodes executed]`);
      setVmStatus("ready", "Done");
      const finalSnapshot = stepVm ? stepVm.getExecutionSnapshot() : null;
      stepGenerator = null;
      stepVm = null;
      document.getElementById("stopBtn").disabled = true;
      document.getElementById("runBtn").disabled = false;
      if (finalSnapshot) renderMemorySnapshot(finalSnapshot);
      const dockAstBadge = document.getElementById("dockAstBadge");
      if (dockAstBadge) {
        dockAstBadge.className = "badge-mini badge-live";
        dockAstBadge.textContent = "AST: Finished";
      }
      clearActiveAstExecution();
      clearMonacoLineHighlight();
      return;
    }

    const snapshot = stepVm.getExecutionSnapshot();
    const instructions = activeProgram?.getInstructionList?.() || [];
    const nextInstr = instructions.find(i => i.pc === snapshot.pc);
    const opName = nextInstr ? nextInstr.opName : "OP";
    const stackDepth = (snapshot.stack || snapshot.operandStack || []).length;
    logEngine("STEPPER", `Step IP ${snapshot.pc}: ${opName} (Stack Depth: ${stackDepth})`);
    highlightPc(snapshot.pc);
    highlightAstForPc(snapshot.pc);
    renderMemorySnapshot(snapshot);
  } catch (err) {
    logEngine("ERROR", `Runtime Exception during step: ${err.message}`, "error");
    stepGenerator = null;
    stepVm = null;
    document.getElementById("stopBtn").disabled = true;
    document.getElementById("runBtn").disabled = false;
  } finally {
    if (stepBtn) stepBtn.disabled = false;
    if (dockStepBtn) dockStepBtn.disabled = false;
  }
}

// --- Pause & Resume Execution Controller ---
function togglePauseExecution() {
  if (!activeScheduler) {
    stepInstruction();
    return;
  }

  if (!isPaused) {
    activeScheduler.pause();
    isPaused = true;
    updatePauseButtonState(true);
    setVmStatus("paused", "Paused");
    if (stepVm) {
      const snapshot = stepVm.getExecutionSnapshot();
      highlightPc(snapshot.pc);
      highlightAstForPc(snapshot.pc);
      renderMemorySnapshot(snapshot);
      logEngine("RUNTIME", `Execution paused at IP ${snapshot.pc}. Click Step to advance or Resume to continue.`, "info");
    }
  } else {
    isPaused = false;
    updatePauseButtonState(false);
    setVmStatus("running", "Running");
    clearActiveAstExecution();
    clearMonacoLineHighlight();
    if (stepVm) {
      stepVm.singleStepMode = false;
    }
    activeScheduler.resume();
  }
}

function updatePauseButtonState(paused) {
  const pauseText = document.getElementById("pauseIconText");
  if (pauseText) {
    pauseText.textContent = paused ? "▶ Resume" : "⏸ Pause";
  }
  const dockAstBadge = document.getElementById("dockAstBadge");
  if (dockAstBadge) {
    if (paused) {
      dockAstBadge.className = "badge-mini badge-live paused";
      dockAstBadge.textContent = "Paused";
    } else if (activeScheduler) {
      dockAstBadge.className = "badge-mini badge-live";
      dockAstBadge.textContent = "AST: Running";
    } else {
      dockAstBadge.className = "badge-mini badge-live";
      dockAstBadge.textContent = "AST: Ready";
    }
  }
}

// --- Interactive Python REPL Shell Controller ---
function initRepl() {
  replVm = new VirtualMachine({
    moduleManager,
    onPrint: (text) => {
      appendReplOutput(text);
    }
  });

  const replInput = document.getElementById("replInput");
  const replSendBtn = document.getElementById("sendReplBtn") || document.getElementById("replSendBtn");

  const submitLine = () => {
    if (!replInput) return;
    const rawLine = replInput.value.trim();
    if (!rawLine) return;

    replHistory.push(rawLine);
    replHistoryIndex = replHistory.length;
    replInput.value = "";

    appendReplPrompt(rawLine);

    if (rawLine === "clear" || rawLine === "clear()") {
      document.getElementById("replLog").innerHTML = `
        <div class="repl-banner">
          Universal Python 3 Interactive Shell &bull; UVM Stack Runtime<br>
          Commands: <span class="accent-link">help()</span>, <span class="accent-link">globals()</span>, <span class="accent-link">clear()</span>, <span class="accent-link">reset()</span>
        </div>`;
      return;
    }

    if (rawLine === "reset" || rawLine === "reset()") {
      initRepl();
      appendReplOutput("[Python REPL session reset to pristine state]");
      return;
    }

    if (rawLine === "help" || rawLine === "help()") {
      appendReplOutput("Universal Python 3 REPL:\n- Type expressions: 2 + 2, len([1, 2, 3]), math.sqrt(16)\n- Define variables: x = 10, s = 'hello'\n- Define functions: def f(n): return n * 2\n- Imports: import math, random, json, statistics, re");
      return;
    }

    if (rawLine === "globals" || rawLine === "globals()") {
      const g = Array.from(replVm.globals.keys()).filter(k => !k.startsWith("__"));
      appendReplOutput(JSON.stringify(g));
      return;
    }

    executeReplCommand(rawLine);
  };

  if (replSendBtn) {
    replSendBtn.addEventListener("click", submitLine);
  }
  if (replInput) {
    replInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        submitLine();
      } else if (e.key === "ArrowUp") {
        if (replHistoryIndex > 0) {
          replHistoryIndex--;
          replInput.value = replHistory[replHistoryIndex] || "";
        }
      } else if (e.key === "ArrowDown") {
        if (replHistoryIndex < replHistory.length - 1) {
          replHistoryIndex++;
          replInput.value = replHistory[replHistoryIndex] || "";
        } else {
          replHistoryIndex = replHistory.length;
          replInput.value = "";
        }
      }
    });
  }
}

function appendReplPrompt(line) {
  const log = document.getElementById("replLog");
  const entry = document.createElement("div");
  entry.className = "repl-entry";
  entry.innerHTML = `<div class="repl-line-in"><span class="repl-prompt-tag">&gt;&gt;&gt;</span> <span>${escapeHtml(line)}</span></div>`;
  log.appendChild(entry);
  scrollElementToBottom(log);
}

function appendReplOutput(text) {
  const log = document.getElementById("replLog");
  const outDiv = document.createElement("div");
  outDiv.className = "repl-line-out";
  outDiv.textContent = text;
  log.appendChild(outDiv);
  scrollElementToBottom(log);
}

function appendReplError(text) {
  const log = document.getElementById("replLog");
  const errDiv = document.createElement("div");
  errDiv.className = "repl-line-err";
  errDiv.textContent = text;
  log.appendChild(errDiv);
  scrollElementToBottom(log);
}

function executeReplCommand(code) {
  let toRun = code;
  try {
    const astTry = parseSource(code, "python");
    if (astTry.body && astTry.body.length === 1 && astTry.body[0].type === "ExpressionStatement") {
      const exp = astTry.body[0].expression;
      const isAssignment = exp.type === "BinaryExpression" && ["=", "+=", "-=", "*=", "/="].includes(exp.operator);
      const isPrintCall = exp.type === "CallExpression" && exp.callee && exp.callee.name === "print";
      if (!isAssignment && !isPrintCall) {
        toRun = `__val = (${code})\nif __val is not None:\n    print(__val)`;
      }
    }
  } catch (e) {
    toRun = code;
  }

  try {
    const ast = parseSource(toRun, "python");
    const compiler = new BytecodeCompiler();
    const prog = compiler.compile(ast);
    for (const _ of replVm.execute(prog)) {}
  } catch (err) {
    appendReplError(err.message);
  }
}

// --- Monaco Initialization ---
function initMonacoEditor(initialCode, initialLang) {
  currentLoadedCode = initialCode || "";
  const container = document.getElementById("monacoContainer");
  const fallback = document.getElementById("codeInput");

  if (fallback) {
    fallback.value = initialCode;
    fallback.style.display = "block";
    fallback.addEventListener("input", () => {
      currentLoadedCode = fallback.value;
      updateEditorStats();
      if (currentOpenFilePath) {
        moduleManager.vfs.writeFile(currentOpenFilePath, fallback.value);
      }
    });
    fallback.addEventListener("keydown", (e) => {
      if (e.key === "Tab") {
        e.preventDefault();
        const start = fallback.selectionStart;
        const end = fallback.selectionEnd;
        fallback.value = fallback.value.substring(0, start) + "    " + fallback.value.substring(end);
        fallback.selectionStart = fallback.selectionEnd = start + 4;
        updateEditorStats();
      } else if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        executeProgram();
      }
    });
  }

  window.addEventListener("resize", () => {
    if (monacoEditor) {
      monacoEditor.layout();
    }
  });

  if (typeof window.require !== "undefined") {
    window.require.config({
      paths: { "vs": "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs" }
    });

    window.require(["vs/editor/editor.main"], function (monaco) {
      monaco.editor.defineTheme("uvm-studio-dark", {
        base: "vs-dark",
        inherit: true,
        rules: [
          { token: "comment", foreground: "8b949e", fontStyle: "italic" },
          { token: "keyword", foreground: "ff7b72", fontStyle: "bold" },
          { token: "string", foreground: "a5d6ff" },
          { token: "number", foreground: "79c0ff" },
          { token: "type", foreground: "ffa657" },
          { token: "identifier", foreground: "c9d1d9" },
          { token: "function", foreground: "d2a8ff" },
          { token: "variable", foreground: "ffa657" },
          { token: "operator", foreground: "ff7b72" },
          { token: "delimiter", foreground: "c9d1d9" }
        ],
        colors: {
          "editor.background": "#0d1117",
          "editor.foreground": "#c9d1d9",
          "editor.lineHighlightBackground": "#161b2280",
          "editorLineNumber.foreground": "#484f58",
          "editorLineNumber.activeForeground": "#e6edf3",
          "editorCursor.foreground": "#58a6ff",
          "editor.selectionBackground": "#264f7866",
          "editor.inactiveSelectionBackground": "#264f7833",
          "editorIndentGuide.background1": "#21262d",
          "editorIndentGuide.activeBackground1": "#30363d"
        }
      });

      const mqlang = initialLang === "c" ? "c" : initialLang === "java" ? "java" : "python";
      const startValue = (fallback && fallback.value) ? fallback.value : initialCode;
      monacoEditor = monaco.editor.create(container, {
        value: startValue,
        language: mqlang,
        theme: "uvm-studio-dark",
        fontSize: 12,
        fontFamily: "'JetBrains Mono', Menlo, Consolas, monospace",
        fontLigatures: true,
        lineNumbers: "on",
        lineNumbersMinChars: 3,
        glyphMargin: false,
        folding: true,
        scrollBeyondLastLine: false,
        automaticLayout: true,
        minimap: { enabled: false },
        renderLineHighlight: "all",
        overviewRulerBorder: false,
        overviewRulerLanes: 0,
        padding: { top: 6, bottom: 6 },
        scrollbar: {
          verticalScrollbarSize: 5,
          horizontalScrollbarSize: 5
        }
      });

      if (fallback) fallback.style.display = "none";
      if (container) container.style.display = "block";
      monacoEditor.layout();

      monacoEditor.onDidChangeModelContent(() => {
        currentLoadedCode = monacoEditor.getValue();
        updateEditorStats();
        if (currentOpenFilePath) {
          moduleManager.vfs.writeFile(currentOpenFilePath, currentLoadedCode);
        }
      });

      monacoEditor.onDidChangeCursorPosition((e) => {
        const pos = e.position;
        const statusPos = document.getElementById("statusPos");
        if (statusPos) statusPos.textContent = `Ln ${pos.lineNumber}, Col ${pos.column}`;
      });

      monacoEditor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
        executeProgram();
      });

      updateEditorStats();
    }, function (err) {
      console.warn("Monaco loader failed, fallback textarea active:", err);
      if (fallback) fallback.style.display = "block";
      if (container) container.style.display = "none";
    });
  } else {
    if (fallback) fallback.style.display = "block";
    if (container) container.style.display = "none";
  }
}

function initWorkspaceResizer() {
  const resizer = document.getElementById("workspaceResizer");
  const leftPane = document.querySelector(".pane-code");
  const rightPane = document.getElementById("workspaceRightCol") || document.querySelector(".pane-inspector");
  const workspace = document.querySelector(".app-workspace");

  if (!resizer || !leftPane || !rightPane || !workspace) return;

  // Restore saved proportion from localStorage if present
  try {
    const savedLeft = localStorage.getItem("uvm_layout_left_pct");
    if (savedLeft) {
      const pct = parseFloat(savedLeft);
      if (!isNaN(pct) && pct >= 15 && pct <= 85) {
        leftPane.style.flex = `0 0 ${pct}%`;
        leftPane.style.maxWidth = `${pct}%`;
        rightPane.style.flex = "1 1 0";
      }
    }
  } catch (e) {}

  let isDragging = false;
  let startX = 0;
  let startLeftWidth = 0;
  let currentLeftPercent = null;

  const onMouseDown = (e) => {
    e.preventDefault();
    isDragging = true;
    startX = e.clientX;
    startLeftWidth = leftPane.getBoundingClientRect().width;
    resizer.classList.add("dragging");
    document.body.classList.add("resizing-active");

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const onMouseMove = (e) => {
    if (!isDragging) return;
    const deltaX = e.clientX - startX;
    const workspaceRect = workspace.getBoundingClientRect();
    const availableWidth = workspaceRect.width - resizer.offsetWidth;
    const minWidth = 220;
    const maxLeftWidth = availableWidth - minWidth;

    let targetLeftWidth = startLeftWidth + deltaX;
    if (targetLeftWidth < minWidth) targetLeftWidth = minWidth;
    if (targetLeftWidth > maxLeftWidth) targetLeftWidth = maxLeftWidth;

    const leftPercent = (targetLeftWidth / availableWidth) * 100;
    currentLeftPercent = leftPercent;
    leftPane.style.flex = `0 0 ${leftPercent}%`;
    leftPane.style.maxWidth = `${leftPercent}%`;
    rightPane.style.flex = "1 1 0";

    if (monacoEditor) {
      monacoEditor.layout();
    }
  };

  const onMouseUp = () => {
    if (!isDragging) return;
    isDragging = false;
    resizer.classList.remove("dragging");
    document.body.classList.remove("resizing-active");

    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);

    if (currentLeftPercent !== null) {
      try {
        localStorage.setItem("uvm_layout_left_pct", currentLeftPercent.toFixed(2));
      } catch (e) {}
    }

    if (monacoEditor) {
      monacoEditor.layout();
    }
  };

  // Double click resets to default 3/5 and 2/5 split
  resizer.addEventListener("dblclick", () => {
    leftPane.style.flex = "3 1 0";
    leftPane.style.maxWidth = "";
    rightPane.style.flex = "2 1 0";
    currentLeftPercent = null;
    try {
      localStorage.removeItem("uvm_layout_left_pct");
    } catch (e) {}
    if (monacoEditor) {
      monacoEditor.layout();
    }
  });

  resizer.addEventListener("mousedown", onMouseDown);
}

function initInspectorVerticalResizer() {
  const resizerH = document.getElementById("inspectorVerticalResizer");
  const topPane = document.querySelector(".pane-inspector");
  const bottomPane = document.querySelector(".pane-bottom-dock") || document.querySelector(".pane-engine-logs");
  const rightCol = document.getElementById("workspaceRightCol");

  if (!resizerH || !topPane || !bottomPane || !rightCol) return;

  // Restore saved proportion from localStorage if present
  try {
    const savedBottom = localStorage.getItem("uvm_layout_bottom_pct");
    if (savedBottom) {
      const pct = parseFloat(savedBottom);
      if (!isNaN(pct) && pct >= 10 && pct <= 80) {
        bottomPane.style.maxHeight = "none";
        bottomPane.style.height = "";
        bottomPane.style.flex = `0 0 ${pct}%`;
        topPane.style.flex = "1 1 0";
      }
    }
  } catch (e) {}

  let isDragging = false;
  let startY = 0;
  let startBottomHeight = 0;
  let currentBottomPercent = null;

  const onMouseDown = (e) => {
    e.preventDefault();
    isDragging = true;
    startY = e.clientY;
    startBottomHeight = bottomPane.getBoundingClientRect().height;
    resizerH.classList.add("dragging");
    document.body.classList.add("resizing-h-active");

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const onMouseMove = (e) => {
    if (!isDragging) return;
    const deltaY = e.clientY - startY;
    const colRect = rightCol.getBoundingClientRect();
    const availableHeight = colRect.height - resizerH.offsetHeight;
    const minBottom = 60;
    const maxBottom = availableHeight - 100;

    let targetHeight = startBottomHeight - deltaY;
    if (targetHeight < minBottom) targetHeight = minBottom;
    if (targetHeight > maxBottom) targetHeight = maxBottom;

    const bottomPercent = (targetHeight / availableHeight) * 100;
    currentBottomPercent = bottomPercent;
    bottomPane.style.maxHeight = "none";
    bottomPane.style.height = "";
    bottomPane.style.flex = `0 0 ${bottomPercent}%`;
    topPane.style.flex = "1 1 0";
  };

  const onMouseUp = () => {
    if (!isDragging) return;
    isDragging = false;
    resizerH.classList.remove("dragging");
    document.body.classList.remove("resizing-h-active");

    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);

    if (currentBottomPercent !== null) {
      try {
        localStorage.setItem("uvm_layout_bottom_pct", currentBottomPercent.toFixed(2));
      } catch (e) {}
    }
  };

  // Double click resets to default 2/3 and 1/3 split
  resizerH.addEventListener("dblclick", () => {
    bottomPane.style.maxHeight = "";
    bottomPane.style.height = "";
    bottomPane.style.flex = "1 1 0";
    topPane.style.flex = "2 1 0";
    currentBottomPercent = null;
    try {
      localStorage.removeItem("uvm_layout_bottom_pct");
    } catch (e) {}
  });

  resizerH.addEventListener("mousedown", onMouseDown);
}

// --- Lifecycle Initialization ---
window.addEventListener("DOMContentLoaded", () => {
  initWorkspaceResizer();
  initInspectorVerticalResizer();
  initSidebarExplorer();
  initPackageSidebar();

  // Route module manager telemetry to engine logs
  moduleManager.onTelemetry = (category, message) => {
    logEngine(category, message);
  };

  // Engine Logs Clear & Copy buttons
  const clearEngineBtn = document.getElementById("clearEngineLogsBtn");
  if (clearEngineBtn) {
    clearEngineBtn.addEventListener("click", () => {
      const consoleEl = document.getElementById("engineLogConsole");
      if (consoleEl) {
        consoleEl.innerHTML = `<div class="log-empty-state">Logs cleared. New telemetry will stream here.</div>`;
      }
      engineLogCount = 0;
      const badge = document.getElementById("engineLogBadge");
      if (badge) badge.textContent = "0 events";
    });
  }

  const copyEngineBtn = document.getElementById("copyEngineLogsBtn");
  if (copyEngineBtn) {
    copyEngineBtn.addEventListener("click", () => {
      const consoleEl = document.getElementById("engineLogConsole");
      if (consoleEl) {
        const text = Array.from(consoleEl.querySelectorAll(".log-line"))
          .map(l => {
            const time = l.querySelector(".log-time")?.textContent || "";
            const tag = l.querySelector(".log-tag")?.textContent || "";
            const msg = l.querySelector(".log-msg")?.textContent || "";
            return `[${time}] [${tag}] ${msg}`;
          }).join("\n");
        navigator.clipboard.writeText(text || "No logs");
        copyEngineBtn.textContent = "Copied!";
        setTimeout(() => (copyEngineBtn.textContent = "Copy"), 1500);
      }
    });
  }

  logEngine("UVM", "UVM Studio 3.5 runtime ready. Python 3.12 primary engine active.");

  // 1. Language switch pills
  document.querySelectorAll(".lang-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const targetLang = btn.getAttribute("data-lang");
      if (targetLang === activeLanguage) return;

      setLanguagePill(targetLang);

      const scriptSelect = document.getElementById("scriptSelect");
      const currentScriptKey = scriptSelect?.value;
      const currentScriptLang = SCRIPT_LANGUAGE_MAP[currentScriptKey] || "python";

      // If current demo language differs from target, load the idiomatic showcase for that target
      if (currentScriptLang !== targetLang) {
        if (targetLang === "c") {
          if (scriptSelect) scriptSelect.value = "c_fastmath_sample";
          loadSelectedScript();
          logEngine("POLYGLOT", "C-Extension mode active (Experimental). Compiles C functions & PyMethodDef directly to UVM bytecode.");
          showToastNotification(
            "C-Extension Mode (Experimental)",
            "UVM compiles C mathematical functions into bytecode to link as Python extension modules.",
            "info",
            5000
          );
        } else if (targetLang === "java") {
          if (scriptSelect) scriptSelect.value = "class_and_methods";
          loadSelectedScript();
          logEngine("POLYGLOT", "Java mode active (Syntax Demo Beta). Demonstrates Java class/method grammar parsing.");
          showToastNotification(
            "Java Syntax Demo (Beta)",
            "Experimental AST preview: parses Java classes & methods into the unified AST. Primary VM execution engine is Python 3.12.",
            "info",
            5000
          );
        } else {
          if (scriptSelect) scriptSelect.value = "flagship_tour";
          loadSelectedScript();
          logEngine("POLYGLOT", "Switched to Python 3.12 primary virtual machine.");
        }
      }
    });
  });

  // 2. Demo select
  const scriptSelect = document.getElementById("scriptSelect");
  scriptSelect?.addEventListener("change", loadSelectedScript);

  // 3. Action Buttons
  document.getElementById("runBtn")?.addEventListener("click", executeProgram);
  document.getElementById("stepBtn")?.addEventListener("click", stepInstruction);
  document.getElementById("stepFromTabBtn")?.addEventListener("click", stepInstruction);
  document.getElementById("stopBtn")?.addEventListener("click", () => {
    if (activeScheduler) activeScheduler.stop();
    activeScheduler = null;
    stepGenerator = null;
    stepVm = null;
    isPaused = false;
    updatePauseButtonState(false);
    clearActiveAstExecution();
    clearMonacoLineHighlight();
    setVmStatus("ready", "Stopped");
    const runB = document.getElementById("runBtn");
    if (runB) runB.disabled = false;
    const stepB = document.getElementById("stepBtn");
    if (stepB) stepB.disabled = false;
    const stopB = document.getElementById("stopBtn");
    if (stopB) stopB.disabled = true;
  });

  // 4. Inspector Tabs
  document.querySelectorAll(".nav-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      switchTab(tab.getAttribute("data-tab"));
    });
  });

  // 5. Editor Toolbar Actions
  document.getElementById("resetCodeBtn")?.addEventListener("click", loadSelectedScript);
  document.getElementById("copyCodeBtn")?.addEventListener("click", () => {
    navigator.clipboard.writeText(getCode());
    const btn = document.getElementById("copyCodeBtn");
    if (btn) {
      btn.textContent = "Copied!";
      setTimeout(() => btn.textContent = "Copy", 1500);
    }
  });
  document.getElementById("formatBtn")?.addEventListener("click", () => {
    const raw = getCode();
    const lines = raw.split("\n").map(l => l.trimEnd());
    while (lines.length > 1 && lines[lines.length - 1] === "" && lines[lines.length - 2] === "") {
      lines.pop();
    }
    setCode(lines.join("\n") + "\n");
    const btn = document.getElementById("formatBtn");
    if (btn) {
      btn.textContent = "Formatted!";
      setTimeout(() => btn.textContent = "Format", 1500);
    }
    logEngine("EDITOR", "Formatted code buffer (trimmed whitespace and trailing blank lines).");
  });

  // 6. VFS Drawer (Fallback / inspector)
  const vfsDrawer = document.getElementById("vfsDrawer");
  const vfsDrawerToggleBtn = document.getElementById("vfsDrawerToggleBtn");
  if (vfsDrawer && vfsDrawerToggleBtn) {
    vfsDrawerToggleBtn.addEventListener("click", () => {
      const isShown = vfsDrawer.style.display !== "none";
      vfsDrawer.style.display = isShown ? "none" : "block";
      if (!isShown) renderVfsTree();
    });
  }
  const closeVfsDrawerBtn = document.getElementById("closeVfsDrawerBtn");
  if (closeVfsDrawerBtn && vfsDrawer) {
    closeVfsDrawerBtn.addEventListener("click", () => {
      vfsDrawer.style.display = "none";
    });
  }
  const refreshVfsBtn = document.getElementById("refreshVfsBtn");
  if (refreshVfsBtn) {
    refreshVfsBtn.addEventListener("click", () => {
      renderVfsTree();
      renderExplorerTree();
    });
  }

  // 7. Console Tools
  document.getElementById("clearConsoleBtn")?.addEventListener("click", () => {
    const consoleEl = document.getElementById("outputConsole");
    if (consoleEl) consoleEl.textContent = "";
    if (stepVm && stepVm.clearConsole) stepVm.clearConsole();
  });
  document.getElementById("copyConsoleBtn")?.addEventListener("click", () => {
    const consoleEl = document.getElementById("outputConsole");
    if (consoleEl) navigator.clipboard.writeText(consoleEl.textContent);
  });
  document.getElementById("clearReplBtn")?.addEventListener("click", () => {
    const replLog = document.getElementById("replLog");
    if (replLog) replLog.innerHTML = "";
  });
  document.getElementById("resetReplBtn")?.addEventListener("click", () => {
    initRepl();
    appendReplOutput("[Python REPL session reset]");
  });

  // 8. Shortcuts & Architecture Modal
  const modal = document.getElementById("shortcutsModal");
  document.getElementById("shortcutsBtn")?.addEventListener("click", () => {
    if (modal) modal.style.display = "flex";
  });
  document.getElementById("closeShortcutsModal")?.addEventListener("click", () => {
    if (modal) modal.style.display = "none";
  });
  document.getElementById("dismissShortcutsModal")?.addEventListener("click", () => {
    if (modal) modal.style.display = "none";
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      modal.style.display = "none";
    } else if (e.key === "F10") {
      e.preventDefault();
      stepInstruction();
    }
  });

  // 9. Initialize Python REPL, AST Toolbar, Dock Tabs, Initial Demo Script & Tab Icon
  initAstToolbar();
  initDockTabs();
  initRepl();
  const initialScriptKey = scriptSelect.value;
  const initialCode = DEMO_SCRIPTS[initialScriptKey] || "";
  initMonacoEditor(initialCode, "python");
  const tabIcon = document.getElementById("editorTabIcon");
  if (tabIcon) {
    tabIcon.innerHTML = getFileIconSvg("main.py");
  }
  try {
    const ast = parseSource(initialCode, "python");
    const compiler = new BytecodeCompiler();
    activeProgram = compiler.compile(ast);
    renderVisualAST(ast);
    renderBytecode(activeProgram);
  } catch (e) {}
  renderVfsTree();
  renderExplorerTree();
});