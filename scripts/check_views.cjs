const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const viewsDir = path.join(root, 'views');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(filePath));
    } else {
      results.push(filePath);
    }
  });
  return results;
}

const sourceFiles = walk(root).filter(f => /\.(js|ejs|ts|cjs)$/.test(f) && !f.includes('node_modules'));
const renderRegex = /res\.render\(\s*['`\"]([^'"`\)]+)['"`\s,\)]/g;
const renders = new Set();

for (const file of sourceFiles) {
  const txt = fs.readFileSync(file, 'utf8');
  let m;
  while ((m = renderRegex.exec(txt)) !== null) {
    renders.add(m[1]);
  }
}

const missing = [];
const ok = [];

for (const viewName of Array.from(renders).sort()) {
  // Map viewName to possible filesystem paths
  const candidate = path.join(viewsDir, viewName + '.ejs');
  const candidateIndex = path.join(viewsDir, viewName, 'index.ejs');
  if (fs.existsSync(candidate)) {
    ok.push(viewName + ' -> ' + path.relative(root, candidate));
  } else if (fs.existsSync(candidateIndex)) {
    ok.push(viewName + ' -> ' + path.relative(root, candidateIndex));
  } else {
    missing.push(viewName);
  }
}

console.log('Scanned source files:', sourceFiles.length);
console.log('Found res.render() usages:', renders.size);
console.log('--- OK views ---');
ok.forEach(x => console.log(x));
console.log('--- MISSING views ---');
if (missing.length === 0) {
  console.log('None. All referenced views exist under views/.');
} else {
  missing.forEach(x => console.log(x));
}
