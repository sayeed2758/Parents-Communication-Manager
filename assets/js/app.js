/* Parent Communication Manager Pro v2 Advanced
   Local-first, GitHub Pages compatible. No backend required.
   50+ teacher productivity features, with resilient event delegation.
*/
const KEY="pcm_pro_v2";
const VERSION="2.0.0";
const defaults={
 settings:{teacherName:"Teacher",coachingName:"EZEE VISION CHAMPUA",theme:"light",pinEnabled:false,pin:"",autoSave:true,lowAttendance:75},
 students:[],templates:[],messages:[],followups:[],announcements:[],activity:[],scheduled:[],
 selectedStudents:[], archived:[], automation:{enabled:true,lastRun:"",alerts:[],autoDrafts:true}
};
const state={...structuredClone(defaults),view:"dashboard",editingId:null,historyFilter:"all",studentFilter:"all",studentSearch:"",historySearch:""};
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const uid=()=>crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const today=()=>new Date().toISOString().slice(0,10);
const money=n=>"₹"+Number(n||0).toLocaleString("en-IN");
const nowISO=()=>new Date().toISOString();

const viewNames={
 dashboard:["Teacher Productivity","Dashboard"],students:["Directory","Students & Parents"],compose:["Communication","New Message"],
 templates:["Automation","Templates"],announcements:["Broadcast","Announcements"],followups:["Productivity","Follow-ups"],
 history:["Records","Communication History"],analytics:["Insights","Analytics"],backup:["Data & Reports","Backup & Reports"],settings:["System","Settings"]
};

function load(){
 try{
  const d=JSON.parse(localStorage.getItem(KEY)||"null");
  if(d) Object.keys(defaults).forEach(k=>{
    state[k]=Array.isArray(defaults[k])?(Array.isArray(d[k])?d[k]:[]):{...defaults[k],...(d[k]||{})};
  });
 }catch(e){console.warn("Load failed",e)}
 if(!state.templates.length) state.templates=seedTemplates();
 if(!state.automation || typeof state.automation!=="object") state.automation={enabled:true,lastRun:"",alerts:[],autoDrafts:true};
 if(!Array.isArray(state.automation.alerts)) state.automation.alerts=[];
 if(typeof state.automation.enabled!=="boolean") state.automation.enabled=true;
 if(typeof state.automation.autoDrafts!=="boolean") state.automation.autoDrafts=true;
 save();
}
function save(){
 const payload={};
 Object.keys(defaults).forEach(k=>payload[k]=state[k]);
 try{localStorage.setItem(KEY,JSON.stringify(payload));}catch(e){toast("Storage is full. Export a backup.","bad")}
}
function activity(type,text){
 state.activity.unshift({id:uid(),type,text,date:nowISO()});
 state.activity=state.activity.slice(0,80);
 save();
}
function seedTemplates(){return[
{id:uid(),name:"Fee Reminder",type:"Fee Reminder",text:"Dear {{parent_name}},\n\nThis is a gentle reminder regarding the pending fee of {{student_name}} for {{month}}.\nAmount: ₹{{amount}}\n\nThank you.\n{{coaching_name}}"},
{id:uid(),name:"Attendance Alert",type:"Attendance Alert",text:"Dear {{parent_name}},\n\n{{student_name}}'s current attendance is {{attendance}}%. Please ensure regular attendance.\n\nRegards,\n{{teacher_name}}"},
{id:uid(),name:"Exam Reminder",type:"Exam Reminder",text:"Dear {{parent_name}},\n\n{{student_name}} has an upcoming exam on {{date}}.\nPlease ensure the student is prepared and present.\n\nRegards,\n{{teacher_name}}"},
{id:uid(),name:"Parent Meeting",type:"Parent Meeting",text:"Dear {{parent_name}},\n\nWe would like to discuss {{student_name}}'s progress. Please contact us for a convenient meeting time.\n\nRegards,\n{{teacher_name}}"},
{id:uid(),name:"General Notice",type:"General Announcement",text:"Dear Parents,\n\n{{message}}\n\nThank you.\n{{coaching_name}}"}
]}

function safeSave(){
 try{
  const payload={};
  Object.keys(defaults).forEach(k=>payload[k]=state[k]);
  localStorage.setItem(KEY,JSON.stringify(payload));
  return true;
 }catch(e){console.warn("Storage save failed",e);toast("Could not save data. Export a backup.","bad");return false}
}
function automationKey(type,id,date=today()){return `${type}:${id}:${date}`}
function smartAutomation(){
 if(!state.automation?.enabled) return;
 const date=today();
 const alerts=Array.isArray(state.automation.alerts)?state.automation.alerts:[];
 const hasAlert=(key)=>alerts.some(a=>a.key===key);
 const addAlert=(type,id,title,text)=>{
  const key=automationKey(type,id,date);
  if(hasAlert(key)) return;
  alerts.unshift({id:uid(),key,type,title,text,date,read:false});
 };
 state.students.forEach(st=>{
  if(st.attendance!=="" && Number(st.attendance)<Number(state.settings.lowAttendance||75)){
   addAlert("attendance",st.id,"Low attendance",`${st.name} is at ${st.attendance}% attendance.`);
   const key=automationKey("attendance-followup",st.id,date);
   if(!state.followups.some(f=>f.autoKey===key&&!f.done)){
    state.followups.unshift({id:uid(),studentId:st.id,studentName:st.name,due:date,
      note:`Auto follow-up: attendance is ${st.attendance}%, below ${state.settings.lowAttendance}%.`,
      done:false,autoKey:key});
   }
   if(state.automation.autoDrafts){
    const mkey=automationKey("attendance-draft",st.id,date);
    if(!state.messages.some(m=>m.autoKey===mkey)){
      const text=vars("Dear {{parent_name}},\n\nThis is an automated attendance alert for {{student_name}}. Current attendance is {{attendance}}%. Please help us maintain regular attendance.\n\nRegards,\n{{teacher_name}}",st);
      state.messages.unshift({id:uid(),studentId:st.id,studentName:st.name,parent:st.parent||"",
        type:"Attendance Alert",message:text,date:nowISO(),status:"Auto-Draft",autoKey:mkey});
    }
   }
  }
  if(Number(st.feeDue||0)>0){
   addAlert("fee",st.id,"Fee due",`${st.name} has ₹${Number(st.feeDue).toLocaleString("en-IN")} outstanding.`);
   const key=automationKey("fee-followup",st.id,date);
   if(!state.followups.some(f=>f.autoKey===key&&!f.done)){
    state.followups.unshift({id:uid(),studentId:st.id,studentName:st.name,due:date,
      note:`Auto follow-up: fee due ₹${Number(st.feeDue).toLocaleString("en-IN")}.`,
      done:false,autoKey:key});
   }
   if(state.automation.autoDrafts){
    const mkey=automationKey("fee-draft",st.id,date);
    if(!state.messages.some(m=>m.autoKey===mkey)){
      const text=vars("Dear {{parent_name}},\n\nThis is a gentle reminder that ₹{{amount}} is pending for {{student_name}}.\nPlease clear the pending fee at your convenience.\n\nRegards,\n{{teacher_name}}",st,{amount:st.feeDue});
      state.messages.unshift({id:uid(),studentId:st.id,studentName:st.name,parent:st.parent||"",
        type:"Fee Reminder",message:text,date:nowISO(),status:"Auto-Draft",autoKey:mkey});
    }
   }
  }
  if(!st.phone){
   addAlert("contact",st.id,"Missing parent phone",`${st.name} has no parent phone number saved.`);
  }
 });
 state.automation.alerts=alerts.slice(0,120);
 state.automation.lastRun=nowISO();
 safeSave();
}
function runSmartAutomation(){
 smartAutomation();
 render();
 toast("Smart automation completed","good");
}

