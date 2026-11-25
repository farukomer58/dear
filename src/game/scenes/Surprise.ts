import { Filters, GameObjects, Math as PMath, Scene, WEBGL } from 'phaser';
import type { AssetKey } from '../config/assets';
import { STORY } from '../config/story';
import { COLORS, FONTS, GAME_HEIGHT, GAME_WIDTH, chalkStyle, textStyle } from '../config/theme';
import { progress } from '../systems/progress';
import { sfx } from '../systems/sfx';
import { addAsset, createButton, createMuteButton, createPanel, enterScene, goTo, typeText, wait } from '../ui/widgets';

const CARD_Y = 900;
const CARD_W = 940;
const CARD_H = 920;
const TEXT_W = 820;

/** Flower spots around the message card. [x, y, scale] */
const FLOWER_SPOTS: [number, number, number][] = [
    [90, 330, 0.9], [990, 330, 1], [250, 300, 0.55], [830, 290, 0.6],
    [60, 700, 0.7], [1020, 820, 0.75], [50, 1150, 0.8], [1030, 1250, 0.65],
    [110, 1560, 1.1], [970, 1560, 1.05], [280, 1690, 0.75], [800, 1700, 0.8],
    [70, 1830, 0.9], [1010, 1840, 0.95], [400, 1560, 0.5], [680, 1580, 0.5]
];
const FLOWERS: AssetKey[] = ['flower-1', 'flower-2', 'flower-3'];

/**
 * The very end: flowers bloom, petals fall, and the Ottoman Turkish message from
 * STORY.surprise appears. "Çevir" dissolves it into the modern Turkish translation and back.
 */
export class Surprise extends Scene
{
    private ottoman: GameObjects.Text;
    private modern: GameObjects.Text;
    private blur?: Filters.Blur;
    private translated: boolean;
    private busy: boolean;
    private toggle: GameObjects.Container;

    constructor ()
    {
        super('Surprise');
    }

    create ()
    {
        enterScene(this);
        progress.markFinished();
        this.translated = false;
        this.busy = false;
        this.blur = undefined;

        addAsset(this, GAME_WIDTH / 2, GAME_HEIGHT / 2, 'surprise-bg');
        createMuteButton(this, GAME_WIDTH - 80, 80);

        this.time.addEvent({ delay: 280, loop: true, callback: () => this.dropPetal() });
        this.bloomFlowers();

        const title = this.add.text(GAME_WIDTH / 2, 190, STORY.surprise.title, chalkStyle(80, { color: COLORS.primaryDark }))
            .setOrigin(0.5).setAlpha(0).setDepth(4);
        this.tweens.add({ targets: title, alpha: 1, y: 170, duration: 800, delay: 600 });

        const card = createPanel(this, GAME_WIDTH / 2, CARD_Y, CARD_W, CARD_H).setDepth(3).setScale(0.6).setAlpha(0);
        this.tweens.add({ targets: card, scale: 1, alpha: 1, duration: 500, delay: 900, ease: 'Back.Out' });

        // Texts live outside the card container so the blur filter applies to them directly
        this.ottoman = this.add.text(GAME_WIDTH / 2, CARD_Y, STORY.surprise.ottoman, textStyle(74, {
            fontFamily: FONTS.ottoman, rtl: true, lineSpacing: 18, color: COLORS.ink,
            wordWrap: { width: TEXT_W, useAdvancedWrap: true }, padding: { x: 20, y: 30 }
        })).setOrigin(0.5).setDepth(5).setAlpha(0);
        fitText(this.ottoman, CARD_H - 120);
        this.tweens.add({ targets: this.ottoman, alpha: 1, duration: 900, delay: 1400 });

        this.modern = this.add.text(GAME_WIDTH / 2, CARD_Y, '', textStyle(60, {
            lineSpacing: 10, color: COLORS.ink, wordWrap: { width: TEXT_W, useAdvancedWrap: true }
        })).setOrigin(0.5).setDepth(5);
        // Size the modern text for its full content up front, so it doesn't jump while typing
        this.modern.setText(STORY.surprise.modern);
        fitText(this.modern, CARD_H - 120);
        this.modern.setText('');

        this.toggle = createButton(this, GAME_WIDTH / 2, CARD_Y + CARD_H / 2 + 120, `✨ ${STORY.ui.translate}`, () => void this.onToggle(), {
            width: 440, height: 130, fontSize: 56
        }).setDepth(6).setScale(0);
        this.tweens.add({ targets: this.toggle, scale: 1, duration: 300, delay: 2300, ease: 'Back.Out' });

        // Progress is kept: the lesson list (tap the counter) replays any lesson. "Baştan başla" on the title wipes it.
        createButton(this, GAME_WIDTH / 2, GAME_HEIGHT - 110, STORY.ui.replayLessons, () => goTo(this, 'Classroom'), {
            width: 440, height: 110, fontSize: 44, color: COLORS.secondary, shade: COLORS.secondaryDark
        }).setDepth(6);
    }

