import { createClient } from "@supabase/supabase-js";

// !! Replace these two values with yours from Supabase → Settings → API !!
const SUPABASE_URL = "https://maalangrspbbursjbcnt.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_3AOA3e5DDtwxVZ8aye5M_g_J_G_dMS0";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);