import Anthropic from "@anthropic-ai/sdk";
import { NextResponse, type NextRequest } from "next/server";
import { today } from "@/lib/dates";
import { readReceipt, ReceiptReadError, type ReceiptData } from "@/lib/receiptReader";
import { createClient } from "@/lib/supabase/server";

// Pro-only: photo in, receipt data out. The photo is stored in Supabase
// Storage and a `receipts` row is created; nothing is spent until the user
// confirms on the review screen.

const DAILY_SCAN_LIMIT = 25; // keeps API cost bounded
const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export type ScanResponse = ReceiptData & { receiptId: string };

function fail(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;
  if (!userId) return fail("Please sign in again.", 401);

  const { data: profile } = await supabase.from("profiles").select("is_pro").single();
  if (!profile?.is_pro) return fail("Receipt scanning is a Pro feature.", 403);

  const startOfDay = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("receipts")
    .select("id", { count: "exact", head: true })
    .gte("created_at", startOfDay);
  if ((count ?? 0) >= DAILY_SCAN_LIMIT) {
    return fail(`You've hit today's limit of ${DAILY_SCAN_LIMIT} scans. Try again tomorrow.`, 429);
  }

  const form = await request.formData();
  const file = form.get("image");
  if (!(file instanceof File)) return fail("No photo was uploaded.", 400);
  const mediaType = TYPES.find((t) => t === file.type);
  if (!mediaType) return fail("Use a JPEG, PNG, or WebP photo.", 400);
  if (file.size > MAX_BYTES) return fail("That photo is too large (5 MB max).", 400);

  const bytes = Buffer.from(await file.arrayBuffer());
  const imagePath = `${userId}/${crypto.randomUUID()}.${mediaType.split("/")[1]}`;

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .eq("archived", false)
    .order("sort_order");

  // Store the photo and read it at the same time.
  const [upload, read] = await Promise.allSettled([
    supabase.storage.from("receipts").upload(imagePath, bytes, { contentType: mediaType }),
    readReceipt({ base64: bytes.toString("base64"), mediaType }, categories ?? [], today()),
  ]);

  if (read.status === "rejected") {
    if (upload.status === "fulfilled" && !upload.value.error) {
      await supabase.storage.from("receipts").remove([imagePath]);
    }
    const error = read.reason;
    if (error instanceof ReceiptReadError) return fail(error.message, 422);
    if (error instanceof Anthropic.RateLimitError) return fail("The scanner is busy. Try again in a minute.", 503);
    if (error instanceof Anthropic.AuthenticationError) {
      console.error("scan-receipt: ANTHROPIC_API_KEY is missing or invalid");
      return fail("The scanner isn't set up yet (API key).", 500);
    }
    console.error("scan-receipt failed", error);
    return fail("Something went wrong reading the receipt. Try again.", 500);
  }

  const stored = upload.status === "fulfilled" && !upload.value.error;
  if (!stored) console.error("scan-receipt: image upload failed", upload);

  const { data: receipt, error } = await supabase
    .from("receipts")
    .insert({
      image_path: stored ? imagePath : null,
      merchant: read.value.data.merchant || null,
      total: read.value.data.total,
      raw_json: read.value.raw,
    })
    .select("id")
    .single();
  if (error || !receipt) return fail("Couldn't save the receipt. Try again.", 500);

  return NextResponse.json({ ...read.value.data, receiptId: receipt.id } satisfies ScanResponse);
}
