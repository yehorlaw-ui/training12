import {firebaseConfig as FC,START} from "./config.js";
import {WEEKS,DAYS,ANN,GEN} from "./plan.js";
const G="https://www.gstatic.com/firebasejs/10.12.2/";
import {initializeApp} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {getAuth,onAuthStateChanged,signInWithEmailAndPassword,createUserWithEmailAndPassword,signOut} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {initializeFirestore,persistentLocalCache,persistentMultipleTabManager,collection,doc,setDoc,onSnapshot} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
const $=document.getElementById("app"),DAY=864e5,st=new Date(START+"T00:00");
const S={tab:"w",logs:{},body:{},photos:{},user:null,wk:1,day:null,open:null,sel:null};
const iso=d=>new Date(d-d.getTimezoneOffset()*6e4).toISOString().slice(0,10);
const dateOf=(w,o)=>{const d=new Date(st);d.setDate(d.getDate()+(w-1)*7+o);return d};
const fmt=d=>d.toLocaleDateString("ru-RU",{day:"2-digit",month:"2-digit"});
const today=()=>{const d=new Date();d.setHours(0,0,0,0);return d};
const NAME={};DAYS.forEach(d=>d.ex.forEach(e=>NAME[d.id+e[0]]=e[1]+" ("+d.t.split(" ·")[0]+")"));
const nums=s=>String(s||"").split(/[\/\s,;]+/).map(Number).filter(n=>n>0);
S.wk=Math.min(12,Math.max(1,Math.floor((today()-st)/DAY/7)+1));
DAYS.forEach(d=>{if(iso(dateOf(S.wk,d.o))===iso(today()))S.day=d.id});
let db,auth,unsubs=[];
const ready=!FC.apiKey.startsWith("ВСТАВЬ");
if(ready){const app=initializeApp(FC);auth=getAuth(app);
 db=initializeFirestore(app,{localCache:persistentLocalCache({tabManager:persistentMultipleTabManager()})});
 onAuthStateChanged(auth,u=>{unsubs.forEach(f=>f());unsubs=[];S.user=u;
  if(u)["logs","body","photos"].forEach(k=>unsubs.push(onSnapshot(collection(db,"users",u.uid,k),s=>{S[k]={};s.forEach(x=>S[k][x.id]=x.data());render()})));
  render(true)})}
else render(true);
const put=(c,id,data)=>setDoc(doc(db,"users",S.user.uid,c,id),data);
function lastLog(id,w){return Object.values(S.logs).filter(l=>l.ex===id&&l.wk<w).sort((a,b)=>b.wk-a.wk)[0]}
function chart(p){if(!p.length)return'<p class="mu">Пока нет данных</p>';
 const ys=p.map(a=>a[1]),mn=Math.min(...ys),mx=Math.max(...ys),sp=mx-mn||1,W=320,H=120,n=p.length;
 const X=i=>10+(n>1?i*(W-20)/(n-1):(W-20)/2),Y=y=>H-14-(y-mn)/sp*(H-40);
 return`<svg viewBox="0 0 ${W} ${H}"><polyline fill="none" stroke="var(--ac)" stroke-width="2" points="${p.map((a,i)=>X(i)+","+Y(a[1])).join(" ")}"/>${p.map((a,i)=>`<circle cx="${X(i)}" cy="${Y(a[1])}" r="3" fill="var(--ac)"/>${n<=10||i==0||i==n-1?`<text x="${X(i)}" y="${Y(a[1])-8}" text-anchor="middle">${a[1]}</text>`:""}`).join("")}</svg><div class="ax"><span>${p[0][0]}</span><span>${p[n-1][0]}</span></div>`}
function authView(){return`<main><h2>12 недель</h2>${ready?`<p class="mu">Войди, чтобы данные синхронизировались между устройствами.</p><div class="row" style="margin-top:14px"><input id="em" type="email" placeholder="Email" autocomplete="username"><input id="pw" type="password" placeholder="Пароль (от 6 символов)" autocomplete="current-password"></div><div class="row"><button class="pri" data-a="si">Войти</button><button data-a="su">Создать аккаунт</button></div>`:`<div class="card"><b>Нужна настройка Firebase</b><p>Заполни файл config.js по инструкции из README.md.</p></div>`}</main>`}
function exRow(w,d,e){const[k,n,s,lo,hi,rs,note]=e,id=d.id+k,L=S.logs[w+"_"+id]||{},pv=lastLog(id,w);let h="Прошлых данных нет";
 if(pv){const r=nums(pv.reps);h=`Прошлый раз: ${pv.w} кг · ${pv.reps}`+(r.length>=s&&r.every(x=>x>=hi)?" · пора добавить вес":"")}
 return`<div class="ex"><div class="er"><b data-a="ann" data-v="${k}">${n}</b><span>${s}×${lo}–${hi}</span></div><small>${note?note+" · ":""}${h}</small><div class="ir" data-id="${id}"><input type="number" step="0.5" inputmode="decimal" placeholder="кг" value="${L.w??""}" aria-label="Вес"><input placeholder="6/6/5/5" value="${L.reps||""}" aria-label="Повторения"><button data-a="tm" data-v="${rs}">${rs/60}&nbsp;мин</button></div></div>`}
