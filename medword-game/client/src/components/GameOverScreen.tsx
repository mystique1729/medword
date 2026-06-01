// ============================================================
// DESIGN: "Vital Signs" — Game Over / Final Scores screen
// Animated podium reveal + full results table with words solved
// ============================================================

import { useEffect, useState } from 'react';
import { useGame } from '@/contexts/GameContext';
import { TEAM_COLORS } from '@/lib/gameTypes';
import { playClick, playGameOver } from '@/lib/sounds';
import { EcgHeader } from './EcgHeader';
import { Confetti } from './Confetti';
import { Button } from '@/components/ui/button';
import { RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';

// Reveal sequence: 2nd rises first (1.0s), then 1st (2.0s), then 3rd (2.8s)
// Then results table rows stagger in (3.8s+)
const PODIUM_DELAYS = [2000, 1000, 2800]; // index 0=1st, 1=2nd, 2=3rd → delay in ms

export function GameOverScreen() {
  const { state, dispatch } = useGame();
  const [showConfetti, setShowConfetti] = useState(false);
  const [podiumVisible, setPodiumVisible] = useState([false, false, false]); // [1st, 2nd, 3rd]
  const [showResults, setShowResults] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);

  const sortedTeams = [...state.settings.teams].sort((a, b) => b.score - a.score);
  const gameName = state.settings.gameName || 'MEDWORD';

  // Build a map: teamId → list of disease phrases they solved
  const teamSolvedWords: Record<string, string[]> = {};
  state.settings.teams.forEach(t => { teamSolvedWords[t.id] = []; });
  Object.entries(state.round.solvedByTeamId).forEach(([wordIdxStr, teamId]) => {
    const idx = parseInt(wordIdxStr, 10);
    const phrase = state.settings.diseases[idx]?.phrase;
    if (phrase && teamSolvedWords[teamId] !== undefined) {
      teamSolvedWords[teamId].push(phrase);
    }
  });

  useEffect(() => {
    playGameOver();

    // Stagger podium reveals: 2nd → 1st → 3rd
    const order = [1, 0, 2]; // reveal order indices into podiumVisible
    order.forEach((podiumIdx, step) => {
      const delay = PODIUM_DELAYS[podiumIdx];
      setTimeout(() => {
        setPodiumVisible(prev => {
          const next = [...prev];
          next[podiumIdx] = true;
          return next;
        });
        // Confetti when 1st place reveals
        if (podiumIdx === 0) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 6000);
        }
      }, delay);
    });

    // Show "Final Results" section after all podium reveals
    setTimeout(() => setShowResults(true), 3800);
    setTimeout(() => setShowTable(true), 4200);
  }, []);

  const top3 = [sortedTeams[0], sortedTeams[1], sortedTeams[2]];
  // Podium order: 2nd (left), 1st (center), 3rd (right)
  const podiumOrder = [top3[1], top3[0], top3[2]];
  const podiumHeights = ['h-28', 'h-40', 'h-20']; // 2nd, 1st, 3rd
  const podiumLabels = ['2nd', '1st', '3rd'];
  const podiumEmojis = ['🥈', '🥇', '🥉'];
  const podiumVisibleOrder = [podiumVisible[1], podiumVisible[0], podiumVisible[2]]; // reordered for display

  return (
    <div
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{ background: 'oklch(0.88 0.025 220)' }}
    >
      {/* Victory background */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url(https://d2xsxph8kpxj0f.cloudfront.net/310519663397717397/Gx248tbCJVYg8QRBdJBc3Q/medword-victory-bg-BWURdzyfdEUN9gzHrm9z7f.webp)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.05,
        }}
      />

      {/* Spotlight beams for 1st place */}
      {podiumVisible[0] && (
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
          <div
            className="absolute"
            style={{
              top: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '300px',
              height: '100%',
              background: `linear-gradient(180deg, ${top3[0] ? TEAM_COLORS[top3[0].color].hex : '#FFD700'}22 0%, transparent 60%)`,
              animation: 'podium-spotlight 3s ease-in-out infinite',
            }}
          />
        </div>
      )}

      {/* Grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(30,80,160,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(30,80,160,0.04) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          zIndex: 1,
        }}
      />

      <Confetti active={showConfetti} />

      {/* ECG header */}
      <div className="relative z-10">
        <EcgHeader />
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center px-4 py-4 overflow-y-auto">

        {/* Title */}
        <div className="text-center mb-6 title-stamp" style={{ animationDelay: '0ms' }}>
          <h1
            className="font-black tracking-widest"
            style={{
              fontFamily: 'Orbitron, sans-serif',
              color: 'oklch(0.35 0.18 225)',
              fontSize: 'clamp(22px, 3.5vw, 48px)',
              textShadow: '0 0 20px oklch(0.45 0.18 220 / 0.4), 0 0 40px oklch(0.45 0.18 220 / 0.2)',
            }}
          >
            {gameName} — GAME OVER
          </h1>
          <p className="text-muted-foreground mt-1 tracking-widest text-sm">All diagnoses complete. Final standings below.</p>
        </div>

        {/* ---- PODIUM ---- */}
        <div className="flex items-end justify-center gap-3 mb-2 w-full max-w-2xl" style={{ minHeight: '260px' }}>
          {podiumOrder.map((team, displayIdx) => {
            const isVisible = podiumVisibleOrder[displayIdx];
            const isCenter = displayIdx === 1; // 1st place
            const colors = team ? TEAM_COLORS[team.color] : null;
            const podiumDelay = [PODIUM_DELAYS[1], PODIUM_DELAYS[0], PODIUM_DELAYS[2]][displayIdx];

            return (
              <div key={displayIdx} className="flex flex-col items-center" style={{ flex: isCenter ? '1.3' : '1', maxWidth: isCenter ? '220px' : '180px' }}>
                {/* Team card above podium block */}
                {team && isVisible && (
                  <div
                    className="podium-card-drop w-full mb-2"
                    style={{ animationDelay: `${podiumDelay}ms` }}
                  >
                    {/* Crown / emoji for 1st */}
                    {isCenter && (
                      <div
                        className="crown-bounce text-center mb-1"
                        style={{ fontSize: 'clamp(28px, 3.5vw, 44px)', animationDelay: `${podiumDelay + 200}ms`, opacity: 0 }}
                      >
                        👑
                      </div>
                    )}
                    <div
                      className="flex flex-col items-center gap-1.5 p-3 rounded-xl border-2"
                      style={{
                        borderColor: colors!.hex,
                        background: `${colors!.hex}15`,
                        boxShadow: isCenter
                          ? `0 0 30px ${colors!.hex}60, 0 0 60px ${colors!.hex}20`
                          : `0 0 15px ${colors!.hex}30`,
                      }}
                    >
                      <div
                        className="font-black tracking-widest text-center"
                        style={{
                          fontFamily: 'Orbitron, sans-serif',
                          color: colors!.hex,
                          fontSize: isCenter ? 'clamp(14px, 1.8vw, 22px)' : 'clamp(11px, 1.4vw, 17px)',
                          textShadow: `0 0 10px ${colors!.hex}80`,
                        }}
                      >
                        {team.name}
                      </div>
                      {team.players.filter(p => p.name.trim()).length > 0 && (
                        <p className="text-xs text-muted-foreground/70 text-center leading-tight">
                          {team.players.filter(p => p.name.trim()).map(p => p.name).join(' · ')}
                        </p>
                      )}
                      <div
                        className="font-black font-mono"
                        style={{
                          fontFamily: 'Orbitron, sans-serif',
                          color: colors!.hex,
                          fontSize: isCenter ? 'clamp(20px, 2.5vw, 32px)' : 'clamp(16px, 2vw, 24px)',
                        }}
                      >
                        {team.score}
                        <span className="text-xs text-muted-foreground ml-1">pts</span>
                      </div>
                      {/* Words solved count */}
                      <div className="text-xs text-muted-foreground/60">
                        {teamSolvedWords[team.id]?.length ?? 0} word{(teamSolvedWords[team.id]?.length ?? 0) !== 1 ? 's' : ''} solved
                      </div>
                    </div>
                  </div>
                )}

                {/* Podium block */}
                <div
                  className={`w-full rounded-t-lg flex flex-col items-center justify-end pb-2 ${podiumHeights[displayIdx]}`}
                  style={{
                    background: team && isVisible
                      ? `linear-gradient(180deg, ${colors!.hex}40 0%, ${colors!.hex}20 100%)`
                      : 'oklch(0.80 0.04 220)',
                    border: `2px solid ${team && isVisible ? colors!.hex + '80' : 'oklch(0.65 0.05 220)'}`,
                    borderBottom: 'none',
                    transition: 'all 0.3s ease',
                    opacity: isVisible ? 1 : 0.15,
                    transform: isVisible ? 'scaleY(1)' : 'scaleY(0)',
                    transformOrigin: 'bottom center',
                    transitionDelay: isVisible ? '0ms' : '0ms',
                    animation: isVisible ? `podium-rise 0.7s cubic-bezier(0.23,1,0.32,1) ${podiumDelay}ms both` : 'none',
                  }}
                >
                  <span style={{ fontSize: 'clamp(16px, 2vw, 24px)' }}>{podiumEmojis[displayIdx]}</span>
                  <span
                    className="font-black tracking-widest"
                    style={{
                      fontFamily: 'Orbitron, sans-serif',
                      color: isVisible && colors ? colors.hex : 'oklch(0.40 0.04 220)',
                      fontSize: 'clamp(10px, 1.2vw, 14px)',
                    }}
                  >
                    {podiumLabels[displayIdx]}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* ---- FULL RESULTS TABLE ---- */}
        {showResults && (
          <div
            className="w-full max-w-3xl mt-4"
            style={{ animation: 'slide-in-up 0.5s cubic-bezier(0.23,1,0.32,1) both' }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 h-px bg-border/30" />
              <h2
                className="text-xs font-bold tracking-widest uppercase"
                style={{ fontFamily: 'Orbitron, sans-serif', color: 'oklch(0.35 0.18 225)' }}
              >
                Final Standings &amp; Words Solved
              </h2>
              <div className="flex-1 h-px bg-border/30" />
            </div>

            <div className="flex flex-col gap-2">
              {sortedTeams.map((team, i) => {
                const colors = TEAM_COLORS[team.color];
                const isExpanded = expandedTeam === team.id;
                const solved = teamSolvedWords[team.id] ?? [];
                const rank = i + 1;
                const rankLabel = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;

                return (
                  <div
                    key={team.id}
                    className="results-row-in rounded-xl border overflow-hidden"
                    style={{
                      borderColor: `${colors.hex}40`,
                      background: `${colors.hex}08`,
                      animationDelay: `${i * 80}ms`,
                      opacity: 0,
                    }}
                  >
                    {/* Row header */}
                    <button
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-black/5 transition-colors"
                      onClick={() => setExpandedTeam(isExpanded ? null : team.id)}
                    >
                      <span className="text-xl w-8 text-center shrink-0">{rankLabel}</span>

                      <div className="flex-1 min-w-0">
                        <span
                          className="font-bold tracking-widest block truncate"
                          style={{ fontFamily: 'Orbitron, sans-serif', color: colors.hex, fontSize: 'clamp(11px, 1.3vw, 15px)' }}
                        >
                          {team.name}
                        </span>
                        {team.players.filter(p => p.name.trim()).length > 0 && (
                          <p className="text-xs text-muted-foreground/60 truncate">
                            {team.players.filter(p => p.name.trim()).map(p => p.name).join(', ')}
                          </p>
                        )}
                      </div>

                      {/* Words solved badges */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className="text-xs px-2 py-0.5 rounded-full border font-mono"
                          style={{ borderColor: `${colors.hex}40`, color: colors.hex, background: `${colors.hex}15` }}
                        >
                          {solved.length} word{solved.length !== 1 ? 's' : ''}
                        </span>
                        <span
                          className="font-black font-mono"
                          style={{ fontFamily: 'Orbitron, sans-serif', color: colors.hex, fontSize: 'clamp(14px, 1.8vw, 22px)' }}
                        >
                          {team.score}
                          <span className="text-xs text-muted-foreground ml-1 font-normal">pts</span>
                        </span>
                        {solved.length > 0 && (
                          <span className="text-muted-foreground/50">
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </span>
                        )}
                      </div>
                    </button>

                    {/* Expanded words list */}
                    {isExpanded && solved.length > 0 && (
                      <div
                        className="px-4 pb-3 pt-1 border-t"
                        style={{ borderColor: `${colors.hex}20` }}
                      >
                        <p className="text-xs text-muted-foreground/50 uppercase tracking-widest mb-2">Words solved:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {solved.map((phrase, wi) => (
                            <span
                              key={wi}
                              className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg border tracking-widest"
                              style={{
                                borderColor: `${colors.hex}40`,
                                color: colors.hex,
                                background: `${colors.hex}12`,
                                fontSize: 'clamp(9px, 0.9vw, 12px)',
                              }}
                            >
                              {phrase}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {isExpanded && solved.length === 0 && (
                      <div className="px-4 pb-3 pt-1 border-t" style={{ borderColor: `${colors.hex}20` }}>
                        <p className="text-xs text-muted-foreground/40 italic">No words solved this game.</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        {showResults && (
          <div
            className="flex gap-4 mt-6 mb-4"
            style={{ animation: 'slide-in-up 0.5s cubic-bezier(0.23,1,0.32,1) 0.3s both' }}
          >
            <Button
              onClick={() => { playClick(); dispatch({ type: 'RESET_GAME' }); }}
              className="gap-2 px-8 py-4 text-base font-bold tracking-widest"
              style={{ fontFamily: 'Orbitron, sans-serif', background: 'oklch(0.45 0.18 220)', color: 'oklch(0.97 0.005 200)' }}
            >
              <RotateCcw size={18} /> Play Again
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
