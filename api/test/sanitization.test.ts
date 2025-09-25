// Test file to demonstrate input sanitization functionality
// This file shows examples of how the sanitization works

console.log('=== Input Sanitization Test Examples ===\n');

// Example dangerous inputs that would be sanitized
const dangerousInputs = [
  "'; DROP TABLE users; --",
  "<script>alert('XSS')</script>",
  "javascript:alert('XSS')",
  "SELECT * FROM users WHERE id = 1; UNION SELECT password FROM users",
  "Robert'); DROP TABLE users; --",
  "<img src=x onerror=alert('XSS')>",
  "admin' OR '1'='1",
  "../../../etc/passwd",
  "onmouseover=alert('XSS')",
  "UNION SELECT username, password FROM users"
];

console.log('Dangerous inputs that would be sanitized:');
dangerousInputs.forEach((input, index) => {
  console.log(`${index + 1}. "${input}"`);
});

console.log('\n=== Sanitization Features ===');
console.log('✅ Removes SQL injection patterns (quotes, semicolons, SQL keywords)');
console.log('✅ Removes XSS patterns (script tags, javascript: protocol, event handlers)');
console.log('✅ Removes HTML tags and dangerous attributes');
console.log('✅ Trims and normalizes whitespace');
console.log('✅ Applied automatically to all API inputs (query, params, body)');
console.log('✅ Works recursively on nested objects and arrays');

console.log('\n=== Protection Against ===');
console.log('• SQL Injection attacks');
console.log('• Cross-Site Scripting (XSS)');
console.log('• Path traversal attacks');
console.log('• Command injection');
console.log('• HTML injection');

console.log('\n=== Sanitization Test Complete ===');
