import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLogin } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loading01, Mail01, Lock01 } from "@untitledui/icons";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const loginMutation = useLogin();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (values: LoginFormValues) => {
    loginMutation.mutate({ data: values }, {
      onSuccess: (response) => {
        const role = response.user?.role;

        if (role === "supplier") {
          localStorage.setItem("mwrd_supplier_token", response.token);
          toast({ title: "Welcome back", description: "Redirecting to your supplier dashboard." });
          window.location.replace("/supplier/");
          return;
        }

        if (role === "client") {
          localStorage.setItem("mwrd_token", response.token);
          toast({ title: "Welcome back", description: "Redirecting to your dashboard." });
          window.location.replace("/");
          return;
        }

        toast({
          variant: "destructive",
          title: "Access denied",
          description: "Please use the admin portal to sign in with your staff account.",
        });
      },
      onError: (error: any) => {
        toast({
          variant: "destructive",
          title: "Sign in failed",
          description: error.message || "Please check your credentials and try again.",
        });
      },
    });
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[45%] bg-sidebar flex-col justify-between p-10">
        <div className="flex items-center">
          <img src={`${import.meta.env.BASE_URL}logo.png`} alt="MWRD" className="h-10 w-auto" />
        </div>
        <div className="space-y-4">
          <blockquote className="text-sidebar-foreground/80 text-base leading-relaxed">
            "The procurement platform that streamlined our entire supply chain operation."
          </blockquote>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-xs font-semibold text-primary">AM</span>
            </div>
            <div>
              <p className="text-sm font-medium text-sidebar-foreground">Ahmed Malik</p>
              <p className="text-xs text-sidebar-foreground/50">Procurement Manager, Al-Futtaim</p>
            </div>
          </div>
        </div>
        <p className="text-xs text-sidebar-foreground/30">© 2026 MWRD RAKIZ. All rights reserved.</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-7">
          <div className="flex items-center lg:hidden">
            <img src={`${import.meta.env.BASE_URL}logo.png`} alt="MWRD" className="h-8 w-auto" />
          </div>

          <div className="space-y-1.5">
            <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
            <p className="text-sm text-muted-foreground">
              Enter your email and password to access your account
            </p>
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
                        placeholder="name@company.com"
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

          <p className="text-center text-sm text-muted-foreground">
            New client?{" "}
            <button
              onClick={() => setLocation("/register")}
              className="text-primary font-medium hover:underline underline-offset-4"
            >
              Request access
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
