"use strict";
(() => {
  const q = id => document.getElementById(id);

  // Value runtime helpers.
  function ensureValues() {
    p.variables ??= {};
    if (game) game.values ??= JSON.parse(JSON.stringify(p.variables));
    return game?.values || p.variables;
  }

  function parseValue(value) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : String(value);
  }

  window.DerpeditValues = {
    get(name) { return ensureValues()[name]; },
    set(name, value) { ensureValues()[name] = parseValue(value); },
    add(name, amount) {
      const values = ensureValues();
      values[name] = Number(values[name] || 0) + Number(amount || 0);
      return values[name];
    },
    remove(name, amount) {
      const values = ensureValues();
      values[name] = Number(values[name] || 0) - Number(amount || 0);
      return values[name];
    }
  };

  // Easier values guide/editor.
  q('valuesGuideBtn')?.addEventListener('click', () => {
    const m = document.createElement('div');
    m.className = 'modal';
    m.innerHTML = `<div class="modalBox">
      <div class="row"><h2 style="flex:1">VALUES GUIDE</h2><button data-close>Close</button></div>
      <p>Values store numbers or text that scripts and game systems can reuse.</p>
      <pre class="guideExample">new value Coins = 0
set value Coins to 25
add 5 to Coins
remove 1 from Lives</pre>
      <label>Current Project Values<textarea data-json class="generatorCode"></textarea></label>
      <button data-save class="primary">Save Values</button>
    </div>`;
    document.body.appendChild(m);
    const area = m.querySelector('[data-json]');
    area.value = JSON.stringify(p.variables || {}, null, 2);
    m.querySelector('[data-close]').onclick = () => m.remove();
    m.querySelector('[data-save]').onclick = () => {
      try {
        checkpoint();
        p.variables = JSON.parse(area.value);
        persistProject();
        render();
        m.remove();
        status('Values saved.');
      } catch (error) {
        alert(error.message);
      }
    };
  });

  // DerpThing: local keyword-based helper, not an online AI.
  q('derpThingBtn')?.addEventListener('click', () => {
    const m = document.createElement('div');
    m.className = 'modal';
    m.innerHTML = `<div class="modalBox derpThingBox">
      <div class="row"><h2 style="flex:1">DERPTHING</h2><button data-close>Close</button></div>
      <p>Describe a game. DerpThing detects supported words and prepares Generate-tab code.</p>
      <textarea data-prompt class="generatorCode" placeholder="Example: a small 2D platformer with zombies, waves, and a gun"></textarea>
      <div data-result class="section muted">Waiting for words...</div>
      <div class="v1Actions"><button data-detect class="primary">Detect & Build Code</button><button data-copy>Copy Code</button><button data-generate>Open Generate Tab</button></div>
      <textarea data-code class="generatorCode" placeholder="Generated code appears here"></textarea>
    </div>`;
    document.body.appendChild(m);

    const prompt = m.querySelector('[data-prompt]');
    const result = m.querySelector('[data-result]');
    const code = m.querySelector('[data-code]');
    let generated = '';

    function detect() {
      const value = prompt.value.toLowerCase();
      const detected = [];
      const has = (...words) => words.some(word => value.includes(word));

      let movement = 'topdown';
      if (has('platformer', 'platform')) { movement = 'platformer'; detected.push('platformer'); }
      else if (has('flying', 'space', 'ship')) { movement = 'flying'; detected.push('flying'); }
      else if (has('hover', 'hovercraft')) { movement = 'hover'; detected.push('hover'); }
      else if (has('swim', 'water', 'underwater')) { movement = 'swimming'; detected.push('swimming'); }
      else if (has('dash')) { movement = 'dash'; detected.push('dash'); }
      else if (has('throw', 'fling')) { movement = 'throw'; detected.push('throw'); }
      else if (has('bounce', 'bouncy')) { movement = 'bouncy'; detected.push('bouncy'); }
      else if (has('topdown', 'top down', '2d')) detected.push('top-down');

      const wantsWaves = has('wave', 'survival');
      const wantsZombie = has('zombie', 'undead');
      const wantsGun = has('gun', 'shooter', 'pistol', 'blaster');
      const wantsCatapult = has('catapult', 'lob');
      const wantsSmall = has('small', 'tiny');
      const wantsMultiplayer = has('multiplayer', 'online', 'join code');

      if (wantsWaves) detected.push('waves');
      if (wantsZombie) detected.push('zombie enemy');
      if (wantsGun) detected.push('gun');
      if (wantsCatapult) detected.push('catapult');
      if (wantsSmall) detected.push('small size');
      if (wantsMultiplayer) detected.push('multiplayer');

      if (!detected.length) {
        result.textContent = 'No words detected that I understood. Try words like 2D, platformer, wave, zombie, gun, multiplayer, flying, hover, swimming, dash, throw, or bouncy.';
        code.value = '';
        return;
      }

      const enemyName = wantsZombie ? 'Zombie' : 'Enemy';
      const size = wantsSmall ? '24 24' : '44 44';
      const lines = [
        'create game "DerpThing Game"',
        'game background #202633',
        `movement mode ${movement}`,
        'create room "Game" game',
        'room "Game" camera follow',
        'room "Game" size 1600 900',
        'create player "Player"'
      ];

      if (wantsGun || wantsCatapult) {
        lines.push('create gun "Starter Weapon"');
        lines.push(`gun type ${wantsCatapult ? 'catapult' : 'projectile'}`);
        lines.push('gun damage 20');
        lines.push('gun cooldown 0.3');
        lines.push('gun projectile speed 650');
      }

      lines.push(`create enemy "${enemyName}"`);
      lines.push(`enemy size ${size}`);
      lines.push('enemy health 75');
      lines.push('enemy speed 95');
      lines.push('enemy damage 12');
      lines.push('enemy color #55aa55');

      if (wantsWaves) {
        lines.push('wave 1', `spawn "${enemyName}" 5`, 'wave 2', `spawn "${enemyName}" 8`, 'wave 3', `spawn "${enemyName}" 12`);
      }

      generated = lines.join('\n');
      code.value = generated;
      result.innerHTML = `<b>Detected:</b> ${detected.join(', ')}`;
    }

    m.querySelector('[data-close]').onclick = () => m.remove();
    m.querySelector('[data-detect]').onclick = detect;
    m.querySelector('[data-copy]').onclick = async () => {
      if (!code.value) detect();
      try { await navigator.clipboard.writeText(code.value); status('DerpThing code copied.'); }
      catch { code.select(); document.execCommand('copy'); }
    };
    m.querySelector('[data-generate]').onclick = () => {
      if (!code.value) detect();
      const generatedCode = code.value;
      m.remove();
      q('generatorBtn')?.click();
      setTimeout(() => {
        const target = document.getElementById('genCode');
        if (target) target.value = generatedCode;
      }, 0);
    };
  });
})();
