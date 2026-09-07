import "server-only";
import { getSupabaseClient } from "@/lib/supabase/client";

/**
 * lib/leads/prospects.ts
 * ---------------------------------------------------------------------
 * Prospective-client inquiries from the public /demo form — separate
 * from lib/activity/log.ts, which tracks leads/bookings for a business's
 * OWN AI Receptionist (i.e. that business's customers calling in).
 * A "prospect" here is someone considering becoming an AI x Systems
 * client themselves. Different subject, different table, on purpose.
 * ---------------------------------------------------------------------
 */

export type ProspectStatus = "new" | "contacted" | "converted" | "closed";
export type ServiceType = "voice" | "chatbot" | "both";

export interface ProspectLead {
  id: string;
  businessName: string;
  industry?: string;
  country?: string;
  city?: string;
  serviceType?: ServiceType;
  contactName: string;
  email: string;
  phone?: string;
  website?: string;
  businessHours?: string;
  offerings?: string;
  challenges?: string;
  volume?: string;
  referralSource?: string;
  details?: string;
  status: ProspectStatus;
  createdAtISO: string;
}

export interface NewProspectInput {
  businessName: string;
  industry?: string;
  country?: string;
  city?: string;
  serviceType?: ServiceType;
  contactName: string;
  email: string;
  phone?: string;
  website?: string;
  businessHours?: string;
  offerings?: string;
  challenges?: string;
  volume?: string;
  referralSource?: string;
  details?: string;
}

function rowToProspect(row: {
  id: string;
  business_name: string;
  industry: string | null;
  country: string | null;
  city: string | null;
  service_type: ServiceType | null;
  contact_name: string;
  email: string;
  phone: string | null;
  website: string | null;
  business_hours: string | null;
  offerings: string | null;
  challenges: string | null;
  volume: string | null;
  referral_source: string | null;
  details: string | null;
  status: ProspectStatus;
  created_at: string;
}): ProspectLead {
  return {
    id: row.id,
    businessName: row.business_name,
    industry: row.industry ?? undefined,
    country: row.country ?? undefined,
    city: row.city ?? undefined,
    serviceType: row.service_type ?? undefined,
    contactName: row.contact_name,
    email: row.email,
    phone: row.phone ?? undefined,
    website: row.website ?? undefined,
    businessHours: row.business_hours ?? undefined,
    offerings: row.offerings ?? undefined,
    challenges: row.challenges ?? undefined,
    volume: row.volume ?? undefined,
    referralSource: row.referral_source ?? undefined,
    details: row.details ?? undefined,
    status: row.status,
    createdAtISO: row.created_at,
  };
}

export async function createProspect(input: NewProspectInput): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("prospect_leads").insert({
    business_name: input.businessName,
    industry: input.industry ?? null,
    country: input.country ?? null,
    city: input.city ?? null,
    service_type: input.serviceType ?? null,
    contact_name: input.contactName,
    email: input.email,
    phone: input.phone ?? null,
    website: input.website ?? null,
    business_hours: input.businessHours ?? null,
    offerings: input.offerings ?? null,
    challenges: input.challenges ?? null,
    volume: input.volume ?? null,
    referral_source: input.referralSource ?? null,
    details: input.details ?? null,
  });
  if (error) throw error;
}

export async function listProspects(): Promise<ProspectLead[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("prospect_leads")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToProspect);
}

export async function updateProspectStatus(id: string, status: ProspectStatus): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("prospect_leads").update({ status }).eq("id", id);
  if (error) throw error;
}
