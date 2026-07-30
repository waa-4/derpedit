DERPEDIT v0.7 — CLASSIC RUNTIME: ITEMS & AIMING

This version is based directly on the supplied v0.6.3 build.

UNCHANGED
- Classic Play Mode renderer
- Imported textures and pixel-art rendering
- Object colors and shapes
- Canvas sizing and scaling
- Camera behavior
- Physics and movement
- Enemy behavior
- Rooms, UI objects, scripts, and the editor interface

ITEM FIXES
- Play inventory remains temporary and is never stored in project autosave.
- Pressing Play starts a fresh run.
- Room transitions preserve the current run's inventory.
- Pressing Stop clears the run.
- Returning to a Room during the same run does not let the same physical Item
  object increase its count again.
- Separate duplicate Item objects can still each be collected normally.

AIMING FIXES
- Moving the mouse across the canvas updates aim continuously in all directions.
- Clicking fires toward the exact cursor position.
- F and Space use the latest cursor aim.
- Before the cursor enters the game, keyboard firing falls back to the previous
  movement-facing direction.
- Pointer coordinates use the classic renderer's CSS-pixel coordinate space, so
  browser scaling and device-pixel ratio do not force shots into one direction.

WEAPON SETUP
- Usable / weapon: enabled
- Weapon Type: Ranged projectile
- Adjust damage, speed, cooldown, lifetime, count, and spread

Open the index.html included in this folder. It loads js/v07-items-aim.js.
