import mongoose from 'mongoose';

const userSavedWordSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  vocabulary: { type: mongoose.Schema.Types.ObjectId, ref: 'Vocabulary', required: true, index: true },
  language: { type: mongoose.Schema.Types.ObjectId, ref: 'Language', required: true },
  variety: { type: mongoose.Schema.Types.ObjectId, ref: 'LanguageVariety', default: null },
  listName: { type: String, trim: true, maxlength: 80, default: 'My words' },
  personalNote: { type: String, trim: true, maxlength: 1000, default: '' },
  needsRevision: { type: Boolean, default: false, index: true },
  lastStudiedAt: { type: Date, default: null },
}, { timestamps: true });

userSavedWordSchema.index({ user: 1, vocabulary: 1 }, { unique: true });
userSavedWordSchema.index({ user: 1, language: 1, listName: 1, updatedAt: -1 });
export const UserSavedWord = mongoose.model('UserSavedWord', userSavedWordSchema);
