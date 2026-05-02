import { useState } from "react";
import { 
  useGetCart, 
  useUpdateCartItem, 
  useRemoveCartItem, 
  useSaveCart, 
  useSubmitCartAsRFQ,
  getGetCartQueryKey,
} from "@workspace/api-client-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash01, Plus, Minus, FileCheck01, Save01, Calendar as CalendarIcon } from "@untitledui/icons";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectItem } from "@/components/ui/select";

export default function CartPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [rfqTitle, setRfqTitle] = useState("");
  const [deliveryCity, setDeliveryCity] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");

  const { data: cart, isLoading } = useGetCart({
    query: {
      queryKey: getGetCartQueryKey(),
    }
  });

  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();
  const saveCart = useSaveCart();
  const submitCart = useSubmitCartAsRFQ();

  const handleUpdateQty = (itemId: string, currentQty: number, delta: number) => {
    const newQty = currentQty + delta;
    if (newQty < 1) return;
    updateItem.mutate({ itemId, data: { qty: newQty } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
      }
    });
  };

  const handleRemove = (itemId: string) => {
    removeItem.mutate({ itemId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
        toast({ title: "Item removed from cart" });
      }
    });
  };

  const handleSaveCart = () => {
    saveCart.mutate({ data: { name: `Saved Cart ${new Date().toLocaleDateString()}` } }, {
      onSuccess: () => {
        toast({ title: "Cart saved successfully" });
      }
    });
  };

  const handleSubmit = () => {
    if (!rfqTitle || !deliveryCity || !deliveryDate || !cart?.id) {
      toast({ variant: "destructive", title: "Missing information", description: "Please fill in all RFQ details." });
      return;
    }

    submitCart.mutate({ 
      data: { 
        cart_id: cart.id,
        title: rfqTitle, 
        delivery_city: deliveryCity, 
        delivery_date: deliveryDate,
        description: `RFQ for ${rfqTitle}`
      } 
    }, {
      onSuccess: () => {
        setIsSubmitModalOpen(false);
        queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
        toast({ title: "RFQ submitted successfully", description: "Suppliers can now quote for your request." });
      },
      onError: (error: any) => {
        toast({ variant: "destructive", title: "Submission failed", description: error.message });
      }
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const items = cart?.items || [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Shopping Cart</h1>
        <p className="text-muted-foreground">Manage items before submitting your RFQ.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <Card key={item.id} data-testid={`card-cart-item-${item.id}`}>
              <CardContent className="p-4 flex gap-4">
                <div className="w-20 h-20 bg-muted rounded overflow-hidden flex-shrink-0">
                  <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">Product</div>
                </div>
                <div className="flex-1 space-y-1">
                  <h3 className="font-semibold" data-testid={`text-item-name-${item.id}`}>Product ID: {item.master_product_id}</h3>
                  <p className="text-sm text-muted-foreground">{item.pack_type}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center border rounded">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8" 
                        onClick={() => handleUpdateQty(item.id, item.qty, -1)}
                        disabled={item.qty <= 1 || updateItem.isPending}
                        data-testid={`button-qty-minus-${item.id}`}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-10 text-center text-sm" data-testid={`text-item-qty-${item.id}`}>{item.qty}</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8" 
                        onClick={() => handleUpdateQty(item.id, item.qty, 1)}
                        disabled={updateItem.isPending}
                        data-testid={`button-qty-plus-${item.id}`}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleRemove(item.id)}
                      disabled={removeItem.isPending}
                      data-testid={`button-remove-item-${item.id}`}
                    >
                      <Trash01 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {items.length === 0 && (
            <div className="py-20 text-center text-muted-foreground bg-muted/20 rounded-lg border-2 border-dashed">
              Your cart is empty.
            </div>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span>Total Items</span>
                <span className="font-semibold">{items.reduce((acc, item) => acc + item.qty, 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Unique Products</span>
                <span className="font-semibold">{items.length}</span>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Button 
                className="w-full gap-2" 
                variant="outline" 
                onClick={handleSaveCart}
                disabled={items.length === 0 || saveCart.isPending}
                data-testid="button-save-cart"
              >
                <Save01 className="h-4 w-4" />
                Save for Later
              </Button>
              <Button 
                className="w-full gap-2" 
                size="lg"
                onClick={() => setIsSubmitModalOpen(true)}
                disabled={items.length === 0}
                data-testid="button-submit-rfq"
              >
                <FileCheck01 className="h-4 w-4" />
                Submit as RFQ
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      <Dialog open={isSubmitModalOpen} onOpenChange={setIsSubmitModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>RFQ Details</DialogTitle>
            <DialogDescription>
              Fill in the details to submit this cart as a Request for Quotation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">RFQ Title</Label>
              <Input 
                id="title" 
                placeholder="e.g., Q1 Office Supplies" 
                value={rfqTitle}
                onChange={(e) => setRfqTitle(e.target.value)}
                data-testid="input-rfq-title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">Delivery City</Label>
              <Select
                placeholder="Select a city"
                value={deliveryCity}
                onValueChange={setDeliveryCity}
              >
                <SelectItem value="Riyadh">Riyadh</SelectItem>
                <SelectItem value="Jeddah">Jeddah</SelectItem>
                <SelectItem value="Dammam">Dammam</SelectItem>
                <SelectItem value="Khobar">Khobar</SelectItem>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Required Delivery Date</Label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="date" 
                  type="date" 
                  className="pl-9"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  data-testid="input-delivery-date"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSubmitModalOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleSubmit} 
              disabled={submitCart.isPending}
              data-testid="button-confirm-submit"
            >
              Confirm Submission
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
