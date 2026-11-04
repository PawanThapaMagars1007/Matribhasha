import mongoose from 'mongoose';

const translationSchema = new mongoose.Schema({
  sourceVocabulary: { type: mongoose.Schema.Types.ObjectId, ref: 'Vocabulary', required: true, index: true },
  sourceMeaning: { type: mongoose.Schema.Types.ObjectId, ref: 'WordMeaning', default: null },
  targetVocabulary: { type: mongoose.Schema.Types.ObjectId, ref: 'Vocabulary', required: true, index: true },
  targetMeaning: { type: mongoose.Schema.Types.ObjectId, ref: 'WordMeaning', default: null },
  sourceLanguage: { type: mongoose.Schema.Types.ObjectId, ref: 'Language', required: true, index: true },
  targetLanguage: { type: mongoose.Schema.Types.ObjectId, ref: 'Language', required: true, index: true },
  sourceVariety: { type: mongoose.Schema.Types.ObjectId, ref: 'LanguageVariety', default: null },
  targetVariety: { type: mongoose.Schema.Types.ObjectId, ref: 'LanguageVariety', default: null },
  contextNote: { type: String, trim: true, maxlength: 1000, default: '' },
  usageLabel: { type: String, trim: true, maxlength: 100, default: '' },
  source: { type: String, trim: true, maxlength: 1000, default: '' },
  attribution: { type: String, trim: true, maxlength: 300, default: '' },
  verification: { status: { type: String, enum: ['unreviewed', 'pending', 'verified', 'needs-review'], default: 'unreviewed' }, reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, reviewedAt: { type: Date, default: null } },
  status: { type: String, enum: ['draft', 'under-review', 'published', 'archived'], default: 'draft', index: true },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });
translationSchema.index({ sourceVocabulary: 1, targetLanguage: 1, sourceVariety: 1, targetVariety: 1, status: 1 });
export const Translation = mongoose.model('Translation', translationSchema);
