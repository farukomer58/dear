import { GameObjects, Input, Scene, Time } from 'phaser';
import { STORY } from '../config/story';
import { COLORS, GAME_HEIGHT, GAME_WIDTH, chalkStyle, textStyle } from '../config/theme';
import { progress } from '../systems/progress';
import { sfx } from '../systems/sfx';
import {
    addAsset, confetti, createButton, createMuteButton, createOverlay, createPanel, createPill, enterScene, goTo, speechBubble, typeText
} from '../ui/widgets';

type Image = GameObjects.Image;

/** Where characters stand. Tweak these if you swap in art with different proportions. */
const TEACHER_SPOT = { x: 820, y: 1210 };
const STUDENT_SPOTS = [
    { x: 200, y: 1530, key: 'student-1', scale: 1 },
    { x: 540, y: 1530, key: 'student-2', scale: 1 },
    { x: 880, y: 1530, key: 'student-3', scale: 1 },
    { x: 200, y: 1810, key: 'student-2', scale: 1.12 },
    { x: 540, y: 1810, key: 'student-3', scale: 1.12 },
    { x: 880, y: 1810, key: 'student-1', scale: 1.12 }
] as const;
/** Order in which students answer (indexes into STUDENT_SPOTS). */
const SPEAKERS = [0, 4, 2, 3, 5, 1];

/** Reminder that UNLOCK_ALL_FOR_TESTING is on (see story.ts). */
export function addTestBadge (scene: Scene)
{
    scene.add.text(200, 150, STORY.ui.testBadge, textStyle(32, {
        fontStyle: '700', color: '#ffffff', backgroundColor: COLORS.danger, padding: { x: 14, y: 4 }
    })).setOrigin(0.5).setDepth(50);
}

