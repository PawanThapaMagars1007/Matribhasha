import mongoose from 'mongoose';

const characterCategorySchema = new mongoose.Schema({
  language: { type: mongoose.Schema.Types.ObjectId, ref: 'Language', required: true, index: true },
  variety: { type: mongoose.Schema.Types.ObjectId, ref: 'LanguageVariety', default: null, index: true },
  script: { type: mongoose.Schema.Types.ObjectId, ref: 'Script', required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  nativeName: { type: String, trim: true, maxlength: 100, default: '' },
  description: { type: String, trim: true, maxlength: 1500, default: '' },
  learningOrder: { type: Number, min: 0, max: 10000, default: 0 },
  verification: { status: { type: String, enum: ['unreviewed', 'pending', 'verified', 'needs-review'], default: 'unreviewed' }, source: { type: String, trim: true, maxlength: 1000, default: '' }, reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, reviewedAt: { type: Date, default: null } },
  status: { type: String, enum: ['draft', 'under-review', 'published', 'archived'], default: 'draft', index: true },
  isActive: { type: Boolean, default: true, index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

characterCategorySchema.index({ language: 1, variety: 1, script: 1, name: 1 }, { unique: true });
characterCategorySchema.index({ language: 1, script: 1, status: 1, learningOrder: 1 });
export const CharacterCategory = mongoose.model('CharacterCategory', characterCategorySchema);
