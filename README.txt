DERPEDIT v0.5 — OBJECTS, SPRITES & CUSTOM SCRIPTS

Terminology:
- Parts are now called Objects.
- Assets are now called Sprites.

New Objects:
- Basic Block: visual block with collision off by default.
- Collision Block: replaces Wall and collides by default.
- Being: Player, Enemy, or Neutral / NPC.
- Item: supports Item ID, stack size, pickup amount, auto pickup, and description.
- Script Object: visible in the editor, invisible during play, and intended for reusable/global DerpyScript.
- Existing UI and gameplay Objects remain available.

Toolbox:
- Save the complete selected Object, including its sprite, scripts, properties, physics, item data, and Being settings.
- Click a saved Toolbox Object to place a copy into the current Room.
- Sprites can still be saved separately.

DerpyScript Guide:
- Every command has its own searchable card.
- Each card includes category, description, example, and an Insert button.

Custom script syntax:
customscript title=Change "id Test sprite Red"
customscript title=Change2 "id Test sprite Blue"

when game starts
loop "run Change wait 1 run Change2 wait 1"

Supported in this version:
- customscript title=___ "___"
- run ___
- loop "___"
- wait ___
- id ___ sprite ___
- sprite ___

Note:
Custom Scripts are an early runtime foundation. Nested run commands and timed sprite-changing loops work, while the system will continue gaining more DerpyScript commands in later versions.
