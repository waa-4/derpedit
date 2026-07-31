
const $=id=>document.getElementById(id),layer=$('layer'),workspace=$('workspace');
const defs={
being:{w:44,h:44,color:'#278cff',speed:240,behavior:'player',beingRole:'player',health:100,damage:10,cooldown:.5,name:'Being'},
basicblock:{w:96,h:48,color:'#8793a6',speed:0,behavior:'none',health:9999,damage:0,cooldown:0,name:'Basic Block',collision:false},
collisionblock:{w:120,h:36,color:'#d8dee9',speed:0,behavior:'solid',health:9999,damage:0,cooldown:0,name:'Collision Block',collision:true},
item:{w:30,h:30,color:'#ffd33d',speed:0,behavior:'item',health:1,damage:0,cooldown:0,name:'Item',collision:false},
scriptobject:{w:56,h:56,color:'#8d5cff',speed:0,behavior:'none',health:1,damage:0,cooldown:0,name:'Script Object',collision:false},
coin:{w:28,h:28,color:'#ffd33d',speed:0,behavior:'coin',health:1,damage:0,cooldown:0,name:'Coin',collision:false},
damage:{w:90,h:28,color:'#ff355d',speed:0,behavior:'damage',health:9999,damage:25,cooldown:.5,name:'Damage Object'},
text:{w:150,h:36,color:'#ffffff',speed:0,behavior:'none',health:1,damage:0,cooldown:0,name:'World Text',text:'Hello, Derpedit!'},
label:{w:180,h:42,color:'#ffffff',speed:0,behavior:'none',health:1,damage:0,cooldown:0,name:'Label',text:'Label',layer:'ui'},
button:{w:180,h:52,color:'#246fbb',speed:0,behavior:'none',health:1,damage:0,cooldown:0,name:'Button',text:'START',layer:'ui',action:'goto'},
healthbar:{w:220,h:24,color:'#42e36d',speed:0,behavior:'none',health:1,damage:0,cooldown:0,name:'Health Bar',layer:'ui'},
spawn:{w:46,h:46,color:'#61efff',speed:0,behavior:'spawn',health:1,damage:0,cooldown:0,name:'Spawn',collision:false}
};
let p={version:'0.4',name:'My Derpedit Game',gameType:'topdown',movementMode:'topdown',movementSettings:{acceleration:1200,friction:.86,gravity:900,jumpPower:420,throwPower:700,dashPower:850,dashCooldown:.5,swimDrag:.92,throwSticky:true},background:'#202633',startRoom:'room1',music:[],rooms:[{id:'room1',name:'Main Menu',type:'menu',objects:[]},{id:'room2',name:'Level 1',type:'game',objects:[]}],assets:[]},roomId='room1',sel=null,hist=[],future=[],drag=null,resize=null,game=null,runState=null,selectedAsset=null;

