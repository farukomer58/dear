import type { Types } from 'phaser';

/**
 * Visual theme: game size, fonts and colours used everywhere.
 * Change a colour here and every scene picks it up.
 *
 * The game is designed in portrait (phone first). Phaser scales the canvas to
 * fit the screen, so all coordinates in the code use this virtual size.
 */
export const GAME_WIDTH = 1080;
export const GAME_HEIGHT = 1920;

/**
 * Fonts are self-hosted via @fontsource (imported in src/main.ts).
 * To use another font: `npm i @fontsource/<name>`, import its CSS in src/main.ts,
 * add it to `FONTS_TO_PRELOAD` there and change the family name here.
 */
export const FONTS = {
    ui: 'Fredoka, "Trebuchet MS", sans-serif',
    chalk: '"Patrick Hand", "Comic Sans MS", cursive',
    emoji: '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif',
    /** Arabic-script font for the Ottoman Turkish message on the surprise screen. */
    ottoman: 'Amiri, "Times New Roman", serif'
};

export const COLORS = {
    ink: '#2b2a33',
    inkSoft: '#5c5a66',
    chalk: '#f8f5ec',
    chalkDim: '#c9d6cc',
    paper: '#fffaf0',
    primary: '#ff7a59',
    primaryDark: '#d9583a',
    secondary: '#3d8bfd',
    secondaryDark: '#2563c9',
    accent: '#ffc93c',
    success: '#3fbf7f',
    danger: '#e5484d',
    board: '#2f5d50',
    overlay: '#10141a'
};

/** Phaser APIs (Graphics, Rectangle) want numbers, Text wants CSS strings. */
export const toNum = (css: string) => parseInt(css.replace('#', ''), 16);

export function textStyle (size: number, overrides: Types.GameObjects.Text.TextStyle = {}): Types.GameObjects.Text.TextStyle
{
    return {
        fontFamily: FONTS.ui,
        fontSize: `${size}px`,
        fontStyle: '500',
        color: COLORS.ink,
        align: 'center',
        ...overrides
    };
}

export function chalkStyle (size: number, overrides: Types.GameObjects.Text.TextStyle = {}): Types.GameObjects.Text.TextStyle
{
    // Padding stops the handwritten glyphs from being clipped at the text bounds
    return textStyle(size, { fontFamily: FONTS.chalk, fontStyle: 'normal', color: COLORS.chalk, padding: { x: 12, y: 6 }, ...overrides });
}
