import type { GameObjects, Scene } from 'phaser';
import { ASSETS, type AssetKey } from '../config/assets';
import { COLORS, GAME_HEIGHT, GAME_WIDTH, textStyle, toNum } from '../config/theme';
import { sfx } from '../systems/sfx';

/**
 * Small, reusable UI building blocks shared by all scenes.
 * Everything is plain functions returning Phaser game objects. No class hierarchy needed.
 */

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/** Adds an image at the size declared in the asset manifest, whatever the source file size. */
export function addAsset (scene: Scene, x: number, y: number, key: AssetKey)
{
    const { width, height } = ASSETS[key];
    return scene.add.image(x, y, key).setDisplaySize(width, height);
}

// ---------------------------------------------------------------------------
// Buttons
// ---------------------------------------------------------------------------

export interface ButtonOptions
{
    width?: number;
    height?: number;
    fontSize?: number;
    color?: string;
    shade?: string;
    textColor?: string;
    radius?: number;
}

/** Chunky, thumb-sized button with a pressed state. Fires on release, so dragging off cancels. */
export function createButton (scene: Scene, x: number, y: number, label: string, onClick: () => void, options: ButtonOptions = {})
{
    const {
        width = 640, height = 150, fontSize = 60,
        color = COLORS.primary, shade = COLORS.primaryDark, textColor = '#ffffff', radius = 40
    } = options;
    const depth = 12;

    const bg = scene.add.graphics();
    const text = scene.add.text(0, 0, label, textStyle(fontSize, {
        color: textColor, fontStyle: '700',
        shadow: { offsetY: 3, color: 'rgba(0,0,0,0.25)', fill: true }
    })).setOrigin(0.5);

    const draw = (pressed: boolean) =>
    {
        const offset = pressed ? depth - 4 : 0;
        bg.clear();
        bg.fillStyle(toNum(shade), 1).fillRoundedRect(-width / 2, -height / 2 + depth, width, height, radius);
        bg.fillStyle(toNum(color), 1).fillRoundedRect(-width / 2, -height / 2 + offset, width, height, radius);
        text.y = offset - 2;
    };
    draw(false);

    const button = scene.add.container(x, y, [bg, text]).setSize(width, height + depth);
    button.setInteractive({ useHandCursor: true });

    let pressed = false;
    button.on('pointerdown', () => { pressed = true; draw(true); });
    button.on('pointerout', () => { pressed = false; draw(false); });
    button.on('pointerup', () =>
    {
        if (!pressed) return;
        pressed = false;
        draw(false);
        sfx.tap();
        onClick();
    });

    return button;
}

/** Round icon button (close, mute...). */
export function createIconButton (scene: Scene, x: number, y: number, icon: string, onClick: () => void)
{
    return createButton(scene, x, y, icon, onClick, {
        width: 110, height: 110, radius: 55, fontSize: 50,
        color: COLORS.paper, shade: '#d8ccb4', textColor: COLORS.ink
    }).setDepth(40);
}

export function createMuteButton (scene: Scene, x: number, y: number)
{
    const button = createIconButton(scene, x, y, sfx.muted ? '🔇' : '🔊', () =>
    {
        const label = button.list[1] as GameObjects.Text;
        label.setText(sfx.toggleMute() ? '🔇' : '🔊');
    });
    return button;
}

// ---------------------------------------------------------------------------
// Panels, overlays, bubbles
// ---------------------------------------------------------------------------

/** Full-screen dimmer that also swallows taps on everything below it. */
export function createOverlay (scene: Scene, alpha = 0.65)
{
    return scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, toNum(COLORS.overlay), alpha)
        .setInteractive();
}

/** Paper card centred on (x, y). Returns a container so content can be added to it. */
export function createPanel (scene: Scene, x: number, y: number, width: number, height: number)
{
    const bg = scene.add.graphics();
    bg.fillStyle(0x000000, 0.25).fillRoundedRect(-width / 2 + 8, -height / 2 + 16, width, height, 48);
    bg.fillStyle(toNum(COLORS.paper), 1).fillRoundedRect(-width / 2, -height / 2, width, height, 48);
    bg.lineStyle(6, toNum('#e3d5b8'), 1).strokeRoundedRect(-width / 2, -height / 2, width, height, 48);
    return scene.add.container(x, y, [bg]);
}

/**
 * Speech bubble centred near (x, y) with a tail pointing at `target` (the speaker's mouth or head).
 * The bubble is kept on screen; the tail still points at the target.
 */