function wView(){const w=S.wk,[t,r]=WEEKS[w-1],dl=w==4||w==8;
 let h=`<div class="hd"><button data-a="pw" aria-label="Назад">‹</button><div><b>Неделя ${w} из 12</b><small>${fmt(dateOf(w,0))} – ${fmt(dateOf(w,6))}</small></div><button data-a="nw" aria-label="Вперёд">›</button></div><div class="card${dl?" dl":""}"><b>${t}</b><p>${r}</p></div>`;
 DAYS.forEach(d=>{const dt=dateOf(w,d.o),done=d.ex.filter(e=>S.logs[w+"_"+d.id+e[0]]).length;
  h+=`<div class="day${iso(dt)==iso(today())?" today":""}"><div class="dh" data-a="day" data-v="${d.id}"><span>${d.wd} ${fmt(dt)}</span><b>${d.t}</b><em>${done}/${d.ex.length}</em></div>${S.day===d.id?d.ex.map(e=>exRow(w,d,e)).join(""):""}</div>`});
 return h+`<p class="mu" style="margin-top:14px">Вводи рабочий вес и повторения по подходам через /. Таймер отдыха — кнопка справа.</p>`}
function aView(){return`<h2>Аннотации</h2>`+GEN.map(g=>`<details><summary>${g[0]}</summary><p>${g[1]}</p></details>`).join("")+`<h3>Техника упражнений</h3>`+Object.entries(ANN).map(([k,a])=>`<details id="a_${k}"${S.open==k?" open":""}><summary>${a[0]}</summary><p>${a[1]}</p></details>`).join("")}
function sView(){const b=Object.entries(S.body).sort((a,c)=>a[0]<c[0]?-1:1),wk={};
 b.forEach(([d,v])=>{if(v.weight){const k=Math.floor((new Date(d+"T00:00")-st)/DAY/7);(wk[k]=wk[k]||[]).push(v.weight)}});
 const wp=Object.keys(wk).map(Number).sort((a,c)=>a-c).map(k=>[k>=0?"Н"+(k+1):"до старта",+(wk[k].reduce((a,c)=>a+c)/wk[k].length).toFixed(1)]);
 const wa=b.filter(x=>x[1].waist).map(x=>[x[0].slice(5),x[1].waist]);
 const ids=[...new Set(Object.values(S.logs).map(l=>l.ex))];if(!S.sel||!ids.includes(S.sel))S.sel=ids[0];
 const sp=Object.values(S.logs).filter(l=>l.ex===S.sel).sort((a,c)=>a.wk-c.wk||(a.d<c.d?-1:1)).map(l=>["Н"+l.wk,+(l.w*(1+Math.max(0,...nums(l.reps))/30)).toFixed(1)]);
 const ph=Object.entries(S.photos).sort((a,c)=>a[0]<c[0]?-1:1);
 return`<h2>Статистика</h2><div class="row three"><input type="date" id="bd" value="${iso(new Date())}"><input type="number" step="0.1" inputmode="decimal" id="bw" placeholder="Вес, кг"><input type="number" step="0.5" inputmode="decimal" id="bt" placeholder="Талия, см"></div><button class="pri" data-a="sb" style="width:100%">Сохранить замер</button>
<h3>Вес, среднее за неделю (кг)</h3>${chart(wp)}<h3>Талия (см)</h3>${chart(wa)}
<h3>Силовые: расчётный 1ПМ (Эпли)</h3>${ids.length?`<select id="se">${ids.map(i=>`<option value="${i}"${i==S.sel?" selected":""}>${NAME[i]||i}</option>`).join("")}</select>${chart(sp)}`:'<p class="mu">Появится после первых записей в тренировках.</p>'}
<p class="mu" style="margin-top:8px">Ориентиры: жим 70–75×10, присед 90–95×10, становая 90–100×10, подтягивания 10–12. Расчёт приблизителен, максимум не тестируй.</p>
<h3>Фото прогресса (раз в 4 недели)</h3><input type="file" accept="image/*" id="pf">
${ph.length>1?`<div class="row" style="margin-top:10px"><div><small>Было ${ph[0][0]}</small><img src="${ph[0][1].img}" style="width:100%;border-radius:8px"></div><div><small>Стало ${ph[ph.length-1][0]}</small><img src="${ph[ph.length-1][1].img}" style="width:100%;border-radius:8px"></div></div>`:""}
<div class="ph" style="margin-top:10px">${ph.map(p=>`<div><img src="${p[1].img}" alt="${p[0]}"><small>${p[0]}</small></div>`).join("")}</div>
<button data-a="out" style="margin-top:24px">Выйти</button>`}
function render(force){if(!force&&document.activeElement&&/INPUT|SELECT/.test(document.activeElement.tagName))return;
 if(!S.user){$.innerHTML=authView();return}
 const v=S.tab=="w"?wView():S.tab=="a"?aView():sView();
 $.innerHTML=`<main>${v}</main><nav>${[["w","Тренировка"],["a","Аннотации"],["s","Статистика"]].map(t=>`<button data-a="tab" data-v="${t[0]}" class="${S.tab==t[0]?"on":""}">${t[1]}</button>`).join("")}</nav>`}
