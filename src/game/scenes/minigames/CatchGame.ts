import { GameObjects, Input, Math as PMath, Types } from 'phaser';
import type { AssetKey } from '../../config/assets';
import { STORY } from '../../config/story';
import { COLORS, GAME_HEIGHT, GAME_WIDTH, chalkStyle } from '../../config/theme';
import { sfx, vibrate } from '../../systems/sfx';
import { addAsset, floatText } from '../../ui/widgets';
import { BaseMinigame, PLAY_AREA } from './BaseMinigame';

export interface CatchItem
{
    texture: AssetKey;
    /** Shown under the falling item so the player knows what it is. */
    label: string;
    /** true = catch it, false = let it fall. */
    good: boolean;
}

export interface CatchSettings
{
    /** Good items to catch to win. */
    goal: number;
    /** Bad catches allowed before losing. */
    lives: number;
    items: CatchItem[];
    spawnEveryMs: number;
    /** Fall speed range in px/second (speeds up slightly as you score). */
    fallSpeed: [number, number];
}

interface Falling
{
    sprite: GameObjects.Container;
    speed: number;
    item: CatchItem;
}

const BUCKET_Y = GAME_HEIGHT - 230;
const BUCKET_SPEED_KEYS = 1400;

/** Drag the bucket left/right: catch the good things, avoid the bad ones. */
export class CatchGame extends BaseMinigame<CatchSettings>
{
    private bucket: GameObjects.Image;
    private bucketScale: number;
    private targetX: number;
    private falling: Falling[];
    private score: number;
    private lives: number;
    private cursors?: Types.Input.Keyboard.CursorKeys;

    constructor ()
    {
        super('CatchGame');
    }

    protected setupGame ()
    {
        this.falling = [];
        this.score = 0;
        this.lives = this.settings.lives;
        this.targetX = GAME_WIDTH / 2;

        this.bucket = addAsset(this, GAME_WIDTH / 2, BUCKET_Y, 'bucket').setDepth(5);
        this.bucketScale = this.bucket.scaleX;
        this.cursors = this.input.keyboard?.createCursorKeys();

        // Follow the finger anywhere on screen (much easier than grabbing the bucket on a phone)
        const follow = (pointer: Input.Pointer) => { if (this.isPlaying && pointer.isDown) this.targetX = pointer.x; };
        this.input.on('pointerdown', follow);
        this.input.on('pointermove', follow);

        this.updateHud();
    }

    protected startGame ()
    {
        this.time.addEvent({ delay: this.settings.spawnEveryMs, loop: true, callback: () => this.spawnItem() });
        this.spawnItem();
    }

    private updateHud ()
    {
        const hearts = '❤'.repeat(Math.max(0, this.lives)) + '♡'.repeat(Math.max(0, this.settings.lives - this.lives));
        this.setLeftPill(hearts);
        this.setRightPill(`${this.score} / ${this.settings.goal}`);
    }

    private spawnItem ()
    {
        const { items, fallSpeed } = this.settings;
        // Slightly favour good items so the round doesn't drag on
        const wantGood = Math.random() < 0.6;
        const pool = items.filter(i => i.good === wantGood);
        const item = PMath.RND.pick(pool.length ? pool : items);

        const difficulty = 1 + this.score * 0.04;
        const speed = PMath.Between(fallSpeed[0], fallSpeed[1]) * difficulty;

        const x = PMath.Between(PLAY_AREA.left + 40, PLAY_AREA.right - 40);
        const sprite = this.add.container(x, PLAY_AREA.top - 60, [
            addAsset(this, 0, 0, item.texture),
            this.add.text(0, 85, item.label, chalkStyle(38, { stroke: COLORS.board, strokeThickness: 6 })).setOrigin(0.5)
        ]).setAlpha(0);
        this.tweens.add({ targets: sprite, alpha: 1, duration: 200 });
        this.falling.push({ sprite, speed, item });
    }

    update (_time: number, delta: number)
    {
        if (!this.isPlaying) return;
        const dt = delta / 1000;

        if (this.cursors?.left.isDown) this.targetX -= BUCKET_SPEED_KEYS * dt;
        if (this.cursors?.right.isDown) this.targetX += BUCKET_SPEED_KEYS * dt;
        this.targetX = PMath.Clamp(this.targetX, 150, GAME_WIDTH - 150);
        this.bucket.x += (this.targetX - this.bucket.x) * Math.min(1, dt * 18);

        for (const f of [...this.falling])
        {
            f.sprite.y += f.speed * dt;
            f.sprite.angle = Math.sin(f.sprite.y / 60) * 8;

            const inBucket = f.sprite.y > BUCKET_Y - 120 && f.sprite.y < BUCKET_Y - 20
                && Math.abs(f.sprite.x - this.bucket.x) < 130;

            if (inBucket) this.onCatch(f);
            else if (f.sprite.y > GAME_HEIGHT + 100) this.remove(f);
        }
    }

    private remove (f: Falling)
    {
        this.falling.splice(this.falling.indexOf(f), 1);
        f.sprite.destroy();
    }

    private onCatch (f: Falling)
    {
        const { x, y } = f.sprite;
        this.remove(f);
        this.tweens.add({ targets: this.bucket, scaleY: this.bucketScale * 0.88, duration: 80, yoyo: true });

        if (f.item.good)
        {
            this.score++;
            sfx.good();
            vibrate(15);
            floatText(this, x, y - 40, `+1 ${f.item.label}`, COLORS.success, 48);
            this.updateHud();
            if (this.score >= this.settings.goal) this.win();
        }
        else
        {
            this.lives--;
            sfx.bad();
            vibrate(120);
            this.cameras.main.shake(180, 0.006);
            floatText(this, x, y - 40, STORY.ui.catchNo(f.item.label), COLORS.danger, 48);
            this.updateHud();
            if (this.lives <= 0) this.lose(STORY.ui.catchLost);
        }
    }
}
