import mongoose from 'mongoose';

const pronunciationSchema = new mongoose.Schema({
  character: { type: mongoose.Schema.Types.ObjectId, ref: 'Character', default: null, index: true },
  vocabulary: { type: mongoose.Schema.Types.ObjectId, ref: 'Vocabulary', default: null, index: true },
  language: { type: mongoose.Schema.Types.ObjectId, ref: 'Language', required: true, index: true },
  variety: { type: mongoose.Schema.Types.ObjectId, ref: 'LanguageVariety', default: null, index: true },
  notation: { type: String, enum: ['ipa', 'romanization', 'description', 'other'], default: 'description' },
  notationText: { type: String, trim: true, maxlength: 150, default: '' },
  context: { type: String, trim: true, maxlength: 1000, default: '' },
  audioAsset: { type: mongoose.Schema.Types.ObjectId, ref: 'AudioAsset', default: null },
  speakerLabel: { type: String, trim: true, maxlength: 100, default: '' },
  source: { type: String, trim: true, maxlength: 500, default: '' },
  attribution: { type: String, trim: true, maxlength: 300, default: '' },
  verification: { status: { type: String, enum: ['unreviewed', 'pending', 'verified', 'needs-review'], default: 'unreviewed' }, reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, reviewedAt: { type: Date, default: null } },
  status: { type: String, enum: ['draft', 'under-review', 'published', 'archived'], default: 'draft', index: true },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

pronunciationSchema.index({ character: 1, variety: 1, status: 1 });
pronunciationSchema.index({ vocabulary: 1, variety: 1, status: 1 });
pronunciationSchema.pre('validate', function validateLearningTarget(next) {
  if (Boolean(this.character) === Boolean(this.vocabulary)) this.invalidate('character', 'A pronunciation must reference either one character or one vocabulary item.');
  next();
});
export const Pronunciation = mongoose.model('Pronunciation', pronunciationSchema);