const AUTOSAVE_KEY='derpedit.autosave.v051';
let autosaveTimer=null;
function persistProject(){
  try{
    localStorage.setItem(AUTOSAVE_KEY,JSON.stringify({
      project:p,
      roomId,
      selectedId:sel,
      savedAt:Date.now()
    }));
  }catch(err){console.warn('Derpedit autosave unavailable:',err)}
}
function queueAutosave(){
  clearTimeout(autosaveTimer);
  autosaveTimer=setTimeout(persistProject,120);
}
function restoreAutosave(){
  try{
    const raw=localStorage.getItem(AUTOSAVE_KEY);
    if(!raw)return false;
    const saved=JSON.parse(raw);
    if(!saved?.project?.rooms)return false;
    p=saved.project;
    roomId=saved.roomId||p.startRoom||p.rooms[0]?.id;
    sel=saved.selectedId||null;
    normalize();
    return true;
  }catch(err){
    console.warn('Could not restore Derpedit autosave:',err);
    return false;
  }
}
const clone=v=>JSON.parse(JSON.stringify(v)),uid=()=>Math.random().toString(36).slice(2)+Date.now().toString(36),room=()=>p.rooms.find(r=>r.id===roomId),selected=()=>room()?.objects.find(o=>o.id===sel),snap=v=>$('snap').checked?Math.round(v/24)*24:Math.round(v);
function checkpoint(){hist.push(JSON.stringify(p));if(hist.length>70)hist.shift();future=[];buttons()}function buttons(){$('undo').disabled=!hist.length;$('redo').disabled=!future.length}function status(t){$('status').textContent=t}
function normalize(){if(!p.rooms){p.rooms=[{id:'room1',name:'Level 1',type:'game',objects:p.objects||[]}];p.startRoom='room1';delete p.objects}delete p.runtimeInventory;p.assets=p.assets||[];p.music=p.music||[];p.sounds=p.sounds||[];p.variables=p.variables||{};p.multiplayer=p.multiplayer||{enabled:false,url:'',key:'',maxPlayers:8};p.movementMode??=p.gameType||'topdown';
p.movementSettings??={acceleration:1200,friction:.86,gravity:900,jumpPower:420,throwPower:700,dashPower:850,dashCooldown:.5,swimDrag:.92,throwSticky:true};
p.movementSettings.acceleration??=1200;p.movementSettings.friction??=.86;p.movementSettings.gravity??=900;p.movementSettings.jumpPower??=420;p.movementSettings.throwPower??=700;p.movementSettings.dashPower??=850;p.movementSettings.dashCooldown??=.5;p.movementSettings.swimDrag??=.92;p.movementSettings.throwSticky??=true;
p.gameType=(p.movementMode==='platformer'||p.movementMode==='bouncy')?'platformer':'topdown';for(const r of p.rooms){r.cameraMode??='fixed';r.width??=1280;r.height??=720;r.infinite??=false;r.musicId??='';r.waveEnabled??=false;r.waves??=[];r.zoom??=1;for(const o of r.objects){o.health??=100;o.damage??=0;o.cooldown??=.5;o.layer??='world';o.script??='';o.action??='none';o.targetRoom??='';o.opacity??=100;o.renderLayer??=0;o.physics??=false;o.gravity??=false;o.collision??=true;o.team??='Neutral';o.animations??={idle:'',walk:'',jump:'',fall:''};o.breakable??=false;o.breakHealth??=100;o.breakDrop??='';o.useGradient??=false;o.gradientStart??=o.color||'#ffffff';o.gradientEnd??='#000000';o.gradientDirection??='vertical';o.fontFamily??='system-ui';o.fontSize??=20;o.textColor??=o.color||'#ffffff';o.fontBold??=false;
if(o.type==='player'){o.type='being';o.beingRole='player';o.behavior='player';}
if(o.type==='enemy'){o.type='being';o.beingRole='enemy';o.behavior='chase';}
if(o.type==='wall'){o.type='collisionblock';o.name=o.name==='Wall'?'Collision Block':o.name;o.behavior='solid';o.collision=true;}
if(o.type==='being'){o.beingRole??=(o.behavior==='chase'?'enemy':o.behavior==='player'?'player':'neutral');o.movementType??='normal';o.bouncePower??=430;o.throwPower??=700;}
if(o.type==='basicblock'){o.behavior??='none';o.collision??=false;}
if(o.type==='collisionblock'){o.behavior='solid';o.collision=true;}
if(o.type==='item'){o.behavior='item';o.collision??=false;o.itemId??=o.name||'Item';o.stackSize??=1;o.pickupAmount??=1;o.autoPickup??=true;o.itemDescription??='';o.equipOnPickup??=true;o.itemUsable??=false;o.weaponType??='none';o.projectileSpeed??=520;o.projectileDamage??=15;o.weaponCooldown??=.25;o.projectileLifetime??=3;o.projectileCount??=1;o.projectileSpread??=0;o.meleeRange??=80;o.meleeArc??=100;o.meleeDamage??=25;o.meleeSwingTime??=.18;o.meleeKnockback??=0;o.meleeHitOnce??=true;o.healOnClick??=false;o.healAmount??=25;o.consumeOnHeal??=true;o.respawnAfter??=0;}
if(o.type==='scriptobject'){o.behavior='none';o.collision=false;o.physics=false;}}}}
function add(type){
  const d=defs[type];
  if(!d){alert('This Object type is not available: '+type);return}
  const r=room();
  if(!r){alert('Create or select a Room first.');return}
  checkpoint();
  const n=r.objects.filter(o=>o.type===type).length+1;
  const o={
    id:uid(),type,
    name:d.name+(n>1?' '+n:''),
    x:snap(90+n*18),y:snap(80+n*18),
    w:d.w,h:d.h,rotation:0,color:d.color,
    speed:d.speed,behavior:d.behavior,
    health:d.health,damage:d.damage,cooldown:d.cooldown,
    text:d.text||'',layer:d.layer||'world',
    action:d.action||'none',
    targetRoom:p.rooms.find(q=>q.id!==roomId)?.id||'',
    script:'',assetId:null,opacity:100,renderLayer:0,
    physics:false,gravity:false,
    collision:d.collision!==undefined?d.collision:true,
    team:'Neutral',
    animations:{idle:'',walk:'',jump:'',fall:''},
    beingRole:type==='being'?'player':undefined,movementType:type==='being'?'normal':undefined,bouncePower:type==='being'?430:undefined,throwPower:type==='being'?700:undefined,
    itemId:type==='item'?'Item':undefined,
    stackSize:type==='item'?1:undefined,
    pickupAmount:type==='item'?1:undefined,
    autoPickup:type==='item'?true:undefined,
    itemDescription:type==='item'?'':undefined,equipOnPickup:type==='item'?true:undefined,itemUsable:type==='item'?false:undefined,healOnClick:type==='item'?false:undefined,healAmount:type==='item'?25:undefined,consumeOnHeal:type==='item'?true:undefined,weaponType:type==='item'?'none':undefined,projectileSpeed:type==='item'?520:undefined,projectileDamage:type==='item'?15:undefined,weaponCooldown:type==='item'?0.25:undefined,projectileLifetime:type==='item'?3:undefined,projectileCount:type==='item'?1:undefined,projectileSpread:type==='item'?0:undefined,meleeRange:type==='item'?80:undefined,meleeArc:type==='item'?100:undefined,meleeDamage:type==='item'?25:undefined,meleeSwingTime:type==='item'?0.18:undefined,meleeKnockback:type==='item'?0:undefined,meleeHitOnce:type==='item'?true:undefined,catapultArcHeight:type==='item'?180:undefined,catapultRadius:type==='item'?70:undefined,catapultTravelTime:type==='item'?0.8:undefined,catapultDamage:type==='item'?30:undefined,breakable:false,breakHealth:100,breakDrop:'',useGradient:false,gradientStart:d.color||'#ffffff',gradientEnd:'#000000',gradientDirection:'vertical',fontFamily:'system-ui',fontSize:20,textColor:d.color||'#ffffff',fontBold:false
  };
  if(type==='being')o.team='Player';
  if(type==='scriptobject')o.opacity=75;
  r.objects.push(o);
  sel=o.id;
  render();
  status(o.name+' inserted.');
}
function render(){normalize();p.name=$('projectName').value||p.name;p.background=$('bg').value;
p.movementMode=$('movementMode')?.value||p.movementMode||p.gameType||'topdown';
p.gameType=(p.movementMode==='platformer'||p.movementMode==='bouncy')?'platformer':'topdown';
workspace.style.background=p.background;$('roomLabel').textContent=room()?.name||'';layer.innerHTML='';for(const o of [...room().objects].sort((a,b)=>(a.renderLayer||0)-(b.renderLayer||0))){const e=document.createElement('div');e.className='obj '+o.type+(o.id===sel?' sel':'');e.dataset.id=o.id;e.style.cssText=`left:${o.x}px;top:${o.y}px;width:${o.w}px;height:${o.h}px;background:${o.color};transform:rotate(${o.rotation}deg);opacity:${(o.opacity??100)/100};z-index:${100+(o.renderLayer||0)};`;const asset=p.assets.find(a=>a.id===o.assetId);if(asset){e.style.backgroundImage=`url(${asset.data})`;e.style.backgroundSize='100% 100%';e.style.imageRendering='pixelated'}e.textContent=['text','label','button'].includes(o.type)?(o.text||o.name):o.type==='spawn'?'SPAWN':o.type==='healthbar'?'HEALTH':o.name;const lp=document.createElement('span');lp.className='layerPill';lp.textContent='L'+(o.renderLayer||0);e.appendChild(lp);if(o.layer==='ui'){const b=document.createElement('span');b.className='uiBadge';b.textContent='UI';e.appendChild(b)}if(o.id===sel){for(const c of ['nw','se']){const h=document.createElement('i');h.className='handle '+c;h.dataset.handle=c;h.onpointerdown=startResize;e.appendChild(h)}const g=document.createElement('i');g.className='centerGrip';g.onpointerdown=startDrag;e.appendChild(g)}e.onpointerdown=startDrag;e.onclick=ev=>{ev.stopPropagation();sel=o.id;render()};layer.appendChild(e)}renderScene();renderRooms();renderAssets();renderProps();queueAutosave();}
function renderScene(){const s=$('scene');s.innerHTML='';for(const o of room().objects){const b=document.createElement('button');b.textContent=(o.layer==='ui'?'UI ':'')+o.type.toUpperCase()+' — '+o.name;b.className=o.id===sel?'sel':'';b.onclick=()=>{sel=o.id;render()};s.appendChild(b)}if(!room().objects.length)s.innerHTML='<div class="muted">No Parts yet.</div>'}
function renderRooms(){const x=$('rooms');x.innerHTML='';for(const r of p.rooms){const b=document.createElement('button');b.textContent=(r.type==='menu'?'☰ ':'▣ ')+r.name;b.className=r.id===roomId?'sel':'';b.onclick=()=>{roomId=r.id;sel=null;render()};x.appendChild(b)}const r=room();$('roomName').value=r?.name||'';$('roomType').value=r?.type||'game';if($('roomZoom'))$('roomZoom').value=r?.zoom??1}
function renderAssets(){const x=$('assets');x.innerHTML='';for(const a of p.assets){const b=document.createElement('button');b.textContent='🎨 '+a.name;b.className=a.id===selectedAsset?'sel':'';b.onclick=()=>{selectedAsset=a.id;renderAssets()};x.appendChild(b)}if(!p.assets.length)x.innerHTML='<div class="muted">No assets yet.</div>'}
function renderProps(){const o=selected();$('none').classList.toggle('hidden',!!o);$('props').classList.toggle('hidden',!o);if(!o)return;const map=[['name','name'],['x','x'],['y','y'],['w','w'],['h','h'],['rot','rotation'],['color','color'],['speed','speed'],['behavior','behavior'],['health','health'],['damage','damage'],['cooldown','cooldown'],['text','text'],['partLayer','layer'],['action','action'],['script','script'],['renderLayer','renderLayer'],['opacity','opacity'],['team','team']];for(const [id,key] of map)$(id).value=o[key]??'';$('textWrap').classList.toggle('hidden',!['text','label','button'].includes(o.type));$('beingFields').classList.toggle('hidden',o.type!=='being');$('beingRole').value=o.beingRole||'player';
$('itemFields').classList.toggle('hidden',o.type!=='item');
$('scriptObjectFields').classList.toggle('hidden',o.type!=='scriptobject');
if(o.type==='item'){
 $('itemId').value=o.itemId||o.name||'Item';
 $('stackSize').value=o.stackSize||1;
 $('pickupAmount').value=o.pickupAmount||1;
 $('autoPickup').checked=o.autoPickup!==false;
 $('equipOnPickup').checked=o.equipOnPickup!==false;
 $('itemUsable').checked=!!o.itemUsable;
 $('weaponType').value=o.weaponType||'none';
 $('projectileSpeed').value=o.projectileSpeed??520;
 $('projectileDamage').value=o.projectileDamage??15;
 $('weaponCooldown').value=o.weaponCooldown??.25;
 $('projectileLifetime').value=o.projectileLifetime??3;
 $('projectileCount').value=o.projectileCount??1;
 $('projectileSpread').value=o.projectileSpread??0;
 $('meleeRange').value=o.meleeRange??80;
 $('meleeArc').value=o.meleeArc??100;
 $('meleeDamage').value=o.meleeDamage??25;
 $('meleeSwingTime').value=o.meleeSwingTime??.18;
 $('meleeKnockback').value=o.meleeKnockback??0;
 $('meleeHitOnce').checked=o.meleeHitOnce!==false;$('catapultArcHeight').value=o.catapultArcHeight??180;$('catapultRadius').value=o.catapultRadius??70;$('catapultTravelTime').value=o.catapultTravelTime??.8;$('catapultDamage').value=o.catapultDamage??30;
 $('itemDescription').value=o.itemDescription||'';
}$('buttonFields').classList.toggle('hidden',o.type!=='button');$('combatFields').classList.toggle('hidden',['button','label','text','healthbar','item','scriptobject','basicblock','collisionblock'].includes(o.type));const tr=$('targetRoom');tr.innerHTML=p.rooms.map(r=>`<option value="${r.id}">${r.name}</option>`).join('');tr.value=o.targetRoom||'';
$('useGradient').checked=!!o.useGradient;$('gradientStart').value=o.gradientStart||o.color||'#ffffff';$('gradientEnd').value=o.gradientEnd||'#000000';$('gradientDirection').value=o.gradientDirection||'vertical';$('textStyleFields').classList.toggle('hidden',!['text','label','button'].includes(o.type));$('fontFamily').value=o.fontFamily||'system-ui';$('fontSize').value=o.fontSize??20;$('textColor').value=o.textColor||o.color||'#ffffff';$('fontBold').checked=!!o.fontBold;$('breakable').checked=!!o.breakable;$('breakHealth').value=o.breakHealth??100;$('breakDrop').value=o.breakDrop||'';$('physics').checked=!!o.physics;$('gravity').checked=!!o.gravity;$('collision').checked=o.collision!==false;
for(const [id,key] of [['animIdle','idle'],['animWalk','walk'],['animJump','jump'],['animFall','fall']]){const el=$(id);el.innerHTML='<option value="">None</option>'+p.assets.filter(a=>a.kind!=='music').map(a=>`<option value="${a.id}">${a.name}</option>`).join('');el.value=o.animations?.[key]||''}
}
function bind(id,key,num=false){$(id).onchange=()=>{const o=selected();if(!o)return;checkpoint();o[key]=num?Number($(id).value):$(id).value;render()}}[['name','name'],['x','x',1],['y','y',1],['w','w',1],['h','h',1],['rot','rotation',1],['color','color'],['speed','speed',1],['behavior','behavior'],['health','health',1],['damage','damage',1],['cooldown','cooldown',1],['text','text'],['partLayer','layer'],['action','action'],['targetRoom','targetRoom'],['script','script'],['renderLayer','renderLayer',1],['opacity','opacity',1],['team','team'],['breakHealth','breakHealth',1],['breakDrop','breakDrop']].forEach(a=>bind(...a));
$('breakable').onchange=()=>{const o=selected();if(!o)return;checkpoint();o.breakable=$('breakable').checked;render()};
$('useGradient').onchange=()=>{const o=selected();if(!o)return;checkpoint();o.useGradient=$('useGradient').checked;render()};
$('fontBold').onchange=()=>{const o=selected();if(!o)return;checkpoint();o.fontBold=$('fontBold').checked;render()};
for(const [id,key,num] of [['gradientStart','gradientStart'],['gradientEnd','gradientEnd'],['gradientDirection','gradientDirection'],['fontFamily','fontFamily'],['fontSize','fontSize',1],['textColor','textColor']]){
 $(id).onchange=()=>{const o=selected();if(!o)return;checkpoint();o[key]=num?Number($(id).value):$(id).value;render()}
}


