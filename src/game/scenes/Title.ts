import { Scene } from 'phaser';
import { STORY } from '../config/story';
import { COLORS, GAME_WIDTH, chalkStyle } from '../config/theme';
import { progress } from '../systems/progress';
import { createButton, createMuteButton, enterScene, goTo } from '../ui/widgets';
import { addTestBadge, buildClassroom } from './Classroom';

export class Title extends Scene
{
    constructor ()
    {
        super('Title');
    }

    create ()
    {
        enterScene(this);
        buildClassroom(this);

        const title = this.add.text(GAME_WIDTH / 2, 480, STORY.gameTitle, chalkStyle(128, { lineSpacing: -16 }))
            .setOrigin(0.5).setScale(0.8).setAlpha(0);
        this.tweens.add({ targets: title, scale: 1, alpha: 1, duration: 600, ease: 'Back.Out' });

        this.add.text(GAME_WIDTH / 2, 730, STORY.ui.subtitle(STORY.teacherName), chalkStyle(56, { color: COLORS.accent }))
            .setOrigin(0.5);

        if (progress.finished)
        {
            // Finished games stay unlocked: straight to the last page, or the classroom to replay lessons
            const last = createButton(this, GAME_WIDTH / 2, 1420, STORY.ui.lastPage, () => goTo(this, 'Surprise')).setDepth(40);
            this.tweens.add({ targets: last, scale: 1.05, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
            createButton(this, GAME_WIDTH / 2, 1600, STORY.ui.replayLessons, () => goTo(this, 'Classroom'), {
                width: 560, height: 130, fontSize: 52, color: COLORS.secondary, shade: COLORS.secondaryDark
            }).setDepth(40);
        }
        else if (progress.hasStarted)
        {
            createButton(this, GAME_WIDTH / 2, 1580, STORY.ui.continue, () => goTo(this, 'Classroom')).setDepth(40);
            createButton(this, GAME_WIDTH / 2, 1760, STORY.ui.startOver, () =>
            {
                progress.reset();
                goTo(this, 'Classroom');
            }, { width: 480, height: 120, fontSize: 48, color: COLORS.secondary, shade: COLORS.secondaryDark }).setDepth(40);
        }
        else
        {
            const start = createButton(this, GAME_WIDTH / 2, 1660, STORY.ui.start, () => goTo(this, 'Classroom')).setDepth(40);
            this.tweens.add({ targets: start, scale: 1.05, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
        }

        createMuteButton(this, GAME_WIDTH - 80, 80);
        if (progress.testUnlock) addTestBadge(this);
    }
}
