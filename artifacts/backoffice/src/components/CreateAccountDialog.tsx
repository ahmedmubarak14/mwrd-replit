import { useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useAdminCreateAccount,
  getListClientsQueryKey,
  getListSuppliersQueryKey,
} from "@workspace/api-client-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Copy01, CheckCircle } from "@untitledui/icons";

export type CreateAccountDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountType: "client" | "supplier";
};

export function CreateAccountDialog({ open, onOpenChange, accountType }: CreateAccountDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createMutation = useAdminCreateAccount();

  // We hold onto the activation link after success so ops can copy it before
  // closing the dialog — there's no email infra in MVP, so this is the
  // hand-off surface.
  const [activationLink, setActivationLink] = useState<string | null>(null);

  const reset = () => {
    setActivationLink(null);
    onOpenChange(false);
  };

  const handleCopy = async () => {
    if (!activationLink) return;
    try {
      // Build absolute URL so ops can paste it straight into an email.
      const fullUrl = `${window.location.origin}/${accountType}${activationLink}`;
      await navigator.clipboard.writeText(fullUrl);
      toast({ title: "Activation link copied" });
    } catch {
      toast({ variant: "destructive", title: "Could not copy", description: "Select and copy manually." });
    }
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      full_name: String(fd.get("full_name") || "").trim(),
      email: String(fd.get("email") || "").trim(),
      phone: String(fd.get("phone") || "").trim(),
      company_name: String(fd.get("company_name") || "").trim(),
      account_type: accountType,
    };
    if (!payload.full_name || !payload.email || !payload.phone || !payload.company_name) {
      toast({ variant: "destructive", title: "Missing fields", description: "All fields are required." });
      return;
    }
    createMutation.mutate(
      { data: payload },
      {
        onSuccess: (result) => {
          queryClient.invalidateQueries({
            queryKey: accountType === "client" ? getListClientsQueryKey() : getListSuppliersQueryKey(),
          });
          setActivationLink(result.activation_link);
          toast({
            title: `${accountType === "client" ? "Client" : "Supplier"} account created`,
            description: "Share the activation link below with the user.",
          });
        },
        onError: (err: any) =>
          toast({ variant: "destructive", title: "Could not create account", description: err?.message ?? "Please try again." }),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); else onOpenChange(o); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add {accountType === "client" ? "Client" : "Supplier"}</DialogTitle>
          <DialogDescription>
            Creates the account in callback-completed state and generates an activation link the user can use to set their password.
          </DialogDescription>
        </DialogHeader>

        {activationLink ? (
          <div className="space-y-4 py-2">
            <div className="rounded-lg border border-[rgb(167,243,208)] bg-[rgb(236,253,243)] p-4">
              <div className="flex items-center gap-2 text-[rgb(7,148,85)]">
                <CheckCircle className="h-4 w-4" />
                <p className="text-sm font-semibold">Account created</p>
              </div>
              <p className="mt-1 text-xs text-[rgb(7,148,85)]">
                Share this activation link out-of-band. It's also logged to the API server console.
              </p>
            </div>
            <div>
              <label className="block text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide mb-1.5">
                Activation link
              </label>
              <div className="flex gap-2">
                <code
                  className="flex-1 px-3 py-2 text-xs font-mono bg-[rgb(249,250,251)] border border-[rgb(228,231,236)] rounded-md break-all"
                  data-testid="activation-link"
                >
                  {`${typeof window !== "undefined" ? window.location.origin : ""}/${accountType}${activationLink}`}
                </code>
                <Button type="button" variant="outline" onClick={handleCopy} data-testid="copy-activation-link">
                  <Copy01 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" onClick={reset}>Done</Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="block text-sm font-medium text-[rgb(52,64,84)] mb-1">Full name *</span>
                <Input name="full_name" placeholder="Jane Smith" required data-testid="account-full-name" />
              </label>
              <label className="block">
                <span className="block text-sm font-medium text-[rgb(52,64,84)] mb-1">Email *</span>
                <Input name="email" type="email" placeholder="jane@company.com" required data-testid="account-email" />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="block text-sm font-medium text-[rgb(52,64,84)] mb-1">Phone *</span>
                <Input name="phone" type="tel" placeholder="+966 5X XXX XXXX" required data-testid="account-phone" />
              </label>
              <label className="block">
                <span className="block text-sm font-medium text-[rgb(52,64,84)] mb-1">Company name *</span>
                <Input name="company_name" placeholder="Acme Trading Co." required data-testid="account-company" />
              </label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={reset}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending} data-testid="account-submit">
                {createMutation.isPending ? "Creating…" : "Create account"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
