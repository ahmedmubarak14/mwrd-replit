import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectItem } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useListMargins, useSetMargin, getListMarginsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Percent03 } from "@untitledui/icons";
import { safeLocaleDate } from "@/lib/utils";

const marginSchema = z.object({
  scope: z.enum(["global", "category", "client"]),
  scope_id: z.string().optional(),
  pct: z.string().transform((v) => parseFloat(v)),
});

type MarginFormValues = z.infer<typeof marginSchema>;

export default function MarginsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: margins, isLoading } = useListMargins();
  const setMarginMutation = useSetMargin();

  const form = useForm<MarginFormValues>({
    resolver: zodResolver(marginSchema),
    defaultValues: { scope: "global", pct: 10 as any },
  });

  const onSubmit = (values: MarginFormValues) => {
    setMarginMutation.mutate({ data: values as any }, {
      onSuccess: () => {
        toast({ title: "Margin rule updated" });
        queryClient.invalidateQueries({ queryKey: getListMarginsQueryKey() });
        form.reset();
      },
      onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
    });
  };

  const rows = margins ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[rgb(16,24,40)]">Margin Rules</h1>
        <p className="mt-0.5 text-sm text-[rgb(102,112,133)]">Configure global and specific margin percentages applied to quotes</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form card */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-[rgb(228,231,236)] shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-5">
          <h2 className="text-sm font-semibold text-[rgb(16,24,40)] mb-4">Add or Update Rule</h2>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="scope"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Scope</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} placeholder="Select scope">
                      <SelectItem value="global">Global</SelectItem>
                      <SelectItem value="category">Category specific</SelectItem>
                      <SelectItem value="client">Client specific</SelectItem>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch("scope") !== "global" && (
                <FormField
                  control={form.control}
                  name="scope_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{form.watch("scope") === "category" ? "Category ID" : "Client ID"}</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter ID…" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="pct"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Margin (%)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={setMarginMutation.isPending}>
                {setMarginMutation.isPending ? "Saving…" : "Set Margin"}
              </Button>
            </form>
          </Form>
        </div>

        {/* Active rules table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-[rgb(228,231,236)] shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className="px-5 py-4 border-b border-[rgb(228,231,236)]">
            <h2 className="text-sm font-semibold text-[rgb(16,24,40)]">Current Active Rules</h2>
          </div>
          {isLoading ? (
            <div className="p-5 space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : rows.length === 0 ? (
            <div className="py-16 text-center">
              <Percent03 className="mx-auto h-8 w-8 text-[rgb(208,213,221)] mb-3" />
              <p className="text-sm text-[rgb(152,162,179)]">No margin rules defined yet.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgb(228,231,236)]">
                  <th className="px-5 py-3 text-left text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide">Scope</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide">Target</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide">Margin</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-[rgb(102,112,133)] uppercase tracking-wide hidden sm:table-cell">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgb(242,244,247)]">
                {rows.map((margin) => (
                  <tr key={margin.id} className="hover:bg-[rgb(249,250,251)] transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border bg-[rgb(242,244,247)] text-[rgb(102,112,133)] border-[rgb(228,231,236)] capitalize">
                        {margin.scope}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-[rgb(52,64,84)]">{margin.scope_id || "Everything"}</td>
                    <td className="px-5 py-3.5 text-right font-semibold text-[rgb(255,109,67)]">{margin.pct}%</td>
                    <td className="px-5 py-3.5 text-xs text-[rgb(102,112,133)] hidden sm:table-cell">
                      {safeLocaleDate(margin.updated_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
