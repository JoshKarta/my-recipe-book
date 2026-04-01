"use client"

import { useState, useCallback } from "react"
import { GameState, GameCard, Player, FOOD_ITEMS, PLAYER_COLORS } from "@/lib/game-types"

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

function createCards(pairCount: number): GameCard[] {
  const selectedItems = shuffleArray(FOOD_ITEMS).slice(0, pairCount)
  const cards: GameCard[] = []

  selectedItems.forEach((item, index) => {
    cards.push(
      { id: `${index}-a`, emoji: item.emoji, name: item.name, isFlipped: false, isMatched: false },
      { id: `${index}-b`, emoji: item.emoji, name: item.name, isFlipped: false, isMatched: false }
    )
  })

  return shuffleArray(cards)
}

export function useMemoryGame() {
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const startGame = useCallback((playerNames: string[], pairCount: number = 6) => {
    const players: Player[] = playerNames.map((name, index) => ({
      id: `player-${index}`,
      name,
      score: 0,
      color: PLAYER_COLORS[index % PLAYER_COLORS.length],
    }))

    setGameState({
      players,
      cards: createCards(pairCount),
      currentPlayerIndex: 0,
      flippedCards: [],
      isGameOver: false,
      turnCount: 0,
    })
  }, [])

  const flipCard = useCallback((cardId: string) => {
    if (!gameState || isProcessing) return

    const card = gameState.cards.find((c) => c.id === cardId)
    if (!card || card.isFlipped || card.isMatched) return
    if (gameState.flippedCards.length >= 2) return

    setGameState((prev) => {
      if (!prev) return prev

      const newCards = prev.cards.map((c) =>
        c.id === cardId ? { ...c, isFlipped: true } : c
      )
      const newFlippedCards = [...prev.flippedCards, cardId]

      return {
        ...prev,
        cards: newCards,
        flippedCards: newFlippedCards,
      }
    })

    if (gameState.flippedCards.length === 1) {
      setIsProcessing(true)
      const firstCardId = gameState.flippedCards[0]
      const firstCard = gameState.cards.find((c) => c.id === firstCardId)
      const secondCard = gameState.cards.find((c) => c.id === cardId)

      setTimeout(() => {
        setGameState((prev) => {
          if (!prev) return prev

          const isMatch = firstCard?.emoji === secondCard?.emoji

          if (isMatch) {
            const currentPlayer = prev.players[prev.currentPlayerIndex]
            const newCards = prev.cards.map((c) =>
              c.id === firstCardId || c.id === cardId
                ? { ...c, isMatched: true, matchedBy: currentPlayer.id }
                : c
            )
            const newPlayers = prev.players.map((p, i) =>
              i === prev.currentPlayerIndex ? { ...p, score: p.score + 1 } : p
            )
            const isGameOver = newCards.every((c) => c.isMatched)

            return {
              ...prev,
              cards: newCards,
              players: newPlayers,
              flippedCards: [],
              isGameOver,
              turnCount: prev.turnCount + 1,
            }
          } else {
            const newCards = prev.cards.map((c) =>
              c.id === firstCardId || c.id === cardId
                ? { ...c, isFlipped: false }
                : c
            )
            const nextPlayerIndex = (prev.currentPlayerIndex + 1) % prev.players.length

            return {
              ...prev,
              cards: newCards,
              currentPlayerIndex: nextPlayerIndex,
              flippedCards: [],
              turnCount: prev.turnCount + 1,
            }
          }
        })
        setIsProcessing(false)
      }, 1000)
    }
  }, [gameState, isProcessing])

  const resetGame = useCallback(() => {
    if (!gameState) return

    const playerNames = gameState.players.map((p) => p.name)
    startGame(playerNames)
  }, [gameState, startGame])

  const endGame = useCallback(() => {
    setGameState(null)
  }, [])

  return {
    gameState,
    isProcessing,
    startGame,
    flipCard,
    resetGame,
    endGame,
  }
}
