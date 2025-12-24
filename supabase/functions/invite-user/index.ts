import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const SUPERUSER_ROLE = (Deno.env.get("SUPERUSER_ROLE") ?? "superadmin").toLowerCase();
const MEGA_EMAIL = (Deno.env.get("MEGA_SUPERUSER_EMAIL") ?? "").toLowerCase();
const SUPERUSER_EMAILS = (Deno.env.get("SUPERUSER_EMAILS") ?? "")
  .split(",")
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);

function jsonResponse(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

function isAllowed(user: { email?: string; app_metadata?: Record<string, unknown>; user_metadata?: Record<string, unknown> }) {
  const email = (user.email ?? "").toLowerCase();
  const role =
    String(user.app_metadata?.role || user.user_metadata?.role || "").toLowerCase();

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
    return jsonResponse(403, { error: "Usuario sin permisos para invitar." });
  }

  let payload: {
    email?: string;
    redirectTo?: string;
    data?: Record<string, unknown>;
  };
  try {
    payload = await req.json();
  } catch (_error) {
    return jsonResponse(400, { error: "Payload invalido." });
  }

  const email = String(payload?.email || "").trim();
  if (!email) {
    return jsonResponse(400, { error: "Email requerido." });
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    redirectTo: typeof payload.redirectTo === "string" ? payload.redirectTo : undefined,
    data: payload.data && typeof payload.data === "object" ? payload.data : undefined,
  });

  if (error) {
    return jsonResponse(400, { error: error.message });
  }

  return jsonResponse(200, {
    ok: true,
    user: {
      id: data.user?.id,
      email: data.user?.email,
    },
  });
});
