import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRegister } from "@workspace/api-client-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loading01, CheckCircle, Building02, User01, Mail01, Phone, BarChartSquare02, ShoppingBag01, ClipboardCheck, Bell01, SearchMd, ArrowUp } from "@untitledui/icons";

const registerSchema = z.object({
  company_name: z.string().min(2, "Company name is too short"),
  full_name: z.string().min(2, "Full name is too short"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Invalid phone number"),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSuccess, setIsSuccess] = useState(false);
  const registerMutation = useRegister();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { company_name: "", full_name: "", email: "", phone: "" },
  });

  const onSubmit = (values: RegisterFormValues) => {
    registerMutation.mutate({ data: { ...values, account_type: "client" } }, {
      onSuccess: () => setIsSuccess(true),
      onError: (error: any) => {
        toast({
          variant: "destructive",
          title: "Registration failed",
          description: error.message || "Something went wrong. Please try again.",
        });
      },
    });
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left — form */}
      <div className="flex flex-col w-full lg:w-1/2 px-6 sm:px-12 lg:px-20 py-8">
        <div className="flex items-center">
          <a href="/" aria-label="mwrd home" className="inline-flex">
            <img src={`${import.meta.env.BASE_URL}logo.png`} alt="mwrd" className="h-9 w-auto" />
          </a>
        </div>

        <div className="flex-1 flex items-center">
          <div className="w-full max-w-sm mx-auto lg:mx-0 space-y-8">
            {isSuccess ? (
              <div className="space-y-6 text-center sm:text-left">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-[rgb(236,253,243)] border border-[rgb(167,243,208)]">
                  <CheckCircle className="h-6 w-6 text-[rgb(7,148,85)]" />
                </div>
                <div className="space-y-2">
                  <h1 className="text-3xl font-semibold tracking-tight text-[rgb(16,24,40)]">Application received</h1>
                  <p className="text-sm text-[rgb(102,112,133)]">
                    Thanks for your interest. Our team will review your company details and reach out via email shortly.
                  </p>
                </div>
                <button
                  onClick={() => setLocation("/login")}
                  className="w-full h-10 rounded-lg bg-[rgb(255,109,67)] text-white text-sm font-semibold shadow-sm hover:bg-[rgb(205,56,22)] transition"
                >
                  Back to sign in
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <h1 className="text-3xl font-semibold tracking-tight text-[rgb(16,24,40)]">Sign up</h1>
                  <p className="text-sm text-[rgb(102,112,133)]">Apply for access to mwrd's B2B procurement platform.</p>
                </div>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                    <FormField
                      control={form.control}
                      name="company_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-[rgb(52,64,84)]">Company name</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Building02 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[rgb(152,162,179)]" />
                              <input
                                placeholder="Acme Corp"
                                data-testid="input-company-name"
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
                      name="full_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-[rgb(52,64,84)]">Full name</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <User01 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[rgb(152,162,179)]" />
                              <input
                                placeholder="John Doe"
                                data-testid="input-full-name"
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
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-[rgb(52,64,84)]">Email</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail01 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[rgb(152,162,179)]" />
                              <input
                                type="email"
                                placeholder="john@company.com"
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
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-[rgb(52,64,84)]">Phone number</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[rgb(152,162,179)]" />
                              <input
                                type="tel"
                                placeholder="+966 50 000 0000"
                                autoComplete="tel"
                                data-testid="input-phone"
                                {...field}
                                className="w-full h-10 pl-9 pr-3 rounded-lg border border-[rgb(208,213,221)] text-sm placeholder-[rgb(152,162,179)] text-[rgb(16,24,40)] focus:outline-none focus:border-[rgb(255,109,67)] focus:ring-2 focus:ring-[rgb(255,109,67)]/20 transition"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <button
                      type="submit"
                      disabled={registerMutation.isPending}
                      data-testid="button-register"
                      className="w-full h-10 rounded-lg bg-[rgb(255,109,67)] text-white text-sm font-semibold shadow-sm hover:bg-[rgb(205,56,22)] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition"
                    >
                      {registerMutation.isPending && <Loading01 className="h-4 w-4 animate-spin" />}
                      {registerMutation.isPending ? "Submitting…" : "Get started"}
                    </button>
                  </form>
                </Form>

                <p className="text-center text-sm text-[rgb(102,112,133)]">
                  Already have an account?{" "}
                  <button
                    onClick={() => setLocation("/login")}
                    className="font-semibold text-[rgb(255,109,67)] hover:text-[rgb(205,56,22)]"
                  >
                    Log in
                  </button>
                </p>
              </>
            )}
          </div>
        </div>

        <p className="text-xs text-[rgb(152,162,179)]">© 2026 mwrd RAKIZ. All rights reserved.</p>
      </div>

      {/* Right — dashboard preview */}
      <div className="hidden lg:flex lg:w-1/2 bg-[rgb(249,250,251)] relative items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[rgb(255,247,242)] via-[rgb(249,250,251)] to-[rgb(249,250,251)]" />
        <DashboardPreview />
      </div>
    </div>
  );
}

