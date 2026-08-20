(() => {
"use strict";

const KEY="pcm_pro_v1";
const defaultTemplates=[
 ["General Announcement","Dear {{parentName}},\nThis is to inform you regarding {{studentName}} of Class {{class}}.\n\n{{message}}\n\nRegards,\nTeacher"],
 ["Homework","Dear {{parentName}},\n{{studentName}} has been given homework for {{date}}.\n\n{{message}}\n\nRegards,\nTeacher"],
 ["Exam Reminder","Dear {{parentName}},\nThis is a reminder that {{studentName}} has an upcoming examination.\n\n{{message}}\n\nRegards,\nTeacher"],
 ["Fee Reminder","Dear {{parentName}},\nThis is a gentle reminder regarding the pending fee of ₹{{amount}} for {{studentName}}.\nDue date: {{date}}\n\nRegards,\nTeacher"],
 ["Attendance Alert","Dear {{parentName}},\n{{studentName}}'s current attendance is {{attendance}}%.\nPlease help ensure regular attendance.\n\nRegards,\nTeacher"],
 ["Achievement","Dear {{parentName}},\nCongratulations! {{studentName}} has achieved a wonderful milestone.\n\n{{message}}\n\nRegards,\nTeacher"],
 ["Parent Meeting","Dear {{parentName}},\nA parent meeting is scheduled regarding {{studentName}} on {{date}}.\n\n{{message}}\n\nRegards,\nTeacher"],
 ["Important Notice","Dear {{parentName}},\nImportant notice regarding {{studentName}}:\n\n{{message}}\n\nRegards,\nTeacher"]
];

const state = JSON.parse(localStorage.getItem(KEY)||"null") || {
 students:[], parents:[], communications:[], followups:[], announcements:[], reminders:[],
 templates:defaultTemplates.map((x,i)=>({id:"tpl"+i,name:x[0],body:x[1],default:true})),
 settings:{theme:"light",pin:""}
};
function save(){localStorage.setItem(KEY,JSON.stringify(state))}
function uid(p){return p+Date.now().toString(36)+Math.random().toString(36).slice(2,6)}
function esc(s=""){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function toast(m){const d=document.createElement("div");d.className="toast";d.textContent=m;document.getElementById("toastRoot").append(d);setTimeout(()=>d.remove(),2200)}
function confirmDelete(msg){return window.confirm(msg)}
function today(){return new Date().toISOString().slice(0,10)}
function parentFor(student){return state.parents.find(p=>p.id===student.parentId)}
function studentFor(id){return state.students.find(s=>s.id===id)}
function vars(text,student,parent,extra={}){return text.replace(/\{\{(\w+)\}\}/g,(_,k)=>extra[k]??({studentName:student?.name||"",parentName:parent?.name||"",class:student?.className||"",date:today(),amount:student?.pendingFee||"",attendance:student?.attendance??"",percentage:student?.percentage??"",grade:student?.grade??""}[k]??""))}

const routes={
 dashboard:renderDashboard, students:renderStudents, parents:renderParents, composer:renderComposer,
 history:renderHistory, followups:renderFollowups, announcements:renderAnnouncements,
 directory:renderDirectory, reminders:renderReminders, analytics:renderAnalytics,
 backup:renderBackup, reports:renderReports, templates:renderTemplates, settings:renderSettings
};
const nav=[
 ["dashboard","⌂","Dashboard"],["students","👨‍🎓","Students"],["parents","👪","Parents"],["composer","✉","New Message"],
 ["history","🕘","History"],["followups","✓","Follow-ups"],["announcements","📢","Announcements"],
 ["directory","☎","Parent Directory"],["reminders","⏰","Reminders"],["analytics","📊","Analytics"],
 ["templates","🧩","Templates"],["backup","💾","Backup & Restore"],["reports","🖨","Reports"],["settings","⚙","Settings"]
];
function init(){
 document.getElementById("nav").innerHTML=nav.map(n=>`<button class="nav-item" data-route="${n[0]}">${n[1]} <span>${n[2]}</span></button>`).join("");
 document.addEventListener("click",handleClick);
 document.getElementById("menuBtn").onclick=()=>document.querySelector(".sidebar").classList.toggle("open");
 document.getElementById("themeBtn").onclick=toggleTheme;
 document.getElementById("lockBtn").onclick=lock;
 applyTheme(); route(location.hash.slice(1)||"dashboard");
 setInterval(()=>document.getElementById("clock").textContent=new Date().toLocaleString(),1000);
}
function route(r){if(!routes[r])r="dashboard"; location.hash=r; document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.route===r)); document.querySelector(".sidebar").classList.remove("open"); document.getElementById("pageTitle").textContent=nav.find(x=>x[0]===r)?.[2]||"Dashboard"; routes[r]()}
window.addEventListener("hashchange",()=>route(location.hash.slice(1)));
function handleClick(e){
 const r=e.target.closest("[data-route]"); if(r){route(r.dataset.route);return}
 const a=e.target.closest("[data-action]"); if(!a)return;
 const fn=actions[a.dataset.action]; if(fn)fn(a.dataset.id);
}
const actions={
 addStudent:()=>studentModal(),
 editStudent:id=>studentModal(studentFor(id)),
 deleteStudent:id=>{if(confirmDelete("Delete this student and linked parent relationship?")){state.students=state.students.filter(s=>s.id!==id);save();route("students");toast("Student deleted")}},
 addParent:()=>parentModal(),
 editParent:id=>parentModal(state.parents.find(p=>p.id===id)),
 deleteParent:id=>{if(confirmDelete("Delete this parent?")){state.parents=state.parents.filter(p=>p.id!==id);state.students.forEach(s=>{if(s.parentId===id)s.parentId=""});save();route("parents");toast("Parent deleted")}},
 compose:id=>{route("composer");setTimeout(()=>{const el=document.querySelector("#studentSelect");if(el){el.value=id;el.dispatchEvent(new Event("change"))}},30)},
 copy:()=>navigator.clipboard?.writeText(document.getElementById("messageText")?.value||"").then(()=>toast("Message copied")),
 whatsapp:()=>{const p=state.parents.find(x=>x.id===document.getElementById("parentSelect")?.value);const msg=document.getElementById("messageText")?.value||"";if(!p||!validPhone(p.phone)){toast("Select a valid parent phone");return} window.open("https://wa.me/"+p.phone.replace(/\D/g,"")+"?text="+encodeURIComponent(msg),"_blank")},
 saveCommunication:saveCommunication,
 clearComposer:()=>{document.getElementById("messageText").value="";updatePreview()},
 deleteHistory:id=>{if(confirmDelete("Delete this communication?")){state.communications=state.communications.filter(x=>x.id!==id);save();route("history")}},
 addFollowup:()=>followupModal(),
 completeFollowup:id=>{const f=state.followups.find(x=>x.id===id);if(f){f.completed=!f.completed;save();route("followups")}},
 deleteFollowup:id=>{if(confirmDelete("Delete follow-up?")){state.followups=state.followups.filter(x=>x.id!==id);save();route("followups")}},
 addAnnouncement:()=>announcementModal(),
 deleteAnnouncement:id=>{if(confirmDelete("Delete announcement?")){state.announcements=state.announcements.filter(x=>x.id!==id);save();route("announcements")}},
 addTemplate:()=>templateModal(),
 editTemplate:id=>templateModal(state.templates.find(x=>x.id===id)),
 deleteTemplate:id=>{const t=state.templates.find(x=>x.id===id);if(t.default){toast("Default templates cannot be deleted");return}if(confirmDelete("Delete template?")){state.templates=state.templates.filter(x=>x.id!==id);save();route("templates")}},
 scheduleReminder:()=>reminderModal(),
 deleteReminder:id=>{if(confirmDelete("Delete reminder?")){state.reminders=state.reminders.filter(x=>x.id!==id);save();route("reminders")}},
 exportJSON:()=>download("parent-communication-backup.json",JSON.stringify(state,null,2),"application/json"),
 exportStudents:()=>download("students.csv",csv(state.students), "text/csv"),
 exportParents:()=>download("parents.csv",csv(state.parents), "text/csv"),
 exportHistory:()=>download("communication-history.csv",csv(state.communications),"text/csv"),
 importJSON:()=>document.getElementById("importFile").click(),
 print:()=>window.print(),
 setPin:()=>setPin()
};
function validPhone(p){const d=(p||"").replace(/\D/g,"");return d.length>=10&&d.length<=15}
function csv(arr){if(!arr.length)return "No data\n";const keys=Object.keys(arr[0]);return [keys.join(","),...arr.map(o=>keys.map(k=>`"${String(o[k]??"").replaceAll('"','""')}"`).join(","))].join("\n")}
function download(name,data,type){const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([data],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);toast("Export ready")}

function renderDashboard(){
 const month=new Date().toISOString().slice(0,7), mc=state.communications.filter(x=>x.date.startsWith(month)).length;
 const pending=state.followups.filter(x=>!x.completed).length;
 document.getElementById("view").innerHTML=`<div class="content">
 <div class="grid stats">
 ${stat("Students",state.students.length,"👨‍🎓")} ${stat("Parents",state.parents.length,"👪")}
 ${stat("This Month",mc,"✉")} ${stat("Pending Follow-ups",pending,"✓")}
 </div><br>
 <div class="grid two">
 <div class="card"><div class="section-title"><h2>Quick Actions</h2></div><div class="toolbar">
 <button class="primary" data-route="students">Add Student</button><button class="ghost" data-route="composer">Compose Message</button><button class="ghost" data-route="announcements">Announcement</button><button class="ghost" data-route="followups">Follow-up</button></div></div>
 <div class="card"><div class="section-title"><h2>Smart Alerts</h2></div>${alerts()}</div></div><br>
 <div class="card"><div class="section-title"><h2>Recent Communications</h2><button class="ghost small" data-route="history">View all</button></div>${recentComms()}</div></div>`
}
function stat(a,b,c){return `<div class="card stat"><span class="label">${c} ${a}</span><b>${b}</b><span class="muted">Updated now</span></div>`}
function alerts(){
 const low=state.students.filter(s=>Number(s.attendance)<75), fees=state.students.filter(s=>Number(s.pendingFee)>0);
 return `<div class="kpi-list"><div>Low attendance <b>${low.length}</b></div><div>Pending fee cases <b>${fees.length}</b></div><div>Upcoming follow-ups <b>${state.followups.filter(x=>!x.completed&&x.date>=today()).length}</b></div></div>`
}
function recentComms(){const a=state.communications.slice().sort((x,y)=>y.createdAt-x.createdAt).slice(0,6);return a.length?`<div class="table-wrap"><table class="table"><tr><th>Date</th><th>Student</th><th>Type</th><th>Status</th></tr>${a.map(x=>`<tr><td>${x.date}</td><td>${esc(x.studentName)}</td><td><span class="badge">${esc(x.type)}</span></td><td>Saved</td></tr>`).join("")}</table></div>`:`<div class="empty">No communication history yet.</div>`}

function renderStudents(){
 document.getElementById("view").innerHTML=`<div class="content"><div class="toolbar"><input id="studentSearch" class="field" placeholder="Search student..."><select id="classFilter" class="field"><option value="">All classes</option>${[...new Set(state.students.map(s=>s.className))].filter(Boolean).map(c=>`<option>${esc(c)}</option>`).join("")}</select><button class="primary" data-action="addStudent">＋ Add Student</button></div><div class="card" id="studentTable"></div></div>`;
 const draw=()=>{const q=document.getElementById("studentSearch").value.toLowerCase(),c=document.getElementById("classFilter").value;const a=state.students.filter(s=>(s.name+s.studentId).toLowerCase().includes(q)&&(!c||s.className===c));document.getElementById("studentTable").innerHTML=a.length?`<div class="table-wrap"><table class="table"><tr><th>ID</th><th>Student</th><th>Class</th><th>Parent</th><th>Attendance</th><th>Fee</th><th>Actions</th></tr>${a.map(s=>{const p=parentFor(s);return `<tr><td>${esc(s.studentId)}</td><td>${esc(s.name)}</td><td>${esc(s.className)}</td><td>${esc(p?.name||"—")}</td><td>${s.attendance||"—"}%</td><td>₹${s.pendingFee||0}</td><td class="actions"><button class="ghost small" data-action="editStudent" data-id="${s.id}">Edit</button><button class="ghost small" data-action="compose" data-id="${s.id}">Message</button><button class="ghost small danger" data-action="deleteStudent" data-id="${s.id}">Delete</button></td></tr>`}).join("")}</table></div>`:`<div class="empty">No students found. Add your first student.</div>`};draw();document.getElementById("studentSearch").oninput=draw;document.getElementById("classFilter").onchange=draw
}
function renderParents(){
 document.getElementById("view").innerHTML=`<div class="content"><div class="toolbar"><input id="parentSearch" class="field" placeholder="Search parent or phone..."><button class="primary" data-action="addParent">＋ Add Parent</button></div><div class="card" id="parentTable"></div></div>`;
 const draw=()=>{const q=document.getElementById("parentSearch").value.toLowerCase();const a=state.parents.filter(p=>(p.name+p.phone).toLowerCase().includes(q));document.getElementById("parentTable").innerHTML=a.length?`<div class="table-wrap"><table class="table"><tr><th>Parent</th><th>Phone</th><th>Student(s)</th><th>Actions</th></tr>${a.map(p=>`<tr><td>${esc(p.name)}</td><td>${esc(p.phone)}</td><td>${state.students.filter(s=>s.parentId===p.id).map(s=>esc(s.name)).join(", ")||"—"}</td><td class="actions"><button class="ghost small" data-action="editParent" data-id="${p.id}">Edit</button><button class="ghost small" data-action="whatsapp" data-id="${p.id}">WhatsApp</button><button class="ghost small danger" data-action="deleteParent" data-id="${p.id}">Delete</button></td></tr>`).join("")}</table></div>`:`<div class="empty">No parents found.</div>`};draw();document.getElementById("parentSearch").oninput=draw
}
function renderComposer(){
 const types=["General Announcement","Homework","Exam Reminder","Result Update","Fee Reminder","Attendance Alert","Low Attendance Warning","Achievement","Birthday","Parent Meeting","Important Notice","Custom Message"];
 document.getElementById("view").innerHTML=`<div class="content"><div class="grid two"><div class="card"><div class="section-title"><h2>Compose</h2></div>
 <label class="label">Student</label><select id="studentSelect" class="field" style="width:100%"><option value="">Select student</option>${state.students.map(s=>`<option value="${s.id}">${esc(s.name)} — ${esc(s.className)}</option>`).join("")}</select>
 <label class="label">Parent</label><select id="parentSelect" class="field" style="width:100%"><option value="">Select parent</option>${state.parents.map(p=>`<option value="${p.id}">${esc(p.name)} — ${esc(p.phone)}</option>`).join("")}</select>
 <label class="label">Message type</label><select id="typeSelect" class="field" style="width:100%">${types.map(t=>`<option>${t}</option>`).join("")}</select>
 <label class="label">Template</label><select id="templateSelect" class="field" style="width:100%"><option value="">Blank / custom</option>${state.templates.map(t=>`<option value="${t.id}">${esc(t.name)}</option>`).join("")}</select>
 <label class="label">Message</label><textarea id="messageText" class="message-box" maxlength="2000" placeholder="Write your message..."></textarea><div class="counter"><span id="charCount">0</span>/2000</div>
 <div class="toolbar"><button class="primary" data-action="saveCommunication">Save History</button><button class="ghost" data-action="copy">Copy</button><button class="ghost" data-action="whatsapp">WhatsApp</button><button class="ghost" data-action="clearComposer">Clear</button></div></div>
 <div class="card"><div class="section-title"><h2>Live Preview</h2></div><div id="preview" class="preview">Select a student and enter a message.</div><hr><div class="muted">Available variables: {{studentName}}, {{parentName}}, {{class}}, {{date}}, {{amount}}, {{attendance}}, {{percentage}}, {{grade}}</div></div></div></div>`;
 ["studentSelect","parentSelect","typeSelect","templateSelect","messageText"].forEach(id=>document.getElementById(id).addEventListener("input",updatePreview));
 document.getElementById("studentSelect").onchange=()=>{const s=studentFor(document.getElementById("studentSelect").value);if(s?.parentId)document.getElementById("parentSelect").value=s.parentId;updatePreview()};
 document.getElementById("templateSelect").onchange=()=>{const t=state.templates.find(x=>x.id===document.getElementById("templateSelect").value);if(t){document.getElementById("messageText").value=t.body;updatePreview()}};
 updatePreview()
}
function updatePreview(){const s=studentFor(document.getElementById("studentSelect")?.value),p=state.parents.find(x=>x.id===document.getElementById("parentSelect")?.value);const txt=document.getElementById("messageText")?.value||"";if(document.getElementById("charCount"))document.getElementById("charCount").textContent=txt.length;if(document.getElementById("preview"))document.getElementById("preview").textContent=vars(txt,s,p,{message:txt})}
function saveCommunication(){
 const s=studentFor(document.getElementById("studentSelect").value),p=state.parents.find(x=>x.id===document.getElementById("parentSelect").value),msg=document.getElementById("messageText").value,type=document.getElementById("typeSelect").value;
 if(!s||!p||!msg.trim()){toast("Select student, parent and message");return}
 state.communications.push({id:uid("com"),date:today(),createdAt:Date.now(),studentId:s.id,parentId:p.id,studentName:s.name,parentName:p.name,type,message:vars(msg,s,p,{message:msg}),phone:p.phone});save();toast("Communication saved")
}
function renderHistory(){
 document.getElementById("view").innerHTML=`<div class="content"><div class="toolbar"><input id="historySearch" class="field" placeholder="Search history..."><select id="historyType" class="field"><option value="">All types</option>${[...new Set(state.communications.map(x=>x.type))].map(t=>`<option>${esc(t)}</option>`).join("")}</select><button class="ghost" data-action="exportHistory">Export CSV</button></div><div class="card" id="historyTable"></div></div>`;
 const draw=()=>{const q=document.getElementById("historySearch").value.toLowerCase(),t=document.getElementById("historyType").value,a=state.communications.filter(x=>(x.studentName+x.parentName+x.message+x.type).toLowerCase().includes(q)&&(!t||x.type===t)).sort((a,b)=>b.createdAt-a.createdAt);document.getElementById("historyTable").innerHTML=a.length?`<div class="table-wrap"><table class="table"><tr><th>Date</th><th>Student</th><th>Parent</th><th>Type</th><th>Message</th><th></th></tr>${a.map(x=>`<tr><td>${x.date}</td><td>${esc(x.studentName)}</td><td>${esc(x.parentName)}</td><td><span class="badge">${esc(x.type)}</span></td><td>${esc(x.message).slice(0,80)}${x.message.length>80?"…":""}</td><td><button class="ghost small danger" data-action="deleteHistory" data-id="${x.id}">Delete</button></td></tr>`).join("")}</table></div>`:`<div class="empty">No communication history.</div>`};draw();document.getElementById("historySearch").oninput=draw;document.getElementById("historyType").onchange=draw
}
function renderFollowups(){
 document.getElementById("view").innerHTML=`<div class="content"><div class="toolbar"><button class="primary" data-action="addFollowup">＋ Create Follow-up</button></div><div class="card">${state.followups.length?`<div class="table-wrap"><table class="table"><tr><th>Date</th><th>Student</th><th>Note</th><th>Status</th><th></th></tr>${state.followups.sort((a,b)=>a.date.localeCompare(b.date)).map(f=>`<tr><td>${f.date}</td><td>${esc(f.studentName)}</td><td>${esc(f.note)}</td><td>${f.completed?"Completed":"Pending"}</td><td class="actions"><button class="ghost small" data-action="completeFollowup" data-id="${f.id}">${f.completed?"Reopen":"Complete"}</button><button class="ghost small danger" data-action="deleteFollowup" data-id="${f.id}">Delete</button></td></tr>`).join("")}</table></div>`:`<div class="empty">No follow-ups created.</div>`}</div></div>`
}
function renderAnnouncements(){
 document.getElementById("view").innerHTML=`<div class="content"><div class="toolbar"><button class="primary" data-action="addAnnouncement">＋ Create Announcement</button></div><div class="card">${state.announcements.length?`<div class="table-wrap"><table class="table"><tr><th>Date</th><th>Title</th><th>Audience</th><th>Message</th><th></th></tr>${state.announcements.slice().reverse().map(a=>`<tr><td>${a.date}</td><td>${esc(a.title)}</td><td>${esc(a.audience)}</td><td>${esc(a.message).slice(0,90)}</td><td><button class="ghost small danger" data-action="deleteAnnouncement" data-id="${a.id}">Delete</button></td></tr>`).join("")}</table></div>`:`<div class="empty">No announcements yet.</div>`}</div></div>`
}
function renderDirectory(){
 document.getElementById("view").innerHTML=`<div class="content"><div class="card"><div class="section-title"><h2>Parent Directory</h2><button class="ghost" data-action="print">Print A4</button></div>${state.parents.length?`<div class="grid three">${state.parents.map(p=>`<div class="card"><b>${esc(p.name)}</b><p class="muted">📞 ${esc(p.phone)}</p><p>Students: ${state.students.filter(s=>s.parentId===p.id).map(s=>esc(s.name)).join(", ")||"—"}</p><button class="primary small" data-route="composer">Quick Message</button></div>`).join("")}</div>`:`<div class="empty">Parent directory is empty.</div>`}</div></div>`
}
function renderReminders(){
 document.getElementById("view").innerHTML=`<div class="content"><div class="toolbar"><button class="primary" data-action="scheduleReminder">＋ Schedule Reminder</button></div><div class="card">${state.reminders.length?`<div class="table-wrap"><table class="table"><tr><th>Date</th><th>Time</th><th>Student</th><th>Message</th><th></th></tr>${state.reminders.sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time)).map(r=>`<tr><td>${r.date}</td><td>${r.time}</td><td>${esc(r.studentName)}</td><td>${esc(r.message)}</td><td><button class="ghost small danger" data-action="deleteReminder" data-id="${r.id}">Delete</button></td></tr>`).join("")}</table></div>`:`<div class="empty">No scheduled reminders.</div>`}</div></div>`
}
function renderAnalytics(){
 const total=state.communications.length,byType={};state.communications.forEach(x=>byType[x.type]=(byType[x.type]||0)+1);const max=Math.max(1,...Object.values(byType));
 document.getElementById("view").innerHTML=`<div class="content"><div class="grid stats">${stat("Total Communications",total,"✉")}${stat("Follow-ups",state.followups.length,"✓")}${stat("Completed",state.followups.filter(x=>x.completed).length,"✓")}${stat("Announcements",state.announcements.length,"📢")}</div><br><div class="card"><div class="section-title"><h2>Message Type Statistics</h2></div>${Object.entries(byType).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<div style="margin:12px 0"><div class="section-title"><span>${esc(k)}</span><b>${v}</b></div><div class="bar"><i style="width:${v/max*100}%"></i></div></div>`).join("")||`<div class="empty">Send some messages to see analytics.</div>`}</div></div>`
}
function renderTemplates(){
 document.getElementById("view").innerHTML=`<div class="content"><div class="toolbar"><button class="primary" data-action="addTemplate">＋ Create Template</button></div><div class="grid two">${state.templates.map(t=>`<div class="card"><div class="section-title"><h2>${esc(t.name)}</h2><span class="badge">${t.default?"Default":"Custom"}</span></div><div class="preview">${esc(t.body)}</div><div class="actions" style="margin-top:10px"><button class="ghost small" data-action="editTemplate" data-id="${t.id}">Edit</button><button class="ghost small danger" data-action="deleteTemplate" data-id="${t.id}">Delete</button></div></div>`).join("")}</div></div>`
}
function renderBackup(){
 document.getElementById("view").innerHTML=`<div class="content"><div class="grid two"><div class="card"><h2>Backup</h2><p class="muted">Export all application data in a versioned JSON structure.</p><button class="primary" data-action="exportJSON">Export JSON Backup</button></div><div class="card"><h2>Restore</h2><p class="muted">Import a previous JSON backup. Existing data will be replaced only after validation.</p><input id="importFile" type="file" accept=".json" hidden><button class="primary" data-action="importJSON">Import JSON</button></div></div><br><div class="card"><h2>CSV Exports</h2><div class="toolbar"><button class="ghost" data-action="exportStudents">Students CSV</button><button class="ghost" data-action="exportParents">Parents CSV</button><button class="ghost" data-action="exportHistory">History CSV</button></div></div></div>`;
 document.getElementById("importFile").onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const x=JSON.parse(r.result);if(!x.students||!x.parents||!x.communications)throw Error();Object.assign(state,x);save();toast("Backup restored");route("dashboard")}catch{toast("Invalid backup file")}};r.readAsText(f)}
}
function renderReports(){document.getElementById("view").innerHTML=`<div class="content"><div class="grid three"><div class="card"><h2>Parent Directory</h2><p>Printable parent and student contact report.</p><button class="primary" data-action="print">Print</button></div><div class="card"><h2>Communication History</h2><p>Use History filters, then print this page.</p><button class="primary" data-route="history">Open History</button></div><div class="card"><h2>Follow-up Report</h2><p>Pending and completed follow-ups.</p><button class="primary" data-route="followups">Open Follow-ups</button></div></div></div>`}
function renderSettings(){document.getElementById("view").innerHTML=`<div class="content"><div class="card"><h2>Privacy & Security</h2><p class="muted">All data stays in this browser unless you export/share it.</p><div class="toolbar"><input id="pinInput" class="field" type="password" maxlength="8" placeholder="${state.settings.pin?"Change PIN":"Set PIN"}"><button class="primary" data-action="setPin">Save PIN</button><button class="ghost" data-action="clearPin">Remove PIN</button></div></div><br><div class="card"><h2>Connected Managers</h2><p>Attendance, Result and Fee integrations read compatible localStorage data when available. Existing modules are not overwritten.</p><div class="muted">Supported keys: ezee_students, attendance records, result records, fee records.</div></div></div>`}
actions.clearPin=()=>{state.settings.pin="";save();toast("PIN removed")}; function setPin(){const v=document.getElementById("pinInput").value.trim();if(v&&!/^\d{4,8}$/.test(v)){toast("PIN must be 4–8 digits");return}state.settings.pin=v;save();toast(v?"PIN saved":"PIN removed")}
function toggleTheme(){state.settings.theme=state.settings.theme==="dark"?"light":"dark";save();applyTheme()}
function applyTheme(){document.documentElement.classList.toggle("dark",state.settings.theme==="dark")}
function lock(){if(!state.settings.pin){toast("Set a PIN first");return}const d=document.createElement("div");d.className="lock";d.innerHTML=`<div class="lock-card"><h2>🔒 App Locked</h2><p>Enter your PIN to continue.</p><input id="unlockPin" type="password" inputmode="numeric" maxlength="8"><button class="primary" style="width:100%" id="unlockBtn">Unlock</button></div>`;document.body.append(d);document.getElementById("unlockBtn").onclick=()=>{if(document.getElementById("unlockPin").value===state.settings.pin)d.remove();else toast("Incorrect PIN")}}
function modal(title,body,submit){const root=document.getElementById("modalRoot");root.innerHTML=`<div class="modal-backdrop"><div class="modal"><h2>${title}</h2>${body}<div class="modal-actions"><button class="ghost" id="cancelModal">Cancel</button><button class="primary" id="submitModal">Save</button></div></div></div>`;document.getElementById("cancelModal").onclick=()=>root.innerHTML="";document.getElementById("submitModal").onclick=()=>{if(submit())root.innerHTML=""}}
function studentModal(s){
 const is=!!s,p=parentFor(s||{});modal(is?"Edit Student":"Add Student",`<div class="form-grid"><label>Name<input id="fName" class="field" style="width:100%" value="${esc(s?.name||"")}"></label><label>Class<input id="fClass" class="field" style="width:100%" value="${esc(s?.className||"")}"></label><label>Parent<select id="fParent" class="field" style="width:100%"><option value="">No parent</option>${state.parents.map(x=>`<option value="${x.id}" ${x.id===s?.parentId?"selected":""}>${esc(x.name)}</option>`).join("")}</select></label><label>Attendance %<input id="fAtt" class="field" style="width:100%" type="number" min="0" max="100" value="${s?.attendance??""}"></label><label>Pending Fee<input id="fFee" class="field" style="width:100%" type="number" min="0" value="${s?.pendingFee??0}"></label><label>Percentage<input id="fPct" class="field" style="width:100%" type="number" min="0" max="100" value="${s?.percentage??""}"></label><label>Grade<input id="fGrade" class="field" style="width:100%" value="${esc(s?.grade||"")}"></label></div>`,()=>{const name=document.getElementById("fName").value.trim(),cls=document.getElementById("fClass").value.trim();if(!name||!cls){toast("Name and class required");return false}const x=s||{id:uid("stu"),studentId:"STU-"+String(state.students.length+1).padStart(4,"0")};Object.assign(x,{name,className:cls,parentId:document.getElementById("fParent").value,attendance:Number(document.getElementById("fAtt").value)||0,pendingFee:Number(document.getElementById("fFee").value)||0,percentage:Number(document.getElementById("fPct").value)||0,grade:document.getElementById("fGrade").value.trim()});if(!is)state.students.push(x);save();route("students");toast(is?"Student updated":"Student added");return true})
}
function parentModal(p){
 const is=!!p;modal(is?"Edit Parent":"Add Parent",`<div class="form-grid"><label>Name<input id="pName" class="field" style="width:100%" value="${esc(p?.name||"")}"></label><label>Phone<input id="pPhone" class="field" style="width:100%" inputmode="tel" value="${esc(p?.phone||"")}"></label><label>Email<input id="pEmail" class="field" style="width:100%" value="${esc(p?.email||"")}"></label><label>Address<input id="pAddress" class="field" style="width:100%" value="${esc(p?.address||"")}"></label></div>`,()=>{const name=document.getElementById("pName").value.trim(),phone=document.getElementById("pPhone").value.trim();if(!name||!validPhone(phone)){toast("Valid name and phone required");return false}const x=p||{id:uid("par")};Object.assign(x,{name,phone,email:document.getElementById("pEmail").value.trim(),address:document.getElementById("pAddress").value.trim()});if(!is)state.parents.push(x);save();route("parents");toast(is?"Parent updated":"Parent added");return true})
}
function followupModal(){modal("Create Follow-up",`<div class="form-grid"><label>Student<select id="fuStudent" class="field" style="width:100%">${state.students.map(s=>`<option value="${s.id}">${esc(s.name)}</option>`).join("")}</select></label><label>Date<input id="fuDate" class="field" style="width:100%" type="date" value="${today()}"></label><label class="full">Note<textarea id="fuNote" class="message-box"></textarea></label></div>`,()=>{const s=studentFor(document.getElementById("fuStudent").value),note=document.getElementById("fuNote").value.trim();if(!s||!note){toast("Student and note required");return false}state.followups.push({id:uid("fu"),studentId:s.id,studentName:s.name,date:document.getElementById("fuDate").value,note,completed:false});save();route("followups");return true})}
function announcementModal(){modal("Create Announcement",`<div class="form-grid"><label>Title<input id="anTitle" class="field" style="width:100%"></label><label>Class<input id="anClass" class="field" style="width:100%" placeholder="e.g. 6"></label><label class="full">Audience<select id="anAudience" class="field" style="width:100%"><option>All Parents</option><option>Selected Class</option><option>Selected Students</option></select></label><label class="full">Message<textarea id="anMsg" class="message-box"></textarea></label></div>`,()=>{const title=document.getElementById("anTitle").value.trim(),msg=document.getElementById("anMsg").value.trim();if(!title||!msg){toast("Title and message required");return false}state.announcements.push({id:uid("an"),date:today(),title,className:document.getElementById("anClass").value.trim(),audience:document.getElementById("anAudience").value,message:msg});save();route("announcements");return true})}
function templateModal(t){const is=!!t;modal(is?"Edit Template":"Create Template",`<label>Name<input id="tName" class="field" style="width:100%" value="${esc(t?.name||"")}"></label><br><label>Body<textarea id="tBody" class="message-box">${esc(t?.body||"")}</textarea></label>`,()=>{const name=document.getElementById("tName").value.trim(),body=document.getElementById("tBody").value.trim();if(!name||!body){toast("Name and body required");return false}const x=t||{id:uid("tpl"),default:false};Object.assign(x,{name,body});if(!is)state.templates.push(x);save();route("templates");return true})}
function reminderModal(){modal("Schedule Reminder",`<div class="form-grid"><label>Student<select id="rStudent" class="field" style="width:100%">${state.students.map(s=>`<option value="${s.id}">${esc(s.name)}</option>`).join("")}</select></label><label>Date<input id="rDate" class="field" style="width:100%" type="date" value="${today()}"></label><label>Time<input id="rTime" class="field" style="width:100%" type="time" value="09:00"></label><label class="full">Message<textarea id="rMsg" class="message-box"></textarea></label></div>`,()=>{const s=studentFor(document.getElementById("rStudent").value),msg=document.getElementById("rMsg").value.trim();if(!s||!msg){toast("Student and message required");return false}state.reminders.push({id:uid("rem"),studentId:s.id,studentName:s.name,date:document.getElementById("rDate").value,time:document.getElementById("rTime").value,message:msg});save();route("reminders");return true})}

init();
})();