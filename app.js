/* ===== AUTENTICAZIONE SUPABASE ===== */
document.body.style.visibility = "hidden";
const authBox = document.createElement("div");
authBox.id = "authBox";
authBox.style.cssText = `
  position:fixed;
  inset:0;
  background:#f8f5f2;
  display:flex;
  align-items:center;
  justify-content:center;
  z-index:99999;
  font-family:Arial,sans-serif;
`;
authBox.innerHTML = `
  <div style="
    width:min(90%,380px);
    background:white;
    padding:32px;
    border-radius:20px;
    box-shadow:0 8px 30px rgba(0,0,0,.10);
    text-align:center;
  ">
    <h1 style="margin-top:0">Casa Familiare</h1>
    <p>Accedi per entrare nell'app</p>
    <input id="authEmail" type="email"
      placeholder="Email"
      style="width:100%;box-sizing:border-box;padding:13px;margin:8px 0;border:1px solid #ddd;border-radius:10px">
    <input id="authPassword" type="password"
      placeholder="Password"
      style="width:100%;box-sizing:border-box;padding:13px;margin:8px 0;border:1px solid #ddd;border-radius:10px">
    <button id="authLogin"
      style="width:100%;padding:13px;margin-top:12px;border:0;border-radius:10px;background:#7ea8d8;color:white;font-size:16px;cursor:pointer">
      Accedi
    </button>
    <p id="authMessage" style="margin-top:15px;font-size:14px"></p>
  </div>
`;
document.body.appendChild(authBox);
async function checkAuth() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session) {
    authBox.remove();
    document.body.style.visibility = "visible";
    renderAll();
  } else {
    document.body.style.visibility = "visible";
    authBox.style.display = "flex";
  }
}
document.getElementById("authLogin").onclick = async () => {
  const email = document.getElementById("authEmail").value.trim();
  const password = document.getElementById("authPassword").value;
  const message = document.getElementById("authMessage");

  if (!email || !password) {
    message.textContent = "Inserisci email e password.";
    return;
  }
  message.textContent = "Accesso in corso...";
  const { error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });
  if (error) {
    message.textContent = "Email o password non corrette.";
    console.error(error);
    return;
  }
  authBox.remove();
  document.body.style.visibility = "visible";
  renderAll();
};
checkAuth();
/* ===== FINE AUTENTICAZIONE ===== */
const PEOPLE={francesca:{name:"Francesca",color:"#e98b96"},alessio:{name:"Alessio",color:"#7ea8d8"},sara:{name:"Sara",color:"#e99bc1"},vera:{name:"Vera",color:"#82bd96"},famiglia:{name:"Famiglia",color:"#aa8bc9"}};
const SHOP_CATS=["dispensa","frutta e verdura","banco frigo","surgelati","farmaci","detersivi","macelleria","salumeria","pescheria"],DAYS=["Lunedì","Martedì","Mercoledì","Giovedì","Venerdì","Sabato","Domenica"],FMEALS=["Colazione","Spuntino","Pranzo","Merenda","Cena"],FKEY=["colazione","spuntino","pranzo","merenda","cena"],AKEY=["pranzo","cena"];
const KEY="casa_familiare_v1";let state=JSON.parse(localStorage.getItem(KEY)||"null")||{menus:{},shopping:{},events:[],notes:[],recipes:[]},menuOffset=0,shopOffset=0,calDate=new Date();
const save=()=>localStorage.setItem(KEY,JSON.stringify(state)),iso=d=>d.toISOString().slice(0,10);
function startOfWeek(d){let x=new Date(d);x.setHours(12,0,0,0);x.setDate(x.getDate()-((x.getDay()+6)%7));return x}
function weekKey(o=0){let d=startOfWeek(new Date);d.setDate(d.getDate()+o*7);return iso(d)}
function fmtWeek(k){let d=new Date(k+"T12:00:00"),e=new Date(d);e.setDate(e.getDate()+6);return d.toLocaleDateString("it-IT",{day:"numeric",month:"short"})+" – "+e.toLocaleDateString("it-IT",{day:"numeric",month:"short",year:"numeric"})}
function fmtDate(k){return new Date(k+"T12:00:00").toLocaleDateString("it-IT",{day:"numeric",month:"long"})}
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function ensure(k){if(!state.menus[k])state.menus[k]={};if(!state.shopping[k])state.shopping[k]=[]}
function show(s){document.querySelectorAll(".screen").forEach(x=>x.classList.toggle("active",x.id===s));document.querySelectorAll(".nav-item").forEach(x=>x.classList.toggle("active",x.dataset.go===s));renderAll();window.scrollTo({top:0,behavior:"smooth"})}
document.querySelectorAll("[data-go]").forEach(b=>b.onclick=()=>show(b.dataset.go));
document.getElementById("todayBtn").onclick=()=>{menuOffset=shopOffset=0;show("home")};

