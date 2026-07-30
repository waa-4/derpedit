'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const canvas = $('canvas');
  const playLayer = $('playLayer');
  const hotbar = $('v07Hotbar');
  const message = $('v07Message');
  const aimPad = $('v07AimPad');

  let run = null;
  let raf = 0;
  let pointerTarget = null;
  let controlsBound = false;

  const copy = value => JSON.parse(JSON.stringify(value));
  const project = () => (typeof p !== 'undefined' ? p : window.p);
  const currentEditorRoom = () =>
    (typeof roomId !== 'undefined' && roomId) ||
    project()?.rooms?.[0]?.id;

  function say(text) {
    if (!message) return;
    message.textContent = text;
    message.classList.remove('hidden');
    clearTimeout(say.timer);
    say.timer = setTimeout(() => message.classList.add('hidden'), 1300);
  }

  function overlap(a,b) {
    return a.x < b.x+b.w && a.x+a.w > b.x &&
           a.y < b.y+b.h && a.y+a.h > b.y;
  }

  function normalizeItem(item) {
    item.itemId ||= item.name || 'Item';
    item.pickupAmount = Math.max(1, Number(item.pickupAmount) || 1);
    item.autoPickup = item.autoPickup !== false;
    item.equipOnPickup = item.equipOnPickup !== false;
    item.itemUsable = !!item.itemUsable;
    item.weaponType ||= 'none';
    item.projectileSpeed = Math.max(1, Number(item.projectileSpeed) || 520);
    item.projectileDamage = Math.max(0, Number(item.projectileDamage ?? 15));
    item.weaponCooldown = Math.max(0, Number(item.weaponCooldown ?? .25));
    item.projectileLifetime = Math.max(.1, Number(item.projectileLifetime) || 3);
    item.projectileCount = Math.max(1, Math.floor(Number(item.projectileCount) || 1));
    item.projectileSpread = Math.max(0, Number(item.projectileSpread) || 0);
  }

  function newRun(startRoomId) {
    return {
      roomId: startRoomId,
      room: null,
      objects: [],
      player: null,
      inventory: {},
      hotbar: [],
      equipped: null,
      projectiles: [],
      keys: {},
      aim: {x:1,y:0},
      lastShot: 0,
      lastFrame: performance.now()
    };
  }

  function roomById(id) {
    return project()?.rooms?.find(room => room.id === id);
  }

  function loadRoom(id, keepRun=true) {
    const room = roomById(id);
    if (!room) return say('Room not found.'), false;
    if (!run || !keepRun) run = newRun(id);

    run.roomId = id;
    run.room = room;
    run.objects = copy(room.objects || []);
    run.projectiles = [];
    run.lastFrame = performance.now();

    for (const o of run.objects) {
      o.destroyed = false;
      o.collected = false;
      if (o.type === 'item') normalizeItem(o);
    }

    run.player =
      run.objects.find(o => o.type === 'being' && o.beingRole === 'player') ||
      run.objects.find(o => o.type === 'being');

    if (!run.player) return say('Add a Player Being to this Room.'), false;
    run.player.health ??= 100;
    renderHotbar();
    return true;
  }

  function start() {
    stop(false);
    run = newRun(currentEditorRoom());
    if (!loadRoom(run.roomId, true)) { run = null; return; }

    playLayer?.classList.remove('hidden');
    document.querySelector('.workspace')?.classList.add('playing');
    if ($('mode')) $('mode').textContent = 'PLAY MODE';
    bindControls();
    raf = requestAnimationFrame(frame);
    say('Fresh play session started.');
  }

  function stop(show=true) {
    cancelAnimationFrame(raf);
    raf = 0;
    run = null;
    pointerTarget = null;
    playLayer?.classList.add('hidden');
    document.querySelector('.workspace')?.classList.remove('playing');
    hotbar?.classList.add('hidden');
    if (hotbar) hotbar.innerHTML = '';
    aimPad?.classList.add('hidden');
    if ($('mode')) $('mode').textContent = 'BUILD MODE';
    if (show) say('Play session ended.');
  }

  function changeRoom(id) {
    if (!run) return;
    if (loadRoom(id, true)) say('Room changed — inventory kept.');
  }

  function renderHotbar() {
    if (!hotbar) return;
    if (!run?.hotbar.length) {
      hotbar.classList.add('hidden');
      hotbar.innerHTML = '';
      return;
    }

    hotbar.classList.remove('hidden');
    hotbar.innerHTML = '';
    run.hotbar.slice(0,9).forEach((item,index) => {
      const b = document.createElement('button');
      b.className = 'hotbarSlot' + (run.equipped === item.itemId ? ' equipped' : '');
      b.innerHTML = `<span>${index+1}</span><strong>${item.itemId}</strong><small>x${run.inventory[item.itemId]||0}</small>`;
      b.onpointerdown = event => {
        event.preventDefault();
        event.stopPropagation();
        run.equipped = item.itemId;
        renderHotbar();
        say(item.itemId + ' equipped.');
      };
      hotbar.appendChild(b);
    });
  }

  function pickup() {
    for (const item of run.objects) {
      if (item.type !== 'item' || item.collected || item.autoPickup === false) continue;
      if (!overlap(run.player,item)) continue;

      item.collected = true;
      const id = item.itemId;
      run.inventory[id] = (run.inventory[id] || 0) + item.pickupAmount;

      if (!run.hotbar.some(slot => slot.itemId === id)) {
        run.hotbar.push({...copy(item), collected:false, destroyed:false});
      }

      if (item.equipOnPickup || !run.equipped) run.equipped = id;
      renderHotbar();
      say(id + (run.equipped === id ? ' picked up and equipped.' : ' picked up.'));
    }
  }

  function setAim(dx,dy) {
    const length = Math.hypot(dx,dy);
    if (!run || length < .001) return;
    run.aim.x = dx/length;
    run.aim.y = dy/length;
  }

  function canvasPoint(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x:(event.clientX-rect.left)*(canvas.width/rect.width),
      y:(event.clientY-rect.top)*(canvas.height/rect.height)
    };
  }

  function equippedItem() {
    return run?.hotbar.find(item => item.itemId === run.equipped);
  }

  function shoot(target=null) {
    if (!run?.player) return;
    const item = equippedItem();
    if (!item) return say('Equip an Item first.');
    if (!item.itemUsable || item.weaponType !== 'projectile')
      return say(item.itemId + ' is not a ranged weapon.');

    const now = performance.now();
    if (now-run.lastShot < item.weaponCooldown*1000) return;
    run.lastShot = now;

    const center = {
      x:run.player.x+run.player.w/2,
      y:run.player.y+run.player.h/2
    };

    if (target) setAim(target.x-center.x,target.y-center.y);

    const base = Math.atan2(run.aim.y,run.aim.x);
    const spread = item.projectileSpread*Math.PI/180;

    for (let i=0;i<item.projectileCount;i++) {
      const offset = item.projectileCount===1 ? 0 :
        (i/(item.projectileCount-1)-.5)*spread;
      const angle = base+offset;
      const radius = Math.max(run.player.w,run.player.h)/2+8;

      run.projectiles.push({
        x:center.x+Math.cos(angle)*radius-5,
        y:center.y+Math.sin(angle)*radius-5,
        w:10,h:10,
        vx:Math.cos(angle)*item.projectileSpeed,
        vy:Math.sin(angle)*item.projectileSpeed,
        damage:item.projectileDamage,
        born:now,
        lifetime:item.projectileLifetime*1000,
        color:item.color||'#ffd33d'
      });
    }
  }

  function move(dt) {
    let dx=(run.keys.d||run.keys.arrowright?1:0)-(run.keys.a||run.keys.arrowleft?1:0);
    let dy=(run.keys.s||run.keys.arrowdown?1:0)-(run.keys.w||run.keys.arrowup?1:0);

    if (dx||dy) {
      const length=Math.hypot(dx,dy);
      dx/=length; dy/=length;
      const speed=Number(run.player.speed||180);
      run.player.x+=dx*speed*dt;
      run.player.y+=dy*speed*dt;
    }

    const width=Number(run.room.width||canvas.width||960);
    const height=Number(run.room.height||canvas.height||540);
    run.player.x=Math.max(0,Math.min(width-run.player.w,run.player.x));
    run.player.y=Math.max(0,Math.min(height-run.player.h,run.player.y));
  }

  function updateBullets(dt,now) {
    for (const bullet of run.projectiles) {
      bullet.x+=bullet.vx*dt;
      bullet.y+=bullet.vy*dt;

      if (now-bullet.born>=bullet.lifetime) { bullet.dead=true; continue; }

      for (const wall of run.objects.filter(o =>
        !o.destroyed && (o.type==='collisionblock'||o.behavior==='solid'))) {
        if (overlap(bullet,wall)) { bullet.dead=true; break; }
      }
      if (bullet.dead) continue;

      for (const enemy of run.objects.filter(o =>
        !o.destroyed && o.type==='being' && o.beingRole==='enemy')) {
        if (!overlap(bullet,enemy)) continue;
        enemy.health=Number(enemy.health??100)-bullet.damage;
        bullet.dead=true;
        if (enemy.health<=0) enemy.destroyed=true;
        break;
      }
    }
    run.projectiles=run.projectiles.filter(b=>!b.dead);
  }

  function drawObject(ctx,o) {
    if (o.destroyed||o.collected) return;
    ctx.save();
    ctx.globalAlpha=Number(o.opacity??1);
    ctx.translate(o.x+o.w/2,o.y+o.h/2);
    ctx.rotate(Number(o.rotation||0)*Math.PI/180);
    ctx.fillStyle=o.color||
      (o.type==='item'?'#ffd33d':
       o.type==='being'&&o.beingRole==='player'?'#39e7ff':
       o.type==='being'&&o.beingRole==='enemy'?'#ff4d62':'#888');
    ctx.fillRect(-o.w/2,-o.h/2,o.w,o.h);
    ctx.restore();
  }

  function draw() {
    const ctx=canvas.getContext('2d');
    const width=Number(run.room.width||960);
    const height=Number(run.room.height||540);
    if (canvas.width!==width) canvas.width=width;
    if (canvas.height!==height) canvas.height=height;

    ctx.clearRect(0,0,width,height);
    ctx.fillStyle=run.room.background||'#101522';
    ctx.fillRect(0,0,width,height);
    run.objects.forEach(o=>drawObject(ctx,o));

    for (const b of run.projectiles) {
      ctx.fillStyle=b.color;
      ctx.beginPath();
      ctx.arc(b.x+b.w/2,b.y+b.h/2,b.w/2,0,Math.PI*2);
      ctx.fill();
    }

    if ($('score'))
      $('score').textContent=`Health: ${Math.ceil(run.player.health??100)} | Equipped: ${run.equipped||'None'}`;
  }

  function frame(now) {
    if (!run) return;
    const dt=Math.min(.05,Math.max(0,(now-run.lastFrame)/1000));
    run.lastFrame=now;
    move(dt);
    pickup();
    updateBullets(dt,now);
    draw();
    raf=requestAnimationFrame(frame);
  }

  function bindControls() {
    if (controlsBound) return;
    controlsBound=true;

    addEventListener('keydown',event=>{
      if (!run) return;
      run.keys[event.key.toLowerCase()]=true;

      if (/^[1-9]$/.test(event.key)) {
        const item=run.hotbar[Number(event.key)-1];
        if (item) { run.equipped=item.itemId; renderHotbar(); }
      }

      if (event.key.toLowerCase()==='f') {
        event.preventDefault();
        shoot(pointerTarget);
      }

      if (event.code==='Space' && project()?.gameType!=='platformer') {
        event.preventDefault();
        shoot(pointerTarget);
      }
    });

    addEventListener('keyup',event=>{
      if (run) run.keys[event.key.toLowerCase()]=false;
    });

    canvas?.addEventListener('pointermove',event=>{
      if (!run) return;
      pointerTarget=canvasPoint(event);
      const cx=run.player.x+run.player.w/2;
      const cy=run.player.y+run.player.h/2;
      setAim(pointerTarget.x-cx,pointerTarget.y-cy);
    });

    canvas?.addEventListener('pointerdown',event=>{
      if (!run) return;
      event.preventDefault();
      pointerTarget=canvasPoint(event);
      shoot(pointerTarget);
    });
  }

  if (aimPad && (matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints>0)) {
    let activePointer=null;
    aimPad.classList.remove('hidden');

    aimPad.onpointerdown=event=>{
      if (!run) return;
      activePointer=event.pointerId;
      aimPad.setPointerCapture(event.pointerId);
    };

    aimPad.onpointermove=event=>{
      if (!run||activePointer!==event.pointerId) return;
      const rect=aimPad.getBoundingClientRect();
      const dx=event.clientX-(rect.left+rect.width/2);
      const dy=event.clientY-(rect.top+rect.height/2);
      setAim(dx,dy);
      const knob=aimPad.querySelector('.v07AimKnob');
      const length=Math.hypot(dx,dy)||1;
      const distance=Math.min(rect.width*.28,length);
      knob.style.transform=`translate(${dx/length*distance}px,${dy/length*distance}px)`;
    };

    aimPad.onpointerup=event=>{
      if (!run||activePointer!==event.pointerId) return;
      shoot();
      activePointer=null;
      aimPad.querySelector('.v07AimKnob').style.transform='translate(0,0)';
    };
  }

  // Replace old Play/Stop controls after every other script has loaded.
  if ($('play')) $('play').onclick=start;
  if ($('stop')) $('stop').onclick=()=>stop(true);

  window.DerpeditRuntime={
    get session(){return run},
    start,
    stop,
    changeRoom,
    shoot
  };
})();