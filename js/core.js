(() => {
  const N = (window.Nolvax = window.Nolvax || {});

  N.config = {
    SUPERUSER_ROLE: "superadmin",
    MEGA_SUPERUSER_EMAIL: "nolvaxtech@gmail.com",
    SUPERUSER_EMAILS: [],
    SELLER_ROLES: ["seller", "vendedor"],
    SELLER_LABEL: "Vendedor",
    STAFF_ROLES: ["admin", "manager", "cashier", "support"],
    CLIENT_USER_TYPE: "cliente",
    OWNER_ROLE_VALUE: "owner",
    data: {
      STATE_TABLE: "nolvax_admin_state",
      STATE_ROW_ID: "main",
      REMOTE_ENABLED: true,
      REALTIME_ENABLED: true,
      USE_EDGE_STATE: true,
      POLL_INTERVAL_MS: 15000,
    },
  };

  N.labels = {
    companyStatus: {
      active: "Activo",
      past_due: "Pendiente",
      blocked: "Bloqueado",
    },
  };

  N.state = {
    companies: [],
    users: [],
  };

  function normalizeEmail(value) {
    return (value || "").trim().toLowerCase();
  }

  function normalizeUserType(value) {
    return value === "admin" ? "admin" : "cliente";
  }

  function normalizeUserStatus(value) {
    return value === "disabled" ? "disabled" : "active";
  }

  function formatCompactInput(value) {
    return String(value || "").replace(/\s+/g, "");
  }

  function getInitial(value) {
    const match = String(value || "").match(/\p{L}/u);
    return match ? match[0].toUpperCase() : "";
  }

  function formatSecondNameInput(value) {
    const trimmed = String(value || "").trim();
    if (!trimmed) {
      return "";
    }
    const parts = trimmed.split(/\s+/).filter(Boolean);
    const base = formatCompactInput(parts[0]);
    if (parts.length === 1) {
      return base;
    }
    const initial = getInitial(parts[1]);
    return initial ? `${base} ${initial}.` : base;
  }

  function formatChilePhoneInput(value) {
    const digits = String(value || "")
      .replace(/\D/g, "")
      .slice(0, 9);
    if (!digits) {
      return "";
    }

    const parts = [digits.slice(0, 1)];
    if (digits.length > 1) {
      parts.push(digits.slice(1, 5));
    }
    if (digits.length > 5) {
      parts.push(digits.slice(5, 9));
    }
    return parts.filter(Boolean).join(" ");
  }

  function formatRutInput(value) {
    const clean = String(value || "")
      .toUpperCase()
      .replace(/[^0-9K]/g, "")
      .slice(0, 9);
    if (!clean) {
      return "";
    }
    if (clean.length === 1) {
      return clean;
    }
    const body = clean.slice(0, -1);
    const verifier = clean.slice(-1);
    const reversed = body.split("").reverse();
    const chunks = [];
    for (let i = 0; i < reversed.length; i += 3) {
      chunks.push(reversed.slice(i, i + 3).reverse().join(""));
    }
    const formattedBody = chunks.reverse().join(".");
    return `${formattedBody}-${verifier}`;
  }

  function formatRoleLabel(value) {
    const role = String(value || "").trim();
    if (!role) {
      return "";
    }
    const normalized = role.toLowerCase();
    const map = {
      admin: "Admin",
      manager: "Manager",
      cashier: "Cashier",
      support: "Soporte",
      owner: "Owner",
      seller: "Vendedor",
      vendedor: "Vendedor",
    };
    return map[normalized] || role.charAt(0).toUpperCase() + role.slice(1);
  }

  function buildUserDisplayName(user) {
    const names = String(user.names || user.name || "").trim();
    const lastnames = String(user.lastnames || user.lastName || "").trim();
    if (names || lastnames) {
      return [names, lastnames].filter(Boolean).join(" ").trim();
    }
    const legacyNames = [user.firstName, user.secondName].filter(Boolean).join(" ").trim();
    const legacyLastnames = [user.lastName1, user.lastName2]
      .filter(Boolean)
      .join(" ")
      .trim();
    return [legacyNames, legacyLastnames].filter(Boolean).join(" ").trim() || "Usuario";
  }

  function normalizeUserRecord(user) {
    if (!user || typeof user !== "object") {
      return user;
    }
    const legacyNames = [user.firstName, user.secondName].filter(Boolean).join(" ").trim();
    const legacyLastnames = [user.lastName1, user.lastName2].filter(Boolean).join(" ").trim();
    const names = String(user.names || user.name || legacyNames || "").trim() || "Usuario";
    const lastnames = String(user.lastnames || user.lastName || legacyLastnames || "").trim();

    user.names = names;
    user.lastnames = lastnames;
    delete user.firstName;
    delete user.secondName;
    delete user.lastName1;
    delete user.lastName2;
    delete user.name;
    delete user.lastName;
    return user;
  }

  function getStatusLabel(status) {
    return normalizeUserStatus(status) === "disabled" ? "Inhabilitado" : "Activo";
  }

  N.utils = {
    normalizeEmail,
    normalizeUserType,
    normalizeUserStatus,
    formatCompactInput,
    getInitial,
    formatSecondNameInput,
    formatChilePhoneInput,
    formatRutInput,
    formatRoleLabel,
    buildUserDisplayName,
    normalizeUserRecord,
    getStatusLabel,
  };

  function getSupabaseClient() {
    return window.supabaseClient || null;
  }

  let lastSessionWarningAt = 0;

  async function getActiveSession() {
    const client = getSupabaseClient();
    if (!client?.auth?.getSession) {
      return null;
    }
    const { data, error } = await client.auth.getSession();
    if (error || !data?.session?.access_token) {
      return null;
    }
    return data.session;
  }

  function handleMissingSession() {
    const now = Date.now();
    if (now - lastSessionWarningAt < 5000) {
      return;
    }
    lastSessionWarningAt = now;
    if (N.auth?.showLogin) {
      N.auth.showLogin("Sesion expirada. Inicia sesion nuevamente.");
    }
  }

  async function invokeStateFunction(action, payload = {}) {
    const client = getSupabaseClient();
    if (!client) {
      return { ok: false, error: "Cliente Supabase no disponible." };
    }
    const session = await getActiveSession();
    if (!session) {
      handleMissingSession();
      return { ok: false, error: "Sesion no activa." };
    }
    const { data, error } = await client.functions.invoke("admin-state", {
      body: { action, ...payload },
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });
    if (error) {
      return { ok: false, error: error.message || "Fallo la funcion admin-state." };
    }
    if (!data) {
      return { ok: false, error: "Respuesta vacia del servidor." };
    }
    if (data.error) {
      return { ok: false, error: data.error };
    }
    return { ok: true, data };
  }

  function applyRemoteState(data) {
    const companies = Array.isArray(data.companies) ? data.companies : [];
    const users = Array.isArray(data.users) ? data.users : [];
    N.state.companies = companies;
    N.state.users = users.map((user) => normalizeUserRecord(user));
  }

  async function loadRemoteStateViaFunction() {
    const result = await invokeStateFunction("get");
    if (!result.ok) {
      return false;
    }
    const payload = result.data?.data || result.data;
    if (!payload || !Array.isArray(payload.companies) || !Array.isArray(payload.users)) {
      return false;
    }
    applyRemoteState(payload);
    return true;
  }

  async function saveRemoteStateViaFunction() {
    const payload = {
      companies: N.state.companies,
      users: N.state.users.map((user) => normalizeUserRecord(user)),
    };
    const result = await invokeStateFunction("save", payload);
    return Boolean(result.ok);
  }

  function notifyStateUpdate() {
    if (N.companies?.renderSelects) {
      N.companies.renderSelects();
    }
    if (N.companies?.renderLists) {
      N.companies.renderLists();
    }
    if (N.users?.renderLists) {
      N.users.renderLists();
    }
    if (N.staff?.renderAll) {
      N.staff.renderAll();
    }
    if (N.vendedor?.renderAll) {
      N.vendedor.renderAll();
    }
    if (N.ui?.updateStats) {
      N.ui.updateStats();
    }
    if (N.ui?.updateModuleSummary) {
      N.ui.updateModuleSummary();
    }
    if (N.ui?.updateKillSwitch) {
      N.ui.updateKillSwitch();
    }
  }

  async function loadRemoteState() {
    if (!N.config.data.REMOTE_ENABLED) {
      return false;
    }
    const session = await getActiveSession();
    if (!session) {
      handleMissingSession();
      return false;
    }
    if (N.config.data.USE_EDGE_STATE) {
      const ok = await loadRemoteStateViaFunction();
      if (ok) {
        return true;
      }
    }
    const client = getSupabaseClient();
    if (!client) {
      return false;
    }
    const { data, error } = await client
      .from(N.config.data.STATE_TABLE)
      .select("companies, users")
      .eq("id", N.config.data.STATE_ROW_ID)
      .maybeSingle();
    if (error) {
      return false;
    }
    if (!data) {
      const payload = {
        id: N.config.data.STATE_ROW_ID,
        companies: [],
        users: [],
      };
      const { error: upsertError } = await client
        .from(N.config.data.STATE_TABLE)
        .upsert(payload, { onConflict: "id" });
      if (upsertError) {
        return false;
      }
      applyRemoteState(payload);
      return true;
    }
    if (!Array.isArray(data.companies) || !Array.isArray(data.users)) {
      return false;
    }
    applyRemoteState(data);
    return true;
  }

  async function saveRemoteState() {
    if (!N.config.data.REMOTE_ENABLED) {
      return false;
    }
    const session = await getActiveSession();
    if (!session) {
      handleMissingSession();
      return false;
    }
    if (N.config.data.USE_EDGE_STATE) {
      const ok = await saveRemoteStateViaFunction();
      if (ok) {
        return true;
      }
    }
    const client = getSupabaseClient();
    if (!client) {
      return false;
    }
    const payload = {
      id: N.config.data.STATE_ROW_ID,
      companies: N.state.companies,
      users: N.state.users.map((user) => normalizeUserRecord(user)),
    };
    const { error } = await client
      .from(N.config.data.STATE_TABLE)
      .upsert(payload, { onConflict: "id" });
    return !error;
  }

  let stateChannel = null;
  let statePoller = null;

  function subscribeRemoteState() {
    if (!N.config.data.REMOTE_ENABLED || !N.config.data.REALTIME_ENABLED) {
      return;
    }
    const client = getSupabaseClient();
    if (!client) {
      return;
    }
    if (stateChannel) {
      client.removeChannel(stateChannel);
      stateChannel = null;
    }
    stateChannel = client
      .channel("nolvax_admin_state")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: N.config.data.STATE_TABLE,
          filter: `id=eq.${N.config.data.STATE_ROW_ID}`,
        },
        (payload) => {
          const record = payload?.new;
          if (!record) {
            return;
          }
          if (!Array.isArray(record.companies) || !Array.isArray(record.users)) {
            return;
          }
          applyRemoteState(record);
          notifyStateUpdate();
        }
      )
      .subscribe();
  }

  function startStatePolling() {
    if (!N.config.data.REMOTE_ENABLED || !N.config.data.POLL_INTERVAL_MS) {
      return;
    }
    if (statePoller) {
      clearInterval(statePoller);
      statePoller = null;
    }
    let busy = false;
    statePoller = setInterval(async () => {
      if (busy) {
        return;
      }
      busy = true;
      const ok = await loadRemoteState();
      if (ok) {
        notifyStateUpdate();
      }
      busy = false;
    }, N.config.data.POLL_INTERVAL_MS);
  }

  async function bootstrapState() {
    const remoteOk = await loadRemoteState();
    subscribeRemoteState();
    startStatePolling();
    return remoteOk ? "remote" : "error";
  }

  async function saveState() {
    const remoteOk = await saveRemoteState();
    return remoteOk;
  }

  N.data = {
    loadRemoteState,
    saveState,
    bootstrapState,
    subscribeRemoteState,
  };
})();
