(() => {
  const N = window.Nolvax;
  if (!N) {
    return;
  }

  const supabaseClient = window.supabaseClient;
  const loginScreen = document.getElementById("login-screen");
  const loginForm = document.getElementById("login-form");
  const loginEmail = document.getElementById("login-email");
  const loginPassword = document.getElementById("login-password");
  const loginError = document.getElementById("login-error");
  const loginSubmit = document.getElementById("login-submit");
  const appShell = document.getElementById("app-shell");
  const sessionEmail = document.getElementById("session-email");
  const sessionRole = document.getElementById("session-role");
  const logoutBtn = document.getElementById("logout-btn");
  const accessMode = document.body?.dataset.access || "super";

  function setLoginError(message) {
    if (!loginError) {
      return;
    }
    if (message) {
      loginError.textContent = message;
      loginError.classList.add("is-visible");
      return;
    }
    loginError.textContent = "";
    loginError.classList.remove("is-visible");
  }

  function setLoginBusy(isBusy) {
    if (loginSubmit) {
      loginSubmit.disabled = isBusy;
      loginSubmit.textContent = isBusy ? "Ingresando..." : "Ingresar";
    }
    if (loginEmail) {
      loginEmail.disabled = isBusy;
    }
    if (loginPassword) {
      loginPassword.disabled = isBusy;
    }
  }

  function setAuthView(user, accessLabel) {
    const isAuthed = Boolean(user);
    if (loginScreen) {
      loginScreen.classList.toggle("is-hidden", isAuthed);
    }
    if (appShell) {
      appShell.classList.toggle("is-hidden", !isAuthed);
    }
    if (sessionEmail) {
      sessionEmail.textContent = isAuthed ? user.email : "-";
    }
    if (sessionRole) {
      sessionRole.textContent = isAuthed ? accessLabel || "-" : "-";
    }
  }

  function getAccessLevel(user) {
    if (!user) {
      return "none";
    }

    const role = user?.app_metadata?.role || user?.user_metadata?.role;
    const normalizedRole = role ? String(role).toLowerCase() : "";
    const email = N.utils.normalizeEmail(user?.email);

    if (email === N.utils.normalizeEmail(N.config.MEGA_SUPERUSER_EMAIL)) {
      return "mega";
    }

    if (normalizedRole === N.config.SUPERUSER_ROLE) {
      return "super";
    }

    if (N.config.SUPERUSER_EMAILS.length) {
      const normalized = N.config.SUPERUSER_EMAILS.map(N.utils.normalizeEmail);
      if (normalized.includes(email)) {
        return "super";
      }
    }

    if (normalizedRole) {
      const sellerRoles = Array.isArray(N.config.SELLER_ROLES)
        ? N.config.SELLER_ROLES
        : [N.config.SELLER_ROLE || "seller"];
      if (sellerRoles.map((value) => String(value).toLowerCase()).includes(normalizedRole)) {
        return "seller";
      }
    }

    return "none";
  }

  function getAccessLabel(accessLevel) {
    if (accessLevel === "mega") {
      return "Owner";
    }
    if (accessLevel === "super") {
      return "Superusuario";
    }
    if (accessLevel === "seller") {
      return N.config.SELLER_LABEL || "Vendedor";
    }
    return "-";
  }

  function isAccessAllowed(accessLevel) {
    if (accessMode === "seller") {
      return ["seller", "super", "mega"].includes(accessLevel);
    }
    return ["super", "mega"].includes(accessLevel);
  }

  async function applySession(session, onAuthed) {
    const user = session?.user || null;

    if (!user) {
      if (N.session) {
        N.session = null;
      }
      setAuthView(null);
      return;
    }

    const accessLevel = getAccessLevel(user);
    if (!isAccessAllowed(accessLevel)) {
      const errorMessage =
        accessMode === "seller"
          ? "Acceso denegado: usuario sin permisos de vendedor."
          : "Acceso denegado: usuario sin permisos de superusuario.";
      setLoginError(errorMessage);
      if (supabaseClient) {
        await supabaseClient.auth.signOut();
      }
      if (N.session) {
        N.session = null;
      }
      setAuthView(null);
      return;
    }

    setLoginError("");
    const accessLabel = getAccessLabel(accessLevel);
    setAuthView(user, accessLabel);
    N.session = {
      user,
      accessLevel,
    };
    if (typeof onAuthed === "function") {
      await onAuthed();
    }
  }

  async function handleLoginSubmit(event, onAuthed) {
    event.preventDefault();
    setLoginError("");
    setLoginBusy(true);

    if (!supabaseClient) {
      setLoginBusy(false);
      setLoginError("No se encontro la conexion a Supabase.");
      return;
    }

    const email = loginEmail ? loginEmail.value.trim() : "";
    const password = loginPassword ? loginPassword.value : "";

    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    setLoginBusy(false);

    if (error) {
      setLoginError("Credenciales invalidas o usuario no permitido.");
      return;
    }

    await applySession(data.session, onAuthed);
  }

  async function init(onAuthed) {
    if (!loginForm || !logoutBtn) {
      return;
    }
    if (!supabaseClient) {
      setLoginError("No se encontro la conexion a Supabase.");
      return;
    }

    loginForm.addEventListener("submit", (event) => handleLoginSubmit(event, onAuthed));
    logoutBtn.addEventListener("click", async () => {
      await supabaseClient.auth.signOut();
      setAuthView(null);
    });

    const { data, error } = await supabaseClient.auth.getSession();
    if (error) {
      setLoginError("No se pudo validar la sesion.");
      setAuthView(null);
      return;
    }

    await applySession(data.session, onAuthed);

    supabaseClient.auth.onAuthStateChange((_event, session) => {
      applySession(session, onAuthed);
    });
  }

  N.auth = {
    init,
  };
})();
