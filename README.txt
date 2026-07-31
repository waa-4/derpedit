DERPEDIT v1.0 — GAME SYSTEMS

Built from the tested v0.8 project without replacing the existing renderer, camera, UI layout, asset system, physics, controls, or Play Mode.

ADDED
- GitHub Pages-ready HTML ZIP export
- Optional Supabase Realtime multiplayer with join codes
- Automatic Join Lobby Room for multiplayer projects
- Game templates
- One-run project generator script, up to 10 Rooms
- Optional per-Room wave editor
- Healing Items used by clicking their hotbar slot
- Wave and respawn DerpyScript commands
- Inspector search
- Project Explorer
- Sprite drag and drop
- Clickable Room minimap

MULTIPLAYER
Open Multiplayer, enable it, enter a Supabase Project URL and publishable/anon key, then save. A Join Lobby Room is inserted automatically. Realtime multiplayer is intended for casual browser games; clients can modify their own browser code, so competitive validation needs a trusted server.

EXPORT
Export GitHub ZIP creates index.html, css/game.css, js/game.js and README.md. Upload the ZIP contents to a GitHub repository and enable GitHub Pages.


DERPEDIT v1.0.1 WAVE ENEMY FIX

Fixed:
- Changing a Being's Being Type to Enemy now saves correctly.
- Wave enemy dropdowns now recognize Enemy Beings and older Beings using
  the Chase behavior.
- The wave editor gives clearer setup instructions.

To add a custom wave enemy:
1. Add a Being to the same Room.
2. Select the Being.
3. Change Being Type to Enemy.
4. Customize its sprite, health, damage, speed, size, team, and scripts.
5. Open Rooms > Edit Waves.
6. Add an enemy row and select it from the dropdown.