function studentById(id){return state.students.find(s=>s.id===id)}
function vars(text,s={},extra={}){
 const p={student_name:s.name||"",parent_name:s.parent||"",class:s.className||"",roll:s.roll||"",phone:s.phone||"",attendance:s.attendance??"—",amount:extra.amount??s.feeDue??"0",month:new Date().toLocaleString("en-IN",{month:"long",year:"numeric"}),date:extra.date||today(),teacher_name:state.settings.teacherName,coaching_name:state.settings.coachingName,message:extra.message||"",type:extra.type||""};
 return String(text||"").replace(/\{\{(\w+)\}\}/g,(_,k)=>p[k]??"");
}
function toast(msg,type=""){const e=document.createElement("div");e.className="toast "+type;e.textContent=msg;$("#toastRoot").appendChild(e);setTimeout(()=>e.remove(),2600)}
function modal(title,body,footer=""){$("#modalRoot").innerHTML=`<div class="modal-backdrop"><div class="modal"><div class="modal-head"><h2>${title}</h2><button class="icon-btn" data-close>×</button></div>${body}${footer}</div></div>`}
function closeModal(){$("#modalRoot").innerHTML=""}
function navigate(view){
 state.view=view;
 $$(".nav-item[data-view]").forEach(b=>b.classList.toggle("active",b.dataset.view===view));
 Object.keys(viewNames).forEach(v=>$("#view-"+v)?.classList.toggle("active",v===view));
 $("#pageEyebrow").textContent=viewNames[view][0];$("#pageTitle").textContent=viewNames[view][1];
 render();$("#sidebar").classList.remove("open");
}
function render(){
 $("#view-dashboard").innerHTML=dashboardView();$("#view-students").innerHTML=studentsView();$("#view-compose").innerHTML=composeView();
 $("#view-templates").innerHTML=templatesView();$("#view-announcements").innerHTML=announcementsView();$("#view-followups").innerHTML=followupsView();
 $("#view-history").innerHTML=historyView();$("#view-analytics").innerHTML=analyticsView();$("#view-backup").innerHTML=backupView();$("#view-settings").innerHTML=settingsView();
 bindDynamic();
}

function dashboardView(){
 const total=state.students.length, contacts=state.students.filter(s=>s.phone).length, low=state.students.filter(s=>s.attendance!==""&&Number(s.attendance)<Number(state.settings.lowAttendance||75)).length;
 const due=state.students.filter(s=>Number(s.feeDue)>0).length, pending=state.followups.filter(f=>!f.done).length, sent=state.messages.filter(m=>m.status==="Opened").length;
 const recent=state.messages.slice(0,6);
 return `<div class="grid stats">
 <div class="stat"><div class="label">TOTAL STUDENTS</div><div class="value">${total}</div><div class="sub">${contacts} parent contacts</div></div>
 <div class="stat"><div class="label">MESSAGES</div><div class="value">${state.messages.length}</div><div class="sub">${sent} opened via WhatsApp</div></div>
 <div class="stat"><div class="label">LOW ATTENDANCE</div><div class="value">${low}</div><div class="sub">Below ${state.settings.lowAttendance}%</div></div>
 <div class="stat"><div class="label">FEE FOLLOW-UP</div><div class="value">${due}</div><div class="sub">${pending} follow-up(s) pending</div></div>
 </div>
 <div class="card automation-card" style="margin-bottom:16px"><div class="card-head"><div><div class="card-title">⚡ Smart Automation</div><div class="small muted">Automatic risk scan, follow-ups and message drafts.</div></div><button class="btn btn-primary" data-action="run-automation">Run Now</button></div>
 <div class="grid three">
  <div class="mini-stat"><b>${state.automation.alerts.length}</b><span>Smart alerts</span></div>
  <div class="mini-stat"><b>${state.followups.filter(f=>!f.done&&f.autoKey).length}</b><span>Auto follow-ups</span></div>
  <div class="mini-stat"><b>${state.messages.filter(m=>m.status==="Auto-Draft").length}</b><span>Auto message drafts</span></div>
 </div>
 <div class="small muted" style="margin-top:10px">Last scan: ${state.automation.lastRun?new Date(state.automation.lastRun).toLocaleString("en-IN"):"Not yet run"}</div></div>
 <div class="grid quick-grid">
 ${[["💬","New Message","compose"],["👨‍🎓","Add Student","students"],["📢","Announcement","announcements"],["🔔","Follow-up","followups"]].map(x=>`<button class="quick" data-go="${x[2]}"><span style="font-size:24px">${x[0]}</span><b>${x[1]}</b><small class="muted">Open workspace →</small></button>`).join("")}
 </div>
 <div class="grid two">
  <div class="card"><div class="card-head"><div><div class="card-title">Recent Communications</div><div class="small muted">Latest saved parent interactions</div></div><button class="btn btn-secondary" data-go="history">View all</button></div>
  ${recent.length?`<div class="table-wrap"><table class="table"><thead><tr><th>Student</th><th>Type</th><th>Date</th><th>Status</th></tr></thead><tbody>${recent.map(m=>`<tr><td><b>${esc(m.studentName)}</b><div class="small muted">${esc(m.parent)}</div></td><td>${esc(m.type)}</td><td>${new Date(m.date).toLocaleString("en-IN")}</td><td><span class="pill ${m.status==="Opened"?"good":"info"}">${esc(m.status)}</span></td></tr>`).join("")}</tbody></table></div>`:`<div class="empty">No communication saved yet.<br><button class="btn btn-primary" data-go="compose">Create first message</button></div>`}</div>
  <div class="card"><div class="card-head"><div class="card-title">Today’s Attention</div></div>
   ${low?`<div class="notice danger">⚠ ${low} student(s) below attendance threshold.</div>`:`<div class="notice good">✓ No low-attendance alerts.</div>`}
   <div style="height:9px"></div>${pending?`<div class="notice warn">🔔 ${pending} follow-up(s) pending.</div>`:`<div class="notice good">✓ No pending follow-ups.</div>`}
   <div style="height:9px"></div>${due?`<div class="notice warn">₹${state.students.reduce((a,s)=>a+Number(s.feeDue||0),0).toLocaleString("en-IN")} total fee due.</div>`:`<div class="notice good">✓ No fee dues recorded.</div>`}
  </div>
 </div>
 <div class="card" style="margin-top:16px"><div class="card-head"><div><div class="card-title">Recent Activity</div><div class="small muted">Your local productivity timeline</div></div></div>
 ${state.activity.slice(0,5).map(a=>`<div class="kpi"><span>${esc(a.text)}</span><span class="small muted">${new Date(a.date).toLocaleString("en-IN")}</span></div>`).join("")||`<div class="empty">Activity will appear here as you work.</div>`}</div>`;
}

