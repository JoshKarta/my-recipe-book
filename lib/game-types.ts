export interface Player {
  id: string
  name: string
  score: number
  color: string
}

export interface GameCard {
  id: string
  emoji: string
  name: string
  isFlipped: boolean
  isMatched: boolean
  matchedBy?: string
}

export interface GameState {
  players: Player[]
  cards: GameCard[]
  currentPlayerIndex: number
  flippedCards: string[]
  isGameOver: boolean
  turnCount: number
}

export const FOOD_ITEMS = [
  { emoji: "🍅", name: "Tomato" },
  { emoji: "🥕", name: "Carrot" },
  { emoji: "🧅", name: "Onion" },
  { emoji: "🥦", name: "Broccoli" },
  { emoji: "🍋", name: "Lemon" },
  { emoji: "🧄", name: "Garlic" },
  { emoji: "🌶️", name: "Chili" },
  { emoji: "🥬", name: "Lettuce" },
  { emoji: "🍄", name: "Mushroom" },
  { emoji: "🫑", name: "Pepper" },
  { emoji: "🥒", name: "Cucumber" },
  { emoji: "🌽", name: "Corn" },
]

export const PLAYER_COLORS = [
  "bg-rose-500",
  "bg-sky-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-violet-500",
  "bg-pink-500",
]
