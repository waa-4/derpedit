DERPEDIT v1.1 — CREATION UPDATE, PART 1

Built from v1.0.1 without replacing the rendering, camera, UI layout, assets,
physics, controls, Play Mode, waves, exporting, or multiplayer.

GENERATOR EXPANSION
The Generate tab now supports:
- create player "Name"
- create enemy "Name"
- enemy sprite "Sprite Name"
- enemy size W H
- enemy health N
- enemy speed N
- enemy damage N
- enemy color COLOR
- enemy movement normal/bouncy/throw
- create gun "Name"
- gun type projectile/catapult/melee
- gun projectile sprite "Sprite Name"
- gun damage N
- gun cooldown N
- gun projectile speed N
- gun projectile lifetime N
- gun spread N
- gun count N
- gun catapult radius N
- gun catapult arc N
- wave N
- spawn "Enemy Name" COUNT
- new value Name = Value
- set value Name to Value
- breakable true/false
- break health N

CATAPULT WEAPONS
- Lob upward along a visible arc.
- Land at the aimed point.
- Damage Enemy Beings in a circular area.
- Damage breakable Objects in the landing area.
- Configure arc height, landing radius, travel time, and area damage.

BREAKABLE OBJECTS
Every Object now has:
- Breakable
- Break Health
- Drop Item ID

Bullets, melee attacks, and catapult explosions can damage breakable Objects.
When destroyed, the optional Drop Item ID is added to the current run inventory.

MOVEMENT TYPES
Being properties now include:
- Normal
- Bouncy
- Throw

Bouncy and Throw are foundations in this part of the update. Throw input launches
toward a click/tap. Their physics will continue to be polished in Part 2.

GUIDE
The searchable DerpyScript guide includes generation, catapult, breakable, and
starting-value examples.

The Generate tab opens with a ready-to-run small wave shooter example.
