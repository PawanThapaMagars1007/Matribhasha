import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDatabase } from '../config/db.js';
import { Language } from '../models/Language.js';
import { developmentLanguages } from './languages.js';

if (!process.env.MONGODB_URI) throw new Error('Set MONGODB_URI before running the development seed.');
await connectDatabase();
for (const data of developmentLanguages) await Language.updateOne({ name: data.name }, { $setOnInsert: data }, { upsert: true });
console.log(`Development seed ready (${developmentLanguages.length} draft language records).`);
await mongoose.disconnect();
