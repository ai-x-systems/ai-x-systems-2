import { NextRequest, NextResponse } from "next/server";
import { createProspect } from "@/lib/leads/prospects";

export const runtime = "nodejs";

// Simple in-memory per-IP throttle — this is a public, unauthenticated
// endpoint, so it needs some spam resistance. Same best-effort,
// single-instance limitation as the other in-memory limiters in this
// project (see lib/chat/rate-limit.ts).
const WINDOW_MS = 60 * 60_000; // 1 hour
const MAX_PER_WINDOW = 5;
const buckets = new Map<string, { count: number; windowStart: number }>();

function isRateLimited(ip: string): boolean {
  const bucket = buckets.get(ip);
  const now = Date.now();
  if (!bucket || now - bucket.windowStart > WINDOW_MS) {
    buckets.set(ip, { count: 1, windowStart: now });
    return false;
  }
  bucket.count += 1;
  return bucket.count > MAX_PER_WINDOW;
}

function clientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export async function POST(req: NextRequest) {
  if (isRateLimited(clientIp(req))) {
    return NextResponse.json(
      { success: false, error: "Too many submissions. Please try again later." },
      { status: 429 }
    );
  }

  let body: {
    businessName?: string;
    industry?: string;
    contactName?: string;
    email?: string;
    phone?: string;
    website?: string;
    details?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.businessName?.trim() || !body.contactName?.trim() || !body.email?.trim()) {
    return NextResponse.json(
      { success: false, error: "Business name, contact name, and email are required." },
      { status: 400 }
    );
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())) {
    return NextResponse.json({ success: false, error: "Enter a valid email address." }, { status: 400 });
  }

  try {
    await createProspect({
      businessName: body.businessName.trim(),
      industry: body.industry?.trim() || undefined,
      contactName: body.contactName.trim(),
      email: body.email.trim().toLowerCase(),
      phone: body.phone?.trim() || undefined,
      website: body.website?.trim() || undefined,
      details: body.details?.trim() || undefined,
    });
  } catch (err) {
    console.error("[prospects] failed to save:", err);
    return NextResponse.json(
      { success: false, error: "Something went wrong submitting your info. Please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
