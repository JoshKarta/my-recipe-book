"use client"

import { GameState } from "@/lib/game-types"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Trophy, RotateCcw, ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"

interface GameOverProps {
  gameState: GameState
  onPlayAgain: () => void
  onExit: () => void
}

export function GameOver({ gameState, onPlayAgain, onExit }: GameOverProps) {
  const sortedPlayers = [...gameState.players].sort((a, b) => b.score - a.score)
  const winner = sortedPlayers[0]
  const isTie = sortedPlayers.filter((p) => p.score === winner.score).length > 1

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex size-16 items-center justify-center rounded-full bg-accent/20">
            <Trophy className="size-8 text-accent" />
          </div>
          <CardTitle className="text-2xl">
            {isTie ? "It&apos;s a Tie!" : `${winner.name} Wins!`}
          </CardTitle>
          <CardDescription>
            Game completed in {gameState.turnCount} turns
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            {sortedPlayers.map((player, index) => (
              <div
                key={player.id}
                className={cn(
                  "flex items-center justify-between rounded-lg p-3",
                  index === 0 ? "bg-accent/10" : "bg-secondary/50"
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="flex size-6 items-center justify-center rounded-full bg-background text-sm font-bold">
                    {index + 1}
                  </span>
                  <div className={cn("size-3 rounded-full", player.color)} />
                  <span className="font-medium">{player.name}</span>
                </div>
                <span className="text-lg font-bold">
                  {player.score} {player.score === 1 ? "pair" : "pairs"}
                </span>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <Button onClick={onPlayAgain} size="lg" className="w-full">
              <RotateCcw className="size-4" />
              Play Again
            </Button>
            <Button
              onClick={onExit}
              variant="outline"
              size="lg"
              className="w-full"
            >
              <ArrowLeft className="size-4" />
              Back to Setup
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
