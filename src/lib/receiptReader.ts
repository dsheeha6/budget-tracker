import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

// Reads a receipt photo with Claude and returns structured data.
// Server-only: uses ANTHROPIC_API_KEY, which must never reach the browser.

let client: Anthropic | null = null;
function getClient() {
  // Created on first use so a missing key fails the scan, not the whole build.
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new ReceiptReadError("The scanner isn't set up yet: ANTHROPIC_API_KEY is missing.");
  }
  return (client ??= new Anthropic());
}

const SYSTEM_PROMPT = `You read photos of shopping receipts for a personal budget app and extract what was bought.

- merchant: the store name the way a person would say it ("Target", not "TARGET T-1234").
- date: the purchase date as YYYY-MM-DD, or "" if it isn't visible.
- items: every purchased line with its final price after any discount on that line. Expand abbreviations into readable names when the meaning is clear ("GV 2% MLK GAL" -> "Great Value 2% Milk"). A coupon or discount that isn't tied to one line is its own item with a negative price. Tips and fees are items too. Leave out subtotal, tax, payment, and change lines.
- tax: the total tax charged, or 0 if none.
- total: the amount actually charged.
- category_id (per item) and suggested_category_id (for the whole receipt): the best match from the user's categories, or "none" if nothing fits.
- If the image is not a receipt, set is_receipt to false, use empty strings, 0, and an empty items list.`;

const ResultSchema = z.object({
  is_receipt: z.boolean(),
  merchant: z.string(),
  date: z.string(),
  items: z.array(z.object({ name: z.string(), price: z.number(), category_id: z.string() })),
  tax: z.number(),
  total: z.number(),
  suggested_category_id: z.string(),
});

export type ReceiptData = {
  isReceipt: boolean;
  merchant: string;
  date: string | null;
  items: { name: string; price: number; categoryId: string | null }[];
  tax: number;
  total: number;
  suggestedCategoryId: string | null;
};

export class ReceiptReadError extends Error {}

export async function readReceipt(
  image: { base64: string; mediaType: "image/jpeg" | "image/png" | "image/webp" },
  categories: { id: string; name: string }[],
  today: string,
): Promise<{ data: ReceiptData; raw: unknown }> {
  const categoryIds = [...categories.map((c) => c.id), "none"];
  const schema = {
    type: "object",
    additionalProperties: false,
    required: ["is_receipt", "merchant", "date", "items", "tax", "total", "suggested_category_id"],
    properties: {
      is_receipt: { type: "boolean" },
      merchant: { type: "string" },
      date: { type: "string" },
      items: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["name", "price", "category_id"],
          properties: {
            name: { type: "string" },
            price: { type: "number" },
            category_id: { type: "string", enum: categoryIds },
          },
        },
      },
      tax: { type: "number" },
      total: { type: "number" },
      suggested_category_id: { type: "string", enum: categoryIds },
    },
  };

  const categoryList = categories.map((c) => `${c.id}: ${c.name}`).join("\n");

  const response = await getClient().beta.messages.create({
    model: "claude-opus-5-5",
    max_tokens: 16000,
    // If a safety check ever declines the request, retry it on Anthropic's
    // recommended fallback model instead of failing the scan.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "medium", format: { type: "json_schema", schema } },
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: image.mediaType, data: image.base64 } },
          { type: "text", text: `Today is ${today}.\n\nMy categories (id: name):\n${categoryList}` },
        ],
      },
    ],
  });

  if (response.stop_reason === "refusal") {
    throw new ReceiptReadError("Couldn't read this photo. Try another one or add it manually.");
  }
  if (response.stop_reason === "max_tokens") {
    throw new ReceiptReadError("That receipt is too long to read in one go.");
  }

  const text = response.content.find((block) => block.type === "text");
  let parsed: z.infer<typeof ResultSchema>;
  try {
    parsed = ResultSchema.parse(JSON.parse(text?.type === "text" ? text.text : ""));
  } catch {
    throw new ReceiptReadError("Couldn't understand the receipt. Try a clearer photo.");
  }

  const knownIds = new Set(categories.map((c) => c.id));
  const category = (id: string) => (knownIds.has(id) ? id : null);
  const cents = (n: number) => Math.round(n * 100) / 100;

  return {
    raw: parsed,
    data: {
      isReceipt: parsed.is_receipt,
      merchant: parsed.merchant.trim(),
      date: /^\d{4}-\d{2}-\d{2}$/.test(parsed.date) ? parsed.date : null,
      items: parsed.items
        .filter((item) => item.name.trim() && Number.isFinite(item.price))
        .map((item) => ({ name: item.name.trim(), price: cents(item.price), categoryId: category(item.category_id) })),
      tax: cents(parsed.tax),
      total: cents(parsed.total),
      suggestedCategoryId: category(parsed.suggested_category_id),
    },
  };
}
