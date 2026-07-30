DERPEDIT v0.6.1 — ITEM PICKUP FIX

Fixed:
- A Player Being touching an Item now picks it up.
- The Item appears in the runtime hotbar immediately.
- "Equip when picked up" now selects it immediately.
- The score display shows the currently equipped Item.
- Hotbar inventory remains available when changing Rooms.
- Inventory and equipped Item are stored with project autosave.

How to test:
1. Add a Being and set Being Type to Player.
2. Add an Item near the Player.
3. Set an Item ID, such as Blaster.
4. Enable Pickup by touching.
5. Enable Equip when picked up.
6. Enter Play Mode and walk into the Item.
7. The Item should disappear from the Room, appear in the hotbar, and become highlighted.

For a weapon:
- Enable Usable / weapon.
- Set Weapon Type to Ranged projectile.
- Fire with Space or by clicking/tapping the play area.
