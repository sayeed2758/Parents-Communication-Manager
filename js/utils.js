export const $=(s,r=document)=>r.querySelector(s);
export const $$=(s,r=document)=>[...r.querySelectorAll(s)];
export function esc(v=""){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]))}
export function uid(prefix="id"){return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`}
export function today(){return new Date().toISOString().slice(0,10)}
export function timeNow(){return new Date().toTimeString().slice(0,5)}
export function formatDate(v){if(!v)return "—";const d=new Date(v+"T00:00:00");return Number.isNaN(d.getTime())?v:d.toLocaleDateString(undefined,{day:"2-digit",month:"short",year:"numeric"})}
export function validPhone(v){const d=String(v||"").replace(/\D/g,"");return d.length>=10&&d.length<=15}
export function digits(v){return String(v||"").replace(/\D/g,"")}
export function normalizePhone(v,country="91"){const d=digits(v);if(!d)return "";return d.length===10?country+d:d}
export function csv(rows){if(!rows?.length)return "";const keys=[...new Set(rows.flatMap(x=>Object.keys(x)))];return [keys.join(","),...rows.map(r=>keys.map(k=>`"${String(r[k]??"").replaceAll('"','""')}"`).join(","))].join("\n")}
export function download(name,data,type="text/plain"){const blob=new Blob([data],{type});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
export function escapeRegExp(v){return String(v).replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}
export function templateFill(text,ctx){return String(text||"").replace(/\{\{\s*(\w+)\s*\}\}/g,(_,k)=>ctx[k]??"")}
export function toast(message,type=""){const root=$("#toastRoot");root.className="toast-stack";const d=document.createElement("div");d.className=`toast ${type}`;d.textContent=message;root.append(d);setTimeout(()=>d.remove(),2600)}
export function confirmDialog(message){return window.confirm(message)}
export function sum(arr,fn){return arr.reduce((a,x)=>a+(Number(fn(x))||0),0)}
export function getClassList(students){return [...new Set(students.map(s=>String(s.className||s.class||"").trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}))}
export function groupCount(arr,key){return arr.reduce((m,x)=>{const k=x[key]||"Unknown";m[k]=(m[k]||0)+1;return m},{});}
