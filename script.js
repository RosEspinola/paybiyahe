// ---------- DATA ----------
// Highway route (from the Calbayog Transport Cooperative General Fare Guide)
// [name, km, regular, senior/student]
const hw = [
 ["Bugtong",39,101.00,80.75],["Malaga",35,91.50,73.00],["Cagmanipis Norte",34,89.50,71.25],
 ["Malayog",31,81.75,65.50],["Cagmanipis Sur",33,86.50,69.25],["Pena",30,79.50,63.50],
 ["Cag-Olango",29,77.00,61.50],["Cagnipa",28,74.50,59.75],["San Joaquin",26,69.75,55.75],
 ["Baay",23,62.50,50.00],["Binaliw",22,60.25,48.25],["Manginoo",20,55.50,44.25],
 ["Bantian",19,53.00,42.50],["Marcatubig",18,50.50,40.50],["Malajog",16,45.75,36.75],
 ["Malopalo",15,43.50,34.75],["Tinambacan",13,38.50,34.75],["Amampacang",10,31.50,25.00],
 ["Lonoy",9,29.00,23.25]
].map(r=>({name:r[0],note:r[1]+" km · Calbayog Transport Cooperative",min:r[2],max:r[2],dmin:r[3],dmax:r[3]}));

// Local zones: [name, sample barangays, transport, min, max, discMin, discMax]
const loc = [
 ["Poblacion / Urban Core","Capoocan, Bagacay, Rawis, Dagum, Balud, Hamorawon, Obrero, Payahan, Aguit-itan","Tricycle",10,14,8,11],
 ["South Coastal","Cagsalaosao, Carayman, San Policarpo, Gadgaran","Jeepney / Multicab",15,25,12,20],
 ["South Interior","Kilikili, Cabugawan, Migara, Patong","Jeepney / Habal-habal",30,50,24,40],
 ["Oquendo (North Highway)","Begaho, Anislag, Tarabucan, Oquendo Poblacion","Oquendo Jeepney",28,45,22,36],
 ["Oquendo (Deep Interior)","Bayo, Cabamba-an, Mabini, Pulido","Jeepney / Habal-habal",50,90,40,72],
 ["Tinambacan (North Coastal)","San Joaquin, Malaga, Tinambacan Proper, Cagsana","Tinambacan Jeepney",35,60,28,48],
 ["Tinambacan (Interior/Borders)","Palanogan, Pilar, San Jose, Lope De Vega border","Multicab / Habal-habal",60,100,48,80],
 ["Brgy. Begaho (~11.2 km)","Jeepney","Jeepney",28,35,22,28],
 ["Brgy. Oquendo (~12.7 km)","Jeepney","Jeepney",31,40,25,32],
].map(r=>({name:r[0],note:r[1]+" · "+r[2],min:r[3],max:r[4],dmin:r[5],dmax:r[6]}));

// Inter-city: discounted = 20% off (assumed)
const ic = [
 ["Catbalogan","Van / bus",120,180],["Catarman","Van / bus",150,200],
 ["Tacloban","Connecting van / bus",450,500],["Naval (Biliran)","Seacat / fastcraft",600,600],
 ["Cebu City","RoRo / ferry (Calbayog Port, Aguit-itan)",1200,1620]
].map(r=>({name:r[0],note:r[1],min:r[2],max:r[3],dmin:+(r[2]*.8).toFixed(2),dmax:+(r[3]*.8).toFixed(2)}));

const groups = {local:{label:"In the City",data:loc},hw:{label:"Highway Route",data:hw},ic:{label:"Provincial",data:ic}};

// ---------- STATE / HELPERS ----------
let cur = "local";
const $ = id => document.getElementById(id);
const peso = n => "₱" + n.toLocaleString("en-PH",{minimumFractionDigits:2,maximumFractionDigits:2});

function drawTabs(){
  $("tabs").innerHTML = "";
  for (const k in groups){
    const b = document.createElement("button");
    b.textContent = groups[k].label;
    if (k===cur) b.className = "on";
    b.onclick = () => { cur = k; drawTabs(); drawDest(); };
    $("tabs").appendChild(b);
  }
}
function drawDest(){
  $("dest").innerHTML = groups[cur].data.map((d,i)=>`<option value="${i}">${d.name}</option>`).join("");
  calc();
}
function route(){ return groups[cur].data[+$("dest").value]; }

// returns the per-person fare chosen by the user
function calc(){
  const r = route(), disc = $("ptype").value !== "regular";
  const lo = disc ? r.dmin : r.min, hi = disc ? r.dmax : r.max;
  const isRange = lo !== hi;
  $("rangeBox").classList.toggle("hide", !isRange);
  const per = isRange && $("est").value==="min" ? lo : hi;
  const qty = Math.max(1, parseInt($("qty").value) || 1);
  const total = per * qty;
  $("info").textContent = r.note;
  $("perLine").textContent = (isRange ? `Range ${peso(lo)} – ${peso(hi)} · ` : "") + `${peso(per)} × ${qty} passenger${qty>1?"s":""}`;
  $("total").textContent = peso(total);
  return {r, per, qty, total};
}

// ---------- PAYMENT ----------
$("pay").onclick = () => {
  const t = calc(), method = $("method").value;
  $("err").textContent = "";
  let cash = t.total, change = 0;
  if (method === "Cash"){
    cash = parseFloat($("cash").value);
    if (isNaN(cash) || cash < t.total){ $("err").textContent = "Cash given is not enough."; return; }
    change = cash - t.total;
  }
  const ref = "PB" + Date.now().toString().slice(-8);
  const rows = [
    ["Reference", ref],["Date", new Date().toLocaleString("en-PH")],
    ["From","Calbayog City"],["To", t.r.name],
    ["Passenger", $("ptype").selectedOptions[0].text.split(" (")[0]],
    ["Passengers", t.qty],["Fare each", peso(t.per)],["TOTAL", peso(t.total)],
    ["Paid via", method]
  ];
  if (method === "Cash") rows.push(["Cash", peso(cash)], ["Change", peso(change)]);
  $("rcp").innerHTML = "<div style='justify-content:center'><b>PAYBIYAHE RECEIPT</b></div>" +
    rows.map(r=>`<div><span>${r[0]}</span><span>${r[1]}</span></div>`).join("") +
    "<div style='justify-content:center;padding-top:8px'>Salamat! Ingat sa biyahe.</div>";
  $("rcpCard").classList.remove("hide");
  $("rcpCard").scrollIntoView({behavior:"smooth"});
};
$("again").onclick = () => { $("rcpCard").classList.add("hide"); $("cash").value = ""; window.scrollTo({top:0,behavior:"smooth"}); };
$("method").onchange = () => $("cashBox").classList.toggle("hide", $("method").value !== "Cash");
["dest","ptype","qty","est"].forEach(id => $(id).addEventListener("input", calc));

drawTabs(); drawDest();