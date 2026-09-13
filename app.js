const API="https://api.open-meteo.com/v1/forecast";
const GEO="https://geocoding-api.open-meteo.com/v1/search";
const $=id=>document.getElementById(id);
let coords={lat:18.5204,lon:73.8567,name:"Pune",country:"India"};
const weatherMap={0:["Clear sky","☀️","clear","Sheepy is soaking up the sun ☀️"],1:["Mainly clear","🌤️","clear","A perfect little sun nap 🌤️"],2:["Partly cloudy","⛅","cloud","Sheepy found a cozy patch of shade ⛅"],3:["Overcast","☁️","cloud","Cloudy, but still meadow-worthy ☁️"],45:["Foggy","🌫️","cloud","Sheepy says: visibility is overrated 🌫️"],48:["Foggy","🌫️","cloud","A mysterious morning for Sheepy 🌫️"],51:["Light drizzle","🌦️","rain","Sheepy is heading under the tree 🌦️"],53:["Drizzle","🌦️","rain","Tiny drops! Shelter time, Sheepy 🌦️"],55:["Heavy drizzle","🌧️","rain","Definitely a tree day 🌧️"],61:["Light rain","🌧️","rain","Rain! Sheepy is hiding under the tree 🌧️"],63:["Rain","🌧️","rain","Sheepy found a dry shelter 🌧️"],65:["Heavy rain","🌧️","rain","Sheepy is staying VERY fluffy and dry 🌧️"],71:["Light snow","🌨️","rain","Sheepy has never seen this much fluff 🌨️"],73:["Snow","❄️","rain","Sheepy is bundled up ❄️"],75:["Heavy snow","❄️","rain","Sheepy votes for a warm barn ❄️"],80:["Rain showers","🌦️","rain","Quick! Back under the tree 🌦️"],81:["Rain showers","🌧️","rain","Sheepy is sheltering from showers 🌧️"],82:["Heavy showers","⛈️","rain","Sheepy is waiting this one out ⛈️"],95:["Thunderstorm","⛈️","rain","Nope. Sheepy is absolutely under the tree ⛈️"],96:["Thunderstorm","⛈️","rain","Sheepy says: stay cozy indoors ⛈️"],99:["Thunderstorm","⛈️","rain","Sheepy is hiding from the storm ⛈️"]};
const dayNames=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
function setWeather(code,isDay=true){const [label,icon,state,msg]=weatherMap[code]||weatherMap[0];document.body.dataset.weather=isDay?state:"night";$('condition').textContent=`${icon} ${label}`;$('mood').textContent=state==='rain'?"TREE SHELTER":state==='cloud'?"CLOUD WATCHER":isDay?"SUNNY SHEEP":"NIGHT NAPPER";$('weatherBubble').textContent=isDay?msg:"Sheepy is tucked in for the night 🌙";$('sheepStage').setAttribute('aria-label',`${label}. ${isDay?msg:"Sheepy is tucked in for the night."}`);return{label,icon,state}}
function fmtTime(iso){return new Intl.DateTimeFormat(undefined,{hour:"numeric",minute:"2-digit"}).format(new Date(iso))}
function showToast(text){$('toast').textContent=text;$('toast').classList.add('show');setTimeout(()=>$('toast').classList.remove('show'),2800)}
async function loadWeather(){try{$('updated').textContent="Fetching the latest sky…";const url=`${API}?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,weather_code,wind_speed_10m,wind_direction_10m&hourly=precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&forecast_days=5&timezone=auto`;const d=await fetch(url).then(r=>{if(!r.ok)throw Error();return r.json()});const c=d.current;$('place').textContent=`${coords.name}${coords.country?`, ${coords.country}`:""}`;$('updated').textContent=`Updated ${fmtTime(c.time)}`;$('temp').textContent=`${Math.round(c.temperature_2m)}°`;$('feels').textContent=`Feels like ${Math.round(c.apparent_temperature)}°`;$('humidity').textContent=`${Math.round(c.relative_humidity_2m)}%`;$('wind').textContent=`${Math.round(c.wind_speed_10m)} km/h`;$('windDir').textContent=`${windDirection(c.wind_direction_10m)} wind`;$('rainChance').textContent=`${d.hourly.precipitation_probability?.[0]??d.daily.precipitation_probability_max?.[0]??0}%`;const meta=setWeather(c.weather_code,!!c.is_day);renderForecast(d.daily);document.title=`${meta.label} · Sheepy Weather`}catch(e){$('updated').textContent="Weather service unavailable";showToast("Couldn't reach the weather service. Try again.")}}
function windDirection(deg){const dirs=["N","NE","E","SE","S","SW","W","NW"];return dirs[Math.round(deg/45)%8]}
function renderForecast(d){$('forecast').innerHTML=d.time.map((date,i)=>{const meta=weatherMap[d.weather_code[i]]||weatherMap[0];const day=i===0?"Today":dayNames[new Date(date+"T12:00:00").getDay()];return `<article class="day ${i===0?"today":""}"><div class="day-name">${day}</div><div class="day-icon">${meta[1]}</div><div class="day-temp">${Math.round(d.temperature_2m_max[i])}° <span style="color:#9aa8a1;font-weight:500">${Math.round(d.temperature_2m_min[i])}°</span></div><div class="day-rain">💧 ${d.precipitation_probability_max?.[i]??0}%</div></article>`}).join("")}
async function searchCity(q){if(!q.trim())return;try{const data=await fetch(`${GEO}?name=${encodeURIComponent(q)}&count=5&language=en&format=json`).then(r=>r.json());const list=data.results||[];if(!list.length){showToast("No places found. Try another city.");return}const box=$('suggestions');box.innerHTML=list.map((x,i)=>`<button class="suggestion" data-i="${i}">📍 ${x.name}${x.admin1?`, ${x.admin1}`:""}${x.country?` · ${x.country}`:""}</button>`).join("");box.hidden=false;box.querySelectorAll('.suggestion').forEach(btn=>btn.onclick=()=>{const x=list[+btn.dataset.i];coords={lat:x.latitude,lon:x.longitude,name:x.name,country:x.country};$('cityInput').value=x.name;box.hidden=true;loadWeather()})}catch(e){showToast("Search failed. Check your connection.")}}
$('searchForm').addEventListener('submit',e=>{e.preventDefault();searchCity($('cityInput').value)});$('refreshBtn').onclick=loadWeather;$('locateBtn').onclick=()=>{if(!navigator.geolocation){showToast("Location isn't supported by this browser.");return}navigator.geolocation.getCurrentPosition(async p=>{coords={lat:p.coords.latitude,lon:p.coords.longitude,name:"Your location",country:""};try{const g=await fetch(`${GEO}?latitude=${coords.lat}&longitude=${coords.lon}&count=1&language=en&format=json`).then(r=>r.json());if(g.results?.[0]){coords.name=g.results[0].name;coords.country=g.results[0].country}}catch{}loadWeather()},()=>showToast("Location permission was not granted."))};document.addEventListener('click',e=>{if(!e.target.closest('.search')&&!e.target.closest('.suggestions'))$('suggestions').hidden=true});

