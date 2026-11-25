import { AUTO, Game, Scale, Types } from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from './config/theme';
import { Boot } from './scenes/Boot';
import { Classroom } from './scenes/Classroom';
import { Finale } from './scenes/Finale';
import { Surprise } from './scenes/Surprise';
import { Title } from './scenes/Title';
import { CatchGame } from './scenes/minigames/CatchGame';
import { MazeGame } from './scenes/minigames/MazeGame';
import { MemoryGame } from './scenes/minigames/MemoryGame';
import { ProverbGame } from './scenes/minigames/ProverbGame';
import { QuizGame } from './scenes/minigames/QuizGame';
import { RecipeGame } from './scenes/minigames/RecipeGame';
import { SlidePuzzleGame } from './scenes/minigames/SlidePuzzleGame';
import { TapRushGame } from './scenes/minigames/TapRushGame';

// https://docs.phaser.io/api-documentation/typedef/types-core#gameconfig
const config: Types.Core.GameConfig = {
    type: AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: '#1b1f24',
    scale: {
        // Portrait canvas scaled to fit any screen; letterboxed on desktop
        mode: Scale.FIT,
        autoCenter: Scale.CENTER_BOTH
    },
    // Allow multi-finger tapping on phones
    input: { activePointers: 3 },
    // Every scene must be listed here. New minigames go in this list too.
    scene: [
        Boot, Title, Classroom,
        MemoryGame, TapRushGame, CatchGame, MazeGame, SlidePuzzleGame, RecipeGame, QuizGame, ProverbGame,
        Finale, Surprise
    ]
};

/** `parent` is the id of the DOM element the canvas is inserted into (see index.html). */
const StartGame = (parent: string) =>
{
    const game = new Game({ ...config, parent });
    // Dev server only: inspect/drive the game from the browser console, e.g. game.scene.getScene('CatchGame')
    if (import.meta.env.DEV) Object.assign(window, { game });
    return game;
};

export default StartGame;
