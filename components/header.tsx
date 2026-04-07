"use client";

import {
  ChefHatIcon,
  PlusIcon,
  BookOpenIcon,
  CalendarIcon,
  Plus,
  UsersIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Tab } from "@/lib/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Skeleton } from "boneyard-js/react";
import Link from "next/link";
import { CreateTeamModal } from "@/components/create-team-modal";
import { NotificationsDropdown } from "@/components/notifications-dropdown";
import { TeamDetailDialog } from "@/components/team-detail-dialog";
import { toast } from "sonner";
import { Organization } from "better-auth/plugins";

interface HeaderProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  onAddRecipe: () => void;
}

export function Header({ activeTab, onTabChange, onAddRecipe }: HeaderProps) {
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [createTeamOpen, setCreateTeamOpen] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [teamDialogOpen, setTeamDialogOpen] = useState(false);
  const [orgs, setOrgs] = useState<Array<{ id: string; name: string }>>([]);

  const {
    data: session,
    isPending, //loading state
  } = authClient.useSession();

  const { data: organizations } = authClient.useListOrganizations();

  const setActiveOrg = async (org: Organization) => {
    try {
      const { data, error } = await authClient.organization.setActive({
        organizationId: org.id,
        organizationSlug: org.slug,
      });

      if (error) {
        toast.error(error.message ?? "Failed to set active team");
      }

      toast.success(data?.name + " is the active team");
    } catch (error) {
      toast.error("Something went wrong");
    }
  };

  // Load orgs list once the session is ready
  useEffect(() => {
    if (!session) return;
    async function load() {
      const { data } =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (authClient.organization as any).listOrganizations();
      if (data)
        setOrgs(
          (data as Array<{ id: string; name: string }>).map((o) => ({
            id: o.id,
            name: o.name,
          })),
        );
    }
    void load();
  }, [session]);

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
            <Link
              href="/teams"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ease-out text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <UsersIcon className="size-4" />
              <span className="hidden md:block">Teams</span>
            </Link>
          </nav>
        </div>
        <div className="flex gap-2 justify-center items-center">
          {activeTab === "recipes" && (
            <Button onClick={onAddRecipe}>
              <PlusIcon />
              <span className="hidden md:block">Add Recipe</span>
            </Button>
          )}
          <NotificationsDropdown />
          <Skeleton name="profile-dropdown" loading={isPending}>
            <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">{session?.user?.name}</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuGroup>
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuItem>Profile</DropdownMenuItem>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>Teams</DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent className="min-w-[180px]">
                        {organizations?.length === 0 ? (
                          <DropdownMenuItem
                            disabled
                            className="text-muted-foreground text-xs"
                          >
                            No teams yet
                          </DropdownMenuItem>
                        ) : (
                          organizations?.map((org) => (
                            <DropdownMenuItem
                              key={org.id}
                              onClick={() => {
                                setDropdownOpen(false);
                                setActiveOrg(org);
                                // setSelectedTeamId(org.id);
                                // setTeamDialogOpen(true);
                              }}
                            >
                              <UsersIcon className="size-3.5 mr-2 text-muted-foreground" />
                              {org.name}
                            </DropdownMenuItem>
                          ))
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          aria-label="create-team"
                          onClick={() => {
                            setDropdownOpen(false);
                            setCreateTeamOpen(true);
                          }}
                        >
                          Create Team <Plus className="size-3 ml-1" />
                        </DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>
                  <DropdownMenuItem
                    onClick={async () => {
                      await authClient.signOut({
                        fetchOptions: {
                          onSuccess: () => {
                            router.push("/signin");
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
          <CreateTeamModal
            open={createTeamOpen}
            onOpenChange={setCreateTeamOpen}
          />
          <TeamDetailDialog
            orgId={selectedTeamId}
            open={teamDialogOpen}
            onOpenChange={setTeamDialogOpen}
          />
        </div>
      </div>
    </header>
  );
}
