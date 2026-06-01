// ============================================================
// DESIGN: "Vital Signs" — Turn countdown timer
// Circular SVG timer that auto-passes turn when it hits zero
// Resets whenever timerKey changes (new turn / new letter guessed)
// ============================================================

import { useEffect, useRef, useState } from 'react';
import { useGame } from '@/contexts/GameContext';
import { TEAM_COLORS } from '@/lib/gameTypes';

export function TurnTimer() {
  const { state, dispatch } = useGame();
  const { timerSeconds } = state.settings.scoreConfig;
  const { timerKey, currentTeamIndex } = state.round;
  const isPlaying = state.phase === 'playing';

  const [timeLeft, setTimeLeft] = useState(timerSeconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const expiredRef = useRef(false);

  // Reset whenever timerKey changes (new turn, new letter, new word)
  useEffect(() => {
    if (timerSeconds === 0 || !isPlaying) return;
    setTimeLeft(timerSeconds);
    expiredRef.current = false;

    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          if (!expiredRef.current) {
            expiredRef.current = true;
            // Dispatch after state update to avoid mid-render dispatch
            setTimeout(() => dispatch({ type: 'TIMER_EXPIRED' }), 0);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timerKey, timerSeconds, isPlaying]);

  // Pause timer when word-solved overlay is up
  useEffect(() => {
    if (state.phase === 'word-solved' && intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, [state.phase]);

  if (timerSeconds === 0 || !isPlaying) return null;

  const currentTeam = state.settings.teams[currentTeamIndex];
  const colors = currentTeam ? TEAM_COLORS[currentTeam.color] : null;
  const teamHex = colors?.hex || '#1E50A0';

  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const progress = timeLeft / timerSeconds;
  const strokeDashoffset = circumference * (1 - progress);

  // Color shifts: green → amber → red as time runs out
  const timerColor =
    progress > 0.5 ? teamHex :
    progress > 0.25 ? '#FFB800' :
    '#FF3B3B';

  const isUrgent = timeLeft <= 5 && timeLeft > 0;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`relative ${isUrgent ? 'animate-pulse' : ''}`}>
        <svg width={56} height={56} viewBox="0 0 56 56">
          {/* Background ring */}
          <circle
            cx={28} cy={28} r={radius}
            fill="none"
            stroke="rgba(30,80,160,0.15)"
            strokeWidth={4}
          />
          {/* Progress ring */}
          <circle
            cx={28} cy={28} r={radius}
            fill="none"
            stroke={timerColor}
            strokeWidth={4}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(-90 28 28)"
            style={{
              transition: 'stroke-dashoffset 0.9s linear, stroke 0.3s ease',
              filter: `drop-shadow(0 0 4px ${timerColor}80)`,
            }}
          />
          {/* Time text */}
          <text
            x={28} y={28}
            textAnchor="middle"
            dominantBaseline="central"
            fill={timerColor}
            fontSize={timeLeft >= 10 ? 13 : 15}
            fontWeight="bold"
            fontFamily="Space Mono, monospace"
            style={{ filter: isUrgent ? `drop-shadow(0 0 6px ${timerColor})` : 'none' }}
          >
            {timeLeft}
          </text>
        </svg>
      </div>
      <span className="text-xs text-muted-foreground/60 tracking-widest uppercase">
        {timeLeft === 0 ? 'TIME!' : 'sec'}
      </span>
    </div>
  );
}
