DERPEDIT v0.6.2 — PLAY MODE & HTML FIX

The previous ZIP had a mismatch between the JavaScript and index.html:
- JavaScript expected an element named runtimeHotbar, but the HTML did not contain it.
- JavaScript looked for playCanvas, while the actual canvas ID is canvas.
- This caused Play Mode to stop during startup.

Fixed:
- Added the real runtime hotbar element to index.html.
- Connected weapon input and projectile drawing to the correct canvas.
- Added safety checks so a missing hotbar cannot break the whole engine.
- Updated the actual startGame and loop function bindings used by the Play button.
- Stabilized projectile frame timing.
- Item pickup, equipping, hotbar selection, Room persistence, and shooting remain included.

Test:
1. Open this ZIP's index.html—not an index.html copied from an older version.
2. Add or select a Game Room.
3. Add a Player Being and an Item.
4. Enable Pickup by touching and Equip when picked up.
5. Press Play.
6. Touch the Item. It should enter and highlight in the hotbar.
7. For ranged Items, fire with Space or click/tap the game canvas.
