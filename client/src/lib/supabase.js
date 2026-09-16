import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error(
    "VITE_SUPABASE_URL is missing. Add it to Vercel Environment Variables."
  );
}

if (!supabaseKey) {
  throw new Error(
    "Supabase key is missing. Add VITE_SUPABASE_PUBLISHABLE_KEY to Vercel Environment Variables."
  );
}

export const supabase = createClient(
  supabaseUrl,
  supabaseKey
);