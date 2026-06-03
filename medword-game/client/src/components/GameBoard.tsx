// ============================================================
// DESIGN: "Vital Signs" — Main game board
// Full-screen projected view with word tiles, teams, GM panel
// Custom points via a proper Dialog modal
// ============================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { useGame } from '@/contexts/GameContext';
import { TEAM_COLORS, VOWELS } from '@/lib/gameTypes';
import { playClick, playTurnChange } from '@/lib/sounds';
import { EcgHeader } from './EcgHeader';
import { Confetti } from './Confetti';
import { TurnTimer } from './TurnTimer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { getVolume, setVolume } from '@/lib/sounds';
import {
  ChevronRight, ChevronLeft, SkipForward, Settings,
  X, Check, Eye, Keyboard, Plus, Minus, Pencil,
  Volume2, VolumeX
} from 'lucide-react';

// ---- Custom Points Dialog ----
interface CustomPointsDialogProps {
  open: boolean;
  teamName: string;
  teamHex: string;
  onConfirm: (points: number) => void;
  onClose: () => void;
}

function CustomPointsDialog({ open, teamName, teamHex, onConfirm, onClose }: CustomPointsDialogProps) {
  const [value, setValue] = useState('');
  const [sign, setSign] = useState<'+' | '-'>('+');
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset state when opened
  useEffect(() => {
    if (open) {
      setValue('');
      setSign('+');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  function handleConfirm() {
    const num = parseInt(value, 10);
    if (isNaN(num) || num <= 0) return;
    onConfirm(sign === '+' ? num : -num);
    onClose();
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleConfirm();
    if (e.key === 'Escape') onClose();
  }

  const isValid = value !== '' && parseInt(value, 10) > 0;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent
        className="max-w-sm border-2"
        style={{ background: 'oklch(0.93 0.018 215)', borderColor: teamHex + '80' }}
        showCloseButton={false}
      >
        <DialogHeader>
          <DialogTitle
            className="text-center text-base tracking-widest"
            style={{ fontFamily: 'Orbitron, sans-serif', color: teamHex }}
          >
            ADJUST POINTS
          </DialogTitle>
          <p className="text-center text-sm text-muted-foreground">{teamName}</p>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {/* Sign toggle */}
          <div className="flex rounded-lg overflow-hidden border border-border">
            <button
              onClick={() => setSign('+')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold transition-all ${
                sign === '+'
                  ? 'bg-green-700 text-white'
                  : 'bg-transparent text-muted-foreground hover:text-green-400'
              }`}
            >
              <Plus size={16} /> Award
            </button>
            <button
              onClick={() => setSign('-')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold transition-all ${
                sign === '-'
                  ? 'bg-red-800 text-white'
                  : 'bg-transparent text-muted-foreground hover:text-red-400'
              }`}
            >
              <Minus size={16} /> Deduct
            </button>
          </div>

          {/* Points input */}
          <div className="relative">
            <span
              className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black font-mono"
              style={{ color: sign === '+' ? 'oklch(0.50 0.20 145)' : '#FF3B3B' }}
            >
              {sign}
            </span>
            <Input
              ref={inputRef}
              type="number"
              min={1}
              max={9999}
              value={value}
              onChange={e => setValue(e.target.value.replace(/[^0-9]/g, ''))}
              onKeyDown={handleKey}
              className="text-center text-3xl font-black font-mono h-16 pl-10 pr-4 bg-background border-border"
              style={{ color: sign === '+' ? 'oklch(0.50 0.20 145)' : '#FF3B3B' }}
              placeholder="0"
            />
          </div>

          {/* Quick presets */}
          <div className="flex gap-2 flex-wrap justify-center">
            {[5, 10, 20, 25, 50, 100].map(n => (
              <button
                key={n}
                onClick={() => setValue(String(n))}
                className={`px-3 py-1.5 rounded border text-sm font-mono font-bold transition-all hover:scale-105 ${
                  value === String(n)
                    ? 'border-primary bg-primary/20 text-primary'
                    : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 gap-1"
          >
            <X size={14} /> Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!isValid}
            className="flex-1 gap-1 font-bold"
            style={{
              background: isValid ? (sign === '+' ? 'oklch(0.50 0.20 145)' : '#FF3B3B') : undefined,
              color: isValid ? 'oklch(0.97 0.005 200)' : undefined,
            }}
          >
            <Check size={14} /> Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---- Word Display ----
function WordDisplay() {
  const { state } = useGame();
  const { round, settings } = state;
  const disease = settings.diseases[round.wordIndex];
  if (!disease) return null;

  const phrase = disease.phrase.toUpperCase();
  const words = phrase.split(' ');
  const isRevealed = round.wordRevealed;
  const isSolved = round.solvedWordIndices.includes(round.wordIndex);

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      {/* Word number */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-border/50" style={{ maxWidth: '80px' }} />
        <span className="text-xs text-muted-foreground tracking-widest uppercase font-mono">
          {(() => {
            const validDiseases = settings.diseases.filter(d => d.phrase.trim());
            const currentNum = validDiseases.findIndex((_, i) => settings.diseases.indexOf(validDiseases[i]) >= round.wordIndex) + 1;
            return `Round ${currentNum || 1} / ${validDiseases.length}`;
          })()}
        </span>
        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-border/50" style={{ maxWidth: '80px' }} />
      </div>

      {/* Words container */}
      <div className="flex flex-wrap justify-center gap-x-6 gap-y-4 px-4">
        {words.map((word, wi) => (
          <div key={wi} className="flex gap-1.5 items-end">
            {word.split('').map((char, ci) => {
              const isVowel = VOWELS.has(char);
              const isGuessed = round.guessedLetters.includes(char);
              const show = isRevealed || (!isVowel && isGuessed);

              let tileClass = 'letter-tile';
              if (show && isVowel) tileClass += ' vowel-revealed';
              else if (show) tileClass += ' revealed';

              return (
                <div
                  key={ci}
                  className={`${tileClass} ${show ? 'tile-flip' : ''}`}
                  style={{
                    width: 'clamp(40px, 4.5vw, 62px)',
                    height: 'clamp(50px, 5.5vw, 76px)',
                    fontSize: 'clamp(18px, 2.4vw, 32px)',
                    fontWeight: 700,
                  }}
                >
                  {show ? char : ''}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Solved badge — shown when navigating back to a completed word */}
      {isSolved && (
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-full border"
          style={{ borderColor: 'oklch(0.50 0.20 145 / 0.4)', background: 'oklch(0.50 0.20 145 / 0.08)' }}
        >
          <span style={{ color: 'oklch(0.50 0.20 145)', fontSize: '14px' }}>✓</span>
          <span
            className="text-xs font-bold tracking-widest uppercase"
            style={{ color: 'oklch(0.45 0.18 145)', fontFamily: 'Orbitron, sans-serif' }}
          >
            Already Solved
          </span>
        </div>
      )}

      {/* Vowel reminder — only shown while word is still being played */}
      {!isSolved && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
          <span className="tracking-widest">VOWELS HIDDEN</span>
          <span className="font-mono px-2 py-0.5 rounded border border-border/30 text-muted-foreground/40">A E I O U</span>
          <span className="tracking-widest">UNTIL WORD SOLVED</span>
        </div>
      )}

      {/* Wrong guesses — only shown while word is still being played */}
      {!isSolved && round.wrongGuesses.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap justify-center">
          <span className="text-xs text-muted-foreground tracking-widest uppercase">Missed:</span>
          {round.wrongGuesses.map(l => (
            <span
              key={l}
              className="font-mono text-sm px-2 py-0.5 rounded border border-red-500/40 text-red-400 bg-red-950/20"
            >
              {l}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ---- Word Progress Bar ----
function WordProgressBar() {
  const { state } = useGame();
  const diseases = state.settings.diseases;
  const validDiseases = diseases.filter(d => d.phrase.trim());
  const total = validDiseases.length;
  if (total === 0) return null;

  // How many valid words have been completed (wordIndex points to current)
  // Count valid diseases before the current wordIndex
  const completedCount = validDiseases.filter((d) => {
    const idx = diseases.indexOf(d);
    return idx < state.round.wordIndex;
  }).length;

  const currentValidIdx = validDiseases.findIndex((d) => {
    const idx = diseases.indexOf(d);
    return idx === state.round.wordIndex;
  });
  const displayNum = currentValidIdx >= 0 ? currentValidIdx + 1 : completedCount + 1;
  const progressPct = total > 1 ? (completedCount / (total - 1)) * 100 : 100;

  return (
    <div className="w-full flex flex-col gap-1">
      {/* Label row */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs text-muted-foreground/60 tracking-widest uppercase">
          Word {displayNum} of {total}
        </span>
        <span className="text-xs font-mono text-primary/70">
          {completedCount}/{total - 1} done
        </span>
      </div>
      {/* Track */}
      <div
        className="relative w-full rounded-full overflow-hidden"
        style={{ height: '6px', background: 'oklch(0.70 0.04 220 / 0.5)' }}
      >
        {/* Completed fill */}
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
          style={{
            width: `${progressPct}%`,
            background: 'linear-gradient(90deg, oklch(0.50 0.20 145), oklch(0.45 0.18 220))',
            boxShadow: '0 0 8px oklch(0.45 0.18 220 / 0.5)',
          }}
        />
        {/* Word pip markers */}
        {validDiseases.map((d, i) => {
          const pct = total > 1 ? (i / (total - 1)) * 100 : 0;
          const originalIdx = diseases.indexOf(d);
          const isDone = originalIdx < state.round.wordIndex;
          const isCurrent = originalIdx === state.round.wordIndex;
          return (
            <div
              key={d.id}
              className="absolute top-1/2 -translate-y-1/2 rounded-full transition-all duration-500"
              style={{
                left: `${pct}%`,
                transform: 'translate(-50%, -50%)',
                width: isCurrent ? '10px' : '6px',
                height: isCurrent ? '10px' : '6px',
                background: isDone ? 'oklch(0.50 0.20 145)' : isCurrent ? 'oklch(0.45 0.18 220)' : 'oklch(0.65 0.04 220)',
                boxShadow: isCurrent ? '0 0 8px oklch(0.45 0.18 220), 0 0 16px oklch(0.45 0.18 220 / 0.4)' : isDone ? '0 0 4px oklch(0.50 0.20 145 / 0.5)' : 'none',
                zIndex: 2,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

// ---- Floating score bubble ----
interface FloatingBubble {
  id: string;
  value: number;
  color: string;
}

// ---- Team Score Cards ----
function TeamScoreCards() {
  const { state, dispatch } = useGame();
  const { teams } = state.settings;
  const { currentTeamIndex } = state.round;
  const [customPointsTeam, setCustomPointsTeam] = useState<{ id: string; name: string; hex: string } | null>(null);

  // Compute live ranks (1-indexed, ties share the same rank)
  const sortedScores = [...teams].sort((a, b) => b.score - a.score);
  const rankMap: Record<string, number> = {};
  let currentRank = 1;
  sortedScores.forEach((team, i) => {
    if (i > 0 && team.score < sortedScores[i - 1].score) {
      currentRank = i + 1;
    }
    rankMap[team.id] = currentRank;
  });

  // Per-team flash state: { [teamId]: flashKey } — incrementing triggers re-animation
  const [flashKeys, setFlashKeys] = useState<Record<string, number>>({});
  // Per-team floating bubbles
  const [bubbles, setBubbles] = useState<Record<string, FloatingBubble[]>>({});

  // Track previous scores to detect changes
  const prevScoresRef = useRef<Record<string, number>>({});

  useEffect(() => {
    teams.forEach(team => {
      const prev = prevScoresRef.current[team.id];
      if (prev !== undefined && team.score !== prev) {
        const delta = team.score - prev;
        const colors = TEAM_COLORS[team.color];
        // Trigger flash
        setFlashKeys(fk => ({ ...fk, [team.id]: (fk[team.id] || 0) + 1 }));
        // Add floating bubble
        const bubbleId = `${team.id}-${Date.now()}`;
        setBubbles(bb => ({
          ...bb,
          [team.id]: [...(bb[team.id] || []), { id: bubbleId, value: delta, color: colors.hex }],
        }));
        // Remove bubble after animation
        setTimeout(() => {
          setBubbles(bb => ({
            ...bb,
            [team.id]: (bb[team.id] || []).filter(b => b.id !== bubbleId),
          }));
        }, 1200);
      }
      prevScoresRef.current[team.id] = team.score;
    });
  }, [teams]);

  function handleCustomPoints(points: number) {
    if (!customPointsTeam) return;
    dispatch({ type: 'AWARD_POINTS', teamId: customPointsTeam.id, points });
  }

  return (
    <>
      <div className="flex flex-col gap-2 h-full overflow-y-auto">
        <div className="text-xs text-muted-foreground tracking-widest uppercase text-center pb-1 border-b border-border/30">
          Scoreboard
        </div>
        {teams.map((team, i) => {
          const colors = TEAM_COLORS[team.color];
          const isActive = i === currentTeamIndex && state.phase === 'playing';
          const flashKey = flashKeys[team.id] || 0;
          const teamBubbles = bubbles[team.id] || [];
          return (
            <div
              key={`${team.id}-${flashKey}`}
              className={`team-card p-3 flex flex-col gap-2 border transition-all duration-300 relative ${
                isActive ? 'team-pulse' : 'opacity-75 hover:opacity-90'
              } ${flashKey > 0 ? 'score-card-flash' : ''}`}
              style={{
                borderColor: isActive ? colors.hex : undefined,
                ['--flash-color' as string]: colors.hex,
                ['--flash-color-dim' as string]: colors.hex + '55',
              } as React.CSSProperties}
            >
              {/* Floating score bubbles */}
              {teamBubbles.map(bubble => (
                <span
                  key={bubble.id}
                  className="score-rise"
                  style={{ color: bubble.value >= 0 ? bubble.color : '#FF3B3B' }}
                >
                  {bubble.value >= 0 ? `+${bubble.value}` : bubble.value}
                </span>
              ))}

              {/* Team name + rank badge + score */}
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  {isActive && (
                    <span className="w-2 h-2 rounded-full shrink-0 blink" style={{ background: colors.hex }} />
                  )}
                  <span
                    className="font-bold leading-tight break-words"
                    style={{
                      fontFamily: 'Orbitron, sans-serif',
                      color: colors.hex,
                      fontSize: 'clamp(9px, 0.9vw, 12px)',
                      wordBreak: 'break-word',
                      overflowWrap: 'anywhere',
                    }}
                  >
                    {team.name}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Live rank badge */}
                  <span
                    key={`rank-${team.id}-${rankMap[team.id]}`}
                    className={`rank-badge rank-badge-${rankMap[team.id] <= 3 ? rankMap[team.id] : 'other'}`}
                    style={{ fontSize: 'clamp(7px, 0.75vw, 10px)', padding: '1px 5px', minWidth: '22px' }}
                    title={`Rank #${rankMap[team.id]}`}
                  >
                    {rankMap[team.id] === 1 ? '🥇' : rankMap[team.id] === 2 ? '🥈' : rankMap[team.id] === 3 ? '🥉' : `#${rankMap[team.id]}`}
                  </span>
                  <span
                    key={`score-${team.id}-${team.score}`}
                    className="font-black font-mono number-count"
                    style={{
                      color: colors.hex,
                      fontSize: 'clamp(16px, 1.6vw, 24px)',
                      fontFamily: 'Orbitron, sans-serif',
                    }}
                  >
                    {team.score}
                  </span>
                </div>
              </div>

              {/* Players */}
              {team.players.filter(p => p.name.trim()).length > 0 && (
                <div className="text-xs text-muted-foreground/60 truncate">
                  {team.players.filter(p => p.name.trim()).map(p => p.name).join(' · ')}
                </div>
              )}

              {/* Quick score adjust */}
              <div className="flex gap-1">
                <button
                  onClick={() => { playClick(); dispatch({ type: 'AWARD_POINTS', teamId: team.id, points: state.settings.scoreConfig.pointsPerLetter }); }}
                  className="flex-1 text-xs py-0.5 rounded border border-green-500/30 text-green-400 hover:bg-green-950/30 transition-colors font-mono"
                >
                  +{state.settings.scoreConfig.pointsPerLetter}
                </button>
                <button
                  onClick={() => { playClick(); dispatch({ type: 'AWARD_POINTS', teamId: team.id, points: -state.settings.scoreConfig.pointsPerLetter }); }}
                  className="flex-1 text-xs py-0.5 rounded border border-red-500/30 text-red-400 hover:bg-red-950/30 transition-colors font-mono"
                >
                  -{state.settings.scoreConfig.pointsPerLetter}
                </button>
                <button
                  onClick={() => {
                    playClick();
                    setCustomPointsTeam({ id: team.id, name: team.name, hex: colors.hex });
                  }}
                  className="px-2 text-xs py-0.5 rounded border border-border text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors"
                  title="Custom points"
                >
                  <Pencil size={11} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Custom points dialog */}
      <CustomPointsDialog
        open={!!customPointsTeam}
        teamName={customPointsTeam?.name || ''}
        teamHex={customPointsTeam?.hex || 'oklch(0.45 0.18 220)'}
        onConfirm={handleCustomPoints}
        onClose={() => setCustomPointsTeam(null)}
      />
    </>
  );
}

// ---- Bonus Word Dialog ----
interface BonusWordDialogProps {
  open: boolean;
  defaultPoints: number;
  onClose: () => void;
}

function BonusWordDialog({ open, defaultPoints, onClose }: BonusWordDialogProps) {
  const { dispatch } = useGame();
  const [phrase, setPhrase] = useState('');
  const [hint, setHint] = useState('');
  const [points, setPoints] = useState(String(defaultPoints));
  const [showPhrase, setShowPhrase] = useState(false);
  const phraseRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setPhrase('');
      setHint('');
      setPoints(String(defaultPoints));
      setShowPhrase(false);
      setTimeout(() => phraseRef.current?.focus(), 100);
    }
  }, [open, defaultPoints]);

  function handleAdd() {
    const trimmed = phrase.trim();
    if (!trimmed) return;
    const pts = parseInt(points, 10);
    dispatch({
      type: 'ADD_BONUS_WORD',
      phrase: trimmed,
      hint: hint.trim(),
      bonusPoints: isNaN(pts) || pts <= 0 ? defaultPoints : pts,
    });
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent
        className="max-w-sm border-2"
        style={{ background: 'oklch(0.93 0.018 215)', borderColor: '#FFB80080' }}
        showCloseButton={false}
      >
        <DialogHeader>
          <DialogTitle
            className="text-center text-base tracking-widest"
            style={{ fontFamily: 'Orbitron, sans-serif', color: '#FFB800' }}
          >
            ADD BONUS WORD
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-1">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground tracking-widest uppercase">Phrase</label>
            <div className="relative flex items-center">
              <Input
                ref={phraseRef}
                type={showPhrase ? 'text' : 'password'}
                value={phrase}
                onChange={e => setPhrase(e.target.value.toUpperCase())}
                placeholder="Enter disease phrase"
                className="font-mono tracking-widest pr-9"
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShowPhrase(v => !v)}
                className="absolute right-2.5 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
                title={showPhrase ? 'Hide phrase' : 'Reveal phrase'}
              >
                <Eye size={14} />
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground tracking-widest uppercase">Hint (optional)</label>
            <Input
              value={hint}
              onChange={e => setHint(e.target.value)}
              placeholder="Clue shown after solving"
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground tracking-widest uppercase">Points for solving</label>
            <div className="flex gap-2">
              {[50, 75, 100, 150, 200].map(p => (
                <button
                  key={p}
                  onClick={() => setPoints(String(p))}
                  className={`flex-1 text-xs py-1 rounded border transition-colors font-mono ${
                    points === String(p)
                      ? 'border-indigo-600 text-indigo-700 bg-indigo-100/60'
                      : 'border-border text-muted-foreground hover:border-indigo-400/50'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <Input
              type="number"
              value={points}
              onChange={e => setPoints(e.target.value)}
              placeholder="Custom points"
              className="font-mono"
              min={1}
            />
          </div>
        </div>
        <DialogFooter className="flex gap-2 mt-1">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          <Button
            onClick={handleAdd}
            disabled={!phrase.trim()}
            className="flex-1 font-bold"
            style={{ background: '#4338CA', color: '#ffffff' }}
          >
            Insert Next
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---- GM Letter Input Panel ----
function LetterInputPanel() {
  const { state, dispatch } = useGame();
  const [wordGuessMode, setWordGuessMode] = useState(false);
  const [lastKey, setLastKey] = useState<string | null>(null);
  const [bonusWordMode, setBonusWordMode] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [endGameConfirm, setEndGameConfirm] = useState(false);

  const currentTeam = state.settings.teams[state.round.currentTeamIndex];
  const colors = currentTeam ? TEAM_COLORS[currentTeam.color] : null;

  const handleLetterGuess = useCallback((letter: string) => {
    const l = letter.toUpperCase().trim();
    if (!l || l.length !== 1 || !/[A-Z]/.test(l)) return;
    if (VOWELS.has(l)) {
      setLastKey(`${l} (vowel!)`);
      setTimeout(() => setLastKey(null), 1000);
      return;
    }
    if (state.round.guessedLetters.includes(l)) {
      setLastKey(`${l} (already tried)`);
      setTimeout(() => setLastKey(null), 1000);
      return;
    }
    setLastKey(l);
    setTimeout(() => setLastKey(null), 800);
    playClick();
    dispatch({ type: 'GUESS_LETTER', letter: l });
  }, [state.round.guessedLetters, dispatch]);

  const handleWordGuess = useCallback((correct: boolean) => {
    playClick();
    dispatch({ type: 'GUESS_WORD', correct });
    setWordGuessMode(false);
  }, [dispatch]);

  // Global keyboard listener — only active when no dialog/input is focused
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      // Don't capture keys when a dialog is open
      if (document.querySelector('[data-slot="dialog-content"]')) return;
      if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
        handleLetterGuess(e.key);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleLetterGuess]);

  const consonants = 'BCDFGHJKLMNPQRSTVWXYZ'.split('');
  const isSolved = state.round.solvedWordIndices.includes(state.round.wordIndex);

  return (
    <div className="flex flex-col gap-3 h-full overflow-y-auto">
      {/* Countdown timer */}
      <div className="flex justify-center">
        <TurnTimer />
      </div>

      {/* Current team */}
      {currentTeam && colors && (
        <div
          className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-center"
          style={{ borderColor: colors.hex, background: `${colors.hex}18` }}
        >
          <span className="w-2 h-2 rounded-full blink shrink-0" style={{ background: colors.hex }} />
          <span
            className="font-bold tracking-widest truncate"
            style={{ fontFamily: 'Orbitron, sans-serif', color: colors.hex, fontSize: 'clamp(10px, 1vw, 13px)' }}
          >
            {currentTeam.name}
          </span>
        </div>
      )}

      {/* Last key indicator */}
      {lastKey && (
        <div className="text-center text-xs font-mono text-primary animate-pulse">
          → {lastKey}
        </div>
      )}

      {/* Consonant keyboard */}
      {isSolved ? (
        <div
          className="flex flex-col items-center gap-2 py-4 rounded-lg border"
          style={{ borderColor: 'oklch(0.50 0.20 145 / 0.4)', background: 'oklch(0.50 0.20 145 / 0.08)' }}
        >
          <span style={{ color: 'oklch(0.50 0.20 145)', fontSize: '22px' }}>✓</span>
          <span
            className="text-xs font-bold tracking-widest uppercase"
            style={{ color: 'oklch(0.45 0.18 145)', fontFamily: 'Orbitron, sans-serif' }}
          >
            Word Solved
          </span>
          <span className="text-xs text-muted-foreground/60">Navigate away to continue</span>
        </div>
      ) : (
        <div>
          <div className="text-xs text-muted-foreground tracking-widest uppercase mb-2 text-center">
            <Keyboard size={10} className="inline mr-1" />
            Guess Letter
          </div>
          <div className="flex flex-wrap gap-1 justify-center">
            {consonants.map(l => {
              const isGuessed = state.round.guessedLetters.includes(l);
              const isWrong = state.round.wrongGuesses.includes(l);
              return (
                <button
                  key={l}
                  onClick={() => handleLetterGuess(l)}
                  disabled={isGuessed}
                  className={`
                    font-mono font-bold rounded transition-all active:scale-90
                    ${isGuessed
                      ? isWrong
                        ? 'bg-red-100 border border-red-300/60 text-red-400/60 cursor-not-allowed'
                        : 'bg-blue-100 border border-blue-300/60 text-blue-400/60 cursor-not-allowed'
                      : 'bg-card border border-border text-foreground hover:border-primary hover:text-primary hover:bg-primary/10 hover:shadow-[0_0_8px_oklch(0.45_0.18_220_/_0.25)]'
                    }
                  `}
                  style={{
                    width: 'clamp(26px, 2.2vw, 34px)',
                    height: 'clamp(26px, 2.2vw, 34px)',
                    fontSize: 'clamp(10px, 1vw, 13px)',
                  }}
                >
                  {l}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground/50 text-center mt-1.5">
            Or press key on keyboard
          </p>
        </div>
      )}

      {/* Divider */}
      <div className="border-t border-border/30" />

      {/* Word guess — hidden when word is already solved */}
      {!isSolved && (
        !wordGuessMode ? (
          <Button
            variant="outline"
            onClick={() => { playClick(); setWordGuessMode(true); }}
            className="w-full gap-2 border-indigo-500/50 text-indigo-700 hover:bg-indigo-100/40 text-xs"
            style={{ fontSize: 'clamp(10px, 1vw, 13px)' }}
          >
            <Eye size={13} /> Team Guesses Full Word
          </Button>
        ) : (
          <div className="flex flex-col gap-2 p-3 rounded-lg border border-indigo-500/30 bg-indigo-50/60">
            <p className="text-xs text-indigo-700 tracking-widest uppercase text-center">Correct guess?</p>
            <div className="flex gap-2">
              <Button
                onClick={() => handleWordGuess(true)}
                className="flex-1 gap-1 bg-green-700 hover:bg-green-600 text-white font-bold text-xs h-8"
              >
                <Check size={13} /> YES!
              </Button>
              <Button
                onClick={() => handleWordGuess(false)}
                className="flex-1 gap-1 bg-red-800 hover:bg-red-700 text-white font-bold text-xs h-8"
              >
                <X size={13} /> NOPE
              </Button>
            </div>
            <button onClick={() => setWordGuessMode(false)} className="text-xs text-muted-foreground hover:text-foreground text-center">
              cancel
            </button>
          </div>
        )
      )}

      {/* Divider */}
      <div className="border-t border-border/30" />

      {/* GM Actions */}
      <div className="flex flex-col gap-1.5">
        <p className="text-xs text-muted-foreground tracking-widest uppercase text-center">GM Actions</p>

        {/* Skip turn */}
        <button
          onClick={() => { playClick(); dispatch({ type: 'NEXT_TEAM' }); }}
          className="w-full text-xs py-1.5 rounded border border-border text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors flex items-center justify-center gap-1.5"
        >
          <SkipForward size={12} /> Skip Turn
        </button>

        {/* Word navigation row */}
        <div className="flex gap-1">
          <button
            onClick={() => { playClick(); dispatch({ type: 'PREV_WORD' }); }}
            className="flex-1 text-xs py-1.5 rounded border border-border text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors flex items-center justify-center gap-1"
            title="Previous word"
          >
            <ChevronLeft size={12} /> Prev
          </button>
          <button
            onClick={() => { playClick(); dispatch({ type: 'REPLAY_WORD' }); }}
            className="flex-1 text-xs py-1.5 rounded border border-cyan-500/30 text-cyan-400 hover:bg-cyan-950/20 transition-colors flex items-center justify-center gap-1"
            title="Replay this word from scratch"
          >
            ↺ Replay
          </button>
          <button
            onClick={() => { playClick(); dispatch({ type: 'NEXT_WORD' }); }}
            className="flex-1 text-xs py-1.5 rounded border border-border text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors flex items-center justify-center gap-1"
            title="Next word"
          >
            Next <ChevronRight size={12} />
          </button>
        </div>

        {/* Scrap word */}
        <button
          onClick={() => { playClick(); dispatch({ type: 'SCRAP_WORD' }); }}
          className="w-full text-xs py-1.5 rounded border border-red-500/30 text-red-400 hover:bg-red-950/20 transition-colors flex items-center justify-center gap-1.5"
          title="Remove this word and skip to next"
        >
          <X size={12} /> Scrap Word
        </button>

        {/* Bonus word */}
        <button
          onClick={() => { playClick(); setBonusWordMode(true); }}
          className="w-full text-xs py-1.5 rounded border border-indigo-500/40 text-indigo-700 hover:bg-indigo-100/40 transition-colors flex items-center justify-center gap-1.5"
        >
          <Plus size={12} /> Add Bonus Word
        </button>

        {/* Reset game */}
        <button
          onClick={() => { playClick(); setResetConfirm(true); }}
          className="w-full text-xs py-1.5 rounded border border-red-800/40 text-red-500/70 hover:text-red-400 hover:border-red-500/40 transition-colors flex items-center justify-center gap-1.5"
        >
          ⟳ Reset Game
        </button>

        {/* End game */}
        {!endGameConfirm ? (
          <button
            onClick={() => { playClick(); setEndGameConfirm(true); }}
            className="w-full text-xs py-1.5 rounded border border-red-600/50 text-red-600 hover:bg-red-50 hover:border-red-600 transition-colors flex items-center justify-center gap-1.5 font-semibold"
          >
            🏁 End Game Now
          </button>
        ) : (
          <div className="flex flex-col gap-1.5 p-2 rounded border border-red-600/40 bg-red-50/60">
            <p className="text-xs text-red-700 font-semibold text-center">End game with current scores?</p>
            <div className="flex gap-1.5">
              <button
                onClick={() => { dispatch({ type: 'FORCE_END_GAME' }); }}
                className="flex-1 text-xs bg-red-600 hover:bg-red-700 text-white py-1.5 rounded font-semibold transition-colors"
              >
                Yes, End
              </button>
              <button
                onClick={() => { playClick(); setEndGameConfirm(false); }}
                className="flex-1 text-xs bg-muted hover:bg-muted/80 text-foreground py-1.5 rounded transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bonus Word Dialog */}
      <BonusWordDialog
        open={bonusWordMode}
        onClose={() => setBonusWordMode(false)}
        defaultPoints={state.settings.scoreConfig.pointsForWord}
      />

      {/* Reset Confirm Dialog */}
      <Dialog open={resetConfirm} onOpenChange={v => !v && setResetConfirm(false)}>
        <DialogContent
          className="max-w-sm border-2"
          style={{ background: 'oklch(0.93 0.018 215)', borderColor: '#FF3B3B80' }}
          showCloseButton={false}
        >
          <DialogHeader>
            <DialogTitle
              className="text-center text-base tracking-widest"
              style={{ fontFamily: 'Orbitron, sans-serif', color: '#FF3B3B' }}
            >
              RESET GAME?
            </DialogTitle>
          </DialogHeader>
          <p className="text-center text-sm text-muted-foreground">
            This will reset all scores and return to setup. Are you sure?
          </p>
          <DialogFooter className="flex gap-2 mt-2">
            <Button
              variant="outline"
              onClick={() => setResetConfirm(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                playClick();
                dispatch({ type: 'RESET_GAME' });
                setResetConfirm(false);
              }}
              className="flex-1 bg-red-700 hover:bg-red-600 text-white"
            >
              Reset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---- Guessed Letters Summary ----
function GuessedLettersSummary() {
  const { state } = useGame();
  const { guessedLetters, wrongGuesses } = state.round;
  const correct = guessedLetters.filter(l => !wrongGuesses.includes(l));

  if (guessedLetters.length === 0) return null;

  return (
    <div className="flex items-center gap-4 flex-wrap justify-center">
      {correct.length > 0 && (
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-cyan-500/60 tracking-widest">✓</span>
          {correct.map(l => (
            <span key={l} className="font-mono text-xs px-1.5 py-0.5 rounded border border-cyan-500/30 text-cyan-400 bg-cyan-950/20">
              {l}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ---- Word Solved Overlay ----
function WordSolvedOverlay() {
  const { state, dispatch } = useGame();
  // The team that solved it is currentTeamIndex - 1 (we already advanced it in GUESS_WORD)
  const solverIndex = (state.round.currentTeamIndex - 1 + state.settings.teams.length) % state.settings.teams.length;
  const solverTeam = state.settings.teams[solverIndex];
  const colors = solverTeam ? TEAM_COLORS[solverTeam.color] : null;
  const disease = state.settings.diseases[state.round.wordIndex];
  const remainingAfter = state.settings.diseases.slice(state.round.wordIndex + 1).some(d => d.phrase.trim());
  const isLastWord = !remainingAfter;
  const validDiseases = state.settings.diseases.filter(d => d.phrase.trim());
  const totalWords = validDiseases.length;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 backdrop-blur-sm">
      <Confetti active={true} />
      <div
        className="celebration-burst team-card p-8 md:p-12 flex flex-col items-center gap-6 border-2 max-w-lg mx-4 relative z-50 shadow-2xl"
        style={{ borderColor: colors?.hex || 'oklch(0.45 0.18 220)' }}
      >
        <div className="text-7xl">🎉</div>

        <div className="text-center">
          <p className="text-muted-foreground text-sm tracking-widest uppercase mb-2">Diagnosis Confirmed!</p>
          <h2
            className="text-3xl md:text-4xl font-black tracking-widest"
            style={{ fontFamily: 'Orbitron, sans-serif', color: colors?.hex || 'oklch(0.45 0.18 220)' }}
          >
            {solverTeam?.name}
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">cracked the case!</p>
        </div>

        <div className="text-center px-4 py-3 rounded-lg border border-border/50 bg-card/50">
          <p className="font-mono text-xl font-bold text-foreground tracking-widest">{disease?.phrase}</p>
          {disease?.hint && <p className="text-muted-foreground text-sm mt-1 italic">{disease.hint}</p>}
        </div>

        <div className="flex items-baseline gap-2">
          <span
            className="text-5xl font-black"
            style={{ fontFamily: 'Orbitron, sans-serif', color: disease?.bonusPoints ? '#4338CA' : 'oklch(0.50 0.20 145)' }}
          >
            +{disease?.bonusPoints ?? state.settings.scoreConfig.pointsForWord}
          </span>
          <span className="text-muted-foreground">
            {disease?.bonusPoints ? 'bonus points!' : 'points'}
          </span>
        </div>

        <Button
          onClick={() => { playClick(); dispatch({ type: 'NEXT_WORD' }); }}
          className="px-10 py-5 text-lg font-black tracking-widest gap-2"
          style={{
            fontFamily: 'Orbitron, sans-serif',
            background: isLastWord ? 'oklch(0.50 0.20 145)' : 'oklch(0.45 0.18 220)',
            color: 'oklch(0.97 0.005 200)',
          }}
        >
          {isLastWord ? '🏆 Final Scores' : <>Next Disease <ChevronRight size={20} /></>}
        </Button>

        <p className="text-xs text-muted-foreground">
          {(() => {
            const currentNum = validDiseases.findIndex((_, i) => state.settings.diseases.indexOf(validDiseases[i]) >= state.round.wordIndex) + 1;
            return `Word ${currentNum || 1} of ${totalWords}`;
          })()}
        </p>
      </div>
    </div>
  );
}

// ---- Bonus Round Overlay ----
function BonusRoundOverlay() {
  const { state, dispatch } = useGame();
  const { teams, scoreConfig } = state.settings;
  const disease = state.settings.diseases[state.round.wordIndex];
  const movies = disease?.movies || [];
  const remainingAfter = state.settings.diseases.slice(state.round.wordIndex + 1).some(d => d.phrase.trim());
  const isLastWord = !remainingAfter;
  const bonusPoints = scoreConfig.pointsPerMovie + scoreConfig.pointsPerActor;

  // Round-robin: start from the team that solved the word (currentTeamIndex - 1)
  const solverIdx = (state.round.currentTeamIndex - 1 + teams.length) % teams.length;
  const [selectedTeamIdx, setSelectedTeamIdx] = useState<number>(solverIdx);
  // Per movie: track if revealed
  const [revealedMovies, setRevealedMovies] = useState<boolean[]>(() => movies.map(() => false));
  // Per movie: track if awarded
  const [awardedMovies, setAwardedMovies] = useState<boolean[]>(() => movies.map(() => false));

  const selectedTeam = teams[selectedTeamIdx];
  const selectedColors = selectedTeam ? TEAM_COLORS[selectedTeam.color] : null;

  function handleReveal(mi: number) {
    setRevealedMovies(prev => { const n = [...prev]; n[mi] = true; return n; });
  }

  function handleAward(mi: number) {
    if (!selectedTeam || awardedMovies[mi]) return;
    dispatch({ type: 'AWARD_POINTS', teamId: selectedTeam.id, points: bonusPoints, x: 50, y: 30 });
    setAwardedMovies(prev => { const n = [...prev]; n[mi] = true; return n; });
  }

  function handleNext() {
    playClick();
    dispatch({ type: 'SKIP_BONUS_ROUND' });
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <Confetti active={true} />
      <div
        className="team-card p-6 md:p-8 flex flex-col items-center gap-5 border-2 max-w-2xl w-full mx-4 relative z-50 shadow-2xl overflow-y-auto"
        style={{ borderColor: selectedColors?.hex || 'oklch(0.45 0.18 220)', maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className="text-center">
          <div className="text-4xl mb-2">🎦</div>
          <p
            className="font-black tracking-widest text-2xl"
            style={{ fontFamily: 'Orbitron, sans-serif', color: selectedColors?.hex || 'oklch(0.45 0.18 220)' }}
          >
            BONUS ROUND!
          </p>
          <p className="text-muted-foreground text-sm mt-0.5">
            Guess the Bollywood connection &mdash; <strong>+{bonusPoints} pts</strong> for movie &amp; actor together
          </p>
        </div>

        {/* Solved disease */}
        <div className="w-full text-center px-4 py-2 rounded-lg border border-border/50 bg-card/50">
          <p className="font-mono text-base font-bold text-foreground tracking-widest">{disease?.phrase}</p>
          {disease?.hint && <p className="text-muted-foreground text-xs mt-0.5 italic">{disease.hint}</p>}
        </div>

        {/* Team selector — round robin, any team can answer */}
        <div className="w-full">
          <p className="text-xs text-muted-foreground tracking-widest uppercase mb-2 text-center">Which team guessed it?</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {teams.map((t, idx) => {
              const tc = TEAM_COLORS[t.color];
              const isSelected = idx === selectedTeamIdx;
              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedTeamIdx(idx)}
                  className="px-3 py-1.5 rounded-lg border-2 text-xs font-bold transition-all"
                  style={{
                    borderColor: tc.hex,
                    background: isSelected ? tc.hex : `${tc.hex}18`,
                    color: isSelected ? '#fff' : tc.hex,
                    fontFamily: 'Orbitron, sans-serif',
                  }}
                >
                  {t.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Movie/Actor cards */}
        <div className="w-full flex flex-col gap-3">
          {movies.map((m, mi) => {
            const isRevealed = revealedMovies[mi];
            const isAwarded = awardedMovies[mi];
            return (
              <div
                key={mi}
                className="rounded-lg border bg-card/60 p-4 flex flex-col gap-3"
                style={{ borderColor: isAwarded ? 'oklch(0.50 0.20 145)' : 'oklch(0.7 0.05 220 / 0.4)' }}
              >
                {movies.length > 1 && (
                  <p className="text-xs text-muted-foreground tracking-widest uppercase">Movie {mi + 1}</p>
                )}

                {/* Answer rows — hidden until revealed */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-purple-600 font-bold tracking-widest uppercase">🎥 Movie</span>
                    <div
                      className="rounded-lg border-2 px-3 py-2 text-center font-mono font-bold text-base transition-all"
                      style={{
                        borderColor: isRevealed ? '#7C3AED' : 'oklch(0.75 0.06 220)',
                        background: isRevealed ? '#7C3AED12' : 'oklch(0.91 0.03 220)',
                        color: isRevealed ? '#5B21B6' : 'transparent',
                        userSelect: isRevealed ? 'text' : 'none',
                        minHeight: '44px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      {isRevealed ? m.movie || '—' : '• • • • •'}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-orange-700 font-bold tracking-widest uppercase">🎭 Actor</span>
                    <div
                      className="rounded-lg border-2 px-3 py-2 text-center font-mono font-bold text-base transition-all"
                      style={{
                        borderColor: isRevealed ? '#C2410C' : 'oklch(0.75 0.06 220)',
                        background: isRevealed ? '#C2410C12' : 'oklch(0.91 0.03 220)',
                        color: isRevealed ? '#9A3412' : 'transparent',
                        userSelect: isRevealed ? 'text' : 'none',
                        minHeight: '44px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      {isRevealed ? m.actor || '—' : '• • • • •'}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 justify-center flex-wrap">
                  {!isRevealed && (
                    <button
                      onClick={() => handleReveal(mi)}
                      className="px-4 py-2 rounded-lg border-2 text-sm font-bold transition-all hover:scale-105 active:scale-95"
                      style={{ borderColor: 'oklch(0.5 0.15 220)', color: 'oklch(0.4 0.15 220)', background: 'oklch(0.5 0.15 220 / 0.1)' }}
                    >
                      👁️ Reveal Answer
                    </button>
                  )}
                  <button
                    onClick={() => handleAward(mi)}
                    disabled={isAwarded}
                    className="px-4 py-2 rounded-lg border-2 text-sm font-bold transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      borderColor: isAwarded ? 'oklch(0.50 0.20 145)' : selectedColors?.hex || 'oklch(0.45 0.18 220)',
                      color: isAwarded ? 'oklch(0.50 0.20 145)' : selectedColors?.hex || 'oklch(0.45 0.18 220)',
                      background: isAwarded ? 'oklch(0.50 0.20 145 / 0.1)' : `${selectedColors?.hex || 'oklch(0.45 0.18 220)'}18`,
                    }}
                  >
                    {isAwarded
                      ? `✓ Awarded +${bonusPoints} to ${selectedTeam?.name}`
                      : `🏆 Award +${bonusPoints} to ${selectedTeam?.name}`
                    }
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Next button */}
        <Button
          onClick={handleNext}
          className="px-10 py-4 text-base font-black tracking-widest gap-2"
          style={{
            fontFamily: 'Orbitron, sans-serif',
            background: isLastWord ? 'oklch(0.50 0.20 145)' : 'oklch(0.45 0.18 220)',
            color: 'oklch(0.97 0.005 200)',
          }}
        >
          {isLastWord ? '🏆 Final Scores' : <>Next Disease <ChevronRight size={20} /></>}
        </Button>
      </div>
    </div>
  );
}

// ---- Flash Overlay ----
function FlashOverlay() {
  const { state, dispatch } = useGame();
  useEffect(() => {
    if (state.flashWrong || state.flashCorrect) {
      const t = setTimeout(() => dispatch({ type: 'CLEAR_FLASH' }), 600);
      return () => clearTimeout(t);
    }
  }, [state.flashWrong, state.flashCorrect, dispatch]);

  if (!state.flashWrong && !state.flashCorrect) return null;
  return (
    <div
      className="fixed inset-0 pointer-events-none z-30"
      style={{
        background: state.flashWrong
          ? 'rgba(255, 59, 59, 0.10)'
          : 'rgba(0, 212, 255, 0.07)',
        transition: 'opacity 0.3s',
      }}
    />
  );
}

// ---- Floating Score Popups ----
function FloatingScores() {
  const { state, dispatch } = useGame();

  useEffect(() => {
    state.floatingScores.forEach(fs => {
      setTimeout(() => dispatch({ type: 'REMOVE_FLOATING_SCORE', id: fs.id }), 1300);
    });
  }, [state.floatingScores.length]);

  return (
    <>
      {state.floatingScores.map(fs => {
        const team = state.settings.teams.find(t => t.id === fs.teamId);
        const colors = team ? TEAM_COLORS[team.color] : null;
        return (
          <div
            key={fs.id}
            className="fixed pointer-events-none z-50 font-black float-up select-none"
            style={{
              left: `${fs.x}%`,
              top: `${fs.y}%`,
              fontFamily: 'Orbitron, sans-serif',
              color: fs.value > 0 ? (colors?.hex || 'oklch(0.50 0.20 145)') : '#FF3B3B',
              fontSize: 'clamp(18px, 2.5vw, 32px)',
              textShadow: `0 0 20px ${fs.value > 0 ? (colors?.hex || 'oklch(0.50 0.20 145)') : '#FF3B3B'}80`,
              transform: 'translateX(-50%)',
            }}
          >
            {fs.value > 0 ? '+' : ''}{fs.value}
          </div>
        );
      })}
    </>
  );
}

// ---- Settings Dropdown ----
function SettingsMenu({ onClose }: { onClose: () => void }) {
  const { dispatch } = useGame();
  const [vol, setVol] = useState(() => getVolume());
  function handleVolChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = parseFloat(e.target.value);
    setVol(v);
    setVolume(v);
  }

  const isMuted = vol === 0;

  function toggleMute() {
    const next = isMuted ? 0.8 : 0;
    setVol(next);
    setVolume(next);
  }

  return (
    <div className="absolute top-12 right-3 z-50 team-card p-4 flex flex-col gap-3 w-56 border border-border shadow-2xl" style={{ maxHeight: 'calc(100vh - 80px)', overflowY: 'auto' }}>
      {/* Volume control */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground tracking-widest uppercase">Volume</span>
          <button
            onClick={toggleMute}
            className="text-muted-foreground hover:text-primary transition-colors"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <VolumeX size={11} className="text-muted-foreground/50 shrink-0" />
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={vol}
            onChange={handleVolChange}
            className="flex-1 accent-cyan-400 h-1.5"
          />
          <Volume2 size={11} className="text-muted-foreground/50 shrink-0" />
        </div>
        <div className="text-center text-xs font-mono text-primary">
          {isMuted ? 'MUTED' : `${Math.round(vol * 100)}%`}
        </div>
      </div>

      <div className="border-t border-border/30" />

      <button
        onClick={() => { playClick(); dispatch({ type: 'RESET_GAME' }); onClose(); }}
        className="text-sm text-left text-muted-foreground hover:text-foreground transition-colors py-1.5 px-2 rounded hover:bg-card"
      >
        ↩ Back to Setup
      </button>
      <button
        onClick={() => { playClick(); dispatch({ type: 'START_GAME' }); onClose(); }}
        className="text-sm text-left text-indigo-700 hover:text-indigo-900 transition-colors py-1.5 px-2 rounded hover:bg-indigo-100/50"
      >
        ↺ Restart Game
      </button>

    </div>
  );
}

// ---- Main Game Board ----
export function GameBoard() {
  const { state } = useGame();
  const [showSettings, setShowSettings] = useState(false);
  const gameName = state.settings.gameName || 'MEDWORD';

  return (
    <div
      className="min-h-screen h-screen flex flex-col relative overflow-hidden"
      style={{ background: 'oklch(0.88 0.025 220)' }}
    >
      {/* Background */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url(https://d2xsxph8kpxj0f.cloudfront.net/310519663397717397/Gx248tbCJVYg8QRBdJBc3Q/medword-hero-bg-P6qpKGd2DzNWK693cYcUPh.webp)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.04,
        }}
      />

      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(30,80,160,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(30,80,160,0.04) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* ECG Header */}
      <div className="relative z-10 shrink-0">
        <EcgHeader />
      </div>

      {/* Top bar */}
      <div className="relative z-10 shrink-0 flex items-center gap-3 px-4 py-2 border-b border-border/20">
        {/* Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <img
            src="https://d2xsxph8kpxj0f.cloudfront.net/310519663397717397/Gx248tbCJVYg8QRBdJBc3Q/medword-logo-icon-NXMLNVknANUKBidgTawME3.webp"
            alt="MedWord"
            className="w-7 h-7 rounded-md"
          />
          <span
            className="font-black tracking-widest text-primary"
            style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 'clamp(11px, 1.2vw, 16px)' }}
          >
            {gameName}
          </span>
        </div>

        {/* Progress bar — takes remaining space */}
        <div className="flex-1 min-w-0">
          <WordProgressBar />
        </div>

        {/* Settings button */}
        <div className="relative shrink-0">
          <button
            onClick={() => setShowSettings(s => !s)}
            className="p-1.5 rounded border border-border/50 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Settings size={13} />
          </button>
          {showSettings && <SettingsMenu onClose={() => setShowSettings(false)} />}
        </div>
      </div>

      {/* Main 3-column layout */}
      <div className="relative z-10 flex-1 flex overflow-hidden">
        {/* Left: Scoreboard */}
        <div
          className="flex flex-col p-3 border-r border-border/20 overflow-hidden"
          style={{ width: 'clamp(150px, 16vw, 210px)', minWidth: '150px' }}
        >
          <TeamScoreCards />
        </div>

        {/* Center: Word + guessed letters */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 gap-4 overflow-hidden">
          <WordDisplay />
          <GuessedLettersSummary />
        </div>

        {/* Right: GM Controls */}
        <div
          className="flex flex-col p-3 border-l border-border/20 overflow-hidden"
          style={{ width: 'clamp(200px, 22vw, 280px)', minWidth: '200px' }}
        >
          <div className="text-xs text-muted-foreground tracking-widest uppercase text-center mb-2 flex items-center justify-center gap-1">
            <Settings size={9} /> GAME MASTER
          </div>
          <LetterInputPanel />
        </div>
      </div>

      {/* Overlays */}
      <FlashOverlay />
      <FloatingScores />
      {state.phase === 'word-solved' && <WordSolvedOverlay />}
      {state.phase === 'bonus-round' && <BonusRoundOverlay />}
    </div>
  );
}
