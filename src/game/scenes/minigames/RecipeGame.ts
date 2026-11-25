import { GameObjects, Utils } from 'phaser';
import { STORY } from '../../config/story';
import { COLORS, FONTS, GAME_WIDTH, chalkStyle, textStyle, toNum } from '../../config/theme';
import { sfx, vibrate } from '../../systems/sfx';
import { burst, floatText } from '../../ui/widgets';
import { BaseMinigame } from './BaseMinigame';

export interface Dish
{
    name: string;
    emoji: string;
    /** Names from `ingredients`. Keep it to 2–5 so decoys still fit in the 3 x 3 grid. */
    ingredients: string[];
}

export interface RecipeSettings
{
    dishesToWin: number;
    /** Seconds for all dishes together. */
    timeLimit: number;
    /** Seconds lost for a wrong ingredient. */
    wrongPenalty: number;
    /** name -> emoji for every ingredient used by dishes or as decoy. */
    ingredients: Record<string, string>;
    dishes: Dish[];
}

interface Chip
{
    name: string;
    container: GameObjects.Container;
    bg: GameObjects.Graphics;
    done: boolean;
}

const GRID_TOP = 900;
const CHIP = 280;
const GAP = 30;

/** A dish appears; tap all of its ingredients in a 3 x 3 grid with decoys. */
export class RecipeGame extends BaseMinigame<RecipeSettings>
{
    private queue: Dish[];
    private dish: Dish;
    private dishIndex: number;
    private found: number;
    private chips: Chip[];
    private dishEmoji: GameObjects.Text;
    private dishName: GameObjects.Text;
    private dishProgress: GameObjects.Text;

    constructor ()
    {
        super('RecipeGame');
    }

    protected setupGame ()
    {
        const { dishes, dishesToWin } = this.settings;
        const shuffled = Utils.Array.Shuffle([...dishes]);
        this.queue = Array.from({ length: dishesToWin }, (_, i) => shuffled[i % shuffled.length]);
        this.dishIndex = 0;
        this.chips = [];

        this.dishEmoji = this.add.text(GAME_WIDTH / 2, 470, '', textStyle(170, { fontFamily: FONTS.emoji, padding: { x: 10, y: 20 } })).setOrigin(0.5);
        this.dishName = this.add.text(GAME_WIDTH / 2, 650, '', chalkStyle(80, { color: COLORS.accent })).setOrigin(0.5);
        this.dishProgress = this.add.text(GAME_WIDTH / 2, 750, '', chalkStyle(52)).setOrigin(0.5);

        this.showDish();
        this.setLeftPill(`⏱ ${this.settings.timeLimit}`);
    }

    protected startGame ()
    {
        this.startTimer(this.settings.timeLimit);
    }

    private showDish ()
    {
        const { ingredients } = this.settings;
        this.dish = this.queue[this.dishIndex];
        this.found = 0;
        this.setRightPill(STORY.ui.recipeCounter(this.dishIndex, this.queue.length));

        this.dishEmoji.setText(this.dish.emoji).setScale(0);
        this.tweens.add({ targets: this.dishEmoji, scale: 1, duration: 300, ease: 'Back.Out' });
        this.dishName.setText(this.dish.name);
        this.updateDishProgress();

        for (const chip of this.chips) chip.container.destroy();
        const decoys = Utils.Array.Shuffle(Object.keys(ingredients).filter(n => !this.dish.ingredients.includes(n)));
        const names = Utils.Array.Shuffle([...this.dish.ingredients, ...decoys].slice(0, 9));

        this.chips = names.map((name, i) =>
        {
            const x = GAME_WIDTH / 2 + ((i % 3) - 1) * (CHIP + GAP);
            const y = GRID_TOP + Math.floor(i / 3) * (CHIP + GAP) + CHIP / 2;
            const bg = this.add.graphics();
            const container = this.add.container(x, y, [
                bg,
                this.add.text(0, -30, ingredients[name] ?? '❓', textStyle(110, { fontFamily: FONTS.emoji, padding: { x: 6, y: 14 } })).setOrigin(0.5),
                this.add.text(0, 90, name, textStyle(40, { fontStyle: '700' })).setOrigin(0.5)
            ]).setSize(CHIP, CHIP).setScale(0);

            const chip: Chip = { name, container, bg, done: false };
            drawChip(chip, COLORS.paper);
            container.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.onPick(chip));
            this.tweens.add({ targets: container, scale: 1, duration: 220, delay: 100 + i * 35, ease: 'Back.Out' });
            return chip;
        });
    }

    private updateDishProgress ()
    {
        this.dishProgress.setText(`${'●'.repeat(this.found)}${'○'.repeat(this.dish.ingredients.length - this.found)}`);
    }

    private onPick (chip: Chip)
    {
        if (!this.isPlaying || chip.done) return;
        const { x, y } = chip.container;

        if (this.dish.ingredients.includes(chip.name))
        {
            chip.done = true;
            this.found++;
            drawChip(chip, '#c8f2d8');
            sfx.good();
            vibrate(15);
            burst(this, x, y, COLORS.success, 8);
            this.updateDishProgress();
            if (this.found === this.dish.ingredients.length) this.onDishDone();
            return;
        }

        sfx.bad();
        vibrate(100);
        drawChip(chip, '#ffd0d0');
        this.time.delayedCall(350, () => { if (!chip.done) drawChip(chip, COLORS.paper); });
        this.tweens.add({ targets: chip.container, x: { from: x - 14, to: x }, duration: 60, repeat: 2, yoyo: true, onComplete: () => chip.container.setX(x) });
        floatText(this, x, y - 100, `-${this.settings.wrongPenalty}`, COLORS.danger, 56);
        this.addSeconds(-this.settings.wrongPenalty);
    }

    private onDishDone ()
    {
        this.dishIndex++;
        this.setRightPill(STORY.ui.recipeCounter(this.dishIndex, this.queue.length));
        floatText(this, GAME_WIDTH / 2, 650, STORY.ui.recipeDone, COLORS.accent, 80);
        sfx.coin();

        if (this.dishIndex >= this.queue.length)
        {
            this.time.delayedCall(400, () => this.win());
            return;
        }
        for (const chip of this.chips) chip.container.disableInteractive();
        this.time.delayedCall(700, () => { if (this.isPlaying) this.showDish(); });
    }
}

function drawChip (chip: Chip, fill: string)
{
    const half = CHIP / 2;
    chip.bg.clear();
    chip.bg.fillStyle(0x000000, 0.25).fillRoundedRect(-half + 4, -half + 10, CHIP, CHIP, 36);
    chip.bg.fillStyle(toNum(fill), 1).fillRoundedRect(-half, -half, CHIP, CHIP, 36);
    if (chip.done) chip.bg.lineStyle(8, toNum(COLORS.success), 1).strokeRoundedRect(-half, -half, CHIP, CHIP, 36);
}
