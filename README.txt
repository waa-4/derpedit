DERPEDIT v0.6 — HOTBAR, ITEMS & RANGED WEAPONS

Simplified Item flow:
1. Add an Item Object to a Room.
2. Give it an Item ID, such as Blaster.
3. Keep "Pickup by touching" enabled.
4. Keep "Equip when picked up" enabled if it should immediately become active.
5. During play, touch it with a Player Being.
6. It enters the hotbar and stays available when changing Rooms.

Hotbar:
- Persists between Rooms.
- Click a slot or press keys 1–9 to equip an Item.
- Inventory quantities and the equipped Item are included in browser autosave.
- Touching an Item that is already in the hotbar increases its inventory count instead of adding duplicate slots.

Basic ranged weapon:
- Select an Item.
- Enable "Usable / weapon."
- Set Weapon Type to "Ranged projectile."
- Configure speed, damage, cooldown, lifetime, count, and spread.
- Pick it up during play.
- Fire using Space or by clicking/tapping the play area.

Examples:
Pistol:
- Count 1
- Spread 0
- Damage 15
- Cooldown 0.25

Shotgun:
- Count 6
- Spread 30
- Damage 5
- Cooldown 0.8

Current limitation:
The visual ranged weapon system works directly from Item properties. The deeper DerpyScript projectile system is still a foundation and will be expanded with projectile sprites, pierce, explosions, and scripted firing patterns.
