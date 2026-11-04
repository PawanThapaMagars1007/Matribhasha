import test from 'node:test';
import assert from 'node:assert/strict';
import { Language } from '../src/models/Language.js';
import { LanguageVariety } from '../src/models/LanguageVariety.js';
import { Script } from '../src/models/Script.js';
import { User } from '../src/models/User.js';
import { Character } from '../src/models/Character.js';
import { CharacterCategory } from '../src/models/CharacterCategory.js';
import { Pronunciation } from '../src/models/Pronunciation.js';
import { LearningProgress } from '../src/models/LearningProgress.js';
import { PracticeSession } from '../src/models/PracticeSession.js';
import { AudioAsset } from '../src/models/AudioAsset.js';
import { inspectAudio } from '../src/storage/audioStorage.js';
import { Vocabulary } from '../src/models/Vocabulary.js';
import { WordMeaning } from '../src/models/WordMeaning.js';
import { Translation } from '../src/models/Translation.js';
import { SentenceExercise } from '../src/models/SentenceExercise.js';
import { UserSavedWord } from '../src/models/UserSavedWord.js';
import { VocabularyProgress } from '../src/models/VocabularyProgress.js';
import { scheduleReview } from '../src/services/spacedRepetition.js';
import { Course } from '../src/models/Course.js';
import { CourseModule } from '../src/models/CourseModule.js';
import { CourseLesson } from '../src/models/CourseLesson.js';
import { CourseEnrollment } from '../src/models/CourseEnrollment.js';
import { Assessment } from '../src/models/Assessment.js';
import { AssessmentAttempt } from '../src/models/AssessmentAttempt.js';
import { SpeakingPractice } from '../src/models/SpeakingPractice.js';
import { CourseCertificate } from '../src/models/CourseCertificate.js';

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

test('character learning units preserve Unicode graphemes and do not require a universal category', async () => {
  const character = new Character({ language: '507f1f77bcf86cd799439011', script: '507f1f77bcf86cd799439012', grapheme: 'क़', displayForm: 'क़' });
  await character.validate();
  assert.equal(character.grapheme, 'क़');
  assert.equal(character.category, null);
  assert.equal(character.status, 'draft');
});

test('character categories require language, script and a name', async () => {
  await assert.rejects(new CharacterCategory({ name: 'Vowels', language: '507f1f77bcf86cd799439011' }).validate(), /script/);
  const category = new CharacterCategory({ name: 'Syllable units', language: '507f1f77bcf86cd799439011', script: '507f1f77bcf86cd799439012' });
  await category.validate();
  assert.equal(category.status, 'draft');
});

test('pronunciation records separate notation from recording metadata', async () => {
  const pronunciation = new Pronunciation({ character: '507f1f77bcf86cd799439011', language: '507f1f77bcf86cd799439012', notation: 'ipa', notationText: '/test/', createdBy: '507f1f77bcf86cd799439013' });
  await pronunciation.validate();
  assert.equal(pronunciation.notation, 'ipa');
  assert.equal(pronunciation.status, 'draft');
  assert.equal(pronunciation.audioAsset, null);
});

test('learning progress and answer sessions default to conservative states', async () => {
  const progress = new LearningProgress({ user: '507f1f77bcf86cd799439011', character: '507f1f77bcf86cd799439012', language: '507f1f77bcf86cd799439013', script: '507f1f77bcf86cd799439014' });
  await progress.validate();
  assert.equal(progress.status, 'not-started');
  assert.equal(progress.quizAttempts, 0);
  const session = new PracticeSession({ user: progress.user, language: progress.language, script: progress.script, targetCharacter: progress.character, correctCharacter: progress.character, choices: [progress.character], mode: 'matching' });
  await session.validate();
  assert.equal(session.status, 'pending');
});

test('audio assets require attribution and consent metadata, and upload validation checks file signatures', async () => {
  await assert.rejects(new AudioAsset({ format: 'webm', mimeType: 'audio/webm', byteSize: 50, storageKey: 'asset.webm', createdBy: '507f1f77bcf86cd799439011' }).validate(), /attribution/);
  const asset = new AudioAsset({ format: 'webm', mimeType: 'audio/webm', byteSize: 50, storageKey: 'asset.webm', attribution: 'Contributor recording', consentRecorded: true, createdBy: '507f1f77bcf86cd799439011' });
  await asset.validate();
  assert.equal(asset.status, 'pending');
  assert.equal(inspectAudio(Buffer.from([0x1a, 0x45, 0xdf, 0xa3, ...Array(8).fill(0)]), 'audio/webm')?.format, 'webm');
  assert.equal(inspectAudio(Buffer.from('not an audio file'), 'audio/webm'), null);
});

