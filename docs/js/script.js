import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, get, set, update } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCBahw3ayFaEiqB6QFv9fjHUv1D3xWms-c",
  authDomain: "cazik-959c0.firebaseapp.com",
  databaseURL: "https://cazik-959c0-default-rtdb.firebaseio.com",
  projectId: "cazik-959c0",
  storageBucket: "cazik-959c0.firebasestorage.app",
  messagingSenderId: "57672758285",
  appId: "1:57672758285:web:02243883937c7ff8c01144",
  measurementId: "G-EZXQNPD4D5"
};
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

/* ===== USER ===== */
const userId = "offlineUser"; // заменить на Telegram WebApp userId, если будет
let username = "Player";

let bag = 0, level = 1, multiplier = 1, currentWin = 0, tradeEnabled = true;

/* ===== UI ===== */
function show(id){
 document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));
 document.getElementById(id).classList.add("active");
}
window.openBag = () => show("bag");
window.openTop = () => show("top");
window.openLevel = () => { show("level"); updateLevelUI(); };
window.openTrades = () => show("trades");
window.back = () => show("menu");

/* ===== LOAD BAG ===== */
async function loadBag(){
 const snap = await get(ref(db,"users/"+userId));
 if(snap.exists()){
   const data = snap.val();
   bag = data.bag||0; level=data.level||1; multiplier=data.multiplier||1;
 } else {
   await set(ref(db,"users/"+userId),{name:username, bag:0, level:1, multiplier:1});
 }
 document.getElementById("bagAmount").innerText = bag;
 updateLevelUI();
}
loadBag();

/* ===== TRADES ===== */
window.toggleTrades = () => {
 tradeEnabled=!tradeEnabled;
 document.getElementById("tradeStatus").innerText = tradeEnabled?"Трейды включены":"Трейды отключены";
}
window.sendTrade = async () => {
 if(!tradeEnabled){ alert("Трейды отключены"); return; }
 const targetName=document.getElementById("tradeUser").value.trim();
 const amount=Number(document.getElementById("tradeAmount").value);
 if(!targetName||!amount||amount<=0){alert("Введите игрока и сумму"); return;}
 if(amount>bag){alert("Недостаточно денег"); return;}
 bag-=amount;
 await update(ref(db,"users/"+userId),{bag});
 document.getElementById("bagAmount").innerText=bag;
 document.getElementById("tradeResult").innerText=`Трейд: ${amount} → ${targetName}`;
}

/* ===== КАЗИНО ===== */
window.roll = async ()=>{
 const bet=Number(document.getElementById("bet").value);
 if(!bet||bet<=0){alert("Введите ставку"); return;}
 if(bet>bag){alert("Недостаточно денег"); return;}
 bag-=bet; document.getElementById("bagAmount").innerText=bag;
 show("loading");
 setTimeout(()=>{
   let d1=Math.floor(Math.random()*6)+1;
   let d2=Math.floor(Math.random()*6)+1;
   let sum=d1+d2;
   if(sum<=6) currentWin=0;
   else if(sum<=9) currentWin=Math.floor(bet*1.5*multiplier);
   else currentWin=Math.floor(bet*2.2*multiplier);
   document.getElementById("diceResult").innerText=`Выпало: ${d1} и ${d2}`;
   document.getElementById("winResult").innerText=currentWin===0?"Проигрыш 💀":`Выигрыш: ${currentWin}`;
   show("result");
 },1500);
}
window.takePrize = async ()=>{
 bag+=currentWin;
 await update(ref(db,"users/"+userId),{bag, level, multiplier});
 document.getElementById("bagAmount").innerText=bag;
 currentWin=0;
 show("menu");
}

/* ===== УРОВНИ ===== */
function levelPrice(){return level*250;}
function updateLevelUI(){
 const el=document.getElementById("levelInfo");
 el.innerText=`Уровень: ${level}\nМножитель: x${multiplier.toFixed(1)}\nЦена: ${levelPrice()}\nБаланс: ${bag}`;
}
window.buyLevel=async()=>{
 const price=levelPrice();
 if(bag<price){alert("Не хватает денег"); return;}
 bag-=price; level++; if(level%2===0) multiplier+=0.2; if(level%5===0) multiplier+=0.5;
 await update(ref(db,"users/"+userId),{bag, level, multiplier});
 document.getElementById("bagAmount").innerText=bag;
 updateLevelUI();
}

/* ===== ТОП ===== */
window.showGlobalTop=async()=>{
 const snap=await get(ref(db,"users"));
 let list=[]; snap.forEach(u=>list.push({name:u.val().name,total:u.val().total||0}));
 list.sort((a,b)=>b.total-a.total); 
 document.getElementById("topResult").innerText=list.slice(0,10).map((p,i)=>`${i+1}. ${p.name} — ${p.total}`).join("\n")||"Пусто";
}
window.showLocalTop=async()=>{document.getElementById("topResult").innerText="Локальный топ пока пуст";}

/* ===== ПРОМОКОДЫ ===== */
window.usePromo=async()=>{
 const code=document.getElementById("promoInput").value.trim().toUpperCase();
 if(!code) return;
 let reward=0;
 switch(code){
   case "ZERO": reward=1000000; break;
   default: alert("Неверный промокод"); return;
 }
 bag+=reward;
 await update(ref(db,"users/"+userId),{bag});
 document.getElementById("bagAmount").innerText=bag;
 alert(`Получено: ${reward}`);
   }
