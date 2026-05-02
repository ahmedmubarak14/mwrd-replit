import { useState, useRef } from "react";
import { ImagePlus, X, Plus } from "@untitledui/icons";
import { useToast } from "@/hooks/use-toast";
import { useCreateRFQ } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

export function SpecialOrderButton({ variant = "outline" }: { variant?: "outline" | "ghost" }) {
  const [open, setOpen] = useState(false);
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [expectedPrice, setExpectedPrice] = useState("");
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createRFQ = useCreateRFQ();

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const resetForm = () => {
    setItemName("");
    setQuantity("");
    setExpectedPrice("");
    setDescription("");
    setPhoto(null);
    setPhotoPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSend = () => {
    if (!itemName.trim()) {
      toast({ title: "Item name is required", variant: "destructive" });
      return;
    }
    const qty = parseInt(quantity || "1", 10) || 1;
    const expectedPriceNote = expectedPrice ? ` (expected price: ${expectedPrice})` : "";
    const photoNote = photo ? ` [photo attached: ${photo.name}]` : "";
    const deliveryDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    createRFQ.mutate(
      {
        data: {
          title: itemName.trim(),
          description: `${description.trim() || "Special order request"}${expectedPriceNote}${photoNote}`,
          delivery_city: "Riyadh",
          delivery_date: deliveryDate!,
          items: [
            {
              free_text_name: itemName.trim(),
              description: description.trim() || itemName.trim(),
              qty,
              unit: "unit",
            },
          ],
        },
      },
      {
        onSuccess: (rfq: any) => {
          toast({
            title: "Request sent",
            description: `RFQ ${rfq?.rfq_number ?? ""} created. Suppliers and our team have been notified.`,
          });
          queryClient.invalidateQueries({
            predicate: (q) => Array.isArray(q.queryKey) && typeof q.queryKey[0] === "string" && q.queryKey[0].includes("/rfqs"),
          });
          setOpen(false);
          resetForm();
        },
        onError: (err: any) => {
          toast({
            title: "Could not submit request",
            description: err?.message ?? "Please try again.",
            variant: "destructive",
          });
        },
      },
    );
  };

  const fieldClass =
    "w-full rounded-full border border-[rgb(228,231,236)] bg-[rgb(249,250,251)] px-4 py-3 text-sm text-[rgb(16,24,40)] placeholder:text-[rgb(152,162,179)] focus:outline-none focus:ring-2 focus:ring-[rgb(255,109,67)] focus:border-[rgb(255,109,67)] transition-colors";

  const triggerClass =
    variant === "ghost"
      ? "inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium text-[rgb(52,64,84)] hover:bg-[rgb(242,244,247)] transition-colors"
      : "inline-flex items-center gap-2 rounded-lg border border-[rgb(228,231,236)] bg-white px-3.5 py-2 text-sm font-medium text-[rgb(52,64,84)] hover:bg-[rgb(249,250,251)] hover:border-[rgb(208,213,221)] transition-colors";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        data-testid="button-special-order"
        className={triggerClass}
      >
        <Plus className="h-4 w-4" />
        Special order
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <button
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 text-[rgb(21,112,239)] hover:opacity-70 transition-opacity"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="mb-5 text-base font-bold text-[rgb(16,24,40)]">
              Enter the special order information
            </h2>

            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[rgb(16,24,40)]">
                  Item name
                </label>
                <input
                  className={fieldClass}
                  placeholder="Item name"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  data-testid="input-special-item-name"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[rgb(16,24,40)]">
                    Quantity
                  </label>
                  <input
                    className={fieldClass}
                    placeholder="Quantity"
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    data-testid="input-special-qty"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[rgb(16,24,40)]">
                    Expected Price
                  </label>
                  <input
                    className={fieldClass}
                    placeholder="Expected Price"
                    value={expectedPrice}
                    onChange={(e) => setExpectedPrice(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[rgb(16,24,40)]">
                  Description
                </label>
                <input
                  className={fieldClass}
                  placeholder="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[rgb(16,24,40)]">
                  Upload a photo{" "}
                  <span className="font-normal text-[rgb(152,162,179)]">(optional)</span>
                </label>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="relative flex h-24 w-24 items-center justify-center rounded-xl border-2 border-dashed border-[rgb(208,213,221)] bg-white hover:border-[rgb(255,109,67)] hover:bg-[rgb(255,243,239)] transition-colors overflow-hidden"
                >
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <ImagePlus className="h-8 w-8 text-[rgb(52,64,84)]" />
                  )}
                </button>
                {photo && (
                  <p className="mt-1 text-xs text-[rgb(152,162,179)] truncate max-w-[12rem]">
                    {photo.name}
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={handleSend}
              disabled={createRFQ.isPending}
              data-testid="button-special-send"
              className="mt-5 w-full rounded-full bg-[rgb(255,109,67)] py-3.5 text-sm font-semibold text-white hover:bg-[rgb(236,82,42)] disabled:opacity-60 transition-colors"
            >
              {createRFQ.isPending ? "Sending…" : "Send"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