/** Draws the classroom with idle-animated teacher and students. Also used by the Title scene. */
export function buildClassroom (scene: Scene)
{
    addAsset(scene, GAME_WIDTH / 2, GAME_HEIGHT / 2, 'classroom');

    const teacher = addAsset(scene, TEACHER_SPOT.x, TEACHER_SPOT.y, 'teacher').setOrigin(0.5, 1);
    scene.tweens.add({ targets: teacher, scaleY: teacher.scaleY * 1.015, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.InOut' });

    const students = STUDENT_SPOTS.map((spot, i) =>
    {
        const student = addAsset(scene, spot.x, spot.y, spot.key).setOrigin(0.5, 1);
        student.setScale(student.scaleX * spot.scale, student.scaleY * spot.scale);
        scene.tweens.add({ targets: student, y: spot.y - 6, duration: 900 + i * 130, delay: i * 120, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
        return student;
    });

    return { teacher, students };
}

/**
 * The hub between challenges: the teacher asks the class, the students fail,
 * the teacher takes the challenge herself. After a win it celebrates first.
 */
export class Classroom extends Scene
{
    private teacher: Image;
    private students: Image[];
    private boardTitle: GameObjects.Text;
    private boardText: GameObjects.Text;
    private hint: GameObjects.Text;
    private celebrate = false;
    private lessonPill: GameObjects.Container;
    private lessonMenu?: GameObjects.Container;

    constructor ()
    {
        super('Classroom');
    }

    init (data: { celebrate?: boolean })
    {
        this.celebrate = Boolean(data?.celebrate);
        this.lessonMenu = undefined;
    }

    create ()
    {
        enterScene(this);
        ({ teacher: this.teacher, students: this.students } = buildClassroom(this));

        this.boardTitle = this.add.text(GAME_WIDTH / 2, 340, '', chalkStyle(76, { color: COLORS.accent })).setOrigin(0.5);
        this.boardText = this.add.text(GAME_WIDTH / 2, 420, '', chalkStyle(62, {
            wordWrap: { width: 820, useAdvancedWrap: true }
        })).setOrigin(0.5, 0);

        this.hint = this.add.text(GAME_WIDTH / 2, 1880, STORY.ui.tapToContinue, textStyle(36, {
            color: COLORS.paper, stroke: COLORS.ink, strokeThickness: 6
        })).setOrigin(0.5).setAlpha(0).setDepth(30);

        this.buildHud();
        void this.run();
    }

    private buildHud ()
    {
        // The final lesson counts as the last level
        const total = STORY.levels.length + 1;
        const { pill, text } = createPill(this, 200, 80, 340);
        text.setText(`${STORY.ui.lessonCounter(progress.levelIndex + 1, total)}  ▾`).setFontSize(42);
        // Tapping the counter opens the lesson list; hit area is taller than the pill for thumbs
        this.lessonPill = pill;
        pill.setSize(340, 120).setInteractive({ useHandCursor: true }).on('pointerup', () =>
        {
            sfx.tap();
            this.openLessonMenu();
        });

        // One clue slot per level: bright once its poem word has been earned
        const count = STORY.levels.length;
        const spacing = Math.min(90, 500 / count);
        const size = Math.min(74, spacing - 6);
        STORY.levels.forEach((_, i) =>
        {
            addAsset(this, 420 + i * spacing, 80, 'clue')
                .setDisplaySize(size, size)
                .setAlpha(progress.earnedClue(i) ? 1 : 0.25);
        });

        createMuteButton(this, GAME_WIDTH - 80, 80);
        if (progress.testUnlock) addTestBadge(this);
    }

    /** Finished lessons get a tick and a replay button; later ones stay locked. */
    private openLessonMenu ()
    {
        if (this.lessonMenu) return;

        const levels = STORY.levels;
        const rowH = 140;
        const rowCount = levels.length + 1 + (progress.testUnlock ? 1 : 0);
        const h = 180 + rowCount * rowH;
        const overlay = createOverlay(this).setDepth(90);
        const panel = createPanel(this, GAME_WIDTH / 2, GAME_HEIGHT / 2, 900, h).setDepth(91);
        const close = () =>
        {
            overlay.destroy();
            panel.destroy();
            this.lessonMenu = undefined;
        };
        overlay.on('pointerup', close);
        panel.setSize(900, h).setInteractive(); // taps on the card itself shouldn't close it
        this.lessonMenu = panel;

        panel.add([
            this.add.text(0, -h / 2 + 100, STORY.ui.lessonsTitle, textStyle(68, { fontStyle: '700' })).setOrigin(0.5),
            createButton(this, 370, -h / 2 + 100, '✕', close, {
                width: 110, height: 110, radius: 55, fontSize: 50, color: '#efe4cc', shade: '#d8ccb4', textColor: COLORS.ink
            })
        ]);

        const addRow = (i: number, title: string, clue: string | undefined, onReplay?: () => void) =>
        {
            const y = -h / 2 + 230 + i * rowH;
            // The final lesson (last row) counts as done once the poem was completed
            const done = i < progress.levelIndex || (i === levels.length && progress.finished);
            const current = !done && i === progress.levelIndex;
            const icon = done ? '✓' : current ? '•' : progress.testUnlock ? '🔓' : '🔒';

            const titleText = this.add.text(-300, clue ? y - 22 : y, `${i + 1}. ${title}`, textStyle(46, { color: done || current ? COLORS.ink : COLORS.inkSoft }))
                .setOrigin(0, 0.5).setAlpha(done || current ? 1 : 0.55);
            // Long titles shrink to stay clear of the replay button
            if (titleText.width > 560) titleText.setScale(560 / titleText.width);
            panel.add([
                this.add.text(-370, y, icon, textStyle(56, { fontStyle: '700', color: done ? COLORS.success : COLORS.inkSoft })).setOrigin(0.5),
                titleText
            ]);
            if (clue)
            {
                panel.add(this.add.text(-300, y + 30, `🔑 ${clue}`, textStyle(36, { color: COLORS.primaryDark })).setOrigin(0, 0.5));
            }
            if (onReplay)
            {
                panel.add(createButton(this, 350, y, done ? '↻' : '▶', onReplay, {
                    width: 130, height: 110, radius: 40, fontSize: 56,
                    color: COLORS.secondary, shade: COLORS.secondaryDark
                }));
            }
        };

        levels.forEach((level, i) =>
        {
            addRow(i, level.title, progress.earnedClue(i), progress.canPlay(i) ? () => goTo(this, level.scene, { levelIndex: i }) : undefined);
        });
        addRow(levels.length, STORY.finale.boardTitle, undefined, progress.finaleOpen ? () => goTo(this, 'Finale') : undefined);
        if (progress.testUnlock) addRow(levels.length + 1, STORY.ui.surpriseButton, undefined, () => goTo(this, 'Surprise'));

        panel.setScale(0.9).setAlpha(0);
        this.tweens.add({ targets: panel, scale: 1, alpha: 1, duration: 220, ease: 'Back.Out' });
    }

    private async run ()
    {
        if (this.celebrate) await this.playCelebration();

        if (progress.finished) this.showAction(STORY.ui.lastPage, () => goTo(this, 'Surprise'));
        else if (progress.allLevelsDone) await this.playFinaleIntro();
        else await this.playLesson(progress.levelIndex);
    }

    private async playLesson (index: number)
    {
        const level = STORY.levels[index];
        await typeText(this, this.boardTitle, STORY.ui.lessonBoardTitle(index + 1, level.title), 40);
        await typeText(this, this.boardText, level.question, 28);

        await this.say(this.teacher, STORY.classroom.ask);
        for (const [i, reply] of level.studentReplies.entries())
        {
            await this.say(this.students[SPEAKERS[i % SPEAKERS.length]], reply);
        }
        await this.say(this.teacher, level.teacherReply);

        this.showAction(STORY.ui.takeChallenge, () => goTo(this, level.scene, { levelIndex: index }));
    }

    private async playCelebration ()
    {
        confetti(this);
        this.boardTitle.setText(STORY.ui.wellDone);
        const cheers = [...STORY.classroom.cheers].sort(() => Math.random() - 0.5);
        await this.say(this.students[SPEAKERS[0]], cheers[0]);
        await this.say(this.students[SPEAKERS[1]], cheers[1]);
        if (!progress.allLevelsDone) await this.say(this.teacher, STORY.classroom.afterWin);
        this.boardTitle.setText('');
    }

    private async playFinaleIntro ()
    {
        const { finale } = STORY;
        await typeText(this, this.boardTitle, finale.boardTitle, 40);
        await typeText(this, this.boardText, finale.boardText, 28);
        await this.say(this.teacher, finale.teacherLine);
        this.showAction(STORY.ui.openFinale, () => goTo(this, 'Finale'));
    }

    /** Shows a speech bubble and waits until it has been read (or the player taps). */
    private async say (speaker: Image, message: string)
    {
        const isTeacher = speaker === this.teacher;
        const top = speaker.y - speaker.displayHeight;
        const bubble = isTeacher
            ? speechBubble(this, 340, 920, message, { x: speaker.x - 80, y: top + 160 })
            : speechBubble(this, speaker.x, top - 110, message, { x: speaker.x, y: top + 10 }, 480);

        this.tweens.add({ targets: speaker, angle: { from: -3, to: 3 }, duration: 110, yoyo: true, repeat: 2, onComplete: () => speaker.setAngle(0) });
        this.hint.setAlpha(0.85);

        await this.waitOrTap(Math.max(1600, message.length * 60));

        this.tweens.add({ targets: bubble, alpha: 0, scale: 0.8, duration: 150, onComplete: () => bubble.destroy() });
    }

    /** Resolves after `ms` or on a tap. Both are held back while the lesson list is open. */
    private waitOrTap (ms: number)
    {
        return new Promise<void>(resolve =>
        {
            let timer: Time.TimerEvent;
            const finish = () =>
            {
                timer.remove();
                this.input.off('pointerdown', onTap);
                resolve();
            };
            const onTimer = () =>
            {
                if (this.lessonMenu) timer = this.time.delayedCall(300, onTimer);
                else finish();
            };
            const onTap = (_pointer: Input.Pointer, over: GameObjects.GameObject[]) =>
            {
                if (!this.lessonMenu && !over.includes(this.lessonPill)) finish();
            };
            timer = this.time.delayedCall(ms, onTimer);
            // Short delay so the tap that closed the previous bubble doesn't also skip this one
            this.time.delayedCall(150, () => this.input.on('pointerdown', onTap));
        });
    }

    private showAction (label: string, onClick: () => void)
    {
        this.hint.setAlpha(0);
        const button = createButton(this, GAME_WIDTH / 2, 1760, label, onClick, { width: 760 }).setDepth(40).setScale(0);
        this.tweens.add({ targets: button, scale: 1, duration: 300, ease: 'Back.Out' });
        this.tweens.add({ targets: button, scale: 1.04, duration: 700, delay: 300, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    }
}
