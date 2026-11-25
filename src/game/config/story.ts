import type { AssetKey } from './assets';
import type { MemorySettings } from '../scenes/minigames/MemoryGame';
import type { TapRushSettings } from '../scenes/minigames/TapRushGame';
import type { CatchSettings } from '../scenes/minigames/CatchGame';
import type { MazeSettings } from '../scenes/minigames/MazeGame';
import type { SlidePuzzleSettings } from '../scenes/minigames/SlidePuzzleGame';
import type { RecipeSettings } from '../scenes/minigames/RecipeGame';
import type { QuizSettings } from '../scenes/minigames/QuizGame';
import type { ProverbSettings } from '../scenes/minigames/ProverbGame';

/**
 * STORY & LEVELS: every player-facing text, the order of the challenges, their difficulty,
 * the poem and the final message. This is the main file to personalise the game.
 *
 * - Reorder `levels` to change the challenge order. Add a level by copying an entry.
 * - Winning a level awards one random word of `finale.poem` as a clue (picked anew for every
 *   playthrough). In the final lesson those words are blanked out and the player fills them in.
 * - Difficulty lives in each level's `settings` (time limits, goals, speeds, questions...).
 */
interface LevelBase
{
    /** Unique id. */
    id: string;
    /** Short name written on the chalkboard and shown in the challenge. */
    title: string;
    /** What the teacher writes on the board for the class. */
    question: string;
    /** What the clueless students reply (one bubble each, in order). */
    studentReplies: string[];
    /** The teacher gives up waiting and takes the challenge herself. */
    teacherReply: string;
    /** Instructions shown before the challenge starts. Keep it to one or two sentences. */
    howToPlay: string;
    /** Optional background texture for the challenge (defaults to the chalkboard). */
    background?: AssetKey;
}

export type LevelDef = LevelBase & (
    | { scene: 'MemoryGame'; settings: MemorySettings }
    | { scene: 'TapRushGame'; settings: TapRushSettings }
    | { scene: 'CatchGame'; settings: CatchSettings }
    | { scene: 'MazeGame'; settings: MazeSettings }
    | { scene: 'SlidePuzzleGame'; settings: SlidePuzzleSettings }
    | { scene: 'RecipeGame'; settings: RecipeSettings }
    | { scene: 'QuizGame'; settings: QuizSettings }
    | { scene: 'ProverbGame'; settings: ProverbSettings }
);

