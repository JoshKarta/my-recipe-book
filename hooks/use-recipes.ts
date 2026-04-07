"use client";

import { useCallback, useEffect, useState } from "react";
import type { Recipe, RecipeFormData } from "@/lib/types";

export function useRecipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load all visible recipes on mount
  useEffect(() => {
    fetch("/api/recipes")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Recipe[]) => setRecipes(data))
      .catch(() => setRecipes([]))
      .finally(() => setIsLoaded(true));
  }, []);

  const addRecipe = useCallback(
    async (data: RecipeFormData): Promise<Recipe> => {
      const res = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      const created: Recipe = await res.json();
      setRecipes((prev) => [created, ...prev]);
      return created;
    },
    [],
  );

  const updateRecipe = useCallback(
    async (id: string, data: Partial<RecipeFormData>): Promise<Recipe> => {
      const res = await fetch(`/api/recipes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      const updated: Recipe = await res.json();
      setRecipes((prev) => prev.map((r) => (r.id === id ? updated : r)));
      return updated;
    },
    [],
  );

  const deleteRecipe = useCallback(async (id: string): Promise<void> => {
    const res = await fetch(`/api/recipes/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error(await res.text());
    setRecipes((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const getRecipe = useCallback(
    (id: string) => recipes.find((r) => r.id === id),
    [recipes],
  );

  return {
    recipes,
    isLoaded,
    addRecipe,
    updateRecipe,
    deleteRecipe,
    getRecipe,
  };
}
