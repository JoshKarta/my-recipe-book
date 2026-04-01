"use client"

import { GameState } from "@/lib/game-types"
import { cn } from "@/lib/utils"

interface GameBoardProps {
  gameState: GameState
  onFlipCard: (cardId: string) => void
  isProcessing: boolean
}

export function GameBoard({ gameState, onFlipCard, isProcessing }: GameBoardProps) {
  const currentPlayer = gameState.players[gameState.currentPlayerIndex]

  const getMatchedPlayerColor = (matchedBy?: string) => {
    if (!matchedBy) return ""
    const player = gameState.players.find((p) => p.id === matchedBy)
    return player?.color || ""
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-center gap-3">
        {gameState.players.map((player, index) => (
          <div
            key={player.id}
            className={cn(
              "flex items-center gap-2 rounded-full px-4 py-2 transition-all",
              index === gameState.currentPlayerIndex
                ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2"
                : "bg-secondary text-secondary-foreground"
            )}
          >
            <div className={cn("size-3 rounded-full", player.color)} />
            <span className="font-medium">{player.name}</span>
            <span className="rounded-full bg-background/20 px-2 py-0.5 text-sm">
              {player.score}
            </span>
          </div>
        ))}
      </div>

      <div className="text-center text-sm text-muted-foreground">
        <span className="font-medium">{currentPlayer.name}&apos;s</span> turn
        {isProcessing && " - checking match..."}
      </div>

      <div className="grid grid-cols-4 gap-2 sm:gap-3 md:grid-cols-6">
        {gameState.cards.map((card) => (
          <button
            key={card.id}
            onClick={() => onFlipCard(card.id)}
            disabled={card.isFlipped || card.isMatched || isProcessing}
            className={cn(
              "group relative aspect-square rounded-xl text-3xl transition-all duration-300 sm:text-4xl",
              card.isMatched
                ? cn("cursor-default", getMatchedPlayerColor(card.matchedBy))
                : card.isFlipped
                  ? "bg-card shadow-lg"
                  : "cursor-pointer bg-primary/10 hover:bg-primary/20 hover:scale-105 active:scale-95"
            )}
          >
            <div
              className={cn(
                "absolute inset-0 flex items-center justify-center rounded-xl transition-all duration-300",
                card.isFlipped || card.isMatched
                  ? "opacity-100 rotate-0"
                  : "opacity-0 rotate-180"
              )}
            >
              {card.emoji}
            </div>
            {!card.isFlipped && !card.isMatched && (
              <div className="absolute inset-0 flex items-center justify-center text-2xl text-primary/30">
                ?
              </div>
            )}
            {card.isMatched && (
              <div className="absolute inset-1 rounded-lg bg-background/30" />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