function DashboardPreview() {
  return (
    <div className="relative ml-12 mr-[-160px] w-[680px] rounded-2xl bg-white border border-[rgb(228,231,236)] shadow-[0_24px_60px_-12px_rgba(16,24,40,0.18)] overflow-hidden">
      <div className="flex">
        <div className="w-[170px] border-r border-[rgb(228,231,236)] p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-[rgb(255,109,67)] flex items-center justify-center">
              <span className="text-white text-xs font-bold">M</span>
            </div>
            <span className="text-sm font-semibold text-[rgb(16,24,40)]">mwrd</span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-md border border-[rgb(228,231,236)] bg-[rgb(249,250,251)]">
            <SearchMd className="h-3 w-3 text-[rgb(152,162,179)]" />
            <span className="text-[10px] text-[rgb(152,162,179)]">Search</span>
          </div>
          <div className="space-y-1 pt-2">
            <NavItem icon={BarChartSquare02} label="Dashboard" active />
            <NavItem icon={ShoppingBag01} label="Catalog" />
            <NavItem icon={ClipboardCheck} label="RFQs" />
            <NavItem icon={Bell01} label="Notifications" />
          </div>
        </div>
        <div className="flex-1 p-5 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-[rgb(16,24,40)]">My dashboard</h3>
            <p className="text-[10px] text-[rgb(102,112,133)] mt-0.5">Welcome back, Ahmed</p>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <StatCard label="Open RFQs" value="12" trend="+2.4%" />
            <StatCard label="Active orders" value="08" trend="+6.2%" />
          </div>
          <div className="rounded-lg border border-[rgb(228,231,236)] p-3 bg-white">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-medium text-[rgb(52,64,84)]">Spend trend</span>
              <span className="text-[10px] text-[rgb(102,112,133)]">Last 6 months</span>
            </div>
            <svg viewBox="0 0 220 60" className="w-full h-14">
              <defs>
                <linearGradient id="reg-g1" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="rgb(255,109,67)" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="rgb(255,109,67)" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M0,45 L30,38 L60,42 L90,28 L120,32 L150,18 L180,22 L220,8 L220,60 L0,60 Z" fill="url(#reg-g1)" />
              <path d="M0,45 L30,38 L60,42 L90,28 L120,32 L150,18 L180,22 L220,8" stroke="rgb(255,109,67)" strokeWidth="1.75" fill="none" />
            </svg>
            <div className="flex justify-between mt-1 text-[8px] text-[rgb(152,162,179)]">
              <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span>
            </div>
          </div>
          <div className="rounded-lg border border-[rgb(228,231,236)] p-3 bg-white">
            <div className="text-[11px] font-medium text-[rgb(52,64,84)] mb-2">Recent activity</div>
            <div className="space-y-1.5">
              {["RFQ #4821 received 3 quotes", "Order #PO-1042 shipped", "New supplier approved"].map((t) => (
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
