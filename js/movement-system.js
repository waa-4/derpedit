"use strict";
(() => {
  const q = id => document.getElementById(id);
  let clickBound = false;

  const settings = () => ({
    acceleration: Number(p.movementSettings?.acceleration ?? 1200),
    friction: Math.max(0, Math.min(.999, Number(p.movementSettings?.friction ?? .86))),
    gravity: Number(p.movementSettings?.gravity ?? 900),
    jumpPower: Number(p.movementSettings?.jumpPower ?? 420),
    throwPower: Number(p.movementSettings?.throwPower ?? 700),
    dashPower: Number(p.movementSettings?.dashPower ?? 850),
    dashCooldown: Math.max(0, Number(p.movementSettings?.dashCooldown ?? .5)),
    swimDrag: Math.max(0, Math.min(.999, Number(p.movementSettings?.swimDrag ?? .92))),
    throwSticky: p.movementSettings?.throwSticky !== false
  });

  function mode() {
    return p.movementMode || p.gameType || 'topdown';
  }

  function collideAxis(object, amount, axis, solids, hit) {
    object[axis] += amount;
    let collided = false;
    for (const solid of solids) {
      if (solid.id === object.id || !hit(object, solid)) continue;
      collided = true;
      if (axis === 'x') object.x = amount > 0 ? solid.x - object.w : solid.x + solid.w;
      else object.y = amount > 0 ? solid.y - object.h : solid.y + solid.h;
    }
    return collided;
  }

  function applyBounds(g, allowFall = false) {
    if (g.camera?.infinite) return;
    g.pl.x = Math.max(0, Math.min(g.worldW - g.pl.w, g.pl.x));
    if (!allowFall) g.pl.y = Math.max(0, Math.min(g.worldH - g.pl.h, g.pl.y));
    if (allowFall && g.pl.y > g.worldH + 100) g.pl.health = 0;
  }

  function updateTopDown(g, dt, dx, dy, solids, moveTop) {
    const length = Math.hypot(dx, dy) || 1;
    moveTop(g.pl, dx / length * g.pl.speed * dt, dy / length * g.pl.speed * dt, solids);
    applyBounds(g);
  }

  function updatePlatformer(g, dt, dx, solids, hit, autoBounce = false) {
    const s = settings();
    g.vy = Number(g.vy || 0) + s.gravity * dt;

    const jumpPressed = g.keys.w || g.keys.arrowup || g.keys[' '];
    if ((jumpPressed || autoBounce) && g.onGround) {
      g.vy = -s.jumpPower;
      g.onGround = false;
    }

    collideAxis(g.pl, dx * g.pl.speed * dt, 'x', solids, hit);
    g.pl.y += g.vy * dt;
    g.onGround = false;

    for (const solid of solids) {
      if (!hit(g.pl, solid)) continue;
      if (g.vy > 0) {
        g.pl.y = solid.y - g.pl.h;
        g.onGround = true;
        if (autoBounce) g.vy = -s.jumpPower;
        else g.vy = 0;
      } else {
        g.pl.y = solid.y + solid.h;
        g.vy = 0;
      }
    }
    applyBounds(g, true);
  }

  function updateSliding(g, dt, dx, dy, solids, hit, kind) {
    const s = settings();
    g.pl._moveVX ??= 0;
    g.pl._moveVY ??= 0;

    const length = Math.hypot(dx, dy) || 1;
    const accelMultiplier = kind === 'swimming' ? .55 : kind === 'hover' ? .78 : 1;
    const maxMultiplier = kind === 'swimming' ? .62 : kind === 'hover' ? .82 : 1;
    const drag = kind === 'swimming' ? s.swimDrag : kind === 'hover' ? Math.min(.96, s.friction + .06) : s.friction;

    if (dx || dy) {
      g.pl._moveVX += dx / length * s.acceleration * accelMultiplier * dt;
      g.pl._moveVY += dy / length * s.acceleration * accelMultiplier * dt;
    }

    const frameDrag = Math.pow(drag, dt * 60);
    g.pl._moveVX *= frameDrag;
    g.pl._moveVY *= frameDrag;

    const maxSpeed = Math.max(1, Number(g.pl.speed || 240) * maxMultiplier);
    const velocity = Math.hypot(g.pl._moveVX, g.pl._moveVY);
    if (velocity > maxSpeed) {
      g.pl._moveVX = g.pl._moveVX / velocity * maxSpeed;
      g.pl._moveVY = g.pl._moveVY / velocity * maxSpeed;
    }

    if (collideAxis(g.pl, g.pl._moveVX * dt, 'x', solids, hit)) g.pl._moveVX *= -.18;
    if (collideAxis(g.pl, g.pl._moveVY * dt, 'y', solids, hit)) g.pl._moveVY *= -.18;
    applyBounds(g);
  }

  function updateThrow(g, dt, solids, hit) {
    const s = settings();
    g.pl._throwVX ??= 0;
    g.pl._throwVY ??= 0;
    g.pl._throwStuck ??= false;

    if (!g.pl._throwStuck) {
      const hitX = collideAxis(g.pl, g.pl._throwVX * dt, 'x', solids, hit);
      const hitY = collideAxis(g.pl, g.pl._throwVY * dt, 'y', solids, hit);

      const drag = Math.pow(.985, dt * 60);
      g.pl._throwVX *= drag;
      g.pl._throwVY *= drag;

      if (hitX || hitY) {
        if (s.throwSticky) {
          g.pl._throwVX = 0;
          g.pl._throwVY = 0;
          g.pl._throwStuck = true;
        } else {
          if (hitX) g.pl._throwVX *= -.45;
          if (hitY) g.pl._throwVY *= -.45;
        }
      }
    }
    applyBounds(g);
  }

  function updateDash(g, dt, dx, dy, solids, hit, moveTop) {
    g.pl._dashVX ??= 0;
    g.pl._dashVY ??= 0;
    const dashSpeed = Math.hypot(g.pl._dashVX, g.pl._dashVY);

    if (dashSpeed > 5) {
      if (collideAxis(g.pl, g.pl._dashVX * dt, 'x', solids, hit)) g.pl._dashVX = 0;
      if (collideAxis(g.pl, g.pl._dashVY * dt, 'y', solids, hit)) g.pl._dashVY = 0;
      const drag = Math.pow(.78, dt * 60);
      g.pl._dashVX *= drag;
      g.pl._dashVY *= drag;
    } else {
      const length = Math.hypot(dx, dy) || 1;
      moveTop(g.pl, dx / length * g.pl.speed * .55 * dt, dy / length * g.pl.speed * .55 * dt, solids);
    }
    applyBounds(g);
  }

  function updateCustom(g, dt, dx, dy, solids, moveTop) {
    // Custom starts as top-down and can be modified by DerpyScript values later.
    updateTopDown(g, dt, dx, dy, solids, moveTop);
  }

  function update(g, dt, dx, dy, solids, hit, moveTop) {
    const current = mode();
    if (current === 'platformer') updatePlatformer(g, dt, dx, solids, hit, false);
    else if (current === 'bouncy') updatePlatformer(g, dt, dx, solids, hit, true);
    else if (current === 'throw') updateThrow(g, dt, solids, hit);
    else if (current === 'flying') updateSliding(g, dt, dx, dy, solids, hit, 'flying');
    else if (current === 'hover') updateSliding(g, dt, dx, dy, solids, hit, 'hover');
    else if (current === 'swimming') updateSliding(g, dt, dx, dy, solids, hit, 'swimming');
    else if (current === 'dash') updateDash(g, dt, dx, dy, solids, hit, moveTop);
    else if (current === 'custom') updateCustom(g, dt, dx, dy, solids, moveTop);
    else updateTopDown(g, dt, dx, dy, solids, moveTop);
  }

  function pointerWorld(event) {
    if (!game) return null;
    const canvas = q('canvas');
    const rect = canvas.getBoundingClientRect();
    const screen = {
      x: (event.clientX - rect.left) * (game.w / rect.width),
      y: (event.clientY - rect.top) * (game.h / rect.height)
    };
    return window.DerpeditCamera ? window.DerpeditCamera.screenToWorld(game, screen.x, screen.y) : screen;
  }

  function launchToward(event) {
    if (!game?.pl) return;
    const current = mode();
    if (current !== 'throw' && current !== 'dash') return;

    const point = pointerWorld(event);
    if (!point) return;
    const cx = game.pl.x + game.pl.w / 2;
    const cy = game.pl.y + game.pl.h / 2;
    const dx = point.x - cx;
    const dy = point.y - cy;
    const length = Math.hypot(dx, dy) || 1;
    const s = settings();

    if (current === 'throw') {
      game.pl._throwVX = dx / length * s.throwPower;
      game.pl._throwVY = dy / length * s.throwPower;
      game.pl._throwStuck = false;
    } else {
      const now = performance.now();
      if (now < (game.pl._nextDash || 0)) return;
      game.pl._nextDash = now + s.dashCooldown * 1000;
      game.pl._dashVX = dx / length * s.dashPower;
      game.pl._dashVY = dy / length * s.dashPower;
    }
  }

  function bind() {
    if (clickBound) return;
    clickBound = true;
    q('canvas')?.addEventListener('pointerdown', launchToward, true);
  }

  bind();

  window.DerpeditMovement = { update, mode, settings };
})();
