DERPEDIT v0.6.3 — RUN INVENTORY & SHOOTING FIX

Inventory behavior fixed:
- Item quantities are no longer stored inside the project or browser autosave.
- Starting Play Mode creates a fresh inventory and hotbar.
- Items remain in the hotbar while moving between Rooms during that same run.
- Pressing Stop ends the run and clears the temporary inventory.
- Starting Play again begins at zero, so repeatedly testing a Room does not permanently increase Item counts.
- Old runtimeInventory data from v0.6.1/v0.6.2 is ignored and removed when the project loads.

Ranged shooting fixed:
1. Select an Item.
2. Enable "Usable / weapon."
3. Set Weapon Type to "Ranged projectile."
4. Configure Damage, Speed, Cooldown, Lifetime, Count, and Spread.
5. Enter Play Mode and pick up the Item.

Controls:
- Click or tap the game to shoot toward that position.
- Press F to shoot in the last movement direction.
- Press Space to shoot in top-down games.
- Space remains Jump in platformer games.
- Press 1–9 or click a hotbar slot to equip an Item.

Projectile behavior:
- Starts outside the Player so it does not collide at the spawn point.
- Uses actual pointer aiming.
- Damages Enemy Beings.
- Destroys enemies at zero health.
- Stops on Collision Blocks.
- Expires after its configured lifetime or after leaving the Room.
- Supports multi-shot and spread.

Room changes:
- Inventory survives goto-room buttons and scripted room transitions.
- Frame-loop tokens prevent duplicate game loops when changing Rooms.
