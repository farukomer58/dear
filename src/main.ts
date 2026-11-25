import '@fontsource/fredoka/500.css';
import '@fontsource/fredoka/700.css';
import '@fontsource/patrick-hand/400.css';
import '@fontsource/amiri/arabic-400.css';
import StartGame from './game/main';

// Phaser draws text onto a canvas, so fonts must be loaded before the first scene renders.
// Each font is split into unicode subsets; the sample text makes sure the Turkish (latin-ext)
// and Arabic-script (Amiri, for the Ottoman message) subsets are loaded too.
const TURKISH_SAMPLE = 'AaÇçĞğİıÖöŞşÜüÂâ';
const FONTS_TO_PRELOAD: [string, string][] = [
    ['500 40px Fredoka', TURKISH_SAMPLE],
    ['700 40px Fredoka', TURKISH_SAMPLE],
    ['40px "Patrick Hand"', TURKISH_SAMPLE],
    ['40px Amiri', 'سوگیلی']
];

document.addEventListener('DOMContentLoaded', async () =>
{
    await Promise.all(FONTS_TO_PRELOAD.map(([font, text]) => document.fonts.load(font, text))).catch(() => undefined);
    StartGame('game-container');
});
