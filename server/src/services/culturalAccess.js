import mongoose from 'mongoose';
import {CommunityMembership} from '../models/CommunityMembership.js';
import {ContentPermission} from '../models/ContentPermission.js';
import {ContentAccessLog} from '../models/ContentAccessLog.js';
import {ConsentRecord} from '../models/ConsentRecord.js';

const platformResearchRoles=['superAdmin','reviewer','languageAdmin','languageExpert','culturalReviewer','researcher'];
export async function canAccessCulturalContent(user,contentType,doc,{log=false,action='view'}={}){
  if(!doc||doc.status!=='published'||doc.accessLevel==='not-publishable')return false;
  if(!await publicationCleared(contentType,doc))return false;
  let allowed=false;
  switch(doc.accessLevel){
    case 'public': allowed=true;break;
    case 'registered': allowed=Boolean(user);break;
    case 'community': allowed=Boolean(user&&doc.community&&await CommunityMembership.exists({user:user._id,community:doc.community,status:'approved'}));break;
    case 'researcher': allowed=Boolean(user&&(platformResearchRoles.includes(user.role)||(doc.community&&await CommunityMembership.exists({user:user._id,community:doc.community,status:'approved',role:'researcher'}))||await ContentPermission.exists({contentType,content:doc._id,user:user._id,permission:{$in:['research','view']},status:'active',$or:[{expiresAt:null},{expiresAt:{$gt:new Date()}}]})));break;
    case 'restricted': allowed=Boolean(user&&await ContentPermission.exists({contentType,content:doc._id,user:user._id,status:'active',permission:{$in:[action,'view']},$or:[{expiresAt:null},{expiresAt:{$gt:new Date()}}]}));if(!allowed&&user&&doc.community)allowed=Boolean(await ContentPermission.exists({contentType,content:doc._id,community:doc.community,status:'active',permission:{$in:[action,'view']},$or:[{expiresAt:null},{expiresAt:{$gt:new Date()}}]}));break;
    default: allowed=false;
  }
  if(allowed&&log&&doc.accessLevel!=='public')await ContentAccessLog.create({contentType,content:doc._id,user:user?._id||null,action});
  return allowed;
}
export async function publicationCleared(type,doc){
  const v=doc.verification||{};if(v.cultural!=='verified'||v.permission!=='verified'||v.source!=='verified')return false;
  if((type==='story'&&doc.originalText)||(type==='cultural-entry'&&doc.language&&doc.description)&&v.linguistic!=='verified')return false;
  if(doc.consentRequired!==false){const consent=await ConsentRecord.exists({contentType:type==='cultural-media'?'media':type,content:doc._id,scope:'publication',status:'active',$or:[{expiresAt:null},{expiresAt:{$gt:new Date()}}]});if(!consent)return false;}
  if(type==='cultural-media'&&doc.mediaType==='audio'){const consent=await ConsentRecord.exists({contentType:'media',content:doc._id,scope:'recording',status:'active',$or:[{expiresAt:null},{expiresAt:{$gt:new Date()}}]});if(!consent)return false;}
  return true;
}
export function canModerate(user,communityId){if(!user)return false;if(user.role==='superAdmin')return true;if(!communityId)return ['moderator','reviewer','languageAdmin'].includes(user.role);return CommunityMembership.exists({user:user._id,community:communityId,status:'approved',role:{$in:['communityAdmin','culturalReviewer','moderator']}});}
export function validateObjectId(id){return mongoose.isValidObjectId(id);}
export async function filterAccessible(user,type,docs,options={}){const rows=[];for(const doc of docs)if(await canAccessCulturalContent(user,type,doc,options))rows.push(doc);return rows;}
