import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Brak konfiguracji Supabase. Ustaw REACT_APP_SUPABASE_URL i REACT_APP_SUPABASE_ANON_KEY w Netlify (Site settings → Build & deploy → Environment), potem: Deploys → Trigger deploy → Clear cache and deploy site."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