const levels: LevelDef[] = [
    {
        id: 'memory',
        scene: 'MemoryGame',
        title: 'Hafıza',
        question: 'Zil çalmadan bütün eşleri kim bulabilir?',
        studentReplies: ['Iııı...', 'Gözlüğümü unuttum!', 'Zzz...'],
        teacherReply: 'Kimse mi? Peki, ben göstereyim!',
        howToPlay: 'Aynı anda iki kart çevir ve süre bitmeden bütün eşleri bul.',
        settings: {
            faces: ['face-apple', 'face-books', 'face-pencil', 'face-globe', 'face-backpack', 'face-flask', 'face-ruler', 'face-palette'],
            columns: 4,
            timeLimit: 90
        }
    },
    {
        id: 'tap-rush',
        scene: 'TapRushGame',
        title: 'Altın Yıldızlar',
        question: 'Kim 20 saniyede 30 altın yıldız toplayabilir?',
        studentReplies: ['İmkânsız!', 'Parmaklarım yoruldu...', 'Teneffüs yok mu?'],
        teacherReply: 'İzleyin ve öğrenin çocuklar!',
        howToPlay: 'Altın yıldıza olabildiğince hızlı dokun. Her dokunuşta yer değiştirir!',
        settings: {
            goal: 30,
            timeLimit: 20
        }
    },
    {
        id: 'healthy-choices',
        scene: 'CatchGame',
        title: 'Sağlıklı Seçimler',
        question: 'Bizim için neyin iyi, neyin kötü olduğunu kim bilir?',
        studentReplies: ['Pizza?', 'Bilgisayar oyunları!', 'Pasta sebze sayılır mı?'],
        teacherReply: 'Eyvah. Ben göstereyim!',
        howToPlay: 'Kovayı sürükle ve iyi şeyleri yakala. Kötü şeyler düşüp gitsin!',
        settings: {
            goal: 12,
            lives: 3,
            spawnEveryMs: 950,
            fallSpeed: [380, 620],
            items: [
                { texture: 'item-swim', label: 'Yüzme', good: true },
                { texture: 'item-read', label: 'Okuma', good: true },
                { texture: 'item-run', label: 'Koşu', good: true },
                { texture: 'item-music', label: 'Müzik', good: true },
                { texture: 'item-fruit', label: 'Meyve', good: true },
                { texture: 'item-alcohol', label: 'Alkol', good: false },
                { texture: 'item-pork', label: 'Domuz eti', good: false },
                { texture: 'item-smoke', label: 'Sigara', good: false }
            ]
        }
    },
    {
        id: 'maze',
        scene: 'MazeGame',
        title: 'Labirent',
        question: 'Labirentten çıkış yolunu kim bulabilir?',
        studentReplies: ['Ben kayboldum bile...', 'Haritası yok mu?', 'Ben burada kalayım.'],
        teacherReply: 'Kalbimin yolunu ben bulurum!',
        howToPlay: 'Parmağını sürükleyerek kalbi 🏁 çıkışına götür. Duvarlardan geçemezsin!',
        settings: {
            columns: 8,
            rows: 12,
            timeLimit: 75
        }
    },
    {
        id: 'slide-puzzle',
        scene: 'SlidePuzzleGame',
        title: 'Yapboz',
        question: 'Bu karışık resmi kim düzeltebilir?',
        studentReplies: ['Parçalar kayıp mı?', 'Çok zor!', 'Resim neydi ki?'],
        teacherReply: 'Sabır, çocuklar. Sabır!',
        howToPlay: 'Boşluğun yanındaki parçaya dokun, kaysın. Resmi tamamla! Üstteki küçük resim sana yol gösterir.',
        settings: {
            size: 3,
            shuffleMoves: 40,
            timeLimit: 600
        }
    },
    {
        id: 'recipe',
        scene: 'RecipeGame',
        title: 'Tarif Telaşı',
        question: 'Bu yemeklerin malzemelerini kim bilir?',
        studentReplies: ['Hazır çorba?', 'Onları annem yapıyor...', 'Ketçap her şeye gider!'],
        teacherReply: 'Mutfak benden sorulur!',
        howToPlay: 'Yemeğin bütün malzemelerine dokun. Yanlış malzeme süreden götürür!',
        settings: {
            dishesToWin: 4,
            timeLimit: 70,
            wrongPenalty: 4,
            /** Emoji + name of every ingredient. Dishes and decoys pick from this list. */
            ingredients: {
                'Yumurta': '🥚', 'Domates': '🍅', 'Biber': '🫑', 'Soğan': '🧅', 'Mercimek': '🫘',
                'Havuç': '🥕', 'Limon': '🍋', 'Patlıcan': '🍆', 'Kıyma': '🥩', 'Yufka': '🫓',
                'Ceviz': '🌰', 'Fıstık': '🥜', 'Tereyağı': '🧈', 'Şeker': '🍬', 'Zeytinyağı': '🫒',
                'Sarımsak': '🧄', 'Çikolata': '🍫', 'Muz': '🍌', 'Peynir': '🧀', 'Balık': '🐟',
                'Pirinç': '🍚', 'Çilek': '🍓', 'Patates': '🥔', 'Mantar': '🍄', 'Süt': '🥛', 'Elma': '🍎'
            },
            dishes: [
                { name: 'Menemen', emoji: '🍳', ingredients: ['Yumurta', 'Domates', 'Biber'] },
                { name: 'Mercimek çorbası', emoji: '🥣', ingredients: ['Mercimek', 'Soğan', 'Havuç'] },
                { name: 'Karnıyarık', emoji: '🍆', ingredients: ['Patlıcan', 'Kıyma', 'Domates', 'Biber'] },
                { name: 'Baklava', emoji: '🍯', ingredients: ['Yufka', 'Fıstık', 'Tereyağı', 'Şeker'] },
                { name: 'İmam bayıldı', emoji: '🍽️', ingredients: ['Patlıcan', 'Soğan', 'Sarımsak', 'Zeytinyağı'] }
            ]
        }
    },
    {
        id: 'quiz',
        scene: 'QuizGame',
        title: 'İlmihal Yarışması',
        question: 'İlmihal sorularını kim cevaplayabilir?',
        studentReplies: ['Ezberlemiştim ama...', 'İpucu verir misiniz?', 'Ben sonra söylerim.'],
        teacherReply: 'Dinleyin, bunu bilmeyen kalmasın!',
        howToPlay: 'Her soruda süre bitmeden doğru cevabı seç. Yeterince doğru yaparsan kazanırsın!',
        settings: {
            questionCount: 7,
            correctToWin: 5,
            secondsPerQuestion: 15,
            /** `answer` is the index of the right option (0 = first). Options are shuffled in game. */
            questions: [
                { q: 'Günde kaç vakit namaz kılınır?', options: ['5', '3', '4', '6'], answer: 0 },
                { q: 'İslam\'ın şartları kaç tanedir?', options: ['5', '4', '6', '7'], answer: 0 },
                { q: 'İmanın şartları kaç tanedir?', options: ['6', '5', '7', '8'], answer: 0 },
                { q: 'Abdestin farzları kaç tanedir?', options: ['4', '3', '5', '6'], answer: 0 },
                { q: 'Guslün farzları kaç tanedir?', options: ['3', '2', '4', '5'], answer: 0 },
                { q: 'Namazın farzları kaç tanedir?', options: ['12', '10', '8', '14'], answer: 0 },
                { q: 'Kur\'an-ı Kerim\'de kaç sure vardır?', options: ['114', '99', '110', '124'], answer: 0 },
                { q: 'Kur\'an-ı Kerim\'in ilk suresi hangisidir?', options: ['Fâtiha', 'Bakara', 'İhlâs', 'Nâs'], answer: 0 },
                { q: 'Kur\'an-ı Kerim\'in en uzun suresi hangisidir?', options: ['Bakara', 'Âl-i İmrân', 'Nisâ', 'Yâsîn'], answer: 0 },
                { q: 'Hangi ayda oruç tutmak farzdır?', options: ['Ramazan', 'Şaban', 'Recep', 'Muharrem'], answer: 0 },
                { q: 'Hac hangi ayda yapılır?', options: ['Zilhicce', 'Ramazan', 'Muharrem', 'Şevval'], answer: 0 },
                { q: 'Sabah namazı toplam kaç rekâttır?', options: ['4', '2', '3', '6'], answer: 0 },
                { q: 'Zekât, malın kaçta kaçıdır?', options: ['Kırkta biri', 'Onda biri', 'Beşte biri', 'Yüzde biri'], answer: 0 },
                { q: 'Peygamber Efendimiz (s.a.v.) hangi şehirde doğdu?', options: ['Mekke', 'Medine', 'Kudüs', 'Taif'], answer: 0 }
            ]
        }
    },
    {
        id: 'proverb',
        scene: 'ProverbGame',
        title: 'Atasözü Bilmecesi',
        question: 'Bu resimli bilmecedeki atasözünü kim bulabilir?',
        studentReplies: ['Bir artı el... eldiven mi?', 'Hiçbir şey anlamadım.', 'Konuşan kafa mı?'],
        teacherReply: 'Birlikte daha güçlüyüz, bakın!',
        howToPlay: 'Resimlere bak, kelimelere doğru sırayla dokun. Takılırsan ipucu al!',
        settings: {
            answer: 'Bir elin nesi var iki elin sesi var',
            decoys: ['yok', 'ayağın', 'sözü', 'gözün'],
            /** What the 🗣️ says when tapped. */
            soundHint: 'ses',
            /** Revealed one by one with the "İpucu al" button. */
            hints: ['Bir atasözü', 'İlk kelime: "Bir"', 'Bir elin nesi var...']
        }
    }
];

