DERPEDIT v0.7 — RUNTIME REWRITE

The editor and Play Mode now use separate state.

PLAY SESSION
- Pressing Play always starts with an empty inventory.
- Items and quantities never save into the project.
- Changing Rooms through DerpeditRuntime.changeRoom(roomId) keeps the current inventory.
- Pressing Stop destroys the entire play session.
- Pressing Play again starts fresh.

AIMING
- Move the mouse over the game to aim in any direction.
- Click/tap the game to shoot toward that exact point.
- F shoots toward the current pointer aim.
- Space shoots in top-down games.
- Mobile uses the AIM / FIRE pad.
- Number keys 1–9 equip hotbar slots.

ITEMS
- Touching an Item adds it once to the hotbar.
- Duplicate pickups increase only the current play-session quantity.
- Equip when picked up selects it immediately.

RANGED WEAPON SETUP
- Usable / weapon: On
- Weapon Type: Ranged projectile
- Configure Speed, Damage, Cooldown, Lifetime, Count, and Spread.

IMPORTANT
Open the index.html inside this v0.7 folder. It loads js/v07-runtime.js. The old js/v06.js was removed.
