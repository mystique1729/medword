// ============================================================
// DESIGN: "Vital Signs" — Game state context
// Central state management for MedWord game
// ============================================================

import React, { createContext, useContext, useReducer } from 'react';
import { nanoid } from 'nanoid';
import {
  DEFAULT_DISEASES,
  DEFAULT_SCORE_CONFIG,
  DiseaseWord,
  FloatingScore,
  GamePhase,
  GameSettings,
  MovieHint,
  RoundState,
  ScoreConfig,
  Team,
  TeamColor,
  VOWELS,
} from '@/lib/gameTypes';
import {
  playCorrectLetter,
  playGameOver,
  playScoreAwarded,
  playScoreDeducted,
  playTurnChange,
  playWordSolved,
  playWrongGuess,
} from '@/lib/sounds';

interface GameState {
  phase: GamePhase;
  settings: GameSettings;
  round: RoundState;
  floatingScores: FloatingScore[];
  flashWrong: boolean;
  flashCorrect: boolean;
  setupStep: 'teams' | 'words' | 'scoring' | 'ready';
}

type Action =
  | { type: 'SET_SETUP_STEP'; step: GameState['setupStep'] }
  | { type: 'ADD_TEAM' }
  | { type: 'REMOVE_TEAM'; teamId: string }
  | { type: 'UPDATE_TEAM'; teamId: string; updates: Partial<Team> }
  | { type: 'ADD_PLAYER'; teamId: string }
  | { type: 'REMOVE_PLAYER'; teamId: string; playerId: string }
  | { type: 'UPDATE_PLAYER'; teamId: string; playerId: string; name: string }
  | { type: 'SET_DISEASES'; diseases: DiseaseWord[] }
  | { type: 'UPDATE_DISEASE'; id: string; phrase: string; hint: string; movies?: MovieHint[] }
  | { type: 'ADD_DISEASE' }
  | { type: 'REMOVE_DISEASE'; id: string }
  | { type: 'SET_SCORE_CONFIG'; config: ScoreConfig }
  | { type: 'UPDATE_GAME_NAME'; name: string }
  | { type: 'TIMER_EXPIRED' }
  | { type: 'START_GAME' }
  | { type: 'GUESS_LETTER'; letter: string }
  | { type: 'GUESS_WORD'; correct: boolean }
  | { type: 'AWARD_POINTS'; teamId: string; points: number; x?: number; y?: number }
  | { type: 'NEXT_WORD' }
  | { type: 'PREV_WORD' }                                          // go back to previous word
  | { type: 'REPLAY_WORD' }                                        // replay current word from scratch
  | { type: 'SCRAP_WORD' }                                         // skip/remove current word from play
  | { type: 'ADD_BONUS_WORD'; phrase: string; hint: string; bonusPoints: number } // add bonus word mid-game
  | { type: 'ENTER_BONUS_ROUND' }  // enter movie/actor bonus round after word solved
  | { type: 'SKIP_BONUS_ROUND' }   // skip bonus round and go to next word
  | { type: 'NEXT_TEAM' }
  | { type: 'REMOVE_FLOATING_SCORE'; id: string }
  | { type: 'CLEAR_FLASH' }
  | { type: 'FORCE_END_GAME' }  // GM ends game early with current scores
  | { type: 'RESET_GAME' };

const TEAM_NAMES = ['Team Alpha', 'Team Beta', 'Team Gamma', 'Team Delta', 'Team Epsilon', 'Team Zeta'];
const TEAM_COLORS_LIST: TeamColor[] = ['blue', 'teal', 'amber', 'crimson', 'purple', 'orange'];

function makeTeam(index: number): Team {
  return {
    id: nanoid(),
    name: TEAM_NAMES[index] || `Team ${index + 1}`,
    color: TEAM_COLORS_LIST[index % TEAM_COLORS_LIST.length],
    players: [{ id: nanoid(), name: '' }],
    score: 0,
  };
}

const initialSettings: GameSettings = {
  gameName: 'MEDWORD',
  teams: [makeTeam(0), makeTeam(1), makeTeam(2), makeTeam(3)],
  diseases: DEFAULT_DISEASES,
  scoreConfig: DEFAULT_SCORE_CONFIG,
};

const initialRound: RoundState = {
  wordIndex: 0,
  currentTeamIndex: 0,
  guessedLetters: [],
  wordRevealed: false,
  wrongGuesses: [],
  timerKey: 0,
  solvedWordIndices: [],
  solvedByTeamId: {},
};

