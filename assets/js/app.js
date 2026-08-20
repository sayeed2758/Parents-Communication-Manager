/* Parent Communication Manager Pro
   Standalone, local-first teacher utility.
   Data is stored in localStorage and can be exported/imported as JSON.
*/
const KEY="pcm_pro_v1";
const defaults={
  settings:{teacherName:"Teacher",coachingName:"EZEE VISION CHAMPUA",theme:"light",pinEnabled:false,pin:""},
  students:[],
  templates:[],
  messages:[],
  followups:[],
  announcements:[],
  scheduled:[]
};
const state={...structuredClone(defaults),view:"dashboard",editingId:null};

const uid=()=>crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const today=()=>new Date().toISOString().slice(0,10);
function save(){localStorage.setItem(KEY,JSON.stringify({...state,view:undefined,editingId:undefined}));}
function load(){
  try{const d=JSON.parse(localStorage.getItem(KEY)||"null"); if(d){Object.keys(defaults).forEach(k=>state[k]=Array.isArray(defaults[k])?(Array.isArray(d[k])?d[k]:[]):{...defaults[k],...(d[k]||{})})}}
  catch(e){console.warn(e)}
  if(!state.templates.length) state.templates=seedTemplates();
}
function seedTemplates(){return [
 {id:uid(),name:"Fee Reminder",type:"Fee Reminder",text:"Dear {{parent_name}},\n\nThis is a gentle reminder regarding the pending fee of {{student_name}} for {{month}}.\nAmount: ₹{{amount}}\n\nThank you.\n{{coaching_name}}"},
 {id:uid(),name:"Attendance Alert",type:"Attendance Alert",text:"Dear {{parent_name}},\n\n{{student_name}}'s current attendance is {{attendance}}%. Please ensure regular attendance.\n\nRegards,\n{{teacher_name}}"},
 {id:uid(),name:"Exam Reminder",type:"Exam Reminder",text:"Dear {{parent_name}},\n\nThis is a reminder that {{student_name}} has an upcoming exam on {{date}}.\nPlease ensure the student is prepared and present.\n\nRegards,\n{{teacher_name}}"},
 {id:uid(),name:"Parent Meeting",type:"Parent Meeting",text:"Dear {{parent_name}},\n\nWe would like to discuss {{student_name}}'s progress. Please contact the coaching centre for a convenient meeting time.\n\nRegards,\n{{teacher_name}}"},
 {id:uid(),name:"General Notice",type:"General Announcement",text:"Dear Parents,\n\n{{message}}\n\nThank you.\n{{coaching_name}}"}
]}

const viewNames={dashboard:["Teacher Productivity","Dashboard"],students:["Directory","Students & Parents"],compose:["Communication","New Message"],templates:["Automation","Templates"],announcements:["Broadcast","Announcements"],followups:["Productivity","Follow-ups"],history:["Records","Communication History"],analytics:["Insights","Analytics"],backup:["Data & Reports","Backup & Reports"],settings:["System","Settings"]};

function navigate(view){state.view=view;document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.view===view));Object.keys(viewNames).forEach(v=>document.getElementById("view-"+v)?.classList.toggle("active",v===view));document.getElementById("pageEyebrow").textContent=viewNames[view][0];document.getElementById("pageTitle").textContent=viewNames[view][1];render();document.getElementById("sidebar").classList.remove("open")}
function toast(msg,type=""){const el=document.createElement("div");el.className="toast "+type;el.textContent=msg;document.getElementById("toastRoot").appendChild(el);setTimeout(()=>el.remove(),2600)}
function modal(title,body,footer=""){document.getElementById("modalRoot").innerHTML=`<div class="modal-backdrop" id="modalBackdrop"><div class="modal"><div class="modal-head"><h2>${title}</h2><button class="icon-btn" data-close>×</button></div>${body}${footer}</div></div>`}
function closeModal(){document.getElementById("modalRoot").innerHTML=""}
function studentById(id){return state.students.find(s=>s.id===id)}
function vars(text,student={},extra={}){const p={student_name:student.name,parent_name:student.parent||"",class:student.className||"",roll:student.roll||"",phone:student.phone||"",attendance:student.attendance??"—",amount:student.feeDue??"0",month:new Date().toLocaleString("en-IN",{month:"long",year:"numeric"}),date:extra.date||today(),teacher_name:state.settings.teacherName,coaching_name:state.settings.coachingName,message:extra.message||"",type:extra.type||""};return text.replace(/\{\{(\w+)\}\}/g,(_,k)=>p[k]??"")}
function whatsapp(student,text){const phone=(student.phone||"").replace(/\D/g,"");if(!phone){toast("Parent phone number is missing","bad");return}const intl=phone.length===10?"91"+phone:phone;window.open(`https://wa.me/${intl}?text=${encodeURIComponent(text)}`,"_blank","noopener");}
function logMessage(student,text,type){state.messages.unshift({id:uid(),studentId:student.id,studentName:student.name,parent:student.parent||"",type,message:text,date:new Date().toISOString(),status:"Prepared"});save()}

