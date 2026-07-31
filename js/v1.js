'use strict';
(() => {
 const q=id=>document.getElementById(id), modal=(title,body)=>{const wrap=document.createElement('div');wrap.className='v1Modal';wrap.innerHTML=`<div class="v1Card"><h1>${title}</h1>${body}<div class="v1Actions"><button data-close>Close</button></div></div>`;document.body.appendChild(wrap);wrap.querySelector('[data-close]').onclick=()=>wrap.remove();return wrap};
 p.version='1.0';p.sounds??=[];p.variables??={};p.multiplayer??={enabled:false,url:'',key:'',maxPlayers:8};
 // Room wave controls
 const oldNormalize=normalize;normalize=function(){oldNormalize();p.version='1.0';p.sounds??=[];p.variables??={};p.multiplayer??={enabled:false,url:'',key:'',maxPlayers:8};for(const r of p.rooms){r.waveEnabled??=false;r.waves??=[]}window.DerpeditMultiplayer?.ensureLobby()};
 const oldRooms=renderRooms;renderRooms=function(){oldRooms();const r=room();if(!r)return;q('waveEnabled').checked=!!r.waveEnabled};
 q('waveEnabled').onchange=()=>{checkpoint();room().waveEnabled=q('waveEnabled').checked;render()};
 q('editWaves').onclick=()=>openWaves();
 function waveEnemyTemplates(){
  return room().objects.filter(o=>
    o.type==='being'&&(o.beingRole==='enemy'||o.behavior==='chase')
  );
}
function enemyOptions(selectedId=''){
  const enemies=waveEnemyTemplates();
  return enemies.map(o=>`<option value="${o.id}" ${o.id===selectedId?'selected':''}>${o.name||'Enemy'}</option>`).join('')
    ||'<option value="">No Enemy Beings found in this Room</option>';
}
 function lootOptions(selectedId=''){return '<option value="">No loot</option>'+room().objects.filter(o=>o.type==='item').map(o=>`<option value="${o.id}" ${o.id===selectedId?'selected':''}>${o.name}</option>`).join('')}
 function openWaves(){const r=room();const m=modal('Wave System',`<p>Each wave clones Enemy Beings from this Room. Add a Being, select it, set <b>Being Type</b> to <b>Enemy</b>, then reopen this window. Existing chase enemies are also accepted.</p><div id="waveList"></div><button id="addWave">+ Add Wave</button><div class="v1Actions"><button id="saveWaves">Save Waves</button></div>`);const list=m.querySelector('#waveList');
   const draw=()=>{list.innerHTML='';r.waves.forEach((w,wi)=>{const card=document.createElement('div');card.className='waveCard';card.innerHTML=`<div class="v1Row"><strong>Wave ${wi+1}</strong><label>Delay <input data-delay type="number" min="0" step=".1" value="${w.delay??1}"></label><button data-remove-wave>Remove</button></div><div data-entries></div><button data-add-entry>+ Enemy</button>`;const entries=card.querySelector('[data-entries]');const drawEntries=()=>{entries.innerHTML='';(w.entries||[]).forEach((e,ei)=>{const row=document.createElement('div');row.className='waveEntry';row.innerHTML=`<select data-enemy>${enemyOptions(e.enemyId)}</select><input data-count type="number" min="1" value="${e.count||1}" title="Count"><input data-speed type="number" min="0" value="${e.speed||100}" title="Speed"><select data-loot>${lootOptions(e.lootItemId)}</select><button data-remove>×</button>`;row.querySelector('[data-enemy]').onchange=x=>e.enemyId=x.target.value;row.querySelector('[data-count]').onchange=x=>e.count=Number(x.target.value);row.querySelector('[data-speed]').onchange=x=>e.speed=Number(x.target.value);row.querySelector('[data-loot]').onchange=x=>e.lootItemId=x.target.value;row.querySelector('[data-remove]').onclick=()=>{w.entries.splice(ei,1);drawEntries()};entries.appendChild(row)})};drawEntries();card.querySelector('[data-delay]').onchange=e=>w.delay=Number(e.target.value);card.querySelector('[data-add-entry]').onclick=()=>{w.entries??=[];w.entries.push({enemyId:waveEnemyTemplates()[0]?.id||'',count:1,speed:100,lootItemId:''});drawEntries()};card.querySelector('[data-remove-wave]').onclick=()=>{r.waves.splice(wi,1);draw()};list.appendChild(card)})};draw();m.querySelector('#addWave').onclick=()=>{r.waves.push({delay:1,entries:[]});draw()};m.querySelector('#saveWaves').onclick=()=>{checkpoint();r.waveEnabled=true;q('waveEnabled').checked=true;persistProject();m.remove();render();status('Wave system saved.')};}
 // Inspector search
 q('inspectorSearch').addEventListener('input',e=>{const term=e.target.value.trim().toLowerCase();q('props').querySelectorAll('label,.section').forEach(el=>{if(el.id==='props')return;const own=(el.tagName==='LABEL'?el.innerText:(el.querySelector(':scope > h2')?.innerText||'')).toLowerCase();el.classList.toggle('propFiltered',!!term&&!own.includes(term)&&!el.innerText.toLowerCase().includes(term))})});
 // Expanded project explorer without moving the existing layout.
 const parts=q('tab-parts');const ex=document.createElement('div');ex.className='projectExplorer section';ex.innerHTML='<h2>PROJECT EXPLORER</h2><button data-open="rooms">Rooms</button><button data-open="assets">Sprites</button><button data-info="objects">Objects</button><button data-info="scripts">Scripts</button><button data-info="music">Music</button><button data-info="sounds">Sounds</button><button data-info="variables">Variables</button><button data-info="animations">Animations</button><button data-open="toolbox">Toolbox</button>';parts.prepend(ex);ex.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>document.querySelector(`[data-tab="${b.dataset.open}"]`)?.click());ex.querySelectorAll('[data-info]').forEach(b=>b.onclick=()=>openExplorer(b.dataset.info));
 function openExplorer(kind){let body='';if(kind==='objects')body='<pre>'+p.rooms.map(r=>r.name+': '+r.objects.length+' Objects').join('\n')+'</pre>';if(kind==='scripts')body='<pre>'+p.rooms.flatMap(r=>r.objects.filter(o=>o.script).map(o=>r.name+' / '+o.name+'\n'+o.script)).join('\n\n')+'</pre>';if(kind==='music')body='<pre>'+(p.music.map(x=>x.name).join('\n')||'No music imported.')+'</pre>';if(kind==='sounds')body='<p>Sound asset organization is ready for future runtime sound commands.</p>';if(kind==='variables')body='<textarea id="varsJson" class="generatorCode">'+JSON.stringify(p.variables,null,2)+'</textarea><button id="saveVars">Save Variables</button>';if(kind==='animations')body='<pre>'+p.rooms.flatMap(r=>r.objects.filter(o=>Object.values(o.animations||{}).some(Boolean)).map(o=>r.name+' / '+o.name)).join('\n')+'</pre>';const m=modal(kind[0].toUpperCase()+kind.slice(1),body);m.querySelector('#saveVars')?.addEventListener('click',()=>{try{checkpoint();p.variables=JSON.parse(m.querySelector('#varsJson').value);render();m.remove()}catch(e){alert(e.message)}})}
 // Asset drag/drop onto objects.
 const oldAssets=renderAssets;renderAssets=function(){oldAssets();q('assets').querySelectorAll('button').forEach((b,i)=>{const a=p.assets[i];if(!a)return;b.draggable=true;b.ondragstart=e=>e.dataTransfer.setData('text/derpedit-asset',a.id)})};q('layer').addEventListener('dragover',e=>e.preventDefault());q('layer').addEventListener('drop',e=>{e.preventDefault();const assetId=e.dataTransfer.getData('text/derpedit-asset');if(!assetId)return;const host=e.target.closest('.obj');const o=room().objects.find(x=>x.id===host?.dataset.id);if(o){checkpoint();o.assetId=assetId;sel=o.id;render();status('Sprite applied by drag and drop.')}});
 // Minimap
 const mini=document.createElement('canvas');mini.id='miniMap';mini.className='miniMap';mini.width=360;mini.height=220;q('workspace').appendChild(mini);mini.onclick=e=>{const r=mini.getBoundingClientRect(),rm=room();window.focusEditorWorld?.((e.clientX-r.left)/r.width*(rm.width||1280),(e.clientY-r.top)/r.height*(rm.height||720))};
 function drawMini(){const rm=room();if(!rm||game){mini.classList.add('hidden');return}mini.classList.remove('hidden');const c=mini.getContext('2d');c.clearRect(0,0,mini.width,mini.height);c.fillStyle=p.background;c.fillRect(0,0,mini.width,mini.height);const sx=mini.width/(rm.width||1280),sy=mini.height/(rm.height||720);for(const o of rm.objects){c.fillStyle=o.color||'#fff';c.fillRect(o.x*sx,o.y*sy,Math.max(2,o.w*sx),Math.max(2,o.h*sy))}}
 const oldRender=render;render=function(){oldRender();drawMini()};
 // Templates
 q('templatesBtn').onclick=()=>{const m=modal('Game Templates','<div class="v1Grid"><button class="templateButton" data-t="shooter"><b>Top-down Shooter</b><br>Player, enemy, camera, weapon and waves.</button><button class="templateButton" data-t="platformer"><b>Platformer</b><br>Player, floor, goal and camera.</button><button class="templateButton" data-t="waves"><b>Wave Survival</b><br>Player, enemy template and three waves.</button><button class="templateButton" data-t="multiplayer"><b>Multiplayer Sandbox</b><br>Join Lobby and large shared room.</button></div>');m.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{applyTemplate(b.dataset.t);m.remove()})};
 function baseBeing(role,x,y,color){return {id:uid(),type:'being',name:role==='player'?'Player':'Enemy',beingRole:role,behavior:role==='player'?'player':'chase',x,y,w:44,h:44,rotation:0,color,speed:role==='player'?240:100,health:100,damage:10,cooldown:.5,layer:'world',opacity:100,renderLayer:0,physics:false,gravity:false,collision:true,team:role==='player'?'Player':'Enemy',animations:{idle:'',walk:'',jump:'',fall:''},script:''}}
 function applyTemplate(t){checkpoint();let r={id:uid(),name:'Game',type:'game',cameraMode:'follow',width:2400,height:1400,infinite:false,musicId:'',objects:[],waveEnabled:false,waves:[]};r.objects.push(baseBeing('player',120,120,'#278cff'));if(t==='platformer'){p.gameType='platformer';r.name='Platformer';r.objects.push({id:uid(),type:'collisionblock',name:'Floor',x:0,y:620,w:2200,h:80,rotation:0,color:'#d8dee9',speed:0,behavior:'solid',health:9999,damage:0,cooldown:0,layer:'world',opacity:100,renderLayer:0,collision:true,team:'Neutral',animations:{},script:''})}else{p.gameType='topdown';const e=baseBeing('enemy',700,400,'#e3424f');r.objects.push(e);if(t==='waves'||t==='shooter'){r.waveEnabled=true;r.waves=[1,2,3].map((_,i)=>({delay:1,entries:[{enemyId:e.id,count:(i+1)*2,speed:90+i*25,lootItemId:''}]}))}}if(t==='multiplayer'){p.multiplayer.enabled=true;r.name='Shared Sandbox';r.width=5000;r.height=3000;window.DerpeditMultiplayer.ensureLobby()}p.rooms.push(r);roomId=r.id;sel=null;sync();render();persistProject();status('Template created: '+r.name)}
 // Script game generator
 q('generatorBtn').onclick=()=>{const sample=`create game "Small Wave Shooter"
game background #202633
game type topdown
create room "Arena" game
room "Arena" camera follow
room "Arena" size 900 600
create player "Player"
create gun "Pistol"
gun type projectile
gun damage 20
gun cooldown 0.25
gun projectile speed 650
gun projectile lifetime 2
gun spread 0
create enemy "Small Zombie"
enemy size 24 24
enemy health 75
enemy speed 95
enemy damage 12
enemy color #55aa55
wave 1
spawn "Small Zombie" 5
wave 2
spawn "Small Zombie" 8
wave 3
spawn "Small Zombie" 12`;const m=modal('Generate Game from DerpyScript',`<p>Runs once in the editor and can create up to 10 Rooms.</p><textarea id="genCode" class="generatorCode">${sample}</textarea><div class="v1Actions"><button id="runGen">Generate Project</button></div>`);m.querySelector('#runGen').onclick=()=>{generate(m.querySelector('#genCode').value);m.remove()}};
 function generatedBeing(role,name){
  return {id:uid(),type:'being',name,beingRole:role,behavior:role==='enemy'?'chase':'player',movementType:'normal',bouncePower:430,throwPower:700,x:120,y:120,w:44,h:44,rotation:0,color:role==='enemy'?'#e3424f':'#278cff',speed:role==='enemy'?100:240,health:100,damage:10,cooldown:.5,layer:'world',opacity:100,renderLayer:0,physics:false,gravity:false,collision:true,team:role==='enemy'?'Enemy':'Player',animations:{idle:'',walk:'',jump:'',fall:''},script:'',breakable:false,breakHealth:100,breakDrop:''};
 }
 function generatedGun(name){
  return {id:uid(),type:'item',name,itemId:name,x:180,y:120,w:30,h:30,rotation:0,color:'#ffd33d',speed:0,behavior:'item',health:1,damage:0,cooldown:0,layer:'world',opacity:100,renderLayer:0,physics:false,gravity:false,collision:false,team:'Neutral',animations:{idle:'',walk:'',jump:'',fall:''},script:'',stackSize:1,pickupAmount:1,autoPickup:true,equipOnPickup:true,itemUsable:true,weaponType:'projectile',projectileSpeed:650,projectileDamage:20,weaponCooldown:.25,projectileLifetime:2,projectileCount:1,projectileSpread:0,catapultArcHeight:180,catapultRadius:70,catapultTravelTime:.8,catapultDamage:30,breakable:false,breakHealth:100,breakDrop:''};
 }
 function generate(src){
  checkpoint();
  const lines=src.split(/\n/).map(x=>x.trim()).filter(Boolean);
  let np={version:'1.1',name:'Generated Game',gameType:'topdown',background:'#202633',startRoom:'',music:[],sounds:[],assets:[],variables:{},multiplayer:{enabled:false,url:'',key:'',maxPlayers:8},rooms:[]};
  let currentRoom=null,currentEnemy=null,currentGun=null,currentWave=null;
  const getRoom=name=>np.rooms.find(r=>r.name.toLowerCase()===String(name).toLowerCase());
  const ensureRoom=()=>{
    if(currentRoom)return currentRoom;
    const id=uid();currentRoom={id,name:'Game',type:'game',cameraMode:'follow',width:1280,height:720,infinite:false,musicId:'',objects:[],waveEnabled:false,waves:[]};
    np.rooms.push(currentRoom);np.startRoom||=id;return currentRoom;
  };
  for(const line of lines){
    let m;
    if((m=line.match(/^create game(?:\s+"([^"]+)")?/i)))np.name=m[1]||np.name;
    else if((m=line.match(/^game background\s+(.+)/i)))np.background=m[1];
    else if((m=line.match(/^game type\s+(topdown|platformer)/i)))np.gameType=m[1].toLowerCase();
    else if((m=line.match(/^create room\s+"([^"]+)"(?:\s+(game|menu))?/i))&&np.rooms.length<10){
      const id=uid();currentRoom={id,name:m[1],type:m[2]||'game',cameraMode:'fixed',width:1280,height:720,infinite:false,musicId:'',objects:[],waveEnabled:false,waves:[]};
      np.rooms.push(currentRoom);np.startRoom||=id;currentEnemy=null;currentGun=null;currentWave=null;
    }
    else if((m=line.match(/^use room\s+"([^"]+)"/i)))currentRoom=getRoom(m[1])||currentRoom;
    else if((m=line.match(/^room\s+"([^"]+)"\s+camera\s+(fixed|follow|infinite)/i))){const r=getRoom(m[1]);if(r)r.cameraMode=m[2]}
    else if((m=line.match(/^room\s+"([^"]+)"\s+size\s+(\d+)\s+(\d+)/i))){const r=getRoom(m[1]);if(r){r.width=Number(m[2]);r.height=Number(m[3])}}
    else if((m=line.match(/^create player(?:\s+"([^"]+)")?/i))){currentEnemy=null;currentGun=null;const o=generatedBeing('player',m[1]||'Player');ensureRoom().objects.push(o)}
    else if((m=line.match(/^create enemy\s+"([^"]+)"/i))){currentGun=null;currentEnemy=generatedBeing('enemy',m[1]);ensureRoom().objects.push(currentEnemy)}
    else if((m=line.match(/^enemy sprite\s+"([^"]+)"/i))){if(currentEnemy)currentEnemy.generatedSpriteName=m[1]}
    else if((m=line.match(/^enemy size\s+(\d+)\s+(\d+)/i))){if(currentEnemy){currentEnemy.w=Number(m[1]);currentEnemy.h=Number(m[2])}}
    else if((m=line.match(/^enemy health\s+([\d.]+)/i))){if(currentEnemy)currentEnemy.health=Number(m[1])}
    else if((m=line.match(/^enemy speed\s+([\d.]+)/i))){if(currentEnemy)currentEnemy.speed=Number(m[1])}
    else if((m=line.match(/^enemy damage\s+([\d.]+)/i))){if(currentEnemy)currentEnemy.damage=Number(m[1])}
    else if((m=line.match(/^enemy color\s+(.+)/i))){if(currentEnemy)currentEnemy.color=m[1]}
    else if((m=line.match(/^enemy movement\s+(normal|bouncy|throw)/i))){if(currentEnemy)currentEnemy.movementType=m[1].toLowerCase()}
    else if((m=line.match(/^create gun\s+"([^"]+)"/i))){currentEnemy=null;currentGun=generatedGun(m[1]);ensureRoom().objects.push(currentGun)}
    else if((m=line.match(/^gun type\s+(projectile|catapult|melee)/i))){if(currentGun)currentGun.weaponType=m[1].toLowerCase()}
    else if((m=line.match(/^gun projectile sprite\s+"([^"]+)"/i))){if(currentGun)currentGun.projectileSpriteName=m[1]}
    else if((m=line.match(/^gun damage\s+([\d.]+)/i))){if(currentGun){currentGun.projectileDamage=Number(m[1]);currentGun.meleeDamage=Number(m[1]);currentGun.catapultDamage=Number(m[1])}}
    else if((m=line.match(/^gun cooldown\s+([\d.]+)/i))){if(currentGun)currentGun.weaponCooldown=Number(m[1])}
    else if((m=line.match(/^gun projectile speed\s+([\d.]+)/i))){if(currentGun)currentGun.projectileSpeed=Number(m[1])}
    else if((m=line.match(/^gun projectile lifetime\s+([\d.]+)/i))){if(currentGun)currentGun.projectileLifetime=Number(m[1])}
    else if((m=line.match(/^gun spread\s+([\d.]+)/i))){if(currentGun)currentGun.projectileSpread=Number(m[1])}
    else if((m=line.match(/^gun count\s+(\d+)/i))){if(currentGun)currentGun.projectileCount=Number(m[1])}
    else if((m=line.match(/^gun catapult radius\s+([\d.]+)/i))){if(currentGun)currentGun.catapultRadius=Number(m[1])}
    else if((m=line.match(/^gun catapult arc\s+([\d.]+)/i))){if(currentGun)currentGun.catapultArcHeight=Number(m[1])}
    else if((m=line.match(/^breakable\s+(true|false)/i))){const target=currentEnemy||currentGun;if(target)target.breakable=m[1].toLowerCase()==='true'}
    else if((m=line.match(/^break health\s+([\d.]+)/i))){const target=currentEnemy||currentGun;if(target)target.breakHealth=Number(m[1])}
    else if((m=line.match(/^new value\s+([A-Za-z_]\w*)(?:\s*=\s*(.+))?/i)))np.variables[m[1]]=m[2]!==undefined?(Number.isFinite(Number(m[2]))?Number(m[2]):m[2]):0;
    else if((m=line.match(/^set value\s+([A-Za-z_]\w*)\s+to\s+(.+)/i)))np.variables[m[1]]=Number.isFinite(Number(m[2]))?Number(m[2]):m[2];
    else if((m=line.match(/^wave\s+(\d+)/i))){const r=ensureRoom();r.waveEnabled=true;while(r.waves.length<Number(m[1]))r.waves.push({delay:1,entries:[]});currentWave=r.waves[Number(m[1])-1]}
    else if((m=line.match(/^spawn\s+"([^"]+)"\s+(\d+)/i))){const r=ensureRoom(),enemy=r.objects.find(o=>o.type==='being'&&o.beingRole==='enemy'&&o.name.toLowerCase()===m[1].toLowerCase());if(currentWave&&enemy)currentWave.entries.push({enemyId:enemy.id,count:Number(m[2]),speed:enemy.speed,lootItemId:''})}
  }
  if(!np.rooms.length)ensureRoom();
  p=np;roomId=p.startRoom;sel=null;sync();render();persistProject();status('Generated '+p.rooms.length+' Room(s), '+p.rooms.reduce((n,r)=>n+r.objects.length,0)+' Object(s).');
 }
 // Multiplayer settings
 q('onlineBtn').onclick=()=>{p.multiplayer??={enabled:false,url:'',key:'',maxPlayers:8};const m=modal('Multiplayer',`<label class="checkrow">Enable multiplayer<input id="mpEnabled" type="checkbox" ${p.multiplayer.enabled?'checked':''}></label><label>Supabase Project URL<input id="mpUrl" value="${p.multiplayer.url||''}"></label><label>Publishable / anon key<input id="mpKey" type="password" value="${p.multiplayer.key||''}"></label><label>Maximum players<input id="mpMax" type="number" min="2" max="32" value="${p.multiplayer.maxPlayers||8}"></label><hr><div class="v1Row"><input id="playerName" placeholder="Player name" value="${localStorage.getItem('derpedit.playerName')||'Player'}"><input id="joinCode" maxlength="6" placeholder="JOIN CODE" value="${localStorage.getItem('derpedit.joinCode')||''}"></div><div class="v1Row"><button id="hostRoom">Create Code</button><button id="joinRoom">Join/Test</button><button id="leaveRoom">Disconnect</button></div><p class="muted">A Join Lobby Room is always created while multiplayer is enabled. Exported multiplayer projects need the Supabase Realtime setup from SUPABASE_MULTIPLAYER_SETUP.sql.</p><div class="v1Actions"><button id="saveMp">Save Settings</button></div>`);m.querySelector('#hostRoom').onclick=()=>m.querySelector('#joinCode').value=window.DerpeditMultiplayer.hostCode();m.querySelector('#joinRoom').onclick=async()=>{try{await window.DerpeditMultiplayer.connect(m.querySelector('#joinCode').value,m.querySelector('#playerName').value);status('Multiplayer test connected.')}catch(e){alert(e.message)}};m.querySelector('#leaveRoom').onclick=()=>window.DerpeditMultiplayer.disconnect();m.querySelector('#saveMp').onclick=()=>{checkpoint();p.multiplayer={enabled:m.querySelector('#mpEnabled').checked,url:m.querySelector('#mpUrl').value.trim(),key:m.querySelector('#mpKey').value.trim(),maxPlayers:Number(m.querySelector('#mpMax').value)||8};window.DerpeditMultiplayer.ensureLobby();persistProject();render();m.remove();status('Multiplayer settings saved.')}};
 q('exportZip').onclick=()=>window.DerpeditExporter.exportZip();
 // Runtime waves and DerpyScript events.
 function isEnemy(o){return o&&!o.destroyed&&o.type==='being'&&(o.beingRole==='enemy'||o.behavior==='chase')}
 function executeLines(g,owner,lines){for(const line of lines){let m;if((m=line.match(/^spawn wave\s+(\d+)/i)))spawnWave(g,Number(m[1]));else if(/^start next wave$/i.test(line))spawnWave(g,(g.waveNumber||0)+1);else if((m=line.match(/^display\s+"([^"]*)"/i)))status(m[1]);else if((m=line.match(/^go to room\s+(.+)/i))){const r=p.rooms.find(x=>x.name.toLowerCase()===m[1].toLowerCase()||x.id===m[1]);if(r){game=null;startGame(r.id,true)}}}}
 function parseAllClear(o){const lines=String(o.script||'').split(/\n/).map(x=>x.trim()).filter(Boolean),out=[];let active=false;for(const line of lines){if(/^when all enemies cleared$/i.test(line)){active=true;continue}if(/^when /i.test(line)){active=false;continue}if(active)out.push(line)}return out}
 function spawnWave(g,n){const w=room().waves?.[n-1];if(!w)return status('Wave '+n+' does not exist.');g.waveNumber=n;g.waveActive=true;for(const entry of w.entries||[]){const t=room().objects.find(o=>o.id===entry.enemyId);if(!t)continue;for(let i=0;i<Math.max(1,entry.count||1);i++){const e=clone(t);e.id=uid();e.x=50+Math.random()*Math.max(50,g.worldW-100);e.y=50+Math.random()*Math.max(50,g.worldH-100);e.speed=Number(entry.speed)||e.speed;e._waveLoot=entry.lootItemId;e.destroyed=false;g.O.push(e)}}status('Wave '+n+' started.')}
 const originalStart=startGame;startGame=function(id,preserve=false){originalStart(id,preserve);if(!game)return;const rm=room();game.waveNumber=0;game.waveActive=false;game._allClearScripts=game.O.map(o=>({o,lines:parseAllClear(o)})).filter(x=>x.lines.length);game._respawnSnapshots=new Map();for(const o of game.O){const m=String(o.script||'').match(/respawn after\s+([\d.]+)\s*seconds?/i);if(m){o.respawnAfter=Number(m[1]);game._respawnSnapshots.set(o.id,clone(o))}}if(rm.isMultiplayerLobby&&p.multiplayer?.enabled){
 const box=q('playButtons');const panel=document.createElement('div');panel.className='mpLobbyPanel';panel.innerHTML=`<h2>Multiplayer</h2><input data-name placeholder="Player name" value="${localStorage.getItem('derpedit.playerName')||'Player'}"><input data-code maxlength="6" placeholder="JOIN CODE" value="${localStorage.getItem('derpedit.joinCode')||''}"><div class="v1Row"><button data-host>New Code</button><button data-join>Join</button></div><small>After connecting, use a normal Room button or stop Play Mode and test the shared game Room.</small>`;box.appendChild(panel);panel.querySelector('[data-host]').onclick=()=>panel.querySelector('[data-code]').value=window.DerpeditMultiplayer.hostCode();panel.querySelector('[data-join]').onclick=async()=>{try{await window.DerpeditMultiplayer.connect(panel.querySelector('[data-code]').value,panel.querySelector('[data-name]').value);status('Connected. Open a shared Game Room to test player syncing.')}catch(e){alert(e.message)}};
 }
 if(rm.waveEnabled){const templateIds=new Set((rm.waves||[]).flatMap(w=>(w.entries||[]).map(e=>e.enemyId)));game.O=game.O.filter(o=>!templateIds.has(o.id));setTimeout(()=>{if(game&&game.currentRoom===rm.id)spawnWave(game,1)},250)}};
 const originalLoop=loop;loop=function(t){const before=game;if(before){const count=before.O.filter(isEnemy).length;if(before._lastEnemyCount>0&&count===0){for(const s of before._allClearScripts||[])executeLines(before,s.o,s.lines);if(before.waveActive){before.waveActive=false;const next=(before.waveNumber||0)+1,delay=Number(room().waves?.[before.waveNumber-1]?.delay??1)*1000;if(room().waves?.[next-1])setTimeout(()=>{if(game===before)spawnWave(before,next)},delay)}}before._lastEnemyCount=count;for(const [id,snap] of before._respawnSnapshots||[]){if(!before.O.some(o=>o.id===id)&&!before._respawnTimers?.[id]){before._respawnTimers??={};before._respawnTimers[id]=setTimeout(()=>{if(game===before){before.O.push(clone(snap));delete before._respawnTimers[id]}},Math.max(0,snap.respawnAfter)*1000)}}}originalLoop(t);if(game===before&&before){window.DerpeditMultiplayer?.tick(before);if(room().waveEnabled)q('score').textContent+=' | Wave: '+(before.waveNumber||0)+' | Enemies: '+before.O.filter(isEnemy).length}};
 // Extend command guide.
 DerpyScript.commandDocs.push(
  {command:'when all enemies cleared',category:'Waves',description:'Runs after the final active Enemy in the Room is defeated.',example:'when all enemies cleared\nstart next wave'},
  {command:'spawn wave ___',category:'Waves',description:'Starts a numbered wave from the Room wave editor.',example:'spawn wave 3'},
  {command:'start next wave',category:'Waves',description:'Starts the wave after the current one.',example:'start next wave'},
  {command:'wave number',category:'Waves',description:'Runtime value representing the current wave number.',example:'display wave number'},
  {command:'enemy count',category:'Waves',description:'Runtime value representing active enemies.',example:'enemy count'},
  {command:'remaining enemies',category:'Waves',description:'Alias for the active enemy count.',example:'remaining enemies'},
  {command:'respawn after ___ seconds',category:'Objects',description:'Respawns this runtime Object after it is destroyed.',example:'respawn after 30 seconds'},
  {command:'create game "___"',category:'Generator',description:'Editor-only generator command that creates a new project once.',example:'create game "Arena"'},
  {command:'create room "___" game/menu',category:'Generator',description:'Editor-only generator command. A generator can create up to 10 Rooms.',example:'create room "Level 1" game'}
 );
 normalize();render();

 // v1.1 movement types: patches player input without replacing the renderer.
 const oldStartMovement=startGame;
 startGame=function(id,preserve=false){
   oldStartMovement(id,preserve);
   if(game){
     game.pl.movementType??='normal';
     game.pl.bouncePower??=430;
     game.pl.throwPower??=700;
     game.pl._throwVX??=0;game.pl._throwVY??=0;
   }
 };
 const playCanvas=q('canvas');
 playCanvas?.addEventListener('pointerdown',e=>{
   if(!game||game.pl.movementType!=='throw')return;
   const rect=playCanvas.getBoundingClientRect();
   const screenX=(e.clientX-rect.left)*(game.w/rect.width);
   const screenY=(e.clientY-rect.top)*(game.h/rect.height);
   const pt=window.DerpeditCamera?window.DerpeditCamera.screenToWorld(game,screenX,screenY):{x:screenX,y:screenY};
   const cx=game.pl.x+game.pl.w/2,cy=game.pl.y+game.pl.h/2;
   const dx=pt.x-cx,dy=pt.y-cy,len=Math.hypot(dx,dy)||1;
   game.pl._throwVX=dx/len*(game.pl.throwPower||700);
   game.pl._throwVY=dy/len*(game.pl.throwPower||700);
   game.pl._throwing=true;
 });

})();
