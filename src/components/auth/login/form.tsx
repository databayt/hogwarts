"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { useState, useTransition, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  // CardDescription,
  CardHeader,
  // CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { LoginSchema } from "../validation";
import { login } from "./action";
import { FormError } from "../error/form-error";
import { FormSuccess } from "../form-success";
import { Social } from "../social";
import { Suspense } from "react";
import type { Dictionary } from "@/components/internationalization/dictionaries";

interface LoginFormProps extends React.ComponentPropsWithoutRef<"div"> {
  dictionary?: Dictionary;
}

export const LoginForm = ({
  className,
  dictionary,
  ...props
}: LoginFormProps) => {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const tenant = searchParams.get("tenant");
  const urlError = searchParams.get("error") === "OAuthAccountNotLinked"
    ? "Email already in use with different provider!"
    : "";

  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();

  // Handle tenant redirect after successful login
  useEffect(() => {
    const tenant = searchParams.get('tenant');
    
    if (tenant && success) {
      // Redirect back to tenant subdomain after successful login
      const tenantUrl = process.env.NODE_ENV === 'production'
        ? `https://${tenant}.databayt.org/dashboard`
        : `http://${tenant}.localhost:3000/dashboard`;
      
      console.log('🔄 Redirecting to tenant after login:', tenantUrl);
      window.location.href = tenantUrl;
    }
  }, [success, searchParams]);

  const form = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (values: z.infer<typeof LoginSchema>) => {
    setError("");
    setSuccess("");
    
    // Construct callback URL with tenant if present
    let finalCallbackUrl = callbackUrl;
    if (tenant && !finalCallbackUrl?.includes('tenant=')) {
      const separator = finalCallbackUrl?.includes('?') ? '&' : '?';
      finalCallbackUrl = `${finalCallbackUrl || '/dashboard'}${separator}tenant=${tenant}`;
    }
    
    console.log('📋 LOGIN FORM SUBMIT:', {
      tenant,
      callbackUrl,
      finalCallbackUrl,
      hasValues: !!values
    });
    
    startTransition(() => {
      login(values, finalCallbackUrl)
        .then((data) => {
          if (data?.error) {
            form.reset();
            setError(data.error);
          }
          if (data?.success) {
            form.reset();
            setSuccess(data.success);
          }
          if (data?.twoFactor) {
            setShowTwoFactor(true);
          }
        })
        .catch(() => setError("Something went wrong"));
    });
  };

  return (
    <div className={cn("flex flex-col gap-6 min-w-[200px] md:min-w-[350px]", className)} {...props}>
      <Card className="border-none shadow-none bg-background">
        <CardHeader className="text-center">
          {/* <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription>
            Login with your Apple or Google account
          </CardDescription> */}
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="h-10" />}> 
            <Social />
          </Suspense>
        </CardContent>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6">
              <div className="relative text-center muted after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
                <span className="relative z-10 bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
              
              <div className="grid gap-4">
                {showTwoFactor ? (
                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem className="grid gap-2">
                        <FormControl>
                          <Input
                            {...field}
                            disabled={isPending}
                            placeholder="Two Factor Code"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <>
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem className="grid gap-2">
                          <FormControl>
                            <Input
                              {...field}
                              id="email"
                              type="email"
                              disabled={isPending}
                              placeholder="Email"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem className="grid gap-2">
                          <FormControl>
                            <Input
                              {...field}
                              id="password"
                              type="password"
                              disabled={isPending}
                              placeholder="Password"
                            />
                          </FormControl>
                          <Link
                            href="/reset"
                            className="text-start hover:underline underline-offset-4"
                          >
                            Forgot password?
                          </Link>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
                
                <FormError message={error || urlError} />
                <FormSuccess message={success} />
                
                <Button disabled={isPending} type="submit" className="w-full h-11">
                  {showTwoFactor ? "Confirm" : "Login"}
                </Button>
              </div>
              
              <div className="text-center muted">
                <Link href="/join" className="hover:underline underline-offset-4">
                  Don&apos;t have an account?
                </Link>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      {/* <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:text-primary">
        By clicking continue, you agree to our <br/> <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </div> */}
    </div>
  );
};