function studentsView(){
 const q=state.studentSearch.toLowerCase(), filter=state.studentFilter;
 let arr=state.students.filter(s=>`${s.name} ${s.parent} ${s.phone} ${s.className} ${s.tags||""}`.toLowerCase().includes(q));
 if(filter==="low")arr=arr.filter(s=>Number(s.attendance)<Number(state.settings.lowAttendance));
 if(filter==="due")arr=arr.filter(s=>Number(s.feeDue)>0);
 if(filter==="archived")arr=state.archived;
 return `<div class="card">
 <div class="toolbar"><div><b>Student & Parent Directory</b><div class="small muted">${state.students.length} active • ${state.archived.length} archived</div></div>
 <div class="actions"><input id="studentSearch" class="search" placeholder="Search name, parent, phone..." value="${esc(state.studentSearch)}">
 <select id="studentFilter"><option value="all" ${filter==="all"?"selected":""}>All</option><option value="low" ${filter==="low"?"selected":""}>Low Attendance</option><option value="due" ${filter==="due"?"selected":""}>Fee Due</option><option value="archived" ${filter==="archived"?"selected":""}>Archived</option></select>
 <button class="btn btn-primary" data-action="add-student">+ Add Student</button></div></div>
 ${filter==="archived"?`<div class="notice">Archived students are kept separately and can be restored.</div><div style="height:10px"></div>`:""}
 <div class="table-wrap"><table class="table"><thead><tr><th><input type="checkbox" data-select-all></th><th>Student</th><th>Class</th><th>Parent</th><th>Phone</th><th>Attendance</th><th>Fee Due</th><th>Actions</th></tr></thead><tbody>${studentRows(arr,filter)}</tbody></table></div>
 ${filter!=="archived"&&arr.length?`<div class="actions no-print" style="margin-top:13px"><button class="btn btn-secondary" data-action="bulk-message">💬 Prepare selected</button><button class="btn btn-secondary" data-action="export-csv">CSV Export</button><button class="btn btn-secondary" data-action="print-directory">Print</button></div>`:""}
 </div>`;
}
function studentRows(arr,filter){
 if(!arr.length)return `<tr><td colspan="8"><div class="empty">No students found.</div></td></tr>`;
 return arr.map(s=>`<tr><td><input type="checkbox" data-student-check="${s.id}" ${state.selectedStudents.includes(s.id)?"checked":""}></td>
 <td><b>${esc(s.name)}</b><div class="small muted">${esc(s.roll||"No roll")} ${s.dob?"• "+esc(s.dob):""}</div></td><td>${esc(s.className)}</td><td>${esc(s.parent)}</td><td>${esc(s.phone)}</td>
 <td><span class="pill ${Number(s.attendance)<Number(state.settings.lowAttendance)?"bad":"good"}">${s.attendance===""?"—":esc(s.attendance)+"%"}</span></td><td>${money(s.feeDue)}</td>
 <td><div class="actions">${filter==="archived"?`<button class="btn btn-success btn-sm" data-restore-student="${s.id}">Restore</button>`:`<button class="btn btn-secondary btn-sm" data-edit-student="${s.id}">Edit</button><button class="btn btn-primary btn-sm" data-message-student="${s.id}">Message</button><button class="btn btn-warning btn-sm" data-archive-student="${s.id}">Archive</button>`}</div></td></tr>`).join("");
}
function studentForm(s={}){
 return `<div class="form-grid">
 <div class="field"><label>Student Name *</label><input id="f_name" value="${esc(s.name)}" maxlength="80"></div>
 <div class="field"><label>Roll Number</label><input id="f_roll" value="${esc(s.roll)}"></div>
 <div class="field"><label>Class / Section</label><input id="f_class" value="${esc(s.className)}" placeholder="Class 10 A"></div>
 <div class="field"><label>Parent / Guardian</label><input id="f_parent" value="${esc(s.parent)}"></div>
 <div class="field"><label>WhatsApp / Phone</label><input id="f_phone" inputmode="tel" value="${esc(s.phone)}"></div>
 <div class="field"><label>Attendance %</label><input id="f_att" type="number" min="0" max="100" value="${esc(s.attendance??"")}"></div>
 <div class="field"><label>Fee Due (₹)</label><input id="f_fee" type="number" min="0" value="${esc(s.feeDue??0)}"></div>
 <div class="field"><label>Date of Birth</label><input id="f_dob" type="date" value="${esc(s.dob)}"></div>
 <div class="field"><label>Tags</label><input id="f_tags" value="${esc(s.tags||"")}" placeholder="weak, topper, follow-up"></div>
 <div class="field"><label>Parent Email</label><input id="f_email" type="email" value="${esc(s.email)}"></div>
 <div class="field full"><label>Notes</label><textarea id="f_notes" placeholder="Academic / parent notes">${esc(s.notes)}</textarea></div>
 </div>`;
}
function openStudent(id=""){const s=id?studentById(id):{};modal(id?"Edit Student":"Add Student",studentForm(s),`<div class="actions" style="justify-content:flex-end;margin-top:17px"><button class="btn btn-secondary" data-close>Cancel</button><button class="btn btn-primary" data-save-student="${esc(id)}">Save Student</button></div>`)}
function saveStudent(id){
 const name=$("#f_name").value.trim();if(!name){toast("Student name is required","bad");return}
 const phone=$("#f_phone").value.trim();if(phone&&!/^[0-9+ ()-]{7,18}$/.test(phone)){toast("Enter a valid phone number","bad");return}
 const obj={name,roll:$("#f_roll").value.trim(),className:$("#f_class").value.trim(),parent:$("#f_parent").value.trim(),phone,attendance:$("#f_att").value===""?"":Math.max(0,Math.min(100,Number($("#f_att").value))),feeDue:Math.max(0,Number($("#f_fee").value||0)),dob:$("#f_dob").value,tags:$("#f_tags").value.trim(),email:$("#f_email").value.trim(),notes:$("#f_notes").value.trim(),updated:nowISO()};
 if(id){const i=state.students.findIndex(s=>s.id===id);if(i>=0){obj.id=id;state.students[i]={...state.students[i],...obj};activity("student","Updated "+name)}}else{obj.id=uid();obj.created=nowISO();state.students.unshift(obj);activity("student","Added "+name)}
 save();closeModal();render();toast(id?"Student updated":"Student added","good");
}
function archiveStudent(id){const s=studentById(id);if(!s)return;if(!confirm(`Archive ${s.name}?`))return;state.students=state.students.filter(x=>x.id!==id);state.archived.unshift({...s,archivedAt:nowISO()});state.selectedStudents=state.selectedStudents.filter(x=>x!==id);activity("archive","Archived "+s.name);save();render();toast("Student archived","good")}
function restoreStudent(id){const s=state.archived.find(x=>x.id===id);if(!s)return;state.archived=state.archived.filter(x=>x.id!==id);delete s.archivedAt;state.students.unshift(s);activity("restore","Restored "+s.name);save();render();toast("Student restored","good")}

