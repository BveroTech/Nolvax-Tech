import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const STATE_TABLE = Deno.env.get("STATE_TABLE") ?? "nolvax_admin_state";
const STATE_ROW_ID = Deno.env.get("STATE_ROW_ID") ?? "main";
const SUPERUSER_ROLE = (Deno.env.get("SUPERUSER_ROLE") ?? "superadmin").toLowerCase();
const MEGA_EMAIL = (Deno.env.get("MEGA_SUPERUSER_EMAIL") ?? "").toLowerCase();
const SUPERUSER_EMAILS = (Deno.env.get("SUPERUSER_EMAILS") ?? "")
  .split(",")
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  });
}

function isAllowed(user: {
  email?: string;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
}) {
  const email = (user.email ?? "").toLowerCase();
  const role = String(
    user.app_metadata?.role || user.user_metadata?.role || ""
  ).toLowerCase();

  if (MEGA_EMAIL && email === MEGA_EMAIL) {
    return true;
  }
  if (role && role === SUPERUSER_ROLE) {
    return true;
  }
  if (SUPERUSER_EMAILS.includes(email)) {
    return true;
  }
  return false;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse(405, { error: "Metodo no permitido." });
  }

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return jsonResponse(500, { error: "Configuracion incompleta en el servidor." });
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader) {
    return jsonResponse(401, { error: "Sin autorizacion." });
  }

  const supabaseAuth = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
    global: { headers: { Authorization: authHeader } },
  });
  const { data: authData, error: authError } = await supabaseAuth.auth.getUser();
  if (authError || !authData?.user) {
    return jsonResponse(401, { error: "Sesion invalida." });
  }
  if (!isAllowed(authData.user)) {
    return jsonResponse(403, { error: "Usuario sin permisos." });
  }

  let payload: {
    action?: string;
    companies?: unknown;
    users?: unknown;
  } = {};
  try {
    payload = await req.json();
  } catch (_error) {
    payload = {};
  }

  const action = String(payload.action || "get").toLowerCase();
  const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  if (action === "get") {
    const { data, error } = await supabaseAdmin
      .from(STATE_TABLE)
      .select("companies, users")
      .eq("id", STATE_ROW_ID)
      .maybeSingle();
    if (error) {
      return jsonResponse(400, { error: error.message });
    }
    if (!data) {
      const payload = { id: STATE_ROW_ID, companies: [], users: [] };
      const { error: upsertError } = await supabaseAdmin
        .from(STATE_TABLE)
        .upsert(payload, { onConflict: "id" });
      if (upsertError) {
        return jsonResponse(400, { error: upsertError.message });
      }
      return jsonResponse(200, { ok: true, data: payload });
    }
    return jsonResponse(200, { ok: true, data });
  }

  if (action === "save") {
    if (!Array.isArray(payload.companies) || !Array.isArray(payload.users)) {
      return jsonResponse(400, { error: "Datos invalidos." });
    }
    const payloadRow = {
      id: STATE_ROW_ID,
      companies: payload.companies,
      users: payload.users,
    };
    const { error } = await supabaseAdmin
      .from(STATE_TABLE)
      .upsert(payloadRow, { onConflict: "id" });
    if (error) {
      return jsonResponse(400, { error: error.message });
    }
    return jsonResponse(200, { ok: true });
  }

  return jsonResponse(400, { error: "Accion no valida." });
});