function render(){
  document.getElementById("view-dashboard").innerHTML=dashboard();
  document.getElementById("view-students").innerHTML=studentsView();
  document.getElementById("view-compose").innerHTML=composeView();
  document.getElementById("view-templates").innerHTML=templatesView();
  document.getElementById("view-announcements").innerHTML=announcementsView();
  document.getElementById("view-followups").innerHTML=followupsView();
  document.getElementById("view-history").innerHTML=historyView();
  document.getElementById("view-analytics").innerHTML=analyticsView();
  document.getElementById("view-backup").innerHTML=backupView();
  document.getElementById("view-settings").innerHTML=settingsView();
}

function dashboard(){
 const due=state.students.filter(s=>Number(s.feeDue)>0).length;
 const low=state.students.filter(s=>s.attendance!==""&&Number(s.attendance)<75).length;
 const pending=state.followups.filter(f=>!f.done).length;
 const recent=state.messages.slice(0,6);
 return `<div class="grid stats">
  <div class="stat"><div class="label">TOTAL STUDENTS</div><div class="value">${state.students.length}</div><div class="sub">${state.students.filter(s=>s.phone).length} with parent contact</div></div>
  <div class="stat"><div class="label">COMMUNICATIONS</div><div class="value">${state.messages.length}</div><div class="sub">All saved message records</div></div>
  <div class="stat"><div class="label">LOW ATTENDANCE</div><div class="value">${low}</div><div class="sub">Below 75%</div></div>
  <div class="stat"><div class="label">FOLLOW-UPS</div><div class="value">${pending}</div><div class="sub">${due} students with fee due</div></div>
 </div>
 <div class="grid quick-grid" style="margin-bottom:18px">
  ${[
   ["💬","New Message","compose"],["👨‍🎓","Add Student","students"],["📢","Announcement","announcements"],["🔔","Follow-ups","followups"]
  ].map(x=>`<button class="quick" data-go="${x[2]}"><span style="font-size:24px">${x[0]}</span><b>${x[1]}</b><small class="muted">Open workspace →</small></button>`).join("")}
 </div>
 <div class="grid two">
  <div class="card"><div class="card-head"><span class="card-title">Recent Communications</span><button class="btn btn-secondary" data-go="history">View all</button></div>
   ${recent.length?`<div class="table-wrap"><table class="table"><thead><tr><th>Student</th><th>Type</th><th>Date</th><th>Status</th></tr></thead><tbody>${recent.map(m=>`<tr><td>${esc(m.studentName)}</td><td>${esc(m.type)}</td><td>${new Date(m.date).toLocaleString()}</td><td><span class="pill good">${esc(m.status)}</span></td></tr>`).join("")}</tbody></table></div>`:`<div class="empty">No communication recorded yet.<br><button class="btn btn-primary" data-go="compose" style="margin-top:10px">Create first message</button></div>`}
  </div>
  <div class="card"><div class="card-head"><span class="card-title">Attention Needed</span></div>
   ${low?`<div class="notice danger-note">⚠ ${low} student(s) have attendance below 75%.</div>`:"<div class=\"notice\">✓ No low-attendance alerts right now.</div>"}
   <div style="height:10px"></div>
   ${pending?`<div class="notice">🔔 ${pending} follow-up(s) are pending.</div>`:"<div class=\"notice\">✓ No pending follow-ups.</div>"}
  </div>
 </div>`;
}