export function speechBubble (scene: Scene, x: number, y: number, message: string, target: { x: number; y: number }, maxWidth = 620)
{
    const pad = 34;
    const text = scene.add.text(0, 0, message, textStyle(46, {
        wordWrap: { width: maxWidth - pad * 2, useAdvancedWrap: true }
    })).setOrigin(0.5);

    const w = Math.max(200, text.width + pad * 2);
    const h = text.height + pad * 2;
    const cx = clamp(x, w / 2 + 24, GAME_WIDTH - w / 2 - 24);
    const cy = clamp(y, h / 2 + 24, GAME_HEIGHT - h / 2 - 24);
    const tx = target.x - cx;
    const ty = target.y - cy;
    const base = 26;

    const bg = scene.add.graphics();
    bg.fillStyle(0x000000, 0.18).fillRoundedRect(-w / 2 + 6, -h / 2 + 10, w, h, 34);
    bg.fillStyle(0xffffff, 1).fillRoundedRect(-w / 2, -h / 2, w, h, 34);

    if (Math.abs(ty) > h / 2)
    {
        const edge = ty > 0 ? h / 2 - 2 : -h / 2 + 2;
        const bx = clamp(tx, -w / 2 + 50, w / 2 - 50);
        bg.fillTriangle(bx - base, edge, bx + base, edge, tx, ty);
    }
    else
    {
        const edge = tx > 0 ? w / 2 - 2 : -w / 2 + 2;
        const by = clamp(ty, -h / 2 + 40, h / 2 - 40);
        bg.fillTriangle(edge, by - base, edge, by + base, tx, ty);
    }

    const bubble = scene.add.container(cx, cy, [bg, text]).setScale(0.6).setAlpha(0).setDepth(20);
    scene.tweens.add({ targets: bubble, scale: 1, alpha: 1, duration: 220, ease: 'Back.Out' });
    return bubble;
}

/** Dark translucent pill used for HUD values (timer, score...). */
export function createPill (scene: Scene, x: number, y: number, width = 280)
{
    const bg = scene.add.graphics();
    bg.fillStyle(0x000000, 0.3).fillRoundedRect(-width / 2, -45, width, 90, 45);
    const text = scene.add.text(0, 0, '', textStyle(48, { color: COLORS.chalk, fontStyle: '700' })).setOrigin(0.5);
    const pill = scene.add.container(x, y, [bg, text]).setDepth(10);
    return { pill, text };
}

// ---------------------------------------------------------------------------
// Effects
// ---------------------------------------------------------------------------

export function floatText (scene: Scene, x: number, y: number, message: string, color: string = COLORS.chalk, size = 56)
{
    const text = scene.add.text(x, y, message, textStyle(size, {
        color, fontStyle: '700', stroke: COLORS.ink, strokeThickness: 8
    })).setOrigin(0.5).setDepth(30);
    scene.tweens.add({ targets: text, y: y - 140, alpha: 0, duration: 800, ease: 'Cubic.Out', onComplete: () => text.destroy() });
}

/** Little star burst, e.g. on a successful tap. */
export function burst (scene: Scene, x: number, y: number, color: string = COLORS.accent, count = 10)
{
    for (let i = 0; i < count; i++)
    {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
        const dist = 90 + Math.random() * 80;
        const dot = scene.add.circle(x, y, 8 + Math.random() * 8, toNum(color)).setDepth(25);
        scene.tweens.add({
            targets: dot, x: x + Math.cos(angle) * dist, y: y + Math.sin(angle) * dist,
            scale: 0, duration: 450 + Math.random() * 200, ease: 'Cubic.Out',
            onComplete: () => dot.destroy()
        });
    }
}

export function confetti (scene: Scene, count = 90)
{
    const colors = [COLORS.primary, COLORS.accent, COLORS.success, COLORS.secondary, '#b388eb', '#ffffff'];
    for (let i = 0; i < count; i++)
    {
        const piece = scene.add.rectangle(
            Math.random() * GAME_WIDTH, -40 - Math.random() * 400,
            18, 30, toNum(colors[i % colors.length])
        ).setDepth(200).setAngle(Math.random() * 360);
        scene.tweens.add({
            targets: piece,
            y: GAME_HEIGHT + 60,
            x: piece.x + (Math.random() - 0.5) * 300,
            angle: piece.angle + 360 + Math.random() * 360,
            duration: 2200 + Math.random() * 1800,
            ease: 'Sine.In',
            onComplete: () => piece.destroy()
        });
    }
}

// ---------------------------------------------------------------------------
// Flow helpers
// ---------------------------------------------------------------------------

/** Call at the top of every scene's create(): fades in and re-enables input after goTo(). */
export function enterScene (scene: Scene)
{
    scene.input.enabled = true;
    scene.cameras.main.fadeIn(280, 16, 20, 26);
}

/** Fade out, then start another scene (or restart the current one when key === scene.scene.key). */
export function goTo (scene: Scene, key: string, data?: object)
{
    scene.input.enabled = false;
    scene.cameras.main.fadeOut(280, 16, 20, 26);
    scene.cameras.main.once('camerafadeoutcomplete', () => scene.scene.start(key, data));
}

export const wait = (scene: Scene, ms: number) =>
    new Promise<void>(resolve => scene.time.delayedCall(ms, resolve));

/** Writes text letter by letter, like chalk on the board. */
export function typeText (scene: Scene, target: GameObjects.Text, content: string, msPerChar = 32)
{
    target.setText('');
    return new Promise<void>(resolve =>
    {
        if (!content) return resolve();
        let shown = 0;
        scene.time.addEvent({
            delay: msPerChar,
            repeat: content.length - 1,
            callback: () =>
            {
                shown++;
                target.setText(content.slice(0, shown));
                if (shown >= content.length) resolve();
            }
        });
    });
}
