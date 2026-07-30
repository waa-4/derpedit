'use strict';
window.DerpyScript = (() => {
  const commandDocs = [
    ['when game starts','Run commands when a Room begins.'],
    ['when clicked','Run commands when this Part or Button is clicked.'],
    ['when collided with Player','Run commands when touching a matching Part.'],
    ['display "Hello!"','Show text on screen.'],
    ['text "Hello!"','Set display text or a text Part/Button label.'],
    ['color cyan','Set display or Part color. Hex colors work too.'],
    ['new value Coins','Create a value stored on this Part.'],
    ['new shared value Coins','Create a value shared by every script.'],
    ['add 1 to Coins','Increase a local or shared value.'],
    ['remove 1 from Coins','Decrease a local or shared value.'],
    ['set Coins to 10','Set a value. Values can also reference other values.'],
    ['if Coins is 10','Only run the following commands when true. Also supports >, <, >=, <= and is not.'],
    ['change sprite to OpenDoor','Change this Part to an imported sprite.'],
    ['change sprite Door to OpenDoor','Change another named Part sprite.'],
    ['physics on/off','Enable or disable physical simulation.'],
    ['gravity on/off','Enable or disable gravity.'],
    ['collision on/off','Enable or disable collisions.'],
    ['opacity 0-100','Change Part transparency.'],
    ['team TeamName','Assign a team.'],
    ['go to room Name','Change Rooms.'],
    ['destroy self','Remove this Part at runtime.']
  ];

  const clean = s => String(s ?? '').trim();
  const unquote = s => {
    s=clean(s);
    if((s.startsWith('"')&&s.endsWith('"'))||(s.startsWith("'")&&s.endsWith("'"))) return s.slice(1,-1);
    return s;
  };
  const boolValue = word => /^(on|true|yes)$/i.test(word);

  function compile(source) {
    const events={start:[],click:[],collision:[]};
    let kind='start', target='';
    const raw=String(source||'').split(/\n/);
    for(let line of raw){
      line=line.trim(); if(!line||line.startsWith('//')||line.startsWith('# '))continue;
      let m;
      if((m=line.match(/^when game starts(?:\s+(.+))?$/i))){kind='start';target='';if(m[1])events.start.push(m[1]);continue}
      if((m=line.match(/^when clicked(?:\s+(.+))?$/i))){kind='click';target='';if(m[1])events.click.push(m[1]);continue}
      if((m=line.match(/^when collided with\s+(.+?)(?:\s+(display\s+.+))?$/i))){kind='collision';target=m[1].trim();if(m[2])events.collision.push({target,line:m[2]});continue}
      if(kind==='collision')events.collision.push({target,line});else events[kind].push(line);
    }
    return events;
  }

  function findValue(game,owner,name,create=false){
    name=clean(name);
    owner._values ||= {...(owner.values||{})};
    game.sharedValues ||= {};
    if(Object.prototype.hasOwnProperty.call(owner._values,name))return {box:owner._values,key:name};
    if(Object.prototype.hasOwnProperty.call(game.sharedValues,name))return {box:game.sharedValues,key:name};
    if(create)return {box:owner._values,key:name};
    return null;
  }
  function resolve(game,owner,token){
    token=clean(token);
    if((token.startsWith('"')&&token.endsWith('"'))||(token.startsWith("'")&&token.endsWith("'")))return unquote(token);
    if(/^[-+]?\d+(?:\.\d+)?$/.test(token))return Number(token);
    if(/^(true|on)$/i.test(token))return true;if(/^(false|off)$/i.test(token))return false;
    const ref=findValue(game,owner,token,false);return ref?ref.box[ref.key]:token;
  }
  function compare(a,op,b){
    if(typeof a==='number'||typeof b==='number'){a=Number(a);b=Number(b)}
    if(op==='is'||op==='=='||op==='=')return a===b;
    if(op==='is not'||op==='!=' )return a!==b;
    if(op==='>')return a>b;if(op==='<')return a<b;if(op==='>=')return a>=b;if(op==='<=')return a<=b;
    return false;
  }
  function matches(other,target){
    target=clean(target).toLowerCase();
    return [other?.name,other?.id,other?.type,other?.team].some(v=>String(v||'').toLowerCase()===target);
  }

  function runLines(game,owner,lines,host={}){
    const state={text:'',color:'#ffffff',allowed:true};
    for(const raw of lines||[]){
      const line=typeof raw==='string'?raw:raw.line;
      let m;
      if((m=line.match(/^if\s+(.+?)\s+(is not|is|>=|<=|>|<|==|!=|=)\s+(.+)$/i))){state.allowed=compare(resolve(game,owner,m[1]),m[2].toLowerCase(),resolve(game,owner,m[3]));continue}
      if(!state.allowed)continue;
      if((m=line.match(/^new\s+shared\s+value\s+(.+?)(?:\s+(?:is|=)\s+(.+))?$/i))){const key=clean(m[1]);if(!(key in game.sharedValues))game.sharedValues[key]=m[2]?resolve(game,owner,m[2]):0;continue}
      if((m=line.match(/^shared\s+value\s+(.+?)(?:\s+(?:is|=)\s+(.+))?$/i))){const key=clean(m[1]);if(!(key in game.sharedValues))game.sharedValues[key]=m[2]?resolve(game,owner,m[2]):0;continue}
      if((m=line.match(/^new\s+value\s+(.+?)(?:\s+(?:is|=)\s+(.+))?$/i))){owner._values||={};const key=clean(m[1]);if(!(key in owner._values))owner._values[key]=m[2]?resolve(game,owner,m[2]):0;continue}
      if((m=line.match(/^add\s+(.+?)\s+to\s+(.+)$/i))){const ref=findValue(game,owner,m[2],true);ref.box[ref.key]=Number(ref.box[ref.key]||0)+Number(resolve(game,owner,m[1])||0);continue}
      if((m=line.match(/^remove\s+(.+?)\s+from\s+(.+)$/i))){const ref=findValue(game,owner,m[2],true);ref.box[ref.key]=Number(ref.box[ref.key]||0)-Number(resolve(game,owner,m[1])||0);continue}
      if((m=line.match(/^set\s+(.+?)\s+to\s+(.+)$/i))){const ref=findValue(game,owner,m[1],true);ref.box[ref.key]=resolve(game,owner,m[2]);continue}
      if((m=line.match(/^text\s+(.+)$/i))){state.text=String(resolve(game,owner,m[1]));if(['text','label','button'].includes(owner.type))owner.text=state.text;continue}
      if((m=line.match(/^color\s+(.+)$/i))){state.color=unquote(m[1]);owner.color=state.color;continue}
      if((m=line.match(/^display(?:\s+(.+))?$/i))){host.display?.(m[1]?String(resolve(game,owner,m[1])):state.text,state.color);continue}
      if((m=line.match(/^change sprite(?:\s+(.+?))?\s+to\s+(.+)$/i))){const who=clean(m[1]||'self'),assetName=unquote(m[2]);host.changeSprite?.(owner,who,assetName);continue}
      if((m=line.match(/^physics\s+(on|off)$/i))){owner.physics=boolValue(m[1]);continue}
      if((m=line.match(/^gravity\s+(on|off)$/i))){owner.gravity=boolValue(m[1]);continue}
      if((m=line.match(/^collision\s+(on|off)$/i))){owner.collision=boolValue(m[1]);continue}
      if((m=line.match(/^opacity\s+([\d.]+)$/i))){owner.opacity=Math.max(0,Math.min(100,Number(m[1])));continue}
      if((m=line.match(/^team\s+(.+)$/i))){owner.team=clean(m[1]);continue}
      if((m=line.match(/^speed\s+([\d.]+)$/i))){owner.speed=Number(m[1]);continue}
      if((m=line.match(/^health\s+([\d.]+)$/i))){owner.health=Number(m[1]);continue}
      if((m=line.match(/^damage\s+([\d.]+)$/i))){owner.damage=Number(m[1]);continue}
      if((m=line.match(/^take damage\s+([\d.]+)$/i))){owner.health-=Number(m[1]);continue}
      if(/^destroy self$/i.test(line)){owner.destroyed=true;continue}
      if((m=line.match(/^go to room\s+(.+)$/i))){host.goRoom?.(unquote(m[1]));return}
    }
  }

  function runEvent(game,owner,event,other,host){
    const cfg=owner._script||compile(owner.script||'');
    if(event==='start')runLines(game,owner,cfg.start,host);
    else if(event==='click')runLines(game,owner,cfg.click,host);
    else if(event==='collision'){
      const lines=(cfg.collision||[]).filter(c=>matches(other,c.target));
      runLines(game,owner,lines,host);
    }
  }

  function applyStartCommands(part){part._script=compile(part.script||'');return part}
  function teamsHostile(a,b){const ta=String(a?.team||'Neutral'),tb=String(b?.team||'Neutral');return ta!=='Neutral'&&tb!=='Neutral'&&ta!==tb}
  return {commandDocs,compile,runEvent,applyStartCommands,teamsHostile,matches};
})();
