DERPEDIT v0.7.1 — COMBAT & OPTIONAL ONLINE

BASED ON
- The classic v0.7 build.
- Rendering, textures, colors, scaling, camera, Rooms, physics, movement, and editor layout remain unchanged.

BULLET COLLISION FIX
- Bullets now recognize Enemy Beings, chase Beings, and opposing-team Beings.
- Collision uses both normal overlap and swept collision.
- Swept collision prevents fast projectiles from passing completely through an enemy between frames.
- Bullets damage enemies and disappear on impact.
- Enemy health reaching zero destroys that enemy.

MELEE
1. Create or select an Item.
2. Turn on Usable / weapon.
3. Set Weapon Type to Melee.
4. Configure:
   - Melee Range
   - Melee Arc
   - Melee Damage
   - Swing Time
   - Knockback
   - Hit Once Per Swing
5. Equip the Item and click, press F, or press Space in a top-down game.
6. The melee arc follows the same 360-degree aiming system.

OPTIONAL SUPABASE ONLINE
- Press the new Online button.
- Enter:
  1. Supabase Project URL
  2. Browser-safe Publishable key, or a legacy anon key
- Never paste a secret key or service_role key into a browser game.
- Online remains disabled unless explicitly enabled.
- Offline games continue working without Supabase.

LEADERBOARD SETUP
- Run SUPABASE_SETUP.sql in the Supabase SQL Editor.
- The included table supports multiple games and multiple online value names.
- Configure allowed names such as:
  Score, Coins, BestTime
- Runtime API:
  await DerpeditOnline.submitScore("Score", 250, "Player")
  await DerpeditOnline.getLeaderboard("Score", 10)

SECURITY NOTE
- The included example allows public reading and public score submission.
- It uses Row Level Security and basic database checks.
- A public anonymous leaderboard cannot fully prevent cheating because players control their browser.
- For important competitive games, use authenticated users and server-side validation.

FILES
- js/v07-items-aim.js: combat, aiming, ranged, and melee.
- js/online.js: optional Supabase connection and leaderboard API.
- SUPABASE_SETUP.sql: database table, RLS policies, and ranking index.
