"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";

// ✅ Create a proper signin schema (no confirmPassword)
const signinSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  rememberMe: z.boolean().optional(),
});

type SigninForm = z.infer<typeof signinSchema>;

export function SigninForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SigninForm>({
    resolver: zodResolver(signinSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const onSubmit = async (formData: SigninForm) => {
    try {
      await authClient.signIn.email(
        {
          email: formData.email,
          password: formData.password,
          callbackURL: "/",
          rememberMe: formData.rememberMe,
        },
        {
          onSuccess: () => {
            toast.success("Signed in successfully!");
            router.push("/");
          },
          onError: (ctx) => {
            toast.error(ctx.error.message);
          },
        },
      );
    } catch (error: any) {
      toast.error(error?.message || "Sign in failed");
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle>Sign in to your account</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* ✅ FIX: added onSubmit */}
          <form onSubmit={handleSubmit(onSubmit)}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </Field>

              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <Link
                    href="#"
                    className="ml-auto text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </Link>
                </div>

                {/* ✅ FIX: register password correctly */}
                <Input
                  id="password"
                  type="password"
                  placeholder="********"
                  {...register("password")}
                />

                {errors.password && (
                  <p className="text-sm text-red-500">
                    {errors.password.message}
                  </p>
                )}
              </Field>

              {/* ✅ Remember Me Switch */}
              <div className="flex items-center space-x-2">
                <Switch id="remember-me" {...register("rememberMe")} />
                <Label htmlFor="remember-me">Remember me</Label>
              </div>

              <Field>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full"
                >
                  {isSubmitting ? "Signing in..." : "Sign in"}
                </Button>

                <FieldDescription className="text-center">
                  Don&apos;t have an account?{" "}
                  <Link href="/signup">Sign up</Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
