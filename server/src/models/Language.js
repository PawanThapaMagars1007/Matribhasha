import mongoose from 'mongoose';

const verificationSchema = new mongoose.Schema({
  status: { type: String, enum: ['unreviewed', 'pending', 'verified', 'needs-review'], default: 'unreviewed' },
  source: { type: String, trim: true, maxlength: 1000, default: '' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  reviewedAt: { type: Date, default: null },
}, { _id: false });

const languageSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  nativeName: { type: String, trim: true, maxlength: 100, default: '' },
  nativeNameLatin: { type: String, trim: true, maxlength: 100, default: '' },
  alternativeNames: [{ type: String, trim: true, maxlength: 100 }],
  description: { type: String, maxlength: 2000, default: '' },
  code: { type: String, trim: true, lowercase: true, maxlength: 35, default: '' },
  regions: [{ type: String, trim: true, maxlength: 100 }],
  family: { type: String, trim: true, maxlength: 150, default: '' },
  familyVerification: { type: verificationSchema, default: () => ({}) },
  varieties: [{ type: mongoose.Schema.Types.ObjectId, ref: 'LanguageVariety' }],
  scripts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Script' }],
  availability: { type: String, enum: ['unavailable', 'planned', 'in-development', 'available'], default: 'planned' },
  status: { type: String, enum: ['draft', 'under-review', 'published', 'archived'], default: 'draft', index: true },
  verification: { type: verificationSchema, default: () => ({}) },
  resources: [{ type: String, trim: true, maxlength: 80 }],
  audioAvailable: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true, index: true },
  isPublished: { type: Boolean, default: false, index: true }, // Backward compatibility with Phase 1 documents.
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

languageSchema.index({ name: 'text', nativeName: 'text', nativeNameLatin: 'text', alternativeNames: 'text' });
languageSchema.index({ status: 1, isActive: 1, name: 1 });
languageSchema.index({ code: 1 }, { unique: true, partialFilterExpression: { code: { $type: 'string', $gt: '' } } });
languageSchema.pre('validate', function syncPublication(next) {
  if (this.isModified('status')) this.isPublished = this.status === 'published';
  else if (this.isModified('isPublished') && this.isPublished) this.status = 'published';
  next();
});

export const Language = mongoose.model('Language', languageSchema);
