import { useState, type FormEvent } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetMe,
  useCompleteOnboarding,
  getGetMeQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Building01, Users01 } from "@untitledui/icons";

type Step = 1 | 2 | 3;

const inputCls =
  "block w-full rounded-lg border border-[rgb(228,231,236)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(255,109,67)]/30 focus:border-[rgb(255,109,67)]";

export default function OnboardingPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: me, isLoading } = useGetMe({
    query: { queryKey: getGetMeQueryKey() },
  });

  const completeOnboarding = useCompleteOnboarding();

  const [step, setStep] = useState<Step>(1);
  const [crNumber, setCrNumber] = useState("");
  const [vatNumber, setVatNumber] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");

  const handleStep1 = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!crNumber.trim() || !vatNumber.trim() || !businessAddress.trim()) {
      toast({ variant: "destructive", title: "Missing fields", description: "CR, VAT and business address are required." });
      return;
    }
    setStep(2);
  };

  const handleSubmit = () => {
    completeOnboarding.mutate(
      {
        data: {
          cr_number: crNumber.trim(),
          vat_number: vatNumber.trim(),
          full_address: businessAddress.trim(),
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
          setStep(3);
        },
        onError: (err: any) =>
          toast({ variant: "destructive", title: "Could not save onboarding", description: err?.message ?? "Please try again." }),
      },
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <Skeleton className="h-96 w-full max-w-xl" />
      </div>
    );
  }

  // If the user lands here after already completing, send them home so they
  // don't sit on a stale wizard.
  if (me?.company?.onboarding_completed && step !== 3) {
    setLocation("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-[rgb(249,250,251)] flex flex-col">
      <header className="px-6 sm:px-10 py-5 border-b border-[rgb(228,231,236)] bg-white">
        <img src={`${import.meta.env.BASE_URL}logo.png`} alt="mwrd" className="h-8 w-auto" />
      </header>
      <main className="flex-1 flex items-start justify-center px-6 py-10">
        <div className="w-full max-w-xl space-y-6">
          {/* Step indicator */}
          <ol className="flex items-center gap-2" aria-label="Onboarding progress">
            {[1, 2, 3].map((n) => {
              const reached = n <= step;
              const current = n === step;
              return (
                <li key={n} className="flex items-center gap-2 flex-1">
                  <div
                    className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold border-2 ${
                      reached
                        ? current
                          ? "bg-[rgb(255,109,67)] border-[rgb(255,109,67)] text-white"
                          : "bg-[rgb(7,148,85)] border-[rgb(7,148,85)] text-white"
                        : "bg-white border-[rgb(228,231,236)] text-[rgb(152,162,179)]"
                    }`}
                  >
                    {reached && !current ? <CheckCircle className="h-3.5 w-3.5" /> : n}
                  </div>
                  {n < 3 && (
                    <div className={`flex-1 h-0.5 ${n < step ? "bg-[rgb(7,148,85)]" : "bg-[rgb(228,231,236)]"}`} />
                  )}
                </li>
              );
            })}
          </ol>

          {step === 1 && (
            <div className="bg-white rounded-2xl border border-[rgb(228,231,236)] shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-6">
              <div className="flex items-center gap-3 mb-4">
                <Building01 className="h-6 w-6 text-[rgb(255,109,67)]" />
                <div>
                  <h1 className="text-xl font-semibold text-[rgb(16,24,40)]">About your company</h1>
                  <p className="text-sm text-[rgb(102,112,133)]">These appear on your invoices and POs.</p>
                </div>
              </div>
              <form onSubmit={handleStep1} className="space-y-4">
                <label className="block">
                  <span className="block text-sm font-medium text-[rgb(52,64,84)] mb-1.5">
                    Commercial Registration (CR) <span className="text-[rgb(217,45,32)]">*</span>
                  </span>
                  <input
                    type="text"
                    value={crNumber}
                    onChange={(e) => setCrNumber(e.target.value)}
                    placeholder="e.g. 1010101010"
                    className={inputCls}
                    data-testid="onboarding-cr"
                    autoFocus
                  />
                </label>
                <label className="block">
                  <span className="block text-sm font-medium text-[rgb(52,64,84)] mb-1.5">
                    VAT Registration Number <span className="text-[rgb(217,45,32)]">*</span>
                  </span>
                  <input
                    type="text"
                    value={vatNumber}
                    onChange={(e) => setVatNumber(e.target.value)}
                    placeholder="e.g. 300000000000003"
                    className={inputCls}
                    data-testid="onboarding-vat"
                  />
                </label>
                <label className="block">
                  <span className="block text-sm font-medium text-[rgb(52,64,84)] mb-1.5">
                    Business address <span className="text-[rgb(217,45,32)]">*</span>
                  </span>
                  <textarea
                    value={businessAddress}
                    onChange={(e) => setBusinessAddress(e.target.value)}
                    rows={3}
                    placeholder="Street, district, city, postal code"
                    className={inputCls}
                    data-testid="onboarding-address"
                  />
                </label>
                <div className="flex justify-end pt-2">
                  <Button type="submit" data-testid="onboarding-step1-next">Continue</Button>
                </div>
              </form>
            </div>
          )}

          {step === 2 && (
            <div className="bg-white rounded-2xl border border-[rgb(228,231,236)] shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-6">
              <div className="flex items-center gap-3 mb-4">
                <Users01 className="h-6 w-6 text-[rgb(255,109,67)]" />
                <div>
                  <h1 className="text-xl font-semibold text-[rgb(16,24,40)]">Set up your first user roles</h1>
                  <p className="text-sm text-[rgb(102,112,133)]">
                    Optional — you can invite users and define roles after signup from the Account page.
                  </p>
                </div>
              </div>
              <div className="space-y-3 text-sm text-[rgb(52,64,84)]">
                <div className="rounded-lg border border-[rgb(228,231,236)] bg-[rgb(249,250,251)] p-4">
                  <p className="font-medium text-[rgb(16,24,40)]">What happens next?</p>
                  <ul className="mt-2 space-y-1.5 list-disc pl-5 text-[rgb(102,112,133)]">
                    <li>You'll land on your dashboard with a fully-stocked catalog.</li>
                    <li>Head to <strong>Account → Roles</strong> to define permissions per role.</li>
                    <li>Use <strong>Account → Approval Tree</strong> to gate orders through an approval chain.</li>
                  </ul>
                </div>
              </div>
              <div className="flex justify-between pt-5">
                <Button type="button" variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={completeOnboarding.isPending}
                  data-testid="onboarding-step2-finish"
                >
                  {completeOnboarding.isPending ? "Saving…" : "Finish setup"}
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="bg-white rounded-2xl border border-[rgb(228,231,236)] shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-8 text-center">
              <div className="mx-auto h-14 w-14 rounded-full bg-[rgb(236,253,243)] flex items-center justify-center mb-4">
                <CheckCircle className="h-7 w-7 text-[rgb(7,148,85)]" />
              </div>
              <h1 className="text-2xl font-semibold text-[rgb(16,24,40)]">You're all set</h1>
              <p className="mt-2 text-sm text-[rgb(102,112,133)]">
                Your account is ready. Browse the catalog or submit your first RFQ to get supplier quotes.
              </p>
              <div className="mt-6 flex justify-center gap-2">
                <Button onClick={() => setLocation("/catalog")} variant="outline" data-testid="onboarding-go-catalog">
                  Browse catalog
                </Button>
                <Button onClick={() => setLocation("/")} data-testid="onboarding-go-dashboard">
                  Go to dashboard
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
