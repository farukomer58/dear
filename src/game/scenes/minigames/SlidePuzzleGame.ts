import { GameObjects } from 'phaser';
import { STORY } from '../../config/story';
import { COLORS, GAME_WIDTH, toNum } from '../../config/theme';
import { sfx, vibrate } from '../../systems/sfx';
import { burst } from '../../ui/widgets';
import { BaseMinigame } from './BaseMinigame';

export interface SlidePuzzleSettings
{
    /** Tiles per side (3 = 8 tiles + 1 gap, 4 = 15 tiles + 1 gap). */
    size: number;
    /** Random legal moves used to shuffle. Fewer = easier. Always solvable. */
    shuffleMoves: number;
    /** Seconds to solve it. 0 = no timer. */
    timeLimit: number;
}

const BOARD = 900;
const BOARD_TOP = 600;
const GAP = 6;

/**
 * Sliding tile puzzle made from the `puzzle-image` asset (swap it for a photo in assets.ts).
 * Tapping a tile in the gap's row or column slides the whole line towards the gap.
 */
export class SlidePuzzleGame extends BaseMinigame<SlidePuzzleSettings>
{
    /** grid[cell] = tile id at that cell, -1 for the gap. Tile id === cell when solved. */
    private grid: number[];
    private tiles: GameObjects.Image[];
    private moves: number;
    private tileSize: number;

    constructor ()
    {
        super('SlidePuzzleGame');
    }

    protected setupGame ()
    {
        const { size } = this.settings;
        const count = size * size;
        this.tileSize = BOARD / size;
        this.moves = 0;
        this.grid = this.shuffledGrid();

        // Small reference picture above the board
        const preview = this.add.image(GAME_WIDTH / 2, 440, 'puzzle-image');
        preview.setDisplaySize(220 * this.squareRatio().w, 220 * this.squareRatio().h).setCrop(...this.squareCrop());
        this.add.rectangle(GAME_WIDTH / 2, 440, 228, 228).setStrokeStyle(6, toNum(COLORS.chalk), 0.9);

        this.add.rectangle(GAME_WIDTH / 2, BOARD_TOP + BOARD / 2, BOARD + 24, BOARD + 24, 0x000000, 0.3)
            .setStrokeStyle(8, toNum(COLORS.chalk), 0.9);

        this.tiles = [];
        for (let id = 0; id < count - 1; id++)
        {
            const tile = this.add.image(0, 0, 'puzzle-image', this.tileFrame(id)).setDisplaySize(this.tileSize - GAP, this.tileSize - GAP);
            tile.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.onTap(id));
            this.tiles[id] = tile;
        }
        this.grid.forEach((id, cell) => { if (id >= 0) this.tiles[id].setPosition(...this.cellPos(cell)); });

        this.setLeftPill(this.settings.timeLimit > 0 ? `⏱ ${this.settings.timeLimit}` : '🧩');
        this.setRightPill(STORY.ui.slideMoves(0));
    }

    protected startGame ()
    {
        if (this.settings.timeLimit > 0) this.startTimer(this.settings.timeLimit);
    }

    /** Custom photos may not be square: use the centred square part of them. */
    private squareCrop (): [number, number, number, number]
    {
        const source = this.textures.get('puzzle-image').getSourceImage();
        const side = Math.min(source.width, source.height);
        return [(source.width - side) / 2, (source.height - side) / 2, side, side];
    }

    /** Display-size factors so the cropped square of a non-square image shows at the requested size. */
    private squareRatio ()
    {
        const [, , side] = this.squareCrop();
        const source = this.textures.get('puzzle-image').getSourceImage();
        return { w: source.width / side, h: source.height / side };
    }

    private tileFrame (id: number)
    {
        const { size } = this.settings;
        const name = `tile-${size}-${id}`;
        const texture = this.textures.get('puzzle-image');
        if (!texture.has(name))
        {
            const [ox, oy, side] = this.squareCrop();
            const part = side / size;
            texture.add(name, 0, ox + (id % size) * part, oy + Math.floor(id / size) * part, part, part);
        }
        return name;
    }

    private cellPos (cell: number): [number, number]
    {
        const { size } = this.settings;
        const left = GAME_WIDTH / 2 - BOARD / 2;
        return [left + (cell % size + 0.5) * this.tileSize, BOARD_TOP + (Math.floor(cell / size) + 0.5) * this.tileSize];
    }

    private neighbours (cell: number)
    {
        const { size } = this.settings;
        const x = cell % size, y = Math.floor(cell / size);
        return [[x, y - 1], [x + 1, y], [x, y + 1], [x - 1, y]]
            .filter(([nx, ny]) => nx >= 0 && ny >= 0 && nx < size && ny < size)
            .map(([nx, ny]) => ny * size + nx);
    }

    /** Shuffle by playing random legal moves from the solved state, so it is always solvable. */
    private shuffledGrid ()
    {
        const count = this.settings.size ** 2;
        const grid = Array.from({ length: count }, (_, i) => (i === count - 1 ? -1 : i));
        let gap = count - 1;
        let previous = -1;

        for (let i = 0; i < this.settings.shuffleMoves || isSolved(grid); i++)
        {
            const options = this.neighbours(gap).filter(c => c !== previous);
            const cell = options[Math.floor(Math.random() * options.length)];
            [grid[gap], grid[cell]] = [grid[cell], grid[gap]];
            previous = gap;
            gap = cell;
        }
        return grid;
    }

    private onTap (id: number)
    {
        if (!this.isPlaying) return;
        const { size } = this.settings;
        const cell = this.grid.indexOf(id);
        const gap = this.grid.indexOf(-1);
        const sameRow = Math.floor(cell / size) === Math.floor(gap / size);
        const sameCol = cell % size === gap % size;
        if (!sameRow && !sameCol)
        {
            this.tweens.add({ targets: this.tiles[id], angle: { from: -4, to: 4 }, duration: 50, yoyo: true, repeat: 1, onComplete: () => this.tiles[id].setAngle(0) });
            return;
        }

        // Slide every tile between the tapped one and the gap one step towards the gap
        const step = sameRow ? (cell > gap ? 1 : -1) : (cell > gap ? size : -size);
        for (let c = gap; c !== cell; c += step)
        {
            const moving = this.grid[c + step];
            this.grid[c] = moving;
            this.grid[c + step] = -1;
            const [x, y] = this.cellPos(c);
            this.tweens.add({ targets: this.tiles[moving], x, y, duration: 110, ease: 'Sine.Out' });
        }

        this.moves++;
        this.setRightPill(STORY.ui.slideMoves(this.moves));
        sfx.flip();

        if (isSolved(this.grid)) this.onSolved();
    }

    private onSolved ()
    {
        this.isPlaying = false;
        this.stopTimer();
        vibrate([30, 40, 30]);

        // The missing piece slides in to complete the picture
        const last = this.settings.size ** 2 - 1;
        const [x, y] = this.cellPos(last);
        const piece = this.add.image(x, y, 'puzzle-image', this.tileFrame(last))
            .setDisplaySize(this.tileSize - GAP, this.tileSize - GAP).setAlpha(0);
        this.tweens.add({ targets: piece, alpha: 1, duration: 400 });
        this.time.delayedCall(300, () => burst(this, x, y, COLORS.accent, 14));

        this.time.delayedCall(900, () =>
        {
            this.isPlaying = true;
            this.win();
        });
    }
}

function isSolved (grid: number[])
{
    return grid.every((id, cell) => id === -1 || id === cell);
}