function studentsView(){
 return `<div class="card">
  <div class="toolbar"><div><b>Student & Parent Directory</b><div class="small muted">Store contacts, attendance and fee context locally.</div></div><div class="actions"><input id="studentSearch" class="field input search" placeholder="Search student, parent or phone"><button class="btn btn-primary" data-action="add-student">+ Add Student</button></div></div>
  <div class="table-wrap"><table class="table"><thead><tr><th>Student</th><th>Class</th><th>Parent</th><th>Phone</th><th>Attendance</th><th>Fee Due</th><th>Actions</th></tr></thead><tbody id="studentRows">${studentRows()}</tbody></table></div>
 </div>`;
}
function studentRows(filter=""){const q=filter.toLowerCase();const arr=state.students.filter(s=>`${s.name} ${s.parent} ${s.phone} ${s.className}`.toLowerCase().includes(q));return arr.length?arr.map(s=>`<tr><td><b>${esc(s.name)}</b><div class="small muted">Roll ${esc(s.roll)}</div></td><td>${esc(s.className)}</td><td>${esc(s.parent)}</td><td>${esc(s.phone)}</td><td><span class="pill ${Number(s.attendance)<75?"bad":"good"}">${s.attendance===""?"—":esc(s.attendance)+"%"}</span></td><td>₹${Number(s.feeDue||0).toLocaleString("en-IN")}</td><td><div class="actions"><button class="btn btn-secondary btn-sm" data-edit-student="${s.id}">Edit</button><button class="btn btn-primary btn-sm" data-message-student="${s.id}">Message</button><button class="btn btn-danger btn-sm" data-delete-student="${s.id}">Delete</button></div></td></tr>`).join(""):`<tr><td colspan="7"><div class="empty">No students found.</div></td></tr>`}

function studentForm(s={}){
 return `<div class="form-grid">
  <div class="field"><label>Student Name *</label><input id="f_name" value="${esc(s.name)}"></div>
  <div class="field"><label>Roll Number</label><input id="f_roll" value="${esc(s.roll)}"></div>
  <div class="field"><label>Class / Section</label><input id="f_class" value="${esc(s.className)}" placeholder="Class 8 A"></div>
  <div class="field"><label>Parent / Guardian Name *</label><input id="f_parent" value="${esc(s.parent)}"></div>
  <div class="field"><label>Primary WhatsApp / Phone</label><input id="f_phone" inputmode="tel" value="${esc(s.phone)}"></div>
  <div class="field"><label>Email</label><input id="f_email" type="email" value="${esc(s.email)}"></div>
  <div class="field"><label>Attendance %</label><input id="f_att" type="number" min="0" max="100" value="${esc(s.attendance)}"></div>
  <div class="field"><label>Fee Due ₹</label><input id="f_fee" type="number" min="0" value="${esc(s.feeDue||0)}"></div>
  <div class="field full"><label>Address</label><input id="f_address" value="${esc(s.address)}"></div>
  <div class="field full"><label>Notes</label><textarea id="f_notes">${esc(s.notes)}</textarea></div>
 </div>`;
}
function openStudent(id=""){const s=id?studentById(id):{};modal(id?"Edit Student":"Add Student",studentForm(s),`<div class="actions" style="justify-content:flex-end;margin-top:18px"><button class="btn btn-secondary" data-close>Cancel</button><button class="btn btn-primary" data-save-student="${id}">Save Student</button></div>`)}
function collectStudent(id){const old=id?studentById(id):null;return {id:id||uid(),name:document.getElementById("f_name").value.trim(),roll:document.getElementById("f_roll").value.trim(),className:document.getElementById("f_class").value.trim(),parent:document.getElementById("f_parent").value.trim(),phone:document.getElementById("f_phone").value.trim(),email:document.getElementById("f_email").value.trim(),attendance:document.getElementById("f_att").value,feeDue:document.getElementById("f_fee").value,address:document.getElementById("f_address").value.trim(),notes:document.getElementById("f_notes").value.trim(),createdAt:old?.createdAt||new Date().toISOString()}}
function saveStudent(id){const s=collectStudent(id);if(!s.name||!s.parent){toast("Student and parent name are required","bad");return}const i=state.students.findIndex(x=>x.id===s.id);if(i>=0)state.students[i]=s;else state.students.push(s);save();closeModal();render();toast("Student saved","good")}

