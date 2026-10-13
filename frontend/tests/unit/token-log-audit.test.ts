import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const srcRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../src');

function listSourceFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...listSourceFiles(full));
      continue;
    }
    if (full.endsWith('.ts') || full.endsWith('.tsx')) {
      files.push(full);
    }
  }
  return files;
}

/**
 * Collect console.* argument text, including calls that span multiple lines.
 */
function consoleArgumentText(source: string): string[] {
  const calls: string[] = [];
  const marker = /console\.(?:log|debug|info|warn|error|trace)\s*\(/g;
  let match: RegExpExecArray | null;
  while ((match = marker.exec(source)) !== null) {
    let depth = 1;
    let index = match.index + match[0].length;
    const start = index;
    while (index < source.length && depth > 0) {
      const char = source[index];
      if (char === '(') depth += 1;
      if (char === ')') depth -= 1;
      index += 1;
    }
    calls.push(source.slice(start, index - 1));
  }
  return calls;
}

describe('M12-P02-T02 frontend token log audit', () => {
  it('keeps the auth token key and does not print tokens from console calls', () => {
    const storageKeys = readFileSync(path.join(srcRoot, 'constants/storage-keys.ts'), 'utf8');
    assert.match(storageKeys, /AUTH_TOKEN:\s*'cos_auth_token'/);

    const leaks: string[] = [];
    for (const file of listSourceFiles(srcRoot)) {
      const source = readFileSync(file, 'utf8');
      for (const args of consoleArgumentText(source)) {
        if (
          /\btoken\b|AUTH_TOKEN|cos_auth_token|Authorization|passwordHash|JWT_SECRET/.test(args)
        ) {
          leaks.push(`${path.relative(srcRoot, file)}: ${args.replace(/\s+/g, ' ').slice(0, 180)}`);
        }
      }
    }
    assert.deepEqual(leaks, []);
  });

  it('gitignores .env files and still tracks .env.example', () => {
    const gitignore = readFileSync(path.resolve(srcRoot, '../.gitignore'), 'utf8');
    assert.match(gitignore, /^\.env$/m);
    assert.match(gitignore, /^\.env\.\*$/m);
    assert.match(gitignore, /^!\.env\.example$/m);
  });
});
