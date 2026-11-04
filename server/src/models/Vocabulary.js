import mongoose from 'mongoose';

const vocabularySchema = new mongoose.Schema({
  language: { type: mongoose.Schema.Types.ObjectId, ref: 'Language', required: true, index: true },
  variety: { type: mongoose.Schema.Types.ObjectId, ref: 'LanguageVariety', default: null, index: true },
  script: { type: mongoose.Schema.Types.ObjectId, ref: 'Script', default: null, index: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'VocabularyCategory', default: null, index: true },
  nativeForm: { type: String, required: true, trim: true, maxlength: 200 },
  romanTransliteration: { type: String, trim: true, maxlength: 200, default: '' },
  alternativeForms: [{ type: String, trim: true, maxlength: 200 }],
  partOfSpeech: { type: String, trim: true, maxlength: 80, default: '' },
  categoryLabel: { type: String, trim: true, maxlength: 100, default: '' },
  culturalNotes: { type: String, trim: true, maxlength: 2000, default: '' },
  meanings: [{ type: mongoose.Schema.Types.ObjectId, ref: 'WordMeaning' }],
  translations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Translation' }],
  exampleSentences: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ExampleSentence' }],
  pronunciations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Pronunciation' }],
  relatedVocabulary: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Vocabulary' }],
  synonyms: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Vocabulary' }],
  antonyms: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Vocabulary' }],
  source: { type: String, trim: true, maxlength: 1000, default: '' },
  verification: { status: { type: String, enum: ['unreviewed', 'pending', 'verified', 'needs-review'], default: 'unreviewed' }, reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, reviewedAt: { type: Date, default: null } },
  status: { type: String, enum: ['draft', 'under-review', 'published', 'archived'], default: 'draft', index: true },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

vocabularySchema.index({ language: 1, variety: 1, status: 1, nativeForm: 1 });
vocabularySchema.index({ language: 1, variety: 1, nativeForm: 'text', romanTransliteration: 'text', alternativeForms: 'text' });
vocabularySchema.index({ language: 1, variety: 1, nativeForm: 1, script: 1 }, { unique: true });
export const Vocabulary = mongoose.model('Vocabulary', vocabularySchema);
