const cpuSelect = document.getElementById('cpuSelect');
const gpuSelect = document.getElementById('gpuSelect');
const gameSelect = document.getElementById('gameSelect');
const avg1080 = document.getElementById('avg1080');
const avg1440 = document.getElementById('avg1440');
const avg4k = document.getElementById('avg4k');
const avg1080b = document.getElementById('avg1080b');
const avg1440b = document.getElementById('avg1440b');
const avg4kb = document.getElementById('avg4kb');
const min1080 = document.getElementById('min1080');
const min1440 = document.getElementById('min1440');
const min4k = document.getElementById('min4k');
const max1080 = document.getElementById('max1080');
const max1440 = document.getElementById('max1440');
const max4k = document.getElementById('max4k');
const playabilityText = document.getElementById('playabilityText');
const recommendation = document.getElementById('recommendation');
const topCPUs = document.getElementById('topCPUs');
const topGPUs = document.getElementById('topGPUs');

const resolutions = ['1080p','1440p','4K'];
let gameData = {};
let chart, detailChart;

async function loadJSON(game){
  const res = await fetch(`data/${game}.json`);
  gameData[game] = await res.json();
}

function populateDropdowns(game){
  if(!gameData[game]) return;
  cpuSelect.innerHTML='';
  gpuSelect.innerHTML='';
  const cpus = Object.keys(gameData[game]['1080p'].CPUs).sort();
  const gpus = Object.keys(gameData[game]['1080p'].GPUs).sort();
  cpus.forEach(c=>cpuSelect.add(new Option(c,c)));
  gpus.forEach(g=>gpuSelect.add(new Option(g,g)));
}

function updateTopComponents(game){
  const cpus = Object.entries(gameData[game]['1080p'].CPUs)
    .map(([name])=>({
      name,
      avg: (gameData[game]['1080p'].CPUs[name]+gameData[game]['1440p'].CPUs[name]+gameData[game]['4K'].CPUs[name])/3,
      details:`1080p: ${gameData[game]['1080p'].CPUs[name]} FPS\n1440p: ${gameData[game]['1440p'].CPUs[name]} FPS\n4K: ${gameData[game]['4K'].CPUs[name]} FPS`
    }))
    .sort((a,b)=>b.avg-a.avg).slice(0,3);

  const gpus = Object.entries(gameData[game]['1080p'].GPUs)
    .map(([name])=>({
      name,
      avg: (gameData[game]['1080p'].GPUs[name]+gameData[game]['1440p'].GPUs[name]+gameData[game]['4K'].GPUs[name])/3,
      details:`1080p: ${gameData[game]['1080p'].GPUs[name]} FPS\n1440p: ${gameData[game]['1440p'].GPUs[name]} FPS\n4K: ${gameData[game]['4K'].GPUs[name]} FPS`
    }))
    .sort((a,b)=>b.avg-a.avg).slice(0,3);

  topCPUs.innerHTML = cpus.map(c=>`<li>${c.name} (${Math.round(c.avg)} FPS)<div class="tooltip">${c.details.replace(/\n/g,'<br>')}</div></li>`).join('');
  topGPUs.innerHTML = gpus.map(g=>`<li>${g.name} (${Math.round(g.avg)} FPS)<div class="tooltip">${g.details.replace(/\n/g,'<br>')}</div></li>`).join('');
}

function updateChart(){
  if(!gameData[gameSelect.value]) return;

  const cpuValues = resolutions.map(r=>gameData[gameSelect.value][r].CPUs[cpuSelect.value]);
  const gpuValues = resolutions.map(r=>gameData[gameSelect.value][r].GPUs[gpuSelect.value]);
  const minValues = cpuValues.map((v,i)=>Math.min(v,gpuValues[i]));
  const maxValues = cpuValues.map((v,i)=>Math.max(v,gpuValues[i]));
  const avgValues = cpuValues.map((v,i)=>Math.round((v+gpuValues[i])/2));

  avg1080.textContent = avgValues[0];
  avg1440.textContent = avgValues[1];
  avg4k.textContent = avgValues[2];
  min1080.textContent = minValues[0];
  min1440.textContent = minValues[1];
  min4k.textContent = minValues[2];
  avg1080b.textContent = avgValues[0];
  avg1440b.textContent = avgValues[1];
  avg4kb.textContent = avgValues[2];
  max1080.textContent = maxValues[0];
  max1440.textContent = maxValues[1];
  max4k.textContent = maxValues[2];

  const lastIndex = 2;
  if(cpuValues[lastIndex]<gpuValues[lastIndex]) recommendation.textContent="Recommendation: CPU-limited";
  else if(cpuValues[lastIndex]>gpuValues[lastIndex]) recommendation.textContent="Recommendation: GPU-limited";
  else recommendation.textContent="Recommendation: Balanced";

  updateTopComponents(gameSelect.value);

  // Main FPS Chart
  if(chart) chart.destroy();
  const ctx=document.getElementById('fpsChart').getContext('2d');
  chart = new Chart(ctx,{
    type:'bar',
    data:{
      labels:resolutions,
      datasets:[
        {label:'CPU FPS', data:cpuValues, backgroundColor:'rgba(58,58,58,0.9)', borderRadius:10},
        {label:'GPU FPS', data:gpuValues, backgroundColor:'rgba(85,85,85,0.9)', borderRadius:10},
        {label:'Min FPS', data:minValues, backgroundColor:'rgba(136,136,136,0.9)', borderRadius:10}
      ]
    },
    options:{responsive:true, animation:{duration:1000,easing:'easeOutQuart'}, plugins:{tooltip:{enabled:true}}, scales:{y:{beginAtZero:true}}}
  });

  // Detail Chart
  if(detailChart) detailChart.destroy();
  const ctx2=document.getElementById('detailChart').getContext('2d');
  detailChart = new Chart(ctx2,{
    type:'line',
    data:{
      labels:resolutions,
      datasets:[
        {label:'Min FPS', data:minValues, borderColor:'#fff', borderWidth:2, fill:false},
        {label:'Avg FPS', data:avgValues, borderColor:'#aaa', borderWidth:2, fill:false},
        {label:'Max FPS', data:maxValues, borderColor:'#0f0', borderWidth:2, fill:false}
      ]
    },
    options:{responsive:true, animation:{duration:1000,easing:'easeOutQuart'}, plugins:{tooltip:{enabled:true}}, scales:{y:{beginAtZero:true}}}
  });
}

async function init(){
  const games = ['warzone','valorant','cs2','fortnite','apex','blackops7'];
  for(const g of games) await loadJSON(g);
  populateDropdowns('warzone');
  updateChart();
}

gameSelect.addEventListener('change', ()=>{populateDropdowns(gameSelect.value);updateChart();});
cpuSelect.addEventListener('change', updateChart);
gpuSelect.addEventListener('change', updateChart);

init();

// Parallax card effect
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
