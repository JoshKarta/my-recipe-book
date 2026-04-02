'use client'

import { useState, useEffect, useCallback } from 'react'
import type { MealPlan, MealType } from '@/lib/types'

const STORAGE_KEY = 'recipe-book-meal-plan'

export function useMealPlan() {
  const [mealPlan, setMealPlan] = useState<MealPlan>({})
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        setMealPlan(JSON.parse(stored))
      } catch {
        setMealPlan({})
      }
    }
    setIsLoaded(true)
  }, [])

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mealPlan))
    }
  }, [mealPlan, isLoaded])

  const setMeal = useCallback(
    (date: string, mealType: MealType, recipeId: string | null) => {
      setMealPlan((prev) => {
        const dayPlan = prev[date] || {}
        if (recipeId === null) {
          const { [mealType]: _, ...rest } = dayPlan
          if (Object.keys(rest).length === 0) {
            const { [date]: __, ...remaining } = prev
            return remaining
          }
          return { ...prev, [date]: rest }
        }
        return {
          ...prev,
          [date]: { ...dayPlan, [mealType]: recipeId },
        }
      })
    },
    []
  )

  const getMeal = useCallback(
    (date: string, mealType: MealType): string | undefined => {
      return mealPlan[date]?.[mealType]
    },
    [mealPlan]
  )

  const clearDay = useCallback((date: string) => {
    setMealPlan((prev) => {
      const { [date]: _, ...rest } = prev
      return rest
    })
  }, [])

  return { mealPlan, isLoaded, setMeal, getMeal, clearDay }
}