function composeView(){
 const selected=state.students[0]?.id||"";
 return `<div class="grid two"><div class="card"><div class="card-head"><span class="card-title">Create Communication</span><span class="pill">Local-first</span></div>
 <div class="form-grid">
  <div class="field"><label>Student / Parent</label><select id="composeStudent">${state.students.length?state.students.map(s=>`<option value="${s.id}">${esc(s.name)} — ${esc(s.parent)}</option>`).join(""):`<option value="">Add a student first</option>`}</select></div>
  <div class="field"><label>Message Type</label><select id="composeType">${["General Announcement","Homework","Exam Reminder","Result Update","Fee Reminder","Attendance Alert","Low Attendance Warning","Achievement","Birthday","Parent Meeting","Important Notice","Custom"].map(t=>`<option>${t}</option>`).join("")}</select></div>
  <div class="field"><label>Template</label><select id="composeTemplate"><option value="">— Start from scratch —</option>${state.templates.map(t=>`<option value="${t.id}">${esc(t.name)}</option>`).join("")}</select></div>
  <div class="field"><label>Optional amount / value</label><input id="composeAmount" type="number" placeholder="e.g. 1500"></div>
  <div class="field full"><label>Message</label><textarea id="composeText" placeholder="Write your message or choose a template..."></textarea></div>
  <div class="field full"><label>Preview</label><div class="message-preview" id="composePreview">Your rendered message will appear here.</div></div>
 </div>
 <div class="actions" style="margin-top:14px"><button class="btn btn-primary" data-action="generate-message">Generate Preview</button><button class="btn btn-secondary" data-action="copy-compose">Copy</button><button class="btn btn-success" data-action="whatsapp-compose">Open WhatsApp</button><button class="btn btn-secondary" data-action="save-compose">Save History</button></div>
 </div>
 <div class="card"><div class="card-head"><span class="card-title">Smart Suggestions</span></div>
  <div class="notice">Use variables like <b>{{student_name}}</b>, <b>{{parent_name}}</b>, <b>{{attendance}}</b>, <b>{{amount}}</b> in templates.</div>
  <div style="height:12px"></div>
  <div class="kpi"><span>Students</span><b>${state.students.length}</b></div>
  <div class="kpi"><span>Templates</span><b>${state.templates.length}</b></div>
  <div class="kpi"><span>Messages</span><b>${state.messages.length}</b></div>
 </div></div>`;
}

function templatesView(){return `<div class="card"><div class="toolbar"><div><b>Smart Templates</b><div class="small muted">Reusable messages with dynamic variables.</div></div><button class="btn btn-primary" data-action="add-template">+ New Template</button></div><div class="grid three">${state.templates.map(t=>`<div class="template-card"><h3>${esc(t.name)}</h3><span class="pill">${esc(t.type)}</span><p>${esc(t.text)}</p><div class="actions"><button class="btn btn-secondary" data-edit-template="${t.id}">Edit</button><button class="btn btn-danger" data-delete-template="${t.id}">Delete</button></div></div>`).join("")}</div></div>`}

function templateForm(t={}){return `<div class="form-grid"><div class="field"><label>Template Name</label><input id="t_name" value="${esc(t.name)}"></div><div class="field"><label>Type</label><select id="t_type">${["General Announcement","Homework","Exam Reminder","Result Update","Fee Reminder","Attendance Alert","Low Attendance Warning","Achievement","Birthday","Parent Meeting","Important Notice","Custom"].map(x=>`<option ${t.type===x?"selected":""}>${x}</option>`).join("")}</select></div><div class="field full"><label>Template Text</label><textarea id="t_text">${esc(t.text)}</textarea></div></div><div class="notice" style="margin-top:12px">Variables: {{student_name}} {{parent_name}} {{class}} {{roll}} {{attendance}} {{amount}} {{month}} {{date}} {{teacher_name}} {{coaching_name}} {{message}}</div>`}
function openTemplate(id=""){const t=id?state.templates.find(x=>x.id===id):{};modal(id?"Edit Template":"New Template",templateForm(t),`<div class="actions" style="justify-content:flex-end;margin-top:18px"><button class="btn btn-secondary" data-close>Cancel</button><button class="btn btn-primary" data-save-template="${id}">Save Template</button></div>`)}
function saveTemplate(id){const t={id:id||uid(),name:document.getElementById("t_name").value.trim(),type:document.getElementById("t_type").value,text:document.getElementById("t_text").value};if(!t.name||!t.text){toast("Name and text are required","bad");return}const i=state.templates.findIndex(x=>x.id===t.id);if(i>=0)state.templates[i]=t;else state.templates.push(t);save();closeModal();render();toast("Template saved","good")}

function announcementsView(){return `<div class="grid two"><div class="card"><div class="card-head"><span class="card-title">Broadcast Announcement</span></div><div class="form-grid"><div class="field"><label>Audience</label><select id="annAudience"><option value="all">All Students</option>${[...new Set(state.students.map(s=>s.className).filter(Boolean))].map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join("")}</select></div><div class="field"><label>Title</label><input id="annTitle" placeholder="Important Notice"></div><div class="field full"><label>Announcement</label><textarea id="annText" placeholder="Write announcement..."></textarea></div></div><div class="actions" style="margin-top:14px"><button class="btn btn-primary" data-action="prepare-announcement">Prepare Messages</button><button class="btn btn-secondary" data-action="save-announcement">Save Announcement</button></div></div><div class="card"><div class="card-head"><span class="card-title">Recent Announcements</span></div>${state.announcements.length?state.announcements.slice(0,8).map(a=>`<div class="kpi"><span><b>${esc(a.title)}</b><small class="muted" style="display:block">${esc(a.audience)} · ${new Date(a.date).toLocaleDateString()}</small></span><span class="pill">${a.count} recipients</span></div>`).join(""):`<div class="empty">No announcements yet.</div>`}</div></div>`}

