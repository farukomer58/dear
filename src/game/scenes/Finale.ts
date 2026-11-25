import { GameObjects, Scene, Utils } from 'phaser';
import { STORY } from '../config/story';
import { COLORS, GAME_HEIGHT, GAME_WIDTH, chalkStyle, toNum } from '../config/theme';
import { poemTokens, trUpper, type PoemToken } from '../systems/poem';
import { progress } from '../systems/progress';
import { sfx, vibrate } from '../systems/sfx';
import { addAsset, burst, confetti, createButton, createIconButton, enterScene, goTo, typeText, wait } from '../ui/widgets';

interface Blank
{
    token: PoemToken;
    x: number;
    y: number;
    width: number;
    label: GameObjects.Text;
}

const POEM_TOP = 330;
const POEM_SIZE = 50;
const ROW_H = 84;
const MAX_ROW_W = GAME_WIDTH - 90;
const CHIPS_TOP = 1250;

/**
 * The final lesson: the poem from STORY.finale.poem with every earned clue word blanked out.
 * Tapping the right chip fills the next blank in reading order; then the poem is revealed
 * line by line and the "Sürpriz" button leads to the Surprise scene.
 */
export class Finale extends Scene
{
    private blanks: Blank[];
    private filled: number;
    private poemObjects: GameObjects.GameObject[];
    private marker: GameObjects.Graphics;

    constructor ()
    {
        super('Finale');
    }

    create ()
    {
        enterScene(this);
        this.blanks = [];
        this.filled = 0;
        this.poemObjects = [];

        addAsset(this, GAME_WIDTH / 2, GAME_HEIGHT / 2, 'board-bg');
        createIconButton(this, 100, 100, '✕', () => goTo(this, 'Classroom'));
        this.add.text(GAME_WIDTH / 2, 100, STORY.finale.boardTitle, chalkStyle(80, { color: COLORS.accent })).setOrigin(0.5);

        if (!progress.finaleOpen)
        {
            this.add.text(GAME_WIDTH / 2, 700, STORY.ui.finaleLocked, chalkStyle(62, {
                wordWrap: { width: 900, useAdvancedWrap: true }
            })).setOrigin(0.5);
            createButton(this, GAME_WIDTH / 2, 1000, STORY.ui.backToClass, () => goTo(this, 'Classroom'));
            return;
        }

        // Already finished once: show the completed poem and the surprise button straight away
        if (progress.finished)
        {
            void this.revealPoem(true);
            return;
        }

        const prompt = this.add.text(GAME_WIDTH / 2, 215, STORY.finale.prompt, chalkStyle(46, { color: COLORS.chalkDim })).setOrigin(0.5);
        this.poemObjects.push(prompt);
        this.layoutPoem();
        this.layoutChips();
        this.highlightNext();
    }

    // -----------------------------------------------------------------------
    // Poem with blanks
    // -----------------------------------------------------------------------

    /** Lays the poem out word by word so blanks can sit inline, wrapping long lines. */
    private layoutPoem ()
    {
        const blankIndexes = new Set(progress.earnedTokenIndexes());
        const style = chalkStyle(POEM_SIZE);
        const space = 16;

        type Item = { objects: { obj: GameObjects.Text | GameObjects.Graphics; dx: number; w: number }[]; width: number; blank?: Omit<Blank, 'x' | 'y'> & { dx: number } };
        const rows: Item[][] = [];
        let row: Item[] = [];
        let rowW = 0;
        let lastLine = 0;

        const newRow = () =>
        {
            if (row.length) rows.push(row);
            row = [];
            rowW = 0;
        };

        for (const token of poemTokens())
        {
            if (token.line !== lastLine)
            {
                newRow();
                rows.push([]); // empty row = small gap between poem lines
                lastLine = token.line;
            }

            const item: Item = { objects: [], width: 0 };
            if (blankIndexes.has(token.index))
            {
                const at = token.text.indexOf(token.word);
                const prefix = token.text.slice(0, at);
                const suffix = token.text.slice(at + token.word.length);
                const measure = this.add.text(0, 0, token.word, style);
                const boxW = Math.max(120, measure.width + 20);
                measure.destroy();

                let dx = 0;
                if (prefix)
                {
                    const t = this.add.text(0, 0, prefix, style).setOrigin(0, 0.5);
                    item.objects.push({ obj: t, dx, w: t.width });
                    dx += t.width;
                }
                const box = this.add.graphics();
                box.lineStyle(5, toNum(COLORS.chalkDim), 0.9).strokeRoundedRect(0, -34, boxW, 68, 16);
                item.objects.push({ obj: box, dx, w: boxW });
                const label = this.add.text(0, 0, '', chalkStyle(POEM_SIZE, { color: COLORS.accent })).setOrigin(0.5);
                item.blank = { token, width: boxW, label, dx };
                dx += boxW;
                if (suffix)
                {
                    const t = this.add.text(0, 0, suffix, style).setOrigin(0, 0.5);
                    item.objects.push({ obj: t, dx: dx - 6, w: t.width });
                    dx += t.width - 6;
                }
                item.width = dx;
            }
            else
            {
                const t = this.add.text(0, 0, token.text, style).setOrigin(0, 0.5);
                item.objects.push({ obj: t, dx: 0, w: t.width });
                item.width = t.width;
            }

            if (rowW + item.width > MAX_ROW_W) newRow();
            row.push(item);
            rowW += item.width + space;
        }
        newRow();

        // Position rows centred
        let y = POEM_TOP;
        for (const r of rows)
        {
            if (!r.length)
            {
                y += 24;
                continue;
            }
            const width = r.reduce((sum, item) => sum + item.width, 0) + space * (r.length - 1);
            let x = GAME_WIDTH / 2 - width / 2;
            for (const item of r)
            {
                for (const { obj, dx } of item.objects)
                {
                    obj.setPosition(x + dx, y);
                    this.poemObjects.push(obj);
                }
                if (item.blank)
                {
                    const { dx, ...blank } = item.blank;
                    const bx = x + dx + blank.width / 2;
                    blank.label.setPosition(bx, y);
                    this.poemObjects.push(blank.label);
                    this.blanks.push({ ...blank, x: bx, y });
                }
                x += item.width + space;
            }
            y += ROW_H;
        }

        this.blanks.sort((a, b) => a.token.index - b.token.index);
        this.marker = this.add.graphics();
        this.poemObjects.push(this.marker);
    }

