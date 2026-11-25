/**
 * ASSET MANIFEST: every image in the game is listed here by texture key.
 *
 * HOW TO REPLACE A PLACEHOLDER WITH YOUR OWN IMAGE
 * 1. Put the file in `public/assets/` (PNG with transparency, or JPG for backgrounds).
 * 2. Set `file` for that key, e.g. `teacher: { file: 'teacher.png', width: 360, height: 520 }`.
 * 3. Reload. The image is drawn at `width` x `height` (game units, the screen is 1080 x 1920),
 *    so export your art at that size or at least the same aspect ratio.
 *    `.svg` files are supported too: they are rasterised at `width` x `height`.
 *
 * Leave `file` empty to keep the generated placeholder (see systems/placeholders.ts).
 * If a file fails to load, the game falls back to the placeholder automatically.
 *
 * Adding a new image: add a key here AND a placeholder drawer in systems/placeholders.ts
 * (TypeScript will remind you), then use the key in a scene: `this.add.image(x, y, 'my-key')`.
 */
export interface AssetEntry
{
    file?: string;
    width: number;
    height: number;
}

export const ASSETS = {
    // Backgrounds (full screen, portrait)
    'classroom':     { file: '', width: 1080, height: 1920 },
    'board-bg':      { file: '', width: 1080, height: 1920 },

    // Characters
    'teacher':       { file: '', width: 360, height: 540 },
    'student-1':     { file: '', width: 250, height: 280 },
    'student-2':     { file: '', width: 250, height: 280 },
    'student-3':     { file: '', width: 250, height: 280 },

    // Shared: clue icon in the classroom HUD
    'clue':          { file: '', width: 160, height: 160 },

    // Memory challenge
    'card-back':     { file: '', width: 210, height: 210 },
    'card-front':    { file: '', width: 210, height: 210 },
    'face-apple':    { file: '', width: 130, height: 130 },
    'face-books':    { file: '', width: 130, height: 130 },
    'face-pencil':   { file: '', width: 130, height: 130 },
    'face-globe':    { file: '', width: 130, height: 130 },
    'face-backpack': { file: '', width: 130, height: 130 },
    'face-flask':    { file: '', width: 130, height: 130 },
    'face-ruler':    { file: '', width: 130, height: 130 },
    'face-palette':  { file: '', width: 130, height: 130 },

    // Tap rush challenge
    'coin':          { file: '', width: 220, height: 220 },

    // Catch challenge
    'bucket':        { file: '', width: 300, height: 210 },
    'item-swim':     { file: '', width: 130, height: 130 },
    'item-read':     { file: '', width: 130, height: 130 },
    'item-run':      { file: '', width: 130, height: 130 },
    'item-music':    { file: '', width: 130, height: 130 },
    'item-fruit':    { file: '', width: 130, height: 130 },
    'item-alcohol':  { file: '', width: 130, height: 130 },
    'item-pork':     { file: '', width: 130, height: 130 },
    'item-smoke':    { file: '', width: 130, height: 130 },

    // Maze challenge (the maze itself is drawn in code)
    'heart':         { file: '', width: 100, height: 100 },
    'maze-exit':     { file: '', width: 100, height: 100 },

    // Slide puzzle: square photo, cut into tiles in game. Any square image works.
    'puzzle-image':  { file: '', width: 960, height: 960 },

    // Proverb rebus
    'hands':         { file: 'hands.svg', width: 360, height: 280 },
    'speaker':       { file: '', width: 200, height: 200 },

    // Surprise screen
    'surprise-bg':   { file: '', width: 1080, height: 1920 },
    'flower-1':      { file: '', width: 200, height: 200 },
    'flower-2':      { file: '', width: 200, height: 200 },
    'flower-3':      { file: '', width: 200, height: 200 },
    'petal':         { file: '', width: 48, height: 36 }
} satisfies Record<string, AssetEntry>;

export type AssetKey = keyof typeof ASSETS;
