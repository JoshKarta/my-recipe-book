export interface Recipe {
  id: string
  title: string
  description: string
  ingredients: string
  instructions: string
  cookingTime: string
  servings: string
  rating: number
  image: string | null
  createdAt: string
  updatedAt: string
}

export type RecipeFormData = Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>

export type MealType = 'breakfast' | 'lunch' | 'dinner'

export interface MealPlan {
  [date: string]: {
    [key in MealType]?: string // recipe id
  }
}

export type Tab = 'recipes' | 'planner'
