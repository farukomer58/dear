import { GameObjects, Utils } from 'phaser';
import { STORY } from '../../config/story';
import { COLORS, GAME_WIDTH, chalkStyle, textStyle, toNum } from '../../config/theme';
import { sfx, vibrate } from '../../systems/sfx';
import { burst, createButton, createPanel } from '../../ui/widgets';
import { BaseMinigame } from './BaseMinigame';

export interface QuizQuestion
{
    q: string;
    /** Exactly 4 options work best (the layout has room for 4). */
    options: string[];
    /** Index of the right option in `options`. */
    answer: number;
}

export interface QuizSettings
{
    /** Questions asked per round, picked at random from `questions`. */
    questionCount: number;
    /** Correct answers needed to win. The round ends early once it's reached or out of reach. */
    correctToWin: number;
    secondsPerQuestion: number;
    questions: QuizQuestion[];
}

const ANSWER_TOP = 1000;
const ANSWER_STEP = 190;
const ANSWER_W = 900;
const ANSWER_H = 150;

/** Multiple choice with a timer per question. */
export class QuizGame extends BaseMinigame<QuizSettings>
{
    private round: QuizQuestion[];
    private current: number;
    private correct: number;
    private wrong: number;
    private answered: boolean;
    private counter: GameObjects.Text;
    private questionText: GameObjects.Text;
    private answerObjects: GameObjects.GameObject[];

    constructor ()
    {
        super('QuizGame');
    }

    protected setupGame ()
    {
        const { questions, questionCount } = this.settings;
        this.round = Utils.Array.Shuffle([...questions]).slice(0, questionCount);
        this.current = 0;
        this.correct = 0;
        this.wrong = 0;
        this.answered = true;
        this.answerObjects = [];

        this.counter = this.add.text(GAME_WIDTH / 2, 370, '', chalkStyle(52, { color: COLORS.accent })).setOrigin(0.5);
        createPanel(this, GAME_WIDTH / 2, 640, 960, 380);
        this.questionText = this.add.text(GAME_WIDTH / 2, 640, '', textStyle(62, {
            fontStyle: '700', wordWrap: { width: 860, useAdvancedWrap: true }
        })).setOrigin(0.5);

        this.setLeftPill(`⏱ ${this.settings.secondsPerQuestion}`);
        this.setRightPill(STORY.ui.quizCounter(0, this.settings.correctToWin));
        this.showQuestion();
    }

    protected startGame ()
    {
        this.answered = false;
        this.startTimer(this.settings.secondsPerQuestion);
    }

    private showQuestion ()
    {
        const question = this.round[this.current];
        this.counter.setText(STORY.ui.quizQuestion(this.current + 1, this.round.length));
        this.questionText.setText(question.q);
        // Long questions shrink to fit the card
        this.questionText.setFontSize(62);
        for (let size = 62; this.questionText.height > 320 && size > 36; size -= 4) this.questionText.setFontSize(size);

        for (const obj of this.answerObjects) obj.destroy();
        this.answerObjects = [];

        const options = Utils.Array.Shuffle(question.options.map((text, i) => ({ text, correct: i === question.answer })));
        options.forEach((option, i) =>
        {
            const y = ANSWER_TOP + i * ANSWER_STEP;
            const button = createButton(this, GAME_WIDTH / 2, y, option.text, () => this.onAnswer(option.correct, y), {
                width: ANSWER_W, height: ANSWER_H, fontSize: 56,
                color: COLORS.secondary, shade: COLORS.secondaryDark
            }).setAlpha(0);
            button.setData('correct', option.correct).setData('y', y);
            this.tweens.add({ targets: button, alpha: 1, duration: 200, delay: i * 60 });
            this.answerObjects.push(button);
        });
    }

    protected onTimeUp ()
    {
        this.onAnswer(false);
    }

    /** `y` is the tapped button, undefined when the time ran out. */
    private onAnswer (isCorrect: boolean, y?: number)
    {
        if (!this.isPlaying || this.answered) return;
        this.answered = true;
        this.stopTimer();

        // Mark the right answer green, and the tapped wrong one red
        for (const obj of [...this.answerObjects])
        {
            const button = obj as GameObjects.Container;
            const by = button.getData('y') as number;
            if (button.getData('correct')) this.markAnswer(by, COLORS.success, '✓');
            else if (by === y) this.markAnswer(by, COLORS.danger, '✗');
        }

        if (isCorrect)
        {
            this.correct++;
            sfx.good();
            vibrate(20);
            burst(this, GAME_WIDTH / 2, y ?? 0, COLORS.success, 10);
        }
        else
        {
            this.wrong++;
            sfx.bad();
            vibrate(120);
        }
        this.setRightPill(STORY.ui.quizCounter(this.correct, this.settings.correctToWin));

        this.time.delayedCall(1300, () =>
        {
            if (!this.isPlaying) return;
            if (this.correct >= this.settings.correctToWin) return this.win();
            if (this.wrong > this.round.length - this.settings.correctToWin) return this.lose(STORY.ui.quizLost);

            this.current++;
            this.showQuestion();
            this.answered = false;
            this.startTimer(this.settings.secondsPerQuestion);
        });
    }

    private markAnswer (y: number, color: string, icon: string)
    {
        const g = this.add.graphics();
        g.lineStyle(10, toNum(color), 1).strokeRoundedRect(GAME_WIDTH / 2 - ANSWER_W / 2 - 8, y - ANSWER_H / 2 - 8, ANSWER_W + 16, ANSWER_H + 28, 46);
        const mark = this.add.text(GAME_WIDTH / 2 + ANSWER_W / 2 - 60, y, icon, textStyle(70, {
            fontStyle: '700', color: '#ffffff', stroke: color, strokeThickness: 12
        })).setOrigin(0.5);
        this.answerObjects.push(g, mark);
    }
}