test('vocabulary supports Unicode forms and stays unpublished until reviewed', async () => {
  const word = new Vocabulary({ language: '507f1f77bcf86cd799439011', nativeForm: 'माया' });
  await word.validate();
  assert.equal(word.nativeForm, 'माया');
  assert.equal(word.status, 'draft');
  assert.equal(word.verification.status, 'unreviewed');
});

test('meanings and translations require explicit vocabulary and language associations', async () => {
  await assert.rejects(new WordMeaning({ definition: 'meaning' }).validate(), /vocabulary/);
  await assert.rejects(new Translation({ sourceVocabulary: '507f1f77bcf86cd799439011' }).validate(), /targetVocabulary/);
  const translation = new Translation({ sourceVocabulary: '507f1f77bcf86cd799439011', targetVocabulary: '507f1f77bcf86cd799439012', sourceLanguage: '507f1f77bcf86cd799439013', targetLanguage: '507f1f77bcf86cd799439014' });
  await translation.validate();
  assert.equal(translation.status, 'draft');
});

test('sentence exercise answers are excluded from default model selection', () => {
  assert.equal(SentenceExercise.schema.path('answer').options.select, false);
});

test('learner vocabulary records are user scoped and spaced repetition schedules each rating', async () => {
  const saved = new UserSavedWord({ user: '507f1f77bcf86cd799439011', vocabulary: '507f1f77bcf86cd799439012', language: '507f1f77bcf86cd799439013' });
  await saved.validate();
  const progress = new VocabularyProgress({ user: saved.user, vocabulary: saved.vocabulary, language: saved.language });
  await progress.validate();
  const now = new Date('2026-01-01T00:00:00Z');
  assert.equal(scheduleReview('again', progress.toObject(), now).status, 'needs-revision');
  assert.equal(scheduleReview('good', progress.toObject(), now).intervalDays, 1);
});

test('courses adapt through explicit language structure and remain drafts before review', async () => {
  const course = new Course({ title: 'First conversations', description: 'A reviewed language course.', language: '507f1f77bcf86cd799439011', difficulty: 'absolute-beginner' });
  await course.validate();
  assert.equal(course.status, 'draft');
  assert.equal(course.variety, null);
  assert.equal(course.completionRequiresAllLessons, true);
});

test('course modules and lessons preserve configured order and flexible block types', async () => {
  const module = new CourseModule({ course: '507f1f77bcf86cd799439011', title: 'Speaking first', order: 0 });
  await module.validate();
  const lesson = new CourseLesson({ course: module.course, module: module._id, title: 'Greetings', order: 0, blocks: [{ type: 'SPEAKING_EXERCISE', speakingPrompt: 'Say hello' }] });
  await lesson.validate();
  assert.equal(lesson.blocks[0].type, 'SPEAKING_EXERCISE');
  assert.equal(lesson.completionRule, 'view-and-confirm');
});

test('assessment answer keys are hidden by default and attempts store server scores', async () => {
  assert.equal(Assessment.schema.path('answerKey').options.select, false);
  assert.ok(AssessmentAttempt.schema.indexes().some(([keys, options]) => options.unique && keys.attemptNumber === 1));
  const attempt = new AssessmentAttempt({ user: '507f1f77bcf86cd799439011', assessment: '507f1f77bcf86cd799439012', course: '507f1f77bcf86cd799439013', answers: { q1: 'a' }, score: 100, passed: true, attemptNumber: 1 });
  await attempt.validate();
  assert.equal(attempt.score, 100);
});

test('enrolments are user-course scoped and speaking practice stores no recording by default', async () => {
  const enrollment = new CourseEnrollment({ user: '507f1f77bcf86cd799439011', course: '507f1f77bcf86cd799439012', language: '507f1f77bcf86cd799439013' });
  await enrollment.validate();
  const speaking = new SpeakingPractice({ user: enrollment.user, language: enrollment.language, targetType: 'prompt', selfAssessment: 'getting-there' });
  await speaking.validate();
  assert.equal(speaking.recordingStored, false);
  assert.equal(CourseCertificate.schema.path('certificateId').options.unique, true);
});