    private bloomFlowers ()
    {
        sfx.bloom();
        FLOWER_SPOTS.forEach(([x, y, scale], i) =>
        {
            const flower = addAsset(this, x, y, FLOWERS[i % FLOWERS.length]).setDepth(2);
            const full = flower.scaleX * scale;
            flower.setScale(0).setAngle(-120);
            this.tweens.add({ targets: flower, scale: full, angle: 0, duration: 700, delay: 150 + i * 110, ease: 'Back.Out' });
            this.tweens.add({
                targets: flower, angle: { from: -6, to: 6 }, duration: 1800 + i * 90, delay: 900 + i * 110,
                yoyo: true, repeat: -1, ease: 'Sine.InOut'
            });
        });
    }

    private dropPetal ()
    {
        const x = PMath.Between(0, GAME_WIDTH);
        const petal = addAsset(this, x, -40, 'petal').setDepth(1).setAngle(PMath.Between(0, 360));
        const s = PMath.FloatBetween(0.7, 1.3);
        petal.setScale(petal.scaleX * s, petal.scaleY * s);
        this.tweens.add({
            targets: petal,
            y: GAME_HEIGHT + 40,
            x: x + PMath.Between(-200, 200),
            angle: petal.angle + PMath.Between(180, 540),
            duration: PMath.Between(5000, 8500),
            onComplete: () => petal.destroy()
        });
    }

    /** Blur needs WebGL; on the Canvas renderer the text simply fades. */
    private getBlur ()
    {
        if (this.blur || this.game.renderer.type !== WEBGL) return this.blur;
        this.ottoman.enableFilters();
        this.blur = this.ottoman.filters?.internal.addBlur(1, 2, 2, 0);
        return this.blur;
    }

    private async onToggle ()
    {
        if (this.busy) return;
        this.busy = true;
        const blur = this.getBlur();
        const label = this.toggle.list[1] as GameObjects.Text;

        if (!this.translated)
        {
            // Ottoman text dissolves, the translation is written letter by letter
            this.tweens.add({ targets: this.ottoman, alpha: 0, scale: 1.08, duration: 900, ease: 'Sine.In' });
            if (blur) this.tweens.add({ targets: blur, strength: 4, duration: 900, ease: 'Sine.In' });
            await wait(this, 700);
            this.modern.setAlpha(1);
            await typeText(this, this.modern, STORY.surprise.modern, 38);
            label.setText(`↺ ${STORY.ui.original}`);
        }
        else
        {
            this.tweens.add({ targets: this.modern, alpha: 0, duration: 500 });
            await wait(this, 400);
            this.modern.setText('');
            this.tweens.add({ targets: this.ottoman, alpha: 1, scale: 1, duration: 900, ease: 'Sine.Out' });
            if (blur) this.tweens.add({ targets: blur, strength: 0, duration: 900, ease: 'Sine.Out' });
            await wait(this, 900);
            label.setText(`✨ ${STORY.ui.translate}`);
        }

        this.translated = !this.translated;
        this.busy = false;
    }
}

/** Shrinks a text's font until it fits the given height, so any message length works. */
function fitText (text: GameObjects.Text, maxHeight: number)
{
    let size = parseInt(String(text.style.fontSize), 10);
    while (text.height > maxHeight && size > 28)
    {
        size -= 2;
        text.setFontSize(size);
    }
}
