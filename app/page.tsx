'use client'

import { useState } from 'react'
import { BookOpenIcon, SearchIcon } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/header'
import { RecipeCard } from '@/components/recipe-card'
import { RecipeForm } from '@/components/recipe-form'
import { RecipeDetail } from '@/components/recipe-detail'
import { useRecipes } from '@/hooks/use-recipes'
import type { Recipe, RecipeFormData } from '@/lib/types'

export default function RecipeBookPage() {
  const { recipes, isLoaded, addRecipe, updateRecipe, deleteRecipe } =
    useRecipes()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)

  const filteredRecipes = recipes.filter(
    (recipe) =>
      recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAddRecipe = (data: RecipeFormData) => {
    addRecipe(data)
    setIsAddDialogOpen(false)
  }

  const handleEditRecipe = (data: RecipeFormData) => {
    if (selectedRecipe) {
      updateRecipe(selectedRecipe.id, data)
      setIsEditDialogOpen(false)
      setSelectedRecipe({ ...selectedRecipe, ...data })
    }
  }

  const handleDeleteRecipe = () => {
    if (selectedRecipe) {
      deleteRecipe(selectedRecipe.id)
      setIsDetailDialogOpen(false)
      setSelectedRecipe(null)
    }
  }

  const handleUpdateRating = (rating: number) => {
    if (selectedRecipe) {
      updateRecipe(selectedRecipe.id, { rating })
      setSelectedRecipe({ ...selectedRecipe, rating })
    }
  }

  const handleUpdateImage = (image: string) => {
    if (selectedRecipe) {
      updateRecipe(selectedRecipe.id, { image })
      setSelectedRecipe({ ...selectedRecipe, image })
    }
  }

  const handleRecipeClick = (recipe: Recipe) => {
    setSelectedRecipe(recipe)
    setIsDetailDialogOpen(true)
  }

  const handleEditClick = () => {
    setIsDetailDialogOpen(false)
    setIsEditDialogOpen(true)
  }

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header onAddRecipe={() => setIsAddDialogOpen(true)} />
        <main className="flex flex-1 items-center justify-center">
          <div className="text-muted-foreground">Loading recipes...</div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header onAddRecipe={() => setIsAddDialogOpen(true)} />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        {recipes.length > 0 && (
          <div className="relative mb-6">
            <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search recipes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        )}

        {recipes.length === 0 ? (
          <Empty className="border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <BookOpenIcon />
              </EmptyMedia>
              <EmptyTitle>No recipes yet</EmptyTitle>
              <EmptyDescription>
                Start building your recipe collection by adding your first
                recipe.
              </EmptyDescription>
            </EmptyHeader>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              Add Your First Recipe
            </Button>
          </Empty>
        ) : filteredRecipes.length === 0 ? (
          <Empty className="border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <SearchIcon />
              </EmptyMedia>
              <EmptyTitle>No recipes found</EmptyTitle>
              <EmptyDescription>
                Try adjusting your search to find what you&apos;re looking for.
              </EmptyDescription>
            </EmptyHeader>
            <Button variant="outline" onClick={() => setSearchQuery('')}>
              Clear Search
            </Button>
          </Empty>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredRecipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onClick={() => handleRecipeClick(recipe)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Add Recipe Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Recipe</DialogTitle>
          </DialogHeader>
          <RecipeForm
            onSubmit={handleAddRecipe}
            onCancel={() => setIsAddDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Recipe Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Recipe</DialogTitle>
          </DialogHeader>
          {selectedRecipe && (
            <RecipeForm
              recipe={selectedRecipe}
              onSubmit={handleEditRecipe}
              onCancel={() => setIsEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Recipe Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="sr-only">Recipe Details</DialogTitle>
          </DialogHeader>
          {selectedRecipe && (
            <RecipeDetail
              recipe={selectedRecipe}
              onEdit={handleEditClick}
              onDelete={handleDeleteRecipe}
              onUpdateRating={handleUpdateRating}
              onUpdateImage={handleUpdateImage}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
