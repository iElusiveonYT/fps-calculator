const gameSelect = document.getElementById('gameSelect');
const resSelect  = document.getElementById('resolution');
const cpuSelect  = document.getElementById('cpuSelect');
const gpuSelect  = document.getElementById('gpuSelect');
const fpsDisplay = document.getElementById('fps');
const ramSlider  = document.getElementById('ram');
const ramVal     = document.getElementById('ramVal');

const cpuSearch = document.getElementById('cpu-search');
const gpuSearch = document.getElementById('gpu-search');

const avgFPS = {
  "Warzone": document.getElementById('avgWarzone'),
  "Valorant": document.getElementById('avgValorant'),
  "CS2": document.getElementById('avgCS2'),
  "Fortnite": document.getElementById('avgFortnite'),
  "Apex Legends": document.getElementById('avgApex'),
  "BlackOps7": document.getElementById('avgBO7')
};

let gameData = {};
let fpsChart = null;


/* -----------------------------
   Helpers
----------------------------- */

function normalizeGameName(name) {
  return name
    .toLowerCase()
    .replace(/\s+/g,'')
    .replace('legends','');
}


/* -----------------------------
   Load JSON
----------------------------- */

async function loadGameData(gameName){

  const file = normalizeGameName(gameName);

  const response = await fetch(`data/${file}.json`);
  gameData = await response.json();

  populateCPUandGPU();
}


/* -----------------------------
   Populate selects
----------------------------- */

function populateCPUandGPU(){

  if(!gameData || !resSelect) return;

  const res = resSelect.value;

  cpuSelect.innerHTML = '';
  gpuSelect.innerHTML = '';

  const cpuData = gameData[res]?.CPUs || {};
  const gpuData = gameData[res]?.GPUs || {};

  Object.keys(cpuData).forEach(cpu=>{
    const o = document.createElement('option');
    o.value = cpu;
    o.textContent = cpu;
    cpuSelect.appendChild(o);
  });

  Object.keys(gpuData).forEach(gpu=>{
    const o = document.createElement('option');
    o.value = gpu;
    o.textContent = gpu;
    gpuSelect.appendChild(o);
  });

  applySearchFilters();
  updateFPS();
}


/* -----------------------------
   Search filters
----------------------------- */

function applySearchFilters(){

  if(!cpuSelect || !gpuSelect) return;

  const cpuFilter = cpuSearch.value.toLowerCase();
  [...cpuSelect.options].forEach(o=>{
    o.hidden = !o.text.toLowerCase().includes(cpuFilter);
  });

  const gpuFilter = gpuSearch.value.toLowerCase();
  [...gpuSelect.options].forEach(o=>{
    o.hidden = !o.text.toLowerCase().includes(gpuFilter);
  });
}


/* -----------------------------
   FPS + chart
----------------------------- */

function updateFPS(){

  if(!cpuSelect || !gpuSelect) return;

  const res = resSelect.value;
  const cpu = cpuSelect.value;
  const gpu = gpuSelect.value;
  const ramBoost = Number(ramSlider.value) / 100;

  const cpuFPS = gameData[res]?.CPUs?.[cpu] ?? 0;
  const gpuFPS = gameData[res]?.GPUs?.[gpu] ?? 0;

  const fps = Math.floor(Math.min(cpuFPS, gpuFPS) * (1 + ramBoost));

  if(fpsDisplay){
    fpsDisplay.textContent = `FPS: ${fps}`;
  }

  const fpsValues = [];

  ['1080p','1440p','4K'].forEach(r=>{
    const c = gameData[r]?.CPUs?.[cpu] ?? 0;
    const g = gameData[r]?.GPUs?.[gpu] ?? 0;
    fpsValues.push(
      Math.floor(Math.min(c,g) * (1 + ramBoost))
    );
  });

  const canvas = document.getElementById('fpsChart');
  if(!canvas) return;

  const ctx = canvas.getContext('2d');

  if(fpsChart) fpsChart.destroy();

  fpsChart = new Chart(ctx,{
    type:'bar',
    data:{
      labels:['1080p','1440p','4K'],
      datasets:[
        {
          label:'FPS',
          data:fpsValues,
          backgroundColor:'#5f5f5f',
          borderRadius:8
        }
      ]
    },
    options:{
      responsive:true,
      plugins:{legend:{display:false}},
      scales:{y:{beginAtZero:true}}
    }
  });
}


/* -----------------------------
   Sidebar averages (simple + safe)
----------------------------- */

function updateSidebarAverages(){

  for(const game in avgFPS){

    const el = avgFPS[game];
    if(!el) continue;

    el.textContent = '—';
  }

}


/* -----------------------------
   Event listeners (safe)
----------------------------- */

if(gameSelect){
  gameSelect.addEventListener('change',()=>{
    loadGameData(gameSelect.value);
  });
}

if(resSelect){
  resSelect.addEventListener('change',populateCPUandGPU);
}

if(cpuSelect){
  cpuSelect.addEventListener('change',updateFPS);
}

if(gpuSelect){
  gpuSelect.addEventListener('change',updateFPS);
}

if(ramSlider){
  ramSlider.addEventListener('input',()=>{
    ramVal.textContent = ramSlider.value + '%';
    updateFPS();
  });
}

if(cpuSearch){
  cpuSearch.addEventListener('input',applySearchFilters);
}

if(gpuSearch){
  gpuSearch.addEventListener('input',applySearchFilters);
}


/* -----------------------------
   Init
----------------------------- */

if(gameSelect){
  loadGameData(gameSelect.value);
  updateSidebarAverages();
}


/* -----------------------------
   Parallax
----------------------------- */

document.addEventListener('mousemove',e=>{

  const l1 = document.querySelector('.layer1');
  const l2 = document.querySelector('.layer2');
  const l3 = document.querySelector('.layer3');

  if(!l1 || !l2 || !l3) return;

  const w = window.innerWidth;
  const h = window.innerHeight;

  const x = (e.clientX - w/2) / w * 20;
  const y = (e.clientY - h/2) / h * 20;

  l1.style.transform = `translate(${x}px,${y}px)`;
  l2.style.transform = `translate(${-x}px,${-y}px)`;
  l3.style.transform = `translate(${x/2}px,${-y/2}px)`;
});


/* -----------------------------
   Particles
----------------------------- */

const canvas = document.getElementById('particleCanvas');

if(canvas){

  const pctx = canvas.getContext('2d');

  function resize(){
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  resize();
  window.addEventListener('resize',resize);

  const particles = [];

  for(let i=0;i<80;i++){
    particles.push({
      x:Math.random()*canvas.width,
      y:Math.random()*canvas.height,
      r:Math.random()*2+0.5,
      s:Math.random()*0.4+0.1
    });
  }

  function animateParticles(){

    pctx.clearRect(0,0,canvas.width,canvas.height);

    for(const p of particles){

      p.y -= p.s;
      if(p.y < 0) p.y = canvas.height;

      pctx.fillStyle = '#1f1f1f';
      pctx.beginPath();
      pctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      pctx.fill();
    }

    requestAnimationFrame(animateParticles);
  }

  animateParticles();
}
