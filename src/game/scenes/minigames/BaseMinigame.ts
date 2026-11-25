import { GameObjects, Scene, Time } from 'phaser';
import { STORY, type LevelDef } from '../../config/story';
import { COLORS, GAME_HEIGHT, GAME_WIDTH, chalkStyle, textStyle } from '../../config/theme';
import { progress } from '../../systems/progress';
import { sfx, vibrate } from '../../systems/sfx';
import {
    addAsset, confetti, createButton, createIconButton, createOverlay, createPanel, createPill, enterScene, goTo
} from '../../ui/widgets';

export interface MinigameData
{
    levelIndex: number;
}

/** Play area below the HUD, for subclasses that place things at random positions. */
export const PLAY_AREA = { top: 330, bottom: GAME_HEIGHT - 120, left: 100, right: GAME_WIDTH - 100 };

/**
 * Shared shell for every challenge: background, HUD, intro card, countdown, timer and
 * win/lose screens. Winning awards the level's clue word (see systems/progress.ts).
 *
 * To create a new challenge, extend this class and implement:
 *   - setupGame(): build the board (called once per attempt, before the intro card)
 *   - startGame(): start the action (after the countdown)
 * then call `this.win()` and `this.lose(reason)` from your logic.
 * Check `this.isPlaying` in input handlers / update() so nothing happens after the end.
 *
 * Note: Phaser reuses the scene instance on retry, so reset all state in setupGame(),
 * not in field initialisers.
 */
export abstract class BaseMinigame<TSettings> extends Scene
{
    protected level: LevelDef;
    protected settings: TSettings;
    protected isPlaying = false;

    private levelIndex = 0;
    private leftPill: GameObjects.Text;
    private rightPill: GameObjects.Text;
    private secondsLeft = 0;
    private timer?: Time.TimerEvent;

    protected abstract setupGame (): void;
    protected abstract startGame (): void;

    init (data: MinigameData)
    {
        this.levelIndex = data?.levelIndex ?? 0;
        this.level = STORY.levels[this.levelIndex];
        this.settings = this.level.settings as TSettings;
        this.isPlaying = false;
        this.timer = undefined;
    }

    create ()
    {
        enterScene(this);
        addAsset(this, GAME_WIDTH / 2, GAME_HEIGHT / 2, this.level.background ?? 'board-bg');
        this.buildHud();
        this.setupGame();
        this.showIntro();
    }

    // -----------------------------------------------------------------------
    // HUD
    // -----------------------------------------------------------------------

    private buildHud ()
    {
        createIconButton(this, 100, 100, '✕', () => goTo(this, 'Classroom'));
        const title = this.add.text(GAME_WIDTH / 2, 100, this.level.title, chalkStyle(76)).setOrigin(0.5);
        // Long titles shrink to stay clear of the close button
        if (title.width > 760) title.setScale(760 / title.width);
        this.leftPill = createPill(this, 240, 230, 340).text;
        this.rightPill = createPill(this, GAME_WIDTH - 240, 230, 340).text;
    }

    protected setLeftPill (text: string) { this.leftPill.setText(text); }
    protected setRightPill (text: string) { this.rightPill.setText(text); }

    /** Counts down in the left pill and calls onTimeUp() at zero. Calling it again restarts it. */
    protected startTimer (seconds: number)
    {
        this.stopTimer();
        this.secondsLeft = seconds;
        this.leftPill.setColor(COLORS.chalk);
        this.setLeftPill(`⏱ ${seconds}`);
        this.timer = this.time.addEvent({
            delay: 1000,
            loop: true,
            callback: () =>
            {
                if (!this.isPlaying) return;
                this.addSeconds(-1);
            }
        });
    }

    protected stopTimer ()
    {
        this.timer?.remove();
        this.timer = undefined;
    }

    /** Adds (or with a negative value, removes) time from a running timer, e.g. as a penalty. */
    protected addSeconds (delta: number)
    {
        if (!this.timer) return;
        this.secondsLeft = Math.max(0, this.secondsLeft + delta);
        this.setLeftPill(`⏱ ${this.secondsLeft}`);
        if (this.secondsLeft <= 5)
        {
            this.leftPill.setColor(COLORS.danger);
            this.tweens.add({ targets: this.leftPill, scale: 1.25, duration: 120, yoyo: true });
            sfx.flip();
        }
        if (this.secondsLeft <= 0)
        {
            this.stopTimer();
            this.onTimeUp();
        }
    }

    /** Override to change what happens when the timer runs out. */
    protected onTimeUp ()
    {
        this.lose(STORY.ui.timeUp);
    }

