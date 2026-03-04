const gameSelect = document.getElementById('game');
const resSelect = document.getElementById('resolution');
const cpuSelect = document.getElementById('cpu');
const gpuSelect = document.getElementById('gpu');
const fpsDisplay = document.getElementById('fps');
const ramSlider = document.getElementById('ram');
const ramVal = document.getElementById('ramVal');

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
let fpsChart;

// --- Load game JSON dynamically
async function loadGameData(game){
  const response = await fetch(`data/${warzone()}.json`);
  gameData = await response.json();
  populateCPUandGPU();
}

// --- Populate CPU/GPU dropdowns
function populateCPUandGPU(){
  const res = resSelect.value;
  cpuSelect.innerHTML=''; gpuSelect.innerHTML='';
  const cpuData = gameData[res]?.CPUs || {};
  const gpuData = gameData[res]?.GPUs || {};
  for(let cpu in cpuData){ cpuSelect.innerHTML += `<option>${cpu}</option>`; }
  for(let gpu in gpuData){ gpuSelect.innerHTML += `<option>${gpu}</option>`; }
  applySearchFilters();
  updateFPS();
}

// --- Searchable dropdowns
function applySearchFilters(){
  const cpuFilter = cpuSearch.value.toLowerCase();
  Array.from(cpuSelect.options).forEach(o=>o.style.display=o.text.toLowerCase().includes(cpuFilter)?'block':'none');

  const gpuFilter = gpuSearch.value.toLowerCase();
  Array.from(gpuSelect.options).forEach(o=>o.style.display=o.text.toLowerCase().includes(gpuFilter)?'block':'none');
}

// --- Update FPS and chart
function updateFPS(){
  const res = resSelect.value;
  const cpu = cpuSelect.value;
  const gpu = gpuSelect.value;
  const ramBoost = Number(ramSlider.value)/100;

  const cpuFPS = gameData[res]?.CPUs[cpu] || 0;
  const gpuFPS = gameData[res]?.GPUs[gpu] || 0;
  const fps = Math.floor(Math.min(cpuFPS,gpuFPS)*(1+ramBoost));
  fpsDisplay.textContent = `FPS: ${fps}`;

  const fpsValues=[];
  ['1080p','1440p','4K'].forEach(r=>{
    const c = gameData[r]?.CPUs[cpu] || 0;
    const g = gameData[r]?.GPUs[gpu] || 0;
    fpsValues.push(Math.floor(Math.min(c,g)*(1+ramBoost)));
  });

  if(fpsChart) fpsChart.destroy();
  const ctx = document.getElementById('fpsChart').getContext('2d');
  fpsChart = new Chart(ctx,{type:'bar',data:{labels:['1080p','1440p','4K'],datasets:[{label:'FPS',data:fpsValues,backgroundColor:'#4a90e2'}]},options:{responsive:true,plugins:{legend:{display:false}},animation:{duration:500},scales:{y:{beginAtZero:true}}}});

  // Avg FPS Sidebar across all resolutions
  for(let g in avgFPS){
    let sum=0,count=0;
    for(let r in gameData){ 
      const cpus = gameData[r]?.CPUs || {};
      const gpus = gameData[r]?.GPUs || {};
      for(let c in cpus){ for(let gk in gpus){ sum+=Math.min(cpus[c],gpus[gk]); count++; } }
    }
    avgFPS[g].textContent = count?Math.floor(sum/count):0;
  }
}

// --- Event Listeners
gameSelect.addEventListener('change',()=>loadGameData(gameSelect.value));
resSelect.addEventListener('change',populateCPUandGPU);
cpuSelect.addEventListener('change',updateFPS);
gpuSelect.addEventListener('change',updateFPS);
ramSlider.addEventListener('input',()=>{ ramVal.textContent = ramSlider.value+'%'; updateFPS(); });
cpuSearch.addEventListener('input',applySearchFilters);
gpuSearch.addEventListener('input',applySearchFilters);

// Initialize first load
loadGameData(gameSelect.value);

// --- Parallax & Particles
document.addEventListener('mousemove',e=>{
  const w=window.innerWidth,h=window.innerHeight;
  const x=(e.clientX-w/2)/w*50;
  const y=(e.clientY-h/2)/h*50;
  document.querySelector('.layer1').style.transform=`translate(${x}px,${y}px)`;
  document.querySelector('.layer2').style.transform=`translate(${-x}px,${-y}px)`;
  document.querySelector('.layer3').style.transform=`translate(${x/2}px,${-y/2}px)`;
});

const canvas=document.getElementById('particleCanvas');
const ctx=canvas.getContext('2d');
canvas.width=window.innerWidth; canvas.height=window.innerHeight;
const particles=[];
for(let i=0;i<100;i++){particles.push({x:Math.random()*canvas.width,y:Math.random()*canvas.height,r:Math.random()*2+1,speed:Math.random()*0.5+0.1});}
function animateParticles(){ctx.clearRect(0,0,canvas.width,canvas.height);particles.forEach(p=>{p.y-=p.speed;if(p.y<0)p.y=canvas.height;ctx.fillStyle='#1a1a1a';ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();});requestAnimationFrame(animateParticles);}
animateParticles();