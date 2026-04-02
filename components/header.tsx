'use client'

import { ChefHatIcon, PlusIcon, BookOpenIcon, CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Tab } from '@/lib/types'

interface HeaderProps {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
  onAddRecipe: () => void
}

export function Header({ activeTab, onTabChange, onAddRecipe }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <ChefHatIcon className="size-7 text-primary" />
            <h1 className="text-xl font-semibold">My Recipe Book</h1>
          </div>
          <nav className="flex items-center gap-1">
            <button
              onClick={() => onTabChange('recipes')}
              className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                activeTab === 'recipes'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              )}
            >
              <BookOpenIcon className="size-4" />
              Recipes
            </button>
            <button
              onClick={() => onTabChange('planner')}
              className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                activeTab === 'planner'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              )}
            >
              <CalendarIcon className="size-4" />
              Planner
            </button>
          </nav>
        </div>
        {activeTab === 'recipes' && (
          <Button onClick={onAddRecipe}>
            <PlusIcon />
            Add Recipe
          </Button>
        )}
      </div>
    </header>
  )
}
