import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    defaultValues: {
      scope: "global",
      pct: 10 as any,
    },
  });

  const onSubmit = (values: MarginFormValues) => {
    setMarginMutation.mutate({ data: values as any }, {
      onSuccess: () => {
        toast({ title: "Margin rule updated" });
        queryClient.invalidateQueries({ queryKey: getListMarginsQueryKey() });
        form.reset();
      },
      onError: (err: any) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Margin Rules</h1>
        <p className="text-muted-foreground">Configure global and specific margin percentages for quotes.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Add/Update Rule</CardTitle>
          </CardHeader>
          <CardContent>
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
                        <SelectItem value="category">Category Specific</SelectItem>
                        <SelectItem value="client">Client Specific</SelectItem>
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
                          <Input placeholder="Enter ID..." {...field} />
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

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={setMarginMutation.isPending}
                >
                  {setMarginMutation.isPending ? "Saving..." : "Set Margin"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Current Active Rules</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Scope</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Margin</TableHead>
                  <TableHead>Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [...Array(3)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    </TableRow>
                  ))
                ) : (
                  margins?.map((margin) => (
                    <TableRow key={margin.id}>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{margin.scope}</Badge>
                      </TableCell>
                      <TableCell>{margin.scope_id || "Everything"}</TableCell>
                      <TableCell className="font-bold text-primary">{margin.pct}%</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {margin.updated_at ? new Date(margin.updated_at).toLocaleDateString() : 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
