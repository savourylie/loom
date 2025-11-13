#!/usr/bin/env node
/**
 * Smoke test for the Loom DSL lexer
 * Run with: npx tsx examples/smoke-test.ts
 */

import { Tokenizer, TokenType } from '../src/index.js';

const dsl = `
grid cols:12 gap:2
  card "Login" #auth @c5 s4 pad:3
    button "Sign in" tone:primary

style default {
  skin: clean;
  color.brand: #6D28D9
}
`;

console.log('🔍 Loom DSL Lexer Smoke Test\n');
console.log('Input DSL:');
console.log('─'.repeat(50));
console.log(dsl);
console.log('─'.repeat(50));

const tokenizer = new Tokenizer(dsl);
const tokens = tokenizer.tokenize();

console.log('\n📋 Tokens:');
console.log('─'.repeat(50));

// Filter out newlines and EOF for cleaner output
const significantTokens = tokens.filter(
  (t) => t.type !== TokenType.NEWLINE && t.type !== TokenType.EOF,
);

significantTokens.forEach((token, index) => {
  const value =
    typeof token.value === 'string' && token.value !== token.raw
      ? ` = "${token.value}"`
      : '';
  console.log(
    `${String(index + 1).padStart(2)}. ${token.type.padEnd(20)} ${token.raw}${value}`,
  );
});

console.log('─'.repeat(50));
console.log(`\n✅ Total tokens: ${tokens.length}`);
console.log(`   Significant: ${significantTokens.length}`);

const errors = tokenizer.getErrors();
if (errors.length > 0) {
  console.log(`\n❌ Errors: ${errors.length}`);
  errors.forEach((error) => {
    console.log(`   ${error.format()}`);
  });
} else {
  console.log('\n✅ No errors!');
}

console.log('\n🎉 Smoke test complete!\n');
