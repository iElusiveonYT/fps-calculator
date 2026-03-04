// ================== HELPER ==================

// Safely set textContent without crashing if element doesn't exist
function setText(id, value){
  const el = document.getElementById(id);
  if(el) el.textContent = value;
}

// ================== DOM ELEMENTS ==================
const cpuSelect = document.getElementById('cpuSelect');
const gpuSelect = document.getElementById('gpuSelect');
const gameSelect = document.getElementById('gameSelect');

const avg1080 = document.getElementById('avg1080');
const avg1440 = document.getElementById('avg1440');
const avg4k   = document.getElementById('avg4k');

const recommendation = document.getElementById('recommendation');

const topCPUs = document.getElementById('topCPUs');
const topGPUs = document.getElementById('topGPUs');

const min1080 = document.getElementById('min1080');
const min1440 = document.getElementById('min1440');
const min4k   = document.getElementById('min4k');

const max1080 = document.getElementById('max1080');
const max1440 = document.getElementById('max1440');
const max4k   = document.getElementById('max4k');

const avg1080b = document.getElementById('avg1080b');
const avg1440b = document.getElementById('avg1440b');
const avg4kb   = document.getElementById('avg4kb');

const playabilityText = document.getElementById('playabilityText');

// ================== DATA ==================
const resolutions = ['1080p','1440p','4K'];
let gameData = {};
let chart;
let detailChart;

// ================== LOAD JSON ==================
async function loadJSON(game){
  const res = await fetch(`data/${game}.json`);
  gameData[game] = await res.json();
}

// ================== DROPDOWN ==================
function populateDropdowns(game){
  cpuSelect.innerHTML = '';
  gpuSelect.innerHTML = '';
  
  const cpus = Object.keys(gameData[game]['1080p'].CPUs).sort();
  const gpus = Object.keys(gameData[game]['1080p'].GPUs).sort();

  cpus.forEach(c => cpuSelect.add(new Option(c,c)));
  gpus.forEach(g => gpuSelect.add(new Option(g,g)));
}

// ================== TOP COMPONENTS ==================
function updateTopComponents(game){
  const cpus = Object.keys(gameData[game]['1080p'].CPUs).map(name => {
    const avg = (gameData[game]['1080p'].CPUs[name] +
                 gameData[game]['1440p'].CPUs[name] +
                 gameData[game]['4K'].CPUs[name]) / 3;
    const details = `1080p: ${gameData[game]['1080p'].CPUs[name]} FPS\n` +
                    `1440p: ${gameData[game]['1440p'].CPUs[name]} FPS\n` +
                    `4K: ${gameData[game]['4K'].CPUs[name]} FPS`;
    return { name, avg, details };
  }).sort((a,b)=>b.avg-a.avg).slice(0,3);

  const gpus = Object.keys(gameData[game]['1080p'].GPUs).map(name => {
    const avg = (gameData[game]['1080p'].GPUs[name] +
                 gameData[game]['1440p'].GPUs[name] +
                 gameData[game]['4K'].GPUs[name]) / 3;
    const details = `1080p: ${gameData[game]['1080p'].GPUs[name]} FPS\n` +
                    `1440p: ${gameData[game]['1440p'].GPUs[name]} FPS\n` +
                    `4K: ${gameData[game]['4K'].GPUs[name]} FPS`;
    return { name, avg, details };
  }).sort((a,b)=>b.avg-a.avg).slice(0,3);

  topCPUs.innerHTML = cpus.map(c =>
    `<li>${c.name} (${Math.round(c.avg)} FPS)
       <div class="tooltip">${c.details.replace(/\n/g,'<br>')}</div>
    </li>`).join('');

  topGPUs.innerHTML = gpus.map(g =>
    `<li>${g.name} (${Math.round(g.avg)} FPS)
       <div class="tooltip">${g.details.replace(/\n/g,'<br>')}</div>
    </li>`).join('');
}

