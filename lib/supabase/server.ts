import { createClient, SupabaseClient } from "@supabase/supabase-js";

let serverClientInstance: SupabaseClient | null = null;

export const getSupabaseServerClient = (): SupabaseClient | null => {
  if (serverClientInstance) return serverClientInstance;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    "";

  if (!supabaseUrl || !serviceKey || !supabaseUrl.startsWith("http")) {
    return null;
  }

  try {
    serverClientInstance = createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    return serverClientInstance;
  } catch (err) {
    console.error("[Supabase Server] Failed to initialize client:", err);
    return null;
  }
};

