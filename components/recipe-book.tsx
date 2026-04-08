"use client";

import { useState } from "react";
import { BookOpenIcon, Loader2Icon, SearchIcon } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/header";
import { RecipeCard } from "@/components/recipe-card";
import { RecipeForm } from "@/components/recipe-form";
import { RecipeDetail } from "@/components/recipe-detail";
import { WeeklyPlanner } from "@/components/weekly-planner";
import { useRecipes } from "@/hooks/use-recipes";
import { authClient } from "@/lib/auth-client";
import type { Recipe, RecipeFormData, Tab } from "@/lib/types";
import ActiveOrganizationAlert from "./active-organization-alert";

export default function RecipeBook() {
  const { data: activeOrganization } = authClient.useActiveOrganization();

  const { recipes, isLoaded, addRecipe, updateRecipe, deleteRecipe } =
    useRecipes({ organizationId: activeOrganization?.id ?? null });
  const [activeTab, setActiveTab] = useState<Tab>("recipes");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  const filteredRecipes = recipes.filter(
    (recipe) =>
      recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (recipe.description ?? "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()),
  );

  const handleAddRecipe = async (data: RecipeFormData) => {
    try {
      await addRecipe({
        ...data,
        organizationId: activeOrganization?.id ?? null,
      });
      setIsAddDialogOpen(false);
      toast.success("Recipe added successfully!");
    } catch (error) {
      toast.error("Failed to add recipe");
    }
  };

  const handleEditRecipe = async (data: RecipeFormData) => {
    try {
      if (selectedRecipe) {
        const updated = await updateRecipe(selectedRecipe.id, data);
        setIsEditDialogOpen(false);
        setSelectedRecipe(updated);
        toast.success("Recipe updated successfully!");
      }
    } catch (error) {
      toast.error("Failed to update recipe");
    }
  };

  const handleDeleteRecipe = async () => {
    try {
      if (selectedRecipe) {
        await deleteRecipe(selectedRecipe.id);
        setIsDetailDialogOpen(false);
        setSelectedRecipe(null);
        toast.success("Recipe deleted successfully!");
      }
    } catch (error) {
      toast.error("Failed to delete recipe");
    }
  };

  const handleUpdateRating = async (rating: number) => {
    try {
      if (selectedRecipe) {
        const updated = await updateRecipe(selectedRecipe.id, { rating });
        setSelectedRecipe(updated);
        toast.success("Rating updated!");
      }
    } catch (error) {
      toast.error("Failed to update rating");
    }
  };

  const handleUpdateImage = async (image: string) => {
    try {
      if (selectedRecipe) {
        const updated = await updateRecipe(selectedRecipe.id, { image });
        setSelectedRecipe(updated);
        toast.success("Image updated!");
      }
    } catch (error) {
      toast.error("Failed to update image");
    }
  };

  const handleRecipeClick = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setIsDetailDialogOpen(true);
  };

  const handleEditClick = () => {
    setIsDetailDialogOpen(false);
    setIsEditDialogOpen(true);
  };

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onAddRecipe={() => setIsAddDialogOpen(true)}
        />
        <main className="flex flex-1 items-center justify-center">
          <div className="text-muted-foreground">
            <Loader2Icon className="size-8 animate-spin text-muted-foreground" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onAddRecipe={() => setIsAddDialogOpen(true)}
      />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <ActiveOrganizationAlert />

        {activeTab === "recipes" ? (
          <>
            {recipes.length > 0 && (
              <div className="relative mb-6">
                <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search recipes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  type="search"
                />
              </div>
            )}

            {recipes.length === 0 ? (
              <Empty className="border">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <BookOpenIcon />
                  </EmptyMedia>
                  <EmptyTitle>
                    {activeOrganization
                      ? `No recipes in ${activeOrganization.name} yet`
                      : "No recipes yet"}
                  </EmptyTitle>
                  <EmptyDescription>
                    {activeOrganization
                      ? `Be the first to add a recipe to ${activeOrganization.name}.`
                      : "Start building your recipe collection by adding your first recipe."}
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
                    Try adjusting your search to find what you&apos;re looking
                    for.
                  </EmptyDescription>
                </EmptyHeader>
                <Button variant="outline" onClick={() => setSearchQuery("")}>
                  Clear Search
                </Button>
              </Empty>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredRecipes.map((recipe, index) => (
                  <div
                    key={recipe.id}
                    className="animate-fade-in opacity-0"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <RecipeCard
                      recipe={recipe}
                      onClick={() => handleRecipeClick(recipe)}
                    />
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <WeeklyPlanner recipes={recipes} onViewRecipe={handleRecipeClick} />
        )}
      </main>

      {/* Add Recipe Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Recipe</DialogTitle>
            <DialogDescription>
              Fill in the details below to add a new recipe to your collection.
            </DialogDescription>
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
            <DialogDescription>
              Update the recipe details below.
            </DialogDescription>
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
            <DialogDescription className="sr-only">
              View and manage recipe details, rating, and photo.
            </DialogDescription>
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
  );
}
