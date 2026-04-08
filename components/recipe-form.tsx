"use client";

import { useCallback, useRef, useState } from "react";
import { ImageIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { StarRating } from "@/components/star-rating";
import type { Recipe, RecipeFormData } from "@/lib/types";

interface RecipeFormProps {
  recipe?: Recipe;
  onSubmit: (data: RecipeFormData) => void;
  onCancel: () => void;
}

export function RecipeForm({ recipe, onSubmit, onCancel }: RecipeFormProps) {
  const [title, setTitle] = useState(recipe?.title || "");
  const [description, setDescription] = useState(recipe?.description || "");
  const [ingredients, setIngredients] = useState(recipe?.ingredients || "");
  const [instructions, setInstructions] = useState(recipe?.instructions || "");
  const [cookingTime, setCookingTime] = useState(recipe?.cookingTime || "");
  const [servings, setServings] = useState(recipe?.servings || "");
  const [rating, setRating] = useState(recipe?.rating || 0);
  const [image, setImage] = useState<string | null>(recipe?.image || null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImage(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    },
    [],
  );

  const handleRemoveImage = useCallback(() => {
    setImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      title,
      description,
      ingredients,
      instructions,
      cookingTime,
      servings,
      rating,
      image,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="title">
            Recipe Title <span className="text-destructive">*</span>
          </FieldLabel>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter recipe title"
            required
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="description">Description</FieldLabel>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of the dish"
            rows={2}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="cookingTime">Cooking Time</FieldLabel>
            <Input
              id="cookingTime"
              value={cookingTime}
              onChange={(e) => setCookingTime(e.target.value)}
              placeholder="e.g., 30 mins"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="servings">Servings</FieldLabel>
            <Input
              id="servings"
              value={servings}
              onChange={(e) => setServings(e.target.value)}
              placeholder="e.g., 4"
            />
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="ingredients">
            Ingredients <span className="text-destructive">*</span>
          </FieldLabel>
          <Textarea
            id="ingredients"
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            placeholder="List your ingredients (one per line)"
            rows={4}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="instructions">
            Instructions <span className="text-destructive">*</span>
          </FieldLabel>
          <Textarea
            id="instructions"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Step by step instructions"
            rows={4}
          />
        </Field>

        <Field>
          <FieldLabel>Rating</FieldLabel>
          <StarRating rating={rating} onChange={setRating} size="lg" />
        </Field>

        <Field>
          <FieldLabel>Photo</FieldLabel>
          <div className="flex flex-col gap-3">
            {image ? (
              <div className="relative w-full overflow-hidden rounded-lg">
                <img
                  src={image}
                  alt="Recipe preview"
                  className="aspect-video w-full object-cover"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon-sm"
                  className="absolute top-2 right-2"
                  onClick={handleRemoveImage}
                >
                  <XIcon />
                  <span className="sr-only">Remove image</span>
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50 text-muted-foreground transition-colors hover:border-muted-foreground/50 hover:bg-muted"
              >
                <ImageIcon className="size-8" />
                <span className="text-sm">Click to upload a photo</span>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </div>
        </Field>
      </FieldGroup>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{recipe ? "Save Changes" : "Add Recipe"}</Button>
      </div>
    </form>
  );
}
