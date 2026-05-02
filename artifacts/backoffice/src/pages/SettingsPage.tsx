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
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useGetPlatformSettings, useUpdatePlatformSettings, getGetPlatformSettingsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect } from "react";

const settingsSchema = z.object({
  auto_quote_globally_enabled: z.boolean(),
  rfq_expiry_days: z.coerce.number().min(1),
  vat_rate: z.coerce.number().min(0).max(100),
  auto_quote_admin_hold_threshold_sar: z.coerce.number().min(0),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: settings, isLoading } = useGetPlatformSettings();
  const updateMutation = useUpdatePlatformSettings();

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      auto_quote_globally_enabled: false,
      rfq_expiry_days: 7,
      vat_rate: 15,
      auto_quote_admin_hold_threshold_sar: 50000,
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        auto_quote_globally_enabled: settings.auto_quote_globally_enabled,
        rfq_expiry_days: settings.rfq_expiry_days,
        vat_rate: settings.vat_rate,
        auto_quote_admin_hold_threshold_sar: settings.auto_quote_admin_hold_threshold_sar,
      });
    }
  }, [settings, form]);

  const onSubmit = (values: SettingsFormValues) => {
    updateMutation.mutate({ data: values }, {
      onSuccess: () => {
        toast({ title: "Settings updated successfully" });
        queryClient.invalidateQueries({ queryKey: getGetPlatformSettingsQueryKey() });
      },
      onError: (err: any) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Card>
          <CardContent className="pt-6 space-y-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold">Platform Settings</h1>
        <p className="text-muted-foreground">Configure global operational parameters and business rules.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Core Configuration</CardTitle>
          <CardDescription>Main switches and global thresholds.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="auto_quote_globally_enabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Global Auto-Quoting</FormLabel>
                      <FormDescription>
                        Enable automated quote generation for all standard RFQs.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="rfq_expiry_days"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>RFQ Expiry (Days)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="vat_rate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>VAT Rate (%)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="auto_quote_admin_hold_threshold_sar"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Auto-Approval Threshold (SAR)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormDescription>
                      Quotes above this value require manual admin review.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full"
                disabled={updateMutation.isPending}
                data-testid="button-save-settings"
              >
                {updateMutation.isPending ? "Updating..." : "Save Settings"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