function followupsView(){const pending=state.followups.filter(f=>!f.done);return `<div class="card"><div class="toolbar"><div><b>Follow-up Manager</b><div class="small muted">Keep conversations from getting forgotten.</div></div><button class="btn btn-primary" data-action="add-followup">+ Add Follow-up</button></div>${state.followups.length?`<div class="table-wrap"><table class="table"><thead><tr><th>Student</th><th>Task</th><th>Due</th><th>Status</th><th>Actions</th></tr></thead><tbody>${state.followups.sort((a,b)=>a.due.localeCompare(b.due)).map(f=>`<tr><td>${esc(f.studentName)}</td><td>${esc(f.note)}</td><td>${esc(f.due)}</td><td><span class="pill ${f.done?"good":"warn"}">${f.done?"Completed":"Pending"}</span></td><td><div class="actions">${!f.done?`<button class="btn btn-success" data-complete-followup="${f.id}">Complete</button>`:""}<button class="btn btn-danger" data-delete-followup="${f.id}">Delete</button></div></td></tr>`).join("")}</tbody></table></div>`:`<div class="empty">No follow-ups. Add one after an important parent conversation.</div>`}</div>`}

function historyView(){return `<div class="card"><div class="toolbar"><div><b>Communication History</b><div class="small muted">${state.messages.length} saved records</div></div><div class="actions"><input id="historySearch" class="search" placeholder="Search history"><button class="btn btn-secondary" data-action="print-history">Print</button></div></div><div class="table-wrap"><table class="table"><thead><tr><th>Student</th><th>Parent</th><th>Type</th><th>Message</th><th>Date</th><th>Actions</th></tr></thead><tbody id="historyRows">${historyRows()}</tbody></table></div></div>`}
function historyRows(q=""){const arr=state.messages.filter(m=>`${m.studentName} ${m.parent} ${m.type} ${m.message}`.toLowerCase().includes(q.toLowerCase()));return arr.length?arr.map(m=>`<tr><td>${esc(m.studentName)}</td><td>${esc(m.parent)}</td><td><span class="pill">${esc(m.type)}</span></td><td style="max-width:300px;white-space:normal">${esc(m.message.slice(0,120))}${m.message.length>120?"…":""}</td><td>${new Date(m.date).toLocaleString()}</td><td><button class="btn btn-danger" data-delete-message="${m.id}">Delete</button></td></tr>`).join(""):`<tr><td colspan="6"><div class="empty">No matching records.</div></td></tr>`}

function analyticsView(){const types={};state.messages.forEach(m=>types[m.type]=(types[m.type]||0)+1);const max=Math.max(1,...Object.values(types));const low=state.students.filter(s=>s.attendance!==""&&Number(s.attendance)<75).length;return `<div class="grid stats"><div class="stat"><div class="label">TOTAL MESSAGES</div><div class="value">${state.messages.length}</div><div class="sub">All time</div></div><div class="stat"><div class="label">TEMPLATES</div><div class="value">${state.templates.length}</div><div class="sub">Reusable</div></div><div class="stat"><div class="label">LOW ATTENDANCE</div><div class="value">${low}</div><div class="sub">Below 75%</div></div><div class="stat"><div class="label">FOLLOW-UP RATE</div><div class="value">${state.followups.length?Math.round(state.followups.filter(f=>f.done).length/state.followups.length*100):0}%</div><div class="sub">Completed</div></div></div><div class="grid two"><div class="card"><div class="card-head"><span class="card-title">Messages by Type</span></div><div class="chart">${Object.entries(types).length?Object.entries(types).slice(0,10).map(([k,v])=>`<div class="chart-col"><span class="chart-num">${v}</span><div class="chart-bar" style="height:${Math.max(6,v/max*170)}px"></div><span class="chart-label">${esc(k.slice(0,10))}</span></div>`).join(""):`<div class="empty" style="width:100%">Send messages to build analytics.</div>`}</div></div><div class="card"><div class="card-head"><span class="card-title">System Overview</span></div><div class="kpi"><span>Students</span><b>${state.students.length}</b></div><div class="kpi"><span>Parent contacts</span><b>${state.students.filter(s=>s.phone).length}</b></div><div class="kpi"><span>Fee due records</span><b>${state.students.filter(s=>Number(s.feeDue)>0).length}</b></div><div class="kpi"><span>Follow-ups</span><b>${state.followups.length}</b></div></div></div>`}

