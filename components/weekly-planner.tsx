'use client'

import { useMemo, useState } from 'react'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  XIcon,
  SunriseIcon,
  SunIcon,
  MoonIcon,
  CalendarIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useMealPlan } from '@/hooks/use-meal-plan'
import type { Recipe, MealType } from '@/lib/types'

interface WeeklyPlannerProps {
  recipes: Recipe[]
  onViewRecipe: (recipe: Recipe) => void
}

const DAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]

const MEALS: { type: MealType; label: string; icon: React.ReactNode }[] = [
  { type: 'breakfast', label: 'Breakfast', icon: <SunriseIcon className="size-4" /> },
  { type: 'lunch', label: 'Lunch', icon: <SunIcon className="size-4" /> },
  { type: 'dinner', label: 'Dinner', icon: <MoonIcon className="size-4" /> },
]

function getWeekDates(weekOffset: number): Date[] {
  const today = new Date()
  const currentDay = today.getDay()
  const sunday = new Date(today)
  sunday.setDate(today.getDate() - currentDay + weekOffset * 7)

  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(sunday)
    date.setDate(sunday.getDate() + i)
    return date
  })
}

function formatDateKey(date: Date): string {
  return date.toISOString().split('T')[0]
}

function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatWeekRange(dates: Date[]): string {
  const start = dates[0]
  const end = dates[6]
  const startMonth = start.toLocaleDateString('en-US', { month: 'short' })
  const endMonth = end.toLocaleDateString('en-US', { month: 'short' })
  const year = end.getFullYear()

  if (startMonth === endMonth) {
    return `${startMonth} ${start.getDate()} - ${end.getDate()}, ${year}`
  }
  return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}, ${year}`
}

export function WeeklyPlanner({ recipes, onViewRecipe }: WeeklyPlannerProps) {
  const { getMeal, setMeal } = useMealPlan()
  const [weekOffset, setWeekOffset] = useState(0)
  const [selectingSlot, setSelectingSlot] = useState<{
    date: string
    mealType: MealType
  } | null>(null)

  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset])
  const isCurrentWeek = weekOffset === 0

  const handleSelectRecipe = (recipeId: string) => {
    if (selectingSlot) {
      setMeal(selectingSlot.date, selectingSlot.mealType, recipeId)
      setSelectingSlot(null)
    }
  }

  const handleRemoveMeal = (date: string, mealType: MealType) => {
    setMeal(date, mealType, null)
  }

  const getRecipeById = (id: string) => recipes.find((r) => r.id === id)

  return (
    <div className="flex flex-col gap-6">
      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setWeekOffset((prev) => prev - 1)}
          >
            <ChevronLeftIcon />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setWeekOffset((prev) => prev + 1)}
          >
            <ChevronRightIcon />
          </Button>
          {!isCurrentWeek && (
            <Button variant="ghost" onClick={() => setWeekOffset(0)}>
              Today
            </Button>
          )}
        </div>
        <h2 className="text-lg font-semibold">{formatWeekRange(weekDates)}</h2>
      </div>

      {/* Weekly Grid */}
      <div className="grid gap-4 lg:grid-cols-4">
        {weekDates.map((date, index) => {
          const dateKey = formatDateKey(date)
          const isToday = formatDateKey(new Date()) === dateKey

          return (
            <Card
              key={dateKey}
              className={isToday ? 'ring-2 ring-primary' : ''}
            >
              <CardContent className="flex flex-col gap-3 p-3">
                <div className="text-center">
                  <div className="text-xs font-medium text-muted-foreground">
                    {DAYS[index]}
                  </div>
                  <div
                    className={`text-sm font-semibold ${isToday ? 'text-primary' : ''}`}
                  >
                    {formatDisplayDate(date)}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  {MEALS.map(({ type, label, icon }) => {
                    const recipeId = getMeal(dateKey, type)
                    const recipe = recipeId ? getRecipeById(recipeId) : null

                    return (
                      <div key={type} className="flex flex-col gap-1">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          {icon}
                          <span>{label}</span>
                        </div>
                        {recipe ? (
                          <div className="group relative">
                            <button
                              onClick={() => onViewRecipe(recipe)}
                              className="w-full rounded-md bg-secondary p-2 text-left text-xs font-medium transition-colors hover:bg-secondary/80"
                            >
                              <span className="line-clamp-2">{recipe.title}</span>
                            </button>
                            <button
                              onClick={() => handleRemoveMeal(dateKey, type)}
                              className="absolute -top-1 -right-1 hidden size-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground group-hover:flex"
                            >
                              <XIcon className="size-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() =>
                              setSelectingSlot({ date: dateKey, mealType: type })
                            }
                            className="w-full rounded-md border border-dashed p-2 text-xs text-muted-foreground transition-colors hover:border-primary hover:bg-secondary/50"
                          >
                            + Add
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Recipe Selection Dialog */}
      <Dialog
        open={selectingSlot !== null}
        onOpenChange={(open) => !open && setSelectingSlot(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select a Recipe</DialogTitle>
            <DialogDescription>
              Choose a recipe to add to your meal plan.
            </DialogDescription>
          </DialogHeader>
          {recipes.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <CalendarIcon />
                </EmptyMedia>
                <EmptyTitle>No recipes available</EmptyTitle>
                <EmptyDescription>
                  Add some recipes first to start planning your meals.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <ScrollArea className="max-h-80">
              <div className="flex flex-col gap-2 pr-4">
                {recipes.map((recipe) => (
                  <button
                    key={recipe.id}
                    onClick={() => handleSelectRecipe(recipe.id)}
                    className="flex items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-secondary"
                  >
                    {recipe.image ? (
                      <img
                        src={recipe.image}
                        alt={recipe.title}
                        className="size-12 shrink-0 rounded-md object-cover"
                      />
                    ) : (
                      <div className="flex size-12 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                        <CalendarIcon className="size-5" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{recipe.title}</div>
                      <div className="truncate text-sm text-muted-foreground">
                        {recipe.cookingTime && `${recipe.cookingTime} min`}
                        {recipe.cookingTime && recipe.servings && ' • '}
                        {recipe.servings && `${recipe.servings} servings`}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
