export interface RecipeImage {
  id: string;
  recipeId: string;
  url: string;
  order: number;
  createdAt: string;
}

export interface Recipe {
  id: string;
  title: string;
  description: string | null;
  ingredients: string;
  instructions: string;
  cookingTime: string | null;
  servings: string | null;
  rating: number;
  /** First image URL — kept for backward compatibility with RecipeCard / RecipeDetail */
  image: string | null;
  /** All images for this recipe */
  images: RecipeImage[];
  createdById: string;
  organizationId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RecipeFormData {
  title: string;
  description: string | null;
  ingredients: string;
  instructions: string;
  cookingTime: string | null;
  servings: string | null;
  rating: number;
  /** Primary image (kept for form backward compat) */
  image: string | null;
  /** Additional image URLs */
  images?: string[];
  organizationId?: string | null;
}

export type MealType = "breakfast" | "lunch" | "dinner";

export interface MealPlanEntry {
  id: string;
  date: string;
  mealType: MealType;
  recipeId: string;
  createdById: string;
  organizationId: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Keyed by date → mealType → recipeId (kept for backward compat with WeeklyPlanner) */
export interface MealPlan {
  [date: string]: {
    [key in MealType]?: string;
  };
}

export type Tab = "recipes" | "planner";
