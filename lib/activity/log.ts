import "server-only";
import { getSupabaseClient } from "@/lib/supabase/client";

/**
 * lib/activity/log.ts
 * ---------------------------------------------------------------------
 * Purely a "what happened" feed for the client dashboard — not a
 * replacement for the Google Sheet (still the source of truth a client
 * can export/filter/share) or the outbound webhook (still what a
 * client's own CRM receives). This just closes the "I can't see my own
 * leads without opening a Sheet" gap in the dashboard itself.
 *
 * Recorded even in demo mode, unlike the Sheet/email/webhook side
 * effects in lib/tools/execute-tool-call.ts — this is an internal-only
 * record, not a real external action, so showing it during a demo
 * doesn't violate demo mode's "no real side effects" guarantee, and
 * makes the dashboard testable on the demo business itself.
 * ---------------------------------------------------------------------
 */

export type ActivityType = "lead" | "booking";

export interface ActivityEntry {
  id: string;
  businessId: string;
  type: ActivityType;
  data: Record<string, unknown>;
  createdAtISO: string;
}

export async function recordActivity(
  businessId: string,
  type: ActivityType,
  data: Record<string, unknown>
): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("activity_log").insert({ business_id: businessId, type, data });
  if (error) console.error("[activity] failed to record:", error);
}

export async function listRecentActivity(businessId: string, limit = 10): Promise<ActivityEntry[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("activity_log")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[activity] failed to list:", error);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    businessId: row.business_id,
    type: row.type,
    data: row.data,
    createdAtISO: row.created_at,
  }));
}
