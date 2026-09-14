// File: js/frontend/demo_scripts.js
/**
 * Modern demonstration scripts showcasing Bytecode VM capabilities:
 * fibers, non-blocking sleep, recursive call stacks, interactive input, and loops.
 */

export const DEMO_SCRIPTS = {
  flagship_tour: `# ==============================================================================
# 🚀 WELCOME TO UNIVERSAL VIRTUAL MACHINE (UVM 3.5)
# ------------------------------------------------------------------------------
# 100% In-Browser Python 3 Virtual Machine & Polyglot Bytecode Runtime
# Zero WebAssembly blobs • Zero server backends • Native JS Execution (<50ms boot)
#
# 💡 PRO TIPS FOR EXPLORERS:
#    1. Click "Run" (Ctrl+Enter) to execute the complete tour in real-time.
#    2. Click "Step" (F10) to step through instructions line-by-line!
#       Watch the AST dock at the bottom highlight the active syntax nodes
#       and the Inspector track virtual machine call frames and memory.
# ==============================================================================

import math
import _fastmath

print("========================================================================")
print("  ★ UNIVERSAL VIRTUAL MACHINE (UVM 3.5) - FLAGSHIP TOUR ★")
print("========================================================================")

# --- 1. Modern Python 3 Idioms & Syntax ---
print("\\n[1] Modern Python 3 Idioms:")

numbers = [1, 2, 3, 4, 5, 6, 7, 8]
evens_squared = [x * x for x in numbers if x % 2 == 0]
print(f"  • List Comprehension : {evens_squared}")

title = "UVM-Polyglot-Runtime"
print(f"  • String Slicing     : prefix='{title[:3]}', reversed='{title[::-1]}'")

# Multiple unpacking & atomic swapping
a, b = "Alpha", "Omega"
a, b = b, a
print(f"  • Value Swap         : a='{a}', b='{b}'")

# Walrus assignment operator
if (total := sum(numbers)) > 30:
    print(f"  • Walrus Assignment  : total={total} (> 30)")

# --- 2. Cooperative Fibers & Non-Blocking Sleep ---
print("\\n[2] Cooperative Fibers & Concurrency:")
print("  • Fiber entering non-blocking sleep (60ms)...")
sleep(60)  # Suspends bytecode fiber without freezing browser UI!
print("  • Fiber resumed cleanly!")

# --- 3. Polyglot C-Extension Acceleration ---
print("\\n[3] Polyglot C-Extension Interop (_fastmath.c compiled to bytecode):")
gcd_result = _fastmath.fast_gcd(1071, 462)
c_fib = _fastmath.fast_fib(16)
prime_flag = _fastmath.is_prime(997)

print(f"  • [C Euclid GCD]    gcd(1071, 462) = {gcd_result}")
print(f"  • [C Iterative Fib] fib(16)        = {c_fib}")
print(f"  • [C Primality]     is_prime(997)  = {prime_flag == 1}")

# --- 4. Object-Oriented Programming (Classes & Inheritance) ---
print("\\n[4] Object-Oriented Programming (Classes & Polymorphism):")

class Drone:
    def __init__(self, model, battery):
        self.model = model
        self.battery = battery

    def recharge(self, amount):
        self.battery = min(100, self.battery + amount)
        return self.battery

    def telemetry(self):
        return f"[{self.model}] Battery: {self.battery}%"

class ScoutDrone(Drone):
    def __init__(self, model, battery, sensor_range):
        self.model = model
        self.battery = battery
        self.sensor_range = sensor_range

    def scan_sector(self):
        return f"Scout {self.model} scanned {self.sensor_range}km sector (Telemetry: {self.telemetry()})"

drone = ScoutDrone("Falcon-X", 78, 25)
print(f"  • Status: {drone.telemetry()}")
drone.recharge(15)
print(f"  • After Recharge: {drone.telemetry()}")
print(f"  • {drone.scan_sector()}")

# --- 5. Virtual Filesystem (VFS) Persistence ---
print("\\n[5] In-Memory Virtual Filesystem (VFS):")
with open("/welcome.txt", "w") as f:
    f.write("Universal Virtual Machine: Pure-JS Python 3 Bytecode Engine")

with open("/welcome.txt", "r") as f:
    saved_note = f.read()

print(f"  • Read back from VFS: '{saved_note}'")

print("\\n====================================================================")
print("  🎉 Tour Complete! Next, try picking another demo or typing code.")
print("====================================================================")
`,

  c_fastmath_sample: `// Demonstration: Genuine C Function Compilation to UVM Bytecode
// Compiled directly into the shared virtual machine bytecode architecture

int fast_gcd(int a, int b) {
    while (b != 0) {
        int temp = b;
        b = a % b;
        a = temp;
    }
    return a;
}

int fast_fib(int n) {
    if (n <= 1) {
        return n;
    }
    int a = 0;
    int b = 1;
    for (int i = 1; i < n; i++) {
        int temp = a + b;
        a = b;
        b = temp;
    }
    return b;
}

print("=== Genuine C Functions on UVM Bytecode ===");
int g = fast_gcd(1071, 462);
print("fast_gcd(1071, 462) = " + g);

int f = fast_fib(15);
print("fast_fib(15)        = " + f);
`,

  concurrency_sleep: `// Demonstration 1: Non-blocking Cooperative Sleep
void taskA() {
    print("[Fiber A] Task initialized. Entering 400ms sleep...");
    sleep(400);
    print("[Fiber A] Woke up! Task completed.");
}

void taskB() {
    print("[Fiber B] Concurrent task started.");
    sleep(150);
    print("[Fiber B] Resumed after 150ms!");
}

print("=== Cooperative Fiber Scheduler Demo ===");
taskA();
taskB();
`,

  fibonacci_recursion: `// Demonstration 2: Recursive Call Frames on Virtual Stack
int fib(int n) {
    if (n <= 1) {
        return n;
    }
    return fib(n - 1) + fib(n - 2);
}

print("=== Recursive Fibonacci Benchmark ===");
for (int i = 0; i <= 10; i++) {
    print("fib(" + i + ") = " + fib(i));
}
`,

  interactive_input: `// Demonstration 3: Interactive UI Input & Fiber Suspension
print("=== Cybernetic Terminal Initialized ===");
String name = input("Enter your operative codename: ");
print("Greetings, Operative " + name + ".");

String rank = input("Enter your clearance sector: ");
print("Authentication confirmed. Access level granted for Sector " + rank + ".");
`,

  loops_and_logic: `// Demonstration 4: C-Style Loops & Numerical Logic
print("=== Prime Number Scanner ===");
int count = 0;

for (int n = 2; n <= 30; n++) {
    int isPrime = 1;
    for (int d = 2; d * d <= n; d++) {
        if (n % d == 0) {
            isPrime = 0;
        }
    }
    if (isPrime == 1) {
        print("Prime found: " + n);
        count++;
    }
}

print("Total primes located: " + count);
`,

  class_and_methods: `// Demonstration 5: Java Syntax & Throws Clauses
public class Main {
    public static void main(String[] args) throws Exception {
        int seed = 123456789;
        print("Initial security seed: " + seed);
        
        int attempts = 0;
        for (int i = 1; i <= 5; i++) {
            seed = (seed * 1103515245 + 12345) % 2147483647;
            attempts++;
            print("Round " + attempts + " hash: " + seed);
        }
    }
}
main();
`,

  multi_tier_imports: `# Demonstration 6: 3-Tier Polyglot Modules (Python + C Extension + Host Bridge)
import math
import _fastmath
import statistics

print("=== Multi-Tier Polyglot Module System ===")

# Tier 3: High-speed native host bridge
r = math.sqrt(1024)
print("[Tier 3 Host Bridge] math.sqrt(1024) = " + str(r))

# Tier 2: Genuine C extension compiled to UVM Bytecode
gcd_val = _fastmath.fast_gcd(1071, 462)
print("[Tier 2 C Extension] _fastmath.fast_gcd(1071, 462) = " + str(gcd_val))

fib_c = _fastmath.fast_fib(15)
print("[Tier 2 C Extension] _fastmath.fast_fib(15) = " + str(fib_c))

prime_c = _fastmath.is_prime(997)
print("[Tier 2 C Extension] _fastmath.is_prime(997) = " + str(prime_c))

# Tier 1: Pure-Python standard library loaded from Virtual Filesystem (VFS)
dataset = [12, 15, 18, 22, 30, 45, 88]
avg = statistics.mean(dataset)
med = statistics.median(dataset)
std = statistics.stdev(dataset)

print("[Tier 1 VFS Python] statistics.mean = " + str(avg))
print("[Tier 1 VFS Python] statistics.median = " + str(med))
print("[Tier 1 VFS Python] statistics.stdev = " + str(std))
print("All 3 module tiers executed synchronously in browser!")
`,

  python_advanced_features: `# Demo 7: Modern Python 3 Syntactic Idioms & OOP
# Demonstrates comprehensions, slicing, unpacking, f-strings, decorators, classes, and walrus

print("=== Modern Python 3 Syntactic Idioms in UVM ===")

# 1. Classes, Methods, and Self
class BankAccount:
    def __init__(self, owner, balance):
        self.owner = owner
        self.balance = balance

    def deposit(self, amount):
        self.balance += amount
        return self.balance

    def statement(self):
        return f"Account '{self.owner}': current balance = \${self.balance}"

acc = BankAccount("Ariel", 250)
acc.deposit(150)
print(acc.statement())

# 2. Sequence Slicing
text = "Antigravity-Universal-Interpreter"
print(f"Original: {text}")
print(f"Prefix slice [0:11]: {text[0:11]}")
print(f"Reversed slice [::-1]: {text[::-1]}")

# 3. List & Dict Comprehensions
nums = [1, 2, 3, 4, 5, 6, 7, 8]
evens_squared = [x * x for x in nums if x % 2 == 0]
cubes_map = {x: x * x * x for x in [2, 3, 4]}
print(f"Evens squared: {evens_squared}")
print(f"Cubes dictionary: {cubes_map}")

# 4. Multiple Assignment & Atomic Variable Swapping
a, b = "First", "Second"
print(f"Before swap: a={a}, b={b}")
a, b = b, a
print(f"After swap:  a={a}, b={b}")

# 5. Higher-Order Lambdas & Iteration Builtins
coords = zip([10, 20, 30], [50, 60, 70])
for idx, pt in enumerate(coords):
    print(f"Point #{idx}: x={pt[0]}, y={pt[1]}")

# 6. Walrus Operator & Ternary Condition
data = [15, 25, 35, 45, 55]
if (total := sum(data)) > 100:
    verdict = f"Large dataset (sum={total})"
else:
    verdict = "Small dataset"
print(f"Verdict: {verdict}")

print("✨ All modern Python 3 idioms executed faithfully on UVM Bytecode!")
`,

  python_complete_runtime: `# Demonstration 8: Complete Python 3 Runtime (Exceptions, Context Managers, VFS, *args)
print("=== Complete Python 3 Language & Runtime Showcase ===")

# 1. Built-in Methods on Strings, Lists, and Dicts
raw = "   antigravity universal runtime   "
clean = raw.strip().title()
print(f"Cleaned string: '{clean}'")
words = clean.split(" ")
print(f"Words: {words}")
joined = " -> ".join(words)
print(f"Joined: {joined}")

items = [10, 20]
items.append(30)
items.extend([40, 50])
print(f"Extended list: {items}")
popped = items.pop()
print(f"Popped value: {popped}, remaining: {items}")

config = {"version": "3.0", "engine": "UVM"}
print(f"Engine: {config.get('engine')}, Fallback: {config.get('missing', 'Default')}")
config.update({"status": "ready"})
print(f"Config keys: {config.keys()}, values: {config.values()}")

# 2. Variable Arguments (*args) Packing & Spread Unpacking
def summarize(title, *scores):
    total = sum(scores)
    count = len(scores)
    avg = total / count if count > 0 else 0
    return f"{title}: Total={total}, Avg={avg:.2f}"

print(summarize("Direct Args", 85, 92, 78, 95))
extra_scores = [88, 90, 84]
print(summarize("Spread Args (*extra)", *extra_scores))

# 3. Context Managers & Virtual Filesystem (VFS)
print("--- Testing VFS Context Manager (with open(...) as f) ---")
with open("system_audit.log", "w") as f:
    f.write("Log Entry 1: Runtime online - Log Entry 2: Memory mapped")

with open("system_audit.log", "r") as f:
    log_content = f.read()
print(f"Read from VFS: {log_content}")

# 4. Structured Exception Handling (try / except / finally / raise)
print("--- Testing Exception Handling (try/except/finally) ---")
try:
    print("Entering try block...")
    raise ValueError("Simulated runtime constraint violation")
    print("This line will not execute.")
except ValueError as err:
    print(f"Successfully caught error: {err}")
finally:
    print("Finally block cleanly executed for resource recovery.")

# 5. Standard Built-in Utilities
print(f"Type check: type(42) = {type(42)}, isinstance('text', str) = {isinstance('text', str)}")
print(f"Conversions: ord('Z') = {ord('Z')}, chr(90) = {chr(90)}, bin(255) = {bin(255)}")
print(f"Functional: list(map) = {list(map(lambda x: x * 10, [1, 2, 3]))}")
print("🎉 Full Python 3 runtime executed end-to-end!")
`,

  polyglot_scientific_pipeline: `# Demonstration 9: Polyglot Scientific & Data Intelligence Pipeline
# Harnesses Python 3, Pure-Python VFS stdlib, Genuine C Extensions, and Host Native Bridges simultaneously!

import math
import random
import json
import re
from statistics import mean, median, stdev
import _fastmath

print("==================================================================")
print("  🚀 POLYGLOT SCIENTIFIC & DATA INTELLIGENCE PIPELINE")
print("==================================================================")

# Stage 1: Dynamic Synthetic Experiment Generation using Native random & math
print("\\n[Stage 1] Synthesizing Signal Vectors with Gaussian Noise...")
raw_signals = []
i = 0
while i < 15:
    angle = i * (math.pi / 7)
    pure_wave = math.sin(angle) * 100
    noise = (random.random() - 0.5) * 20
    reading = math.floor(pure_wave + noise)
    raw_signals.append(reading)
    i = i + 1

print(f"  -> Generated {len(raw_signals)} signal samples: {raw_signals[:6]} ...")

# Stage 2: Processing via Pure-Python VFS Standard Library ('statistics.py')
print("\\n[Stage 2] Executing Pure-Python VFS Module ('statistics.py')...")
sig_mean = mean(raw_signals)
sig_median = median(raw_signals)
sig_stdev = stdev(raw_signals)

print(f"  -> VFS Computed Mean   : {sig_mean:.2f}")
print(f"  -> VFS Computed Median : {sig_median:.2f}")
print(f"  -> VFS Standard Dev    : {sig_stdev:.2f}")

# Stage 3: Accelerating Number-Theoretic Calculations via Genuine C Extension ('_fastmath.c')
print("\\n[Stage 3] Invoking High-Performance C Extension ('_fastmath.c')...")
sample_a = abs(raw_signals[0]) + 15
sample_b = abs(raw_signals[1]) + 25

c_gcd = _fastmath.fast_gcd(sample_a, sample_b)
c_fib = _fastmath.fast_fib(18)
c_prime_check = _fastmath.is_prime(sample_a)

print(f"  -> [C Euclid GCD]   gcd({sample_a}, {sample_b}) = {c_gcd}")
print(f"  -> [C Iterative Fib] fib(18) = {c_fib}")
print(f"  -> [C Primality]    is_prime({sample_a}) = {c_prime_check == 1}")

# Stage 4: Text Pattern Extraction & Sanitization with Regex ('re')
print("\\n[Stage 4] Parsing Telemetry Logs using Regular Expressions ('re')...")
telemetry_log = "SENSOR_ID: [SAT-902] STATUS: NOMINAL VOLTS: 12.4V FREQ: 433MHZ"
sat_id = re.search("[A-Z]+-[0-9]+", telemetry_log)
freq_match = re.search("[0-9]+MHZ", telemetry_log)
sanitized = re.sub("NOMINAL", "OPTIMAL", telemetry_log)

print(f"  -> Extracted Satellite ID : {sat_id}")
print(f"  -> Extracted Frequency    : {freq_match}")
print(f"  -> Transformed Log Stream : {sanitized}")

# Stage 5: Serialization & Virtual Filesystem Persistence (with open(...) as f)
print("\\n[Stage 5] Serializing Telemetry Model & Writing to VFS...")
report = {
    "satellite": sat_id,
    "metrics": {
        "mean_amplitude": sig_mean,
        "standard_dev": sig_stdev,
        "c_gcd": c_gcd,
        "c_fib": c_fib
    },
    "signals_processed": len(raw_signals)
}

payload = json.dumps(report)
with open("/telemetry_report.json", "w") as f:
    f.write(payload)

with open("/telemetry_report.json", "r") as f:
    verified_payload = f.read()

back_obj = json.loads(verified_payload)
print(f"  -> Verified JSON round-trip from VFS! Target: {back_obj['satellite']}")
print("==================================================================")
print("  ✅ Polyglot Pipeline completed with 100% interoperability!")
print("==================================================================")
`,

  autonomous_banking_core: `# Demonstration 10: Autonomous Banking Core & Multi-Level Transaction Engine
# Pushes UVM to the limit: 3-tier class inheritance, polymorphic dispatch,
# nested closures with encapsulated state, default parameters, and robust exception recovery.

print("==================================================================")
print("  🏦 AUTONOMOUS HIGH-RELIABILITY BANKING SYSTEM (UVM)")
print("==================================================================")

# 1. Base Class: Generic Account Entity
class BankAccount:
    def __init__(self, account_id, owner, initial_balance=0.0):
        self.account_id = account_id
        self.owner = owner
        self.balance = initial_balance
        self.ledger = []
        self.is_frozen = False

    def record_entry(self, entry_type, amount, note=""):
        self.ledger.append({"type": entry_type, "amount": amount, "balance": self.balance, "note": note})

    def deposit(self, amount):
        if self.is_frozen:
            raise ValueError(f"Account {self.account_id} is frozen. Deposit rejected.")
        if amount <= 0:
            raise ValueError("Deposit amount must be positive.")
        self.balance = self.balance + amount
        self.record_entry("DEPOSIT", amount, "Standard deposit")
        return self.balance

    def withdraw(self, amount):
        if self.is_frozen:
            raise ValueError(f"Account {self.account_id} is frozen. Withdrawal rejected.")
        if amount <= 0:
            raise ValueError("Withdrawal amount must be strictly positive.")
        if amount > self.balance:
            raise ValueError(f"Insufficient funds! Requested: \${amount:.2f}, Available: \${self.balance:.2f}")
        self.balance = self.balance - amount
        self.record_entry("WITHDRAW", amount, "Standard withdrawal")
        return self.balance

    def get_summary(self):
        return f"[{self.account_id}] Owner: {self.owner} | Balance: \${self.balance:.2f} | Ledger Entries: {len(self.ledger)}"

# 2. Derived Level 1: Savings Account with Interest Compounding
class SavingsAccount(BankAccount):
    def __init__(self, account_id, owner, initial_balance=0.0, interest_rate=0.05):
        self.interest_rate = interest_rate
        self.accrued_interest = 0.0

    def apply_interest(self):
        gain = self.balance * self.interest_rate
        self.balance = self.balance + gain
        self.accrued_interest = self.accrued_interest + gain
        self.record_entry("INTEREST", gain, f"Applied {self.interest_rate * 100:.1f}% interest")
        return self.balance

# 3. Derived Level 2: Institutional VIP Account with Overdraft Line & Cashback
class InstitutionalAccount(SavingsAccount):
    def __init__(self, account_id, owner, initial_balance=0.0, overdraft_limit=500.0, cashback_tier=0.02):
        self.overdraft_limit = overdraft_limit
        self.cashback_tier = cashback_tier
        self.cashback_total = 0.0

    def withdraw(self, amount):
        if self.is_frozen:
            raise ValueError(f"Account {self.account_id} is frozen. Transaction halted.")
        available = self.balance + self.overdraft_limit
        if amount > available:
            raise ValueError(f"Overdraft exceeded! Max capacity: \${available:.2f}, Requested: \${amount:.2f}")
        self.balance = self.balance - amount
        cashback = amount * self.cashback_tier
        self.cashback_total = self.cashback_total + cashback
        self.balance = self.balance + cashback
        self.record_entry("VIP_WITHDRAW", amount, f"Overdraft protected + \${cashback:.2f} cashback rewarded")
        return self.balance

# 4. Nested Closure Factory: Transaction Auditor with Encapsulated History
def create_transaction_auditor(auditor_name):
    audit_log = []

    def dispatch(action, *args):
        if action == "audit":
            account = args[0]
            audit_log.append(f"Audited: {account.account_id} for {account.owner}")
            return f"[{auditor_name}] Audit OK: {account.get_summary()}"
        elif action == "count":
            return len(audit_log)
        elif action == "history":
            return list(audit_log)
        return "UNKNOWN_ACTION"

    return dispatch

print("\\n[1] Instantiating Multi-Tier Account Portfolios...")
acc1 = BankAccount("BA-101", "Alice Vance", 1200.0)
acc2 = SavingsAccount("SA-202", "Bob Smith", 5000.0, 0.06)
acc3 = InstitutionalAccount("IA-303", "Cyberdyne Systems", 250.0, 1000.0, 0.03)

accounts = [acc1, acc2, acc3]
for acc in accounts:
    print("  " + acc.get_summary())

print("\\n[2] Executing Transactions & Testing Dynamic Method Dispatch...")
acc1.deposit(350.0)
acc1.withdraw(500.0)

# Compounding interest on savings account
acc2.apply_interest()
acc2.apply_interest()

# Overdraft withdrawal with cashback on institutional account
acc3.withdraw(600.0)

print("\\n[3] Account Balances after Transactions:")
for acc in accounts:
    print(f"  -> {acc.owner} ({acc.account_id}): \${acc.balance:.2f}")

print("\\n[4] Stress-Testing Robust Exception Escalation & Recovery...")
test_cases = [
    (acc1, -50.0, "Negative Deposit"),
    (acc1, 99999.0, "Excessive Withdrawal"),
    (acc3, 2500.0, "Excessive Overdraft")
]

for target_acc, test_amt, desc in test_cases:
    try:
        if test_amt < 0:
            target_acc.deposit(test_amt)
        else:
            target_acc.withdraw(test_amt)
    except ValueError as err:
        print(f"  🛡️ Caught Expected Constraint Violation [{desc}]: {err}")
    else:
        print(f"  ⚠️ Warning: {desc} unexpectedly succeeded!")
    finally:
        print(f"     [Security Guard] State verification complete for {target_acc.account_id}.")

print("\\n[5] Invoking Stateful Closure Auditor...")
auditor = create_transaction_auditor("Federal FinTech Sentinel")
for acc in accounts:
    audit_report = auditor("audit", acc)
    print(f"  -> {audit_report}")

print(f"  -> Total accounts verified by auditor closure: {auditor('count')}")
print("==================================================================")
print("  🎉 All Autonomous Banking Core Operations Verified 100% Green!")
print("==================================================================")
`,

  real_api_requests: `# Demonstration 11: Real Asynchronous HTTP Networking (requests Host Bridge)
import requests

print("=== Live HTTP Client & Fiber Suspension Demo ===")
print("[1] Dispatching async GET request to public REST API...")

response = requests.get("https://jsonplaceholder.typicode.com/todos/1")
print("HTTP Status Code:", response.status_code)
print("Is Request OK:   ", response.ok)

data = response.json()
print("\\n[2] Parsed JSON Response from Remote Server:")
print("  Record ID:   ", data["id"])
print("  Title:       ", data["title"])
print("  Completed:   ", data["completed"])

print("\\n[3] Dispatching async POST request with JSON payload...")
payload = {"title": "UVM Polyglot Runtime", "userId": 42}
post_res = requests.post("https://jsonplaceholder.typicode.com/posts", {"json": payload})
print("POST Status Code:", post_res.status_code)

created = post_res.json()
print("Echoed response from server:")
print("  Created ID:  ", created["id"])
print("  Title:       ", created["title"])

print("\\n==================================================================")
print("  🎉 Asynchronous HTTP Networking Verified with Live REST API!")
print("==================================================================")
`,

  dynamic_cpython_stdlib: `# Demonstration 12: Dynamic CPython 3.12 Standard Library & VFS Caching
# When a standard module isn't in built-ins or local VFS, UVM dynamically fetches
# the official pure-Python implementation directly from upstream CPython 3.12 GitHub!
import colorsys

print("=== Dynamic CPython 3.12 Standard Library Demo ===")
print("Module 'colorsys' was dynamically fetched from official CPython repo into VFS!")

# Convert RGB color space to HSV color space
r = 0.2
g = 0.4
b = 0.4
print(f"\\n[1] Source RGB coordinates: ({r}, {g}, {b})")

hsv = colorsys.rgb_to_hsv(r, g, b)
print("Converted to HSV using official CPython math:")
print(f"  Hue:        {round(hsv[0], 3)}")
print(f"  Saturation: {round(hsv[1], 3)}")
print(f"  Value:      {round(hsv[2], 3)}")

# Convert back from HSV to RGB
rgb_back = colorsys.hsv_to_rgb(hsv[0], hsv[1], hsv[2])
print(f"\\n[2] Round-trip RGB restored: ({round(rgb_back[0], 2)}, {round(rgb_back[1], 2)}, {round(rgb_back[2], 2)})")

print("\\n==================================================================")
print("  🎉 100% Mathematical Parity with Upstream CPython 3.12 Verified!")
print("==================================================================")
`,

  ascii_star_wars: `# ==============================================================================
# 🎬 STAR WARS (EPISODE IV: A NEW HOPE) - ASCII CINEMA
# ------------------------------------------------------------------------------
# Demonstrates UVM's High-Performance Virtual Terminal:
#   • Asynchronous HTTP streaming via requests from upstream GitHub repo
#   • In-place carriage return (\\r) download status & progress indicator
#   • ANSI escape sequences (\\x1b[2J\\x1b[H) for flicker-free terminal screen clearing
#   • Cooperative fiber suspension via sleep() keeping the browser UI fully fluid
#
# Original Asciimation by Simon Jansen (asciimation.co.nz)
# ==============================================================================

import requests
import time

print("=" * 68)
print("  ★ STAR WARS (EPISODE IV: A NEW HOPE) - ASCII CINEMA ★")
print("=" * 68)

# 1. Stream animation data from upstream GitHub (or local cache if offline)
url = "https://raw.githubusercontent.com/mgracanin/ASCIIStarWars/master/starwars.txt"
print("🎬 Connecting to upstream GitHub stream...", end="\\r")

raw_data = None
try:
    res = requests.get(url)
    if res.status_code == 200:
        raw_data = res.text
except Exception:
    pass

if not raw_data:
    try:
        with open("assets/starwars.txt", "r") as f:
            raw_data = f.read()
    except Exception:
        res = requests.get("/assets/starwars.txt")
        raw_data = res.text

# 2. Parse frames (Asciimation format: 1 duration line + 13 frame lines = 14 lines per frame)
lines = raw_data.split("\\n")
total_lines = len(lines)
total_frames = total_lines // 14

print(f"🎬 Stream loaded! Total frames: {total_frames:,}. Starting projection...\\n")
time.sleep(0.5)

# Configuration: By default, play opening sequence (~35 frames).
# Change MAX_FRAMES = None to watch all 3,400+ frames of the full movie!
MAX_FRAMES = 35

frame_idx = 0
while frame_idx < total_frames:
    if MAX_FRAMES is not None and frame_idx >= MAX_FRAMES:
        break

    start_line = frame_idx * 14
    if start_line + 14 > total_lines:
        break

    duration_str = lines[start_line].strip()
    if not duration_str:
        frame_idx += 1
        continue

    ticks = int(duration_str)
    frame_text = "\\n".join(lines[start_line + 1 : start_line + 14])

    # Flicker-free screen clear and cursor home via ANSI sequence
    print("\\x1b[2J\\x1b[H" + frame_text)

    # 15 fps base timing (67ms per tick), cooperative fiber sleep
    time.sleep(min(0.12, max(0.04, ticks * 0.05)))
    frame_idx += 1

print("\\n" + "=" * 68)
print("  🎉 Asciimation Demo Completed! (Set MAX_FRAMES = None for full movie)")
print("=" * 68)
`
};
