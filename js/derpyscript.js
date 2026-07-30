
'use strict';
window.DerpyScript = (() => {
  const commandDocs = [
    ['physics on/off','Enable or disable physical simulation.'],
    ['gravity on/off','Enable or disable gravity while physics is active.'],
    ['collision on/off','Enable or disable collisions.'],
    ['opacity 0-100','Change Part transparency.'],
    ['team TeamName','Assign the Part to a team.'],
    ['speed 140','Set movement speed.'],
    ['health 100','Set health.'],
    ['damage 15','Set damage.'],
    ['go to room Name','Change Rooms.'],
    ['create block','Create a full Part at runtime.'],
    ['block script "..."','Give a created Part its own DerpyScript.'],
    ['say "Hello"','Show a temporary message.']
  ];

  function boolValue(word) {
    return /^(on|true|yes)$/i.test(word);
  }

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

  function teamsHostile(a, b) {
    const ta = String(a?.team || 'Neutral');
    const tb = String(b?.team || 'Neutral');
    if (ta === 'Neutral' || tb === 'Neutral') return false;
    return ta !== tb;
  }

  return { commandDocs, applyStartCommands, teamsHostile };
})();
