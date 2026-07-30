DERPEDIT v0.4 — 2D Foundation

Open index.html in a modern browser.

Major changes:
- Split into multiple JavaScript files and external CSS.
- Stronger pixel-art grid, grid toggle, pixel undo/redo.
- Browser-persistent Toolbox for reusable image assets.
- Import PNG/JPG/WEBP/GIF images.
- Import music and assign it per Room.
- Room camera mode, room width/height, and infinite-room settings.
- Render layers and Part opacity.
- Physics, gravity, collision, and team properties.
- Idle/walk/jump/fall animation asset slots.
- Separate DerpyScript command module.

Compatibility:
Old .derpedit projects are automatically given safe defaults for the new fields.

This is the v0.4 foundation. Camera scrolling, full physics simulation, animation playback,
team combat, inventory/hotbar, and created-Part scripts are prepared for later expansion.


DERPEDIT v0.4.1 — SCRIPT & DISPLAY PATCH

- Fixed editor Parts remaining visible beneath Play Mode.
- Added Script Part: visible in editor, never rendered in game.
- Added when clicked and functional collision/start events.
- Added display, text, and color commands.
- Added local and shared values.
- Added add/remove/set commands and basic if conditions.
- Added change sprite commands.
- Buttons now run DerpyScript.

Examples:

when clicked
add 1 to Coins
display "Clicked!"

new shared value Credits = 100
when clicked
if Credits >= 25
remove 25 from Credits
change sprite to UpgradedButton
display "Upgrade bought!"
