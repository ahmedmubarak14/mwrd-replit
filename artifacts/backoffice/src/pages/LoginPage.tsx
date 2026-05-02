import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useBackofficeLogin } from "@workspace/api-client-react";
import { Loading01, Mail01, Lock01, Eye, EyeOff, BarChartSquare02, Users01, Shield01, ClipboardCheck, SearchMd, ArrowUp } from "@untitledui/icons";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const loginMutation = useBackofficeLogin();
  const [showPassword, setShowPassword] = useState(false);

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
      },
    });
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left — form */}
      <div className="flex flex-col w-full lg:w-1/2 px-6 sm:px-12 lg:px-20 py-8">
        <div className="flex items-center">
          <img src={`${import.meta.env.BASE_URL}logo.png`} alt="MWRD" className="h-9 w-auto" />
        </div>

        <div className="flex-1 flex items-center">
          <div className="w-full max-w-sm mx-auto lg:mx-0 space-y-8">
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-[rgb(16,24,40)]">Operations sign in</h1>
              <p className="text-sm text-[rgb(102,112,133)]">Restricted to authorized MWRD staff only.</p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-[rgb(52,64,84)]">Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail01 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[rgb(152,162,179)]" />
                          <input
                            type="email"
                            placeholder="admin@mwrd.com"
                            autoComplete="email"
                            data-testid="input-email"
                            {...field}
                            className="w-full h-10 pl-9 pr-3 rounded-lg border border-[rgb(208,213,221)] text-sm placeholder-[rgb(152,162,179)] text-[rgb(16,24,40)] focus:outline-none focus:border-[rgb(255,109,67)] focus:ring-2 focus:ring-[rgb(255,109,67)]/20 transition"
                          />
                        </div>
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
                      <FormLabel className="text-sm font-medium text-[rgb(52,64,84)]">Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock01 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[rgb(152,162,179)]" />
                          <input
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            autoComplete="current-password"
                            data-testid="input-password"
                            {...field}
                            className="w-full h-10 pl-9 pr-9 rounded-lg border border-[rgb(208,213,221)] text-sm placeholder-[rgb(152,162,179)] text-[rgb(16,24,40)] focus:outline-none focus:border-[rgb(255,109,67)] focus:ring-2 focus:ring-[rgb(255,109,67)]/20 transition"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((s) => !s)}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgb(102,112,133)] hover:text-[rgb(52,64,84)]"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="h-4 w-4 rounded border-[rgb(208,213,221)] text-[rgb(255,109,67)] focus:ring-[rgb(255,109,67)]/30"
                    />
                    <span className="text-sm text-[rgb(52,64,84)]">Remember for 30 days</span>
                  </label>
                  <button
                    type="button"
                    className="text-sm font-semibold text-[rgb(255,109,67)] hover:text-[rgb(205,56,22)]"
                  >
                    Forgot password
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loginMutation.isPending}
                  data-testid="button-submit"
                  className="w-full h-10 rounded-lg bg-[rgb(255,109,67)] text-white text-sm font-semibold shadow-sm hover:bg-[rgb(205,56,22)] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition"
                >
                  {loginMutation.isPending && <Loading01 className="h-4 w-4 animate-spin" />}
                  {loginMutation.isPending ? "Signing in…" : "Sign in"}
                </button>
              </form>
            </Form>

            <div className="rounded-lg border border-[rgb(228,231,236)] bg-[rgb(249,250,251)] px-3.5 py-2.5">
              <p className="text-xs font-semibold text-[rgb(52,64,84)] mb-0.5">Demo credentials</p>
              <p className="text-xs text-[rgb(102,112,133)] font-mono">admin@mwrd.com · admin123</p>
            </div>
          </div>
        </div>

        <p className="text-xs text-[rgb(152,162,179)]">© 2026 MWRD RAKIZ. All rights reserved.</p>
      </div>

      {/* Right — operations preview */}
      <div className="hidden lg:flex lg:w-1/2 bg-[rgb(249,250,251)] relative items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[rgb(255,247,242)] via-[rgb(249,250,251)] to-[rgb(249,250,251)]" />
        <OperationsPreview />
      </div>
    </div>
  );
}

