import { NextRequest, NextResponse } from "next/server";
import { createProspect, ServiceType } from "@/lib/leads/prospects";

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

const VALID_SERVICE_TYPES: ServiceType[] = ["voice", "chatbot", "both"];

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
    country?: string;
    city?: string;
    serviceType?: string;
    contactName?: string;
    email?: string;
    phone?: string;
    website?: string;
    businessHours?: string;
    offerings?: string;
    challenges?: string;
    volume?: string;
    referralSource?: string;
    details?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body." }, { status: 400 });
  }

  if (
    !body.businessName?.trim() ||
    !body.contactName?.trim() ||
    !body.email?.trim() ||
    !body.country?.trim() ||
    !body.serviceType
  ) {
    return NextResponse.json(
      {
        success: false,
        error: "Business name, contact name, email, country, and which service you want are required.",
      },
      { status: 400 }
    );
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())) {
    return NextResponse.json({ success: false, error: "Enter a valid email address." }, { status: 400 });
  }
  if (!VALID_SERVICE_TYPES.includes(body.serviceType as ServiceType)) {
    return NextResponse.json(
      { success: false, error: `serviceType must be one of: ${VALID_SERVICE_TYPES.join(", ")}` },
      { status: 400 }
    );
  }

  try {
    await createProspect({
      businessName: body.businessName.trim(),
      industry: body.industry?.trim() || undefined,
      country: body.country.trim(),
      city: body.city?.trim() || undefined,
      serviceType: body.serviceType as ServiceType,
      contactName: body.contactName.trim(),
      email: body.email.trim().toLowerCase(),
      phone: body.phone?.trim() || undefined,
      website: body.website?.trim() || undefined,
      businessHours: body.businessHours?.trim() || undefined,
      offerings: body.offerings?.trim() || undefined,
      challenges: body.challenges?.trim() || undefined,
      volume: body.volume?.trim() || undefined,
      referralSource: body.referralSource?.trim() || undefined,
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
