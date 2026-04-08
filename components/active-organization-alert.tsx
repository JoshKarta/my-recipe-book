"use client";
import { authClient } from "@/lib/auth-client";
import { Users2Icon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function ActiveOrganizationAlert() {
  const { data: activeOrganization } = authClient.useActiveOrganization();

  return (
    <div className="pb-4">
      {activeOrganization ? (
        <Alert className="bg-blue-100 text-blue-500 border-blue-300">
          <Users2Icon />
          <AlertTitle className="font-bold">
            {activeOrganization?.name}
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
