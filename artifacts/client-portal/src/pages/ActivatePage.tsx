import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useLocation } from "wouter";
import { useActivateAccount } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, AlertCircle } from "@untitledui/icons";

const inputCls =
  "block w-full rounded-lg border border-[rgb(228,231,236)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(255,109,67)]/30 focus:border-[rgb(255,109,67)]";

export default function ActivatePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // wouter doesn't parse the query string for us; pull it off the live URL.
  const token = useMemo(() => {
    if (typeof window === "undefined") return "";
    return new URL(window.location.href).searchParams.get("token") ?? "";
  }, []);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [terms, setTerms] = useState(false);

  const activate = useActivateAccount();

  // If the user already has a session, send them straight to the dashboard
  // — no point sitting on the activation form.
  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("mwrd_token")) {
      setLocation("/");
    }
  }, [setLocation]);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token) {
      toast({ variant: "destructive", title: "Missing activation token", description: "The link is invalid or expired." });
      return;
    }
    if (password.length < 8) {
      toast({ variant: "destructive", title: "Password too short", description: "Minimum 8 characters." });
      return;
    }
    if (password !== confirm) {
      toast({ variant: "destructive", title: "Passwords don't match" });
      return;
    }
    if (!terms) {
      toast({ variant: "destructive", title: "Please accept the terms" });
      return;
    }
    activate.mutate(
      { data: { token, password } },
      {
        onSuccess: (response) => {
          // Store the session token under the client-portal key, then route
          // through onboarding (the ProtectedRoute gate will land us there
          // automatically because onboarding_completed is still false on a
          // freshly-activated account).
          localStorage.setItem("mwrd_token", response.token);
          toast({ title: "Account activated", description: "Welcome to mwrd." });
          setLocation("/onboarding");
        },
        onError: (err: any) =>
          toast({
            variant: "destructive",
            title: "Could not activate account",
            description: err?.message ?? "The link may have expired. Ask ops to re-issue it.",
          }),
      },
    );
  };

  return (
    <div className="min-h-screen bg-[rgb(249,250,251)] flex flex-col">
      <header className="px-6 sm:px-10 py-5 border-b border-[rgb(228,231,236)] bg-white">
        <img src={`${import.meta.env.BASE_URL}logo.png`} alt="mwrd" className="h-8 w-auto" />
      </header>
      <main className="flex-1 flex items-start justify-center px-6 py-10">
        <div className="w-full max-w-md">
          {!token ? (
            <div className="bg-white rounded-2xl border border-[rgb(228,231,236)] shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-6">
              <div className="flex items-center gap-3 mb-3">
                <AlertCircle className="h-6 w-6 text-[rgb(180,35,24)]" />
                <h1 className="text-xl font-semibold text-[rgb(16,24,40)]">Invalid activation link</h1>
              </div>
              <p className="text-sm text-[rgb(102,112,133)]">
                This activation link is missing its token. Ask ops to re-issue your invite.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[rgb(228,231,236)] shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-6">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="h-6 w-6 text-[rgb(255,109,67)]" />
                <div>
                  <h1 className="text-xl font-semibold text-[rgb(16,24,40)]">Activate your account</h1>
                  <p className="text-sm text-[rgb(102,112,133)]">Choose a password to finish signing up.</p>
                </div>
              </div>
              <form onSubmit={onSubmit} className="space-y-4">
                <label className="block">
                  <span className="block text-sm font-medium text-[rgb(52,64,84)] mb-1.5">
                    New password <span className="text-[rgb(217,45,32)]">*</span>
                  </span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputCls}
                    autoComplete="new-password"
                    minLength={8}
                    placeholder="At least 8 characters"
                    autoFocus
                    data-testid="activate-password"
                  />
                </label>
                <label className="block">
                  <span className="block text-sm font-medium text-[rgb(52,64,84)] mb-1.5">
                    Confirm password <span className="text-[rgb(217,45,32)]">*</span>
                  </span>
                  <input
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className={inputCls}
                    autoComplete="new-password"
                    minLength={8}
                    data-testid="activate-confirm"
                  />
                </label>
                <label className="flex items-start gap-2 text-sm text-[rgb(52,64,84)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={terms}
                    onChange={(e) => setTerms(e.target.checked)}
                    className="h-4 w-4 mt-0.5 rounded border-[rgb(208,213,221)] text-[rgb(255,109,67)] focus:ring-[rgb(255,109,67)]"
                    data-testid="activate-terms"
                  />
                  <span>
                    I agree to the mwrd Terms of Service and Privacy Policy.
                  </span>
                </label>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={activate.isPending}
                  data-testid="activate-submit"
                >
                  {activate.isPending ? "Activating…" : "Activate account"}
                </Button>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
