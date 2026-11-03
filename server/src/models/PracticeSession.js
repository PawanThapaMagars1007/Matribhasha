import mongoose from 'mongoose';

const practiceSessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  language: { type: mongoose.Schema.Types.ObjectId, ref: 'Language', required: true },
  script: { type: mongoose.Schema.Types.ObjectId, ref: 'Script', required: true },
  variety: { type: mongoose.Schema.Types.ObjectId, ref: 'LanguageVariety', default: null },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'CharacterCategory', default: null },
  mode: { type: String, enum: ['recognition', 'matching', 'listening'], required: true },
  targetCharacter: { type: mongoose.Schema.Types.ObjectId, ref: 'Character', required: true },
  correctCharacter: { type: mongoose.Schema.Types.ObjectId, ref: 'Character', required: true },
  choices: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Character' }],
  selectedCharacter: { type: mongoose.Schema.Types.ObjectId, ref: 'Character', default: null },
  isCorrect: { type: Boolean, default: null },
  status: { type: String, enum: ['pending', 'answered'], default: 'pending' },
  audioUrl: { type: String, default: '' },
  answeredAt: { type: Date, default: null },
}, { timestamps: true });

practiceSessionSchema.index({ user: 1, status: 1, createdAt: -1 });
export const PracticeSession = mongoose.model('PracticeSession', practiceSessionSchema);
