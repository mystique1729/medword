// ============================================================
// DESIGN: "Vital Signs" — Clinical Light + Rich Accents
// Core game types and state definitions
// ============================================================

export interface Player {
  id: string;
  name: string;
}

export interface Team {
  id: string;
  name: string;
  color: TeamColor;
  players: Player[];
  score: number;
}

export type TeamColor = 'blue' | 'teal' | 'amber' | 'crimson' | 'purple' | 'orange';

export const TEAM_COLORS: Record<TeamColor, { bg: string; border: string; text: string; glow: string; hex: string }> = {
  blue:    { bg: 'bg-blue-100',    border: 'border-blue-600',   text: 'text-blue-700',   glow: 'glow-cyan',    hex: '#1D4ED8' },
  teal:    { bg: 'bg-teal-100',    border: 'border-teal-600',   text: 'text-teal-700',   glow: 'glow-green',   hex: '#0F766E' },
  amber:   { bg: 'bg-emerald-100', border: 'border-emerald-700', text: 'text-emerald-800', glow: 'glow-green',  hex: '#065F46' },
  crimson: { bg: 'bg-red-100',     border: 'border-red-600',    text: 'text-red-700',    glow: 'glow-crimson', hex: '#B91C1C' },
  purple:  { bg: 'bg-purple-100',  border: 'border-purple-600', text: 'text-purple-700', glow: '',             hex: '#7C3AED' },
  orange:  { bg: 'bg-orange-100',  border: 'border-orange-600', text: 'text-orange-700', glow: '',             hex: '#C2410C' },
};

export const AVAILABLE_COLORS: TeamColor[] = ['blue', 'teal', 'amber', 'crimson', 'purple', 'orange'];

export interface MovieHint {
  movie: string;
  actor: string;
}

export interface DiseaseWord {
  id: string;
  phrase: string; // can be multi-word with spaces
  hint?: string;
  movies?: MovieHint[]; // associated Bollywood movies/actors
  bonusPoints?: number; // if set, overrides scoreConfig.pointsForWord for this word
  isDemo?: boolean; // if true, this word is the demo round — no points awarded
}

export interface ScoreConfig {
  pointsPerLetter: number;
  pointsForWord: number;
  pointsPerMovie: number;  // bonus for guessing the movie name
  pointsPerActor: number;  // bonus for guessing the actor name
  timerSeconds: number; // 0 = disabled
}

export interface GameSettings {
  gameName: string; // defaults to 'MEDWORD' if not set
  teams: Team[];
  diseases: DiseaseWord[];
  scoreConfig: ScoreConfig;
}

export type GamePhase =
  | 'setup'        // game master setting up
  | 'playing'      // active round
  | 'word-solved'  // brief celebration before next word
  | 'bonus-round'  // movie/actor bonus guessing after word solved
  | 'game-over';   // final scores

export interface RoundState {
  wordIndex: number;
  currentTeamIndex: number;
  guessedLetters: string[]; // consonants only
  wordRevealed: boolean;
  wrongGuesses: string[];
  timerKey: number; // incremented to reset the countdown
  solvedWordIndices: number[]; // indices of words that have been fully solved
  solvedByTeamId: Record<number, string>; // wordIndex → teamId that solved it
}

export interface FloatingScore {
  id: string;
  teamId: string;
  value: number;
  x: number;
  y: number;
}

export const VOWELS = new Set(['A', 'E', 'I', 'O', 'U']);

// Fixed demo word — always prepended at game start, awards 0 points
export const DEMO_WORD: DiseaseWord = {
  id: '__demo__',
  phrase: 'ALCOHOLISM',
  hint: 'Chronic dependence on alcohol',
  isDemo: true,
  movies: [
    { movie: 'DEVDAS', actor: 'SHAHRUKH KHAN' },
    { movie: 'SHARABI', actor: 'AMITABH BACHCHAN' },
  ],
};

export const DEFAULT_DISEASES: DiseaseWord[] = [
  {
    id: '1',
    phrase: 'MULTIPLE SCLEROSIS',
    hint: 'Autoimmune disease affecting the nervous system',
    movies: [{ movie: 'GURU', actor: 'VIDYA BALAN' }],
  },
  {
    id: '2',
    phrase: 'SCHIZOPHRENIA',
    hint: 'Chronic mental disorder with hallucinations and delusions',
    movies: [{ movie: 'KARTIK CALLING KARTIK', actor: 'FARHAN AKHTAR' }],
  },
  {
    id: '3',
    phrase: 'ASPERGERS SYNDROME',
    hint: 'Autism spectrum condition affecting social interaction',
    movies: [{ movie: 'MY NAME IS KHAN', actor: 'SHAHRUKH KHAN' }],
  },
  {
    id: '4',
    phrase: 'LYMPHOSARCOMA OF INTESTINE',
    hint: 'Malignant lymphoma of the gut',
    movies: [{ movie: 'ANAND', actor: 'RAJESH KHANNA' }],
  },
  {
    id: '5',
    phrase: 'PROGERIA',
    hint: 'Rare genetic disorder causing rapid aging in children',
    movies: [{ movie: 'PAA', actor: 'AMITABH BACHCHAN' }],
  },
  {
    id: '6',
    phrase: 'ANTEROGRADE AMNESIA',
    hint: 'Inability to form new memories after brain injury',
    movies: [{ movie: 'GHAJINI', actor: 'AAMIR KHAN' }],
  },
  {
    id: '7',
    phrase: 'ALZHEIMERS DISEASE',
    hint: 'Progressive memory loss and cognitive decline',
    movies: [
      { movie: 'U ME AUR HUM', actor: 'KAJOL' },
      { movie: 'SAIYYARA', actor: 'ANEET PADDA' },
    ],
  },
  {
    id: '8',
    phrase: 'CEREBRAL PALSY',
    hint: 'Movement disorder caused by brain damage at birth',
    movies: [{ movie: 'MARGARITA WITH A STRAW', actor: 'KALKI KOECHLIN' }],
  },
  {
    id: '9',
    phrase: 'DYSLEXIA',
    hint: 'Learning disability affecting reading and writing',
    movies: [{ movie: 'TAARE ZAMEEN PAR', actor: 'DARSHEEL SAFARY' }],
  },
  {
    id: '10',
    phrase: 'AUTISM',
    hint: 'Neurodevelopmental condition affecting communication',
    movies: [{ movie: 'BARFI', actor: 'PRIYANKA CHOPRA' }],
  },
];

export const DEFAULT_SCORE_CONFIG: ScoreConfig = {
  pointsPerLetter: 10,
  pointsForWord: 50,
  pointsPerMovie: 10,
  pointsPerActor: 10,
  timerSeconds: 0, // default: no timer
};
