// ============================================================
// DESIGN: "Vital Signs" — Main entry point
// Routes between Setup, GameBoard, and GameOver screens
// ============================================================

import { GameProvider, useGame } from '@/contexts/GameContext';
import { SetupScreen } from '@/components/SetupScreen';
import { GameBoard } from '@/components/GameBoard';
import { GameOverScreen } from '@/components/GameOverScreen';

function GameRouter() {
  const { state } = useGame();

  switch (state.phase) {
    case 'setup':
      return <SetupScreen />;
    case 'playing':
    case 'word-solved':
      return <GameBoard />;
    case 'bonus-round':
      return <GameBoard />;
    case 'game-over':
      return <GameOverScreen />;
    default:
      return <SetupScreen />;
  }
}

export default function Home() {
  return (
    <GameProvider>
      <GameRouter />
    </GameProvider>
  );
}
