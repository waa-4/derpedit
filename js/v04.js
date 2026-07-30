
'use strict';
(() => {
  const q = id => document.getElementById(id);
  const oldNormalize = normalize;
  normalize = function() {
    oldNormalize();
    p.music = p.music || [];
    for (const r of p.rooms) {
      r.cameraMode ??= 'fixed'; r.width ??= 1280; r.height ??= 720;
      r.infinite ??= false; r.musicId ??= '';
      for (const o of r.objects) DerpyScript.applyStartCommands(o);
    }
  };

  const oldRenderRooms = renderRooms;
  renderRooms = function() {
    oldRenderRooms();
    const r = room(); if (!r) return;
    q('cameraMode').value = r.cameraMode || 'fixed';
    q('roomWidth').value = r.width || 1280;
    q('roomHeight').value = r.height || 720;
    q('roomInfinite').checked = !!r.infinite;
    refreshMusicSelectors();
  };

  function refreshMusicSelectors() {
    const el = q('roomMusic'); if (!el) return;
    el.innerHTML = '<option value="">None</option>' + (p.music || []).map(a => `<option value="${a.id}">${a.name}</option>`).join('');
    el.value = room()?.musicId || '';
  }

  for (const [id, key, conv] of [
    ['cameraMode','cameraMode',String],['roomWidth','width',Number],['roomHeight','height',Number],['roomMusic','musicId',String]
  ]) q(id).onchange = () => { checkpoint(); room()[key] = conv(q(id).value); render(); };
  q('roomInfinite').onchange = () => { checkpoint(); room().infinite = q('roomInfinite').checked; if (room().infinite) room().cameraMode='infinite'; render(); };

  for (const [id,key] of [['physics','physics'],['gravity','gravity'],['collision','collision']]) {
    q(id).onchange = () => { const o=selected(); if(!o)return; checkpoint(); o[key]=q(id).checked; render(); };
  }
  for (const [id,key] of [['animIdle','idle'],['animWalk','walk'],['animJump','jump'],['animFall','fall']]) {
    q(id).onchange = () => { const o=selected(); if(!o)return; checkpoint(); o.animations ||= {}; o.animations[key]=q(id).value; render(); };
  }

  q('importImage').onchange = e => {
    const f=e.target.files[0]; if(!f)return;
    const r=new FileReader(); r.onload=()=>{checkpoint();const a={id:uid(),name:f.name.replace(/\.[^.]+$/,''),data:r.result,kind:'image'};p.assets.push(a);selectedAsset=a.id;render();status('Image imported.')};r.readAsDataURL(f);e.target.value='';
  };
  q('importMusic').onchange = e => {
    const f=e.target.files[0]; if(!f)return;
    const r=new FileReader(); r.onload=()=>{checkpoint();p.music.push({id:uid(),name:f.name.replace(/\.[^.]+$/,''),data:r.result,kind:'music'});renderMusic();refreshMusicSelectors();status('Music imported.')};r.readAsDataURL(f);e.target.value='';
  };

  function renderMusic(){
    const box=q('musicAssets'); box.innerHTML='';
    for(const a of p.music||[]){const row=document.createElement('div');row.className='audioItem';const b=document.createElement('button');b.textContent='♫ '+a.name;b.onclick=()=>new Audio(a.data).play();const d=document.createElement('button');d.textContent='Delete';d.className='danger';d.onclick=()=>{checkpoint();p.music=p.music.filter(x=>x.id!==a.id);for(const r of p.rooms)if(r.musicId===a.id)r.musicId='';renderMusic();refreshMusicSelectors()};row.append(b,d);box.appendChild(row)}
    if(!(p.music||[]).length)box.innerHTML='<div class="muted">No music yet.</div>';
  }

  q('saveAssetToolbox').onclick=()=>{const a=p.assets.find(x=>x.id===selectedAsset);if(!a)return alert('Select an image asset first.');DerpToolbox.save(a);renderToolbox();status('Saved to Toolbox.')};
  q('refreshToolbox').onclick=renderToolbox;
  q('clearToolbox').onclick=()=>{if(confirm('Clear every Toolbox asset saved in this browser?')){DerpToolbox.clear();renderToolbox()}};
  function renderToolbox(){
    const box=q('toolboxList'),items=DerpToolbox.read();box.innerHTML='';
    for(const a of items){const b=document.createElement('button');b.textContent='📦 '+a.name;b.onclick=()=>{checkpoint();const copy=JSON.parse(JSON.stringify(a));copy.id=uid();delete copy.toolboxId;p.assets.push(copy);selectedAsset=copy.id;render();status('Toolbox asset imported.')};box.appendChild(b)}
    if(!items.length)box.innerHTML='<div class="muted">No saved Toolbox assets.</div>';
  }

  let pixelHistory=[],pixelFuture=[],gridOn=true;
  function snapshotPixel(){pixelHistory.push(q('pixelCanvas').toDataURL());if(pixelHistory.length>40)pixelHistory.shift();pixelFuture=[]}
  q('pixelCanvas').addEventListener('pointerdown',snapshotPixel,{capture:true});
  q('pixelGrid').onclick=()=>{gridOn=!gridOn;q('pixelGrid').classList.toggle('on',gridOn);q('pixelCanvas').classList.toggle('gridStrong',gridOn)};
  q('pixelUndo').onclick=()=>{if(!pixelHistory.length)return;pixelFuture.push(q('pixelCanvas').toDataURL());const im=new Image();im.onload=()=>{pxc.clearRect(0,0,16,16);pxc.drawImage(im,0,0,16,16)};im.src=pixelHistory.pop()};
  q('pixelRedo').onclick=()=>{if(!pixelFuture.length)return;pixelHistory.push(q('pixelCanvas').toDataURL());const im=new Image();im.onload=()=>{pxc.clearRect(0,0,16,16);pxc.drawImage(im,0,0,16,16)};im.src=pixelFuture.pop()};

  q('guideBtn').onclick=()=>{q('guideContent').textContent=DerpyScript.commandDocs.map(([c,d])=>`${c}\n  ${d}`).join('\n\n');q('guideModal').classList.remove('hidden')};
  q('closeGuide').onclick=()=>q('guideModal').classList.add('hidden');

  // Room camera and music support during play.
  const oldStartGame=startGame;
  startGame=function(id){
    oldStartGame(id);
    if(!game)return;
    const r=room();
    game.camera={x:0,y:0,mode:r.cameraMode||'fixed'};
    const music=(p.music||[]).find(a=>a.id===r.musicId);
    if(music){game.audio=new Audio(music.data);game.audio.loop=true;game.audio.volume=.65;game.audio.play().catch(()=>{})}
  };
  const oldStopGame=stopGame;
  stopGame=function(){if(game?.audio){game.audio.pause();game.audio.currentTime=0}oldStopGame()};

  renderMusic();renderToolbox();refreshMusicSelectors();render();
})();
