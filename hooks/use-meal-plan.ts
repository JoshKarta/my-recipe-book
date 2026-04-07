"use client";

import { useState, useEffect, useCallback } from "react";
import type { MealPlan, MealType } from "@/lib/types";

export function useMealPlan() {
  const [mealPlan, setMealPlan] = useState<MealPlan>({});
  const [isLoaded, setIsLoaded] = useState(false);

  // Load all visible meal plans on mount
  useEffect(() => {
    fetch("/api/meal-plans")
      .then((res) => (res.ok ? res.json() : {}))
      .then((data: MealPlan) => setMealPlan(data))
      .catch(() => setMealPlan({}))
      .finally(() => setIsLoaded(true));
  }, []);

  const setMeal = useCallback(
    async (date: string, mealType: MealType, recipeId: string | null) => {
      if (recipeId === null) {
        // Optimistic update
        setMealPlan((prev) => {
          const dayPlan = { ...(prev[date] || {}) };
          delete dayPlan[mealType];
          if (Object.keys(dayPlan).length === 0) {
            const { [date]: _, ...remaining } = prev;
            return remaining;
          }
          return { ...prev, [date]: dayPlan };
        });
        await fetch(
          `/api/meal-plans?date=${encodeURIComponent(date)}&mealType=${encodeURIComponent(mealType)}`,
          { method: "DELETE" },
        );
      } else {
        // Optimistic update
        setMealPlan((prev) => ({
          ...prev,
          [date]: { ...(prev[date] || {}), [mealType]: recipeId },
        }));
        await fetch("/api/meal-plans", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date, mealType, recipeId }),
        });
      }
    },
    [],
  );

  const getMeal = useCallback(
    (date: string, mealType: MealType): string | undefined => {
      return mealPlan[date]?.[mealType];
    },
    [mealPlan],
  );

  const clearDay = useCallback(
    async (date: string) => {
      const dayPlan = mealPlan[date];
      if (!dayPlan) return;
      setMealPlan((prev) => {
        const { [date]: _, ...rest } = prev;
        return rest;
      });
      // Remove each slot server-side
      await Promise.all(
        (Object.keys(dayPlan) as MealType[]).map((mealType) =>
          fetch(
            `/api/meal-plans?date=${encodeURIComponent(date)}&mealType=${encodeURIComponent(mealType)}`,
            { method: "DELETE" },
          ),
        ),
      );
    },
    [mealPlan],
  );

  return { mealPlan, isLoaded, setMeal, getMeal, clearDay };
}
