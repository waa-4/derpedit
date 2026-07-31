'use strict';
window.DerpyScript = (() => {
  const commandDocs = [
    {command:'breakable true/false', category:'Objects', description:'Allows bullets and melee attacks to damage and eventually destroy an Object.', example:'breakable true\nbreak health 100'},
    {command:'create enemy "___"', category:'Generator', description:'Creates an Enemy Being in the current generated Room. Following enemy commands modify that enemy.', example:'create enemy "Zombie"\nenemy size 24 24\nenemy health 75\nenemy speed 95\nenemy damage 12\nenemy color #55aa55'},
    {command:'create gun "___"', category:'Generator', description:'Creates an auto-pickup weapon Item. Following gun commands configure it.', example:'create gun "Pistol"\ngun type projectile\ngun damage 20\ngun cooldown 0.25\ngun projectile speed 650'},
    {command:'gun type catapult', category:'Weapons', description:'Creates a lobbed attack that rises, lands, and damages an area.', example:'gun type catapult\ngun catapult arc 180\ngun catapult radius 70'},
    {command:'new value ___ = ___', category:'Values', description:'Creates a starting project value through the Generate tab.', example:'new value Coins = 0'},

    {command:'when game starts', category:'Events', description:'Runs the following commands when the Room begins.', example:'when game starts\nrun Setup'},
    {command:'when collided with ___', category:'Events', description:'Runs commands when this Object touches the named Object, ID, or Object type.', example:'when collided with Player\ntake damage 10'},
    {command:'wait ___', category:'Timing', description:'Waits for a number of seconds before continuing inside a custom script or loop.', example:'wait 1'},
    {command:'loop "___"', category:'Timing', description:'Repeats the quoted command sequence forever. Commands inside the quotes run from left to right.', example:'loop "run Change wait 1 run Change2 wait 1"'},
    {command:'customscript title=___ "___"', category:'Custom Scripts', description:'Creates a reusable named DerpyScript sequence. Script Objects are recommended for storing these definitions.', example:'customscript title=Change "id Test sprite Red"'},
    {command:'run ___', category:'Custom Scripts', description:'Runs a custom script by title.', example:'run Change'},
    {command:'id ___ sprite ___', category:'Sprites', description:'Changes the sprite of the Object whose Name / ID matches the first value.', example:'id Test sprite Red'},
    {command:'sprite ___', category:'Sprites', description:'Changes this Object to the named sprite.', example:'sprite Blue'},
    {command:'physics on/off', category:'Physics', description:'Enables or disables physical simulation.', example:'physics on'},
    {command:'gravity on/off', category:'Physics', description:'Enables or disables gravity while physics is active.', example:'gravity off'},
    {command:'collision on/off', category:'Physics', description:'Enables or disables collision.', example:'collision on'},
    {command:'opacity 0-100', category:'Appearance', description:'Changes Object transparency.', example:'opacity 50'},
    {command:'team ___', category:'Beings', description:'Assigns the Object to a team.', example:'team Blue'},
    {command:'speed ___', category:'Beings', description:'Sets movement speed.', example:'speed 140'},
    {command:'health ___', category:'Beings', description:'Sets health.', example:'health 100'},
    {command:'damage ___', category:'Beings', description:'Sets contact damage.', example:'damage 15'},
    {command:'take damage ___', category:'Beings', description:'Removes health from the Object running the command.', example:'take damage 10'},
    {command:'destroy self', category:'Objects', description:'Deletes this runtime Object.', example:'destroy self'},
    {command:'go to room ___', category:'Rooms', description:'Changes to a Room by name or ID.', example:'go to room Level 2'},
    {command:'display "___"', category:'UI', description:'Displays temporary dialogue or a message.', example:'display "Hello!"'},
    {command:'when used', category:'Items', description:'Runs commands when the equipped Item is used. The visual Item editor can create basic ranged weapons without scripting.', example:'when used\nshoot Bullet'},
    {command:'shoot ___', category:'Weapons', description:'Shoots a projectile using the equipped Item settings. A full scripted projectile-object system is planned later.', example:'shoot Bullet'},
    {command:'count ___', category:'Weapons', description:'Sets how many projectiles a shot creates.', example:'count 6'},
    {command:'spread ___', category:'Weapons', description:'Sets the angle spread across multiple projectiles.', example:'spread 20'},
    {command:'pierce on/off', category:'Weapons', description:'Controls whether a projectile can continue through targets. Listed for the evolving weapon system.', example:'pierce on'},
    {command:'give ___', category:'Items', description:'Adds an Item to the player inventory.', example:'give Sword'},
    {command:'remove ___', category:'Items', description:'Removes one matching Item from the player inventory.', example:'remove Potion'},
    {command:'if has ___', category:'Items', description:'Checks whether the inventory contains an Item. Full condition blocks are still being expanded.', example:'if has Key'},
  ];

  const boolValue = word => /^(on|true|yes)$/i.test(word);

  function applyStartCommands(part) {
    const lines = String(part.script || '').split(/\n/).map(v => v.trim()).filter(Boolean);
    let active = false;
    for (const line of lines) {
      if (/^when game starts$/i.test(line)) { active = true; continue; }
      if (/^when /i.test(line)) { active = false; continue; }
      if (!active) continue;
      let m;
      if ((m = line.match(/^physics\s+(on|off)$/i))) part.physics = boolValue(m[1]);
      else if ((m = line.match(/^gravity\s+(on|off)$/i))) part.gravity = boolValue(m[1]);
      else if ((m = line.match(/^collision\s+(on|off)$/i))) part.collision = boolValue(m[1]);
      else if ((m = line.match(/^opacity\s+([\d.]+)/i))) part.opacity = Math.max(0, Math.min(100, Number(m[1])));
      else if ((m = line.match(/^team\s+(.+)/i))) part.team = m[1].trim();
      else if ((m = line.match(/^speed\s+([\d.]+)/i))) part.speed = Number(m[1]);
      else if ((m = line.match(/^health\s+([\d.]+)/i))) part.health = Number(m[1]);
      else if ((m = line.match(/^damage\s+([\d.]+)/i))) part.damage = Number(m[1]);
    }
    return part;
  }

  function collectCustomScripts(objects) {
    const scripts = {};
    const pattern = /customscript\s+title=([^\s"]+)\s+"([^"]*)"/gi;
    for (const object of objects || []) {
      const source = String(object.script || '');
      let match;
      while ((match = pattern.exec(source))) scripts[match[1].trim().toLowerCase()] = match[2].trim();
    }
    return scripts;
  }

  function tokenizeSequence(source) {
    const tokens = [];
    const re = /\b(wait)\s+([\d.]+)|\b(run)\s+([A-Za-z0-9_-]+)|\bid\s+([A-Za-z0-9_-]+)\s+sprite\s+([A-Za-z0-9 _-]+?)(?=\s+(?:wait|run|id)\b|$)|\bsprite\s+([A-Za-z0-9 _-]+?)(?=\s+(?:wait|run|id)\b|$)/gi;
    let m;
    while ((m = re.exec(String(source || '')))) {
      if (m[1]) tokens.push({type:'wait', seconds:Number(m[2]) || 0});
      else if (m[3]) tokens.push({type:'run', title:m[4]});
      else if (m[5]) tokens.push({type:'idSprite', id:m[5], sprite:m[6].trim()});
      else if (m[7]) tokens.push({type:'sprite', sprite:m[7].trim()});
    }
    return tokens;
  }

  function teamsHostile(a, b) {
    const ta = String(a?.team || 'Neutral');
    const tb = String(b?.team || 'Neutral');
    if (ta === 'Neutral' || tb === 'Neutral') return false;
    return ta !== tb;
  }

  return { commandDocs, applyStartCommands, collectCustomScripts, tokenizeSequence, teamsHostile };
})();
