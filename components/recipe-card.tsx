'use client'

import { ClockIcon, ImageIcon, UsersIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StarRating } from '@/components/star-rating'
import type { Recipe } from '@/lib/types'

interface RecipeCardProps {
  recipe: Recipe
  onClick: () => void
}

export function RecipeCard({ recipe, onClick }: RecipeCardProps) {
  return (
    <Card
      className="cursor-pointer overflow-hidden pt-0 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg"
      onClick={onClick}
    >
      <div className="relative aspect-4/3 w-full overflow-hidden bg-muted">
        {recipe.image ? (
          <img
            src={recipe.image}
            alt={recipe.title}
            className="size-full object-cover transition-transform duration-300 ease-out hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <ImageIcon className="size-12 text-muted-foreground/30" />
          </div>
        )}
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="line-clamp-1 text-lg">{recipe.title}</CardTitle>
        <StarRating rating={recipe.rating} readonly size="sm" />
      </CardHeader>
      <CardContent className="pt-0">
        <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
          {recipe.description || 'No description'}
        </p>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          {recipe.cookingTime && (
            <span className="flex items-center gap-1">
              <ClockIcon className="size-3.5" />
              {recipe.cookingTime}
            </span>
          )}
          {recipe.servings && (
            <span className="flex items-center gap-1">
              <UsersIcon className="size-3.5" />
              {recipe.servings} servings
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
