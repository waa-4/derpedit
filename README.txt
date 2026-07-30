DERPEDIT v0.4.3 — BEING SYSTEM

Main change:
- Player and Enemy are no longer separate palette Parts.
- Add one Being, then choose its Being Type:
  - Player
  - Enemy
  - Neutral / NPC

Runtime behavior:
- The Player-controlled Being is used as the room player.
- Enemy Beings chase and damage the Player.
- Neutral Beings do not automatically fight or move.
- Old Player and Enemy objects migrate automatically into Beings.

Play-mode overlay protection:
- The editor layer and grid are force-hidden while playing.
- The runtime layer is forced above editor content.

Open index.html to run Derpedit.
