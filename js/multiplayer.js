'use strict';
(() => {
  let client=null,channel=null,playerId='p_'+Math.random().toString(36).slice(2,9),lastSent=0,remote=new Map();
  const safeCode=v=>String(v||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,6);
  function ensureLobby(){
    p.multiplayer??={enabled:false,url:'',key:'',maxPlayers:8};
    if(!p.multiplayer.enabled)return;
    let lobby=p.rooms.find(r=>r.isMultiplayerLobby);
    if(!lobby){
      const lid=uid();
      lobby={id:lid,name:'Join Lobby',type:'menu',isMultiplayerLobby:true,cameraMode:'fixed',width:1280,height:720,infinite:false,objects:[
        {id:uid(),type:'label',name:'Multiplayer Title',text:'MULTIPLAYER',x:520,y:150,w:240,h:50,rotation:0,color:'#ffffff',layer:'ui',opacity:100,renderLayer:0,behavior:'none',script:''},
        {id:uid(),type:'label',name:'Join Code Help',text:'Host or enter a Join Code',x:500,y:220,w:280,h:42,rotation:0,color:'#ffffff',layer:'ui',opacity:100,renderLayer:0,behavior:'none',script:''}
      ],waves:[]};
      p.rooms.unshift(lobby);p.startRoom=lobby.id;
    }
  }
  async function connect(code,name='Player'){
    disconnect();
    if(!p.multiplayer?.enabled)throw new Error('Multiplayer is disabled.');
    if(!window.supabase)throw new Error('Supabase library did not load.');
    if(!p.multiplayer.url||!p.multiplayer.key)throw new Error('Enter the Supabase Project URL and publishable key.');
    code=safeCode(code);if(!code)throw new Error('Enter a join code.');
    client=window.supabase.createClient(p.multiplayer.url,p.multiplayer.key);
    channel=client.channel('derpedit-'+code,{config:{presence:{key:playerId},broadcast:{self:false}}});
    channel.on('broadcast',{event:'player'},({payload})=>{if(payload?.id!==playerId)remote.set(payload.id,payload)});
    channel.on('presence',{event:'sync'},()=>{});
    await channel.subscribe(async state=>{if(state==='SUBSCRIBED')await channel.track({id:playerId,name,joined:Date.now()})});
    localStorage.setItem('derpedit.joinCode',code);localStorage.setItem('derpedit.playerName',name);
    showBadge('Connected: '+code);return code;
  }
  function disconnect(){if(channel&&client)client.removeChannel(channel);channel=null;client=null;remote.clear();showBadge('Offline')}
  function tick(g){
    if(!channel||!g?.pl)return;
    const now=performance.now();if(now-lastSent>80){lastSent=now;channel.send({type:'broadcast',event:'player',payload:{id:playerId,x:g.pl.x,y:g.pl.y,w:g.pl.w,h:g.pl.h,color:g.pl.color,room:g.currentRoom,name:localStorage.getItem('derpedit.playerName')||'Player'}})}
    const ctx=g.ctx;if(!ctx)return;ctx.save();if(window.DerpeditCamera)window.DerpeditCamera.apply(g,ctx);
    for(const rp of remote.values()){if(rp.room!==g.currentRoom)continue;ctx.fillStyle=rp.color||'#5de0e6';ctx.globalAlpha=.75;ctx.fillRect(rp.x,rp.y,rp.w||42,rp.h||42);ctx.fillStyle='white';ctx.font='12px system-ui';ctx.fillText(rp.name||'Player',rp.x,rp.y-5)}ctx.restore();
  }
  function showBadge(text){let b=document.getElementById('mpBadge');if(!b){b=document.createElement('div');b.id='mpBadge';b.className='mpBadge';document.getElementById('workspace')?.appendChild(b)}b.textContent=text;b.style.display=p?.multiplayer?.enabled?'block':'none'}
  function hostCode(){return Math.random().toString(36).slice(2,8).toUpperCase()}
  window.DerpeditMultiplayer={ensureLobby,connect,disconnect,tick,hostCode,safeCode};
})();
