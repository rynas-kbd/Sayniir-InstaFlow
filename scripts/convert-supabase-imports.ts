#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';

// Root of the project (assumes this script resides in <project>/scripts)
const projectRoot = path.resolve(__dirname, '..');

function replaceImport(filePath: string) {
  let content = fs.readFileSync(filePath, 'utf8');
  const importRegex = /import\s+{([^}]+)}\s+from\s+['"]@\/lib\/supabase\/([^'\"]+)['"]/g;
  let hasChange = false;
  content = content.replace(importRegex, (match, imports, subPath) => {
    const target = path.join(projectRoot, 'lib', 'supabase', subPath);
    let relative = path.relative(path.dirname(filePath), target);
    // Convert Windows backslashes to POSIX forward slashes for import statements
    relative = relative.split(path.sep).join('/');
    if (!relative.startsWith('.')) {
      relative = './' + relative;
    }
    hasChange = true;
    return `import { ${imports.trim()} } from '${relative}'`;
  });
  if (hasChange) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated imports in ${filePath}`);
  }
}

function walk(dir: string) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
      walk(fullPath);
    } else if (entry.isFile() && /\.(ts|tsx|js|jsx)$/.test(entry.name)) {
      replaceImport(fullPath);
    }
  }
}

walk(projectRoot);