function OperationsPreview() {
  return (
    <div className="relative ml-12 mr-[-160px] w-[680px] rounded-2xl bg-white border border-[rgb(228,231,236)] shadow-[0_24px_60px_-12px_rgba(16,24,40,0.18)] overflow-hidden">
      <div className="flex">
        <div className="w-[170px] border-r border-[rgb(228,231,236)] p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-[rgb(255,109,67)] flex items-center justify-center">
              <span className="text-white text-xs font-bold">M</span>
            </div>
            <span className="text-sm font-semibold text-[rgb(16,24,40)]">Operations</span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-md border border-[rgb(228,231,236)] bg-[rgb(249,250,251)]">
            <SearchMd className="h-3 w-3 text-[rgb(152,162,179)]" />
            <span className="text-[10px] text-[rgb(152,162,179)]">Search</span>
          </div>
          <div className="space-y-1 pt-2">
            <NavItem icon={BarChartSquare02} label="Dashboard" active />
            <NavItem icon={Users01} label="Clients" />
            <NavItem icon={Shield01} label="KYC Queue" />
            <NavItem icon={ClipboardCheck} label="Audit Log" />
          </div>
        </div>
        <div className="flex-1 p-5 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-[rgb(16,24,40)]">Operations overview</h3>
            <p className="text-[10px] text-[rgb(102,112,133)] mt-0.5">Today · May 3, 2026</p>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <StatCard label="Pending KYC" value="14" trend="+8.1%" />
            <StatCard label="Open leads" value="32" trend="+4.6%" />
          </div>
          <div className="rounded-lg border border-[rgb(228,231,236)] p-3 bg-white">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-medium text-[rgb(52,64,84)]">GMV (SAR)</span>
              <span className="text-[10px] text-[rgb(102,112,133)]">Last 6 months</span>
            </div>
            <svg viewBox="0 0 220 60" className="w-full h-14">
              <defs>
                <linearGradient id="g2" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="rgb(255,109,67)" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="rgb(255,109,67)" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M0,40 L30,32 L60,36 L90,22 L120,26 L150,14 L180,18 L220,6 L220,60 L0,60 Z" fill="url(#g2)" />
              <path d="M0,40 L30,32 L60,36 L90,22 L120,26 L150,14 L180,18 L220,6" stroke="rgb(255,109,67)" strokeWidth="1.75" fill="none" />
            </svg>
            <div className="flex justify-between mt-1 text-[8px] text-[rgb(152,162,179)]">
              <span>Nov</span><span>Dec</span><span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span>
            </div>
          </div>
          <div className="rounded-lg border border-[rgb(228,231,236)] p-3 bg-white">
            <div className="text-[11px] font-medium text-[rgb(52,64,84)] mb-2">Audit log</div>
            <div className="space-y-1.5">
              {["KYC approved · Al-Rajhi Trading", "Margin rule updated · Electronics", "Lead callback completed"].map((t) => (
                <div key={t} className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-[rgb(255,109,67)]" />
                  <span className="text-[10px] text-[rgb(52,64,84)]">{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NavItem({ icon: Icon, label, active }: { icon: any; label: string; active?: boolean }) {
  return (
    <div className={`flex items-center gap-2 px-2 py-1.5 rounded-md ${active ? "bg-[rgb(255,247,242)] text-[rgb(255,109,67)]" : "text-[rgb(102,112,133)]"}`}>
      <Icon className="h-3.5 w-3.5" />
      <span className="text-[11px] font-medium">{label}</span>
    </div>
  );
}

function StatCard({ label, value, trend }: { label: string; value: string; trend: string }) {
  return (
    <div className="rounded-lg border border-[rgb(228,231,236)] p-2.5 bg-white">
      <p className="text-[9px] uppercase tracking-wide text-[rgb(102,112,133)] font-medium">{label}</p>
      <div className="flex items-baseline gap-1.5 mt-1">
        <span className="text-base font-semibold text-[rgb(16,24,40)]">{value}</span>
        <span className="inline-flex items-center gap-0.5 text-[9px] font-medium text-[rgb(7,148,85)]">
          <ArrowUp className="h-2 w-2" />
          {trend}
        </span>
      </div>
    </div>
  );
}
