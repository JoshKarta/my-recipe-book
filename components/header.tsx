'use client'

import { ChefHatIcon, PlusIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface HeaderProps {
  onAddRecipe: () => void
}

export function Header({ onAddRecipe }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <ChefHatIcon className="size-7 text-primary" />
          <h1 className="text-xl font-semibold">My Recipe Book</h1>
        </div>
        <Button onClick={onAddRecipe}>
          <PlusIcon />
          Add Recipe
        </Button>
      </div>
    </header>
  )
}
