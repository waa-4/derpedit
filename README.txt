DERPEDIT v1.2 — FULL CREATION UPDATE

This combines the movement work with the remaining features from the user's
Creation Update plan.

MOVEMENT
- Unified project-wide Movement Mode.
- Top Down, Platformer, Bouncy, Throw, Flying, Hover, Swimming, Dash, Custom.
- Flying and Hover use sliding acceleration and momentum.

CAMERA ZOOM
- Every Room now has In-game Zoom from 0.25x to 4x.
- Existing camera follow and infinite settings remain available.

GRADIENTS
- Objects support optional horizontal, vertical, or diagonal gradients.
- Gradient Start and Gradient End colors are configurable.

TEXT
- Text, Label, and Button Objects support:
  - Font family
  - Text size
  - Text color
  - Bold
- Runtime rendering uses these settings.

VALUES
- Added an easier Values Guide and JSON editor.
- Runtime API:
  DerpeditValues.get("Coins")
  DerpeditValues.set("Coins", 10)
  DerpeditValues.add("Coins", 5)
  DerpeditValues.remove("Lives", 1)

DERPTHING
- Added a local keyword-based game helper.
- It recognizes words such as:
  2D, platformer, waves, zombie, gun, catapult, multiplayer,
  flying, hover, swimming, dash, throw, bouncy, and small.
- It generates DerpyScript for the Generate tab.
- If nothing supported is detected, it explains which words to try.
- DerpThing is local and rule-based; it does not send prompts online.

GENERATOR
- Keeps the expanded enemy, gun, wave, movement, value, catapult, and breakable commands.
- Sprite names are resolved against imported Sprites after generation when names match.

GUIDE
- Added camera zoom, text, gradient, and value examples.

UNCHANGED
- Rendering structure
- Camera follow/infinite behavior
- Existing UI layout structure
- Asset system
- Physics
- Controls and Play Mode
- Waves, multiplayer, templates, and GitHub ZIP export


DERPEDIT v1.2.1 — PLACEMENT FIX

Fixed:
- Objects can be inserted again.
- v1.2 removed the old Game Type selector after combining it into Movement Mode,
  but render() still attempted to read the removed #gameType element.
- That caused render() to stop whenever an Object was added.
- render() now reads Movement Mode and maintains the legacy gameType value only
  for backward compatibility.
- Added the visible Value Guide button if it was missing from the toolbar.
