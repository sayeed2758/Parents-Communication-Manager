import {uid} from './utils.js';
const CANDIDATES={students:["ezee_students","students","studentData","ezeeStudents"],attendance:["ezee_attendance","attendanceData","attendance","attendance_records"],results:["ezee_results","resultData","results","result_records"],fees:["ezee_fees","feeData","fees","fee_records"]};
function readAny(keys){for(const k of keys){try{const r=localStorage.getItem(k);if(!r)continue;const v=JSON.parse(r);return {key:k,value:v}}catch{}}return null}
function arr(v){if(Array.isArray(v))return v;if(v&&Array.isArray(v.data))return v.data;if(v&&Array.isArray(v.records))return v.records;return []}
export function detectIntegrations(){return Object.fromEntries(Object.entries(CANDIDATES).map(([type,keys])=>{const hit=readAny(keys);return [type,{detected:!!hit,key:hit?.key||"",count:hit?arr(hit.value).length:0}]}))}
export function importExternalStudents(state){const hit=readAny(CANDIDATES.students);if(!hit)return {count:0,key:""};const rows=arr(hit.value);let added=0;for(const r of rows){const name=String(r.name||r.studentName||r.student||r.fullName||"").trim();if(!name)continue;const cls=String(r.className||r.class||r.standard||"").trim();const roll=String(r.rollNo||r.rollNumber||r.admissionNo||r.studentId||"").trim();const existing=state.students.find(s=>(roll&&s.studentId===roll)||s.name.toLowerCase()===name.toLowerCase());if(existing){existing.className=existing.className||cls;continue}state.students.push({id:uid("stu"),studentId:roll||`STU-${String(state.students.length+1).padStart(4,"0")}`,name,className:cls,parentId:"",attendance:Number(r.attendance||r.attendancePercentage||0)||0,percentage:Number(r.percentage||r.percent||0)||0,grade:String(r.grade||"") ,pendingFee:Number(r.pendingFee||r.due||r.feeDue||0)||0});added++}return {count:added,key:hit.key}}
export function importExternalMetrics(state){
 const a=readAny(CANDIDATES.attendance),r=readAny(CANDIDATES.results),f=readAny(CANDIDATES.fees);let updated={attendance:0,results:0,fees:0};
 const findStudent=(row)=>{const sid=String(row.studentId||row.id||row.admissionNo||"");const name=String(row.studentName||row.name||row.student||"").trim().toLowerCase();return state.students.find(s=>(sid&&String(s.studentId)===sid)||(name&&s.name.toLowerCase()===name))}
 for(const x of arr(a?.value)){const s=findStudent(x);if(s){s.attendance=Number(x.attendance||x.attendancePercentage||x.percentage||0)||0;updated.attendance++}}
 for(const x of arr(r?.value)){const s=findStudent(x);if(s){s.percentage=Number(x.percentage||x.percent||x.overallPercentage||0)||0;s.grade=String(x.grade||s.grade||"");updated.results++}}
 for(const x of arr(f?.value)){const s=findStudent(x);if(s){s.pendingFee=Number(x.pendingFee||x.due||x.balance||x.amountDue||0)||0;s.dueDate=x.dueDate||x.date||s.dueDate||"";updated.fees++}}
 return {updated,keys:{attendance:a?.key||"",results:r?.key||"",fees:f?.key||""}}
}
export const integrationKeys=CANDIDATES;
