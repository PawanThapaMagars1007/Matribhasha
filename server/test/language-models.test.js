import test from 'node:test';
import assert from 'node:assert/strict';
import { Language } from '../src/models/Language.js';
import { LanguageVariety } from '../src/models/LanguageVariety.js';
import { Script } from '../src/models/Script.js';
import { User } from '../src/models/User.js';

test('language supports Unicode names and draft-safe defaults', async () => {
  const doc = new Language({ name: 'नेपाल भाषा', nativeName: 'नेपाल भाषा' });
  await doc.validate();
  assert.equal(doc.name, 'नेपाल भाषा');
  assert.equal(doc.status, 'draft');
  assert.equal(doc.isActive, true);
  assert.equal(doc.isPublished, false);
});

test('language requires a name and accepts only supported publication states', async () => {
  await assert.rejects(new Language({}).validate(), /name/);
  await assert.rejects(new Language({ name: 'Example', status: 'live' }).validate(), /status/);
});

test('variety requires a parent language and a name', async () => {
  await assert.rejects(new LanguageVariety({ name: 'Example' }).validate(), /language/);
  await assert.rejects(new LanguageVariety({ language: '507f1f77bcf86cd799439011' }).validate(), /name/);
});

test('scripts allow an unknown direction and optional Unicode details', async () => {
  const script = new Script({ name: 'Community writing system' });
  await script.validate();
  assert.equal(script.direction, 'unknown');
  assert.equal(script.unicodeRange, '');
});

test('user language preferences keep interface, native, known, and target fields distinct', async () => {
  const user = new User({ name: 'Learner', email: 'learner@example.com', passwordHash: 'hash' });
  await user.validate();
  assert.equal(user.preferences.interfaceLanguage, 'en');
  assert.deepEqual(user.preferences.nativeLanguages, []);
  assert.deepEqual(user.preferences.knownLanguages, []);
  assert.deepEqual(user.preferences.learningLanguages, []);
});

test('language codes are uniquely indexed only when supplied', () => {
  const codeIndex = Language.schema.indexes().find(([keys]) => keys.code === 1);
  assert.ok(codeIndex);
  assert.equal(codeIndex[1].unique, true);
  assert.equal(codeIndex[1].partialFilterExpression.code.$gt, '');
});
