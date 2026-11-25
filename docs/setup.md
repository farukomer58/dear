# Setup & personalisation

Everything you need to do before handing the game to your friend. The game already runs with
generated placeholder art, so each step is optional and can be done in any order.

## 1. Run it and play on your phone

```bash
npm install
npm run dev-nolog -- --host
```

Vite prints a `Network:` URL (e.g. `http://192.168.1.26:8080`). Open it on a phone connected to the
same Wi-Fi. If it doesn't load, allow Node.js through the Windows firewall for private networks.

Useful URL shortcuts while testing:

| URL | Effect |
|-----|--------|
| `?reset` | Wipe saved progress |
| `?level=1` | Jump into challenge #1 (0-based, order of `levels` in `story.ts`) |
| `?scene=Surprise` | Open any scene directly (`Finale` stays locked until all levels are won) |

> `npm run dev` / `npm run build` also send an anonymous ping to Phaser (see `log.js`). Use the `-nolog` variants to avoid it.

## 2. Personalise the story: `src/game/config/story.ts`

All texts are in Turkish and live in this one file.

- `teacherName`, `gameTitle`: shown on the title screen.
- `ui`: every button and label (Başla, Süre doldu!, Tekrar dene...). Entries written as small
  functions, e.g. `` (n, total) => `Ders ${n} / ${total}` ``, insert a number or word; only edit the text part.
- Per level: board `question`, `studentReplies`, `teacherReply`, `howToPlay`.
- Per level `settings`: difficulty (time limits, goals, fall speed, maze size, shuffle moves...).
  - **Tarif Telaşı** (`recipe`): `ingredients` maps a name to an emoji; each dish in `dishes` lists the
    names of its ingredients (2–5). The other ingredients are used as wrong answers.
  - **İlmihal Yarışması** (`quiz`): `questions`, each with 4 `options` and `answer` = index of the right
    one (0 = first). Options are shuffled in the game. Please double-check the answers.
  - **Atasözü Bilmecesi** (`proverb`): the `answer`, `decoys`, the spoken `soundHint` and the three `hints`.
- `finale.poem`: the poem, one entry per line. **Clues**: every new game picks one random word
  (3+ letters) of the poem per level; winning the level reveals it. In the final lesson those words are
  blanks that the player fills in reading order. The poem needs at least as many different 3+ letter
  words as there are levels (8). Editing the poem starts a fresh word plan for saved games.
- `surprise`: the final message. `ottoman` is shown first in Arabic script (Amiri font, right to left);
  the "Çevir" button turns it into `modern`. **The default text is only an example: replace both with
  your own message.** Use `\n` for line breaks; long text shrinks to fit.

Colours and fonts live in `src/game/config/theme.ts`.

## 3. Replace the placeholder art

All images are listed in `src/game/config/assets.ts` (the comment at the top explains the steps):
put a file in `public/assets/`, set its `file` field, reload. Missing or broken files automatically
fall back to the placeholder, so you can swap one image at a time.

What you may want to provide (sizes in game pixels; the screen is 1080 × 1920 portrait):

| What | Keys | Size | Tips |
|------|------|------|------|
| Classroom background | `classroom` | 1080×1920 | Keep the chalkboard roughly at y 250–850 (questions are written there) and leave the bottom free for students |
| Challenge background | `board-bg` | 1080×1920 | Darkish so white text stays readable. Each level can override it via `background` in `story.ts` |
| Teacher | `teacher` | 360×540 | Transparent PNG, full body, feet at the bottom edge. A cartoon version of your friend works great |
| Students (seen from behind) | `student-1..3` | 250×280 | Transparent PNG |
| Clue icon | `clue` | 160×160 | The 8 slots at the top of the classroom |
| Memory cards | `card-back`, `card-front`, `face-*` | 210 / 130 | Faces are drawn on top of `card-front` |
| Tap challenge | `coin` | 220×220 | |
| Catch challenge | `bucket`, `item-*` | 300×210 / 130 | Item labels come from `story.ts`, so you can add or rename items there |
| Maze | `heart`, `maze-exit` | 100×100 | |
| **Puzzle photo** | `puzzle-image` | 960×960 | Any photo works; non-square photos are cropped to their centre square. The placeholder has faint numbers to help |
| Proverb rebus | `hands`, `speaker` | 360×280 / 200 | `hands` is `public/assets/hands.svg` (two hands, silver and gold ring); replace it with another SVG or PNG |
| Surprise screen | `surprise-bg`, `flower-1..3`, `petal` | 1080×1920 / 200 / 48×36 | |

If your art has different proportions, adjust the positions at the top of
`src/game/scenes/Classroom.ts` (`TEACHER_SPOT`, `STUDENT_SPOTS`).

Free sources: [Kenney](https://kenney.nl/assets) (CC0), [OpenGameArt](https://opengameart.org),
or generate/draw your own. Export PNGs at exactly the listed size to keep downloads small.

**Sounds** are synthesized in code (`src/game/systems/sfx.ts`). That file explains how to switch to audio files.

## 4. Before you share it

- [ ] **Set `UNLOCK_ALL_FOR_TESTING = false`** at the top of `story.ts`. While it is `true` (red "🔓 TEST"
      badge), the lesson list opens every lesson, the final lesson and the surprise without playing in order.
- [ ] Texts, names, poem, quiz answers and the surprise message (Ottoman + modern) edited in `story.ts`
- [ ] Full playthrough on a real phone (use `?reset` to start fresh)
- [ ] Every challenge winnable at the chosen difficulty

## 5. Publish

```bash
npm run build-nolog
```

Upload the contents of `dist/` to any static host. Paths are relative, so sub-folders work too:

- **Netlify Drop**: drag the `dist` folder onto <https://app.netlify.com/drop>. The quickest option.
- **GitHub Pages / Cloudflare Pages / Vercel**: build command `npm run build-nolog`, output folder `dist`.

On the phone, "Add to Home Screen" opens the game full screen like an app (portrait, no browser bars).
Progress is saved in the browser, so the player can stop and continue later.
In the classroom, tapping the lesson counter (top left) lists finished lessons with a ↻ button to replay them.
Once the poem is completed, the game stays finished: the title screen offers "🎁 Son sayfa" (the surprise)
and "Derslere dön" (replay any lesson). Only `?reset` in the URL wipes the save.
