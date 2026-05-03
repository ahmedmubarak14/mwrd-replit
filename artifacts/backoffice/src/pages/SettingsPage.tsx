import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetPlatformSettings,
  useUpdatePlatformSettings,
  getGetPlatformSettingsQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

const settingsSchema = z.object({
  auto_quote_globally_enabled: z.boolean(),
  rfq_expiry_days: z.coerce.number().int().min(1).max(60),
  default_lead_time_days: z.coerce.number().int().min(1).max(60),
  vat_rate_pct: z.coerce.number().min(0).max(100),
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
      default_lead_time_days: 7,
      vat_rate_pct: 15,
      auto_quote_admin_hold_threshold_sar: 50000,
    },
  });

  // Server stores vat_rate as a decimal fraction (0.15) but ops think in
  // percent (15) — convert in/out so the form never lies.
  useEffect(() => {
    if (!settings) return;
    form.reset({
      auto_quote_globally_enabled: settings.auto_quote_globally_enabled,
      rfq_expiry_days: settings.rfq_expiry_days,
      default_lead_time_days: settings.default_lead_time_days,
      vat_rate_pct: Math.round(settings.vat_rate * 100 * 100) / 100,
      auto_quote_admin_hold_threshold_sar: settings.auto_quote_admin_hold_threshold_sar,
    });
  }, [settings, form]);

  const onSubmit = (values: SettingsFormValues) => {
    updateMutation.mutate(
      {
        data: {
          auto_quote_globally_enabled: values.auto_quote_globally_enabled,
          rfq_expiry_days: values.rfq_expiry_days,
          default_lead_time_days: values.default_lead_time_days,
          vat_rate: values.vat_rate_pct / 100,
          auto_quote_admin_hold_threshold_sar: values.auto_quote_admin_hold_threshold_sar,
        },
      },
      {
        onSuccess: () => {
          toast({ title: "Settings updated" });
          queryClient.invalidateQueries({ queryKey: getGetPlatformSettingsQueryKey() });
        },
        onError: (err: any) =>
          toast({ variant: "destructive", title: "Could not update", description: err?.message ?? "Please try again." }),
      },
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold text-[rgb(16,24,40)]">Platform Settings</h1>
        <p className="mt-0.5 text-sm text-[rgb(102,112,133)]">Global operational parameters and business rules.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="bg-white rounded-xl border border-[rgb(228,231,236)] shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            <div className="px-5 py-4 border-b border-[rgb(228,231,236)]">
              <h2 className="text-sm font-semibold text-[rgb(16,24,40)]">Quote engine</h2>
              <p className="mt-0.5 text-xs text-[rgb(102,112,133)]">Controls auto-quote generation and admin holds.</p>
            </div>
            <div className="p-5 space-y-5">
              <FormField
                control={form.control}
                name="auto_quote_globally_enabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border border-[rgb(228,231,236)] p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm font-medium">Global auto-quoting</FormLabel>
                      <FormDescription className="text-xs">
                        Enable automated quote generation for catalog-sourced RFQs.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="settings-auto-quote-toggle" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="auto_quote_admin_hold_threshold_sar"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Admin-hold threshold (SAR)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} data-testid="settings-admin-hold" />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Quotes above this value pause for manual admin review before reaching the client.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[rgb(228,231,236)] shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            <div className="px-5 py-4 border-b border-[rgb(228,231,236)]">
              <h2 className="text-sm font-semibold text-[rgb(16,24,40)]">Defaults</h2>
              <p className="mt-0.5 text-xs text-[rgb(102,112,133)]">Used when a value isn't supplied at the RFQ or offer level.</p>
            </div>
            <div className="p-5 grid gap-5 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="rfq_expiry_days"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">RFQ expiry (days)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} data-testid="settings-rfq-expiry" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="default_lead_time_days"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Default lead time (days)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} data-testid="settings-lead-time" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[rgb(228,231,236)] shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            <div className="px-5 py-4 border-b border-[rgb(228,231,236)]">
              <h2 className="text-sm font-semibold text-[rgb(16,24,40)]">Tax</h2>
              <p className="mt-0.5 text-xs text-[rgb(102,112,133)]">Applied to all invoices issued through Wafeq.</p>
            </div>
            <div className="p-5">
              <FormField
                control={form.control}
                name="vat_rate_pct"
                render={({ field }) => (
                  <FormItem className="max-w-xs">
                    <FormLabel className="text-sm">VAT rate (%)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" {...field} data-testid="settings-vat-rate" />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Stored internally as a decimal fraction. Saudi Arabia default is 15%.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={updateMutation.isPending} data-testid="button-save-settings">
              {updateMutation.isPending ? "Saving…" : "Save settings"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
