DERPEDIT v0.5.1 — INSERT & AUTOSAVE FIX

Fixed:
- Basic Block can now be inserted.
- Collision Block can now be inserted.
- Item can now be inserted.
- Script Object can now be inserted.
- The add-object function now reports missing Object types instead of failing silently.
- Old Wall objects migrate to Collision Blocks.

Autosave:
- The complete current project is saved automatically in the browser.
- Refreshing or reopening the same index.html restores Rooms, Objects, Sprites, scripts, values, and the selected Room.
- Autosave occurs after edits, when the page is hidden, before closing, and when using Save.
- The normal Save button still downloads a portable .derpedit project file.

Important:
Browser autosave belongs to the browser/profile and this particular local page location. Keep downloaded .derpedit backups for important projects.
