'use strict';
(() => {
  const q = id => document.getElementById(id);

  function bindItem(id, key, number=false, checkbox=false) {
    const el=q(id); if(!el)return;
    el.onchange=()=>{const o=selected();if(!o||o.type!=='item')return;checkpoint();o[key]=checkbox?el.checked:number?Number(el.value):el.value;render();};
  }
  bindItem('itemId','itemId');
  bindItem('stackSize','stackSize',true);
  bindItem('pickupAmount','pickupAmount',true);
  bindItem('autoPickup','autoPickup',false,true);
  bindItem('itemDescription','itemDescription');

  q('saveObjectToolbox').onclick=()=>{
    const o=selected();
    if(!o)return alert('Select an Object first.');
    const copy=JSON.parse(JSON.stringify(o));
    copy.toolboxKind='object';
    copy.name=prompt('Toolbox name:',copy.name)||copy.name;
    DerpToolbox.save(copy);
    renderToolboxV5();
    status('Complete Object saved to Toolbox.');
  };

  window.renderToolboxV5=function(){
    const box=q('toolboxList'),items=DerpToolbox.read();box.innerHTML='';
    for(const item of items){
      const row=document.createElement('div');row.className='toolboxEntry';
      const b=document.createElement('button');
      const isObject=item.toolboxKind==='object'||item.type;
      b.textContent=(isObject?'📦 ':'🖼️ ')+(item.name||'Untitled');
      b.onclick=()=>{
        checkpoint();
        const copy=JSON.parse(JSON.stringify(item));
        delete copy.toolboxId; delete copy.toolboxKind;
        if(isObject){
          copy.id=uid();copy.x=96;copy.y=96;
          room().objects.push(copy);sel=copy.id;render();status('Toolbox Object placed.');
        }else{
          copy.id=uid();p.assets.push(copy);selectedAsset=copy.id;render();status('Toolbox Sprite imported.');
        }
      };
      row.appendChild(b);box.appendChild(row);
    }
    if(!items.length)box.innerHTML='<div class="muted">No saved Toolbox entries.</div>';
  };
  q('refreshToolbox').onclick=renderToolboxV5;

  // Replace guide rendering with searchable separate command cards.
  function renderGuide(query=''){
    const words=query.trim().toLowerCase();
    const list=DerpyScript.commandDocs.filter(d=>!words||`${d.command} ${d.category} ${d.description} ${d.example}`.toLowerCase().includes(words));
    const box=q('guideContent');box.innerHTML='';
    for(const doc of list){
      const card=document.createElement('article');card.className='guideCard';
      card.innerHTML=`<div class="guideCategory">${doc.category}</div><code>${escapeHtml(doc.command)}</code><p>${escapeHtml(doc.description)}</p><pre>${escapeHtml(doc.example)}</pre><button>Insert into selected Object</button>`;
      card.querySelector('button').onclick=()=>{
        const o=selected();if(!o)return alert('Select an Object first.');
        checkpoint();o.script=(o.script?o.script+'\n':'')+doc.example;
        render();q('guideModal').classList.add('hidden');status('Command inserted.');
      };
      box.appendChild(card);
    }
    if(!list.length)box.innerHTML='<div class="muted">No commands match that search.</div>';
  }
  function escapeHtml(v){return String(v).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
  q('guideBtn').onclick=()=>{q('guideSearch').value='';renderGuide();q('guideModal').classList.remove('hidden');};
  q('guideSearch').oninput=e=>renderGuide(e.target.value);

  function spriteByName(name){
    return (p.assets||[]).find(a=>a.name.toLowerCase()===String(name).trim().toLowerCase());
  }
  function objectByName(g,name){
    const low=String(name).trim().toLowerCase();
    return g.O.find(o=>o.id.toLowerCase()===low||o.name.toLowerCase()===low);
  }
  function changeSprite(g,targetName,spriteName,owner){
    const target=targetName?objectByName(g,targetName):owner;
    const sprite=spriteByName(spriteName);
    if(target&&sprite)target.assetId=sprite.id;
  }

  function executeTokens(g,tokens,owner,looping=false){
    const task={tokens,index:0,owner,next:performance.now(),looping};
    g.scriptTasks.push(task);
  }
  function runCustom(g,title,owner){
    const source=g.customScripts?.[String(title).toLowerCase()];
    if(source)executeTokens(g,DerpyScript.tokenizeSequence(source),owner,false);
  }
  function runStartScripts(g){
    for(const owner of g.O){
      const source=String(owner.script||'');
      const start=source.match(/when game starts([\s\S]*?)(?=\nwhen\s|$)/i)?.[1]||'';
      for(const line of start.split(/\n/).map(s=>s.trim()).filter(Boolean)){
        let m;
        if((m=line.match(/^run\s+(.+)$/i)))runCustom(g,m[1].trim(),owner);
        else if((m=line.match(/^loop\s+"([^"]+)"$/i)))executeTokens(g,DerpyScript.tokenizeSequence(m[1]),owner,true);
        else if((m=line.match(/^id\s+(\S+)\s+sprite\s+(.+)$/i)))changeSprite(g,m[1],m[2],owner);
        else if((m=line.match(/^sprite\s+(.+)$/i)))changeSprite(g,null,m[1],owner);
      }
    }
  }
  function updateTasks(g,now){
    for(const task of g.scriptTasks||[]){
      if(now<task.next||!task.tokens.length)continue;
      let safety=0;
      while(now>=task.next&&safety++<20){
        if(task.index>=task.tokens.length){
          if(task.looping)task.index=0; else{task.done=true;break;}
        }
        const token=task.tokens[task.index++];
        if(token.type==='wait'){task.next=now+token.seconds*1000;break;}
        if(token.type==='run')runCustom(g,token.title,task.owner);
        if(token.type==='idSprite')changeSprite(g,token.id,token.sprite,task.owner);
        if(token.type==='sprite')changeSprite(g,null,token.sprite,task.owner);
      }
    }
    g.scriptTasks=(g.scriptTasks||[]).filter(t=>!t.done);
  }

  const oldStart=startGame;
  startGame=function(id){oldStart(id);if(game){game.scriptTasks=[];game.customScripts=DerpyScript.collectCustomScripts(game.O);runStartScripts(game);}};
  const oldLoop=loop;
  loop=function(t){if(game)updateTasks(game,performance.now());oldLoop(t);};

  renderToolboxV5();
})();
