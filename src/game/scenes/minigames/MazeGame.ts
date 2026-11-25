import { GameObjects, Input } from 'phaser';
import { STORY } from '../../config/story';
import { COLORS, GAME_WIDTH, toNum } from '../../config/theme';
import { sfx, vibrate } from '../../systems/sfx';
import { addAsset, burst } from '../../ui/widgets';
import { BaseMinigame, PLAY_AREA } from './BaseMinigame';

export interface MazeSettings
{
    /** Maze size in cells. Cells shrink to fit, keep them ≥ 100 px for fingers (8 x 12 fits well). */
    columns: number;
    rows: number;
    /** Seconds to reach the exit. */
    timeLimit: number;
}

/** Wall bits per cell. */
const N = 1, E = 2, S = 4, W = 8;
const DIRS = [
    { bit: N, dx: 0, dy: -1, opposite: S },
    { bit: E, dx: 1, dy: 0, opposite: W },
    { bit: S, dx: 0, dy: 1, opposite: N },
    { bit: W, dx: -1, dy: 0, opposite: E }
];

/** A new random maze every attempt. Drag anywhere to walk the heart one cell at a time. */
export class MazeGame extends BaseMinigame<MazeSettings>
{
    private walls: number[];
    private cell: number;
    private originX: number;
    private originY: number;
    private pos: { x: number; y: number };
    private heart: GameObjects.Image;
    private trail: GameObjects.Graphics;
    private anchor?: { x: number; y: number };

    constructor ()
    {
        super('MazeGame');
    }

