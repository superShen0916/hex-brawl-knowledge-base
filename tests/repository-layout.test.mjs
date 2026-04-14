import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';

const expectedPaths = [
  '.gitignore',
  'README.md',
  'package.json',
  'index.html',
  'site/index.html',
  'site/styles.css',
  'site/app.js',
  'data/entries/.gitkeep',
  'data/generated/.gitkeep',
];

test('repository exposes the expected static-site skeleton', () => {
  for (const target of expectedPaths) {
    assert.equal(existsSync(target), true, `missing ${target}`);
  }
});