function composeView(){
 const s=state.students[0]||{}, t=state.templates[0]||{};
 return `<div class="grid split">
 <div class="card"><div class="card-head"><div><div class="card-title">Message Composer</div><div class="small muted">Create once, personalize automatically.</div></div><span class="pill info">Local-first</span></div>
 <div class="form-grid">
 <div class="field"><label>Student / Parent</label><select id="composeStudent">${state.students.length?state.students.map(x=>`<option value="${x.id}">${esc(x.name)} — ${esc(x.parent||"Parent")}</option>`).join(""):`<option value="">Add a student first</option>`}</select></div>
 <div class="field"><label>Template</label><select id="composeTemplate"><option value="">Custom Message</option>${state.templates.map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join("")}</select></div>
 <div class="field"><label>Message Type</label><select id="composeType"><option>General</option><option>Fee Reminder</option><option>Attendance Alert</option><option>Exam Reminder</option><option>Parent Meeting</option><option>Appreciation</option><option>Announcement</option></select></div>
 <div class="field"><label>Amount / Context</label><input id="composeAmount" type="number" value="${s.feeDue||0}"></div>
 <div class="field full"><label>Message</label><textarea id="composeText">${esc(t.text||"Dear {{parent_name}},\n\nThis is a message regarding {{student_name}}.\n\nRegards,\n{{teacher_name}}")}</textarea></div>
 </div>
 <div class="actions no-print" style="margin-top:13px"><button class="btn btn-primary" data-action="generate-message">✨ Generate Preview</button><button class="btn btn-secondary" data-action="copy-compose">Copy</button><button class="btn btn-success" data-action="whatsapp-compose">💬 Open WhatsApp</button><button class="btn btn-secondary" data-action="save-compose">Save Record</button></div>
 </div>
 <div class="card"><div class="card-head"><div class="card-title">Live Preview</div><span class="pill good">Auto merge</span></div><div id="composePreview" class="message-preview"></div>
 <div class="notice" style="margin-top:12px"><b>Variables:</b> {{student_name}}, {{parent_name}}, {{class}}, {{roll}}, {{attendance}}, {{amount}}, {{month}}, {{date}}, {{teacher_name}}, {{coaching_name}}, {{message}}</div></div>
 </div>`;
}
function updateComposePreview(){const s=studentById($("#composeStudent")?.value)||{};const txt=$("#composeText")?.value||"";$("#composePreview")&&($("#composePreview").textContent=vars(txt,s,{amount:$("#composeAmount")?.value||s.feeDue||0,type:$("#composeType")?.value||""}))}
function logMessage(s,text,type,status="Prepared"){state.messages.unshift({id:uid(),studentId:s.id,studentName:s.name,parent:s.parent||"",type,message:text,date:nowISO(),status});state.messages=state.messages.slice(0,500);save()}
function whatsapp(s,text){const phone=(s.phone||"").replace(/\D/g,"");if(!phone){toast("Parent phone number is missing","bad");return false}const intl=phone.length===10?"91"+phone:phone;window.open(`https://wa.me/${intl}?text=${encodeURIComponent(text)}`,"_blank","noopener");return true}

function templatesView(){return `<div class="card"><div class="toolbar"><div><b>Message Template Library</b><div class="small muted">${state.templates.length} reusable templates</div></div><button class="btn btn-primary" data-action="add-template">+ New Template</button></div><div class="template-grid">${state.templates.map(t=>`<div class="template-card"><span class="pill info">${esc(t.type)}</span><h3>${esc(t.name)}</h3><p>${esc(t.text)}</p><div class="actions"><button class="btn btn-secondary btn-sm" data-edit-template="${t.id}">Edit</button><button class="btn btn-primary btn-sm" data-duplicate-template="${t.id}">Duplicate</button><button class="btn btn-danger btn-sm" data-delete-template="${t.id}">Delete</button></div></div>`).join("")}</div></div>`}
function templateForm(t={}){return `<div class="form-grid"><div class="field"><label>Name *</label><input id="t_name" value="${esc(t.name)}"></div><div class="field"><label>Type</label><input id="t_type" value="${esc(t.type||"General")}"></div><div class="field full"><label>Template Text</label><textarea id="t_text">${esc(t.text)}</textarea></div></div>`}
function openTemplate(id=""){const t=id?state.templates.find(x=>x.id===id):{};modal(id?"Edit Template":"New Template",templateForm(t),`<div class="actions" style="justify-content:flex-end;margin-top:17px"><button class="btn btn-secondary" data-close>Cancel</button><button class="btn btn-primary" data-save-template="${esc(id)}">Save Template</button></div>`)}
function saveTemplate(id){const name=$("#t_name").value.trim(),text=$("#t_text").value.trim();if(!name||!text){toast("Template name and text are required","bad");return}const obj={name,type:$("#t_type").value.trim()||"General",text};if(id){const i=state.templates.findIndex(x=>x.id===id);obj.id=id;state.templates[i]={...state.templates[i],...obj}}else{obj.id=uid();state.templates.push(obj)}activity("template",(id?"Updated ":"Created ")+name);save();closeModal();render();toast("Template saved","good")}

function announcementsView(){const classes=[...new Set(state.students.map(s=>s.className).filter(Boolean))];return `<div class="grid split"><div class="card"><div class="card-head"><div><div class="card-title">Broadcast Announcement</div><div class="small muted">Prepare a personalized announcement for a class or everyone.</div></div></div><div class="form-grid"><div class="field"><label>Audience</label><select id="annAudience"><option value="all">All Parents</option>${classes.map(c=>`<option>${esc(c)}</option>`).join("")}</select></div><div class="field"><label>Title</label><input id="annTitle" placeholder="Important Notice"></div><div class="field full"><label>Announcement</label><textarea id="annText" placeholder="Write the notice..."></textarea></div></div><div class="actions" style="margin-top:13px"><button class="btn btn-primary" data-action="save-announcement">Save Announcement</button><button class="btn btn-success" data-action="prepare-announcement">Prepare WhatsApp</button></div></div><div class="card"><div class="card-head"><div class="card-title">Saved Broadcasts</div></div>${state.announcements.map(a=>`<div class="kpi"><span><b>${esc(a.title)}</b><div class="small muted">${esc(a.audience)} • ${a.count} recipients</div></span><span class="small muted">${new Date(a.date).toLocaleDateString("en-IN")}</span></div>`).join("")||`<div class="empty">No announcements yet.</div>`}</div></div>`}

