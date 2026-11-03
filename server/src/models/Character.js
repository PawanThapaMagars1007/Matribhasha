import mongoose from 'mongoose';

const exampleSchema = new mongoose.Schema({
  text: { type: String, required: true, trim: true, maxlength: 200 },
  romanization: { type: String, trim: true, maxlength: 200, default: '' },
  translation: { type: String, trim: true, maxlength: 300, default: '' },
  explanation: { type: String, trim: true, maxlength: 500, default: '' },
  source: { type: String, trim: true, maxlength: 500, default: '' },
  verificationStatus: { type: String, enum: ['unreviewed', 'pending', 'verified', 'needs-review'], default: 'unreviewed' },
}, { _id: false });

const characterSchema = new mongoose.Schema({
  language: { type: mongoose.Schema.Types.ObjectId, ref: 'Language', required: true, index: true },
  variety: { type: mongoose.Schema.Types.ObjectId, ref: 'LanguageVariety', default: null, index: true },
  script: { type: mongoose.Schema.Types.ObjectId, ref: 'Script', required: true, index: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'CharacterCategory', default: null, index: true },
  grapheme: { type: String, required: true, trim: true, maxlength: 32 },
  displayForm: { type: String, trim: true, maxlength: 32, default: '' },
  name: { type: String, trim: true, maxlength: 100, default: '' },
  nativeName: { type: String, trim: true, maxlength: 100, default: '' },
  description: { type: String, trim: true, maxlength: 2000, default: '' },
  contextNotes: { type: String, trim: true, maxlength: 2000, default: '' },
  learningOrder: { type: Number, min: 0, max: 10000, default: 0 },
  transliteration: { type: String, trim: true, maxlength: 100, default: '' },
  romanRepresentation: { type: String, trim: true, maxlength: 100, default: '' },
  examples: { type: [exampleSchema], default: [] },
  relatedCharacters: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Character' }],
  verification: { status: { type: String, enum: ['unreviewed', 'pending', 'verified', 'needs-review'], default: 'unreviewed' }, source: { type: String, trim: true, maxlength: 1000, default: '' }, reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, reviewedAt: { type: Date, default: null } },
  status: { type: String, enum: ['draft', 'under-review', 'published', 'archived'], default: 'draft', index: true },
  isActive: { type: Boolean, default: true, index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

characterSchema.index({ language: 1, script: 1, variety: 1, category: 1, learningOrder: 1 });
characterSchema.index({ grapheme: 1, language: 1, script: 1, variety: 1 }, { unique: true });
export const Character = mongoose.model('Character', characterSchema);
