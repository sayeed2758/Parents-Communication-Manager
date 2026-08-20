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
function historyRows(q=""){const arr=state.messages.filter(m=>`${m.studentName} ${m.parent} ${m.type} ${m.message}`.toLowerCa