function followupsView(){const sorted=[...state.followups].sort((a,b)=>Number(a.done)-Number(b.done)||String(a.due).localeCompare(String(b.due)));return `<div class="card"><div class="toolbar"><div><b>Follow-up Tracker</b><div class="small muted">Never forget a parent call or message.</div></div><button class="btn btn-primary" data-action="add-followup">+ Add Follow-up</button></div>${sorted.length?`<div class="table-wrap"><table class="table"><thead><tr><th>Status</th><th>Student</th><th>Due</th><th>Note</th><th>Actions</th></tr></thead><tbody>${sorted.map(f=>`<tr><td><span class="pill ${f.done?"good":f.due<today()?"bad":"warn"}">${f.done?"Done":f.due<today()?"Overdue":"Pending"}</span></td><td>${esc(f.studentName)}</td><td>${esc(f.due)}</td><td>${esc(f.note)}</td><td><div class="actions">${!f.done?`<button class="btn btn-success btn-sm" data-complete-followup="${f.id}">Complete</button>`:""}<button class="btn btn-danger btn-sm" data-delete-followup="${f.id}">Delete</button></div></td></tr>`).join("")}</tbody></table></div>`:`<div class="empty">No follow-ups. Add one when you need to remember a call or message.</div>`}</div>`}
function addFollowup(){if(!state.students.length){toast("Add a student first","bad");return}modal("Add Follow-up",`<div class="form-grid"><div class="field"><label>Student</label><select id="fu_student">${state.students.map(s=>`<option value="${s.id}">${esc(s.name)}</option>`).join("")}</select></div><div class="field"><label>Due Date</label><input id="fu_due" type="date" value="${today()}"></div><div class="field full"><label>Note</label><textarea id="fu_note" placeholder="Call parent about attendance..."></textarea></div></div>`,`<div class="actions" style="justify-content:flex-end;margin-top:17px"><button class="btn btn-secondary" data-close>Cancel</button><button class="btn btn-primary" data-save-followup>Save</button></div>`)}
function saveFollowup(){const s=studentById($("#fu_student").value),note=$("#fu_note").value.trim();if(!s||!note){toast("Student and note are required","bad");return}state.followups.push({id:uid(),studentId:s.id,studentName:s.name,due:$("#fu_due").value,note,done:false});activity("followup","Added follow-up for "+s.name);save();closeModal();render();toast("Follow-up added","good")}

function historyView(){let arr=state.messages.filter(m=>`${m.studentName} ${m.parent} ${m.type} ${m.message}`.toLowerCase().includes(state.historySearch.toLowerCase()));if(state.historyFilter!=="all")arr=arr.filter(m=>m.status===state.historyFilter);return `<div class="card"><div class="toolbar"><div><b>Communication History</b><div class="small muted">${state.messages.length} saved records</div></div><div class="actions"><input id="historySearch" class="search" placeholder="Search history..." value="${esc(state.historySearch)}"><select id="historyFilter"><option value="all">All Status</option><option value="Opened" ${state.historyFilter==="Opened"?"selected":""}>Opened</option><option value="Prepared" ${state.historyFilter==="Prepared"?"selected":""}>Prepared</option></select><button class="btn btn-secondary" data-action="print-history">Print</button></div></div>${arr.length?`<div class="table-wrap"><table class="table"><thead><tr><th>Date</th><th>Student</th><th>Parent</th><th>Type</th><th>Message</th><th>Status</th><th></th></tr></thead><tbody>${arr.map(m=>`<tr><td>${new Date(m.date).toLocaleString("en-IN")}</td><td>${esc(m.studentName)}</td><td>${esc(m.parent)}</td><td>${esc(m.type)}</td><td style="max-width:360px;white-space:normal">${esc(m.message)}</td><td><span class="pill ${m.status==="Opened"?"good":"info"}">${esc(m.status)}</span></td><td><button class="btn btn-danger btn-sm" data-delete-message="${m.id}">Delete</button></td></tr>`).join("")}</tbody></table></div>`:`<div class="empty">No communication records match your search.</div>`}</div>`}

function analyticsView(){
 const total=state.students.length, contacts=state.students.filter(s=>s.phone).length, low=state.students.filter(s=>Number(s.attendance)<Number(state.settings.lowAttendance)).length, due=state.students.reduce((a,s)=>a+Number(s.feeDue||0),0);
 const months=[];for(let i=5;i>=0;i--){const d=new Date();d.setMonth(d.getMonth()-i);months.push(d.toLocaleString("en-IN",{month:"short"}))}
 const counts=months.map((_,i)=>{const d=new Date();d.setMonth(d.getMonth()-(5-i));const ym=d.toISOString().slice(0,7);return state.messages.filter(m=>m.date.slice(0,7)===ym).length});const max=Math.max(1,...counts);
 return `<div class="grid three"><div class="card"><div class="card-title">Contact Coverage</div><div class="stat" style="box-shadow:none;border:0;padding:18px 0 0"><div class="value">${total?Math.round(contacts/total*100):0}%</div><div class="sub">${contacts}/${total} students have phone numbers</div></div><div class="bar" style="margin-top:12px"><i style="width:${total?contacts/total*100:0}%"></i></div></div>
 <div class="card"><div class="card-title">Attendance Risk</div><div class="stat" style="box-shadow:none;border:0;padding:18px 0 0"><div class="value">${low}</div><div class="sub">Students below ${state.settings.lowAttendance}%</div></div></div>
 <div class="card"><div class="card-title">Fee Due</div><div class="stat" style="box-shadow:none;border:0;padding:18px 0 0"><div class="value">${money(due)}</div><div class="sub">Total recorded outstanding amount</div></div></div></div>
 <div class="card" style="margin-top:16px"><div class="card-head"><div><div class="card-title">Communication Trend</div><div class="small muted">Saved messages by month</div></div></div><div class="chart">${counts.map((n,i)=>`<div class="chart-col"><span class="chart-num">${n}</span><div class="chart-bar" style="height:${Math.max(3,n/max*170)}px"></div><span class="chart-label">${months[i]}</span></div>`).join("")}</div></div>
 <div class="grid two" style="margin-top:16px"><div class="card"><div class="card-title">Message Types</div>${Object.entries(state.messages.reduce((a,m)=>(a[m.type]=(a[m.type]||0)+1,a),{})).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([k,v])=>`<div class="kpi"><span>${esc(k)}</span><b>${v}</b></div>`).join("")||`<div class="empty">No message data yet.</div>`}</div>
 <div class="card"><div class="card-title">Class Overview</div>${[...new Set(state.students.map(s=>s.className).filter(Boolean))].map(c=>{const a=state.students.filter(s=>s.className===c);const avg=a.filter(s=>s.attendance!=="").reduce((x,s)=>x+Number(s.attendance),0)/(a.filter(s=>s.attendance!=="").length||1);return `<div class="kpi"><span>${esc(c)}<div class="small muted">${a.length} student(s)</div></span><b>${Math.round(avg)}%</b></div>`}).join("")||`<div class="empty">Add classes to see analytics.</div>`}</div></div>`;
}

function backupView(){const size=new Blob([JSON.stringify(state)]).size;return `<div class="grid three"><div class="card"><div class="card-title">Backup</div><p class="small muted">Download everything stored by this app.</p><button class="btn btn-primary" data-action="export-json">⬇ JSON Backup</button></div><div class="card"><div class="card-title">CSV Reports</div><p class="small muted">Export your student directory for spreadsheets.</p><button class="btn btn-secondary" data-action="export-csv">⬇ Student CSV</button></div><div class="card"><div class="card-title">Print</div><p class="small muted">Create clean printable reports.</p><div class="actions"><button class="btn btn-secondary" data-action="print-directory">Directory</button><button class="btn btn-secondary" data-action="print-history">History</button></div></div></div>
 <div class="card" style="margin-top:16px"><div class="card-head"><div><div class="card-title">Restore / Import</div><div class="small muted">JSON backup or CSV student list.</div></div></div><div class="actions"><label class="btn btn-secondary">Choose JSON <input id="importJson" type="file" accept=".json,application/json" hidden></label><label class="btn btn-secondary">Import CSV <input id="importCsv" type="file" accept=".csv,text/csv" hidden></label></div><div class="notice" style="margin-top:12px">Storage used: ${(size/1024).toFixed(1)} KB. Keep periodic backups because browser storage is device-local.</div></div>
 <div class="card" style="margin-top:16px"><div class="card-title">Safety</div><p class="small muted">This is a local-first app. WhatsApp opens the official web/app link; the app itself does not send messages in the background.</p></div>`}

