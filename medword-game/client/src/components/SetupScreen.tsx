// ============================================================
// DESIGN: "Vital Signs" — Setup screen
// Teams → Words → Scoring → Ready
// Designed for projected screen use by game master
// Disease words are masked (password field) to prevent spoilers
// ============================================================

import { useState } from 'react';
import { useGame } from '@/contexts/GameContext';
import { AVAILABLE_COLORS, TEAM_COLORS, TeamColor } from '@/lib/gameTypes';
import { playClick } from '@/lib/sounds';
import { EcgHeader } from './EcgHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Plus, Trash2, ChevronRight, ChevronLeft, Play,
  Users, Stethoscope, Settings, Eye, EyeOff,
  UserPlus, CheckCircle2, X
} from 'lucide-react';

// ---- Teams Step ----
function TeamsStep() {
  const { state, dispatch } = useGame();
  const { teams } = state.settings;
  const gameName = state.settings.gameName || 'MEDWORD';

  return (
    <div className="flex flex-col gap-5">
      {/* Game Name */}
      <div className="flex flex-col gap-1.5">
        <label
          className="text-xs tracking-widest uppercase font-bold"
          style={{ color: 'oklch(0.35 0.18 225)', fontFamily: 'Orbitron, sans-serif' }}
        >
          Game Name
        </label>
        <Input
          value={gameName === 'MEDWORD' ? '' : gameName}
          onChange={e => dispatch({ type: 'UPDATE_GAME_NAME', name: e.target.value })}
          placeholder="MEDWORD"
          maxLength={32}
          className="font-bold tracking-widest text-lg"
          style={{ fontFamily: 'Orbitron, sans-serif', color: 'oklch(0.35 0.18 225)', letterSpacing: '0.15em', textTransform: 'uppercase' }}
        />
        <p className="text-xs text-muted-foreground/60">Leave blank to use the default name "MEDWORD"</p>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2
            className="font-bold tracking-widest text-glow-cyan"
            style={{ fontFamily: 'Orbitron, sans-serif', color: 'oklch(0.35 0.18 225)', fontSize: 'clamp(18px, 2vw, 26px)' }}
          >
            CONFIGURE TEAMS
          </h2>
          <p className="text-muted-foreground text-sm mt-0.5">Set up teams and their players</p>
        </div>
        <Button
          onClick={() => { playClick(); dispatch({ type: 'ADD_TEAM' }); }}
          disabled={teams.length >= 6}
          variant="outline"
          className="gap-2 border-primary text-primary hover:bg-primary/10 shrink-0"
        >
          <Plus size={15} /> Add Team
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 max-h-[55vh] overflow-y-auto pr-1">
        {teams.map((team) => {
          const colors = TEAM_COLORS[team.color];
          return (
            <div
              key={team.id}
              className="team-card p-4 flex flex-col gap-3 border"
              style={{ borderColor: `${colors.hex}50` }}
            >
              {/* Color swatches + Delete button */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex gap-1 flex-wrap">
                  {AVAILABLE_COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => { playClick(); dispatch({ type: 'UPDATE_TEAM', teamId: team.id, updates: { color: c as TeamColor } }); }}
                      className="rounded-full border-2 transition-all shrink-0"
                      style={{
                        width: '16px',
                        height: '16px',
                        backgroundColor: TEAM_COLORS[c as TeamColor].hex,
                        borderColor: team.color === c ? 'white' : 'transparent',
                        transform: team.color === c ? 'scale(1.25)' : 'scale(1)',
                      }}
                    />
                  ))}
                </div>
                <button
                  onClick={() => { playClick(); dispatch({ type: 'REMOVE_TEAM', teamId: team.id }); }}
                  disabled={teams.length <= 2}
                  className="text-muted-foreground hover:text-red-400 disabled:opacity-20 transition-colors shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              {/* Team name — textarea so it wraps on long names */}
              <textarea
                value={team.name}
                onChange={e => dispatch({ type: 'UPDATE_TEAM', teamId: team.id, updates: { name: e.target.value } })}
                rows={1}
                className="w-full bg-background border border-border rounded-md px-3 py-1.5 font-bold text-sm resize-none overflow-hidden leading-snug focus:outline-none focus:ring-1 focus:ring-primary"
                style={{
                  fontFamily: 'Orbitron, sans-serif',
                  color: colors.hex,
                  minHeight: '2.25rem',
                } as React.CSSProperties}
                placeholder="Team name"
                onInput={e => {
                  const el = e.currentTarget;
                  el.style.height = 'auto';
                  el.style.height = el.scrollHeight + 'px';
                }}
              />

              {/* Players */}
              <div className="flex flex-col gap-1.5">
                {team.players.map((player, pi) => (
                  <div key={player.id} className="flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground/50 w-4 text-right font-mono">{pi + 1}</span>
                    <Input
                      value={player.name}
                      onChange={e => dispatch({ type: 'UPDATE_PLAYER', teamId: team.id, playerId: player.id, name: e.target.value })}
                      className="flex-1 bg-background border-border text-xs h-7"
                      placeholder={`Player ${pi + 1}`}
                    />
                    <button
                      onClick={() => { playClick(); dispatch({ type: 'REMOVE_PLAYER', teamId: team.id, playerId: player.id }); }}
                      disabled={team.players.length <= 1}
                      className="text-muted-foreground hover:text-red-400 disabled:opacity-20 transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => { playClick(); dispatch({ type: 'ADD_PLAYER', teamId: team.id }); }}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors ml-5 mt-0.5"
                >
                  <UserPlus size={11} /> Add player
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-end pt-1">
        <Button
          onClick={() => { playClick(); dispatch({ type: 'SET_SETUP_STEP', step: 'words' }); }}
          style={{ background: 'oklch(0.45 0.18 220)', color: 'oklch(0.97 0.005 200)' }}
          className="gap-2 font-bold"
        >
          Disease Words <ChevronRight size={15} />
        </Button>
      </div>
    </div>
  );
}

// ---- Words Step ----
// Disease phrases are shown as password fields so the projected screen
// doesn't spoil the answers to the audience.
function WordsStep() {
  const { state, dispatch } = useGame();
  const { diseases } = state.settings;
  const validCount = diseases.filter(d => d.phrase.trim()).length;
  // Track which disease rows have their phrase revealed (GM can toggle per row)
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  // Track which disease row has the movie/actor dialog open
  const [movieDialogId, setMovieDialogId] = useState<string | null>(null);

  function toggleReveal(id: string) {
    setRevealedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function updateMovie(d: typeof diseases[0], movieIdx: number, field: 'movie' | 'actor', value: string) {
    const movies = [...(d.movies || [])];
    if (!movies[movieIdx]) movies[movieIdx] = { movie: '', actor: '' };
    movies[movieIdx] = { ...movies[movieIdx], [field]: value.toUpperCase() };
    dispatch({ type: 'UPDATE_DISEASE', id: d.id, phrase: d.phrase, hint: d.hint || '', movies });
  }

  function addMovie(d: typeof diseases[0]) {
    const movies = [...(d.movies || []), { movie: '', actor: '' }];
    dispatch({ type: 'UPDATE_DISEASE', id: d.id, phrase: d.phrase, hint: d.hint || '', movies });
  }

  function removeMovie(d: typeof diseases[0], movieIdx: number) {
    const movies = (d.movies || []).filter((_, i) => i !== movieIdx);
    dispatch({ type: 'UPDATE_DISEASE', id: d.id, phrase: d.phrase, hint: d.hint || '', movies });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h2
            className="font-bold tracking-widest"
            style={{ fontFamily: 'Orbitron, sans-serif', color: 'oklch(0.35 0.18 225)', fontSize: 'clamp(18px, 2vw, 26px)' }}
          >
            DISEASE WORDS
          </h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            Phrases hidden while typing · Multi-word OK · Vowels hidden in-game
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted-foreground font-mono">{validCount} words</span>
          <Button
            onClick={() => { playClick(); dispatch({ type: 'ADD_DISEASE' }); }}
            variant="outline"
            className="gap-1.5 border-primary text-primary hover:bg-primary/10"
          >
            <Plus size={14} /> Add
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2 max-h-[55vh] overflow-y-auto pr-1 pb-1">
        {diseases.map((d, i) => {
          const isRevealed = revealedIds.has(d.id);
          const hasMovies = (d.movies || []).length > 0;
          return (
            <div key={d.id} className="team-card p-3 flex items-center gap-2">
              <span className="text-muted-foreground/50 font-mono text-sm w-5 shrink-0 text-center">{i + 1}.</span>

              {/* Phrase (password) */}
              <div className="relative flex-1 min-w-0">
                <Input
                  type={isRevealed ? 'text' : 'password'}
                  value={d.phrase}
                  onChange={e => dispatch({
                    type: 'UPDATE_DISEASE',
                    id: d.id,
                    phrase: e.target.value.toUpperCase(),
                    hint: d.hint || '',
                    movies: d.movies,
                  })}
                  className="bg-background border-border font-mono uppercase tracking-widest text-sm pr-9"
                  placeholder="DISEASE NAME OR PHRASE"
                  autoComplete="off"
                  spellCheck={false}
                  style={{ letterSpacing: isRevealed ? '0.15em' : undefined }}
                />
                <button
                  type="button"
                  onClick={() => toggleReveal(d.id)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                  title={isRevealed ? 'Hide phrase' : 'Reveal phrase'}
                >
                  {isRevealed ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1 shrink-0">
                {d.phrase.trim() && <CheckCircle2 size={13} className="text-emerald-600" />}
                <button
                  onClick={() => setMovieDialogId(d.id)}
                  className={`text-xs px-1.5 py-0.5 rounded border transition-colors ${
                    hasMovies
                      ? 'border-purple-400 text-purple-600 bg-purple-50'
                      : 'border-border text-muted-foreground hover:text-purple-600 hover:border-purple-300'
                  }`}
                  title="Edit movie/actor bonus"
                >
                  🎥
                </button>
                <button
                  onClick={() => { playClick(); dispatch({ type: 'REMOVE_DISEASE', id: d.id }); }}
                  className="text-muted-foreground hover:text-red-400 transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Movie/Actor Dialog — opens when GM clicks 🎥 on any row */}
      {diseases.map(d => {
        const movies = d.movies || [];
        return (
          <Dialog key={d.id} open={movieDialogId === d.id} onOpenChange={open => !open && setMovieDialogId(null)}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-purple-700 font-bold tracking-widest text-sm uppercase">
                  🎦 Bollywood Bonus — Word {diseases.indexOf(d) + 1}
                </DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-4 pt-1">
                {movies.length === 0 && (
                  <p className="text-sm text-muted-foreground italic">No movie/actor added yet. Click below to add.</p>
                )}
                {movies.map((m, mi) => (
                  <div key={mi} className="flex flex-col gap-2 p-3 rounded-lg border border-border bg-muted/30">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Entry {mi + 1}</span>
                      <button
                        onClick={() => removeMovie(d, mi)}
                        className="text-muted-foreground hover:text-red-500 transition-colors"
                        title="Remove"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-purple-600 font-semibold tracking-wider uppercase">🎥 Movie</span>
                        <Input
                          value={m.movie}
                          onChange={e => updateMovie(d, mi, 'movie', e.target.value)}
                          className="border-purple-300 text-sm font-mono"
                          placeholder="Movie name"
                          autoComplete="off"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-orange-700 font-semibold tracking-wider uppercase">🎭 Actor</span>
                        <Input
                          value={m.actor}
                          onChange={e => updateMovie(d, mi, 'actor', e.target.value)}
                          className="border-orange-300 text-sm font-mono"
                          placeholder="Actor name"
                          autoComplete="off"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => addMovie(d)}
                  className="text-sm text-purple-600 hover:text-purple-800 flex items-center gap-1.5 font-medium"
                >
                  <Plus size={13} /> Add movie/actor
                </button>
                <Button onClick={() => setMovieDialogId(null)} className="w-full mt-1">
                  Done
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        );
      })}

      <div className="flex justify-between pt-1">
        <Button variant="outline" onClick={() => { playClick(); dispatch({ type: 'SET_SETUP_STEP', step: 'teams' }); }} className="gap-2">
          <ChevronLeft size={15} /> Back
        </Button>
        <Button
          onClick={() => { playClick(); dispatch({ type: 'SET_SETUP_STEP', step: 'scoring' }); }}
          style={{ background: 'oklch(0.45 0.18 220)', color: 'oklch(0.97 0.005 200)' }}
          className="gap-2 font-bold"
          disabled={validCount === 0}
        >
          Scoring <ChevronRight size={15} />
        </Button>
      </div>
    </div>
  );
}

// ---- Scoring Step ----
function ScoringStep() {
  const { state, dispatch } = useGame();
  const { scoreConfig } = state.settings;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2
          className="font-bold tracking-widest"
          style={{ fontFamily: 'Orbitron, sans-serif', color: 'oklch(0.35 0.18 225)', fontSize: 'clamp(18px, 2vw, 26px)' }}
        >
          SCORING
        </h2>
        <p className="text-muted-foreground text-sm mt-0.5">Configure point values for the game</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Points config */}
        <div className="team-card p-5 flex flex-col gap-5">
          <h3 className="text-xs font-bold tracking-widest uppercase text-muted-foreground">Point Values</h3>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <label className="text-sm text-foreground">Per correct letter</label>
              <span className="font-mono font-bold text-primary text-lg">{scoreConfig.pointsPerLetter}</span>
            </div>
            <input
              type="range" min={5} max={100} step={5}
              value={scoreConfig.pointsPerLetter}
              onChange={e => dispatch({ type: 'SET_SCORE_CONFIG', config: { ...scoreConfig, pointsPerLetter: +e.target.value } })}
              className="w-full accent-cyan-400"
            />
            <div className="flex justify-between text-xs text-muted-foreground/50">
              <span>5</span><span>100</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <label className="text-sm text-foreground">Full word guess</label>
              <span className="font-mono font-bold text-accent text-lg">{scoreConfig.pointsForWord}</span>
            </div>
            <input
              type="range" min={10} max={200} step={10}
              value={scoreConfig.pointsForWord}
              onChange={e => dispatch({ type: 'SET_SCORE_CONFIG', config: { ...scoreConfig, pointsForWord: +e.target.value } })}
              className="w-full accent-green-400"
            />
            <div className="flex justify-between text-xs text-muted-foreground/50">
              <span>10</span><span>200</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <label className="text-sm text-foreground">🎦 Bollywood bonus (movie + actor)</label>
              <span className="font-mono font-bold text-purple-600 text-lg">+{scoreConfig.pointsPerMovie + scoreConfig.pointsPerActor}</span>
            </div>
            <p className="text-xs text-muted-foreground/60">Awarded as one combined prize when a team guesses both movie &amp; actor</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">🎥 Movie</span>
                  <span className="font-mono font-bold text-purple-600">{scoreConfig.pointsPerMovie}</span>
                </div>
                <input
                  type="range" min={0} max={100} step={5}
                  value={scoreConfig.pointsPerMovie}
                  onChange={e => dispatch({ type: 'SET_SCORE_CONFIG', config: { ...scoreConfig, pointsPerMovie: +e.target.value } })}
                  className="w-full accent-purple-500"
                />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">🎭 Actor</span>
                  <span className="font-mono font-bold text-orange-600">{scoreConfig.pointsPerActor}</span>
                </div>
                <input
                  type="range" min={0} max={100} step={5}
                  value={scoreConfig.pointsPerActor}
                  onChange={e => dispatch({ type: 'SET_SCORE_CONFIG', config: { ...scoreConfig, pointsPerActor: +e.target.value } })}
                  className="w-full accent-orange-500"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <label className="text-sm text-foreground">Timer per turn</label>
              <span className="font-mono font-bold text-indigo-700 text-lg">
                {scoreConfig.timerSeconds === 0 ? 'OFF' : `${scoreConfig.timerSeconds}s`}
              </span>
            </div>
            <input
              type="range" min={0} max={120} step={5}
              value={scoreConfig.timerSeconds}
              onChange={e => dispatch({ type: 'SET_SCORE_CONFIG', config: { ...scoreConfig, timerSeconds: +e.target.value } })}
              className="w-full accent-indigo-600"
            />
            <div className="flex justify-between text-xs text-muted-foreground/50">
              <span>Off</span><span>120s</span>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="team-card p-5 border border-indigo-500/20 flex flex-col gap-4">
          <h3 className="text-xs font-bold tracking-widest uppercase text-indigo-700">Summary</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground block text-xs mb-1">Teams</span>
              <span className="font-bold font-mono text-xl">{state.settings.teams.length}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs mb-1">Words</span>
              <span className="font-bold font-mono text-xl">{state.settings.diseases.filter(d => d.phrase.trim()).length}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs mb-1">Per Letter</span>
              <span className="font-bold font-mono text-xl text-primary">+{scoreConfig.pointsPerLetter}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs mb-1">Full Word</span>
              <span className="font-bold font-mono text-xl text-accent">+{scoreConfig.pointsForWord}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs mb-1">🎦 Bollywood Bonus</span>
              <span className="font-bold font-mono text-xl text-purple-600">+{scoreConfig.pointsPerMovie + scoreConfig.pointsPerActor}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs mb-1">Turn Timer</span>
              <span className="font-bold font-mono text-xl text-indigo-700">
                {scoreConfig.timerSeconds === 0 ? 'Off' : `${scoreConfig.timerSeconds}s`}
              </span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground/60 mt-auto">
            GM can also award or deduct points manually at any time during the game.
          </p>
        </div>
      </div>

      <div className="flex justify-between pt-1">
        <Button variant="outline" onClick={() => { playClick(); dispatch({ type: 'SET_SETUP_STEP', step: 'words' }); }} className="gap-2">
          <ChevronLeft size={15} /> Back
        </Button>
        <Button
          onClick={() => { playClick(); dispatch({ type: 'SET_SETUP_STEP', step: 'ready' }); }}
          style={{ background: 'oklch(0.45 0.18 220)', color: 'oklch(0.97 0.005 200)' }}
          className="gap-2 font-bold"
        >
          Review & Launch <ChevronRight size={15} />
        </Button>
      </div>
    </div>
  );
}

// ---- Ready Step ----
function ReadyStep() {
  const { state, dispatch } = useGame();

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="text-center">
        <h2
          className="font-black tracking-widest text-glow-green"
          style={{ fontFamily: 'Orbitron, sans-serif', color: 'oklch(0.45 0.20 145)', fontSize: 'clamp(24px, 3.5vw, 48px)' }}
        >
          READY FOR SURGERY?
        </h2>
        <p className="text-muted-foreground mt-2 tracking-widest text-sm">All systems nominal. Prepare to operate.</p>
      </div>

      {/* Teams preview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full max-w-2xl">
        {state.settings.teams.map(team => {
          const colors = TEAM_COLORS[team.color];
          return (
            <div
              key={team.id}
              className="team-card p-3 flex flex-col gap-1.5 border"
              style={{ borderColor: `${colors.hex}60` }}
            >
              <span
                className="font-bold text-sm truncate"
                style={{ fontFamily: 'Orbitron, sans-serif', color: colors.hex, fontSize: 'clamp(9px, 1vw, 13px)' }}
              >
                {team.name}
              </span>
              <div className="text-xs text-muted-foreground/60">
                {team.players.filter(p => p.name.trim()).map(p => p.name).join(', ') || '—'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Demo round notice */}
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-xl border-2 w-full max-w-2xl"
        style={{ borderColor: 'oklch(0.65 0.18 55 / 0.6)', background: 'oklch(0.97 0.04 55 / 0.4)' }}
      >
        <span className="text-2xl">🎓</span>
        <div>
          <p className="font-bold text-sm tracking-wide" style={{ color: 'oklch(0.40 0.18 55)', fontFamily: 'Orbitron, sans-serif' }}>
            DEMO ROUND INCLUDED
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Game starts with an unscored demo round to explain the rules.
            No points are awarded during the demo.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-6 text-sm text-muted-foreground">
        <span>
          <span className="text-primary font-mono font-bold">{state.settings.diseases.filter(d => d.phrase.trim() && d.id !== '__demo__').length}</span> diseases
        </span>
        <span className="text-border">·</span>
        <span>
          <span className="text-primary font-mono font-bold">+{state.settings.scoreConfig.pointsPerLetter}</span> per letter
        </span>
        <span className="text-border">·</span>
        <span>
          <span className="text-accent font-mono font-bold">+{state.settings.scoreConfig.pointsForWord}</span> per word
        </span>
      </div>

      <Button
        onClick={() => { playClick(); dispatch({ type: 'START_GAME' }); }}
        className="px-14 py-6 font-black tracking-widest gap-3"
        style={{ fontFamily: 'Orbitron, sans-serif', background: 'oklch(0.50 0.20 145)', color: 'oklch(0.97 0.005 200)', fontSize: 'clamp(16px, 2vw, 22px)' }}
      >
        <Play size={22} fill="currentColor" /> START GAME
      </Button>

      <Button variant="outline" onClick={() => { playClick(); dispatch({ type: 'SET_SETUP_STEP', step: 'scoring' }); }} className="gap-2 text-sm">
        <ChevronLeft size={14} /> Back to Settings
      </Button>
    </div>
  );
}

// ---- Step indicator ----
const STEPS = ['teams', 'words', 'scoring', 'ready'] as const;
const STEP_LABELS = ['Teams', 'Words', 'Scoring', 'Launch'];
const STEP_ICONS = [Users, Stethoscope, Settings, Play];

export function SetupScreen() {
  const { state } = useGame();
  const gameName = state.settings.gameName || 'MEDWORD';
  const { setupStep } = state;
  const stepIndex = STEPS.indexOf(setupStep as typeof STEPS[number]);

  return (
    <div
      className="min-h-screen relative overflow-hidden"
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
      {/* Grid overlay */}
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

      {/* ECG top strip */}
      <div className="relative z-10">
        <EcgHeader />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-6">

        {/* Logo + title on first step */}
        {setupStep === 'teams' && (
          <div className="flex flex-col items-center gap-4 mb-8">
            <img
              src="https://d2xsxph8kpxj0f.cloudfront.net/310519663397717397/Gx248tbCJVYg8QRBdJBc3Q/medword-logo-icon-NXMLNVknANUKBidgTawME3.webp"
              alt="MedWord Logo"
              className="w-16 h-16 rounded-xl"
              style={{ boxShadow: '0 0 30px oklch(0.45 0.18 220 / 0.4)' }}
            />
            <h1
              className="font-black tracking-widest text-glow-cyan"
              style={{ fontFamily: 'Orbitron, sans-serif', color: 'oklch(0.35 0.18 225)', fontSize: 'clamp(28px, 4vw, 52px)' }}
            >
              {gameName}
            </h1>
          </div>
        )}

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-1.5 mb-8">
          {STEPS.map((step, i) => {
            const Icon = STEP_ICONS[i];
            const isActive = stepIndex === i;
            const isDone = stepIndex > i;
            return (
              <div key={step} className="flex items-center gap-1.5">
                <div
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold tracking-widest transition-all ${
                    isActive
                      ? 'bg-primary/15 border border-primary text-primary'
                      : isDone
                      ? 'bg-green-100 border border-green-500/60 text-green-700'
                      : 'bg-muted/10 border border-border/50 text-muted-foreground/50'
                  }`}
                >
                  <Icon size={10} />
                  <span className="hidden sm:inline">{STEP_LABELS[i]}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`w-4 h-px ${isDone ? 'bg-green-500/60' : 'bg-border/30'}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Step content */}
        <div className="slide-in-up">
          {setupStep === 'teams' && <TeamsStep />}
          {setupStep === 'words' && <WordsStep />}
          {setupStep === 'scoring' && <ScoringStep />}
          {setupStep === 'ready' && <ReadyStep />}
        </div>
      </div>
    </div>
  );
}
