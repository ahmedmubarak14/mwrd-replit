import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  useListSavedCarts,
  getListSavedCartsQueryKey,
  useResumeSavedCart,
  getGetCartQueryKey,
} from "@workspace/api-client-react";
import type { Cart } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart01, Clock, AlertCircle } from "@untitledui/icons";

function workingDaysUntil(iso: string): number {
  const target = new Date(iso).getTime();
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  return Math.max(0, Math.ceil((target - now) / dayMs));
}

export default function SavedCartsPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [resumingId, setResumingId] = useState<string | null>(null);

  const { data: carts, isLoading } = useListSavedCarts({
    query: { queryKey: getListSavedCartsQueryKey() },
  });

  const resume = useResumeSavedCart();

  const handleResume = (cart: Cart) => {
    setResumingId(cart.id);
    resume.mutate(
      { cartId: cart.id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListSavedCartsQueryKey() });
          toast({ title: "Cart resumed", description: "Items moved to your active cart." });
          navigate("/cart");
        },
        onError: (err: any) => {
          toast({ variant: "destructive", title: "Could not resume", description: err.message });
          setResumingId(null);
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[rgb(16,24,40)]">Saved carts</h1>
        <p className="text-sm text-[rgb(102,112,133)]">
          Park multiple draft baskets and resume them later. Saved carts expire 7 days from creation.
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-44 w-full" />)}
        </div>
      ) : !carts || carts.length === 0 ? (
        <Card>
          <CardContent className="py-16 flex flex-col items-center text-center text-muted-foreground">
            <AlertCircle className="h-10 w-10 opacity-30 mb-3" />
            <p className="font-medium text-[rgb(52,64,84)]">No saved carts</p>
            <p className="text-sm mt-1 max-w-md">
              Create as many as you need from your cart and convert them to RFQs anytime. Each saved cart expires 7 days from creation.
            </p>
            <Link href="/catalog" className="mt-4">
              <Button data-testid="button-empty-browse-catalog">Browse catalog</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {carts.map((cart) => {
            const daysLeft = cart.expires_at ? workingDaysUntil(cart.expires_at) : null;
            const isExpiringSoon = daysLeft !== null && daysLeft <= 2;
            const isResuming = resumingId === cart.id && resume.isPending;
            return (
              <Card key={cart.id} className="flex flex-col" data-testid={`card-saved-cart-${cart.id}`}>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <ShoppingCart01 className="h-4 w-4 text-muted-foreground" />
                    {cart.name ?? "Untitled cart"}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline">{cart.items?.length ?? 0} items</Badge>
                    {daysLeft !== null && (
                      <Badge
                        variant="outline"
                        className={
                          isExpiringSoon
                            ? "bg-amber-500/10 text-amber-700 border-amber-500/20"
                            : ""
                        }
                      >
                        <Clock className="h-3 w-3 mr-1" />
                        {daysLeft === 0 ? "Expires today" : `${daysLeft}d left`}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-end gap-2">
                  <Button
                    onClick={() => handleResume(cart)}
                    disabled={isResuming}
                    data-testid={`button-resume-${cart.id}`}
                  >
                    {isResuming ? "Resuming…" : "Resume cart"}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Resume to make this your active cart, then submit as RFQ from /cart.
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
