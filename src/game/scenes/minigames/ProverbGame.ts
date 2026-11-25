import { GameObjects, Utils } from 'phaser';
import { STORY } from '../../config/story';
import { COLORS, GAME_WIDTH, chalkStyle, toNum } from '../../config/theme';
import { trLower } from '../../systems/poem';
import { sfx, vibrate } from '../../systems/sfx';
import { addAsset, createButton, floatText } from '../../ui/widgets';
import { BaseMinigame } from './BaseMinigame';

export interface ProverbSettings
{
    /** The proverb, words separated by spaces. Compared without regard to case. */
    answer: string;
    /** Extra word chips that don't belong in the answer. */
    decoys: string[];
    /** Spoken when the 🗣️ is tapped. */
    soundHint: string;
    /** Revealed one at a time by the hint button. */
    hints: string[];
}

interface Slot
{
    label: GameObjects.Text;
    word?: string;
    chip?: GameObjects.Container;
}

const REBUS_Y = 500;
const SLOT_W = 225;
const SLOT_H = 100;
const SLOT_GAP = 15;
const CHIPS_TOP = 1330;

/**
 * Picture riddle: 1 + 🤝 + 🗣️ = "Bir elin nesi var, iki elin sesi var".
 * Tap word chips in order to fill the answer slots; tap a filled slot to take its word back.
 */
export class ProverbGame extends BaseMinigame<ProverbSettings>
{
    private slots: Slot[];
    private hintsUsed: number;
    private hintText: GameObjects.Text;
    private checking: boolean;

    constructor ()
    {
        super('ProverbGame');
    }

    protected setupGame ()
    {
        this.slots = [];
        this.hintsUsed = 0;
        this.checking = false;

        this.buildRebus();

        createButton(this, GAME_WIDTH / 2, 770, `💡 ${STORY.ui.proverbHintButton}`, () => this.showHint(), {
            width: 460, height: 110, fontSize: 48, color: COLORS.secondary, shade: COLORS.secondaryDark
        });
        this.hintText = this.add.text(GAME_WIDTH / 2, 890, '', chalkStyle(54, { color: COLORS.accent })).setOrigin(0.5);

        this.buildSlots();
        this.buildChips();

        this.setLeftPill(STORY.ui.proverbHints(this.settings.hints.length));
        this.updateCount();
    }

    protected startGame ()
    {
        // No timer: it's a riddle, take your time
    }

    private buildRebus ()
    {
        const plus = (x: number) => this.add.text(x, REBUS_Y, '+', chalkStyle(120)).setOrigin(0.5);

        this.add.text(170, REBUS_Y, '1', chalkStyle(220, { color: COLORS.accent })).setOrigin(0.5);
        plus(300);
        const hands = addAsset(this, 535, REBUS_Y, 'hands');
        plus(760);
        const speaker = addAsset(this, 905, REBUS_Y, 'speaker');

        const wiggle = (target: GameObjects.Image) =>
            this.tweens.add({ targets: target, angle: { from: -8, to: 8 }, duration: 80, yoyo: true, repeat: 2, onComplete: () => target.setAngle(0) });

        hands.setInteractive({ useHandCursor: true }).on('pointerdown', () =>
        {
            if (!this.isPlaying) return;
            wiggle(hands);
            sfx.tap();
        });
        speaker.setInteractive({ useHandCursor: true }).on('pointerdown', () =>
        {
            if (!this.isPlaying) return;
            wiggle(speaker);
            sfx.speak(this.settings.soundHint);
            floatText(this, speaker.x, speaker.y - 120, `🔊 ${this.settings.soundHint}`, COLORS.accent, 56);
        });
    }

    private buildSlots ()
    {
        const words = this.answerWords();
        const perRow = 4;
        words.forEach((_, i) =>
        {
            const row = Math.floor(i / perRow);
            const inRow = Math.min(perRow, words.length - row * perRow);
            const col = i % perRow;
            const x = GAME_WIDTH / 2 + (col - (inRow - 1) / 2) * (SLOT_W + SLOT_GAP);
            const y = 1030 + row * (SLOT_H + 30);

            this.add.graphics({ x, y })
                .fillStyle(0x000000, 0.2).fillRoundedRect(-SLOT_W / 2, -SLOT_H / 2, SLOT_W, SLOT_H, 20)
                .lineStyle(5, toNum(COLORS.chalkDim), 0.8).strokeRoundedRect(-SLOT_W / 2, -SLOT_H / 2, SLOT_W, SLOT_H, 20);
            const label = this.add.text(x, y, '', chalkStyle(52, { color: COLORS.chalk })).setOrigin(0.5);
            const slot: Slot = { label };
            this.add.zone(x, y, SLOT_W, SLOT_H + 20).setInteractive({ useHandCursor: true })
                .on('pointerdown', () => this.clearSlot(slot));
            this.slots.push(slot);
        });
    }

    private buildChips ()
    {
        const all = Utils.Array.Shuffle([...this.answerWords(), ...this.settings.decoys]);
        const gap = 22;
        const chips = all.map(word =>
        {
            const width = Math.max(170, [...word].length * 30 + 80);
            const chip = createButton(this, 0, 0, word, () => this.placeWord(word, chip), {
                width, height: 110, fontSize: 50, color: COLORS.paper, shade: '#d8ccb4', textColor: COLORS.ink
            });
            return { chip, width };
        });

        // Centred rows
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
            y += 145;
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

    private answerWords ()
    {
        return this.settings.answer.split(/\s+/).filter(Boolean);
    }

    private updateCount ()
    {
        this.setRightPill(`${this.slots.filter(s => s.word).length} / ${this.slots.length}`);
    }

    private showHint ()
    {
        if (!this.isPlaying || this.hintsUsed >= this.settings.hints.length) return;
        this.hintText.setText(this.settings.hints[this.hintsUsed]).setScale(0.6);
        this.tweens.add({ targets: this.hintText, scale: 1, duration: 250, ease: 'Back.Out' });
        this.hintsUsed++;
        this.setLeftPill(STORY.ui.proverbHints(this.settings.hints.length - this.hintsUsed));
    }

    private placeWord (word: string, chip: GameObjects.Container)
    {
        if (!this.isPlaying || this.checking) return;
        const slot = this.slots.find(s => !s.word);
        if (!slot) return;

        slot.word = word;
        slot.chip = chip;
        slot.label.setText(word).setScale(0.5);
        if (slot.label.width > SLOT_W - 20) slot.label.setFontSize(40);
        this.tweens.add({ targets: slot.label, scale: 1, duration: 200, ease: 'Back.Out' });
        chip.setVisible(false).disableInteractive();
        this.updateCount();

        if (this.slots.every(s => s.word)) this.checkAnswer();
    }

    private clearSlot (slot: Slot)
    {
        if (!this.isPlaying || this.checking || !slot.word) return;
        slot.chip?.setVisible(true).setInteractive();
        slot.word = undefined;
        slot.chip = undefined;
        slot.label.setText('').setFontSize(52);
        this.updateCount();
    }

    private checkAnswer ()
    {
        const words = this.answerWords().map(trLower);
        if (this.slots.every((s, i) => trLower(s.word ?? '') === words[i]))
        {
            this.time.delayedCall(300, () => this.win());
            return;
        }

        this.checking = true;
        sfx.bad();
        vibrate(150);
        this.cameras.main.shake(250, 0.01);
        floatText(this, GAME_WIDTH / 2, 1000, STORY.ui.proverbWrong, COLORS.danger, 60);
        this.time.delayedCall(700, () =>
        {
            this.checking = false;
            this.slots.forEach(s => this.clearSlot(s));
        });
    }
}
