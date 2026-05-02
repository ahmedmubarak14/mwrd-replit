import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { InputField } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useBackofficeLogin } from "@workspace/api-client-react";
import { Loading01, Mail01, Lock01, LayoutGrid01 } from "@untitledui/icons";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const loginMutation = useBackofficeLogin();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: LoginFormValues) => {
    loginMutation.mutate({ data: values }, {
      onSuccess: (response) => {
        localStorage.setItem("mwrd_bo_token", response.token);
        toast({ title: "Welcome back", description: "Redirecting to operations dashboard." });
        setLocation("/");
      },
      onError: (error: any) => {
        toast({
          title: "Authentication failed",
          description: error.message || "Please check your credentials.",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="min-h-screen flex bg-background">
      <div className="hidden lg:flex lg:w-[45%] bg-sidebar flex-col justify-between p-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <LayoutGrid01 className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-semibold text-sidebar-foreground text-lg tracking-tight">MWRD Backoffice</span>
        </div>
        <div className="space-y-4">
          <blockquote className="text-sidebar-foreground/80 text-base leading-relaxed">
            "Full visibility into procurement operations, supplier performance, and financials — all in one place."
          </blockquote>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-xs font-semibold text-primary">SA</span>
            </div>
            <div>
              <p className="text-sm font-medium text-sidebar-foreground">Sara Al-Amri</p>
              <p className="text-xs text-sidebar-foreground/50">Head of Procurement, MWRD</p>
            </div>
          </div>
        </div>
        <p className="text-xs text-sidebar-foreground/30">© 2026 MWRD RAKIZ. All rights reserved.</p>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-7">
          <div className="flex items-center gap-3 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <LayoutGrid01 className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg">MWRD Backoffice</span>
          </div>

          <div className="space-y-1.5">
            <h1 className="text-2xl font-semibold tracking-tight">Operations sign in</h1>
            <p className="text-sm text-muted-foreground">Restricted to authorized MWRD staff only</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email address</FormLabel>
                    <FormControl>
                      <InputField
                        leadingIcon={<Mail01 />}
                        placeholder="admin@mwrd.com"
                        autoComplete="email"
                        data-testid="input-email"
                        {...field}
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
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <InputField
                        type="password"
                        leadingIcon={<Lock01 />}
                        placeholder="••••••••"
                        autoComplete="current-password"
                        data-testid="input-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                size="lg"
                className="w-full mt-2"
                disabled={loginMutation.isPending}
                data-testid="button-submit"
              >
                {loginMutation.isPending && <Loading01 className="animate-spin" />}
                {loginMutation.isPending ? "Signing in…" : "Sign in"}
              </Button>
            </form>
          </Form>

          <div className="rounded-lg border border-border bg-muted/40 px-4 py-3">
            <p className="text-xs text-muted-foreground font-medium mb-1">Demo credentials</p>
            <p className="text-xs text-muted-foreground">admin@mwrd.com · admin123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
