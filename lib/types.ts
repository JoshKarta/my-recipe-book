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
