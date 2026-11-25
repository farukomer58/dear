# AGENTS.md

A phone-first web game (in Turkish) made as a gift: a teacher asks her class questions, the students
can't answer, so the teacher (the player) takes on a minigame herself. Winning a minigame awards one
random word of a poem as a clue; the final lesson asks the player to fill those words back into the
poem, then a surprise screen shows a personal message in Ottoman Turkish with an animated translation.

Stack: **Phaser 4** + TypeScript + Vite. Human-facing setup/personalisation lives in `docs/setup.md`.

## Commands

```bash
npm run dev-nolog      # dev server on :8080 (add `-- --host` to test on a phone)
npm run typecheck      # tsc --noEmit, must pass
npm run build-nolog    # production build into dist/
```

Dev URL shortcuts: `?reset` (wipe save), `?level=N` (start challenge N, 0-based), `?scene=Key` (start any scene,
e.g. `?scene=Surprise`; `Finale` shows a locked message until all levels are won).
On the dev server the Phaser instance is exposed as `window.game`, e.g.
`game.scene.getScene('CatchGame')`.

## Layout

```
src/main.ts                     loads fonts, then starts the game
src/game/main.ts                Phaser config + scene list (register new scenes here)
src/game/config/
  story.ts                      ALL player-facing text (`ui` block + per level), level order, difficulty, poem, final message
  assets.ts                     texture manifest (key -> optional file + display size; .png/.jpg/.svg)
  theme.ts                      game size (1080x1920 portrait), fonts, colours, text styles
src/game/systems/
  placeholders.ts               Canvas-drawn fallback art, one drawer per asset key
  progress.ts                   localStorage save v2: level index, random clue plan (poem token per level), earned words
  poem.ts                       splits the poem into tokens, clue candidates, tr-TR upper/lower helpers
  sfx.ts                        synthesized sound effects + vibration
src/game/ui/widgets.ts          buttons, panels, speech bubbles, effects, scene transitions
src/game/scenes/
  Boot.ts                       loads files from the manifest, generates missing placeholders, URL shortcuts
  Title.ts, Classroom.ts        title screen; story hub between challenges
  Finale.ts                     poem with blanks, clue chips fill them in reading order, line-by-line reveal
  Surprise.ts                   flowers + Ottoman message (Amiri, RTL) with the "Çevir" blur/typewriter toggle
  minigames/BaseMinigame.ts     shared HUD, intro, countdown, timer, win (awards the clue) / lose
  minigames/*Game.ts            one file per challenge, exports its own Settings type:
                                Memory, TapRush, Catch, Maze, SlidePuzzle, Recipe, Quiz, Proverb
```

Flow: `Boot → Title → Classroom → <level.scene> → Classroom (celebrate) → … → Finale → Surprise`.
Minigames receive `{ levelIndex }` and always return to the Classroom. Tapping the lesson counter in the
Classroom opens a list of lessons with replay buttons. `UNLOCK_ALL_FOR_TESTING` in `story.ts` (shows a TEST badge) opens every lesson, the Finale (all clues as blanks)
and the Surprise from the lesson list; it must be `false` for the real game. Completing the poem sets `progress.finished`: from then on
nothing is locked or reset in-game (Title/Classroom offer the Surprise page, Finale shows the solved poem).

## Conventions

- **No hard-coded player-facing text or tuning in scenes.** Put it in `story.ts` (shared strings in `STORY.ui`,
  templated ones as small functions there; per-level `settings`) or `theme.ts`. Texts are Turkish: use
  `trUpper()`/`trLower()` from `systems/poem.ts` instead of `toUpperCase()` (i/İ, ı/I).
- **Images go through the manifest.** Add a key to `assets.ts` and a drawer to `placeholders.ts`
  (the `Record<AssetKey, Drawer>` type enforces it), and place images with `addAsset()` so custom files keep the declared size.
  When tweening scale, tween relative to the image's initial `scaleX`, not to `1`.
- **Coordinates are in the 1080×1920 virtual space**; `Scale.FIT` handles screens. Keep touch targets ≥ 110 px.
- **Reuse `ui/widgets.ts`** for buttons, panels and transitions (`enterScene()` at the top of `create()`, `goTo()` to leave).
- **Scenes are reused on restart**: initialise state in `setupGame()` / `create()`, not in field initialisers.
- Keep it simple: plain functions for helpers, one class per scene, no extra abstraction layers.
- Comments explain how to customise or why, not what the next line does.

### Phaser 4 notes

Phaser 4 differs from v3 (most online examples are v3). Check `node_modules/phaser/skills/*/SKILL.md`,
especially `v3-to-v4-migration`. Relevant here: `setTintFill()` is gone (use `setTint().setTintMode()`),
FX/masks are now filters, and `DynamicTexture` needs `render()`. Placeholders use `textures.createCanvas()` + `refresh()`.

## Adding a minigame

1. Create `src/game/scenes/minigames/MyGame.ts` extending `BaseMinigame<MySettings>`; export `MySettings`.
   Implement `setupGame()` (build the board) and `startGame()` (start the action); call `this.win()`
   and `this.lose(reason)`. Guard input and `update()` with `this.isPlaying`.
   Use `startTimer()` (restartable), `addSeconds()`, `stopTimer()`, `setLeftPill()`/`setRightPill()`
   and `PLAY_AREA` from the base class.
2. Register the class in the `scene` array in `src/game/main.ts`.
3. Add `| { scene: 'MyGame'; settings: MySettings }` to `LevelDef` in `story.ts` and add a level entry.
4. New images: add them to `assets.ts` + `placeholders.ts`.
5. Nothing to hide: `win()` awards the clue word. Each level needs one clue word, so the poem in
   `STORY.finale.poem` must have at least as many distinct 3+ letter words as there are levels.

## Before finishing a change

- `npm run typecheck` and `npm run build-nolog` pass.
- Check the affected scene in a phone-sized viewport (≈390×844) via the URL shortcuts.
- Update `docs/setup.md` or this file if setup steps or conventions changed. Edit existing docs; don't add new ones.