const initialState: GameState = {
  phase: 'setup',
  settings: initialSettings,
  round: initialRound,
  floatingScores: [],
  flashWrong: false,
  flashCorrect: false,
  setupStep: 'teams',
};

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'SET_SETUP_STEP':
      return { ...state, setupStep: action.step };

    case 'ADD_TEAM': {
      const idx = state.settings.teams.length;
      if (idx >= 6) return state;
      return {
        ...state,
        settings: {
          ...state.settings,
          teams: [...state.settings.teams, makeTeam(idx)],
        },
      };
    }

    case 'REMOVE_TEAM': {
      if (state.settings.teams.length <= 2) return state;
      return {
        ...state,
        settings: {
          ...state.settings,
          teams: state.settings.teams.filter(t => t.id !== action.teamId),
        },
      };
    }

    case 'UPDATE_TEAM': {
      return {
        ...state,
        settings: {
          ...state.settings,
          teams: state.settings.teams.map(t =>
            t.id === action.teamId ? { ...t, ...action.updates } : t
          ),
        },
      };
    }

    case 'ADD_PLAYER': {
      return {
        ...state,
        settings: {
          ...state.settings,
          teams: state.settings.teams.map(t =>
            t.id === action.teamId
              ? { ...t, players: [...t.players, { id: nanoid(), name: '' }] }
              : t
          ),
        },
      };
    }

    case 'REMOVE_PLAYER': {
      return {
        ...state,
        settings: {
          ...state.settings,
          teams: state.settings.teams.map(t =>
            t.id === action.teamId
              ? { ...t, players: t.players.filter(p => p.id !== action.playerId) }
              : t
          ),
        },
      };
    }

    case 'UPDATE_PLAYER': {
      return {
        ...state,
        settings: {
          ...state.settings,
          teams: state.settings.teams.map(t =>
            t.id === action.teamId
              ? {
                  ...t,
                  players: t.players.map(p =>
                    p.id === action.playerId ? { ...p, name: action.name } : p
                  ),
                }
              : t
          ),
        },
      };
    }

    case 'SET_DISEASES':
      return { ...state, settings: { ...state.settings, diseases: action.diseases } };

    case 'UPDATE_DISEASE':
      return {
        ...state,
        settings: {
          ...state.settings,
          diseases: state.settings.diseases.map(d =>
            d.id === action.id
              ? { ...d, phrase: action.phrase.toUpperCase(), hint: action.hint, movies: action.movies }
              : d
          ),
        },
      };

    case 'ADD_DISEASE':
      return {
        ...state,
        settings: {
          ...state.settings,
          diseases: [
            ...state.settings.diseases,
            { id: nanoid(), phrase: '', hint: '', movies: [] },
          ],
        },
      };

    case 'REMOVE_DISEASE':
      return {
        ...state,
        settings: {
          ...state.settings,
          diseases: state.settings.diseases.filter(d => d.id !== action.id),
        },
      };

    case 'SET_SCORE_CONFIG':
      return { ...state, settings: { ...state.settings, scoreConfig: action.config } };

    case 'UPDATE_GAME_NAME':
      // Force uppercase, allow spaces, trim only for empty check
      return { ...state, settings: { ...state.settings, gameName: action.name.toUpperCase() || 'MEDWORD' } };

    case 'TIMER_EXPIRED': {
      // Only act if game is actively playing (not word-solved overlay)
      if (state.phase !== 'playing') return state;
      playTurnChange();
      return {
        ...state,
        round: {
          ...state.round,
          currentTeamIndex: (state.round.currentTeamIndex + 1) % state.settings.teams.length,
          timerKey: state.round.timerKey + 1,
        },
        flashWrong: true,
      };
    }

    case 'START_GAME': {
      // Start at the first valid (non-empty) disease
      const firstValidIndex = state.settings.diseases.findIndex(d => d.phrase.trim());
      return {
        ...state,
        phase: 'playing',
        round: {
          wordIndex: firstValidIndex >= 0 ? firstValidIndex : 0,
          currentTeamIndex: 0,
          guessedLetters: [],
          wordRevealed: false,
          wrongGuesses: [],
          timerKey: 0,
          solvedWordIndices: [],
          solvedByTeamId: {},
        },
      };
    }

    case 'GUESS_LETTER': {
      const letter = action.letter.toUpperCase();
      if (VOWELS.has(letter)) return state;
      if (state.round.guessedLetters.includes(letter)) return state;

      const currentWord = state.settings.diseases[state.round.wordIndex]?.phrase.toUpperCase() || '';
      const isCorrect = currentWord.includes(letter);

      const newGuessedLetters = [...state.round.guessedLetters, letter];
      const newWrongGuesses = isCorrect
        ? state.round.wrongGuesses
        : [...state.round.wrongGuesses, letter];

      // Check if all consonants in the word are now guessed
      const wordLetters = currentWord.replace(/\s/g, '').split('');
      const allConsonantsGuessed = wordLetters
        .filter(l => !VOWELS.has(l))
        .every(l => newGuessedLetters.includes(l));

      let newState = {
        ...state,
        round: {
          ...state.round,
          guessedLetters: newGuessedLetters,
          wrongGuesses: newWrongGuesses,
          currentTeamIndex: isCorrect
            ? state.round.currentTeamIndex
            : (state.round.currentTeamIndex + 1) % state.settings.teams.length,
          // Reset timer on every letter guess (correct keeps same team, wrong passes turn)
          timerKey: state.round.timerKey + 1,
        },
        flashWrong: !isCorrect,
        flashCorrect: isCorrect,
      };

      if (isCorrect) {
        // Award points for the letter
        const currentTeam = state.settings.teams[state.round.currentTeamIndex];
        newState = {
          ...newState,
          settings: {
            ...newState.settings,
            teams: newState.settings.teams.map(t =>
              t.id === currentTeam.id
                ? { ...t, score: t.score + state.settings.scoreConfig.pointsPerLetter }
                : t
            ),
          },
        };
        playCorrectLetter();
      } else {
        playWrongGuess();
      }

      // If all consonants guessed, reveal the word automatically
      if (allConsonantsGuessed) {
        newState = { ...newState, round: { ...newState.round, wordRevealed: true } };
      }

      return newState;
    }

    case 'GUESS_WORD': {
      if (action.correct) {
        const currentTeam = state.settings.teams[state.round.currentTeamIndex];
        const currentDisease = state.settings.diseases[state.round.wordIndex];
        // Sliding bonus: full bonus when 0 consonants guessed, 0 bonus when only 1 consonant remains
        // For bonus words, use their fixed bonusPoints directly (no sliding)
        let wordPoints: number;
        if (currentDisease?.bonusPoints !== undefined) {
          wordPoints = currentDisease.bonusPoints;
        } else {
          const phrase = (currentDisease?.phrase || '').toUpperCase();
          const totalConsonants = phrase.replace(/\s/g, '').split('').filter(l => !VOWELS.has(l)).length;
          const guessedConsonants = state.round.guessedLetters.length;
          const remainingConsonants = Math.max(0, totalConsonants - guessedConsonants);
          // Bonus slides from pointsForWord (0 guessed) to 0 (1 remaining)
          // When remainingConsonants === 1 → bonus = 0
          // When remainingConsonants === totalConsonants → bonus = pointsForWord
          const baseBonus = state.settings.scoreConfig.pointsForWord;
          const fraction = totalConsonants <= 1 ? 0 : Math.max(0, (remainingConsonants - 1) / (totalConsonants - 1));
          wordPoints = Math.round(baseBonus * fraction);
        }
        const newTeams = state.settings.teams.map(t =>
          t.id === currentTeam.id
            ? { ...t, score: t.score + wordPoints }
            : t
        );
        // Next word starts from the team AFTER the one that solved it (round-robin)
        const nextTeamIndex = (state.round.currentTeamIndex + 1) % state.settings.teams.length;
        // Record this word index as solved
        const newSolvedIndices = state.round.solvedWordIndices.includes(state.round.wordIndex)
          ? state.round.solvedWordIndices
          : [...state.round.solvedWordIndices, state.round.wordIndex];
        const newSolvedByTeamId = {
          ...state.round.solvedByTeamId,
          [state.round.wordIndex]: currentTeam.id,
        };
        playWordSolved();
        // Check if this disease has movies — if so, go to bonus-round after word-solved
        const hasBonusRound = !!(currentDisease?.movies && currentDisease.movies.length > 0);
        return {
          ...state,
          phase: hasBonusRound ? 'bonus-round' : 'word-solved',
          settings: { ...state.settings, teams: newTeams },
          round: {
            ...state.round,
            wordRevealed: true,
            // Store the next team index so NEXT_WORD picks it up
            currentTeamIndex: nextTeamIndex,
            solvedWordIndices: newSolvedIndices,
            solvedByTeamId: newSolvedByTeamId,
          },
          flashCorrect: true,
        };
      } else {
        // Wrong word guess — pass turn
        playWrongGuess();
        return {
          ...state,
          round: {
            ...state.round,
            currentTeamIndex: (state.round.currentTeamIndex + 1) % state.settings.teams.length,
            timerKey: state.round.timerKey + 1,
          },
          flashWrong: true,
        };
      }
    }

    case 'AWARD_POINTS': {
      const floatingId = nanoid();
      const newTeams = state.settings.teams.map(t =>
        t.id === action.teamId ? { ...t, score: Math.max(0, t.score + action.points) } : t
      );
      if (action.points > 0) playScoreAwarded();
      else playScoreDeducted();
      return {
        ...state,
        settings: { ...state.settings, teams: newTeams },
        floatingScores: [
          ...state.floatingScores,
          {
            id: floatingId,
            teamId: action.teamId,
            value: action.points,
            x: action.x || 50,
            y: action.y || 50,
          },
        ],
      };
    }

    case 'NEXT_WORD': {
      // Find the next valid disease after current wordIndex
      let nextWordIndex = -1;
      for (let i = state.round.wordIndex + 1; i < state.settings.diseases.length; i++) {
        if (state.settings.diseases[i].phrase.trim()) {
          nextWordIndex = i;
          break;
        }
      }
      if (nextWordIndex === -1) {
        playGameOver();
        return { ...state, phase: 'game-over' };
      }
      const nextAlreadySolved = state.round.solvedWordIndices.includes(nextWordIndex);
      const nextPhrase = state.settings.diseases[nextWordIndex]?.phrase.toUpperCase() || '';
      // If already solved, restore all consonants as guessed so the word shows fully
      const nextGuessedLetters = nextAlreadySolved
        ? Array.from(new Set(nextPhrase.replace(/\s/g, '').split('').filter(l => !VOWELS.has(l))))
        : [];
      playTurnChange();
      return {
        ...state,
        phase: 'playing',
        round: {
          wordIndex: nextWordIndex,
          // Preserve the currentTeamIndex set by GUESS_WORD for round-robin continuity
          currentTeamIndex: state.round.currentTeamIndex,
          guessedLetters: nextGuessedLetters,
          wordRevealed: nextAlreadySolved,
          wrongGuesses: [],
          timerKey: state.round.timerKey + 1,
          solvedWordIndices: state.round.solvedWordIndices,
          solvedByTeamId: state.round.solvedByTeamId,
        },
        flashWrong: false,
        flashCorrect: false,
      };
    }

    case 'PREV_WORD': {
      // Find the previous valid disease before current wordIndex
      let prevWordIndex = -1;
      for (let i = state.round.wordIndex - 1; i >= 0; i--) {
        if (state.settings.diseases[i].phrase.trim()) {
          prevWordIndex = i;
          break;
        }
      }
      if (prevWordIndex === -1) return state; // already at first word
      const prevAlreadySolved = state.round.solvedWordIndices.includes(prevWordIndex);
      const prevPhrase = state.settings.diseases[prevWordIndex]?.phrase.toUpperCase() || '';
      const prevGuessedLetters = prevAlreadySolved
        ? Array.from(new Set(prevPhrase.replace(/\s/g, '').split('').filter(l => !VOWELS.has(l))))
        : [];
      playTurnChange();
      return {
        ...state,
        phase: 'playing',
        round: {
          wordIndex: prevWordIndex,
          currentTeamIndex: state.round.currentTeamIndex,
          guessedLetters: prevGuessedLetters,
          wordRevealed: prevAlreadySolved,
          wrongGuesses: [],
          timerKey: state.round.timerKey + 1,
          solvedWordIndices: state.round.solvedWordIndices,
          solvedByTeamId: state.round.solvedByTeamId,
        },
        flashWrong: false,
        flashCorrect: false,
      };
    }

    case 'REPLAY_WORD': {
      // Reset current word — also un-marks it as solved so it can be played again
      const unsolvedIndices = state.round.solvedWordIndices.filter(i => i !== state.round.wordIndex);
      const unsolvedByTeamId = { ...state.round.solvedByTeamId };
      delete unsolvedByTeamId[state.round.wordIndex];
      playTurnChange();
      return {
        ...state,
        phase: 'playing',
        round: {
          ...state.round,
          guessedLetters: [],
          wordRevealed: false,
          wrongGuesses: [],
          timerKey: state.round.timerKey + 1,
          solvedWordIndices: unsolvedIndices,
          solvedByTeamId: unsolvedByTeamId,
        },
        flashWrong: false,
        flashCorrect: false,
      };
    }

    case 'SCRAP_WORD': {
      // Mark current word as scrapped by clearing its phrase, then advance
      const scrappedDiseases = state.settings.diseases.map((d, i) =>
        i === state.round.wordIndex ? { ...d, phrase: '', hint: '[SCRAPPED]' } : d
      );
      // Find next valid word
      let nextAfterScrap = -1;
      for (let i = state.round.wordIndex + 1; i < scrappedDiseases.length; i++) {
        if (scrappedDiseases[i].phrase.trim()) {
          nextAfterScrap = i;
          break;
        }
      }
      if (nextAfterScrap === -1) {
        playGameOver();
        return {
          ...state,
          phase: 'game-over',
          settings: { ...state.settings, diseases: scrappedDiseases },
        };
      }
      const scrapNextAlreadySolved = state.round.solvedWordIndices.includes(nextAfterScrap);
      const scrapNextPhrase = scrappedDiseases[nextAfterScrap]?.phrase.toUpperCase() || '';
      const scrapNextGuessed = scrapNextAlreadySolved
        ? Array.from(new Set(scrapNextPhrase.replace(/\s/g, '').split('').filter(l => !VOWELS.has(l))))
        : [];
      playTurnChange();
      return {
        ...state,
        phase: 'playing',
        settings: { ...state.settings, diseases: scrappedDiseases },
        round: {
          wordIndex: nextAfterScrap,
          currentTeamIndex: state.round.currentTeamIndex,
          guessedLetters: scrapNextGuessed,
          wordRevealed: scrapNextAlreadySolved,
          wrongGuesses: [],
          timerKey: state.round.timerKey + 1,
          solvedWordIndices: state.round.solvedWordIndices,
          solvedByTeamId: state.round.solvedByTeamId,
        },
        flashWrong: false,
        flashCorrect: false,
      };
    }

    case 'ADD_BONUS_WORD': {
      // Insert a bonus word right after the current word index
      const bonusId = nanoid();
      const newDiseases = [
        ...state.settings.diseases.slice(0, state.round.wordIndex + 1),
        {
          id: bonusId,
          phrase: action.phrase.toUpperCase(),
          hint: action.hint,
          bonusPoints: action.bonusPoints,
        },
        ...state.settings.diseases.slice(state.round.wordIndex + 1),
      ];
      return {
        ...state,
        settings: { ...state.settings, diseases: newDiseases },
      };
    }

    case 'ENTER_BONUS_ROUND': {
      // Transition from word-solved to bonus-round phase
      return { ...state, phase: 'bonus-round' };
    }

    case 'SKIP_BONUS_ROUND': {
      // Skip bonus round — go directly to next word (same as NEXT_WORD)
      let nextWordIndex = -1;
      for (let i = state.round.wordIndex + 1; i < state.settings.diseases.length; i++) {
        if (state.settings.diseases[i].phrase.trim()) {
          nextWordIndex = i;
          break;
        }
      }
      if (nextWordIndex === -1) {
        playGameOver();
        return { ...state, phase: 'game-over' };
      }
      const skipNextAlreadySolved = state.round.solvedWordIndices.includes(nextWordIndex);
      const skipNextPhrase = state.settings.diseases[nextWordIndex]?.phrase.toUpperCase() || '';
      const skipNextGuessed = skipNextAlreadySolved
        ? Array.from(new Set(skipNextPhrase.replace(/\s/g, '').split('').filter(l => !VOWELS.has(l))))
        : [];
      playTurnChange();
      return {
        ...state,
        phase: 'playing',
        round: {
          wordIndex: nextWordIndex,
          currentTeamIndex: state.round.currentTeamIndex,
          guessedLetters: skipNextGuessed,
          wordRevealed: skipNextAlreadySolved,
          wrongGuesses: [],
          timerKey: state.round.timerKey + 1,
          solvedWordIndices: state.round.solvedWordIndices,
          solvedByTeamId: state.round.solvedByTeamId,
        },
        flashWrong: false,
        flashCorrect: false,
      };
    }

    case 'NEXT_TEAM': {
      playTurnChange();
      return {
        ...state,
        round: {
          ...state.round,
          currentTeamIndex: (state.round.currentTeamIndex + 1) % state.settings.teams.length,
          timerKey: state.round.timerKey + 1,
        },
      };
    }

    case 'REMOVE_FLOATING_SCORE':
      return {
        ...state,
        floatingScores: state.floatingScores.filter(f => f.id !== action.id),
      };

    case 'CLEAR_FLASH':
      return { ...state, flashWrong: false, flashCorrect: false };

    case 'FORCE_END_GAME':
      playGameOver();
      return { ...state, phase: 'game-over' };

    case 'RESET_GAME':
      return {
        ...initialState,
        settings: {
          ...state.settings,
          teams: state.settings.teams.map(t => ({ ...t, score: 0 })),
        },
        setupStep: 'teams',
      };

    default:
      return state;
  }
}

interface GameContextValue {
  state: GameState;
  dispatch: React.Dispatch<Action>;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return <GameContext.Provider value={{ state, dispatch }}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
