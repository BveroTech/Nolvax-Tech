(() => {
  const supabaseClient = window.supabaseClient;
  const form = document.getElementById("password-form");
  const passwordInput = document.getElementById("password-input");
  const confirmInput = document.getElementById("password-confirm");
  const toggleBtn = document.getElementById("password-toggle");
  const submitBtn = document.getElementById("password-submit");
  const errorEl = document.getElementById("password-error");
  const successEl = document.getElementById("password-success");
  const statusEl = document.getElementById("password-status");
  const rulesEl = document.getElementById("password-rules");

  let sessionReady = false;
  let isBusy = false;

  const ruleItems = {
    length: rulesEl?.querySelector('[data-rule="length"]') || null,
    lower: rulesEl?.querySelector('[data-rule="lower"]') || null,
    upper: rulesEl?.querySelector('[data-rule="upper"]') || null,
    number: rulesEl?.querySelector('[data-rule="number"]') || null,
    symbol: rulesEl?.querySelector('[data-rule="symbol"]') || null,
    match: rulesEl?.querySelector('[data-rule="match"]') || null,
  };

  function setError(message) {
    if (!errorEl) {
      return;
    }
    if (message) {
      errorEl.textContent = message;
      errorEl.classList.add("is-visible");
      return;
    }
    errorEl.textContent = "";
    errorEl.classList.remove("is-visible");
  }

  function setSuccess(message) {
    if (!successEl) {
      return;
    }
    successEl.textContent = message || "";
    successEl.classList.toggle("is-visible", Boolean(message));
  }

  function setStatus(message) {
    if (!statusEl) {
      return;
    }
    statusEl.textContent = message || "";
  }

  function setBusy(busy) {
    isBusy = busy;
    if (submitBtn) {
      submitBtn.disabled = busy || !sessionReady;
      submitBtn.textContent = busy ? "Guardando..." : "Guardar contrasena";
    }
    if (passwordInput) {
      passwordInput.disabled = busy || !sessionReady;
    }
    if (confirmInput) {
      confirmInput.disabled = busy || !sessionReady;
    }
  }

  function updateRule(rule, ok) {
    const item = ruleItems[rule];
    if (!item) {
      return;
    }
    item.classList.toggle("is-valid", ok);
  }

  function getPasswordChecks(value, confirmValue) {
    return {
      length: value.length >= 8,
      lower: /[a-z]/.test(value),
      upper: /[A-Z]/.test(value),
      number: /[0-9]/.test(value),
      symbol: /[^A-Za-z0-9]/.test(value),
      match: value.length > 0 && value === confirmValue,
    };
  }

  function updateValidation() {
    const password = passwordInput ? passwordInput.value : "";
    const confirmValue = confirmInput ? confirmInput.value : "";
    const checks = getPasswordChecks(password, confirmValue);
    Object.entries(checks).forEach(([rule, ok]) => updateRule(rule, ok));

    const ok =
      checks.length &&
      checks.lower &&
      checks.upper &&
      checks.number &&
      checks.symbol &&
      checks.match;
    if (submitBtn) {
      submitBtn.disabled = !ok || !sessionReady || isBusy;
    }
    if (statusEl) {
      if (!password) {
        statusEl.textContent = "Completa los requisitos para continuar.";
      } else if (ok) {
        statusEl.textContent = "Contrasena segura.";
      } else {
        statusEl.textContent = "Ajusta la contrasena para cumplir todos los requisitos.";
      }
    }
  }

  function togglePassword() {
    const isHidden = passwordInput?.type === "password";
    if (passwordInput) {
      passwordInput.type = isHidden ? "text" : "password";
    }
    if (confirmInput) {
      confirmInput.type = isHidden ? "text" : "password";
    }
    if (toggleBtn) {
      toggleBtn.textContent = isHidden ? "Ocultar" : "Ver";
    }
  }

  function parseHashParams() {
    if (!window.location.hash) {
      return {};
    }
    const hash = window.location.hash.startsWith("#")
      ? window.location.hash.slice(1)
      : window.location.hash;
    const params = new URLSearchParams(hash);
    return {
      access_token: params.get("access_token"),
      refresh_token: params.get("refresh_token"),
      type: params.get("type"),
      token_hash: params.get("token_hash"),
      token: params.get("token"),
      code: params.get("code"),
    };
  }

  function clearUrl() {
    if (window.history && window.history.replaceState) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }

  function markInviteVerified() {
    if (window.sessionStorage) {
      window.sessionStorage.setItem("nolvax_invite_verified", "1");
    }
  }

  function hasInviteMarker() {
    return window.sessionStorage?.getItem("nolvax_invite_verified") === "1";
  }

  function normalizeEmail(value) {
    return String(value || "").trim().toLowerCase();
  }

  async function markPasswordCreated() {
    if (!supabaseClient) {
      return false;
    }
    const { data: sessionData } = await supabaseClient.auth.getSession();
    const email = normalizeEmail(sessionData?.session?.user?.email || "");
    if (!email) {
      return false;
    }
    const { data, error } = await supabaseClient
      .from("nolvax_admin_state")
      .select("companies, users")
      .eq("id", "main")
      .maybeSingle();
    if (error || !data) {
      return false;
    }
    const users = Array.isArray(data.users) ? data.users : [];
    let changed = false;
    users.forEach((user) => {
      if (normalizeEmail(user.email) === email) {
        user.passwordStatus = "created";
        user.passwordUpdatedAt = new Date().toISOString();
        if (!user.inviteStatus || user.inviteStatus === "sent") {
          user.inviteStatus = "accepted";
        }
        changed = true;
      }
    });
    if (!changed) {
      return false;
    }
    const { error: upsertError } = await supabaseClient
      .from("nolvax_admin_state")
      .upsert(
        {
          id: "main",
          companies: Array.isArray(data.companies) ? data.companies : [],
          users,
        },
        { onConflict: "id" }
      );
    return !upsertError;
  }

  async function checkSessionReady() {
    const { data } = await supabaseClient.auth.getSession();
    return Boolean(data?.session);
  }

  async function verifyWithToken(type, tokenHash, token) {
    if (!type) {
      return { ok: false, data: null };
    }
    if (tokenHash) {
      const { data, error } = await supabaseClient.auth.verifyOtp({
        type,
        token_hash: tokenHash,
      });
      if (!error) {
        return { ok: true, data };
      }
    }
    if (token) {
      const { data, error } = await supabaseClient.auth.verifyOtp({
        type,
        token,
      });
      if (!error) {
        return { ok: true, data };
      }
    }
    return { ok: false, data: null };
  }

  async function ensureSession() {
    if (!supabaseClient) {
      setError("No se encontro la conexion a Supabase.");
      return false;
    }

    if (await checkSessionReady()) {
      markInviteVerified();
      return true;
    }

    const url = new URL(window.location.href);
    const hashParams = parseHashParams();
    const code = url.searchParams.get("code") || hashParams.code;
    const tokenHash =
      url.searchParams.get("token_hash") ||
      hashParams.token_hash ||
      url.searchParams.get("token");
    const token = url.searchParams.get("token") || hashParams.token;
    const explicitType = url.searchParams.get("type") || hashParams.type;
    const candidateTypes = explicitType ? [explicitType] : ["recovery", "invite"];

    if (code) {
      const { data, error } = await supabaseClient.auth.exchangeCodeForSession(code);
      if (!error) {
        if (data?.session?.access_token && data?.session?.refresh_token) {
          await supabaseClient.auth.setSession({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          });
        }
        if (await checkSessionReady()) {
          markInviteVerified();
          clearUrl();
          return true;
        }
      } else {
        // Continua con otros metodos de verificacion.
      }
    }

    if (hashParams.access_token && hashParams.refresh_token) {
      const { error } = await supabaseClient.auth.setSession({
        access_token: hashParams.access_token,
        refresh_token: hashParams.refresh_token,
      });
      if (!error && (await checkSessionReady())) {
        markInviteVerified();
        clearUrl();
        return true;
      }
    }

    if (tokenHash || token) {
      for (const type of candidateTypes) {
        const result = await verifyWithToken(type, tokenHash, token);
        if (result.ok) {
          if (result.data?.session?.access_token && result.data?.session?.refresh_token) {
            await supabaseClient.auth.setSession({
              access_token: result.data.session.access_token,
              refresh_token: result.data.session.refresh_token,
            });
          }
          if (await checkSessionReady()) {
            markInviteVerified();
            clearUrl();
            return true;
          }
        }
      }
    }

    if (hasInviteMarker()) {
      if (await checkSessionReady()) {
        return true;
      }
    }

    setError("Enlace no valido. Solicita una nueva invitacion.");
    return false;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (!sessionReady) {
      setError("Enlace no valido. Solicita una nueva invitacion.");
      return;
    }

    const password = passwordInput ? passwordInput.value : "";
    const confirmValue = confirmInput ? confirmInput.value : "";
    const checks = getPasswordChecks(password, confirmValue);
    const ok =
      checks.length &&
      checks.lower &&
      checks.upper &&
      checks.number &&
      checks.symbol &&
      checks.match;
    if (!ok) {
      setError("La contrasena no cumple los requisitos.");
      return;
    }

    setBusy(true);
    const { error } = await supabaseClient.auth.updateUser({ password });
    setBusy(false);

    if (error) {
      const detail = error.message || "Error desconocido.";
      if (detail.toLowerCase().includes("session")) {
        setError(
          "Enlace vencido o no valido. Abre el correo de invitacion y usa el link nuevamente."
        );
      } else {
        setError(`No se pudo actualizar la contrasena: ${detail}`);
      }
      return;
    }

    await markPasswordCreated();

    setSuccess("Contrasena actualizada. Redirigiendo al inicio de sesion...");
    if (form) {
      form.reset();
    }
    updateValidation();
    setTimeout(async () => {
      if (supabaseClient) {
        try {
          await supabaseClient.auth.signOut();
        } catch (_error) {
          // Ignorar cierre fallido.
        }
      }
      try {
        const loginUrl = new URL("login.html", window.location.href).toString();
        window.location.href = loginUrl;
      } catch (_error) {
        window.location.href = "login.html";
      }
    }, 1200);
  }

  async function init() {
    if (!form) {
      return;
    }
    setBusy(true);
    setStatus("Validando enlace...");
    sessionReady = await ensureSession();
    setBusy(false);
    if (sessionReady) {
      setStatus("Enlace verificado. Crea tu contrasena.");
    } else {
      if (submitBtn) {
        submitBtn.disabled = true;
      }
    }
    updateValidation();
  }

  if (passwordInput) {
    passwordInput.addEventListener("input", updateValidation);
  }
  if (confirmInput) {
    confirmInput.addEventListener("input", updateValidation);
  }
  if (toggleBtn) {
    toggleBtn.addEventListener("click", togglePassword);
  }
  if (form) {
    form.addEventListener("submit", handleSubmit);
  }

  init();
})();