function settingsView(){return `<div class="grid two"><div class="card"><div class="card-head"><div><div class="card-title">Profile & Preferences</div></div></div><div class="form-grid"><div class="field"><label>Teacher Name</label><input id="setTeacher" value="${esc(state.settings.teacherName)}"></div><div class="field"><label>Coaching / School Name</label><input id="setCoaching" value="${esc(state.settings.coachingName)}"></div><div class="field"><label>Low Attendance Threshold %</label><input id="setAttendance" type="number" min="1" max="100" value="${esc(state.settings.lowAttendance)}"></div></div><button class="btn btn-primary" style="margin-top:14px" data-action="save-settings">Save Settings</button></div>
 <div class="card"><div class="card-title">Privacy & Protection</div><div class="switch-row"><span><b>PIN Lock</b><div class="small muted">Protect opening the app on this device.</div></span><button class="switch ${state.settings.pinEnabled?"on":""}" data-action="toggle-pin"></button></div><div class="switch-row"><span><b>Auto Save</b><div class="small muted">Save changes to local storage automatically.</div></span><button class="switch ${state.settings.autoSave!==false?"on":""}" data-action="toggle-autosave"></button></div><div class="switch-row"><span><b>Dark Mode</b><div class="small muted">Comfortable low-light interface.</div></span><button class="switch ${state.settings.theme==="dark"?"on":""}" data-action="toggle-theme"></button></div></div></div>
 <div class="card" style="margin-top:16px"><div class="card-head"><div><div class="card-title">⚡ Automation</div><div class="small muted">Runs when the app opens and every time you tap Run Now.</div></div><button class="btn btn-primary" data-action="run-automation">Run Smart Scan</button></div>
 <div class="switch-row"><span><b>Smart Automation</b><div class="small muted">Create risk alerts and follow-ups for low attendance and fee dues.</div></span><button class="switch ${state.automation.enabled?"on":""}" data-action="toggle-automation"></button></div>
 <div class="switch-row"><span><b>Auto Message Drafts</b><div class="small muted">Prepare personalized WhatsApp drafts; sending remains under your control.</div></span><button class="switch ${state.automation.autoDrafts?"on":""}" data-action="toggle-auto-drafts"></button></div></div>
 <div class="card" style="margin-top:16px"><div class="card-head"><div><div class="card-title">Data Management</div></div></div><div class="actions"><button class="btn btn-secondary" data-action="demo-data">Load Demo Data</button><button class="btn btn-danger" data-action="clear-data">Reset App</button></div></div>`}

