(() => {
  const N = (window.Nolvax = window.Nolvax || {});

  N.config = {
    SUPERUSER_ROLE: "superadmin",
    MEGA_SUPERUSER_EMAIL: "nolvaxtech@gmail.com",
    SUPERUSER_EMAILS: [],
    OWNER_ROLE_VALUE: "owner",
    data: {
      STATE_TABLE: "nolvax_admin_state",
      STATE_ROW_ID: "main",
      REMOTE_ENABLED: true,
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

  const STORAGE_KEY = "nolvax_admin_state_v1";

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
    return role.charAt(0).toUpperCase() + role.slice(1);
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

  function loadLocalState() {
    if (!window.localStorage) {
      return false;
    }
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return false;
      }
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") {
        return false;
      }
      if (!Array.isArray(parsed.companies) || !Array.isArray(parsed.users)) {
        return false;
      }
      N.state.companies = parsed.companies;
      N.state.users = parsed.users;
      return true;
    } catch (error) {
      return false;
    }
  }

  function saveLocalState() {
    if (!window.localStorage) {
      return false;
    }
    try {
      const payload = {
        companies: N.state.companies,
        users: N.state.users,
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      return true;
    } catch (error) {
      return false;
    }
  }

  function getSupabaseClient() {
    return window.supabaseClient || null;
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
    if (error || !data) {
      return false;
    }
    if (!Array.isArray(data.companies) || !Array.isArray(data.users)) {
      return false;
    }
    N.state.companies = data.companies;
    N.state.users = data.users;
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

  async function bootstrapState() {
    const remoteOk = await loadRemoteState();
    if (remoteOk) {
      saveLocalState();
      return "remote";
    }
    if (loadLocalState()) {
      await saveRemoteState();
      return "local";
    }
    seedData();
    return "seed";
  }

  async function saveState() {
    const remoteOk = await saveRemoteState();
    saveLocalState();
    return remoteOk;
  }

  function seedData() {
    if (loadLocalState()) {
      return;
    }

    N.state.companies = [
      {
        id: "cmp_001",
        name: "La Esquina",
        plan: "Pro",
        status: "active",
        billing: "facturas@laesquina.cl",
      },
      {
        id: "cmp_002",
        name: "Norte Market",
        plan: "Base",
        status: "past_due",
        billing: "pagos@nortemarket.com",
      },
      {
        id: "cmp_003",
        name: "Plaza Uno",
        plan: "Plus",
        status: "active",
        billing: "admin@plazauno.com",
      },
    ];

    N.state.users = [
      {
        id: "usr_001",
        firstName: "Camila",
        secondName: "Paz",
        lastName1: "Rios",
        lastName2: "Vega",
        email: "camila@laesquina.cl",
        role: "owner",
        company: "La Esquina",
        userType: "cliente",
        phone: "+56 9 2345 6789",
        status: "active",
      },
      {
        id: "usr_002",
        firstName: "Mario",
        secondName: "",
        lastName1: "Silva",
        lastName2: "Rojas",
        email: "mario@nortemarket.com",
        role: "manager",
        company: "Norte Market",
        userType: "cliente",
        phone: "+56 9 8765 4321",
        status: "active",
      },
      {
        id: "usr_003",
        firstName: "Lucia",
        secondName: "Isabel",
        lastName1: "Vega",
        lastName2: "Torres",
        email: "lucia@plazauno.com",
        role: "admin",
        company: "Plaza Uno",
        userType: "cliente",
        phone: "+56 9 1122 3344",
        status: "active",
      },
      {
        id: "usr_004",
        firstName: "Diego",
        secondName: "A.",
        lastName1: "Mendez",
        lastName2: "Lopez",
        email: "diego@nolvax.com",
        role: "support",
        company: "Nolvax",
        userType: "admin",
        phone: "+56 9 5566 7788",
        status: "active",
      },
    ];

    saveLocalState();
  }

  N.data = {
    loadLocalState,
    loadRemoteState,
    saveLocalState,
    saveState,
    bootstrapState,
    seedData,
  };
})();
