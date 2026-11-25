import { STORY, UNLOCK_ALL_FOR_TESTING } from '../config/story';
import { clueCandidates, poemTokens } from './poem';

/**
 * Player progress, persisted in localStorage so closing the browser tab
 * (common on phones) does not lose the run. Bump STORAGE_KEY when the shape changes.
 */
const STORAGE_KEY = 'classroom-quest:v2';

interface SaveData
{
    /** Index of the next lesson to play. Equals STORY.levels.length once all are beaten. */
    levelIndex: number;
    /** Per level, the poem token index of the clue word it awards. Random for every new game. */
    wordPlan: number[];
    /** Clue words earned so far, keyed by level id. */
    words: Record<string, string>;
    /** The poem was completed once: from then on everything stays unlocked (last page + replays). */
    finished: boolean;
}

function makeWordPlan ()
{
    const pool = clueCandidates().map(t => t.index);
    for (let i = pool.length - 1; i > 0; i--)
    {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    if (pool.length < STORY.levels.length)
    {
        console.warn('[progress] The poem has fewer clue words than there are levels; some levels give no clue.');
    }
    return pool.slice(0, STORY.levels.length);
}

const fresh = (): SaveData => ({ levelIndex: 0, wordPlan: makeWordPlan(), words: {}, finished: false });

/** A plan is stale when the poem or the number of levels was edited after it was saved. */
function planIsValid (plan: unknown)
{
    const valid = new Set(clueCandidates().map(t => t.index));
    return Array.isArray(plan)
        && plan.length === Math.min(STORY.levels.length, valid.size)
        && plan.every(i => valid.has(i));
}

function load (): SaveData
{
    try
    {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return fresh();
        const saved = { ...fresh(), ...JSON.parse(raw) } as SaveData;
        return planIsValid(saved.wordPlan) ? saved : fresh();
    }
    catch
    {
        return fresh();
    }
}

let data = load();

function persist ()
{
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
    catch { /* private mode / storage full: progress just won't survive a reload */ }
}

export const progress = {
    get levelIndex () { return data.levelIndex; },
    get allLevelsDone () { return data.levelIndex >= STORY.levels.length; },
    get hasStarted () { return data.levelIndex > 0; },
    get finished () { return data.finished; },
    /** True while the testing switch in story.ts is on: nothing is locked. */
    get testUnlock () { return UNLOCK_ALL_FOR_TESTING; },
    /** Lessons open one at a time; the testing switch opens them all. */
    canPlay: (levelIndex: number) => UNLOCK_ALL_FOR_TESTING || levelIndex < data.levelIndex,
    get finaleOpen () { return UNLOCK_ALL_FOR_TESTING || data.levelIndex >= STORY.levels.length; },

    /** Poem token index of the clue a level awards (undefined if the poem is too short). */
    clueTokenIndex: (levelIndex: number): number | undefined => data.wordPlan[levelIndex],

    /** The clue word a level awards, whether or not it has been earned yet. */
    clueFor (levelIndex: number)
    {
        const index = data.wordPlan[levelIndex];
        return index === undefined ? undefined : poemTokens()[index]?.word;
    },

    /** The clue word if this level has been won, otherwise undefined. */
    earnedClue: (levelIndex: number): string | undefined => data.words[STORY.levels[levelIndex]?.id],

    /** Token indexes of all earned clues, i.e. the blanks of the final poem (all planned clues while testing). */
    earnedTokenIndexes: () => STORY.levels.flatMap((level, i) =>
        (UNLOCK_ALL_FOR_TESTING || level.id in data.words) && data.wordPlan[i] !== undefined ? [data.wordPlan[i]] : []),

    completeLevel (levelIndex: number)
    {
        const word = progress.clueFor(levelIndex);
        if (word) data.words[STORY.levels[levelIndex].id] = word;
        data.levelIndex = Math.max(data.levelIndex, levelIndex + 1);
        persist();
    },

    markFinished ()
    {
        if (data.finished) return;
        data.finished = true;
        persist();
    },

    reset ()
    {
        data = fresh();
        persist();
    }
};
