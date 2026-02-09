// =====================
// 1) Películas
// =====================

const peliculas = [
  "Rápido y Furioso (2001)",
  "Más Rápido, Más Furioso (2003)",
  "Reto Tokio (2006)",
  "Rápidos y Furiosos 4 (2009)",
  "Fast Five (2011)",
  "Rápidos y Furiosos 6 (2013)",
  "Furious 7 (2015)",
  "The Fate of the Furious (2017)",
  "F9 (2021)",
  "Fast X (2023)"
];

const segmentos = {
  FAN: "Fan de la saga",
  CAS: "Espectador casual",
  NEW: "Primera vez",
  ACC: "Busca acción",
  HIS: "Busca historia"
};

const contextos = {
  ENT: "¿Cuál es más entretenida?",
  ACC: "¿Cuál tiene mejor acción?",
  HIS: "¿Cuál tiene mejor historia?",
  INI: "¿Cuál recomiendas para empezar?",
  REP: "¿Cuál vale la pena volver a ver?"
};

// Elo
const RATING_INICIAL = 1000;
const K = 32;

// =====================
// 2) Estado
// =====================

const STORAGE_KEY = "fastmash_state";

function defaultState(){
  const buckets = {};
  for (const s in segmentos){
    for (const c in contextos){
      const key = `${s}__${c}`;
      buckets[key] = {};
      peliculas.forEach(p => buckets[key][p] = RATING_INICIAL);
    }
  }
  return { buckets, votes: [] };
}

let state = JSON.parse(localStorage.getItem(STORAGE_KEY)) || defaultState();

function saveState(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// =====================
// 3) Elo
// =====================

function expectedScore(ra, rb){
  return 1 / (1 + Math.pow(10, (rb - ra) / 400));
}

function updateElo(bucket, a, b, winner){
  const ra = bucket[a], rb = bucket[b];
  const ea = expectedScore(ra, rb);
  const eb = expectedScore(rb, ra);

  bucket[a] = ra + K * ((winner === "A" ? 1 : 0) - ea);
  bucket[b] = rb + K * ((winner === "B" ? 1 : 0) - eb);
}

function randomPair(){
  const a = peliculas[Math.floor(Math.random()*peliculas.length)];
  let b = a;
  while (b === a){
    b = peliculas[Math.floor(Math.random()*peliculas.length)];
  }
  return [a, b];
}

function bucketKey(s,c){ return `${s}__${c}`; }

function topN(bucket){
  return Object.entries(bucket)
    .map(([p,r]) => ({p,r}))
    .sort((a,b) => b.r - a.r)
    .slice(0,10);
}

// =====================
// 4) UI
// =====================

const segmentSelect = document.getElementById("segmentSelect");
const contextSelect = document.getElementById("contextSelect");
const labelA = document.getElementById("labelA");
const labelB = document.getElementById("labelB");
const question = document.getElementById("question");
const topBox = document.getElementById("topBox");

let currentA, currentB;

function fillSelect(el, obj){
  for (const k in obj){
    const o = document.createElement("option");
    o.value = k;
    o.textContent = obj[k];
    el.appendChild(o);
  }
}

fillSelect(segmentSelect, segmentos);
fillSelect(contextSelect, contextos);

segmentSelect.value = "FAN";
contextSelect.value = "ENT";

function newDuel(){
  [currentA, currentB] = randomPair();
  labelA.textContent = currentA;
  labelB.textContent = currentB;
  question.textContent = contextos[contextSelect.value];
}

function renderTop(){
  const bucket = state.buckets[bucketKey(segmentSelect.value, contextSelect.value)];
  topBox.innerHTML = topN(bucket).map((x,i)=>`
    <div class="toprow">
      <div>${i+1}. ${x.p}</div>
      <div>${x.r.toFixed(1)}</div>
    </div>
  `).join("");
}

function vote(w){
  const bucket = state.buckets[bucketKey(segmentSelect.value, contextSelect.value)];
  updateElo(bucket, currentA, currentB, w);
  saveState();
  renderTop();
  newDuel();
}

document.getElementById("btnA").onclick = ()=>vote("A");
document.getElementById("btnB").onclick = ()=>vote("B");
document.getElementById("btnNewPair").onclick = newDuel;
document.getElementById("btnShowTop").onclick = renderTop;

document.getElementById("btnReset").onclick = ()=>{
  if(confirm("¿Borrar todo?")){
    state = defaultState();
    saveState();
    renderTop();
    newDuel();
  }
};

document.getElementById("btnExport").onclick = ()=>{
  if(!state.votes.length) return alert("No hay votos");
};

newDuel();
renderTop();
