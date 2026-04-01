'use client'

import { useCallback, useEffect, useState } from 'react'
import type { Recipe, RecipeFormData } from '@/lib/types'

const STORAGE_KEY = 'recipe-book-recipes'

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export function useRecipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        setRecipes(JSON.parse(stored))
      } catch {
        setRecipes([])
      }
    }
    setIsLoaded(true)
  }, [])

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes))
    }
  }, [recipes, isLoaded])

  const addRecipe = useCallback((data: RecipeFormData) => {
    const now = new Date().toISOString()
    const newRecipe: Recipe = {
      ...data,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    }
    setRecipes((prev) => [newRecipe, ...prev])
    return newRecipe
  }, [])

  const updateRecipe = useCallback((id: string, data: Partial<RecipeFormData>) => {
    setRecipes((prev) =>
      prev.map((recipe) =>
        recipe.id === id
          ? { ...recipe, ...data, updatedAt: new Date().toISOString() }
          : recipe
      )
    )
  }, [])

  const deleteRecipe = useCallback((id: string) => {
    setRecipes((prev) => prev.filter((recipe) => recipe.id !== id))
  }, [])

  const getRecipe = useCallback(
    (id: string) => recipes.find((recipe) => recipe.id === id),
    [recipes]
  )

  return {
    recipes,
    isLoaded,
    addRecipe,
    updateRecipe,
    deleteRecipe,
    getRecipe,
  }
}
