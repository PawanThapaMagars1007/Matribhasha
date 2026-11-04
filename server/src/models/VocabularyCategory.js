import mongoose from 'mongoose';

const vocabularyCategorySchema = new mongoose.Schema({
  language: { type: mongoose.Schema.Types.ObjectId, ref: 'Language', required: true, index: true },
  variety: { type: mongoose.Schema.Types.ObjectId, ref: 'LanguageVariety', default: null, index: true },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  nativeName: { type: String, trim: true, maxlength: 100, default: '' },
  description: { type: String, trim: true, maxlength: 1000, default: '' },
  learningOrder: { type: Number, min: 0, max: 10000, default: 0 },
  source: { type: String, trim: true, maxlength: 1000, default: '' },
  verification: { status: { type: String, enum: ['unreviewed', 'pending', 'verified', 'needs-review'], default: 'unreviewed' }, reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, reviewedAt: { type: Date, default: null } },
  status: { type: String, enum: ['draft', 'under-review', 'published', 'archived'], default: 'draft', index: true },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });
vocabularyCategorySchema.index({ language: 1, variety: 1, name: 1 }, { unique: true });
export const VocabularyCategory = mongoose.model('VocabularyCategory', vocabularyCategorySchema);
