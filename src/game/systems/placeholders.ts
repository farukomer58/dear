import type { Textures } from 'phaser';
import { ASSETS, type AssetKey } from '../config/assets';
import { STORY } from '../config/story';
import { COLORS, FONTS } from '../config/theme';

/**
 * Placeholder art drawn with the Canvas 2D API, so the game runs without any image files.
 * Each key from config/assets.ts needs a drawer here. Once you set `file` for a key in
 * the manifest, its drawer is simply no longer used (you can keep or delete it).
 */
type Drawer = (ctx: CanvasRenderingContext2D, w: number, h: number) => void;

export function createPlaceholderTexture (textures: Textures.TextureManager, key: AssetKey)
{
    const { width, height } = ASSETS[key];
    const texture = textures.createCanvas(key, width, height);
    if (!texture) return;

    DRAWERS[key](texture.getContext(), width, height);
    texture.refresh();
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function roundRect (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number)
{
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
}

function circle (ctx: CanvasRenderingContext2D, x: number, y: number, r: number, fill: string | CanvasGradient)
{
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
}

/** Renders a single emoji centred in the texture: the quickest way to get a decent icon. */
const emoji = (char: string, scale = 0.8): Drawer => (ctx, w, h) =>
{
    ctx.font = `${Math.floor(h * scale)}px ${FONTS.emoji}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(char, w / 2, h / 2 + h * 0.05);
};

function chalkboard (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, frame: number)
{
    roundRect(ctx, x, y, w, h, 28);
    ctx.fillStyle = '#8a5a32';
    ctx.fill();

    const bx = x + frame, by = y + frame, bw = w - frame * 2, bh = h - frame * 2;
    const glow = ctx.createRadialGradient(bx + bw / 2, by + bh / 2, 50, bx + bw / 2, by + bh / 2, Math.max(bw, bh) * 0.7);
    glow.addColorStop(0, '#3b7062');
    glow.addColorStop(1, COLORS.board);
    roundRect(ctx, bx, by, bw, bh, 12);
    ctx.fillStyle = glow;
    ctx.fill();

    // Old chalk smudges
    ctx.save();
    ctx.globalAlpha = 0.05;
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 9; i++)
    {
        ctx.beginPath();
        ctx.ellipse(bx + bw * ((i * 37) % 100) / 100, by + bh * ((i * 53) % 100) / 100, 120, 40, i, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

// ---------------------------------------------------------------------------
// Characters
// ---------------------------------------------------------------------------

const drawTeacher: Drawer = (ctx) =>
{
    const skin = '#f2c7a5';
    const hair = '#6b3e26';
    const cardigan = '#2a9d8f';

    // Legs + shoes
    ctx.fillStyle = '#3b3b4f';
    ctx.fillRect(140, 430, 30, 85);
    ctx.fillRect(190, 430, 30, 85);
    ctx.fillStyle = '#2b2a33';
    ctx.beginPath(); ctx.ellipse(150, 520, 30, 14, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(212, 520, 30, 14, 0, 0, Math.PI * 2); ctx.fill();

    // Skirt
    ctx.fillStyle = '#e76f51';
    ctx.beginPath();
    ctx.moveTo(115, 300); ctx.lineTo(245, 300); ctx.lineTo(275, 450); ctx.lineTo(85, 450);
    ctx.closePath(); ctx.fill();

    // Arms: left relaxed, right raised holding chalk
    ctx.lineCap = 'round';
    ctx.lineWidth = 36;
    ctx.strokeStyle = cardigan;
    ctx.beginPath(); ctx.moveTo(112, 200); ctx.quadraticCurveTo(70, 270, 92, 350); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(248, 200); ctx.quadraticCurveTo(310, 180, 320, 110); ctx.stroke();
    circle(ctx, 94, 362, 20, skin);
    circle(ctx, 322, 96, 20, skin);
    ctx.fillStyle = '#ffffff';
    ctx.save(); ctx.translate(330, 70); ctx.rotate(0.4); ctx.fillRect(-7, -22, 14, 36); ctx.restore();

    // Torso
    roundRect(ctx, 105, 170, 150, 160, 40);
    ctx.fillStyle = cardigan; ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.moveTo(150, 172); ctx.lineTo(210, 172); ctx.lineTo(180, 245); ctx.closePath(); ctx.fill();
    circle(ctx, 180, 270, 6, '#1f7a6f');
    circle(ctx, 180, 300, 6, '#1f7a6f');

    // Neck, hair behind, head
    ctx.fillStyle = skin; ctx.fillRect(165, 150, 30, 30);
    circle(ctx, 180, 112, 80, hair);
    circle(ctx, 180, 30, 32, hair);
    circle(ctx, 180, 118, 66, skin);
    ctx.fillStyle = hair;
    ctx.beginPath(); ctx.ellipse(180, 66, 72, 34, 0, Math.PI, Math.PI * 2); ctx.fill();

    // Face: glasses, eyes, smile, blush
    ctx.lineWidth = 5; ctx.strokeStyle = '#2b2a33';
    ctx.beginPath(); ctx.arc(155, 115, 18, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(205, 115, 18, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(173, 115); ctx.lineTo(187, 115); ctx.stroke();
    circle(ctx, 155, 117, 6, '#2b2a33');
    circle(ctx, 205, 117, 6, '#2b2a33');
    ctx.beginPath(); ctx.arc(180, 140, 20, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
    ctx.globalAlpha = 0.35;
    circle(ctx, 135, 145, 12, '#ff6b6b');
    circle(ctx, 225, 145, 12, '#ff6b6b');
    ctx.globalAlpha = 1;
};

/** Students are seen from behind (we look at the classroom from the back row). */
const studentBack = (shirt: string, hair: string, style: 'short' | 'ponytail' | 'curly'): Drawer => (ctx, w) =>
{
    const cx = w / 2;
    const skin = '#e8b894';

    roundRect(ctx, 15, 160, w - 30, 170, 85);
    ctx.fillStyle = shirt; ctx.fill();
    ctx.fillStyle = skin; ctx.fillRect(cx - 22, 125, 44, 45);

    circle(ctx, cx - 72, 100, 16, skin);
    circle(ctx, cx + 72, 100, 16, skin);

    if (style === 'curly')
    {
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 5)
        {
            circle(ctx, cx + Math.cos(a) * 62, 90 + Math.sin(a) * 62, 26, hair);
        }
    }
    circle(ctx, cx, 92, 74, hair);

    if (style === 'ponytail')
    {
        ctx.fillStyle = hair;
        ctx.beginPath(); ctx.ellipse(cx, 190, 24, 58, 0, 0, Math.PI * 2); ctx.fill();
        circle(ctx, cx, 140, 14, COLORS.primary);
    }

    ctx.globalAlpha = 0.15;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.ellipse(cx - 25, 55, 30, 16, -0.5, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
};

// ---------------------------------------------------------------------------
// Backgrounds
// ---------------------------------------------------------------------------

const drawClassroom: Drawer = (ctx, w, h) =>
{
    // Wall
    const wall = ctx.createLinearGradient(0, 0, 0, 1150);
    wall.addColorStop(0, '#f8ead0');
    wall.addColorStop(1, '#ecd5aa');
    ctx.fillStyle = wall;
    ctx.fillRect(0, 0, w, 1150);
    ctx.fillStyle = '#d6b285';
    ctx.fillRect(0, 1080, w, 70);

    // Floor planks
    ctx.fillStyle = '#b9824f';
    ctx.fillRect(0, 1150, w, h - 1150);
    for (let y = 1150, i = 0; y < h; y += 64, i++)
    {
        ctx.fillStyle = i % 2 ? '#b07846' : '#bf8955';
        ctx.fillRect(0, y, w, 60);
        ctx.fillStyle = '#9c6a3c';
        ctx.fillRect(((i * 290) % w), y, 6, 60);
        ctx.fillRect(((i * 290 + 540) % w), y, 6, 60);
    }

    // Bunting
    const flags = [COLORS.primary, COLORS.accent, COLORS.success, COLORS.secondary, '#b388eb'];
    ctx.strokeStyle = '#8a5a32'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(30, 160); ctx.quadraticCurveTo(w / 2, 220, w - 30, 160); ctx.stroke();
    for (let i = 0; i < 13; i++)
    {
        const t = (i + 0.5) / 13;
        const x = 30 + t * (w - 60);
        const y = 160 + 4 * t * (1 - t) * 30;
        ctx.fillStyle = flags[i % flags.length];
        ctx.beginPath(); ctx.moveTo(x - 30, y); ctx.lineTo(x + 30, y); ctx.lineTo(x, y + 55); ctx.closePath(); ctx.fill();
    }

    // Chalkboard + tray
    chalkboard(ctx, 60, 250, w - 120, 600, 26);
    ctx.fillStyle = '#6e4626';
    ctx.fillRect(90, 846, w - 180, 22);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(200, 836, 50, 12);
    ctx.fillStyle = '#ffd6e0'; ctx.fillRect(270, 836, 40, 12);

    // Plant
    ctx.fillStyle = '#c4643c';
    ctx.beginPath(); ctx.moveTo(950, 1050); ctx.lineTo(1040, 1050); ctx.lineTo(1025, 1150); ctx.lineTo(965, 1150); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#4e9f5d';
    for (const [dx, dy, r] of [[0, -40, 46], [-38, -10, 36], [38, -10, 36], [0, -95, 34]])
    {
        circle(ctx, 995 + dx, 1050 + dy, r, '#4e9f5d');
    }

    // Teacher desk (left), with books and an apple
    ctx.fillStyle = '#9c6b3f';
    roundRect(ctx, 60, 1010, 470, 40, 10); ctx.fill();
    ctx.fillStyle = '#7d5230';
    ctx.fillRect(80, 1050, 430, 150);
    ctx.fillStyle = '#6a4427';
    ctx.fillRect(110, 1080, 370, 8);
    const books = ['#e5484d', '#3d8bfd', '#ffc93c'];
    books.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(110, 990 - i * 24, 150 - i * 12, 22); });
    circle(ctx, 420, 980, 30, '#e5484d');
    ctx.fillStyle = '#4e9f5d';
    ctx.beginPath(); ctx.ellipse(432, 946, 12, 6, -0.6, 0, Math.PI * 2); ctx.fill();

    // Student desks (two rows; students are separate sprites placed on top)
    for (const [y, scale] of [[1390, 1], [1660, 1.12]] as const)
    {
        for (const x of [200, 540, 880])
        {
            const dw = 280 * scale, dh = 70 * scale;
            ctx.fillStyle = '#c99b66';
            roundRect(ctx, x - dw / 2, y, dw, dh, 10); ctx.fill();
            ctx.fillStyle = '#a77a48';
            ctx.fillRect(x - dw / 2 + 10, y + dh, dw - 20, 14);
        }
    }
};

const drawBoardBackground: Drawer = (ctx, w, h) =>
{
    ctx.fillStyle = '#6e4626';
    ctx.fillRect(0, 0, w, h);
    chalkboard(ctx, 0, 0, w, h, 30);

    // Faint doodles left by "previous lessons"
    ctx.save();
    ctx.globalAlpha = 0.07;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.font = `80px ${FONTS.chalk}`;
    const doodles: [string, number, number][] = [
        ['a² + b² = c²', 300, 300], ['7 × 8 = 56', 800, 520], ['A B C', 250, 900],
        ['π ≈ 3.14', 820, 1200], ['☆', 180, 1500], ['2 + 2 = 4', 760, 1700]
    ];
    for (const [text, x, y] of doodles) ctx.fillText(text, x, y);
    ctx.restore();
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

const drawCardBack: Drawer = (ctx, w, h) =>
{
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, COLORS.secondary);
    g.addColorStop(1, COLORS.secondaryDark);
    roundRect(ctx, 4, 4, w - 8, h - 8, 28);
    ctx.fillStyle = g; ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 6;
    roundRect(ctx, 20, 20, w - 40, h - 40, 18); ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = `700 ${Math.floor(h * 0.45)}px ${FONTS.ui}`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('?', w / 2, h / 2 + 6);
};

const drawCardFront: Drawer = (ctx, w, h) =>
{
    roundRect(ctx, 4, 4, w - 8, h - 8, 28);
    ctx.fillStyle = COLORS.paper; ctx.fill();
    ctx.strokeStyle = '#e3d5b8'; ctx.lineWidth = 6; ctx.stroke();
};

const drawCoin: Drawer = (ctx, w, h) =>
{
    const cx = w / 2, cy = h / 2, r = w / 2 - 8;
    const g = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
    g.addColorStop(0, '#fff2a8');
    g.addColorStop(0.6, '#ffc93c');
    g.addColorStop(1, '#f19a1a');
    circle(ctx, cx, cy, r, g);
    ctx.lineWidth = 10; ctx.strokeStyle = '#c77a0a';
    ctx.beginPath(); ctx.arc(cx, cy, r - 5, 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(199,122,10,0.6)';
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.72, 0, Math.PI * 2); ctx.stroke();

    // Star
    ctx.fillStyle = '#fff6c9';
    ctx.beginPath();
    for (let i = 0; i < 10; i++)
    {
        const rad = i % 2 ? r * 0.25 : r * 0.55;
        const a = -Math.PI / 2 + i * Math.PI / 5;
        ctx.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad);
    }
    ctx.closePath(); ctx.fill();
};

const drawBucket: Drawer = (ctx, w, h) =>
{
    const top = 40, bottom = h - 8;
    const g = ctx.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, '#2d7fb8');
    g.addColorStop(0.4, '#5cc0f0');
    g.addColorStop(1, '#2d7fb8');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(10, top); ctx.lineTo(w - 10, top); ctx.lineTo(w - 45, bottom); ctx.lineTo(45, bottom);
    ctx.closePath(); ctx.fill();

    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(40, top + 50, w - 80, 14);
    ctx.fillRect(48, top + 100, w - 96, 14);

    ctx.fillStyle = '#1f5f8c';
    ctx.beginPath(); ctx.ellipse(w / 2, top, w / 2 - 6, 26, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#123c5a';
    ctx.beginPath(); ctx.ellipse(w / 2, top + 2, w / 2 - 22, 16, 0, 0, Math.PI * 2); ctx.fill();
};

// ---------------------------------------------------------------------------
// Maze, puzzle, rebus, surprise
// ---------------------------------------------------------------------------

function heartPath (ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number)
{
    const s = size / 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy + s * 0.85);
    ctx.bezierCurveTo(cx - s * 1.25, cy + s * 0.05, cx - s * 0.75, cy - s * 0.95, cx, cy - s * 0.35);
    ctx.bezierCurveTo(cx + s * 0.75, cy - s * 0.95, cx + s * 1.25, cy + s * 0.05, cx, cy + s * 0.85);
    ctx.closePath();
}

const drawHeart: Drawer = (ctx, w, h) =>
{
    const g = ctx.createRadialGradient(w * 0.38, h * 0.35, 4, w / 2, h / 2, w / 2);
    g.addColorStop(0, '#ff9aa8');
    g.addColorStop(1, '#e5484d');
    heartPath(ctx, w / 2, h / 2 + 4, w * 0.9);
    ctx.fillStyle = g; ctx.fill();
    ctx.lineWidth = 4; ctx.strokeStyle = '#b8323a'; ctx.stroke();
};

/** A cheerful picture with faint numbers, so the placeholder puzzle is solvable. Swap in a photo! */
const drawPuzzleImage: Drawer = (ctx, w, h) =>
{
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#8fd3ff');
    sky.addColorStop(0.6, '#ffe3b3');
    sky.addColorStop(1, '#ffb38a');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);

    circle(ctx, w * 0.75, h * 0.22, w * 0.12, '#ffd23c');
    ctx.fillStyle = '#5cb85c';
    ctx.beginPath(); ctx.ellipse(w * 0.25, h * 1.02, w * 0.55, h * 0.32, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3fa34d';
    ctx.beginPath(); ctx.ellipse(w * 0.85, h * 1.05, w * 0.5, h * 0.3, 0, 0, Math.PI * 2); ctx.fill();

    heartPath(ctx, w * 0.5, h * 0.5, w * 0.42);
    ctx.fillStyle = '#e5484d'; ctx.fill();
    ctx.lineWidth = 12; ctx.strokeStyle = '#ffffff'; ctx.stroke();

    const petals = ['#ff7a59', '#b388eb', '#ffc93c', '#ff9aa8'];
    for (let i = 0; i < 7; i++)
    {
        const x = w * (0.08 + i * 0.14), y = h * (0.86 + (i % 2) * 0.06);
        for (let a = 0; a < 5; a++) circle(ctx, x + Math.cos(a * 1.26) * 22, y + Math.sin(a * 1.26) * 22, 18, petals[i % petals.length]);
        circle(ctx, x, y, 14, '#fff3b0');
    }

    ctx.save();
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    // Numbers follow the puzzle's grid size from story.ts
    const level = STORY.levels.find(l => l.scene === 'SlidePuzzleGame');
    const n = level?.scene === 'SlidePuzzleGame' ? level.settings.size : 4;
    ctx.font = `700 ${Math.floor(w / (n * 3))}px ${FONTS.ui}`;
    for (let i = 0; i < n * n - 1; i++) ctx.fillText(String(i + 1), (i % n + 0.5) * w / n, (Math.floor(i / n) + 0.5) * h / n);
    ctx.restore();
};

/** Fallback for hands.svg: the emoji plus the two rings. */
const drawHands: Drawer = (ctx, w, h) =>
{
    emoji('🤝', 0.85)(ctx, w, h);
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#c9ccd3';
    ctx.beginPath(); ctx.ellipse(w * 0.33, h * 0.5, 22, 12, 0.4, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = '#f2b51d';
    ctx.beginPath(); ctx.ellipse(w * 0.67, h * 0.5, 22, 12, -0.4, 0, Math.PI * 2); ctx.stroke();
};

/** The 🗣️ emoji is a dark silhouette on some systems, so it sits on a light bubble. */
const drawSpeaker: Drawer = (ctx, w, h) =>
{
    circle(ctx, w / 2, h / 2 + 4, w / 2 - 4, 'rgba(0,0,0,0.25)');
    circle(ctx, w / 2, h / 2, w / 2 - 6, COLORS.paper);
    emoji('🗣️', 0.6)(ctx, w, h);
};

const drawSurpriseBg: Drawer = (ctx, w, h) =>
{
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#ffe6ee');
    g.addColorStop(0.5, '#fff6e8');
    g.addColorStop(1, '#ffd9cf');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 0.35;
    for (let i = 0; i < 40; i++) circle(ctx, (i * 271) % w, (i * 613) % h, 6 + (i % 5) * 3, '#ffffff');
    ctx.globalAlpha = 1;
};

const flower = (petal: string, center: string, count: number): Drawer => (ctx, w, h) =>
{
    const cx = w / 2, cy = h / 2, r = w * 0.2;
    for (let i = 0; i < count; i++)
    {
        const a = (Math.PI * 2 * i) / count;
        ctx.save();
        ctx.translate(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
        ctx.rotate(a);
        ctx.fillStyle = petal;
        ctx.beginPath(); ctx.ellipse(0, 0, w * 0.24, w * 0.14, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath(); ctx.ellipse(-w * 0.04, -w * 0.03, w * 0.12, w * 0.05, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }
    circle(ctx, cx, cy, w * 0.16, center);
    for (let i = 0; i < 8; i++) circle(ctx, cx + Math.cos(i) * w * 0.08, cy + Math.sin(i) * w * 0.08, w * 0.02, 'rgba(120,60,0,0.35)');
};

const drawPetal: Drawer = (ctx, w, h) =>
{
    ctx.fillStyle = '#ff9aba';
    ctx.beginPath(); ctx.ellipse(w / 2, h / 2, w / 2 - 2, h / 2 - 4, 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath(); ctx.ellipse(w * 0.42, h * 0.4, w * 0.2, h * 0.12, 0.3, 0, Math.PI * 2); ctx.fill();
};

// ---------------------------------------------------------------------------
// Registry: one drawer per asset key
// ---------------------------------------------------------------------------

const DRAWERS: Record<AssetKey, Drawer> = {
    'classroom': drawClassroom,
    'board-bg': drawBoardBackground,
    'teacher': drawTeacher,
    'student-1': studentBack(COLORS.secondary, '#3a2a20', 'short'),
    'student-2': studentBack(COLORS.accent, '#c9772e', 'ponytail'),
    'student-3': studentBack(COLORS.success, '#1d1d1f', 'curly'),
    'clue': emoji('🔑'),
    'card-back': drawCardBack,
    'card-front': drawCardFront,
    'face-apple': emoji('🍎'),
    'face-books': emoji('📚'),
    'face-pencil': emoji('✏️'),
    'face-globe': emoji('🌍'),
    'face-backpack': emoji('🎒'),
    'face-flask': emoji('🧪'),
    'face-ruler': emoji('📐'),
    'face-palette': emoji('🎨'),
    'coin': drawCoin,
    'bucket': drawBucket,
    'item-swim': emoji('🏊'),
    'item-read': emoji('📖'),
    'item-run': emoji('🏃'),
    'item-music': emoji('🎵'),
    'item-fruit': emoji('🍓'),
    'item-alcohol': emoji('🍺'),
    'item-pork': emoji('🥓'),
    'item-smoke': emoji('🚬'),
    'heart': drawHeart,
    'maze-exit': emoji('🏁'),
    'puzzle-image': drawPuzzleImage,
    'hands': drawHands,
    'speaker': drawSpeaker,
    'surprise-bg': drawSurpriseBg,
    'flower-1': flower('#ff7aa2', '#ffd23c', 6),
    'flower-2': flower('#b388eb', '#fff3b0', 5),
    'flower-3': flower('#ffb347', '#e5484d', 8),
    'petal': drawPetal
};
