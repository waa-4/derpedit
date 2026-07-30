'use strict';
(() => {
  const q=id=>document.getElementById(id);

  function bindItem(id,key,{number=false,checkbox=false}={}){
    const el=q(id); if(!el)return;
    el.onchange=()=>{
      const o=selected();if(!o||o.type!=='item')return;
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

  function getEquippedItem(g){
    return (g.hotbar||[]).find(x=>(x.itemId||x.name)===g.equipped)||null;
  }

  function renderHotbar(g){
    const box=q('runtimeHotbar');
    if(!g||!g.hotbar?.length){box.classList.add('hidden');box.innerHTML='';return}
    box.classList.remove('hidden');box.innerHTML='';
    g.hotbar.slice(0,9).forEach((item,index)=>{
      const id=item.itemId||item.name;
      const b=document.createElement('button');
      b.className='hotbarSlot'+(g.equipped===id?' equipped':'');
      b.innerHTML=`<span>${index+1}</span><strong>${id}</strong><small>x${g.inventory[id]||0}</small>`;
      b.onclick=()=>{g.equipped=id;persistentRun.equipped=id;renderHotbar(g);persistProject()};
      box.appendChild(b);
    });
  }

  function playerCenter(g){
    return {x:g.pl.x+g.pl.w/2,y:g.pl.y+g.pl.h/2};
  }
  function shoot(g){
    const item=getEquippedItem(g);
    if(!item||!item.itemUsable||item.weaponType!=='projectile')return;
    const now=performance.now();
    const cooldown=(item.weaponCooldown??.25)*1000;
    if(now-g.lastShotAt<cooldown)return;
    g.lastShotAt=now;
    const c=playerCenter(g);
    const count=Math.max(1,Math.floor(item.projectileCount||1));
    const spread=Number(item.projectileSpread||0);
    for(let i=0;i<count;i++){
      const t=count===1?0:(i/(count-1)-.5);
      const angle=(g.pl.facing==='left'?180:0)+t*spread;
      const rad=angle*Math.PI/180;
      g.projectiles.push({
        x:c.x-5,y:c.y-5,w:10,h:10,
        vx:Math.cos(rad)*(item.projectileSpeed||520),
        vy:Math.sin(rad)*(item.projectileSpeed||520),
        damage:item.projectileDamage??15,
        born:now,lifetime:(item.projectileLifetime||3)*1000,
        color:item.color||'#ffd33d'
      });
    }
  }

  function updateProjectiles(g,dt,now){
    for(const bullet of g.projectiles||[]){
      bullet.x+=bullet.vx*dt;bullet.y+=bullet.vy*dt;
      if(now-bullet.born>bullet.lifetime)bullet.dead=true;
      for(const enemy of g.O.filter(o=>o.type==='being'&&o.beingRole==='enemy'&&!o.destroyed)){
        if(bullet.x<enemy.x+enemy.w&&bullet.x+bullet.w>enemy.x&&bullet.y<enemy.y+enemy.h&&bullet.y+bullet.h>enemy.y){
          enemy.health=(enemy.health??100)-bullet.damage;
          bullet.dead=true;
          if(enemy.health<=0)enemy.destroyed=true;
          break;
        }
      }
      for(const wall of g.O.filter(o=>(o.type==='collisionblock'||o.behavior==='solid')&&!o.destroyed)){
        if(bullet.x<wall.x+wall.w&&bullet.x+bullet.w>wall.x&&bullet.y<wall.y+wall.h&&bullet.y+bullet.h>wall.y){
          bullet.dead=true;break;
        }
      }
    }
    g.projectiles=(g.projectiles||[]).filter(b=>!b.dead);
  }

  function drawProjectiles(g,ctx){
    for(const b of g.projectiles||[]){
      ctx.fillStyle=b.color||'#ffd33d';
      ctx.fillRect(b.x,b.y,b.w,b.h);
    }
  }

  // Number keys equip hotbar slots. Space or mouse click uses equipped item.
  addEventListener('keydown',e=>{
    if(!game)return;
    if(/^[1-9]$/.test(e.key)){
      const item=game.hotbar[Number(e.key)-1];
      if(item){
        game.equipped=item.itemId||item.name;
        persistentRun.equipped=game.equipped;
        renderHotbar(game);persistProject();
      }
    }
    if(e.code==='Space'){e.preventDefault();shoot(game)}
  });
  q('playCanvas')?.addEventListener('pointerdown',()=>{if(game)shoot(game)});

  // Patch room changes so the same hotbar and equipped item survive.
  const originalStart=window.startGame;
  window.startGame=function(id){
    // Preserve current run state before changing Rooms.
    if(window.game){
      persistentRun.inventory=game.inventory||persistentRun.inventory;
      persistentRun.hotbar=game.hotbar||persistentRun.hotbar;
      persistentRun.equipped=game.equipped||persistentRun.equipped;
    }
    originalStart(id);
    if(window.game){
      game.inventory=persistentRun.inventory;
      game.hotbar=persistentRun.hotbar;
      game.equipped=persistentRun.equipped;
      game.projectiles=[];
      renderHotbar(game);
    }
  };

  // Wrap loop: update projectiles before the normal draw, then draw them after.
  const originalLoop=window.loop;
  window.loop=function(t){
    if(window.game){
      const now=performance.now();
      const dt=Math.min(.05,((game._weaponLastTime||now)-now)*-0.001||0);
      game._weaponLastTime=now;
      updateProjectiles(game,dt,now);
    }
    originalLoop(t);
    if(window.game){
      const canvas=q('playCanvas');
      const ctx=canvas?.getContext('2d');
      if(ctx)drawProjectiles(game,ctx);
      renderHotbar(game);
    }
  };

  // Ensure stopping play hides the hotbar.
  q('stop')?.addEventListener('click',()=>q('runtimeHotbar').classList.add('hidden'));
})();