    // -----------------------------------------------------------------------
    // Intro & countdown
    // -----------------------------------------------------------------------

    private showIntro ()
    {
        const { ui } = STORY;
        const overlay = createOverlay(this).setDepth(90);
        const panel = createPanel(this, GAME_WIDTH / 2, GAME_HEIGHT / 2, 900, 900).setDepth(91);

        const known = progress.earnedClue(this.levelIndex);
        const clueLine = known ? ui.clueIntroKnown(known) : ui.clueIntroNew;

        const title = this.add.text(0, -330, this.level.title, textStyle(80, { fontStyle: '700' })).setOrigin(0.5);
        if (title.width > 800) title.setScale(800 / title.width);

        panel.add([
            title,
            this.add.text(0, -110, this.level.howToPlay, textStyle(50, {
                color: COLORS.inkSoft, wordWrap: { width: 760, useAdvancedWrap: true }
            })).setOrigin(0.5),
            this.add.text(0, 120, clueLine, textStyle(42, {
                color: COLORS.primaryDark, wordWrap: { width: 760, useAdvancedWrap: true }
            })).setOrigin(0.5),
            createButton(this, 0, 320, ui.startChallenge, () =>
            {
                overlay.destroy();
                panel.destroy();
                void this.countdown();
            })
        ]);

        panel.setScale(0.85).setAlpha(0);
        this.tweens.add({ targets: panel, scale: 1, alpha: 1, duration: 300, ease: 'Back.Out' });
    }

    private async countdown ()
    {
        for (const word of STORY.ui.countdown)
        {
            const text = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, word, chalkStyle(150, { color: COLORS.accent }))
                .setOrigin(0.5).setDepth(80).setScale(0.5);
            sfx.tap();
            await new Promise<void>(resolve => this.tweens.add({
                targets: text, scale: 1.2, alpha: { from: 1, to: 0 }, duration: 650, ease: 'Cubic.Out',
                onComplete: () => { text.destroy(); resolve(); }
            }));
        }
        this.isPlaying = true;
        this.startGame();
    }

    // -----------------------------------------------------------------------
    // Win, lose
    // -----------------------------------------------------------------------

    protected win ()
    {
        if (!this.endGame()) return;
        progress.completeLevel(this.levelIndex);
        sfx.win();
        confetti(this);

        const word = progress.earnedClue(this.levelIndex);
        this.showResult(STORY.ui.winTitle, word ? STORY.ui.winMessage(word) : '', [
            [STORY.ui.continue, () => goTo(this, 'Classroom', { celebrate: true })]
        ]);
    }

    protected lose (reason: string)
    {
        if (!this.endGame()) return;
        sfx.lose();
        vibrate(200);
        this.cameras.main.shake(250, 0.008);
        this.showResult(reason, STORY.ui.loseMessage, [
            [STORY.ui.tryAgain, () => this.retry()],
            [STORY.ui.backToClass, () => goTo(this, 'Classroom')]
        ]);
    }

    /** Stops gameplay and all timers. Returns false if the game had already ended. */
    private endGame ()
    {
        if (!this.isPlaying) return false;
        this.isPlaying = false;
        this.timer = undefined;
        this.time.removeAllEvents();
        return true;
    }

    private retry ()
    {
        goTo(this, this.scene.key, { levelIndex: this.levelIndex });
    }

    private showResult (title: string, message: string, actions: [string, () => void][])
    {
        const overlay = createOverlay(this, 0).setDepth(100);
        this.tweens.add({ targets: overlay, fillAlpha: 0.65, duration: 300 });

        const h = 560 + actions.length * 180;
        const panel = createPanel(this, GAME_WIDTH / 2, GAME_HEIGHT / 2, 900, h).setDepth(101);
        panel.add([
            this.add.text(0, -h / 2 + 110, title, textStyle(76, { fontStyle: '700' })).setOrigin(0.5),
            this.add.text(0, -h / 2 + 300, message, textStyle(56, {
                color: COLORS.primaryDark, wordWrap: { width: 760, useAdvancedWrap: true }
            })).setOrigin(0.5)
        ]);

        actions.forEach(([label, onClick], i) =>
        {
            const secondary = i > 0;
            panel.add(createButton(this, 0, h / 2 - (actions.length - i) * 180 + 40, label, onClick, secondary
                ? { color: COLORS.secondary, shade: COLORS.secondaryDark, width: 560, height: 130, fontSize: 52 }
                : {}));
        });

        panel.setScale(0.85).setAlpha(0);
        this.tweens.add({ targets: panel, scale: 1, alpha: 1, duration: 350, delay: 200, ease: 'Back.Out' });
    }
}
