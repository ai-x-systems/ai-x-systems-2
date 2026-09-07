import { NextRequest, NextResponse } from "next/server";
import { logIn } from "@/lib/accounts/session";
import { isLoginRateLimited, recordLoginAttempt } from "@/lib/accounts/login-rate-limit";

export const runtime = "nodejs";

function clientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export async function POST(req: NextRequest) {
  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.email || !body.password) {
    return NextResponse.json(
      { success: false, error: "email and password are required." },
      { status: 400 }
    );
  }

  const ip = clientIp(req);

  if (isLoginRateLimited(body.email, ip)) {
    return NextResponse.json(
      { success: false, error: "Too many attempts. Please wait a few minutes and try again." },
      { status: 429 }
    );
  }

  recordLoginAttempt(body.email, ip);

  const result = await logIn(body.email, body.password);
  return NextResponse.json(result, { status: result.success ? 200 : 401 });
}
