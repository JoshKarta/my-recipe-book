'use client'

import { useRef, useState } from 'react'
import {
  CameraIcon,
  ClockIcon,
  ImageIcon,
  PencilIcon,
  TrashIcon,
  UsersIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { StarRating } from '@/components/star-rating'
import type { Recipe } from '@/lib/types'

interface RecipeDetailProps {
  recipe: Recipe
  onEdit: () => void
  onDelete: () => void
  onUpdateRating: (rating: number) => void
  onUpdateImage: (image: string) => void
}

export function RecipeDetail({
  recipe,
  onEdit,
  onDelete,
  onUpdateRating,
  onUpdateImage,
}: RecipeDetailProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        onUpdateImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
        {recipe.image ? (
          <img
            src={recipe.image}
            alt={recipe.title}
            className="size-full object-cover"
          />
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <ImageIcon className="size-16" />
            <span className="text-sm">No photo yet</span>
          </div>
        )}
        <Button
          size="sm"
          variant="secondary"
          className="absolute bottom-3 right-3"
          onClick={() => fileInputRef.current?.click()}
        >
          <CameraIcon />
          {recipe.image ? 'Change Photo' : 'Add Photo'}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="hidden"
        />
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-2xl font-semibold text-balance">{recipe.title}</h2>
          <div className="flex shrink-0 gap-2">
            <Button size="icon" variant="outline" onClick={onEdit}>
              <PencilIcon />
              <span className="sr-only">Edit recipe</span>
            </Button>
            <Button
              size="icon"
              variant="outline"
              onClick={() => setShowDeleteDialog(true)}
            >
              <TrashIcon />
              <span className="sr-only">Delete recipe</span>
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Your Rating</span>
            <StarRating
              rating={recipe.rating}
              onChange={onUpdateRating}
              size="md"
            />
          </div>
          {recipe.cookingTime && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <ClockIcon className="size-4" />
              {recipe.cookingTime}
            </div>
          )}
          {recipe.servings && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <UsersIcon className="size-4" />
              {recipe.servings} servings
            </div>
          )}
        </div>

        {recipe.description && (
          <p className="text-muted-foreground">{recipe.description}</p>
        )}
      </div>

      {recipe.ingredients && (
        <div className="flex flex-col gap-2">
          <h3 className="text-lg font-medium">Ingredients</h3>
          <div className="whitespace-pre-wrap rounded-lg bg-secondary/50 p-4 text-sm">
            {recipe.ingredients}
          </div>
        </div>
      )}

      {recipe.instructions && (
        <div className="flex flex-col gap-2">
          <h3 className="text-lg font-medium">Instructions</h3>
          <div className="whitespace-pre-wrap rounded-lg bg-secondary/50 p-4 text-sm">
            {recipe.instructions}
          </div>
        </div>
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Recipe</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{recipe.title}&quot;? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
