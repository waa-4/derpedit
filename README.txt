DERPEDIT v0.8 — WORLD & CAMERA

This update fixes the Camera controls that were already present in the Rooms tab.
It does not replace the classic renderer, textures, colors, physics, combat,
Room UI, or editor appearance.

ROOM CAMERA OPTIONS

Fixed
- Keeps the camera at world position 0,0.
- Works like the original screen-sized Play Mode.

Follow Player
- Follows the Player Being.
- Uses Room Width and Room Height as world boundaries.
- The player can travel across Rooms much larger than the visible screen.
- The camera stays inside the Room, so it does not reveal empty space beyond
  the Room edges.

Infinite + Follow Player
- Follows the Player without Room boundaries.
- The player and camera may continue in any direction.
- Objects retain their world positions.

Infinite Room checkbox
- Removes Room bounds while preserving the selected camera behavior.
- For an actually moving infinite camera, use Follow Player or
  Infinite + Follow Player.

CAMERA FIXES
- Room Width and Room Height now control the playable world instead of being
  ignored.
- The player is no longer clamped to the visible canvas.
- Camera following is smooth and centered on the Player.
- Imported textures, object colors, rotations, and sizes use the same rendering
  code as before.
- UI-layer Objects remain fixed to the screen.
- World Objects, bullets, and melee attack arcs move with the camera.
- Mouse aiming converts screen coordinates into world coordinates, so shooting
  remains accurate while the camera moves.
- Fast bullet collision and melee attacks from v0.7.1 remain included.

TEST
1. Open the Rooms tab.
2. Select a Game Room.
3. Set Camera to Follow Player.
4. Set Room Width to 3000 and Room Height to 1500.
5. Place Objects beyond the initial visible screen.
6. Press Play and move toward them.

The editor's right-click pan and mouse-wheel zoom are unchanged.