function renderHome(){const wk=weekKey();document.getElementById("homeWeek").textContent=fmtWeek(wk);const today=new Date,day=(today.getDay()+6)%7,m=state.menus[wk]||{},vals=[];["francesca","alessio","sara","vera"].forEach(p=>Object.values(m[p+"_"+day]||{}).forEach(v=>v&&vals.push(v)));document.getElementById("todayMenuSummary").textContent=vals.length?vals.slice(0,2).join(" · "):"Nessun menu inserito";const sh=state.shopping[wk]||[];document.getElementById("shoppingSummary").textContent=sh.length?sh.filter(x=>!x.done).length+" da acquistare":"Lista vuota";const f=state.events.filter(e=>e.date>=iso(today)).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));document.getElementById("eventsSummary").textContent=f.length?fmtDate(f[0].date)+(f[0].time?" · "+f[0].time:""):"Nessun impegno";document.getElementById("notesSummary").textContent=state.notes.filter(n=>!n.done).length+" note da ricordare"}
function renderMenu(){const k=weekKey(menuOffset);ensure(k);document.getElementById("menuWeekLabel").textContent=fmtWeek(k);let h="";[["francesca","Francesca",FMEALS,FKEY],["alessio","Alessio",["Pranzo","Cena"],AKEY],["sara","Sara",["Pranzo","Cena"],AKEY],["vera","Vera",["Pranzo","Cena"],AKEY]].forEach(([p,n,meals,keys])=>{h+=`<div class="menu-person"><div class="person-title"><i class="dot" style="background:${PEOPLE[p].color}"></i><h3>${n}</h3></div>`;for(let i=0;i<7;i++){let o=state.menus[k][p+"_"+i]||{};h+=`<div class="menu-day"><div class="day-name">${DAYS[i]}</div>`;meals.forEach((meal,j)=>h+=`<div class="meal-line"><span class="meal-label">${meal}</span><input class="meal-input" data-p="${p}" data-d="${i}" data-m="${keys[j]}" value="${esc(o[keys[j]]||"")}" placeholder="…"></div>`);h+="</div>"}h+="</div>"});document.getElementById("menuContent").innerHTML=h;document.querySelectorAll(".meal-input").forEach(i=>i.oninput=e=>{let k=weekKey(menuOffset),id=e.target.dataset.p+"_"+e.target.dataset.d,o=state.menus[k][id]||{};o[e.target.dataset.m]=e.target.value;state.menus[k][id]=o;save();renderHome()})}
document.getElementById("menuPrev").onclick=()=>{menuOffset--;renderMenu()};document.getElementById("menuNext").onclick=()=>{menuOffset++;renderMenu()};document.getElementById("copyMenuBtn").onclick=()=>{let k=weekKey(menuOffset),p=weekKey(menuOffset-1);if(!state.menus[p])return alert("La settimana precedente è vuota.");state.menus[k]=JSON.parse(JSON.stringify(state.menus[p]));save();renderMenu()};

