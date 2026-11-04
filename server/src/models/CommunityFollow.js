import mongoose from 'mongoose';
const schema=new mongoose.Schema({user:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true,index:true},community:{type:mongoose.Schema.Types.ObjectId,ref:'Community',required:true,index:true}},{timestamps:true});schema.index({user:1,community:1},{unique:true});export const CommunityFollow=mongoose.model('CommunityFollow',schema);
