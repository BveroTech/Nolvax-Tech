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
    };
  }

  function clearUrl() {
    if (window.history && window.history.replaceState) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }

  async function ensureSession() {
    if (!supabaseClient) {
      setError("No se encontro la conexion a Supabase.");
      return false;
    }

    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    const tokenHash = url.searchParams.get("token_hash");
    const type = url.searchParams.get("type");
    const hashParams = parseHashParams();

    if (code) {
      const { error } = await supabaseClient.auth.exchangeCodeForSession(code);
      if (error) {
        setError("El enlace no es valido o ya expiro.");
        return false;
      }
      clearUrl();
      return true;
    }

    if (hashParams.access_token && hashParams.refresh_token) {
      const { error } = await supabaseClient.auth.setSession({
        access_token: hashParams.access_token,
        refresh_token: hashParams.refresh_token,
      });
      if (error) {
        setError("El enlace no es valido o ya expiro.");
        return false;
      }
      clearUrl();
      return true;
    }

    if (tokenHash && type) {
      const { error } = await supabaseClient.auth.verifyOtp({
        type,
        token_hash: tokenHash,
      });
      if (error) {
        setError("El enlace no es valido o ya expiro.");
        return false;
      }
      clearUrl();
      return true;
    }

    const { data } = await supabaseClient.auth.getSession();
    if (data?.session) {
      return true;
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
      setError("No se pudo actualizar la contrasena. Intenta de nuevo.");
      return;
    }

    setSuccess("Contrasena actualizada. Ya puedes iniciar sesion.");
    if (form) {
      form.reset();
    }
    updateValidation();
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
