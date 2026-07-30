'use strict';

/*
  Derpedit v0.7.1 conservative combat update.
  It leaves the classic renderer, textures, rescaling, camera, physics,
  movement, colors, Rooms, and editor untouched.
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

  [
    ['equipOnPickup','equipOnPickup',{checkbox:true}],
    ['itemUsable','itemUsable',{checkbox:true}],
    ['weaponType','weaponType',{}],
    ['projectileSpeed','projectileSpeed',{number:true}],
    ['projectileDamage','projectileDamage',{number:true}],
    ['weaponCooldown','weaponCooldown',{number:true}],
    ['projectileLifetime','projectileLifetime',{number:true}],
    ['projectileCount','projectileCount',{number:true}],
    ['projectileSpread','projectileSpread',{number:true}],
    ['meleeRange','meleeRange',{number:true}],
    ['meleeArc','meleeArc',{number:true}],
    ['meleeDamage','meleeDamage',{number:true}],
    ['meleeSwingTime','meleeSwingTime',{number:true}],
    ['meleeKnockback','meleeKnockback',{number:true}],
    ['meleeHitOnce','meleeHitOnce',{checkbox:true}]
  ].forEach(args=>bindItem(...args));

  const itemId = item => item?.itemId || item?.name || 'Item';
  const equippedItem = g => (g?.hotbar||[]).find(item=>itemId(item)===g.equipped)||null;

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
        event.preventDefault(); event.stopPropagation();
        g.equipped=id;
        if(runState)runState.equipped=id;
        renderHotbar(g);
        status(id+' equipped.');
      };
      box.appendChild(button);
    });
  }
  window.renderRuntimeHotbar=renderHotbar;

  function canvasPoint(event,g){
    const canvas=q('canvas'), rect=canvas.getBoundingClientRect();
    const screen={
      x:(event.clientX-rect.left)*(g.w/rect.width),
      y:(event.clientY-rect.top)*(g.h/rect.height)
    };
    return window.DerpeditCamera?window.DerpeditCamera.screenToWorld(g,screen.x,screen.y):screen;
  }

  function updatePointerAim(g,point){
    if(!g?.pl||!point)return;
    g.aimX=point.x; g.aimY=point.y;
    const cx=g.pl.x+g.pl.w/2, cy=g.pl.y+g.pl.h/2;
    const dx=point.x-cx, dy=point.y-cy, length=Math.hypot(dx,dy);
    if(length>.001){g.pl.aimDX=dx/length;g.pl.aimDY=dy/length}
  }

  function direction(g,target){
    const cx=g.pl.x+g.pl.w/2, cy=g.pl.y+g.pl.h/2;
    let dx,dy;
    if(target){dx=target.x-cx;dy=target.y-cy}
    else if(Number.isFinite(g.aimX)&&Number.isFinite(g.aimY)){dx=g.aimX-cx;dy=g.aimY-cy}
    else{dx=g.pl.aimDX??1;dy=g.pl.aimDY??0}
    const length=Math.hypot(dx,dy)||1;
    return {x:dx/length,y:dy/length};
  }

  function isEnemy(o,g){
    if(!o||o.destroyed||o===g.pl||o.type!=='being')return false;
    if(o.beingRole==='enemy'||o.behavior==='chase')return true;
    const playerTeam=(g.pl.team||'').trim();
    const otherTeam=(o.team||'').trim();
    return !!(playerTeam&&otherTeam&&playerTeam!==otherTeam);
  }

  function damageEnemy(enemy,damage,knockX=0,knockY=0){
    enemy.health=Number(enemy.health??100)-Math.max(0,Number(damage)||0);
    if(knockX||knockY){enemy.x+=knockX;enemy.y+=knockY}
    if(enemy.health<=0)enemy.destroyed=true;
  }

  function attack(g,target=null){
    const item=equippedItem(g);
    if(!item)return status('Equip an Item first.');
    if(!item.itemUsable)return status(itemId(item)+' is not configured as a weapon.');

    const now=performance.now();
    const cooldown=Math.max(0,Number(item.weaponCooldown??.25))*1000;
    if(now-(g.lastShotAt||0)<cooldown)return;
    g.lastShotAt=now;
    if(target)updatePointerAim(g,target);

    if(item.weaponType==='projectile')shoot(g,item,target,now);
    else if(item.weaponType==='melee')swing(g,item,target,now);
    else status(itemId(item)+' has no Weapon Type.');
  }
  window.derpShoot=(g,target)=>attack(g,target);

  function shoot(g,item,target,now){
    const center={x:g.pl.x+g.pl.w/2,y:g.pl.y+g.pl.h/2};
    const base=direction(g,target), baseAngle=Math.atan2(base.y,base.x);
    const count=Math.max(1,Math.floor(Number(item.projectileCount)||1));
    const spread=Math.max(0,Number(item.projectileSpread)||0)*Math.PI/180;
    const speed=Math.max(1,Number(item.projectileSpeed)||520);

    for(let i=0;i<count;i++){
      const offset=count===1?0:(i/(count-1)-.5)*spread;
      const angle=baseAngle+offset, radius=Math.max(g.pl.w,g.pl.h)/2+7;
      const x=center.x+Math.cos(angle)*radius-5;
      const y=center.y+Math.sin(angle)*radius-5;
      g.projectiles.push({
        x,y,prevX:x,prevY:y,w:10,h:10,
        vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,
        damage:Math.max(0,Number(item.projectileDamage??15)),
        born:now,lifetime:Math.max(.1,Number(item.projectileLifetime)||3)*1000,
        color:item.color||'#ffd33d'
      });
    }
  }

  function swing(g,item,target,now){
    const dir=direction(g,target);
    const swing={
      born:now,
      lifetime:Math.max(.05,Number(item.meleeSwingTime)||.18)*1000,
      range:Math.max(1,Number(item.meleeRange)||80),
      arc:Math.max(1,Math.min(360,Number(item.meleeArc)||100))*Math.PI/180,
      damage:Math.max(0,Number(item.meleeDamage??item.projectileDamage??25)),
      knockback:Math.max(0,Number(item.meleeKnockback)||0),
      dx:dir.x,dy:dir.y,
      hit:new Set(),
      hitOnce:item.meleeHitOnce!==false
    };
    g.meleeSwings??=[];
    g.meleeSwings.push(swing);
    applyMeleeHits(g,swing);
  }

  function applyMeleeHits(g,swing){
    const cx=g.pl.x+g.pl.w/2, cy=g.pl.y+g.pl.h/2;
    const facing=Math.atan2(swing.dy,swing.dx);
    for(const enemy of g.O.filter(o=>isEnemy(o,g))){
      if(swing.hitOnce&&swing.hit.has(enemy.id))continue;
      const ex=enemy.x+enemy.w/2, ey=enemy.y+enemy.h/2;
      const dx=ex-cx, dy=ey-cy;
      const distance=Math.hypot(dx,dy);
      const enemyRadius=Math.hypot(enemy.w,enemy.h)/2;
      if(distance>swing.range+enemyRadius)continue;
      let delta=Math.atan2(dy,dx)-facing;
      delta=Math.atan2(Math.sin(delta),Math.cos(delta));
      if(Math.abs(delta)>swing.arc/2)continue;
      damageEnemy(enemy,swing.damage,swing.dx*swing.knockback,swing.dy*swing.knockback);
      swing.hit.add(enemy.id);
    }
  }

  function aabb(a,b){
    return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
  }

  // Swept segment against expanded AABB prevents fast bullets skipping enemies.
  function segmentHitsRect(x1,y1,x2,y2,rect,padX=0,padY=0){
    const minX=rect.x-padX,maxX=rect.x+rect.w+padX;
    const minY=rect.y-padY,maxY=rect.y+rect.h+padY;
    const dx=x2-x1,dy=y2-y1;
    let t0=0,t1=1;
    for(const [p,q] of [[-dx,x1-minX],[dx,maxX-x1],[-dy,y1-minY],[dy,maxY-y1]]){
      if(Math.abs(p)<1e-9){if(q<0)return false;continue}
      const r=q/p;
      if(p<0){if(r>t1)return false;if(r>t0)t0=r}
      else{if(r<t0)return false;if(r<t1)t1=r}
    }
    return true;
  }

  function updateProjectiles(g,dt,now){
    for(const bullet of g.projectiles||[]){
      bullet.prevX=bullet.x; bullet.prevY=bullet.y;
      bullet.x+=bullet.vx*dt; bullet.y+=bullet.vy*dt;

      if(now-bullet.born>=bullet.lifetime||
         bullet.x<-100||bullet.y<-100||bullet.x>g.w+100||bullet.y>g.h+100){
        bullet.dead=true; continue;
      }

      const bx1=bullet.prevX+bullet.w/2, by1=bullet.prevY+bullet.h/2;
      const bx2=bullet.x+bullet.w/2, by2=bullet.y+bullet.h/2;

      for(const wall of g.O.filter(o=>(o.type==='collisionblock'||o.behavior==='solid')&&!o.destroyed)){
        if(aabb(bullet,wall)||segmentHitsRect(bx1,by1,bx2,by2,wall,bullet.w/2,bullet.h/2)){
          bullet.dead=true;break
        }
      }
      if(bullet.dead)continue;

      for(const enemy of g.O.filter(o=>isEnemy(o,g))){
        if(aabb(bullet,enemy)||segmentHitsRect(bx1,by1,bx2,by2,enemy,bullet.w/2,bullet.h/2)){
          damageEnemy(enemy,bullet.damage);
          bullet.dead=true;
          break;
        }
      }
    }
    g.projectiles=(g.projectiles||[]).filter(b=>!b.dead);
  }

  function updateMelee(g,now){
    for(const swing of g.meleeSwings||[]){
      if(!swing.hitOnce)applyMeleeHits(g,swing);
      if(now-swing.born>=swing.lifetime)swing.dead=true;
    }
    g.meleeSwings=(g.meleeSwings||[]).filter(s=>!s.dead);
  }

  function drawCombat(g){
    const ctx=g?.ctx;if(!ctx)return;
    ctx.save();
    if(window.DerpeditCamera)window.DerpeditCamera.apply(g,ctx);
    for(const bullet of g.projectiles||[]){
      ctx.save();ctx.fillStyle=bullet.color||'#ffd33d';
      ctx.beginPath();ctx.arc(bullet.x+bullet.w/2,bullet.y+bullet.h/2,bullet.w/2,0,Math.PI*2);ctx.fill();ctx.restore();
    }
    const cx=g.pl.x+g.pl.w/2,cy=g.pl.y+g.pl.h/2;
    for(const swing of g.meleeSwings||[]){
      const angle=Math.atan2(swing.dy,swing.dx);
      ctx.save();
      ctx.globalAlpha=.28;
      ctx.fillStyle='#ffffff';
      ctx.beginPath();ctx.moveTo(cx,cy);
      ctx.arc(cx,cy,swing.range,angle-swing.arc/2,angle+swing.arc/2);
      ctx.closePath();ctx.fill();ctx.restore();
    }
    ctx.restore();
  }

  addEventListener('keydown',event=>{
    if(!game)return;
    if(/^[1-9]$/.test(event.key)){
      const item=game.hotbar?.[Number(event.key)-1];
      if(item){game.equipped=itemId(item);if(runState)runState.equipped=game.equipped;renderHotbar(game)}
      return;
    }
    if(event.key.toLowerCase()==='f'){event.preventDefault();attack(game)}
    if(event.code==='Space'&&p.gameType!=='platformer'){event.preventDefault();attack(game)}
  });

  const canvas=q('canvas');
  canvas?.addEventListener('pointermove',event=>{
    if(game)updatePointerAim(game,canvasPoint(event,game));
  });
  canvas?.addEventListener('pointerdown',event=>{
    if(!game)return;
    event.preventDefault();
    const point=canvasPoint(event,game);
    updatePointerAim(game,point);
    attack(game,point);
  });

  const originalLoop=loop;
  loop=function(t){
    const active=game;
    if(active){
      const now=performance.now(), previous=active._combatTime||now;
      const dt=Math.min(.05,Math.max(0,(now-previous)/1000));
      active._combatTime=now;
      active.meleeSwings??=[];
      updateProjectiles(active,dt,now);
      updateMelee(active,now);
    }
    originalLoop(t);
    if(game===active&&active){drawCombat(active);renderHotbar(active)}
  };

  q('stop')?.addEventListener('click',()=>q('runtimeHotbar')?.classList.add('hidden'));
})();
