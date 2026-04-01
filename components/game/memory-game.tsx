"use client"

import { useMemoryGame } from "@/hooks/use-memory-game"
import { GameSetup } from "./game-setup"
import { GameBoard } from "./game-board"
import { GameOver } from "./game-over"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export function MemoryGame() {
  const { gameState, isProcessing, startGame, flipCard, resetGame, endGame } =
    useMemoryGame()

  if (!gameState) {
    return <GameSetup onStartGame={startGame} />
  }

  if (gameState.isGameOver) {
    return (
      <GameOver
        gameState={gameState}
        onPlayAgain={resetGame}
        onExit={endGame}
      />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={endGame}>
          <ArrowLeft className="size-4" />
          Exit Game
        </Button>
        <span className="text-sm text-muted-foreground">
          Turn {gameState.turnCount + 1}
        </span>
      </div>
      <GameBoard
        gameState={gameState}
        onFlipCard={flipCard}
        isProcessing={isProcessing}
      />
    </div>
  )
}