$('beingRole').onchange=()=>{
  const o=selected();
  if(!o||o.type!=='being')return;
  checkpoint();
  o.beingRole=$('beingRole').value;
  if(o.beingRole==='player')o.behavior='player';
  else if(o.beingRole==='enemy')o.behavior='chase';
  else if(o.behavior==='player'||o.behavior==='chase')o.behavior='none';
  persistProject();
  render();
  status('Being Type changed to '+$('beingRole').selectedOptions[0].text+'.');
};
function startDrag(e){if(e.target.classList.contains('handle'))return;e.stopPropagation();const host=e.currentTarget.closest?.('.obj')||e.currentTarget,o=room().objects.find(q=>q.id===host.dataset.id);if(!o)return;sel=o.id;checkpoint();drag={id:o.id,sx:e.clientX,sy:e.clientY,x:o.x,y:o.y};host.setPointerCapture?.(e.pointerId);renderScene();renderProps()}
function startResize(e){e.stopPropagation();const host=e.currentTarget.closest('.obj'),o=room().objects.find(q=>q.id===host.dataset.id);checkpoint();resize={id:o.id,handle:e.currentTarget.dataset.handle,sx:e.clientX,sy:e.clientY,x:o.x,y:o.y,w:o.w,h:o.h};host.setPointerCapture?.(e.pointerId)}
addEventListener('pointermove',e=>{if(drag){const o=room().objects.find(q=>q.id===drag.id);o.x=snap(drag.x+e.clientX-drag.sx);o.y=snap(drag.y+e.clientY-drag.sy);render()}else if(resize){const o=room().objects.find(q=>q.id===resize.id),dx=e.clientX-resize.sx,dy=e.clientY-resize.sy;if(resize.handle==='se'){o.w=Math.max(8,snap(resize.w+dx));o.h=Math.max(8,snap(resize.h+dy))}else{o.x=snap(resize.x+dx);o.y=snap(resize.y+dy);o.w=Math.max(8,snap(resize.w-dx));o.h=Math.max(8,snap(resize.h-dy))}render()}});addEventListener('pointerup',()=>{drag=null;resize=null});workspace.onclick=()=>{if(!game){sel=null;render()}};
function del(){if(!selected())return;checkpoint();room().objects=room().objects.filter(o=>o.id!==sel);sel=null;render()}function dup(){const o=selected();if(!o)return;checkpoint();const c=clone(o);c.id=uid();c.name+=' Copy';c.x+=24;c.y+=24;room().objects.push(c);sel=c.id;render()}
$('del').onclick=del;$('dup').onclick=dup;addEventListener('keydown',e=>{if(['INPUT','SELECT','TEXTAREA'].includes(document.activeElement.tagName))return;if(e.key==='Delete')del();if(e.ctrlKey&&e.key.toLowerCase()==='z'){e.preventDefault();$('undo').click()}});
$('undo').onclick=()=>{if(!hist.length)return;future.push(JSON.stringify(p));p=JSON.parse(hist.pop());normalize();roomId=p.rooms.some(r=>r.id===roomId)?roomId:p.rooms[0].id;sel=null;sync();render();buttons()};$('redo').onclick=()=>{if(!future.length)return;hist.push(JSON.stringify(p));p=JSON.parse(future.pop());normalize();roomId=p.rooms[0].id;sel=null;sync();render();buttons()};
function sync(){
$('projectName').value=p.name||'My Derpedit Game';
$('bg').value=p.background||'#202633';
$('movementMode').value=p.movementMode||p.gameType||'topdown';
const s=p.movementSettings||{};
$('moveAcceleration').value=s.acceleration??1200;$('moveFriction').value=s.friction??.86;$('moveGravity').value=s.gravity??900;$('moveJumpPower').value=s.jumpPower??420;$('moveThrowPower').value=s.throwPower??700;$('moveDashPower').value=s.dashPower??850;$('moveDashCooldown').value=s.dashCooldown??.5;$('moveSwimDrag').value=s.swimDrag??.92;$('throwSticky').checked=s.throwSticky!==false;
}function download(name,text,type){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
$('save').onclick=()=>{persistProject();download((p.name||'Project').replace(/\W+/g,'-')+'.derpedit',JSON.stringify(p,null,2),'application/json')};$('load').onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader;r.onload=()=>{try{checkpoint();p=JSON.parse(r.result);normalize();roomId=p.startRoom||p.rooms[0].id;sel=null;sync();render();persistProject();status('Project loaded and autosaved.')}catch(err){alert('Could not load: '+err.message)}};r.readAsText(f)};
$('new').onclick=()=>{if(confirm('Start a new project?')){checkpoint();p={version:'0.4',name:'My Derpedit Game',gameType:'topdown',background:'#202633',startRoom:'room1',music:[],rooms:[{id:'room1',name:'Main Menu',type:'menu',objects:[]},{id:'room2',name:'Level 1',type:'game',objects:[]}],assets:[]};roomId='room1';sel=null;sync();render()}};
$('addRoom').onclick=()=>{checkpoint();const id=uid(),r={id,name:'Room '+(p.rooms.length+1),type:'game',objects:[]};p.rooms.push(r);roomId=id;sel=null;render()};$('addMenu').onclick=()=>{checkpoint();const id=uid(),r={id,name:'Menu '+(p.rooms.length+1),type:'menu',objects:[]};p.rooms.push(r);roomId=id;sel=null;render();add('label');selected().text='MY GAME';add('button');selected().text='START';selected().targetRoom=p.rooms.find(q=>q.type==='game')?.id||'';render()};$('deleteRoom').onclick=()=>{if(p.rooms.length<=1)return alert('A project needs at least one Room.');if(confirm('Delete this Room?')){checkpoint();p.rooms=p.rooms.filter(r=>r.id!==roomId);roomId=p.rooms[0].id;sel=null;render()}};$('roomName').onchange=()=>{checkpoint();room().name=$('roomName').value||'Room';render()};$('roomType').onchange=()=>{checkpoint();room().type=$('roomType').value;render()};$('roomZoom').onchange=()=>{checkpoint();room().zoom=Math.max(.25,Math.min(4,Number($('roomZoom').value)||1));render();persistProject()};
function parseScript(o){const lines=(o.script||'').split(/\n/).map(s=>s.trim()).filter(Boolean),cfg={collisions:[]};let event='start',target='';for(const line of lines){let m;if((m=line.match(/^when collided with\s+(.+)$/i))){event='collision';target=m[1];continue}if((m=line.match(/^when game starts$/i))){event='start';continue}const cmd={event,target,line};cfg.collisions.push(cmd);if(event==='start'){if((m=line.match(/^speed\s+([\d.]+)/i)))o.speed=Number(m[1]);if((m=line.match(/^damage\s+([\d.]+)/i)))o.damage=Number(m[1]);if((m=line.match(/^health\s+([\d.]+)/i)))o.health=Number(m[1]);if((m=line.match(/^follow\s+(.+)/i)))o.followTarget=m[1]}}return cfg}
function hit(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y}function moveTop(o,dx,dy,obs){o.x+=dx;for(const s of obs)if(s.id!==o.id&&hit(o,s))o.x=dx>0?s.x-o.w:s.x+s.w;o.y+=dy;for(const s of obs)if(s.id!==o.id&&hit(o,s))o.y=dy>0?s.y-o.h:s.y+s.h}
function scheduleGameFrame(g){requestAnimationFrame(t=>{if(game===g)loop(t)})}
function startGame(id,preserveRun=false){
if(!preserveRun)runState={inventory:{},hotbar:[],equipped:null,collectedByRoom:{}};
roomId=id||roomId;render();workspace.classList.add('playing');$('playLayer').classList.remove('hidden');$('mode').textContent='PLAY MODE';
const c=$('canvas'),ctx=c.getContext('2d'),r=workspace.getBoundingClientRect(),d=devicePixelRatio||1;
c.width=r.width*d;c.height=r.height*d;ctx.setTransform(d,0,0,d,0,0);
const O=clone(room().objects);O.forEach(o=>o._script=parseScript(o));
if(!runState)runState={inventory:{},hotbar:[],equipped:null,collectedByRoom:{}};
runState.collectedByRoom??={};
const alreadyCollected=new Set(runState.collectedByRoom[roomId]||[]);
for(const o of O)if(o.type==='item'&&alreadyCollected.has(o.id))o.collected=1;
const sp=O.find(o=>o.behavior==='spawn');
let pl=O.find(o=>o.type==='being'&&o.beingRole==='player')||O.find(o=>o.behavior==='player')||{id:'p',type:'being',beingRole:'player',name:'Player',x:50,y:50,w:42,h:42,color:'#278cff',speed:220,behavior:'player',health:100,damage:0,cooldown:.5,layer:'world'};
if(!O.includes(pl))O.push(pl);if(sp){pl.x=sp.x;pl.y=sp.y}
game={ctx,w:r.width,h:r.height,O,pl,keys:{},got:0,total:O.filter(o=>o.behavior==='coin').length,last:performance.now(),damageTimes:{},vy:0,onGround:false,currentRoom:roomId,
inventory:runState.inventory,
hotbar:runState.hotbar,
equipped:runState.equipped,
projectiles:[],
lastShotAt:0,
aimX:null,
aimY:null,
worldW:Math.max(Number(room().width)||1280,r.width),
worldH:Math.max(Number(room().height)||720,r.height),
camera:{x:0,y:0,zoom:Number(room().zoom)||1,mode:room().cameraMode||'fixed',infinite:!!room().infinite||room().cameraMode==='infinite'}};
buildRuntimeButtons();if(window.renderRuntimeHotbar)window.renderRuntimeHotbar(game);scheduleGameFrame(game)}
function buildRuntimeButtons(){const box=$('playButtons');box.innerHTML='';for(const o of game.O.filter(o=>o.type==='button'&&o.layer==='ui')){const b=document.createElement('button');b.className='runtimeButton';b.textContent=o.text||o.name;b.style.cssText=`left:${o.x}px;top:${o.y}px;width:${o.w}px;height:${o.h}px;background:${o.color}`;b.onclick=()=>{if(o.action==='goto'&&o.targetRoom){game=null;startGame(o.targetRoom,true)}else if(o.action==='restart'){const id=game.currentRoom;game=null;startGame(id,true)}};box.appendChild(b)}}
function stopGame(){game=null;runState=null;workspace.classList.remove('playing');$('playLayer').classList.add('hidden');$('mode').textContent='BUILD MODE';$('playButtons').innerHTML='';$('runtimeHotbar')?.classList.add('hidden')}$('play').onclick=()=>{if(!game)startGame(roomId,false)};$('stop').onclick=stopGame;function kd(e){if(game)game.keys[e.key.toLowerCase()]=1}function ku(e){if(game)game.keys[e.key.toLowerCase()]=0}addEventListener('keydown',kd);addEventListener('keyup',ku);
function applyCollisionScript(owner,other){for(const cmd of owner._script?.collisions||[]){if(cmd.event!=='collision')continue;if(cmd.target.toLowerCase()!==other.name.toLowerCase()&&cmd.target.toLowerCase()!==other.id.toLowerCase()&&cmd.target.toLowerCase()!==other.type.toLowerCase())continue;let m;if((m=cmd.line.match(/^take damage\s+([\d.]+)/i)))owner.health-=Number(m[1]);if(/^destroy self$/i.test(cmd.line))owner.destroyed=true;if((m=cmd.line.match(/^go to room\s+(.+)/i))){const rr=p.rooms.find(r=>r.name.toLowerCase()===m[1].toLowerCase()||r.id===m[1]);if(rr){game=null;startGame(rr.id,true)}}}}
function loop(t){
if(!game)return;
const g=game,dt=Math.min(.033,(t-g.last)/1000);
g.last=t;
solid=g.O.filter(o=>(o.type==='collisionblock'||o.behavior==='solid')&&!o.destroyed);
let dx=(g.keys.d||g.keys.arrowright?1:0)-(g.keys.a||g.keys.arrowleft?1:0),
    dy=(g.keys.s||g.keys.arrowdown?1:0)-(g.keys.w||g.keys.arrowup?1:0);
if(dx||dy){const len=Math.hypot(dx,dy)||1;g.pl.aimDX=dx/len;g.pl.aimDY=dy/len;}

if(window.DerpeditMovement)window.DerpeditMovement.update(g,dt,dx,dy,solid,hit,moveTop);
else{
  const l=Math.hypot(dx,dy)||1;
  moveTop(g.pl,dx/l*g.pl.speed*dt,dy/l*g.pl.speed*dt,solid);
}

for(const e of g.O.filter(o=>((o.type==='being'&&o.beingRole==='enemy')||o.behavior==='chase')&&!o.destroyed)){
  let vx=g.pl.x-e.x,vy=g.pl.y-e.y,z=Math.hypot(vx,vy)||1;
  if(p.movementMode==='platformer'||p.movementMode==='bouncy')moveTop(e,Math.sign(vx)*e.speed*dt,0,solid);
  else moveTop(e,vx/z*e.speed*dt,vy/z*e.speed*dt,solid)
}
for(const q of g.O.filter(o=>o.behavior==='coin'&&!o.collected&&!o.destroyed))
  if(hit(g.pl,q)){q.collected=1;g.got++}

for(const item of g.O.filter(o=>o.type==='item'&&!o.collected&&!o.destroyed&&o.autoPickup!==false)){
 if(hit(g.pl,item)){
  item.collected=1;
  const itemId=item.itemId||item.name||'Item';
  const amount=Math.max(1,Number(item.pickupAmount)||1);
  g.inventory[itemId]=(g.inventory[itemId]||0)+amount;
  if(!g.hotbar.some(slot=>(slot.itemId||slot.name)===itemId)){
   const hotbarItem=clone(item);
   hotbarItem.collected=false;
   hotbarItem.destroyed=false;
   g.hotbar.push(hotbarItem);
  }
  if(item.equipOnPickup!==false||!g.equipped)g.equipped=itemId;
  runState??={inventory:{},hotbar:[],equipped:null,collectedByRoom:{}};
  runState.inventory=g.inventory;
  runState.hotbar=g.hotbar;
  runState.equipped=g.equipped;
  runState.collectedByRoom??={};
  const collectedHere=new Set(runState.collectedByRoom[g.currentRoom]||[]);
  collectedHere.add(item.id);
  runState.collectedByRoom[g.currentRoom]=[...collectedHere];
  if(window.renderRuntimeHotbar)window.renderRuntimeHotbar(g);
  status(itemId+(g.equipped===itemId?' picked up and equipped.':' picked up.'));
 }
}

for(const d of g.O.filter(o=>(o.behavior==='damage'||o.behavior==='chase')&&!o.destroyed)){
 if(hit(g.pl,d)){
  const key=d.id,now=performance.now();
  if(now-(g.damageTimes[key]||0)>(d.cooldown||.5)*1000){
   g.pl.health-=d.damage||10;
   g.damageTimes[key]=now;
   applyCollisionScript(d,g.pl);
   applyCollisionScript(g.pl,d)
  }
 }
}
for(const a of g.O)for(const b of g.O)
 if(a!==b&&!a.destroyed&&!b.destroyed&&hit(a,b))applyCollisionScript(a,b);
g.O=g.O.filter(o=>!o.destroyed);

if(window.DerpeditCamera)window.DerpeditCamera.update(g,dt);

$('score').textContent=`Health: ${Math.max(0,Math.ceil(g.pl.health))} | Coins: ${g.got}/${g.total} | Equipped: ${g.equipped||'None'}`;
g.ctx.setTransform(devicePixelRatio||1,0,0,devicePixelRatio||1,0,0);
g.ctx.fillStyle=p.background;
g.ctx.fillRect(0,0,g.w,g.h);

g.ctx.save();
if(window.DerpeditCamera)window.DerpeditCamera.apply(g,g.ctx);

for(const o of g.O){
 if(o.layer==='ui'||o.behavior==='spawn'||o.collected||o.destroyed||o.type==='button'||o.type==='scriptobject')continue;
 g.ctx.save();
 g.ctx.translate(o.x+o.w/2,o.y+o.h/2);
 g.ctx.rotate((o.rotation||0)*Math.PI/180);
 const a=p.assets.find(a=>a.id===o.assetId);
 if(a){
  o._runtimeImage??=new Image();
  if(o._runtimeImage.src!==a.data)o._runtimeImage.src=a.data;
  g.ctx.imageSmoothingEnabled=false;
  g.ctx.drawImage(o._runtimeImage,-o.w/2,-o.h/2,o.w,o.h)
 }else{
  const baseColor=o.type==='being'?(o.beingRole==='enemy'?'#e3424f':o.beingRole==='neutral'?'#9b8cff':o.color):o.color;
  if(o.useGradient){
    let grad;
    if(o.gradientDirection==='horizontal')grad=g.ctx.createLinearGradient(-o.w/2,0,o.w/2,0);
    else if(o.gradientDirection==='diagonal')grad=g.ctx.createLinearGradient(-o.w/2,-o.h/2,o.w/2,o.h/2);
    else grad=g.ctx.createLinearGradient(0,-o.h/2,0,o.h/2);
    grad.addColorStop(0,o.gradientStart||baseColor||'#fff');grad.addColorStop(1,o.gradientEnd||'#000');g.ctx.fillStyle=grad;
  }else g.ctx.fillStyle=baseColor;
  if(['being','player','enemy','coin'].includes(o.type)){
   g.ctx.beginPath();g.ctx.ellipse(0,0,o.w/2,o.h/2,0,0,7);g.ctx.fill()
  }else if(['text','label'].includes(o.type)){
   g.ctx.font=`${o.fontBold?'bold ':''}${Number(o.fontSize)||20}px ${o.fontFamily||'system-ui'}`;g.ctx.fillStyle=o.textColor||o.color||'#fff';g.ctx.textAlign='center';g.ctx.fillText(o.text||o.name,0,5)
  }else if(o.type==='healthbar'){
   g.ctx.fillStyle='#34131a';g.ctx.fillRect(-o.w/2,-o.h/2,o.w,o.h);
   g.ctx.fillStyle=o.color;g.ctx.fillRect(-o.w/2,-o.h/2,o.w*Math.max(0,g.pl.health/100),o.h)
  }else g.ctx.fillRect(-o.w/2,-o.h/2,o.w,o.h)
 }
 g.ctx.restore()
}
g.ctx.restore();

for(const o of g.O.filter(o=>o.layer==='ui'&&o.type!=='button')){
 g.ctx.fillStyle=o.color;
 if(o.type==='healthbar'){
  g.ctx.fillStyle='#34131a';g.ctx.fillRect(o.x,o.y,o.w,o.h);
  g.ctx.fillStyle=o.color;g.ctx.fillRect(o.x,o.y,o.w*Math.max(0,g.pl.health/100),o.h)
 }else{
  g.ctx.font=`${o.fontBold?'bold ':''}${Number(o.fontSize)||20}px ${o.fontFamily||'system-ui'}`;g.ctx.fillStyle=o.textColor||o.color||'#fff';g.ctx.fillText(o.text||o.name,o.x,o.y+(Number(o.fontSize)||20))
 }
}
if(g.pl.health<=0){
 g.ctx.fillStyle='#000b';g.ctx.fillRect(0,0,g.w,g.h);
 g.ctx.fillStyle='white';g.ctx.textAlign='center';g.ctx.font='bold 42px system-ui';
 g.ctx.fillText('GAME OVER',g.w/2,g.h/2)
}
scheduleGameFrame(g)
}
function exported(){const data=JSON.stringify(p).replace(/</g,'\\u003c');return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${p.name}</title><style>html,body{margin:0;height:100%;overflow:hidden;background:#000;color:white;font-family:system-ui}iframe{border:0;width:100%;height:100%}.note{padding:30px}</style></head><body><div class="note"><h1>${p.name}</h1><p>This project was exported from Derpedit v0.2.</p><p>Open the project in Derpedit for full multi-room play testing. Standalone multi-room runtime export is coming in the next update.</p><details><summary>Project data</summary><pre id="data"></pre></details></div><script>const P=${data};document.getElementById('data').textContent=JSON.stringify(P,null,2);<\/script></body></html>`}$('export').onclick=()=>download((p.name||'Game').replace(/\W+/g,'-')+'.html',exported(),'text/html');
const px=$('pixelCanvas'),pxc=px.getContext('2d'),colors=['#000000','#ffffff','#ff3b4f','#ff9f1c','#ffe74c','#3ddc84','#2389ff','#8d5cff','#8b5a2b','#ff72c6','#5de0e6','#777777','transparent'];let drawColor=colors[0],drawing=false;function drawPixels(){pxc.clearRect(0,0,16,16);pxc.strokeStyle='#ffffff22';pxc.lineWidth=.03;for(let i=0;i<=16;i++){pxc.beginPath();pxc.moveTo(i,0);pxc.lineTo(i,16);pxc.stroke();pxc.beginPath();pxc.moveTo(0,i);pxc.lineTo(16,i);pxc.stroke()}}function pixelAt(e,erase=false){const r=px.getBoundingClientRect(),x=Math.floor((e.clientX-r.left)/r.width*16),y=Math.floor((e.clientY-r.top)/r.height*16);if(erase||drawColor==='transparent')pxc.clearRect(x,y,1,1);else{pxc.fillStyle=drawColor;pxc.fillRect(x,y,1,1)}}px.onpointerdown=e=>{drawing=true;pixelAt(e,e.button===2)};px.onpointermove=e=>{if(drawing)pixelAt(e,e.buttons===2)};addEventListener('pointerup',()=>drawing=false);px.oncontextmenu=e=>e.preventDefault();const cs=$('colors');for(const c of colors){const b=document.createElement('button');b.className='swatch'+(c===drawColor?' on':'');b.style.background=c==='transparent'?'repeating-conic-gradient(#777 0 25%,#333 0 50%) 0/12px 12px':c;b.onclick=()=>{drawColor=c;[...cs.children].forEach(x=>x.classList.remove('on'));b.classList.add('on')};cs.appendChild(b)}$('newPixel').onclick=()=>{$('pixelModal').classList.remove('hidden');drawPixels()};$('closePixel').onclick=()=>$('pixelModal').classList.add('hidden');$('clearPixel').onclick=drawPixels;$('savePixel').onclick=()=>{checkpoint();const a={id:uid(),name:$('assetName').value||'Sprite',data:px.toDataURL('image/png')};p.assets.push(a);selectedAsset=a.id;$('pixelModal').classList.add('hidden');render();status('Pixel asset saved.')};$('applyAsset').onclick=()=>{const o=selected();if(!o||!selectedAsset)return alert('Select an asset in Asset Explorer first.');checkpoint();o.assetId=selectedAsset;render()};
document.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>add(b.dataset.add));document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-tab]').forEach(x=>x.classList.remove('on'));b.classList.add('on');for(const n of ['parts','rooms','assets','toolbox'])$('tab-'+n).classList.toggle('hidden',n!==b.dataset.tab)});$('projectName').onchange=render;$('bg').onchange=render;
$('movementMode').onchange=()=>{checkpoint();p.movementMode=$('movementMode').value;p.gameType=(p.movementMode==='platformer'||p.movementMode==='bouncy')?'platformer':'topdown';render();persistProject()};
for(const [id,key,isBool] of [['moveAcceleration','acceleration'],['moveFriction','friction'],['moveGravity','gravity'],['moveJumpPower','jumpPower'],['moveThrowPower','throwPower'],['moveDashPower','dashPower'],['moveDashCooldown','dashCooldown'],['moveSwimDrag','swimDrag'],['throwSticky','throwSticky',true]]){
 $(id).onchange=()=>{checkpoint();p.movementSettings??={};p.movementSettings[key]=isBool?$(id).checked:Number($(id).value);render();persistProject()}
}
// startup: restore the most recent browser autosave, otherwise create the starter project
if(restoreAutosave()){
  sync();
  render();
  status('Autosaved project restored.');
}else{
  roomId='room1';
  add('label');selected().text='DERPEDIT GAME';selected().x=220;selected().y=110;
  add('button');selected().text='START';selected().x=230;selected().y=220;selected().targetRoom='room2';
  roomId='room2';
  add('being');selected().name='Player';selected().beingRole='player';selected().behavior='player';selected().team='Player';
  add('collisionblock');selected().x=80;selected().y=340;selected().w=420;
  add('being');selected().name='Enemy';selected().beingRole='enemy';selected().behavior='chase';selected().team='Enemy';selected().color='#e3424f';selected().x=430;selected().y=180;
  roomId='room1';sel=null;sync();render();persistProject();
  status('v0.5.1 starter project loaded.');
}
window.addEventListener('beforeunload',persistProject);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')persistProject()});