    protected setupGame ()
    {
        const { columns, rows } = this.settings;
        this.walls = generateMaze(columns, rows);
        this.cell = Math.floor(Math.min((GAME_WIDTH - 120) / columns, (PLAY_AREA.bottom - PLAY_AREA.top - 40) / rows));
        this.originX = GAME_WIDTH / 2 - (columns * this.cell) / 2;
        this.originY = (PLAY_AREA.top + PLAY_AREA.bottom) / 2 - (rows * this.cell) / 2 + 20;
        this.pos = { x: 0, y: 0 };
        this.anchor = undefined;

        this.drawMaze();
        this.trail = this.add.graphics();

        const exit = this.cellCenter(columns - 1, rows - 1);
        const flag = addAsset(this, exit.x, exit.y, 'maze-exit').setDisplaySize(this.cell * 0.75, this.cell * 0.75);
        this.tweens.add({ targets: flag, angle: { from: -8, to: 8 }, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.InOut' });

        const start = this.cellCenter(0, 0);
        this.heart = addAsset(this, start.x, start.y, 'heart').setDisplaySize(this.cell * 0.7, this.cell * 0.7).setDepth(5);

        this.input.on('pointerdown', (p: Input.Pointer) => { this.anchor = { x: p.x, y: p.y }; });
        this.input.on('pointerup', () => { this.anchor = undefined; });
        this.input.on('pointermove', (p: Input.Pointer) => this.onDrag(p));
        this.input.keyboard?.on('keydown', (e: KeyboardEvent) =>
        {
            const dir = { ArrowUp: 0, ArrowRight: 1, ArrowDown: 2, ArrowLeft: 3 }[e.key];
            if (dir !== undefined) this.tryMove(dir);
        });

        this.setLeftPill(`⏱ ${this.settings.timeLimit}`);
        this.setRightPill(`👆 ${STORY.ui.mazeHint}`);
    }

    protected startGame ()
    {
        this.startTimer(this.settings.timeLimit);
    }

    private cellCenter (x: number, y: number)
    {
        return { x: this.originX + (x + 0.5) * this.cell, y: this.originY + (y + 0.5) * this.cell };
    }

    private drawMaze ()
    {
        const { columns, rows } = this.settings;
        const g = this.add.graphics();
        g.fillStyle(0x000000, 0.18).fillRect(this.originX, this.originY, columns * this.cell, rows * this.cell);
        g.lineStyle(10, toNum(COLORS.chalk), 0.9);

        for (let y = 0; y < rows; y++)
        {
            for (let x = 0; x < columns; x++)
            {
                const w = this.walls[y * columns + x];
                const left = this.originX + x * this.cell, top = this.originY + y * this.cell;
                const right = left + this.cell, bottom = top + this.cell;
                if (w & N) g.lineBetween(left - 5, top, right + 5, top);
                if (w & W) g.lineBetween(left, top - 5, left, bottom + 5);
                if (x === columns - 1 && w & E) g.lineBetween(right, top - 5, right, bottom + 5);
                if (y === rows - 1 && w & S) g.lineBetween(left - 5, bottom, right + 5, bottom);
            }
        }
    }

    /** Every `step` px of drag moves one cell in the dominant direction; walls stop the heart. */
    private onDrag (p: Input.Pointer)
    {
        if (!this.isPlaying || !p.isDown || !this.anchor) return;
        const step = this.cell * 0.45;

        for (let guard = 0; guard < 4; guard++)
        {
            const dx = p.x - this.anchor.x, dy = p.y - this.anchor.y;
            if (Math.abs(dx) < step && Math.abs(dy) < step) return;

            const horizontal = Math.abs(dx) >= Math.abs(dy);
            const primary = horizontal ? (dx > 0 ? 1 : 3) : (dy > 0 ? 2 : 0);
            const secondary = horizontal ? (dy > 0 ? 2 : 0) : (dx > 0 ? 1 : 3);
            const secondaryFar = horizontal ? Math.abs(dy) >= step : Math.abs(dx) >= step;

            // Diagonal drags slide around corners: try the other axis when the main one is blocked
            const moved = this.tryMove(primary) ? primary : secondaryFar && this.tryMove(secondary) ? secondary : -1;
            if (moved < 0)
            {
                this.anchor = { x: p.x, y: p.y };
                return;
            }
            this.anchor.x += DIRS[moved].dx * step;
            this.anchor.y += DIRS[moved].dy * step;
        }
    }

    private tryMove (dir: number)
    {
        if (!this.isPlaying) return false;
        const { columns, rows } = this.settings;
        const d = DIRS[dir];
        if (this.walls[this.pos.y * columns + this.pos.x] & d.bit)
        {
            this.tweens.add({ targets: this.heart, angle: { from: -10, to: 10 }, duration: 50, yoyo: true, onComplete: () => this.heart.setAngle(0) });
            return false;
        }

        const from = this.cellCenter(this.pos.x, this.pos.y);
        this.pos = { x: this.pos.x + d.dx, y: this.pos.y + d.dy };
        const to = this.cellCenter(this.pos.x, this.pos.y);

        this.trail.fillStyle(toNum(COLORS.primary), 0.45).fillCircle(from.x, from.y, this.cell * 0.12);
        this.tweens.killTweensOf(this.heart);
        this.tweens.add({ targets: this.heart, x: to.x, y: to.y, duration: 70, ease: 'Sine.Out' });
        sfx.flip();

        if (this.pos.x === columns - 1 && this.pos.y === rows - 1)
        {
            vibrate(30);
            burst(this, to.x, to.y, COLORS.accent, 14);
            this.time.delayedCall(150, () => this.win());
        }
        return true;
    }
}

/** Recursive backtracker (iterative): long winding corridors, exactly one path between any two cells. */
function generateMaze (columns: number, rows: number)
{
    const walls = new Array<number>(columns * rows).fill(N | E | S | W);
    const visited = new Array<boolean>(columns * rows).fill(false);
    const stack = [{ x: 0, y: 0 }];
    visited[0] = true;

    while (stack.length)
    {
        const current = stack[stack.length - 1];
        const options = DIRS.filter(d =>
        {
            const nx = current.x + d.dx, ny = current.y + d.dy;
            return nx >= 0 && ny >= 0 && nx < columns && ny < rows && !visited[ny * columns + nx];
        });

        if (!options.length)
        {
            stack.pop();
            continue;
        }

        const d = options[Math.floor(Math.random() * options.length)];
        const next = { x: current.x + d.dx, y: current.y + d.dy };
        walls[current.y * columns + current.x] &= ~d.bit;
        walls[next.y * columns + next.x] &= ~d.opposite;
        visited[next.y * columns + next.x] = true;
        stack.push(next);
    }
    return walls;
}
