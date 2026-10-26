"use client";

import { useRef, useState, useTransition } from "react";
import type { ScanResponse } from "@/app/api/scan-receipt/route";
import { saveReceipt } from "@/app/(app)/scan/actions";
import CategoryPicker from "@/components/CategoryPicker";
import { money, parseMoney } from "@/lib/money";
import { splitByCategory } from "@/lib/receiptSplit";
import type { Category } from "@/lib/types";

type Stage = "pick" | "reading" | "review";
type ItemRow = { key: number; name: string; price: string; categoryId: string };

// Photo → Claude reads it → you check everything → saved as one purchase or
// split across categories. Nothing is added to your budget until you tap Save.
export default function ReceiptScanner({ categories, today }: { categories: Category[]; today: string }) {
  const [stage, setStage] = useState<Stage>("pick");
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [scan, setScan] = useState<ScanResponse | null>(null);

  // Review fields (strings while editing; parsed on save)
  const [merchant, setMerchant] = useState("");
  const [date, setDate] = useState(today);
  const [total, setTotal] = useState("");
  const [mode, setMode] = useState<"single" | "split">("single");
  const [categoryId, setCategoryId] = useState("");
  const [items, setItems] = useState<ItemRow[]>([]);
  const nextKey = useRef(0);

  const [saving, startSaving] = useTransition();

  async function onPhoto(file: File | undefined) {
    if (!file) return;
    setError("");
    setPreview(URL.createObjectURL(file));
    setStage("reading");

    try {
      const body = new FormData();
      body.append("image", await shrinkPhoto(file), "receipt.jpg");
      const res = await fetch("/api/scan-receipt", { method: "POST", body });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json) throw new Error(json?.error ?? "Couldn't reach the scanner. Check your connection.");
      loadScan(json as ScanResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setStage("pick");
    }
  }

  function loadScan(data: ScanResponse) {
    setScan(data);
    setMerchant(data.merchant);
    setDate(data.date ?? today);
    setTotal(data.total ? data.total.toFixed(2) : "");
    setCategoryId(data.suggestedCategoryId ?? "");
    setMode("single");
    setItems(
      data.items.map((item) => ({
        key: nextKey.current++,
        name: item.name,
        price: item.price.toFixed(2),
        categoryId: item.categoryId ?? data.suggestedCategoryId ?? "",
      })),
    );
    setStage("review");
  }

  function updateItem(key: number, change: Partial<ItemRow>) {
    setItems((rows) => rows.map((row) => (row.key === key ? { ...row, ...change } : row)));
  }

  const totalNumber = parseMoney(total);
  const validItems = items.filter((i) => i.name.trim() && !Number.isNaN(parseMoney(i.price)));
  const itemsSum = validItems.reduce((sum, i) => sum + parseMoney(i.price), 0);
  const tax = scan?.tax ?? 0;
  const mismatch =
    validItems.length > 0 && !Number.isNaN(totalNumber) && Math.abs(itemsSum + tax - totalNumber) > 0.05;

  const shares =
    mode === "split" && !Number.isNaN(totalNumber)
      ? splitByCategory(
          validItems
            .filter((i) => i.categoryId)
            .map((i) => ({ name: i.name, price: parseMoney(i.price), categoryId: i.categoryId })),
          totalNumber,
        )
      : [];
  const categoryById = new Map(categories.map((c) => [c.id, c]));

  function save() {
    if (!scan) return;
    setError("");
    startSaving(async () => {
      const result = await saveReceipt({
        receiptId: scan.receiptId,
        merchant,
        date,
        total: totalNumber,
        mode,
        categoryId,
        items: validItems.map((i) => ({ name: i.name, price: parseMoney(i.price), categoryId: i.categoryId || null })),
      });
      if (result?.error) setError(result.error);
    });
  }

  // ─── Pick a photo ──────────────────────────────────────────────────────
  if (stage === "pick") {
    return (
      <div className="space-y-4">
        <div className="card space-y-3 text-center">
          <div className="text-5xl">🧾</div>
          <p className="text-sm text-zinc-500">
            Snap a receipt and the store, date, items, and total get filled in for you. You check everything before
            it&apos;s saved.
          </p>
          <label className="btn-primary block cursor-pointer">
            📷 Take a photo
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              onChange={(e) => onPhoto(e.target.files?.[0])}
            />
          </label>
          <label className="btn-secondary block cursor-pointer">
            Choose from photos
            <input type="file" accept="image/*" className="sr-only" onChange={(e) => onPhoto(e.target.files?.[0])} />
          </label>
        </div>
        {error && <p className="card text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  // ─── Reading ───────────────────────────────────────────────────────────
  if (stage === "reading") {
    return (
      <div className="card flex flex-col items-center gap-4 text-center">
        {preview && (
          // eslint-disable-next-line @next/next/no-img-element -- local blob preview
          <img src={preview} alt="Receipt" className="max-h-72 rounded-xl object-contain opacity-60" />
        )}
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-accent" />
        <div>
          <p className="font-semibold">Reading your receipt…</p>
          <p className="text-sm text-zinc-500">This usually takes 10–20 seconds.</p>
        </div>
      </div>
    );
  }

  // ─── Review ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {scan && !scan.isReceipt && (
        <p className="card text-sm text-amber-600 dark:text-amber-400">
          This doesn&apos;t look like a receipt. You can still fill it in below, or retake the photo.
        </p>
      )}

      <section className="card space-y-3">
        <div className="flex gap-3">
          {preview && (
            // eslint-disable-next-line @next/next/no-img-element -- local blob preview
            <img src={preview} alt="Receipt" className="h-24 w-16 shrink-0 rounded-lg object-cover" />
          )}
          <div className="flex-1 space-y-2">
            <input
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              placeholder="Store"
              aria-label="Store"
              className="input"
            />
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Date" className="input" />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="total">Total charged</label>
          <div className="relative">
            <span className="absolute top-1/2 left-4 -translate-y-1/2 text-zinc-500">$</span>
            <input
              id="total"
              inputMode="decimal"
              value={total}
              onChange={(e) => setTotal(e.target.value)}
              className="input pl-8 text-xl font-semibold"
            />
          </div>
          {tax !== 0 && <p className="mt-1 text-xs text-zinc-500">Includes {money(tax)} tax</p>}
        </div>
      </section>

      {/* One purchase vs. split */}
      <div className="grid grid-cols-2 gap-1 rounded-xl bg-zinc-200 p-1 dark:bg-zinc-800">
        {(["single", "split"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`rounded-lg py-2 text-sm font-semibold ${mode === m ? "bg-card shadow-sm" : "text-zinc-500"}`}
          >
            {m === "single" ? "One purchase" : "Split by category"}
          </button>
        ))}
      </div>

      {mode === "single" && (
        <div>
          <span className="label">Category</span>
          <CategoryPicker categories={categories} value={categoryId} onChange={setCategoryId} />
        </div>
      )}

      {mode === "split" && shares.length > 0 && (
        <section className="card space-y-2">
          <h2 className="text-sm font-medium text-zinc-500">Will be saved as</h2>
          {shares.map((share) => {
            const c = categoryById.get(share.categoryId);
            return (
              <div key={share.categoryId} className="flex justify-between">
                <span>
                  {c?.icon} {c?.name}
                </span>
                <span className="font-semibold">{money(share.amount)}</span>
              </div>
            );
          })}
          {Math.abs(itemsSum - totalNumber) > 0.004 && (
            <p className="text-xs text-zinc-500">
              Tax and other charges ({money(totalNumber - itemsSum)}) are spread across categories by amount.
            </p>
          )}
        </section>
      )}

      {/* Line items */}
      <section className="card space-y-2 p-3">
        <h2 className="px-1 text-sm font-medium text-zinc-500">
          Items {items.length > 0 && `(${items.length})`}
        </h2>
        {items.map((item) => (
          <div key={item.key} className="space-y-1 rounded-xl bg-background p-2">
            <div className="flex gap-2">
              <input
                value={item.name}
                onChange={(e) => updateItem(item.key, { name: e.target.value })}
                aria-label="Item name"
                className="min-w-0 flex-1 rounded-lg bg-transparent px-2 py-2 text-base outline-none focus:bg-card"
              />
              <input
                value={item.price}
                inputMode="decimal"
                onChange={(e) => updateItem(item.key, { price: e.target.value })}
                aria-label="Item price"
                className="w-20 rounded-lg bg-transparent px-2 py-2 text-right text-base outline-none focus:bg-card"
              />
              <button
                type="button"
                onClick={() => setItems((rows) => rows.filter((r) => r.key !== item.key))}
                aria-label="Remove item"
                className="w-8 text-xl text-zinc-400"
              >
                ×
              </button>
            </div>
            {mode === "split" && (
              <select
                value={item.categoryId}
                onChange={(e) => updateItem(item.key, { categoryId: e.target.value })}
                aria-label="Item category"
                className="w-full rounded-lg bg-card px-2 py-2 text-base"
              >
                <option value="">Pick a category…</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            setItems((rows) => [
              ...rows,
              { key: nextKey.current++, name: "", price: "", categoryId: categoryId || scan?.suggestedCategoryId || "" },
            ])
          }
          className="w-full py-2 text-sm font-semibold text-accent"
        >
          + Add item
        </button>
        {mismatch && (
          <p className="px-1 text-xs text-amber-600 dark:text-amber-400">
            Items{tax ? " + tax" : ""} add up to {money(itemsSum + tax)}, not {money(totalNumber)}. Worth a quick check.
          </p>
        )}
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="button" onClick={save} disabled={saving} className="btn-primary w-full">
        {saving ? "Saving…" : mode === "split" && shares.length > 1 ? `Save ${shares.length} purchases` : "Save purchase"}
      </button>
      <button
        type="button"
        onClick={() => {
          setStage("pick");
          setScan(null);
          setError("");
        }}
        className="btn-secondary w-full"
      >
        Retake photo
      </button>
    </div>
  );
}

/** Shrinks big phone photos (often 4–12 MB) to ~0.5 MB JPEGs before upload. */
async function shrinkPhoto(file: File): Promise<Blob> {
  const MAX_SIDE = 2000;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    return await new Promise((resolve, reject) =>
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("resize failed"))), "image/jpeg", 0.85),
    );
  } catch {
    // Browser couldn't decode it; send the original and let the server decide.
    return file;
  }
}
