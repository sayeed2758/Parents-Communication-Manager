const KEY="pcm_pro_v2";
const LEGACY_KEY="pcm_pro_v1";
const DEFAULT_STATE={
  meta:{version:2,createdAt:Date.now(),updatedAt:Date.now()},
  students:[],parents:[],communications:[],followups:[],announcements:[],reminders:[],templates:[],
  settings:{theme:"light",pin:"",teacherName:"Teacher",coachingName:"Parent Communication Manager Pro",phoneCountry:"91"},
  integrations:{attendance:{},results:{},fees:{}},
  counters:{student:0,parent:0}
};
const defaultTemplates=[
  ["General Announcement","Dear {{parentName}},\nThis is to inform you regarding {{studentName}} of Class {{class}}.\n\n{{message}}\n\nRegards,\n{{teacherName}}"],
  ["Homework","Dear {{parentName}},\n{{studentName}} has been assigned homework.\n\n{{message}}\n\nRegards,\n{{teacherName}}"],
  ["Exam Reminder","Dear {{parentName}},\nThis is a reminder regarding {{studentName}}'s upcoming examination.\n\n{{message}}\n\nRegards,\n{{teacherName}}"],
  ["Result Update","Dear {{parentName}},\nHere is the result update for {{studentName}}.\nPercentage: {{percentage}}%\nGrade: {{grade}}\n\n{{message}}\n\nRegards,\n{{teacherName}}"],
  ["Fee Reminder","Dear {{parentName}},\nThis is a gentle reminder about the pending fee of ₹{{amount}} for {{studentName}}.\nDue date: {{dueDate}}\n\nRegards,\n{{teacherName}}"],
  ["Attendance Alert","Dear {{parentName}},\n{{studentName}}'s current attendance is {{attendance}}%.\nPlease help ensure regular attendance.\n\nRegards,\n{{teacherName}}"],
  ["Low Attendance Warning","Dear {{parentName}},\n{{studentName}}'s attendance is {{attendance}}%, which is below the preferred level.\nPlease contact us if any support is required.\n\nRegards,\n{{teacherName}}"],
  ["Achievement","Dear {{parentName}},\nCongratulations! {{studentName}} has achieved a wonderful milestone.\n\n{{message}}\n\nRegards,\n{{teacherName}}"],
  ["Birthday","Dear {{parentName}},\nWishing {{studentName}} a very happy birthday! 🎉\nMay the year ahead be filled with joy and success.\n\nRegards,\n{{teacherName}}"],
  ["Parent Meeting","Dear {{parentName}},\nA parent meeting is scheduled regarding {{studentName}}.\nDate: {{date}}\nTime: {{time}}\n\n{{message}}\n\nRegards,\n{{teacherName}}"],
  ["Important Notice","Dear {{parentName}},\nImportant notice regarding {{studentName}}:\n\n{{message}}\n\nRegards,\n{{teacherName}}"],
  ["Custom Message","Dear {{parentName}},\n\n{{message}}\n\nRegards,\n{{teacherName}}"]
];
function freshTemplates(){return defaultTemplates.map((x,i)=>({id:`tpl_default_${i}`,name:x[0],body:x[1],default:true,createdAt:Date.now()}))}
function clone(o){return JSON.parse(JSON.stringify(o))}
function validState(x){return !!x && Array.isArray(x.students)&&Array.isArray(x.parents)&&Array.isArray(x.communications)&&Array.isArray(x.followups)&&Array.isArray(x.templates)}
function normalize(s){
  const out=clone(DEFAULT_STATE);
  if(validState(s)) Object.assign(out,s);
  out.students=Array.isArray(out.students)?out.students:[];out.parents=Array.isArray(out.parents)?out.parents:[];out.communications=Array.isArray(out.communications)?out.communications:[];out.followups=Array.isArray(out.followups)?out.followups:[];out.announcements=Array.isArray(out.announcements)?out.announcements:[];out.reminders=Array.isArray(out.reminders)?out.reminders:[];out.templates=Array.isArray(out.templates)&&out.templates.length?out.templates:freshTemplates();
  out.settings={...DEFAULT_STATE.settings,...(out.settings||{})};out.integrations={...DEFAULT_STATE.integrations,...(out.integrations||{})};out.counters={...DEFAULT_STATE.counters,...(out.counters||{})};out.meta={...DEFAULT_STATE.meta,...(out.meta||{})};out.meta.version=2;out.meta.updatedAt=Date.now();return out;
}
export function loadState(){
  try{const raw=localStorage.getItem(KEY);if(raw)return normalize(JSON.parse(raw));
    const old=localStorage.getItem(LEGACY_KEY);if(old){const parsed=JSON.parse(old);const n=normalize(parsed);n.meta.migratedFrom=LEGACY_KEY;localStorage.setItem(KEY,JSON.stringify(n));return n}
  }catch(e){console.warn("Storage load failed",e)}
  const n=normalize(DEFAULT_STATE);n.templates=freshTemplates();return n;
}
export function saveState(state){state.meta.updatedAt=Date.now();localStorage.setItem(KEY,JSON.stringify(state))}
export function exportBackup(state){return JSON.stringify({app:"Parent Communication Manager Pro",version:2,exportedAt:new Date().toISOString(),data:state},null,2)}
export function parseBackup(text){const obj=JSON.parse(text);const data=obj?.data||obj;if(!validState(data))throw new Error("Invalid backup structure");return normalize(data)}
export function storageKey(){return KEY}
