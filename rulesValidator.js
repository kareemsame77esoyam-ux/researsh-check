const rules = require('./rules.json');

async function check(paper) {
  const errors = [];

  for (const rule of rules) {
    try {
      // Evaluate the rule's check expression with `paper` in scope
      // Use Function constructor for safe dynamic evaluation
      // The expression is expected to return true if valid
      const isValid = Function('paper', `return (${rule.check});`)(paper);
      if (!isValid) {
        errors.push(rule.error_message);
      }
    } catch (e) {
      // On error evaluating rule, consider rule failed
      errors.push(`خطأ في التحقق من القاعدة: ${rule.description}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

module.exports = { check };