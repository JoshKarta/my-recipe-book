"use client";

import {
  ChefHatIcon,
  PlusIcon,
  BookOpenIcon,
  CalendarIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Tab } from "@/lib/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Skeleton } from "boneyard-js/react";
import Link from "next/link";

interface HeaderProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  onAddRecipe: () => void;
}

export function Header({ activeTab, onTabChange, onAddRecipe }: HeaderProps) {
  const router = useRouter();
  const {
    data: session,
    isPending, //loading state
  } = authClient.useSession();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-2 hover-effect hover:scale-95"
          >
            <ChefHatIcon className="size-7 text-primary" />
            <h1 className="text-xl font-semibold hidden md:block">
              My Recipe Book
            </h1>
          </Link>
          <nav className="flex items-center gap-2">
            <button
              onClick={() => onTabChange("recipes")}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ease-out",
                activeTab === "recipes"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              <BookOpenIcon className="size-4" />
              Recipes
            </button>
            <button
              onClick={() => onTabChange("planner")}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ease-out",
                activeTab === "planner"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              <CalendarIcon className="size-4" />
              Planner
            </button>
          </nav>
        </div>
        <div className="flex gap-2 justify-center">
          {activeTab === "recipes" && (
            <Button onClick={onAddRecipe}>
              <PlusIcon />
              <span className="hidden md:block">Add Recipe</span>
            </Button>
          )}
          <Skeleton name="profile-dropdown" loading={isPending}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">{session?.user?.name}</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuGroup>
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuItem>Profile</DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={async () => {
                      await authClient.signOut({
                        fetchOptions: {
                          onSuccess: () => {
                            router.push("/signin"); // redirect to login page
                          },
                        },
                      });
                    }}
                  >
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </Skeleton>
        </div>
      </div>
    </header>
  );
}
