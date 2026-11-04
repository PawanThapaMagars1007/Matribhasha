import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
  username: { type: String, trim: true, lowercase: true, unique: true, sparse: true, minlength: 3, maxlength: 30 },
  email: { type: String, required: true, trim: true, lowercase: true, unique: true, maxlength: 254 },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ['learner', 'contributor', 'reviewer', 'languageExpert', 'languageAdmin', 'superAdmin', 'moderator', 'culturalReviewer', 'communityAdmin', 'researcher'], default: 'learner' },
  profilePicture: { type: String, default: '' },
  preferences: {
    interfaceLanguage: { type: String, default: 'en' },
    nativeLanguages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Language' }],
    knownLanguages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Language' }],
    learningLanguages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Language' }],
    preferredVarieties: [{ language: { type: mongoose.Schema.Types.ObjectId, ref: 'Language', required: true }, variety: { type: mongoose.Schema.Types.ObjectId, ref: 'LanguageVariety', required: true } }],
    proficiencyLevel: { type: String, enum: ['beginner', 'elementary', 'intermediate', 'advanced'], default: 'beginner' },
    learningPreferences: [{ type: String, enum: ['reading', 'listening', 'speaking', 'writing', 'games'] }],
    dailyGoalMinutes: { type: Number, min: 5, max: 180, default: 10 },
  },
  emailVerifiedAt: { type: Date, default: null },
  passwordResetTokenHash: { type: String, select: false },
  passwordResetExpiresAt: { type: Date, select: false },
  disabledAt: { type: Date, default: null },
}, { timestamps: true, toJSON: { transform(_doc, ret) { delete ret.passwordHash; delete ret.__v; return ret; } } });

export const User = mongoose.model('User', userSchema);
