// File: tests/test_async_requests.js
import assert from 'assert';
import { UniversalInterpreter } from '../js/index.js';

console.log('=== Running Real HTTP Requests & Fiber Suspension Tests ===\n');

const uvm = new UniversalInterpreter();

// Test 1: Real HTTP GET request to a public mock/echo API
{
  console.log('Testing requests.get() with live REST API...');
  const code = `
import requests

response = requests.get("https://jsonplaceholder.typicode.com/todos/1")
print("Status:", response.status_code)
print("Is OK:", response.ok)
data = response.json()
print("Todo ID:", data["id"])
print("Todo Title:", data["title"])
`;

  try {
    const result = await uvm.run(code, { language: 'python' });
    console.log(result.output);
    assert.ok(result.output.includes('Status: 200'), 'Status should be 200');
    assert.ok(/Is OK:\s+(True|true)/.test(result.output), 'Is OK should be True');
    assert.ok(result.output.includes('Todo ID: 1'), 'Todo ID should be 1');
    console.log(`  ✅ Test 1 Passed: Live requests.get() completed in ${result.durationMs.toFixed(1)}ms\n`);
  } catch (err) {
    console.error('Test 1 failed with error:', err);
    throw err;
  }
}

// Test 2: Real HTTP POST request with JSON payload
{
  console.log('Testing requests.post() with JSON payload...');
  const code = `
import requests

payload = {"name": "UVM Polyglot", "version": 3.5}
response = requests.post("https://jsonplaceholder.typicode.com/posts", {"json": payload})
print("Post Status:", response.status_code)

res_json = response.json()
print("Post Name:", res_json["name"])
`;

  try {
    const result = await uvm.run(code, { language: 'python' });
    console.log(result.output);
    assert.ok(result.output.includes('Post Status: 201'), 'Status should be 201 Created');
    assert.ok(result.output.includes('Post Name: UVM Polyglot'), 'Echoed payload should match');
    console.log(`  ✅ Test 2 Passed: Live requests.post() completed in ${result.durationMs.toFixed(1)}ms\n`);
  } catch (err) {
    console.error('Test 2 failed with error:', err);
    throw err;
  }
}

console.log('🎉 All Real HTTP Requests Tests Passed with 100% Success!\n');
