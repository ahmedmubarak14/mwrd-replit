import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useCreateRFQ } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectItem } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Trash01 } from "@untitledui/icons";

type CustomItem = {
  free_text_name: string;
  description: string;
  qty: number;
  unit: string;
};

const CITIES = ["Riyadh", "Jeddah", "Dammam", "Khobar", "Madinah", "Mecca"];
const UNITS = ["each", "box", "carton", "pack", "kg", "liter", "meter"];

const newItem = (): CustomItem => ({ free_text_name: "", description: "", qty: 1, unit: "each" });

export default function CustomRequestPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const createRFQ = useCreateRFQ();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deliveryCity, setDeliveryCity] = useState("Riyadh");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [items, setItems] = useState<CustomItem[]>([newItem()]);

  const updateItem = (idx: number, patch: Partial<CustomItem>) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };
  const addItem = () => setItems((prev) => [...prev, newItem()]);
  const removeItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const isValid =
    title.trim().length > 0 &&
    deliveryCity &&
    deliveryDate &&
    items.length > 0 &&
    items.every((it) => it.free_text_name.trim() && it.qty > 0 && it.unit);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) {
      toast({
        variant: "destructive",
        title: "Missing required fields",
        description: "Add a title, delivery date, and at least one item with name, qty, and unit.",
      });
      return;
    }
    createRFQ.mutate(
      {
        data: {
          title: title.trim(),
          description: description.trim() || undefined,
          delivery_city: deliveryCity,
          delivery_date: deliveryDate,
          items: items.map((it) => ({
            master_product_id: null,
            free_text_name: it.free_text_name.trim(),
            description: it.description.trim() || it.free_text_name.trim(),
            qty: it.qty,
            unit: it.unit,
            pack_type: null,
          })),
        },
      },
      {
        onSuccess: (rfq) => {
          toast({
            title: "Custom request submitted",
            description: `RFQ ${rfq.rfq_number ?? ""} created. Suppliers will be notified to quote manually.`,
          });
          navigate(`/rfqs/${rfq.id}`);
        },
        onError: (err: any) => {
          toast({ variant: "destructive", title: "Failed to submit", description: err.message });
        },
      },
    );
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href="/rfqs">
          <Button variant="ghost" size="sm" data-testid="button-back-to-rfqs">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to RFQs
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-semibold text-[rgb(16,24,40)]">Custom request</h1>
        <p className="text-sm text-[rgb(102,112,133)]">
          Use this when you need something not in the master catalog. Suppliers will quote manually based on your description.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Request details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title <span className="text-red-500">*</span></Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Custom branded marketing materials for Q3 launch"
                data-testid="input-title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Additional context</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Anything suppliers should know — quality requirements, branding, certifications, etc."
                rows={4}
                data-testid="textarea-description"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Delivery city <span className="text-red-500">*</span></Label>
                <Select value={deliveryCity} onValueChange={setDeliveryCity} placeholder="Select a city">
                  {CITIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="delivery-date">Required delivery date <span className="text-red-500">*</span></Label>
                <Input
                  id="delivery-date"
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  data-testid="input-delivery-date"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Items <span className="text-sm font-normal text-muted-foreground">({items.length})</span></CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addItem} data-testid="button-add-item">
              <Plus className="h-4 w-4 mr-1" /> Add item
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.map((item, idx) => (
              <div key={idx} className="border rounded-lg p-4 space-y-3 relative" data-testid={`row-item-${idx}`}>
                <div className="flex items-start justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Item {idx + 1}</span>
                  {items.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(idx)}
                      data-testid={`button-remove-item-${idx}`}
                    >
                      <Trash01 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Item name <span className="text-red-500">*</span></Label>
                  <Input
                    value={item.free_text_name}
                    onChange={(e) => updateItem(idx, { free_text_name: e.target.value })}
                    placeholder="e.g., Custom branded notebooks (A5, hardcover)"
                    data-testid={`input-item-name-${idx}`}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description / specs</Label>
                  <Textarea
                    value={item.description}
                    onChange={(e) => updateItem(idx, { description: e.target.value })}
                    placeholder="Material, dimensions, finish, branding details..."
                    rows={2}
                    data-testid={`textarea-item-description-${idx}`}
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Quantity <span className="text-red-500">*</span></Label>
                    <Input
                      type="number"
                      min={1}
                      value={item.qty}
                      onChange={(e) => updateItem(idx, { qty: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                      data-testid={`input-item-qty-${idx}`}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Unit <span className="text-red-500">*</span></Label>
                    <Select
                      value={item.unit}
                      onValueChange={(v) => updateItem(idx, { unit: v })}
                      placeholder="Unit"
                    >
                      {UNITS.map((u) => (
                        <SelectItem key={u} value={u}>{u}</SelectItem>
                      ))}
                    </Select>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Link href="/rfqs">
            <Button type="button" variant="outline" data-testid="button-cancel">Cancel</Button>
          </Link>
          <Button type="submit" disabled={!isValid || createRFQ.isPending} data-testid="button-submit-custom-request">
            Submit custom request
          </Button>
        </div>
      </form>
    </div>
  );
}
