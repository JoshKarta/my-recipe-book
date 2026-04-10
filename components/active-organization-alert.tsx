"use client";
import { authClient } from "@/lib/auth-client";
import { Users2Icon, XIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "./ui/button";
import { toast } from "sonner";

export default function ActiveOrganizationAlert() {
  const { data: activeOrganization } = authClient.useActiveOrganization();

  const resetActiveOrganization = async () => {
    try {
      await authClient.organization.setActive({
        organizationId: null,
        organizationSlug: "",
      });
      toast.success("Reset active team.");
    } catch (error) {
      toast.error("Something went wrong", {
        description: "Please try again later",
      });
    }
  };

  return (
    <div className="pb-4">
      {activeOrganization ? (
        <Alert className="bg-blue-100 text-blue-500 border-blue-300 relative">
          <Users2Icon />
          <AlertTitle className="font-bold w-full">
            {activeOrganization?.name}
            <Button
              className="absolute right-[1%] top-4 cursor-pointer"
              size={"icon-sm"}
              variant={"destructive"}
              onClick={() => resetActiveOrganization()}
            >
              <XIcon />
            </Button>
          </AlertTitle>
          <AlertDescription className="text-blue-400">
            <p>
              Currently you are in team{" "}
              <span className="font-bold">{activeOrganization?.name}</span>
            </p>
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
  //   return <div>active-organization-alert</div>;
}