function renderShopping(){const k=weekKey(shopOffset);ensure(k);document.getElementById("shopWeekLabel").textContent=fmtWeek(k);let h="";SHOP_CATS.forEach(cat=>{let a=state.shopping[k].filter(x=>x.cat===cat);h+=`<div class="shop-category"><h3>${cat}</h3>`;if(!a.length)h+=`<div class="recipe-meta">Nessun prodotto</div>`;a.forEach(x=>h+=`<div class="shop-item ${x.done?"done":""}"><input type="checkbox" ${x.done?"checked":""} data-id="${x.id}"><span>${esc(x.text)}</span><button class="delete" data-del="${x.id}">×</button></div>`);h+="</div>"});document.getElementById("shoppingContent").innerHTML=h;document.querySelectorAll("[data-id]").forEach(c=>c.onchange=()=>{state.shopping[k].find(x=>x.id===c.dataset.id).done=c.checked;save();renderShopping();renderHome()});document.querySelectorAll("[data-del]").forEach(b=>b.onclick=()=>{state.shopping[k]=state.shopping[k].filter(x=>x.id!==b.dataset.del);save();renderShopping();renderHome()})}
document.getElementById("shopPrev").onclick=()=>{shopOffset--;renderShopping()};document.getElementById("shopNext").onclick=()=>{shopOffset++;renderShopping()};document.getElementById("shoppingCategory").innerHTML=SHOP_CATS.map(x=>`<option>${x}</option>`).join("");
document.getElementById("addShoppingBtn").onclick=()=>{let i=document.getElementById("shoppingInput"),c=document.getElementById("shoppingCategory").value;if(!i.value.trim())return;let k=weekKey(shopOffset);ensure(k);state.shopping[k].push({id:crypto.randomUUID(),text:i.value.trim(),cat:c,done:false});i.value="";save();renderShopping();renderHome()};
document.getElementById("clearBoughtBtn").onclick=()=>{let k=weekKey(shopOffset);state.shopping[k]=(state.shopping[k]||[]).filter(x=>!x.done);save();renderShopping();renderHome()};
document.getElementById("copyShoppingBtn").onclick=()=>{let k=weekKey(shopOffset),p=weekKey(shopOffset-1),a=state.shopping[p]||[];if(!a.length)return alert("La settimana precedente è vuota.");state.shopping[k]=a.map(x=>({...x,id:crypto.randomUUID(),done:false}));save();renderShopping();renderHome()};

function renderCalendar(){let y=calDate.getFullYear(),m=calDate.getMonth();document.getElementById("calendarTitle").textContent=new Date(y,m,1).toLocaleDateString("it-IT",{month:"long",year:"numeric"});document.getElementById("legend").innerHTML=Object.values(PEOPLE).map(p=>`<span><i style="background:${p.color}"></i>${p.name}</span>`).join("");let first=new Date(y,m,1),start=(first.getDay()+6)%7,days=new Date(y,m+1,0).getDate(),pd=new Date(y,m,0).getDate(),today=iso(new Date),h="";for(let i=0;i<42;i++){let n=i-start+1,dt,muted=false;if(n<1){dt=new Date(y,m-1,pd+n);muted=true}else if(n>days){dt=new Date(y,m+1,n-days);muted=true}else dt=new Date(y,m,n);let k=iso(dt),ev=state.events.filter(e=>e.date===k);h+=`<div class="calendar-cell ${muted?"muted":""} ${k===today?"today":""}"><div class="calendar-num">${dt.getDate()}</div>${ev.slice(0,3).map(e=>`<span class="event-chip" style="background:${PEOPLE[e.person].color}33">${esc(e.title)}</span>`).join("")}</div>`}document.getElementById("calendarGrid").innerHTML=h;let me=state.events.filter(e=>{let d=new Date(e.date+"T12:00:00");return d.getFullYear()===y&&d.getMonth()===m}).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));document.getElementById("eventList").innerHTML=me.length?me.map(e=>`<div class="event-card"><div class="event-bar" style="background:${PEOPLE[e.person].color}"></div><div style="flex:1"><strong>${esc(e.title)}</strong><small>${PEOPLE[e.person].name} · ${fmtDate(e.date)}${e.time?" · "+e.time:""}</small>${e.note?`<div class="recipe-preview">${esc(e.note)}</div>`:""}</div><button class="delete" data-event="${e.id}">×</button></div>`).join(""):`<p class="recipe-meta">Nessun impegno questo mese.</p>`;document.querySelectorAll("[data-event]").forEach(b=>b.onclick=()=>{state.events=state.events.filter(e=>e.id!==b.dataset.event);save();renderCalendar();renderHome()})}
document.getElementById("calPrev").onclick=()=>{calDate.setMonth(calDate.getMonth()-1);renderCalendar()};document.getElementById("calNext").onclick=()=>{calDate.setMonth(calDate.getMonth()+1);renderCalendar()};
document.getElementById("addEventBtn").onclick=()=>{document.getElementById("modalCard").innerHTML=`<h2>Nuovo impegno</h2><div class="form-grid"><select id="eventPerson">${Object.entries(PEOPLE).map(([k,p])=>`<option value="${k}">${p.name}</option>`).join("")}</select><input id="eventTitle" placeholder="Titolo dell'impegno"><input id="eventDate" type="date" value="${iso(new Date)}"><input id="eventTime" type="time"><textarea id="eventNote" placeholder="Nota (facoltativa)"></textarea></div><div class="modal-actions"><button class="secondary-btn" id="closeModal">Annulla</button><button class="primary-btn" id="saveEvent">Salva</button></div>`;openModal();document.getElementById("closeModal").onclick=closeModal;document.getElementById("saveEvent").onclick=()=>{let title=document.getElementById("eventTitle").value.trim(),date=document.getElementById("eventDate").value;if(!title||!date)return;state.events.push({id:crypto.randomUUID(),person:document.getElementById("eventPerson").value,title,date,time:document.getElementById("eventTime").value,note:document.getElementById("eventNote").value.trim()});save();closeModal();renderCalendar();renderHome()}};