    private highlightNext ()
    {
        this.tweens.killTweensOf(this.marker);
        this.marker.clear();
        const next = this.blanks[this.filled];
        if (!next) return;
        this.marker.fillStyle(toNum(COLORS.accent), 0.25).fillRoundedRect(next.x - next.width / 2, next.y - 34, next.width, 68, 16);
        this.marker.setAlpha(1);
        this.tweens.add({ targets: this.marker, alpha: 0.3, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    }

    // -----------------------------------------------------------------------
    // Word chips
    // -----------------------------------------------------------------------

    private layoutChips ()
    {
        const gap = 24;
        const words = Utils.Array.Shuffle(this.blanks.map(b => b.token.word));
        const chips = words.map(word =>
        {
            const width = Math.max(200, [...word].length * 34 + 90);
            const chip = createButton(this, 0, 0, word, () => this.onChip(word, chip), {
                width, height: 120, fontSize: 52, color: COLORS.secondary, shade: COLORS.secondaryDark
            });
            this.poemObjects.push(chip);
            return { chip, width };
        });

        let row: typeof chips = [];
        let rowWidth = 0;
        let y = CHIPS_TOP;
        const flush = () =>
        {
            let x = GAME_WIDTH / 2 - (rowWidth - gap) / 2;
            for (const c of row)
            {
                c.chip.setPosition(x + c.width / 2, y);
                x += c.width + gap;
            }
            y += 165;
            row = [];
            rowWidth = 0;
        };
        for (const c of chips)
        {
            if (rowWidth + c.width > GAME_WIDTH - 100) flush();
            row.push(c);
            rowWidth += c.width + gap;
        }
        flush();
    }

    private onChip (word: string, chip: GameObjects.Container)
    {
        const next = this.blanks[this.filled];
        if (!next) return;

        if (word !== next.token.word)
        {
            sfx.bad();
            vibrate(100);
            const x = chip.x;
            this.tweens.add({ targets: chip, x: { from: x - 18, to: x }, duration: 60, yoyo: true, repeat: 2, onComplete: () => chip.setX(x) });
            return;
        }

        sfx.good();
        vibrate(20);
        chip.setVisible(false).disableInteractive();
        next.label.setText(word).setScale(0.4);
        this.tweens.add({ targets: next.label, scale: 1, duration: 220, ease: 'Back.Out' });
        burst(this, next.x, next.y, COLORS.accent, 8);
        this.filled++;
        this.highlightNext();

        if (this.filled === this.blanks.length) void this.revealPoem();
    }

    // -----------------------------------------------------------------------
    // Reveal
    // -----------------------------------------------------------------------

    /** `instant` skips the effects, for revisits after the game was finished. */
    private async revealPoem (instant = false)
    {
        progress.markFinished();
        if (!instant)
        {
            sfx.secret();
            await wait(this, 900);
            this.tweens.add({ targets: this.poemObjects, alpha: 0, duration: 400 });
            await wait(this, 450);
            this.poemObjects.forEach(o => o.destroy());
        }

        // The full poem, one line at a time
        let y = 300;
        for (const line of STORY.finale.poem)
        {
            const text = this.add.text(GAME_WIDTH / 2, y, '', chalkStyle(58, {
                wordWrap: { width: GAME_WIDTH - 120, useAdvancedWrap: true }
            })).setOrigin(0.5, 0);
            if (instant) text.setText(line);
            else await typeText(this, text, line, 45);
            y += text.height + 30;
            if (!instant) await wait(this, 350);
        }

        const done = this.add.text(GAME_WIDTH / 2, Math.max(y + 140, 1300), trUpper(STORY.ui.chapterDone), chalkStyle(110, { color: COLORS.accent }))
            .setOrigin(0.5).setScale(0);
        this.tweens.add({ targets: done, scale: 1, duration: 500, ease: 'Back.Out' });
        if (!instant)
        {
            sfx.win();
            confetti(this, 120);
            await wait(this, 1200);
        }

        const surprise = createButton(this, GAME_WIDTH / 2, Math.max(y + 400, 1620), `🎁 ${STORY.ui.surpriseButton}`, () => goTo(this, 'Surprise'), {
            width: 560, color: COLORS.primary, shade: COLORS.primaryDark
        }).setScale(0);
        this.tweens.add({ targets: surprise, scale: 1, duration: 300, ease: 'Back.Out' });
        this.tweens.add({ targets: surprise, scale: 1.07, duration: 650, delay: 300, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    }
}
