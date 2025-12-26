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
    const firstName = user.firstName || user.name || "";
    const secondName = user.secondName || "";
    const lastName1 = user.lastName1 || user.lastName || "";
    const lastName2 = user.lastName2 || "";
    const names = [firstName, secondName].filter(Boolean).join(" ").trim();
    const lastNames = [lastName1, lastName2].filter(Boolean).join(" ").trim();
    return [names, lastNames].filter(Boolean).join(" ").trim() || "Usuario";
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
    getStatusLabel,
  };

  function getSupabaseClient() {
    return window.supabaseClient || null;
  }

  function applyRemoteState(data) {
    N.state.companies = data.companies || [];
    N.state.users = data.users || [];
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
    const client = getSupabaseClient();
    if (!client) {
      return false;
    }
    const payload = {
      id: N.config.data.STATE_ROW_ID,
      companies: N.state.companies,
      users: N.state.users,
    };
    const { error } = await client
      .from(N.config.data.STATE_TABLE)
      .upsert(payload, { onConflict: "id" });
    return !error;
  }

  let stateChannel = null;

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

  async function bootstrapState() {
    const remoteOk = await loadRemoteState();
    subscribeRemoteState();
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
