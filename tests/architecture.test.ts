import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Architectural Boundary Enforcement', () => {
  function scanDir(dir: string, fileList: string[] = []): string[] {
    const files = fs.readdirSync(dir);
    for (const f of files) {
      const full = path.join(dir, f);
      if (fs.statSync(full).isDirectory()) {
        scanDir(full, fileList);
      } else if (f.endsWith('.tsx') || f.endsWith('.ts')) {
        fileList.push(full);
      }
    }
    return fileList;
  }

  it('enforces that UI components and pages only import from src/api, never src/core directly', () => {
    const pagesDir = path.resolve(__dirname, '../src/pages');
    const compDir = path.resolve(__dirname, '../src/components');

    const uiFiles = [...scanDir(pagesDir), ...scanDir(compDir)];
    expect(uiFiles.length).toBeGreaterThan(0);

    const violations: { file: string; line: string }[] = [];

    for (const filePath of uiFiles) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        // Check for direct imports to src/core or ../../core or ./core
        if (
          /import\s+.*from\s+['"][^'"]*\/core(\/.*)?['"]/.test(line) ||
          /import\s+.*from\s+['"]\.\.\/core(\/.*)?['"]/.test(line) ||
          /import\s+.*from\s+['"]\.\.\/\.\.\/core(\/.*)?['"]/.test(line)
        ) {
          violations.push({
            file: path.relative(path.resolve(__dirname, '..'), filePath),
            line: `Line ${index + 1}: ${line.trim()}`,
          });
        }
      });
    }

    expect(
      violations,
      `Architectural boundary violation: UI components must only access domain data via src/api facade! Violations:\n${violations.map((v) => `${v.file} - ${v.line}`).join('\n')}`
    ).toEqual([]);
  });
});
