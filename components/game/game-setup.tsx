"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { PLAYER_COLORS } from "@/lib/game-types"
import { Plus, Minus, Users, Gamepad2 } from "lucide-react"

interface GameSetupProps {
  onStartGame: (playerNames: string[], pairCount: number) => void
}

export function GameSetup({ onStartGame }: GameSetupProps) {
  const [playerNames, setPlayerNames] = useState<string[]>(["Player 1", "Player 2"])
  const [pairCount, setPairCount] = useState(6)

  const addPlayer = () => {
    if (playerNames.length < 6) {
      setPlayerNames([...playerNames, `Player ${playerNames.length + 1}`])
    }
  }

  const removePlayer = (index: number) => {
    if (playerNames.length > 2) {
      setPlayerNames(playerNames.filter((_, i) => i !== index))
    }
  }

  const updatePlayerName = (index: number, name: string) => {
    const newNames = [...playerNames]
    newNames[index] = name
    setPlayerNames(newNames)
  }

  const handleStart = () => {
    const validNames = playerNames.map((name) => name.trim() || `Player ${playerNames.indexOf(name) + 1}`)
    onStartGame(validNames, pairCount)
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-primary/10">
            <Gamepad2 className="size-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Ingredient Match</CardTitle>
          <CardDescription>
            A multiplayer memory game - match the ingredients to score points!
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-medium">
                <Users className="size-4" />
                Players ({playerNames.length}/6)
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={addPlayer}
                disabled={playerNames.length >= 6}
              >
                <Plus className="size-4" />
                Add
              </Button>
            </div>

            <FieldGroup>
              {playerNames.map((name, index) => (
                <Field key={index}>
                  <div className="flex items-center gap-2">
                    <div
                      className={`size-3 shrink-0 rounded-full ${PLAYER_COLORS[index]}`}
                    />
                    <Input
                      value={name}
                      onChange={(e) => updatePlayerName(index, e.target.value)}
                      placeholder={`Player ${index + 1}`}
                      className="flex-1"
                    />
                    {playerNames.length > 2 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removePlayer(index)}
                        className="shrink-0 text-muted-foreground hover:text-destructive"
                      >
                        <Minus className="size-4" />
                      </Button>
                    )}
                  </div>
                </Field>
              ))}
            </FieldGroup>
          </div>

          <FieldGroup>
            <Field>
              <FieldLabel>Number of Pairs</FieldLabel>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPairCount(Math.max(4, pairCount - 1))}
                  disabled={pairCount <= 4}
                >
                  <Minus className="size-4" />
                </Button>
                <span className="w-12 text-center text-lg font-semibold">
                  {pairCount}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPairCount(Math.min(12, pairCount + 1))}
                  disabled={pairCount >= 12}
                >
                  <Plus className="size-4" />
                </Button>
              </div>
            </Field>
          </FieldGroup>

          <Button onClick={handleStart} size="lg" className="w-full">
            Start Game
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