let T,tt;function tick(){const el=document.getElementById("tm"),r=Math.ceil((tt-Date.now())/1e3);
 if(r<=0){clearInterval(T);el.hidden=true;navigator.vibrate?.([200,100,200]);return}el.hidden=false;el.querySelector("span").textContent=Math.floor(r/60)+":"+String(r%60).padStart(2,"0")}
async function shrink(f){const b=await createImageBitmap(f);let m=1000,q=.7,u;for(let i=0;i<8;i++){const k=Math.min(1,m/Math.max(b.width,b.height)),c=document.createElement("canvas");c.width=b.width*k;c.height=b.height*k;c.getContext("2d").drawImage(b,0,0,c.width,c.height);u=c.toDataURL("image/jpeg",q);if(u.length<270000)break;m*=.8;q-=.05}return u}
document.addEventListener("click",async e=>{const t=e.target.closest("[data-a]");if(!t)return;const a=t.dataset.a,v=t.dataset.v;
 if(a=="tab"){S.tab=v}else if(a=="pw"){S.wk=Math.max(1,S.wk-1);S.day=null}else if(a=="nw"){S.wk=Math.min(12,S.wk+1);S.day=null}
 else if(a=="day"){S.day=S.day==v?null:v}else if(a=="ann"){S.tab="a";S.open=v}
 else if(a=="tm"){clearInterval(T);tt=Date.now()+v*1e3;T=setInterval(tick,250);tick();return}
 else if(a=="tx"){clearInterval(T);document.getElementById("tm").hidden=true;return}
 else if(a=="out"){await signOut(auth);return}
 else if(a=="si"||a=="su"){try{const f=a=="si"?signInWithEmailAndPassword:createUserWithEmailAndPassword;await f(auth,document.getElementById("em").value,document.getElementById("pw").value)}catch(x){alert("Ошибка входа: "+x.code)}return}
 else if(a=="sb"){const g=i=>parseFloat(document.getElementById(i).value.replace(",","."))||null,d=document.getElementById("bd").value,o={weight:g("bw"),waist:g("bt")};
  if(!d||(!o.weight&&!o.waist))return alert("Введи вес или талию");await put("body",d,{...(S.body[d]||{}),...Object.fromEntries(Object.entries(o).filter(x=>x[1]))});return}
 render(true);if(a=="ann")document.getElementById("a_"+v)?.scrollIntoView({block:"center"})});
document.addEventListener("change",async e=>{const el=e.target;
 if(el.id=="se"){S.sel=el.value;render(true)}
 else if(el.id=="pf"&&el.files[0]){const d=iso(new Date());await put("photos",d,{img:await shrink(el.files[0]),d})}
 else if(el.closest(".ir")){const r=el.closest(".ir"),[w,p]=r.querySelectorAll("input"),id=r.dataset.id;
  await put("logs",S.wk+"_"+id,{ex:id,wk:S.wk,w:parseFloat(w.value)||0,reps:p.value.trim(),d:iso(new Date())})}});
