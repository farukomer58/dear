import { GameObjects, Math as PMath } from 'phaser';
import { COLORS, GAME_WIDTH, toNum } from '../../config/theme';
import { sfx, vibrate } from '../../systems/sfx';
import { addAsset, burst, floatText } from '../../ui/widgets';
import { BaseMinigame, PLAY_AREA } from './BaseMinigame';

export interface TapRushSettings
{
    /** Taps needed to win. */
    goal: number;
    /** Seconds available. */
    timeLimit: number;
}

/** Tap the jumping star as often as possible before the time runs out. */
export class TapRushGame extends BaseMinigame<TapRushSettings>
{
    private star: GameObjects.Image;
    /** Scale that gives the manifest display size (differs from 1 when a custom image is used). */
    private starScale: number;
    private bar: GameObjects.Rectangle;
    private score: number;

    constructor ()
    {
        super('TapRushGame');
    }

    protected setupGame ()
    {
        this.score = 0;

        // Progress bar at the bottom
        const barW = GAME_WIDTH - 200;
        const barY = PLAY_AREA.bottom + 40;
        this.add.rectangle(GAME_WIDTH / 2, barY, barW, 40, 0x000000, 0.3).setStrokeStyle(4, toNum(COLORS.chalkDim));
        this.bar = this.add.rectangle(GAME_WIDTH / 2 - barW / 2, barY, 0, 40, toNum(COLORS.accent)).setOrigin(0, 0.5);

        this.star = addAsset(this, GAME_WIDTH / 2, 1000, 'coin');
        this.starScale = this.star.scaleX;
        this.star.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.onStarTap());
        this.tweens.add({ targets: this.star, angle: { from: -8, to: 8 }, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.InOut' });

        this.setLeftPill(`⏱ ${this.settings.timeLimit}`);
        this.setRightPill(`0 / ${this.settings.goal}`);
    }

    protected startGame ()
    {
        this.startTimer(this.settings.timeLimit);
    }

    private onStarTap ()
    {
        if (!this.isPlaying) return;

        this.score++;
        sfx.coin();
        vibrate(10);
        burst(this, this.star.x, this.star.y, COLORS.accent, 8);
        floatText(this, this.star.x, this.star.y - 80, '+1', COLORS.accent);
        this.setRightPill(`${this.score} / ${this.settings.goal}`);
        this.bar.width = (GAME_WIDTH - 200) * Math.min(1, this.score / this.settings.goal);

        if (this.score >= this.settings.goal)
        {
            this.win();
            return;
        }

        // Jump somewhere else, but far enough away to need a real move
        const margin = 140;
        let x: number, y: number;
        do
        {
            x = PMath.Between(PLAY_AREA.left + margin, PLAY_AREA.right - margin);
            y = PMath.Between(PLAY_AREA.top + margin, PLAY_AREA.bottom - margin);
        }
        while (PMath.Distance.Between(x, y, this.star.x, this.star.y) < 250);

        this.star.setPosition(x, y);
        this.tweens.add({ targets: this.star, scale: { from: this.starScale * 0.6, to: this.starScale }, duration: 140, ease: 'Back.Out' });
    }
}
