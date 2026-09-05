import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * lib/supabase/client.ts
 * ---------------------------------------------------------------------
 * Server-only Supabase client using the service_role key — this
 * intentionally bypasses Row Level Security, because this app is the
 * only thing allowed to read/write these tables (see supabase/schema.sql:
 * RLS is on with zero policies, so the anon/public key can't touch them
 * even if it leaked into the browser). Never import this file from a
 * "use client" component or expose SUPABASE_SERVICE_ROLE_KEY to the
 * browser.
 * ---------------------------------------------------------------------
 */

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set. Add it in Vercel → Project → Settings → Environment Variables.`);
  }
  return value;
}

export function getSupabaseClient() {
  return createClient(getEnv("SUPABASE_URL"), getEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false },
  });
}
