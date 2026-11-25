/**
 * Tiny synthesized sound effects (Web Audio), so the game has audio without any files.
 *
 * To use real sound files instead: put them in public/assets/audio, load them in
 * scenes/Boot.ts with `this.load.audio('coin', 'audio/coin.mp3')`, and replace the
 * body of the matching function below with `game.sound.play('coin')`.
 */
const MUTE_KEY = 'classroom-quest:muted';

let ctx: AudioContext | null = null;
let muted = localStorage.getItem(MUTE_KEY) === '1';

function tone (freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.12, delay = 0)
{
    if (muted) return;

    // Browsers only allow audio after a user gesture; every sound here follows a tap.
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();

    const start = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + duration);
}

const melody = (notes: number[], step: number, type: OscillatorType = 'triangle') =>
    notes.forEach((f, i) => tone(f, step * 1.6, type, 0.12, i * step));

export const sfx = {
    tap: () => tone(660, 0.08, 'triangle', 0.08),
    flip: () => tone(420, 0.07, 'square', 0.04),
    coin: () => { tone(988, 0.08, 'square', 0.05); tone(1319, 0.15, 'square', 0.05, 0.06); },
    good: () => melody([660, 880], 0.07),
    bad: () => tone(160, 0.3, 'sawtooth', 0.08),
    secret: () => melody([784, 988, 1175, 1568], 0.09, 'sine'),
    win: () => melody([523, 659, 784, 1047], 0.12),
    lose: () => melody([392, 330, 262], 0.16),
    bloom: () => melody([523, 659, 784, 988, 1175], 0.1, 'sine'),

    /** Says a word with the browser's built-in voice (Turkish if available); a chirp otherwise. */
    speak (text: string)
    {
        if (muted) return;
        const synth = window.speechSynthesis;
        if (!synth || typeof SpeechSynthesisUtterance === 'undefined')
        {
            melody([440, 660], 0.1, 'sine');
            return;
        }
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'tr-TR';
        utterance.rate = 0.9;
        synth.cancel();
        synth.speak(utterance);
    },

    get muted () { return muted; },
    toggleMute ()
    {
        muted = !muted;
        localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
        return muted;
    }
};

/** Short haptic buzz on phones that support it (Android). No-op elsewhere. */
export const vibrate = (ms: number | number[]) => navigator.vibrate?.(ms);
