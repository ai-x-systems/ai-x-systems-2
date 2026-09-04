import { NextResponse } from "next/server";
import { getSession } from "@/lib/accounts/session";

export const runtime = "nodejs";

export async function GET() {
  const account = await getSession();
  return NextResponse.json({ account });
}
