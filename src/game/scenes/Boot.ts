import { Scene } from 'phaser';
import { ASSETS, type AssetEntry, type AssetKey } from '../config/assets';
import { STORY } from '../config/story';
import { COLORS, GAME_HEIGHT, GAME_WIDTH, toNum } from '../config/theme';
import { createPlaceholderTexture } from '../systems/placeholders';
import { progress } from '../systems/progress';

/**
 * Loads image files listed in config/assets.ts and generates placeholders for the rest.
 *
 * Dev shortcuts (append to the URL):
 *   ?level=1        jump straight into challenge #1 (0-based index into STORY.levels)
 *   ?scene=Finale   start any scene by key
 *   ?reset          wipe saved progress
 */
export class Boot extends Scene
{
    constructor ()
    {
        super('Boot');
    }

    preload ()
    {
        const barWidth = 600;
        const frame = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, barWidth, 36).setStrokeStyle(4, toNum(COLORS.chalk));
        const bar = this.add.rectangle(frame.x - barWidth / 2 + 4, frame.y, 0, 28, toNum(COLORS.accent)).setOrigin(0, 0.5);
        this.load.on('progress', (p: number) => { bar.width = (barWidth - 8) * p; });

        this.load.on('loaderror', (file: { src: string }) =>
            console.warn(`[assets] Could not load "${file.src}", using the placeholder instead.`));

        this.load.setPath('assets');
        for (const [key, entry] of Object.entries(ASSETS) as [string, AssetEntry][])
        {
            if (!entry.file) continue;
            if (entry.file.endsWith('.svg')) this.load.svg(key, entry.file, { width: entry.width, height: entry.height });
            else this.load.image(key, entry.file);
        }
    }

    create ()
    {
        for (const key of Object.keys(ASSETS) as AssetKey[])
        {
            if (!this.textures.exists(key)) createPlaceholderTexture(this.textures, key);
        }

        const params = new URLSearchParams(window.location.search);
        if (params.has('reset')) progress.reset();

        const levelIndex = Number(params.get('level'));
        if (params.has('level') && STORY.levels[levelIndex])
        {
            this.scene.start(STORY.levels[levelIndex].scene, { levelIndex });
            return;
        }

        this.scene.start(params.get('scene') ?? 'Title');
    }
}
