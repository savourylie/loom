/**
 * Parser smoke test - manual verification of parser functionality
 */

import { parseDocument } from '../src/parser/index.js';

const dsl = `
card "Login Form" #login-card .auth
  vstack gap:4 pad:6
    text "Welcome back"
    input "Email" type:email
    input "Password" type:password
    hstack gap:2
      button "Cancel" shrink
      button "Login" tone:brand grow
`;

console.log('=== Parser Smoke Test ===\n');
console.log('Input DSL:');
console.log(dsl);
console.log('\n=== Parsing ===\n');

const result = parseDocument(dsl);

console.log('Parse Result:');
console.log('- Nodes:', result.document.nodes.length);
console.log('- Diagnostics:', result.diagnostics.length);
console.log('- Node count:', result.metrics.nodeCount);
console.log('- Parse time:', result.metrics.parseTimeMs.toFixed(2), 'ms');
console.log('- Errors:', result.metrics.errorCount);
console.log('- Warnings:', result.metrics.warningCount);

console.log('\n=== Document Structure ===\n');
console.log(JSON.stringify(result.document, null, 2));

if (result.diagnostics.length > 0) {
  console.log('\n=== Diagnostics ===\n');
  for (const d of result.diagnostics) {
    console.log(`[${d.code}] ${d.severity.toUpperCase()}: ${d.message} at ${d.line}:${d.column}`);
    if (d.hint) {
      console.log(`  Hint: ${d.hint}`);
    }
  }
} else {
  console.log('\n✅ No diagnostics - parsing successful!\n');
}

// Test error handling
console.log('\n=== Testing Error Handling ===\n');

const errorDsl = `
text
button "First" #id
button "Second" #id
`;

const errorResult = parseDocument(errorDsl);
console.log('Errors found:', errorResult.diagnostics.length);
for (const d of errorResult.diagnostics) {
  console.log(`- [${d.code}] ${d.message}`);
}

console.log('\n=== Smoke Test Complete ===\n');