function init3DSheepy(){
  const host=$('sheep3d');
  if(!host||!window.THREE)return;
  const scene=new THREE.Scene();
  const camera=new THREE.OrthographicCamera(-window.innerWidth/2,window.innerWidth/2,window.innerHeight/2,-window.innerHeight/2,0.1,1000);
  camera.position.set(0,0,120);camera.lookAt(0,0,0);
  const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:"high-performance"});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));renderer.setSize(window.innerWidth,window.innerHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;
  host.appendChild(renderer.domElement);
  scene.add(new THREE.HemisphereLight(0xffffff,0xb9a78f,2.2));
  const key=new THREE.DirectionalLight(0xffffff,2.4);key.position.set(-180,240,260);scene.add(key);
  const rim=new THREE.DirectionalLight(0xd9f5ff,1.1);rim.position.set(220,40,160);scene.add(rim);

  const sheep=new THREE.Group();sheep.rotation.order='YXZ';scene.add(sheep);
  const woolMat=new THREE.MeshStandardMaterial({color:0xf7f3ea,roughness:.9,metalness:0});
  const darkMat=new THREE.MeshStandardMaterial({color:0x45413f,roughness:.8});
  const hoofMat=new THREE.MeshStandardMaterial({color:0x282522,roughness:.9});
  const pinkMat=new THREE.MeshStandardMaterial({color:0xd8a8a2,roughness:1});
  const make=(geo,mat,p)=>{const m=new THREE.Mesh(geo,mat);m.position.set(...p);sheep.add(m);return m};
  const body=make(new THREE.CapsuleGeometry(48,62,8,14),woolMat,[0,6,0]);body.rotation.z=Math.PI/2;
  [[-16,45,4],[20,42,4],[48,25,0],[-45,27,3],[2,-28,7]].forEach(p=>make(new THREE.SphereGeometry(25,14,10),woolMat,p));
  const neck=make(new THREE.CylinderGeometry(24,27,38,12),woolMat,[38,14,0]);neck.rotation.z=-.32;
  const head=make(new THREE.SphereGeometry(31,18,14),darkMat,[67,34,0]);head.scale.set(1.0,.95,.9);
  const muzzle=make(new THREE.SphereGeometry(17,16,12),pinkMat,[89,25,0]);muzzle.scale.set(1.0,.72,.82);
  const ears=[];[-1,1].forEach(s=>{const e=make(new THREE.CapsuleGeometry(7,24,6,8),darkMat,[66,57,s*27]);e.rotation.z=s*.8;e.rotation.y=s*.2;ears.push(e)});
  const eyes=[];[-1,1].forEach(s=>{const e=make(new THREE.SphereGeometry(5,12,10),new THREE.MeshStandardMaterial({color:0x11100f,roughness:.5}),[79,43,s*21]);eyes.push(e)});
  const legs=[];[[-25,-45,18],[17,-47,18],[-25,-45,-18],[17,-47,-18]].forEach(p=>{const l=make(new THREE.CapsuleGeometry(8,42,6,8),darkMat,p);l.rotation.z=(p[0]<0?-1:1)*.06;legs.push(l);make(new THREE.CylinderGeometry(9,9,10,10),hoofMat,[p[0]+(p[0]<0?-2:2),-71,p[2]])});
  const tail=make(new THREE.SphereGeometry(16,14,12),woolMat,[-57,17,0]);tail.scale.set(1,.85,1);

  const groundShadow=new THREE.Mesh(new THREE.CircleGeometry(62,32),new THREE.MeshBasicMaterial({color:0x5e574f,transparent:true,opacity:.18,depthWrite:false}));groundShadow.rotation.x=-Math.PI/2;groundShadow.position.set(0,-76,0);scene.add(groundShadow);
  let target=new THREE.Vector3(),velocity=new THREE.Vector3(),phase=0,last=performance.now();
  const chooseTarget=()=>{const pad=90;target.set((Math.random()-.5)*(window.innerWidth-pad*2),(Math.random()-.5)*(window.innerHeight-pad*2),0);target.y*=.82;};
  chooseTarget();
  const state={x:0,y:-window.innerHeight*.1,depth:.25};
  const moveBounds=()=>Math.max(110,Math.min(window.innerWidth,window.innerHeight)*.12);
  window.addEventListener('resize',()=>{camera.left=-window.innerWidth/2;camera.right=window.innerWidth/2;camera.top=window.innerHeight/2;camera.bottom=-window.innerHeight/2;camera.updateProjectionMatrix();renderer.setSize(window.innerWidth,window.innerHeight);});
  const animate=now=>{const dt=Math.min(.035,(now-last)/1000);last=now;phase+=dt*8;
    const dx=target.x-state.x,dy=target.y-state.y,dist=Math.hypot(dx,dy);
    if(dist<moveBounds()*.55)chooseTarget();
    const desired=new THREE.Vector3(dx,dy,0).normalize().multiplyScalar(95+state.depth*80);velocity.lerp(desired,1-Math.pow(.002,dt));state.x+=velocity.x*dt;state.y+=velocity.y*dt;
    const speed=Math.hypot(velocity.x,velocity.y);const direction=Math.atan2(velocity.y,velocity.x);
    const depth=.15+.85*((Math.sin(now*.00019)+1)/2);const scale=.58+depth*.48;sheep.position.set(state.x,state.y,-8+depth*8);sheep.scale.setScalar(scale);sheep.rotation.y=direction-Math.PI/2;
    const walk=Math.min(1,speed/100);const step=Math.sin(phase)*.55*walk;legs[0].rotation.x=step;legs[1].rotation.x=-step;legs[2].rotation.x=-step;legs[3].rotation.x=step;
    sheep.position.y+=Math.abs(Math.sin(phase*2))*3*walk;head.rotation.z=Math.sin(phase*.5)*.035;tail.rotation.z=Math.sin(phase*1.7)*.18;
    groundShadow.position.set(state.x,-window.innerHeight/2+Math.max(72,state.y+window.innerHeight/2-10),0);groundShadow.scale.setScalar(.65+depth*.45);
    renderer.render(scene,camera);requestAnimationFrame(animate)};
  requestAnimationFrame(animate);
}

loadWeather();
init3DSheepy();