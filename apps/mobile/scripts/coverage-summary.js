const fs = require('fs');
const d = JSON.parse(fs.readFileSync('coverage/coverage-summary.json', 'utf8'));
const t = d.total;
const normalizeKey = (k) => {
  // Windows paths use double-escaped backslashes in JSON: C:\\dev\\...
  const normalized = k.replace(/\\\\/g, '/').replace(/\\/g, '/');
  const idx = normalized.indexOf('apps/mobile/');
  return idx >= 0 ? normalized.slice(idx + 'apps/mobile/'.length) : normalized;
};
const files = Object.entries(d)
  .filter(([k]) => k !== 'total')
  .map(([k, v]) => ({
    file: normalizeKey(k),
    stmt: v.statements.pct,
    branch: v.branches.pct,
    fn: v.functions.pct,
    line: v.lines.pct,
    unc: v.statements.total - v.statements.covered
  }))
  .filter(f => f.stmt < 100 || f.branch < 100 || f.fn < 100 || f.line < 100);

console.log('Files below 100%: ' + files.length);
console.log('  Calculations: ' + files.filter(f => f.file.includes('calculations')).length);
console.log('  Stores: ' + files.filter(f => f.file.startsWith('stores')).length);
console.log('  Hooks: ' + files.filter(f => f.file.startsWith('hooks')).length);
console.log('  AI services: ' + files.filter(f => f.file.includes('services/ai')).length);
console.log('  Other services: ' + files.filter(f => f.file.startsWith('services') && !f.file.includes('ai') && !f.file.includes('calculations')).length);
console.log('  Utils: ' + files.filter(f => f.file.startsWith('utils')).length);
console.log('  Components: ' + files.filter(f => f.file.startsWith('components')).length);
console.log('  Screens (app/): ' + files.filter(f => f.file.startsWith('app')).length);
console.log('');
console.log('Stmt:   ' + t.statements.pct + '% (' + t.statements.covered + '/' + t.statements.total + ')');
console.log('Branch: ' + t.branches.pct + '% (' + t.branches.covered + '/' + t.branches.total + ')');
console.log('Fn:     ' + t.functions.pct + '% (' + t.functions.covered + '/' + t.functions.total + ')');
console.log('Line:   ' + t.lines.pct + '% (' + t.lines.covered + '/' + t.lines.total + ')');
