const SUPABASE_URL = "https://arbcauaebstaxccuxvrz.supabase.co";
const SUPABASE_KEY = "sb_publishable_KsvKzlcF9HupJ-Jcy-38yA_GUzOv9vI";

if (!window.supabase) {
  console.error("Supabase JS no cargado.");
}

window.supabaseClient = window.supabase?.createClient(SUPABASE_URL, SUPABASE_KEY) || null;