function backupView(){return `<div class="grid two"><div class="card"><div class="card-head"><span class="card-title">Backup & Restore</span></div><div class="notice">Export regularly. This app is local-first and your browser storage can be cleared by the device/browser.</div><div class="actions" style="margin-top:15px"><button class="btn btn-primary" data-action="export-json">Export JSON Backup</button><label class="btn btn-secondary">Import JSON<input id="importJson" type="file" accept=".json,application/json" hidden></label><button class="btn btn-secondary" data-action="export-csv">Export Students CSV</button></div></div><div class="card"><div class="card-head"><span class="card-title">Printable Reports</span></div><div class="actions"><button class="btn btn-primary" data-action="print-directory">Print Parent Directory</button><button class="btn btn-secondary" data-action="print-history">Print Communication History</button></div></div></div>`}

function settingsView(){return `<div class="grid two"><div class="card"><div class="card-head"><span class="card-title">Profile & Appearance</span></div><div class="form-grid"><div class="field"><label>Teacher Name</label><input id="setTeacher" value="${esc(state.settings.teacherName)}"></div><div class="field"><label>Coaching Name</label><input id="setCoaching" value="${esc(state.settings.coachingName)}"></div></div><div class="switch"><span>Dark theme</span><button class="btn btn-secondary" data-action="toggle-theme">${document.body.classList.contains("dark")?"Enabled":"Disabled"}</button></div><button class="btn btn-primary" data-action="save-settings" style="margin-top:15px">Save Settings</button></div><div class="card"><div class="card-head"><span class="card-title">Danger Zone</span></div><div class="notice danger-note">Clearing data cannot be undone unless you have a backup.</div><button class="btn btn-danger" data-action="clear-data" style="margin-top:14px">Clear All Application Data</button></div></div>`}