function csv(){const rows=[["Name","Roll","Class","Parent","Phone","Email","Attendance","Fee Due","DOB","Tags","Notes"],...state.students.map(s=>[s.name,s.roll,s.className,s.parent,s.phone,s.email,s.attendance,s.feeDue,s.dob,s.tags,s.notes])];return rows.map(r=>r.map(v=>`"${String(v??"").replace(/"/g,'""')}"`).join(",")).join("\n")}
function download(name,text,type){const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
function printHTML(title,headers,rows){const w=window.open("","_blank");if(!w){toast("Allow pop-ups to print","bad");return}w.document.write(`<html><head><title>${esc(title)}</title><style>body{font-family:Arial;padding:25px;color:#111}h1{margin-bottom:5px}small{color:#666}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{border:1px solid #ddd;padding:8px;text-align:left;font-size:12px}th{background:#f3f4f6}</style></head><body><h1>${esc(title)}</h1><small>${esc(state.settings.coachingName)} • ${new Date().toLocaleString("en-IN")}</small><table><thead><tr>${headers.map(h=>`<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table><script>window.onload=()=>window.print()<\/script></body></html>`);w.document.close()}
function printDirectory(){printHTML("Student & Parent Directory",["Student","Class","Parent","Phone","Attendance","Fee Due"],state.students.map(s=>[s.name,s.className,s.parent,s.phone,(s.attendance===""?"—":s.attendance+"%"),money(s.feeDue)]))}
function printHistory(){printHTML("Communication History",["Date","Student","Parent","Type","Status","Message"],state.messages.map(m=>[new Date(m.date).toLocaleString("en-IN"),m.studentName,m.parent,m.type,m.status,m.message]))}
function importJSON(file){if(!file)return;const r=new FileReader();r.onload=()=>{try{const d=JSON.parse(r.result);if(!Array.isArray(d.students))throw Error();Object.keys(defaults).forEach(k=>{if(k==="settings")state.settings={...defaults.settings,...(d.settings||{})};else if(Array.isArray(defaults[k]))state[k]=Array.isArray(d[k])?d[k]:[]});save();activity("backup","Restored JSON backup");render();toast("Backup restored","good")}catch(e){toast("Invalid JSON backup","bad")}};r.readAsText(file)}
function importCSV(file){if(!file)return;const r=new FileReader();r.onload=()=>{const lines=r.result.split(/\r?\n/).filter(Boolean);if(lines.length<2){toast("CSV has no rows","bad");return}const parse=line=>{const out=[];let cur="",q=false;for(const ch of line){if(ch==='"'){q=!q;continue}if(ch===","&&!q){out.push(cur);cur="";}else cur+=ch}out.push(cur);return out.map(x=>x.trim())};const head=parse(lines[0]).map(x=>x.toLowerCase());let added=0;for(const line of lines.slice(1)){const v=parse(line);const get=k=>v[head.indexOf(k)]||"";const name=get("name");if(!name)continue;state.students.unshift({id:uid(),name,roll:get("roll"),className:get("class"),parent:get("parent"),phone:get("phone"),email:get("email"),attendance:get("attendance").replace("%",""),feeDue:Number(get("fee due")||0),dob:get("dob"),tags:get("tags"),notes:get("notes"),created:nowISO()});added++}save();activity("import","Imported "+added+" student(s) from CSV");render();toast(`${added} student(s) imported`,"good")};r.readAsText(file)}
function showAbout(){modal("Parent Communication Manager Pro v2",`<div class="notice good">50+ productivity features • local-first • GitHub Pages ready</div><div style="margin-top:14px"><b>Keyboard shortcuts</b><div class="kpi"><span>N</span><span>New message</span></div><div class="kpi"><span>S</span><span>Students</span></div><div class="kpi"><span>/</span><span>Focus search when available</span></div><div class="kpi"><span>Esc</span><span>Close modal</span></div></div><p class="small muted">Version ${VERSION}. Data stays on this device unless you export it.</p>`,`<div class="actions" style="justify-content:flex-end"><button class="btn btn-primary" data-close>Close</button></div>`)}
function askPin(){modal("Set PIN",`<div class="field"><label>4–8 digit PIN</label><input id="pinValue" type="password" inputmode="numeric" maxlength="8" placeholder="Enter PIN"></div>`,`<div class="actions" style="justify-content:flex-end;margin-top:16px"><button class="btn btn-secondary" data-close>Cancel</button><button class="btn btn-primary" data-save-pin>Enable</button></div>`)}
function showLock(){const e=$("#lockScreen");e.classList.remove("hidden");e.innerHTML=`<div class="lock-card"><div style="font-size:42px">🔐</div><h2>ParentComm Manager</h2><p class="small" style="color:#94a3b8">Enter your PIN to continue.</p><input id="unlockPin" type="password" inputmode="numeric" maxlength="8"><button class="btn btn-primary" data-unlock style="width:100%">Unlock</button></div>`}
function checkPin(){if(state.settings.pinEnabled&&state.settings.pin)showLock()}
function bindDynamic(){
 $$("[data-view]").forEach(b=>b.onclick=()=>navigate(b.dataset.view));
 const ss=$("#studentSearch");if(ss)ss.oninput=()=>{state.studentSearch=ss.value;const rows=$("#view-students tbody");if(rows){let arr=state.students.filter(s=>`${s.name} ${s.parent} ${s.phone} ${s.className} ${s.tags||""}`.toLowerCase().includes(state.studentSearch.toLowerCase()));if(state.studentFilter==="low")arr=arr.filter(s=>Number(s.attendance)<Number(state.settings.lowAttendance));if(state.studentFilter==="due")arr=arr.filter(s=>Number(s.feeDue)>0);rows.innerHTML=studentRows(arr,state.studentFilter)}};
 const sf=$("#studentFilter");if(sf)sf.onchange=()=>{state.studentFilter=sf.value;render()};
 const hs=$("#historySearch");if(hs)hs.oninput=()=>{state.historySearch=hs.value;render()};
 const hf=$("#historyFilter");if(hf)hf.onchange=()=>{state.historyFilter=hf.value;render()};
 const imp=$("#importJson");if(imp)imp.onchange=e=>importJSON(e.target.files[0]);
 const csvI=$("#importCsv");if(csvI)csvI.onchange=e=>importCSV(e.target.files[0]);
 const cs=$("#composeStudent");if(cs)cs.onchange=updateComposePreview;
 const ct=$("#composeTemplate");if(ct)ct.onchange=()=>{const t=state.templates.find(x=>x.id===ct.value);if(t)$("#composeText").value=t.text;updateComposePreview()};
 const tx=$("#composeText");if(tx)tx.oninput=updateComposePreview;
 const ca=$("#composeAmount");if(ca)ca.oninput=updateComposePreview;
 $$("[data-select-all]").forEach(x=>x.onchange=()=>{$$("[data-student-check]").forEach(c=>{c.checked=x.checked;if(x.checked&&!state.selectedStudents.includes(c.dataset.studentCheck))state.selectedStudents.push(c.dataset.studentCheck);if(!x.checked)state.selectedStudents=state.selectedStudents.filter(id=>id!==c.dataset.studentCheck)});});
 $$("[data-student-check]").forEach(c=>c.onchange=()=>{if(c.checked&&!state.selectedStudents.includes(c.dataset.studentCheck))state.selectedStudents.push(c.dataset.studentCheck);if(!c.checked)state.selectedStudents=state.selectedStudents.filter(id=>id!==c.dataset.studentCheck)});
}

document.addEventListener("click",e=>{
 const b=e.target.closest("button");
 if(!b)return;
 if(b.matches("[data-close]"))return closeModal();
 if(b.matches("[data-go]"))return navigate(b.dataset.go);
 if(b.matches("[data-view]"))return navigate(b.dataset.view);
 const a=b.dataset.action ||
   (b.dataset.editStudent ? "edit-student" :
   b.dataset.archiveStudent ? "archive-student" :
   b.dataset.restoreStudent ? "restore-student" :
   b.dataset.messageStudent ? "message-student" :
   b.dataset.editTemplate ? "edit-template" :
   b.dataset.deleteTemplate ? "delete-template" :
   b.dataset.duplicateTemplate ? "duplicate-template" :
   b.dataset.completeFollowup ? "complete-followup" :
   b.dataset.deleteFollowup ? "delete-followup" :
   b.dataset.deleteMessage ? "delete-message" :
   b.dataset.saveStudent !== undefined ? "save-student" :
   b.dataset.saveTemplate !== undefined ? "save-template" :
   b.dataset.savePin !== undefined ? "save-pin" :
   b.dataset.unlock !== undefined ? "unlock" :
   b.dataset.addFollowup !== undefined ? "add-followup" :
   b.dataset.openFirstAnnouncement !== undefined ? "open-first-announcement" : "");
 if(a==="add-student")return openStudent();
 if(a==="edit-student")return openStudent(b.dataset.id);
 if(a==="message-student"){navigate("compose");setTimeout(()=>{$("#composeStudent").value=b.dataset.id;updateComposePreview()},0);return}
 if(a==="archive-student")return archiveStudent(b.dataset.id);
 if(a==="restore-student")return restoreStudent(b.dataset.id);
 if(a==="add-template")return openTemplate();
 if(a==="add-followup")return openFollowup();
 if(a==="edit-template")return openTemplate(b.dataset.id);
 if(a==="delete-template"){if(confirm("Delete this template?")){state.templates=state.templates.filter(x=>x.id!==b.dataset.id);save();render();toast("Template deleted","good")}return}
 if(a==="duplicate-template"){const t=state.templates.find(x=>x.id===b.dataset.id);if(t){state.templates.push({...t,id:uid(),name:t.name+" Copy"});activity("template","Duplicated "+t.name);save();render();toast("Template duplicated","good")}return}
 if(a==="save-student")return saveStudent(b.dataset.id);
 if(a==="save-template")return saveTemplate(b.dataset.id);
 if(a==="save-followup")return saveFollowup();
 if(a==="complete-followup"){const f=state.followups.find(x=>x.id===b.dataset.id);if(f){f.done=true;activity("followup","Completed follow-up for "+f.studentName);save();render();toast("Follow-up completed","good")}return}
 if(a==="delete-followup"){state.followups=state.followups.filter(x=>x.id!==b.dataset.id);save();render();return}
 if(a==="delete-message"){state.messages=state.messages.filter(x=>x.id!==b.dataset.id);save();render();return}
 if(a==="run-automation")return runSmartAutomation();
 if(a==="generate-message")return updateComposePreview();
 if(a==="copy-compose"){const text=$("#composePreview")?.textContent||"";navigator.clipboard?.writeText(text).then(()=>toast("Message copied","good")).catch(()=>toast("Copy permission unavailable","warn"));return}
 if(a==="whatsapp-compose"){const s=studentById($("#composeStudent")?.value);const text=$("#composePreview")?.textContent||"";if(s&&text){if(whatsapp(s,text)){logMessage(s,text,$("#composeType").value,"Opened");activity("message","Opened WhatsApp for "+s.name);render()}}return}
 if(a==="save-compose"){const s=studentById($("#composeStudent")?.value);const text=$("#composePreview")?.textContent||"";if(!s){toast("Add/select a student","bad");return}logMessage(s,text,$("#composeType").value);activity("message","Saved message for "+s.name);render();toast("Communication saved","good");return}
 if(a==="prepare-announcement"){const aud=$("#annAudience").value,title=$("#annTitle").value.trim(),text=$("#annText").value.trim();if(!text){toast("Write an announcement first","bad");return}const targets=state.students.filter(s=>aud==="all"||s.className===aud);modal("Announcement Ready",`<div class="notice good">${targets.length} recipient(s) selected.</div><h3>${esc(title||"Announcement")}</h3><div class="message-preview">${esc(text)}</div>`,`<div class="actions" style="justify-content:flex-end;margin-top:16px"><button class="btn btn-secondary" data-close>Close</button><button class="btn btn-success" data-open-first-announcement data-student-id="${targets[0]?.id||""}" data-ann-text="${encodeURIComponent(text)}">Open First WhatsApp</button></div>`);return}
 if(a==="open-first-announcement"){const s=studentById(b.dataset.studentId);const text=decodeURIComponent(b.dataset.annText||"");if(s){const msg=vars(text,s,{message:text});if(whatsapp(s,msg)){logMessage(s,msg,"Announcement","Opened");activity("announcement","Opened WhatsApp for "+s.name);closeModal();render()}}return}
 if(a==="save-announcement"){const aud=$("#annAudience").value,title=$("#annTitle").value.trim()||"Announcement",text=$("#annText").value.trim();if(!text){toast("Write an announcement first","bad");return}const count=state.students.filter(s=>aud==="all"||s.className===aud).length;state.announcements.unshift({id:uid(),audience:aud,title,text,count,date:nowISO()});activity("announcement","Saved "+title);save();render();toast("Announcement saved","good");return}
 if(a==="bulk-message"){const ids=state.selectedStudents.filter(id=>studentById(id));if(!ids.length){toast("Select at least one student","bad");return}navigate("compose");setTimeout(()=>{const s=studentById(ids[0]);if(s){$("#composeStudent").value=s.id;updateComposePreview();toast(`${ids.length} selected • first student loaded`,"good")}},0);return}
 if(a==="export-json"){download("parent-communication-backup.json",JSON.stringify({...state},null,2),"application/json");return}
 if(a==="export-csv"){download("students-parent-directory.csv",csv(),"text/csv");return}
 if(a==="print-directory")return printDirectory();
 if(a==="print-history")return printHistory();
 if(a==="toggle-theme"){document.body.classList.toggle("dark");state.settings.theme=document.body.classList.contains("dark")?"dark":"light";save();return}
 if(a==="save-settings"){state.settings.teacherName=$("#setTeacher").value.trim()||"Teacher";state.settings.coachingName=$("#setCoaching").value.trim()||"EZEE VISION CHAMPUA";state.settings.lowAttendance=Math.max(1,Math.min(100,Number($("#setAttendance").value||75)));save();render();toast("Settings saved","good");return}
 if(a==="toggle-autosave"){state.settings.autoSave=state.settings.autoSave===false;save();render();return}
 if(a==="toggle-automation"){state.automation.enabled=!state.automation.enabled;save();if(state.automation.enabled)smartAutomation();render();toast(state.automation.enabled?"Smart automation enabled":"Smart automation disabled","good");return}
 if(a==="toggle-auto-drafts"){state.automation.autoDrafts=!state.automation.autoDrafts;save();render();toast(state.automation.autoDrafts?"Auto drafts enabled":"Auto drafts disabled","good");return}
 if(a==="toggle-pin"){if(state.settings.pinEnabled){state.settings.pinEnabled=false;state.settings.pin="";save();render();toast("PIN lock disabled","good")}else askPin();return}
 if(a==="save-pin"){const p=$("#pinValue").value.trim();if(!/^\d{4,8}$/.test(p)){toast("PIN must be 4–8 digits","bad");return}state.settings.pin=p;state.settings.pinEnabled=true;save();closeModal();render();toast("PIN lock enabled","good");return}
 if(a==="unlock"){if($("#unlockPin").value===state.settings.pin){$("#lockScreen").classList.add("hidden");toast("Unlocked","good")}else toast("Wrong PIN","bad");return}
 if(a==="demo-data"){if(!confirm("Add demo students and sample records?"))return;addDemoData();render();toast("Demo data added","good");return}
 if(a==="clear-data"){if(confirm("Reset all app data on this device? Export a backup first.")){localStorage.removeItem(KEY);location.reload()}return}
 if(a==="about")return showAbout();
});

document.addEventListener("keydown",e=>{if(e.key==="Escape")closeModal();if(e.key.toLowerCase()==="n"&&!/input|textarea|select/i.test(e.target.tagName))navigate("compose");if(e.key.toLowerCase()==="s"&&!/input|textarea|select/i.test(e.target.tagName))navigate("students");if(e.key==="/"&&!/input|textarea|select/i.test(e.target.tagName)){e.preventDefault();$("#studentSearch")?.focus()}});
$("#mobileMenu").onclick=()=>$("#sidebar").classList.toggle("open");
$("#themeBtn").onclick=()=>{document.body.classList.toggle("dark");state.settings.theme=document.body.classList.contains("dark")?"dark":"light";save();render()};
$("#teacherAvatar").onclick=()=>navigate("settings");
$("#notifyBtn").onclick=()=>{const overdue=state.followups.filter(f=>!f.done&&f.due<=today());const smart=state.automation.alerts.filter(a=>!a.read);modal("Notifications",`${smart.length?smart.map(a=>`<div class="notice warn" style="margin-bottom:8px">⚡ <b>${esc(a.title)}</b><br>${esc(a.text)}</div>`).join(""):""}${overdue.length?overdue.map(f=>`<div class="notice warn" style="margin-bottom:8px">🔔 ${esc(f.studentName)} — ${esc(f.note)} (${esc(f.due)})</div>`).join(""):`<div class="notice good">✓ No overdue follow-ups.</div>`}`)};
function tick(){$("#liveDate").textContent=new Date().toLocaleString("en-IN",{weekday:"short",day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"});$("#notifyDot").style.cssText=state.followups.some(f=>!f.done&&f.due<=today())?"display:block;position:absolute;width:7px;height:7px;background:#ef4444;border-radius:50%;margin:-29px 0 0 24px":"display:none"}
function addDemoData(){
 const names=[["Aarav Kumar","Mrs. Kumar","10 A","9876543210",82,500],["Ananya Das","Mr. Das","9 B","9876543211",68,1200],["Rohan Singh","Mrs. Singh","10 A","9876543212",91,0],["Meera Patnaik","Mr. Patnaik","8 A","9876543213",74,800]];
 names.forEach(x=>state.students.push({id:uid(),name:x[0],parent:x[1],className:x[2],phone:x[3],attendance:x[4],feeDue:x[5],roll:String(state.students.length+1),tags:"demo",notes:"Sample record",created:nowISO()}));
 const s=state.students[0];logMessage(s,vars("Dear {{parent_name}}, this is a sample message for {{student_name}}.",s),"General");state.followups.push({id:uid(),studentId:s.id,studentName:s.name,due:today(),note:"Sample follow-up",done:false});activity("demo","Loaded sample teacher data");save();
}
window.addEventListener("beforeunload",()=>safeSave());
setInterval(()=>{if(state.settings.autoSave!==false) safeSave();},15000);
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="hidden")safeSave()});
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();window.__installPrompt=e});
load();if(state.settings.theme==="dark")document.body.classList.add("dark");smartAutomation();navigate("dashboard");tick();setInterval(tick,30000);checkPin();