/** Small helper so templated texts stay here instead of in the scenes. */
type Fmt<T extends unknown[] = [string]> = (...args: T) => string;

/**
 * TESTING SWITCH. `true`: every lesson, the final lesson and the surprise can be opened from the
 * lesson list (tap the lesson counter, top left) without playing in order; a "TEST" badge shows.
 * Set it to `false` before giving the game away, so everything unlocks one lesson at a time.
 */
export const UNLOCK_ALL_FOR_TESTING = true;

export const STORY = {
    gameTitle: 'Ders\nBaşlıyor!',
    teacherName: 'Hocam',

    /** Lines used in the classroom between challenges. */
    classroom: {
        ask: 'Bunu kim yapabilir? Kimse yok mu?',
        cheers: ['Vay canına!', 'Harika!', 'Bana da öğretin!', 'En iyi öğretmen!'],
        afterWin: 'Gördünüz mü? Kolaymış! Sıradaki derse...'
    },

    /** Buttons, labels and messages shared by all scenes. */
    ui: {
        subtitle: ((name) => `${name} için küçük bir oyun`) as Fmt,
        start: 'Başla',
        continue: 'Devam',
        startOver: 'Baştan başla',
        tapToContinue: 'Devam etmek için dokun',
        lessonCounter: ((n, total) => `Ders ${n} / ${total}`) as Fmt<[number, number]>,
        lessonBoardTitle: ((n, title) => `${n}. Ders: ${title}`) as Fmt<[number, string]>,
        wellDone: 'Aferin!',
        takeChallenge: 'Ben yaparım!',
        openFinale: 'Son derse geç',
        lessonsTitle: 'Dersler',
        clue: ((word) => `İpucu: "${word}"`) as Fmt,

        // Challenge shell (BaseMinigame)
        startChallenge: 'Başla!',
        countdown: ['Hazır...', 'Başla!'],
        clueIntroNew: '🔑 Kazanırsan şiirden bir ipucu kelime alırsın!',
        clueIntroKnown: ((word) => `🔑 Bu dersin ipucu: "${word}"`) as Fmt,
        timeUp: 'Süre doldu!',
        winTitle: 'Görev tamam!',
        winMessage: ((word) => `İpucu kelimen:\n"${word}"`) as Fmt,
        loseMessage: 'Sınıf hâlâ izliyor...\nNasıl yapıldığını göster!',
        tryAgain: 'Tekrar dene',
        backToClass: 'Sınıfa dön',

        // Challenge specific
        catchNo: ((label) => `${label} olmaz!`) as Fmt,
        catchLost: 'Çok fazla kötü seçim!',
        mazeHint: 'Sürükle',
        slideMoves: ((n) => `Hamle: ${n}`) as Fmt<[number]>,
        recipeCounter: ((n, total) => `🍽 ${n} / ${total}`) as Fmt<[number, number]>,
        recipeDone: 'Afiyet olsun!',
        quizCounter: ((n, total) => `✓ ${n} / ${total}`) as Fmt<[number, number]>,
        quizQuestion: ((n, total) => `Soru ${n} / ${total}`) as Fmt<[number, number]>,
        quizLost: 'Yeterince doğru cevap yok!',
        proverbHintButton: 'İpucu al',
        proverbHints: ((n) => `💡 ${n}`) as Fmt<[number]>,
        proverbWrong: 'Olmadı, tekrar dene!',

        // Final lesson & surprise
        finaleLocked: 'Önce bütün dersleri bitir, sonra gel!',
        chapterDone: 'Bölüm bitti',
        surpriseButton: 'Sürpriz',
        translate: 'Çevir',
        original: 'Aslı',
        /** Shown once the game is finished: jump straight to the surprise, or back to replay lessons. */
        lastPage: '🎁 Son sayfa',
        replayLessons: 'Derslere dön',
        testBadge: '🔓 TEST'
    },

    levels,

    finale: {
        boardTitle: 'Son Ders',
        boardText: 'Şiirin kayıp kelimelerini bul',
        teacherLine: 'Çocuklar, her derste şiirimizden bir kelime topladık...',
        prompt: 'Kelimelere şiirdeki sırayla dokun.',
        /**
         * One entry per line. Clue words are picked from words with 3+ letters, so the poem needs
         * at least as many different such words as there are levels.
         */
        poem: [
            'Varlığınla renkler açtı gönlümde,',
            'Hep var ol, şu garip ömrümde.',
            'Her an seni düşünürüm, bilmem ki niye,',
            'Sen Allah\'ın verdiği bir emanetsin, ne büyük hediye.'
        ]
    },

    /**
     * The message on the surprise screen. `ottoman` is shown first (Arabic script, right to left);
     * "Çevir" switches to `modern`. Use \n for line breaks.
     * The default text is only an example: replace both with your own message.
     */
    surprise: {
        title: 'Sana bir mektup var',
        ottoman: 'سوگیلی خواجه‌م،\nایی کی وارسکز.\nبزه صبر و سوگی ایله یول گوستردکز.\nبو کوچوک اویون سزه بر تشکردر.',
        modern: 'Sevgili hocam,\niyi ki varsınız.\nBize sabır ve sevgi ile yol gösterdiniz.\nBu küçük oyun size bir teşekkürdür.'
    }
};