function renderNotes(){document.getElementById("notesContent").innerHTML=state.notes.length?state.notes.map(n=>`<div class="note-card ${n.done?"done":""}"><input type="checkbox" ${n.done?"checked":""} data-note="${n.id}"><span style="flex:1">${esc(n.text)}</span><button class="delete" data-note-del="${n.id}">×</button></div>`).join(""):`<p class="recipe-meta">Ancora nessuna nota.</p>`;document.querySelectorAll("[data-note]").forEach(x=>x.onchange=()=>{state.notes.find(n=>n.id===x.dataset.note).done=x.checked;save();renderNotes();renderHome()});document.querySelectorAll("[data-note-del]").forEach(x=>x.onclick=()=>{state.notes=state.notes.filter(n=>n.id!==x.dataset.noteDel);save();renderNotes();renderHome()})}
document.getElementById("addNoteBtn").onclick=()=>{let i=document.getElementById("noteInput");if(!i.value.trim())return;state.notes.unshift({id:crypto.randomUUID(),text:i.value.trim(),done:false});i.value="";save();renderNotes();renderHome()};
function renderRecipes(){let q=document.getElementById("recipeSearch").value.toLowerCase(),a=state.recipes.filter(r=>(r.name+" "+r.category+" "+r.ingredients).toLowerCase().includes(q));document.getElementById("recipesContent").innerHTML=a.length?a.map(r=>`<div class="recipe-card"><h3>${esc(r.name)}</h3><div class="recipe-meta">${esc(r.category||"Ricetta")}</div><div class="recipe-preview"><b>Ingredienti:</b> ${esc(r.ingredients)}${r.steps?`

<b>Preparazione:</b> ${esc(r.steps)}`:""}</div><button class="delete" data-recipe="${r.id}">Elimina</button></div>`).join(""):`<p class="recipe-meta">Nessuna ricetta${q?" trovata":""}.</p>`;document.querySelectorAll("[data-recipe]").forEach(x=>x.onclick=()=>{state.recipes=state.recipes.filter(r=>r.id!==x.dataset.recipe);save();renderRecipes()})}
document.getElementById("recipeSearch").oninput=renderRecipes;document.getElementById("addRecipeBtn").onclick=()=>{document.getElementById("modalCard").innerHTML=`<h2>Nuova ricetta</h2><div class="form-grid"><input id="recipeName" placeholder="Nome ricetta"><input id="recipeCat" placeholder="Categoria"><textarea id="recipeIng" placeholder="Ingredienti"></textarea><textarea id="recipeSteps" placeholder="Preparazione"></textarea></div><div class="modal-actions"><button class="secondary-btn" id="closeModal">Annulla</button><button class="primary-btn" id="saveRecipe">Salva</button></div>`;openModal();document.getElementById("closeModal").onclick=closeModal;document.getElementById("saveRecipe").onclick=()=>{let n=document.getElementById("recipeName").value.trim();if(!n)return;state.recipes.unshift({id:crypto.randomUUID(),name:n,category:document.getElementById("recipeCat").value.trim(),ingredients:document.getElementById("recipeIng").value.trim(),steps:document.getElementById("recipeSteps").value.trim()});save();closeModal();renderRecipes()}};
function openModal(){document.getElementById("modal").classList.remove("hidden")}function closeModal(){document.getElementById("modal").classList.add("hidden")}document.getElementById("modal").onclick=e=>{if(e.target.id==="modal")closeModal()};
function renderAll(){renderHome();renderMenu();renderShopping();renderCalendar();renderNotes();renderRecipes()}if("serviceWorker"in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("service-worker.js").catch(()=>{}));renderAll();
