import { STORY } from '../config/story';

export interface PoemToken
{
    /** Index over the whole poem, stable as long as the poem text doesn't change. */
    index: number;
    line: number;
    /** The word as written, including punctuation ("gönlümde,"). */
    text: string;
    /** The bare word ("gönlümde"), used for clues. */
    word: string;
}

const MIN_CLUE_LETTERS = 3;

export const trLower = (s: string) => s.toLocaleLowerCase('tr-TR');
export const trUpper = (s: string) => s.toLocaleUpperCase('tr-TR');

export function poemTokens (): PoemToken[]
{
    const tokens: PoemToken[] = [];
    STORY.finale.poem.forEach((line, lineIndex) =>
    {
        for (const text of line.split(/\s+/).filter(Boolean))
        {
            // Keep apostrophes inside words (Allah'ın), drop surrounding punctuation
            const word = text.replace(/^[^\p{L}]+|[^\p{L}]+$/gu, '');
            tokens.push({ index: tokens.length, line: lineIndex, text, word });
        }
    });
    return tokens;
}

/** Tokens that may become clues: long enough, and only the first occurrence of each word. */
export function clueCandidates (): PoemToken[]
{
    const seen = new Set<string>();
    return poemTokens().filter(t =>
    {
        const key = trLower(t.word);
        if ([...t.word].length < MIN_CLUE_LETTERS || seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}
