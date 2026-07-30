'use strict';

/*
  Derpedit v0.7 conservative update.
  This file does not replace rendering, textures, camera, scaling, physics,
  movement, colors, Rooms, or the classic Play Mode.
  It only manages Item controls, temporary hotbar state, aiming, and projectiles.
*/
(() => {
  const q = id => document.getElementById(id);

  function bindItem(id,key,{number=false,checkbox=false}={}){
    const el=q(id);
    if(!el)return;
    el.onchange=()=>{
      const o=selected();
      if(!o||o.type!=='item')return;
      checkpoint();
      o[key]=checkbox?el.checked:number?Number(el.value):el.value;
      render();
    };
  }

  bindItem('equipOnPickup','equipOnPickup',{checkbox:true});
  bindItem('itemUsable','itemUsable',{checkbox:true});
  bindItem('weaponType','weaponType');
  bindItem('projectileSpeed','projectileSpeed',{number:true});
  bindItem('projectileDamage','projectileDamage',{number:true});
  bindItem('weaponCooldown','weaponCooldown',{number:true});
  bindItem('projectileLifetime','projectileLifetime',{number:true});
  bindItem('projectileCount','projectileCount',{number:true});
  bindItem('projectileSpread','projectileSpread',{number:true});

  const itemId = item => item?.itemId || item?.name || 'Item';

  function equippedItem(g){
    return (g?.hotbar||[]).find(item=>itemId(item)===g.equipped)||null;
  }

  function renderHotbar(g){
    const box=q('runtimeHotbar');
    if(!box)return;
    if(!g?.hotbar?.length){
      box.classList.add('hidden');
      box.innerHTML='';
      return;
    }

    box.classList.remove('hidden');
    box.innerHTML='';
    g.hotbar.slice(0,9).forEach((item,index)=>{
      const id=itemId(item);
      const button=document.createElement('button');
      button.className='hotbarSlot'+(g.equipped===id?' equipped':'');
      button.innerHTML=`<span>${index+1}</span><strong>${id}</strong><small>x${g.inventory[id]||0}</small>`;
      button.onpointerdown=event=>{
        event.preventDefault();
        event.stopPropagation();
        g.equipped=id;
        if(runState)runState.equipped=id;
        renderHotbar(g);
        status(id+' equipped.');
      };
      box.appendChild(button);
    });
  }
  window.renderRuntimeHotbar=renderHotbar;

  // Return coordinates in the same CSS-pixel world used by the classic renderer.
  function canvasPoint(event,g){
    const canvas=q('canvas');
    const rect=canvas.getBoundingClientRect();
    return {
      x:(event.clientX-rect.left)*(g.w/rect.width),
      y:(event.clientY-rect.top)*(g.h/rect.height)
    };
  }

  function updatePointerAim(g,point){
    if(!g?.pl||!point)return;
    g.aimX=point.x;
    g.aimY=point.y;
    const cx=g.pl.x+g.pl.w/2;
    const cy=g.pl.y+g.pl.h/2;
    const dx=point.x-cx;
    const dy=point.y-cy;
    const length=Math.hypot(dx,dy);
    if(length>.001){
      g.pl.aimDX=dx/length;
      g.pl.aimDY=dy/length;
    }
  }

  function firingDirection(g,target){
    const cx=g.pl.x+g.pl.w/2;
    const cy=g.pl.y+g.pl.h/2;
    let dx,dy;

    if(target){
      dx=target.x-cx;
      dy=target.y-cy;
    }else if(Number.isFinite(g.aimX)&&Number.isFinite(g.aimY)){
      dx=g.aimX-cx;
      dy=g.aimY-cy;
    }else{
      dx=g.pl.aimDX??1;
      dy=g.pl.aimDY??0;
    }

    const length=Math.hypot(dx,dy)||1;
    return {x:dx/length,y:dy/length};
  }

  function shoot(g,target=null){
    const item=equippedItem(g);
    if(!item){
      status('Equip an Item first.');
      return;
    }
    if(!item.itemUsable||item.weaponType!=='projectile'){
      status(itemId(item)+' is not configured as a ranged weapon.');
      return;
    }

    if(target)updatePointerAim(g,target);

    const now=performance.now();
    const cooldown=Math.max(0,Number(item.weaponCooldown??.25))*1000;
    if(now-(g.lastShotAt||0)<cooldown)return;
    g.lastShotAt=now;

    const center={x:g.pl.x+g.pl.w/2,y:g.pl.y+g.pl.h/2};
    const base=firingDirection(g,target);
    const baseAngle=Math.atan2(base.y,base.x);
    const count=Math.max(1,Math.floor(Number(item.projectileCount)||1));
    const spread=Math.max(0,Number(item.projectileSpread)||0)*Math.PI/180;
    const speed=Math.max(1,Number(item.projectileSpeed)||520);

    for(let i=0;i<count;i++){
      const offset=count===1?0:(i/(count-1)-.5)*spread;
      const angle=baseAngle+offset;
      const radius=Math.max(g.pl.w,g.pl.h)/2+7;
      g.projectiles.push({
        x:center.x+Math.cos(angle)*radius-5,
        y:center.y+Math.sin(angle)*radius-5,
        w:10,h:10,
        vx:Math.cos(angle)*speed,
        vy:Math.sin(angle)*speed,
        damage:Math.max(0,Number(item.projectileDamage??15)),
        born:now,
        lifetime:Math.max(.1,Number(item.projectileLifetime)||3)*1000,
        color:item.color||'#ffd33d'
      });
    }
  }
  window.derpShoot=shoot;

  function overlaps(a,b){
    return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
  }

  function updateProjectiles(g,dt,now){
    for(const bullet of g.projectiles||[]){
      bullet.x+=bullet.vx*dt;
      bullet.y+=bullet.vy*dt;

      if(now-bullet.born>=bullet.lifetime||
         bullet.x<-100||bullet.y<-100||
         bullet.x>g.w+100||bullet.y>g.h+100){
        bullet.dead=true;
        continue;
      }

      for(const wall of g.O.filter(o=>(o.type==='collisionblock'||o.behavior==='solid')&&!o.destroyed)){
        if(overlaps(bullet,wall)){bullet.dead=true;break}
      }
      if(bullet.dead)continue;

      for(const enemy of g.O.filter(o=>o.type==='being'&&o.beingRole==='enemy'&&!o.destroyed)){
        if(overlaps(bullet,enemy)){
          enemy.health=(enemy.health??100)-bullet.damage;
          bullet.dead=true;
          if(enemy.health<=0)enemy.destroyed=true;
          break;
        }
      }
    }
    g.projectiles=(g.projectiles||[]).filter(b=>!b.dead);
  }

  function drawProjectiles(g){
    const ctx=g?.ctx;
    if(!ctx)return;
    for(const bullet of g.projectiles||[]){
      ctx.save();
      ctx.fillStyle=bullet.color||'#ffd33d';
      ctx.beginPath();
      ctx.arc(bullet.x+bullet.w/2,bullet.y+bullet.h/2,bullet.w/2,0,Math.PI*2);
      ctx.fill();
      ctx.restore();
    }
  }

  addEventListener('keydown',event=>{
    if(!game)return;

    if(/^[1-9]$/.test(event.key)){
      const item=game.hotbar?.[Number(event.key)-1];
      if(item){
        game.equipped=itemId(item);
        if(runState)runState.equipped=game.equipped;
        renderHotbar(game);
        status(game.equipped+' equipped.');
      }
      return;
    }

    if(event.key.toLowerCase()==='f'){
      event.preventDefault();
      shoot(game);
    }

    if(event.code==='Space'&&p.gameType!=='platformer'){
      event.preventDefault();
      shoot(game);
    }
  });

  const canvas=q('canvas');

  canvas?.addEventListener('pointermove',event=>{
    if(!game)return;
    updatePointerAim(game,canvasPoint(event,game));
  });

  canvas?.addEventListener('pointerdown',event=>{
    if(!game)return;
    event.preventDefault();
    const point=canvasPoint(event,game);
    updatePointerAim(game,point);
    shoot(game,point);
  });

  const originalLoop=loop;
  loop=function(t){
    const active=game;
    if(active){
      const now=performance.now();
      const previous=active._projectileTime||now;
      const dt=Math.min(.05,Math.max(0,(now-previous)/1000));
      active._projectileTime=now;
      updateProjectiles(active,dt,now);
    }

    originalLoop(t);

    if(game===active&&active){
      drawProjectiles(active);
      renderHotbar(active);
    }
  };

  q('stop')?.addEventListener('click',()=>{
    q('runtimeHotbar')?.classList.add('hidden');
  });
})();
