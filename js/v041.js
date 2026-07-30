'use strict';
(() => {
  const q=id=>document.getElementById(id);
  let sharedSession=null;
  let switchingRoom=false;
  let messageTimer=0;

  function displayMessage(text,color='#fff'){
    const box=q('runtimeMessage');if(!box)return;
    box.textContent=String(text??'');box.style.color=color||'#fff';box.classList.remove('hidden');
    clearTimeout(messageTimer);messageTimer=setTimeout(()=>box.classList.add('hidden'),2600);
  }
  function findRoom(name){return p.rooms.find(r=>r.id===name||r.name.toLowerCase()===String(name).toLowerCase())}
  function host(){return {
    display:displayMessage,
    goRoom(name){const r=findRoom(name);if(!r)return displayMessage('Room not found: '+name,'#ff7b8a');switchingRoom=true;const keep=game?.sharedValues||sharedSession||{};stopGame();sharedSession=keep;startGame(r.id);switchingRoom=false},
    changeSprite(owner,who,assetName){
      const target=/^self$/i.test(who)?owner:game.O.find(o=>o.id===who||o.name.toLowerCase()===String(who).toLowerCase()||o.type.toLowerCase()===String(who).toLowerCase());
      const asset=p.assets.find(a=>a.id===assetName||a.name.toLowerCase()===String(assetName).toLowerCase());
      if(target&&asset)target.assetId=asset.id;else if(!asset)displayMessage('Sprite not found: '+assetName,'#ff7b8a');
    }
  }}

  // Entire editor scene is hidden in Play Mode, fixing the apparent duplicate Player.
  const previousStart=startGame;
  startGame=function(id){
    q('workspace').classList.add('playing');
    previousStart(id);
    if(!game)return;
    game.sharedValues=sharedSession||{...(p.sharedValues||{})};sharedSession=game.sharedValues;
    for(const o of game.O){o._values={...(o.values||{})};o._script=DerpyScript.compile(o.script||'')}
    // Script Parts run first, then visible Parts.
    for(const o of [...game.O].sort((a,b)=>(a.type==='script'?-1:0)-(b.type==='script'?-1:0)))DerpyScript.runEvent(game,o,'start',null,host());
    installCanvasClicks();
  };

  const previousStop=stopGame;
  stopGame=function(){
    previousStop();q('workspace').classList.remove('playing');q('runtimeMessage')?.classList.add('hidden');
    if(!switchingRoom)sharedSession=null;
  };
  q('stop').onclick=()=>{switchingRoom=false;stopGame()};

  function installCanvasClicks(){
    const c=q('canvas');
    c.onclick=e=>{
      if(!game)return;
      const r=c.getBoundingClientRect(),x=(e.clientX-r.left),y=(e.clientY-r.top);
      const candidates=[...game.O].filter(o=>!o.destroyed&&o.type!=='script'&&o.layer!=='ui'&&x>=o.x&&x<=o.x+o.w&&y>=o.y&&y<=o.y+o.h).sort((a,b)=>(b.renderLayer||0)-(a.renderLayer||0));
      if(candidates[0])DerpyScript.runEvent(game,candidates[0],'click',null,host());
    };
  }

  buildRuntimeButtons=function(){
    const box=q('playButtons');box.innerHTML='';
    for(const o of game.O.filter(o=>o.type==='button'&&o.layer==='ui')){
      const b=document.createElement('button');b.className='runtimeButton';b.textContent=o.text||o.name;
      b.style.cssText=`left:${o.x}px;top:${o.y}px;width:${o.w}px;height:${o.h}px;background:${o.color};opacity:${(o.opacity??100)/100}`;
      b.onclick=()=>{
        DerpyScript.runEvent(game,o,'click',null,host());b.textContent=o.text||o.name;b.style.background=o.color;
        if(o.action==='goto'&&o.targetRoom)host().goRoom(o.targetRoom);else if(o.action==='restart')host().goRoom(game.currentRoom);
      };box.appendChild(b)
    }
  };

  applyCollisionScript=function(owner,other){if(!owner||!other||owner.collision===false)return;DerpyScript.runEvent(game,owner,'collision',other,host())};

  // Script Parts should be obvious in the editor but absent from gameplay.
  const oldRenderProps=renderProps;
  renderProps=function(){oldRenderProps();const o=selected();if(!o)return;q('combatFields').classList.toggle('hidden',['button','label','text','healthbar','script'].includes(o.type));};

  // Keep project version current.
  const oldNormalize=normalize;
  normalize=function(){oldNormalize();p.version='0.4.1';p.sharedValues||={};for(const r of p.rooms)for(const o of r.objects)o.values||={};};
  render();
})();