function csv(){const headers=["Student Name","Roll","Class","Parent","Phone","Email","Attendance","Fee Due","Address","Notes"];const rows=state.students.map(s=>[s.name,s.roll,s.className,s.parent,s.phone,s.email,s.attendance,s.feeDue,s.address,s.notes]);return [headers,...rows].map(r=>r.map(x=>`"${String(x??"").replaceAll('"','""')}"`).join(",")).join("\n")}
function download(name,content,type){const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([content],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)}
function printTable(title,headers,rows){const w=window.open("","_blank");if(!w){toast("Popup blocked by browser","bad");return}w.document.write(`<html><head><title>${esc(title)}</title><style>body{font-family:Arial;padding:30px;color:#111}h1{font-size:22px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px;text-align:left;font-size:12px}th{background:#f3f4f6}@media print{button{display:none}}</style></head><body><h1>${esc(title)}</h1><p>${esc(state.settings.coachingName)} · ${new Date().toLocaleString()}</p><table><thead><tr>${headers.map(h=>`<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table><script>window.onload=()=>window.print()<\/script></body></html>`);w.document.close()}
function printDirectory(){printTable("Parent Directory",["Student","Class","Parent","Phone","Attendance","Fee Due"],state.students.map(s=>[s.name,s.className,s.parent,s.phone,s.attendance+"%",`₹${s.feeDue||0}`]))}
function printHistory(){printTable("Communication History",["Student","Parent","Type","Date","Message"],state.messages.map(m=>[m.studentName,m.parent,m.type,new Date(m.date).toLocaleString(),m.message]))}

function addFollowup(){modal("Add Follow-up",`<div class="form-grid"><div class="field"><label>Student</label><select id="fu_student">${state.students.map(s=>`<option value="${s.id}">${esc(s.name)}</option>`).join("")}</select></div><div class="field"><label>Due Date</label><input id="fu_due" type="date" value="${today()}"></div><div class="field full"><label>Follow-up Note</label><textarea id="fu_note" placeholder="What needs to be followed up?"></textarea></div></div>`,`<div class="actions" style="justify-content:flex-end;margin-top:18px"><button class="btn btn-secondary" data-close>Cancel</button><button class="btn btn-primary" data-save-followup>Save</button></div>`)}
function saveFollowup(){const s=studentById(document.getElementById("fu_student").value);if(!s){toast("Add a student first","bad");return}const f={id:uid(),studentId:s.id,studentName:s.name,due:document.getElementById("fu_due").value,note:document.getElementById("fu_note").value.trim(),done:false};if(!f.note){toast("Enter a follow-up note","bad");return}state.followups.push(f);save();closeModal();render();toast("Follow-up added","good")}

function bind(){
 document.querySelectorAll("[data-go]").forEach(b=>b.onclick=()=>navigate(b.dataset.go));
 document.querySelectorAll("[data-close]").forEach(b=>b.onclick=closeModal);
 document.querySelectorAll("[data-action]").forEach(b=>b.onclick=()=>actions(b.dataset.action));
 document.querySelectorAll("[data-edit-student]").forEach(b=>b.onclick=()=>openStudent(b.dataset.editStudent));
 document.querySelectorAll("[data-message-student]").forEach(b=>b.onclick=()=>{navigate("compose");setTimeout(()=>{const el=document.getElementById("composeStudent");if(el){el.value=b.dataset.messageStudent;el.dispatchEvent(new Event("change"))}},0)});
 document.querySelectorAll("[data-delete-student]").forEach(b=>b.onclick=()=>{if(confirm("Delete this student and keep history?")){state.students=state.students.filter(s=>s.id!==b.dataset.deleteStudent);save();render();toast("Student deleted","good")}});
 document.querySelectorAll("[data-save-student]").forEach(b=>b.onclick=()=>saveStudent(b.dataset.saveStudent));
 document.querySelectorAll("[data-edit-template]").forEach(b=>b.onclick=()=>openTemplate(b.dataset.editTemplate));
 document.querySelectorAll("[data-delete-template]").forEach(b=>b.onclick=()=>{if(confirm("Delete this template?")){state.templates=state.templates.filter(t=>t.id!==b.dataset.deleteTemplate);save();render();toast("Template deleted","good")}});
 document.querySelectorAll("[data-save-template]").forEach(b=>b.onclick=()=>saveTemplate(b.dataset.saveTemplate));
 document.querySelectorAll("[data-complete-followup]").forEach(b=>b.onclick=()=>{const f=state.followups.find(x=>x.id===b.dataset.completeFollowup);f.done=true;save();render();toast("Follow-up completed","good")});
 document.querySelectorAll("[data-delete-followup]").forEach(b=>b.onclick=()=>{state.followups=state.followups.filter(x=>x.id!==b.dataset.deleteFollowup);save();render()});
 document.querySelectorAll("[data-delete-message]").forEach(b=>b.onclick=()=>{state.messages=state.messages.filter(x=>x.id!==b.dataset.deleteMessage);save();render();toast("Record deleted","good")});
 const ss=document.getElementById("studentSearch");if(ss)ss.oninput=()=>{document.getElementById("studentRows").innerHTML=studentRows(ss.value);bind()};
 const hs=document.getElementById("historySearch");if(hs)hs.oninput=()=>{document.getElementById("historyRows").innerHTML=historyRows(hs.value);bind()};
 const imp=document.getElementById("importJson");if(imp)imp.onchange=e=>importFile(e.target.files[0]);
 const cs=document.getElementById("composeStudent");if(cs)cs.onchange=updateComposePreview;
 const ct=document.getElementById("composeTemplate");if(ct)ct.onchange=()=>{const t=state.templates.find(x=>x.id===ct.value);if(t)document.getElementById("composeText").value=t.text;updateComposePreview()};
 const tx=document.getElementById("composeText");if(tx)tx.oninput=updateComposePreview;
 const ca=document.getElementById("composeAmount");if(ca)ca.oninput=updateComposePreview;
}
function updateComposePreview(){const s=studentById(document.getElementById("composeStudent")?.value);const text=document.getElementById("composeText")?.value||"";if(document.getElementById("composePreview"))document.getElementById("composePreview").textContent=vars(text,s,{amount:document.getElementById("composeAmount")?.value||s?.feeDue||"0",type:document.getElementById("composeType")?.value||""})}
function actions(a){
 if(a==="add-student")openStudent();
 if(a==="add-template")openTemplate();
 if(a==="add-followup")state.students.length?addFollowup():toast("Add a student first","bad");
 if(a==="generate-message")updateComposePreview();
 if(a==="copy-compose"){const p=document.getElementById("composePreview")?.textContent||"";navigator.clipboard?.writeText(p).then(()=>toast("Message copied","good"))}
 if(a==="whatsapp-compose"){const s=studentById(document.getElementById("composeStudent")?.value);const p=document.getElementById("composePreview")?.textContent||"";if(s){logMessage(s,p,document.getElementById("composeType").value);whatsapp(s,p);render()}}
 if(a==="save-compose"){const s=studentById(document.getElementById("composeStudent")?.value);const p=document.getElementById("composePreview")?.textContent||"";if(s&&p){logMessage(s,p,document.getElementById("composeType").value);toast("Communication saved","good");render()}}
 if(a==="prepare-announcement"){const audience=document.getElementById("annAudience").value;const title=document.getElementById("annTitle").value.trim();const text=document.getElementById("annText").value.trim();if(!text){toast("Write an announcement first","bad");return}const targets=state.students.filter(s=>audience==="all"||s.className===audience);modal("Announcement Preview",`<div class="notice">${targets.length} recipient(s) selected.</div><h3>${esc(title||"Announcement")}</h3><div class="message-preview">${esc(text)}</div><div class="small muted" style="margin-top:10px">Messages are prepared individually; WhatsApp opens one recipient at a time.</div>`,`<div class="actions" style="justify-content:flex-end;margin-top:18px"><button class="btn btn-secondary" data-close>Close</button><button class="btn btn-primary" id="openFirstAnnouncement">Open first WhatsApp</button></div>`);document.getElementById("openFirstAnnouncement").onclick=()=>{if(targets[0]){const msg=vars(text,targets[0],{message:text});logMessage(targets[0],msg,"Announcement");whatsapp(targets[0],msg);toast("First message opened","good");}}}
 if(a==="save-announcement"){const audience=document.getElementById("annAudience").value,title=document.getElementById("annTitle").value.trim(),text=document.getElementById("annText").value.trim();const count=state.students.filter(s=>audience==="all"||s.className===audience).length;if(!text){toast("Write an announcement first","bad");return}state.announcements.unshift({id:uid(),audience,title:title||"Announcement",text,count,date:new Date().toISOString()});save();render();toast("Announcement saved","good")}
 if(a==="export-json")download("parent-communication-backup.json",JSON.stringify({...state,view:undefined,editingId:undefined},null,2),"application/json");
 if(a==="export-csv")download("students-parent-directory.csv",csv(),"text/csv");
 if(a==="print-directory")printDirectory();
 if(a==="print-history")printHistory();
 if(a==="toggle-theme"){document.body.classList.toggle("dark");state.settings.theme=document.body.classList.contains("dark")?"dark":"light";save();render()}
 if(a==="save-settings"){state.settings.teacherName=document.getElementById("setTeacher").value.trim()||"Teacher";state.settings.coachingName=document.getElementById("setCoaching").value.trim()||"EZEE VISION CHAMPUA";save();render();toast("Settings saved","good")}
 if(a==="clear-data"){if(confirm("This will erase all local application data. Continue?")){localStorage.removeItem(KEY);location.reload()}}
}
function importFile(file){if(!file)return;const r=new FileReader();r.onload=()=>{try{const d=JSON.parse(r.result);if(!d||!Array.isArray(d.students))throw Error();state.students=d.students;state.templates=Array.isArray(d.templates)?d.templates:seedTemplates();state.messages=Array.isArray(d.messages)?d.messages:[];state.followups=Array.isArray(d.followups)?d.followups:[];state.announcements=Array.isArray(d.announcements)?d.announcements:[];state.settings={...defaults.settings,...(d.settings||{})};save();render();toast("Backup restored","good")}catch(e){toast("Invalid backup file","bad")}};r.readAsText(file)}
function tick(){document.getElementById("liveDate").textContent=new Date().toLocaleString("en-IN",{weekday:"short",day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"});}

document.addEventListener("click",e=>{if(e.target.closest("[data-close]"))closeModal()});
document.getElementById("nav").addEventListener("click",e=>{const b=e.target.closest("[data-view]");if(b)navigate(b.dataset.view)});
document.getElementById("mobileMenu").onclick=()=>document.getElementById("sidebar").classList.toggle("open");
document.getElementById("themeBtn").onclick=()=>{document.body.classList.toggle("dark");state.settings.theme=document.body.classList.contains("dark")?"dark":"light";save();};
document.getElementById("teacherAvatar").onclick=()=>navigate("settings");
load();
if(state.settings.theme==="dark")document.body.classList.add("dark");
navigate("dashboard");tick();setInterval(tick,30000);setTimeout(bind,0);
setInterval(()=>{const overdue=state.followups.filter(f=>!f.done&&f.due<=today());if(overdue.length)toast(`${overdue.length} follow-up(s) due today`,"")},60000);
