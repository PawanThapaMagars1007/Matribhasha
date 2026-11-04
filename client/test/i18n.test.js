import test from 'node:test';
import assert from 'node:assert/strict';
import { interfaceLanguages, translate, translationCompleteness } from '../src/i18n/translations.js';

test('shared interface catalog has complete English and Nepali chrome strings', () => {
  assert.deepEqual(Object.keys(interfaceLanguages), ['en', 'ne']);
  assert.equal(translationCompleteness('en').complete, true);
  assert.equal(translationCompleteness('ne').complete, true);
  assert.equal(translate('nav.Culture & stories', 'ne'), 'संस्कृति र कथाहरू');
  assert.equal(translate('unknown.key', 'ne'), 'unknown.key');
});
