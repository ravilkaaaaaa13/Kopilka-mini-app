const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || "";

let clientPromise = null;

export function isSupabaseConfigured() {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

export async function getSupabaseClient() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (!clientPromise) {
    clientPromise = import("@supabase/supabase-js")
      .then(({ createClient }) =>
        createClient(supabaseUrl, supabaseAnonKey, {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        }),
      )
      .catch((error) => {
        clientPromise = null;
        throw error;
      });
  }

  return clientPromise;
}
