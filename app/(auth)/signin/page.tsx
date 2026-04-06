import { SigninForm } from "@/components/signin-form";
import { ChefHatIcon } from "lucide-react";

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="w-full flex items-center gap-2 self-center font-medium text-center justify-center mb-4">
          <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <ChefHatIcon className="size-4" />
          </div>
          My Recipe Book.
        </div>
        <SigninForm />
      </div>
    </div>
  );
}
