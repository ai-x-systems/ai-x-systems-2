import { NextResponse } from "next/server";
import { logOut } from "@/lib/accounts/session";

export const runtime = "nodejs";

export async function POST() {
  await logOut();
  return NextResponse.json({ success: true });
}