// ================== UPDATE CHART ==================
function updateChart(){

  const game = gameSelect.value;
  const cpu  = cpuSelect.value;
  const gpu  = gpuSelect.value;

  if(!gameData[game]) return;

  const cpuValues = resolutions.map(r => gameData[game][r].CPUs[cpu]);
  const gpuValues = resolutions.map(r => gameData[game][r].GPUs[gpu]);

  // ✅ Define FIRST
  const minValues = cpuValues.map((v,i)=>Math.min(v, gpuValues[i]));
  const maxValues = cpuValues.map((v,i)=>Math.max(v, gpuValues[i]));
  const avgValues = cpuValues.map((v,i)=>Math.round((v + gpuValues[i]) / 2));

  // ---- Quick summary
  setText('avg1080', minValues[0]);
  setText('avg1440', minValues[1]);
  setText('avg4k',   minValues[2]);

  // ---- Detailed summary
  setText('min1080', minValues[0]);
  setText('min1440', minValues[1]);
  setText('min4k',   minValues[2]);

  setText('max1080', maxValues[0]);
  setText('max1440', maxValues[1]);
  setText('max4k',   maxValues[2]);

  setText('avg1080b', avgValues[0]);
  setText('avg1440b', avgValues[1]);
  setText('avg4kb',   avgValues[2]);

  // ---- Playability
  const p = minValues[1]; // focus on 1440p
  let rating;
  if(p >= 240) rating = "Elite competitive experience";
  else if(p >= 165) rating = "Excellent competitive experience";
  else if(p >= 120) rating = "Very smooth and highly playable";
  else if(p >= 90)  rating = "Playable and smooth";
  else if(p >= 60)  rating = "Playable but not ideal for competitive";
  else rating = "Performance limited for competitive play";
  setText('playabilityText', rating);

  // ---- Bottleneck (4K)
  const i = 2;
  if(cpuValues[i] < gpuValues[i]) setText('recommendation', "Recommendation: CPU-limited");
  else if(cpuValues[i] > gpuValues[i]) setText('recommendation', "Recommendation: GPU-limited");
  else setText('recommendation', "Recommendation: Balanced");

  // ---- Sidebar
  updateTopComponents(game);

  // ---- Main chart
  if(chart) chart.destroy();
  const ctx = document.getElementById('fpsChart').getContext('2d');
  chart = new Chart(ctx,{
    type:'bar',
    data:{
      labels:resolutions,
      datasets:[
        { label:'CPU FPS', data:cpuValues, backgroundColor:'rgba(58,58,58,0.9)', borderRadius:10 },
        { label:'GPU FPS', data:gpuValues, backgroundColor:'rgba(85,85,85,0.9)', borderRadius:10 },
        { label:'Min (Bottleneck)', data:minValues, backgroundColor:'rgba(136,136,136,0.9)', borderRadius:10 }
      ]
    },
    options:{ responsive:true, animation:{duration:900}, scales:{y:{beginAtZero:true}} }
  });

  // ---- Detail chart
  if(detailChart) detailChart.destroy();
  const ctx2 = document.getElementById('detailChart').getContext('2d');
  detailChart = new Chart(ctx2,{
    type:'bar',
    data:{
      labels:resolutions,
      datasets:[
        { label:'Min FPS', data:minValues, backgroundColor:'rgba(90,90,90,0.9)', borderRadius:8 },
        { label:'Avg FPS', data:avgValues, backgroundColor:'rgba(130,130,130,0.9)', borderRadius:8 },
        { label:'Max FPS', data:maxValues, backgroundColor:'rgba(170,170,170,0.9)', borderRadius:8 }
      ]
    },
    options:{ responsive:true, scales:{y:{beginAtZero:true}} }
  });

}

// ================== INIT ==================
async function init(){
  const games = ['warzone','valorant','cs2','fortnite','apex','blackops7'];
  for(const g of games) await loadJSON(g);
  populateDropdowns(gameSelect.value);
  updateChart();
}

// ================== EVENT LISTENERS ==================
gameSelect.addEventListener('change', ()=>{
  populateDropdowns(gameSelect.value);
  updateChart();
});
cpuSelect.addEventListener('change', updateChart);
gpuSelect.addEventListener('change', updateChart);

// ================== MOUSE PARALLAX ==================
const cards = document.querySelectorAll('.card');
document.addEventListener('mousemove', e=>{
  const cx = window.innerWidth/2;
  const cy = window.innerHeight/2;
  const dx = (e.clientX-cx)/cx;
  const dy = (e.clientY-cy)/cy;
  cards.forEach(card=>{
    const depth=8;
    card.style.setProperty('--mx', `${dx*depth}px`);
    card.style.setProperty('--my', `${dy*depth}px`);
  });
});

// ================== START ==================
init();
