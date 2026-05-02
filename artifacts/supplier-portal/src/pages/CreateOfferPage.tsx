import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useListMasterProducts, useCreateOffer, getListMyOffersQueryKey } from "@workspace/api-client-react";
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
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const offerSchema = z.object({
  master_product_id: z.string().min(1, "Product is required"),
  price: z.coerce.number().min(0.01, "Price must be greater than 0"),
  stockQuantity: z.coerce.number().min(0, "Stock cannot be negative"),
});

type OfferFormValues = z.infer<typeof offerSchema>;

export default function CreateOfferPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: productsData, isLoading: productsLoading } = useListMasterProducts();
  const createOfferMutation = useCreateOffer();

  const form = useForm<OfferFormValues>({
    resolver: zodResolver(offerSchema),
    defaultValues: {
      master_product_id: "",
      price: 0,
      stockQuantity: 0,
    },
  });

  const onSubmit = (data: OfferFormValues) => {
    createOfferMutation.mutate(
      { 
        data: { 
          master_product_id: data.master_product_id,
          pack_type_pricing: [{ pack_type: "unit", supplier_cost_sar: data.price, min_order_qty: 1 }],
          default_lead_time_days: 3,
          available_quantity_estimate: data.stockQuantity
        } 
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListMyOffersQueryKey() });
          toast({ title: "Offer Created", description: "Your offer has been submitted for approval." });
          setLocation("/offers");
        },
        onError: (error: any) => {
          toast({ title: "Error", description: error.message || "Failed to create offer.", variant: "destructive" });
        }
      }
    );
  };

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold mb-8">Create New Offer</h1>

      <Card className="max-w-2xl border-card-border">
        <CardHeader>
          <CardTitle>Offer Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="master_product_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-product">
                          <SelectValue placeholder="Select a product" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {productsLoading ? (
                          <SelectItem value="loading" disabled>Loading products...</SelectItem>
                        ) : (
                          productsData?.data.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name_en}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price (SAR)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} data-testid="input-price" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="stockQuantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Initial Stock</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} data-testid="input-stock" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setLocation("/offers")}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createOfferMutation.isPending} data-testid="button-submit">
                  {createOfferMutation.isPending ? "Creating..." : "Create Offer"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
