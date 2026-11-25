import { GameObjects, Utils } from 'phaser';
import type { AssetKey } from '../../config/assets';
import { GAME_WIDTH } from '../../config/theme';
import { sfx, vibrate } from '../../systems/sfx';
import { addAsset, burst } from '../../ui/widgets';
import { BaseMinigame, PLAY_AREA } from './BaseMinigame';

export interface MemorySettings
{
    /** Card faces (texture keys), one pair each. 8 faces with 4 columns gives a 4x4 grid. */
    faces: AssetKey[];
    columns: number;
    /** Seconds to find all pairs. */
    timeLimit: number;
}

interface Card
{
    face: AssetKey;
    container: GameObjects.Container;
    back: GameObjects.Image;
    front: GameObjects.Container;
    open: boolean;
    matched: boolean;
}

/** Classic pairs game: find every matching pair before the time runs out. */
export class MemoryGame extends BaseMinigame<MemorySettings>
{
    private cards: Card[];
    private picked: Card[];
    private matches: number;
    private totalPairs: number;

    constructor ()
    {
        super('MemoryGame');
    }

    protected setupGame ()
    {
        const faces: AssetKey[] = [...this.settings.faces];
        const deck = Utils.Array.Shuffle([...faces, ...faces]);
        this.cards = [];
        this.picked = [];
        this.matches = 0;
        this.totalPairs = faces.length;

        const { columns } = this.settings;
        const rows = Math.ceil(deck.length / columns);
        const gap = 24;
        const areaW = GAME_WIDTH - 120;
        const areaH = PLAY_AREA.bottom - PLAY_AREA.top - 40;
        const size = Math.min(230, (areaW - gap * (columns - 1)) / columns, (areaH - gap * (rows - 1)) / rows);
        const startX = GAME_WIDTH / 2 - ((columns - 1) * (size + gap)) / 2;
        const startY = (PLAY_AREA.top + PLAY_AREA.bottom) / 2 - ((rows - 1) * (size + gap)) / 2 + 20;

        deck.forEach((face, i) =>
        {
            const x = startX + (i % columns) * (size + gap);
            const y = startY + Math.floor(i / columns) * (size + gap);

            const back = addAsset(this, 0, 0, 'card-back').setDisplaySize(size, size);
            const front = this.add.container(0, 0, [
                addAsset(this, 0, 0, 'card-front').setDisplaySize(size, size),
                addAsset(this, 0, 0, face).setDisplaySize(size * 0.62, size * 0.62)
            ]).setVisible(false);

            const container = this.add.container(x, y, [back, front]).setSize(size, size).setScale(0);
            const card: Card = { face, container, back, front, open: false, matched: false };
            container.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.onCardTap(card));
            this.cards.push(card);

            this.tweens.add({ targets: container, scale: 1, duration: 250, delay: 300 + i * 30, ease: 'Back.Out' });
        });

        this.setRightPill(`0 / ${this.totalPairs}`);
        this.setLeftPill(`⏱ ${this.settings.timeLimit}`);
    }

    protected startGame ()
    {
        this.startTimer(this.settings.timeLimit);
    }

    private onCardTap (card: Card)
    {
        if (!this.isPlaying || card.open || card.matched || this.picked.length >= 2) return;

        this.flip(card, true);
        this.picked.push(card);
        if (this.picked.length < 2) return;

        const [a, b] = this.picked;
        if (a.face === b.face)
        {
            this.time.delayedCall(300, () => this.onMatch(a, b));
        }
        else
        {
            this.time.delayedCall(800, () =>
            {
                this.flip(a, false);
                this.flip(b, false);
                this.picked = [];
            });
        }
    }

    private onMatch (a: Card, b: Card)
    {
        this.picked = [];
        this.matches++;
        a.matched = b.matched = true;
        sfx.good();
        vibrate(20);
        this.setRightPill(`${this.matches} / ${this.totalPairs}`);

        for (const card of [a, b])
        {
            this.tweens.add({ targets: card.container, scale: 1.12, duration: 120, yoyo: true });
            burst(this, card.container.x, card.container.y, undefined, 6);
        }

        if (this.matches === this.totalPairs) this.time.delayedCall(500, () => this.win());
    }

    private flip (card: Card, open: boolean)
    {
        card.open = open;
        sfx.flip();
        this.tweens.chain({
            targets: card.container,
            tweens: [
                {
                    scaleX: 0, duration: 110, ease: 'Sine.In',
                    onComplete: () => { card.front.setVisible(open); card.back.setVisible(!open); }
                },
                { scaleX: 1, duration: 110, ease: 'Sine.Out' }
            ]
        });
    }
}
