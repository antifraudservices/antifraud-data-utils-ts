// Flow contract: neutral text comparison folds case and whitespace only, preserves punctuation/diacritics and original text, and never coerces other input types into comparison keys.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import * as identityData from '../dist/index.js';

function comparisonKey() {
  assert.equal(typeof identityData.normalizeComparisonText, 'function', 'the owned neutral comparison API is missing');
  return identityData.normalizeComparisonText;
}

test('exports the neutral comparison function through the public root', () => {
  comparisonKey();
});

test('folds surrounding/internal whitespace and Unicode case', () => {
  assert.equal(comparisonKey()(' \t café\n\r  démo\u00a0 '), 'CAFÉ DÉMO');
});

test('preserves punctuation and accent distinctions', () => {
  const normalize = comparisonKey();
  assert.equal(normalize(' alpha-beta l’été '), 'ALPHA-BETA L’ÉTÉ');
  assert.notEqual(normalize('café'), normalize('cafe'));
  assert.notEqual(normalize('alpha-beta'), normalize('alpha beta'));
});

test('preserves the distinction between composed and decomposed accents', () => {
  assert.notEqual(comparisonKey()('é'), comparisonKey()('e\u0301'));
});

test('handles absent text explicitly and rejects other non-string inputs', () => {
  const normalize = comparisonKey();
  assert.equal(normalize(undefined), '');
  assert.equal(normalize(null), '');
  assert.equal(normalize(''), '');
  for (const value of [0, false, [], ['text'], {}, { toString: () => 'text' }]) {
    assert.throws(() => normalize(value), TypeError);
  }
});

test('publishes the same function through a dedicated typed leaf', async () => {
  const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  const leaf = manifest.exports['./text-comparison'];
  assert.equal(leaf?.types, './dist/text-comparison.d.ts');
  assert.equal(leaf?.default ?? leaf?.import, './dist/text-comparison.js');
  assert.equal((await import('../dist/text-comparison.js')).normalizeComparisonText, comparisonKey());
});
