(() => {
  const N = window.Nolvax;
  if (!N) {
    return;
  }

  const userForm = document.getElementById("user-form");
  const userListRecent = document.getElementById("user-list-recent");
  const userListAdmin = document.getElementById("user-list-admin");
  const userListClient = document.getElementById("user-list-client");
  const userAdminPanel = document.getElementById("user-admin-panel");
  const userClientPanel = document.getElementById("user-client-panel");
  const userFilterSearch = document.getElementById("user-filter-search");
  const userFilterType = document.getElementById("user-filter-type");
  const userFilterStatus = document.getElementById("user-filter-status");
  const userFilterClear = document.getElementById("user-filter-clear");
  const userStatusSummary = document.getElementById("user-status-summary");
  const userTypeSelect = document.getElementById("user-type");
  const userRoleSelect = document.getElementById("user-role");
  const userEmailInput = document.getElementById("user-email");
  const userRutInput = document.getElementById("user-rut");
  const firstNameInput = document.getElementById("user-first-name");
  const secondNameInput = document.getElementById("user-second-name");
  const lastNameInput = document.getElementById("user-last-name");
  const lastName2Input = document.getElementById("user-last-name-2");
  const phoneInput = document.getElementById("user-phone");
  const companySelect = document.getElementById("user-company");
  const inviteButton = document.getElementById("user-invite-btn");
  const inviteStatus = document.getElementById("user-invite-status");

  const supabaseClient = window.supabaseClient;

  function normalizeCompare(value) {
    return String(value || "").trim().toLowerCase();
  }

  function findUserByEmail(email) {
    const normalized = N.utils.normalizeEmail(email);
    if (!normalized) {
      return null;
    }
    return N.state.users.find((item) => N.utils.normalizeEmail(item.email) === normalized) || null;
  }

  function isSameUserData(existing, data) {
    if (!existing) {
      return false;
    }
    const sameNames = normalizeCompare(existing.names) === normalizeCompare(data.names);
    const sameLastnames = normalizeCompare(existing.lastnames) === normalizeCompare(data.lastnames);
    const sameType = normalizeCompare(existing.userType) === normalizeCompare(data.userType);
    const sameRole = normalizeCompare(existing.role) === normalizeCompare(data.role);
    const sameRut = normalizeCompare(existing.rut) === normalizeCompare(data.rut);
    const samePhone = normalizeCompare(existing.phone) === normalizeCompare(data.phone);
    const sameCompanyId = data.companyId
      ? normalizeCompare(existing.companyId) === normalizeCompare(data.companyId)
      : true;
    const sameCompanyName = normalizeCompare(existing.company) === normalizeCompare(data.company);
    return (
      sameNames &&
      sameLastnames &&
      sameType &&
      sameRole &&
      sameRut &&
      samePhone &&
      sameCompanyId &&
      sameCompanyName
    );
  }

  function applyCompactFormat(input) {
    if (!input) {
      return "";
    }
    const formatted = N.utils.formatCompactInput(input.value);
    input.value = formatted;
    return formatted;
  }

  function applySecondNameFormat() {
    if (!secondNameInput) {
      return "";
    }
    const formatted = N.utils.formatSecondNameInput(secondNameInput.value);
    secondNameInput.value = formatted;
    return formatted;
  }

  function applyPhoneFormat() {
    if (!phoneInput) {
      return "";
    }
    const formatted = N.utils.formatChilePhoneInput(phoneInput.value);
    phoneInput.value = formatted;
    return formatted;
  }

  function applyRutFormat() {
    if (!userRutInput) {
      return "";
    }
    const formatted = N.utils.formatRutInput(userRutInput.value);
    userRutInput.value = formatted;
    return formatted;
  }

  function updateUserType() {
    if (!userTypeSelect) {
      return;
    }

    const type = N.utils.normalizeUserType(userTypeSelect.value);
    const isAdmin = type === "admin";
    if (companySelect) {
      companySelect.disabled = isAdmin;
      const field = companySelect.closest(".field");
      if (field) {
        field.classList.toggle("is-disabled", isAdmin);
      }
    }

    if (userRoleSelect) {
      const field = userRoleSelect.closest(".field");
      if (type === "cliente") {
        let ownerOption = userRoleSelect.querySelector(
          `option[value="${N.config.OWNER_ROLE_VALUE}"]`
        );
        if (!ownerOption) {
          ownerOption = document.createElement("option");
          ownerOption.value = N.config.OWNER_ROLE_VALUE;
          ownerOption.textContent = "Owner";
          userRoleSelect.insertBefore(ownerOption, userRoleSelect.firstChild);
        }
        userRoleSelect.value = N.config.OWNER_ROLE_VALUE;
        userRoleSelect.disabled = true;
        if (field) {
          field.classList.add("is-disabled");
        }
      } else {
        const ownerOption = userRoleSelect.querySelector(
          `option[value="${N.config.OWNER_ROLE_VALUE}"]`
        );
        if (ownerOption) {
          ownerOption.remove();
        }
        userRoleSelect.disabled = false;
        const hasValue = Array.from(userRoleSelect.options).some(
          (option) => option.value === userRoleSelect.value
        );
        if (!hasValue && userRoleSelect.options.length) {
          userRoleSelect.selectedIndex = 0;
        }
        if (field) {
          field.classList.remove("is-disabled");
        }
      }
    }
  }

  function setInviteStatus(message, tone) {
    if (!inviteStatus) {
      return;
    }
    inviteStatus.textContent = message || "";
    inviteStatus.classList.toggle("is-error", tone === "error");
    inviteStatus.classList.toggle("is-success", tone === "success");
  }

  function getInviteRedirectUrl() {
    try {
      return new URL("crear-contrasena.html", window.location.href).toString();
    } catch (error) {
      return "";
    }
  }

  function buildUserData(formData) {
    const userType = N.utils.normalizeUserType(formData.get("user_type"));
    const role = userType === "cliente" ? N.config.OWNER_ROLE_VALUE : formData.get("role");
    const firstName = N.utils.formatCompactInput(formData.get("first_name"));
    const secondName = N.utils.formatSecondNameInput(formData.get("second_name"));
    const lastName1 = N.utils.formatCompactInput(formData.get("last_name"));
    const lastName2 = N.utils.formatCompactInput(formData.get("last_name2"));
    const names = [firstName, secondName].filter(Boolean).join(" ").trim();
    const lastNames = [lastName1, lastName2].filter(Boolean).join(" ").trim();
    const phoneLocal = N.utils.formatChilePhoneInput(formData.get("phone"));
    const phone = phoneLocal ? `+56 ${phoneLocal}` : "";
    const companyId = formData.get("company_id");
    const company = N.state.companies.find((item) => item.id === companyId);
    const companyName = userType === "admin" ? "Nolvax" : company ? company.name : "Sin empresa";
    const email = String(formData.get("email") || "").trim();
    const rut = N.utils.formatRutInput(formData.get("rut"));

    return {
      names: names || "Usuario",
      lastnames: lastNames,
      email,
      role,
      companyId: companyId || "",
      company: companyName,
      userType,
      phone,
      rut,
    };
  }

  function upsertUserFromForm(formData, inviteStatus, prebuiltData) {
    const data = prebuiltData || buildUserData(formData);
    const targetEmail = N.utils.normalizeEmail(data.email);
    if (!targetEmail) {
      return null;
    }
    let user = N.state.users.find(
      (item) => N.utils.normalizeEmail(item.email) === targetEmail
    );
    if (user) {
      Object.assign(user, data);
    } else {
      user = {
        id: `usr_${Date.now()}`,
        status: "active",
        ...data,
      };
      N.state.users.unshift(user);
    }
    if (N.utils?.normalizeUserRecord) {
      N.utils.normalizeUserRecord(user);
    }

    if (inviteStatus) {
      user.inviteStatus = inviteStatus;
      user.inviteUpdatedAt = new Date().toISOString();
    }

    return user;
  }

  function getInviteActionLabel(user) {
    const status = user?.inviteStatus || "";
    if (status === "sent") {
      return "Reenviar";
    }
    if (status === "accepted") {
      return "Reenviar";
    }
    if (status === "failed") {
      return "Reintentar";
    }
    if (status === "pending") {
      return "Enviando";
    }
    return "Invitar";
  }

  async function sendInvite(user) {
    const allowRecovery = user?.allowRecovery === true;
    if (!supabaseClient) {
      return { ok: false, error: "No se encontro la conexion a Supabase." };
    }
    const sessionCheck = await supabaseClient.auth.getSession();
    if (sessionCheck.error || !sessionCheck.data?.session) {
      return { ok: false, error: "Sesion expirada. Inicia sesion nuevamente." };
    }

    const payload = {
      email: user.email,
      redirectTo: getInviteRedirectUrl(),
      data: {
        names: user.names,
        lastnames: user.lastnames,
        user_type: user.userType,
        role: user.role,
        company_id: user.companyId || "",
        rut: user.rut || "",
      },
    };

    const { data: response, error } = await supabaseClient.functions.invoke("invite-user", {
      body: payload,
    });

    if (error) {
      let detail = error.message || "Error desconocido.";
      if (error.context && typeof error.context.json === "function") {
        try {
          const body = await error.context.json();
          detail = body?.error || body?.message || detail;
        } catch (_err) {
          detail = error.message || detail;
        }
      }
      if (detail.toLowerCase().includes("already been registered")) {
        if (!allowRecovery) {
          return { ok: false, error: "Usuario ya registrado.", code: "exists" };
        }
        const { error: recoveryError } = await supabaseClient.auth.resetPasswordForEmail(
          user.email,
          { redirectTo: getInviteRedirectUrl() }
        );
        if (recoveryError) {
          return { ok: false, error: recoveryError.message || detail };
        }
        return { ok: true, mode: "recovery" };
      }
      return { ok: false, error: detail };
    }

    if (response?.error) {
      const detail = String(response.error || "").trim();
      if (detail.toLowerCase().includes("already been registered")) {
        if (!allowRecovery) {
          return { ok: false, error: "Usuario ya registrado.", code: "exists" };
        }
        const { error: recoveryError } = await supabaseClient.auth.resetPasswordForEmail(
          user.email,
          { redirectTo: getInviteRedirectUrl() }
        );
        if (recoveryError) {
          return { ok: false, error: recoveryError.message || detail };
        }
        return { ok: true, mode: "recovery" };
      }
      return { ok: false, error: response.error };
    }

    return { ok: true, mode: "invite" };
  }

  async function handleInvite() {
    setInviteStatus("", "");
    if (!userForm) {
      setInviteStatus("Formulario no disponible.", "error");
      return;
    }

    const email = (userEmailInput?.value || "").trim();
    if (!email) {
      setInviteStatus("Ingresa un email valido.", "error");
      return;
    }

    const formData = new FormData(userForm);
    const data = buildUserData(formData);
    const existing = findUserByEmail(data.email);
    if (existing) {
      if (!isSameUserData(existing, data)) {
        setInviteStatus(
          "El correo ya existe con datos distintos. Revisa la informacion antes de continuar.",
          "error"
        );
        return;
      }
      setInviteStatus(
        "Usuario ya existe. Reenvia la invitacion desde el listado o usa 'Olvide mi contrasena'.",
        "error"
      );
      return;
    }

    if (inviteButton) {
      inviteButton.disabled = true;
      inviteButton.textContent = "Enviando...";
    }

    const user = upsertUserFromForm(formData, "pending", data);
    if (!user) {
      setInviteStatus("Ingresa un email valido.", "error");
      if (inviteButton) {
        inviteButton.disabled = false;
        inviteButton.textContent = "Enviar invitacion";
      }
      return;
    }

    const result = await sendInvite({ ...user, allowRecovery: false });
    if (inviteButton) {
      inviteButton.disabled = false;
      inviteButton.textContent = "Enviar invitacion";
    }

    user.inviteStatus = result.ok ? "sent" : "failed";
    user.inviteUpdatedAt = new Date().toISOString();
    if (N.data?.saveState) {
      await N.data.saveState();
    }
    renderLists();

    if (!result.ok) {
      setInviteStatus(`No se pudo enviar la invitacion: ${result.error}`, "error");
      return;
    }

    if (result.mode === "recovery") {
      setInviteStatus(`Usuario ya existe. Se envio correo de recuperacion a ${user.email}.`, "success");
      return;
    }

    setInviteStatus(`Invitacion enviada a ${user.email}.`, "success");
  }

  function getUserFilters() {
    return {
      search: (userFilterSearch?.value || "").trim().toLowerCase(),
      type: userFilterType?.value || "all",
      status: userFilterStatus?.value || "all",
    };
  }

  function matchesUserFilters(user, filters) {
    if (filters.status !== "all" && N.utils.normalizeUserStatus(user.status) !== filters.status) {
      return false;
    }

    if (!filters.search) {
      return true;
    }

    const haystack = [
      N.utils.buildUserDisplayName(user),
      user.email || "",
      user.company || "",
      user.rut || "",
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(filters.search);
  }

  function updateUserSummary(filters) {
    if (!userStatusSummary) {
      return;
    }
    const filtered = N.state.users.filter((user) => {
      if (!matchesUserFilters(user, filters)) {
        return false;
      }
      if (filters.type === "all") {
        return true;
      }
      return N.utils.normalizeUserType(user.userType) === filters.type;
    });
    const active = filtered.filter(
      (user) => N.utils.normalizeUserStatus(user.status) === "active"
    ).length;
    const disabled = filtered.filter(
      (user) => N.utils.normalizeUserStatus(user.status) === "disabled"
    ).length;
    userStatusSummary.textContent = `Activos: ${active} - Inhabilitados: ${disabled}`;
  }

  function updateUserPanels(type) {
    if (userAdminPanel) {
      userAdminPanel.classList.toggle("is-hidden", type === "cliente");
    }
    if (userClientPanel) {
      userClientPanel.classList.toggle("is-hidden", type === "admin");
    }
  }

  function createActionButton(action, label, disabled = false) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "btn btn-ghost btn-xs";
    button.dataset.action = action;
    button.textContent = label;
    button.disabled = disabled;
    return button;
  }

  function renderUserList(listElement, options = {}) {
    if (!listElement) {
      return;
    }

    const { filter, limit, actions = true, filters } = options;
    let items = [...N.state.users];
    if (filter) {
      items = items.filter(filter);
    }
    if (filters) {
      items = items.filter((user) => matchesUserFilters(user, filters));
    }
    if (typeof limit === "number") {
      items = items.slice(0, limit);
    }

    listElement.innerHTML = "";

    if (!items.length) {
      const empty = document.createElement("li");
      empty.className = "list-item";
      const note = document.createElement("p");
      note.className = "list-note";
      note.textContent = "Sin usuarios";
      empty.appendChild(note);
      listElement.appendChild(empty);
      return;
    }

    items.forEach((user) => {
      const item = document.createElement("li");
      item.className = actions ? "list-item user-item" : "list-item";
      item.dataset.userId = user.id;
      item.classList.toggle(
        "is-disabled",
        N.utils.normalizeUserStatus(user.status) === "disabled"
      );

      const info = document.createElement("div");
      info.className = actions ? "list-main" : "";
      const title = document.createElement("p");
      title.className = "list-title";
      title.textContent = N.utils.buildUserDisplayName(user);
      const note = document.createElement("p");
      note.className = "list-note";
      note.textContent = `${N.utils.formatRoleLabel(user.role)} - ${user.company}`;
      info.appendChild(title);
      info.appendChild(note);

      const chip = document.createElement("span");
      chip.className = "chip";
      const isAdmin = N.utils.normalizeUserType(user.userType) === "admin";
      chip.textContent = isAdmin ? "Admin Nolvax" : "Cliente";
      chip.classList.add(isAdmin ? "chip-live" : "chip-soft");

      if (actions) {
        const meta = document.createElement("div");
        meta.className = "list-meta";
        const metaEmail = document.createElement("p");
        metaEmail.className = "list-meta-line";
        metaEmail.textContent = `Email: ${user.email || "-"}`;
        const metaRut = document.createElement("p");
        metaRut.className = "list-meta-line";
        metaRut.textContent = `RUT: ${user.rut || "-"}`;
        const metaPhone = document.createElement("p");
        metaPhone.className = "list-meta-line";
        metaPhone.textContent = `Telefono: ${user.phone || "-"}`;
        const metaStatus = document.createElement("p");
        metaStatus.className = "list-meta-line";
        metaStatus.textContent = `Estado: ${N.utils.getStatusLabel(user.status)}`;
        const metaInvite = document.createElement("p");
        metaInvite.className = "list-meta-line";
        metaInvite.textContent = `Invitacion: ${user.inviteStatus || "no enviada"}`;
        const metaPassword = document.createElement("p");
        metaPassword.className = "list-meta-line";
        metaPassword.textContent = `Contrasena: ${
          user.passwordStatus === "created" ? "Creada" : "Pendiente"
        }`;
        meta.appendChild(metaEmail);
        meta.appendChild(metaRut);
        meta.appendChild(metaPhone);
        meta.appendChild(metaStatus);
        meta.appendChild(metaInvite);
        meta.appendChild(metaPassword);
        if (user.disabledUntil) {
          const metaUntil = document.createElement("p");
          metaUntil.className = "list-meta-line";
          metaUntil.textContent = `Bloqueo hasta: ${user.disabledUntil}`;
          meta.appendChild(metaUntil);
        }
        info.appendChild(meta);
      }

      item.appendChild(info);

      if (actions) {
        const actionsWrap = document.createElement("div");
        actionsWrap.className = "list-actions";
        actionsWrap.appendChild(chip);
        const inviteLabel = getInviteActionLabel(user);
        const inviteDisabled = inviteLabel === "Enviando";
        actionsWrap.appendChild(createActionButton("invite", inviteLabel, inviteDisabled));
        actionsWrap.appendChild(createActionButton("info", "Info"));
        const isDisabled = N.utils.normalizeUserStatus(user.status) === "disabled";
        actionsWrap.appendChild(
          createActionButton("disable", isDisabled ? "Habilitar" : "Inhabilitar")
        );
        actionsWrap.appendChild(createActionButton("delete", "Eliminar"));
        item.appendChild(actionsWrap);
      } else {
        item.appendChild(chip);
      }

      listElement.appendChild(item);
    });
  }

  function renderLists() {
    const filters = getUserFilters();
    renderUserList(userListRecent, { limit: 4, actions: false });
    renderUserList(userListAdmin, {
      filter: (user) => N.utils.normalizeUserType(user.userType) === "admin",
      filters,
    });
    renderUserList(userListClient, {
      filter: (user) => N.utils.normalizeUserType(user.userType) === "cliente",
      filters,
    });
    updateUserSummary(filters);
    updateUserPanels(filters.type);
    if (N.staff?.renderAll) {
      N.staff.renderAll();
    }
  }

  async function handleUserSubmit(event) {
    event.preventDefault();
    if (!userForm) {
      return;
    }
    setInviteStatus("", "");
    const data = new FormData(userForm);
    const built = buildUserData(data);
    const existing = findUserByEmail(built.email);
    if (existing) {
      if (!isSameUserData(existing, built)) {
        setInviteStatus(
          "El correo ya existe con datos distintos. Revisa la informacion antes de continuar.",
          "error"
        );
        return;
      }
      setInviteStatus("Usuario ya existe. Usa el listado para reenviar.", "error");
      return;
    }
    const user = upsertUserFromForm(data, "", built);
    if (!user) {
      return;
    }
    if (N.data?.saveState) {
      await N.data.saveState();
    }
    userForm.reset();
    updateUserType();
    renderLists();
    if (N.ui?.updateStats) {
      N.ui.updateStats();
    }
  }

  async function handleUserListAction(event) {
    const button = event.target.closest("[data-action]");
    if (!button) {
      return;
    }

    const listItem = button.closest("[data-user-id]");
    if (!listItem) {
      return;
    }

    const userId = listItem.dataset.userId;
    const user = N.state.users.find((item) => item.id === userId);
    if (!user) {
      return;
    }

    const action = button.dataset.action;
    if (action === "invite") {
      const confirmSend = window.confirm(
        `Reenviar invitacion de contrasena a ${user.email}?`
      );
      if (!confirmSend) {
        return;
      }
      user.inviteStatus = "pending";
      user.inviteUpdatedAt = new Date().toISOString();
      if (N.data?.saveState) {
        await N.data.saveState();
      }
      renderLists();
      const result = await sendInvite({ ...user, allowRecovery: true });
      user.inviteStatus = result.ok ? "sent" : "failed";
      user.inviteUpdatedAt = new Date().toISOString();
      if (N.data?.saveState) {
        await N.data.saveState();
      }
      renderLists();
      if (!result.ok) {
        setInviteStatus(`No se pudo enviar la invitacion: ${result.error}`, "error");
      } else {
        if (result.mode === "recovery") {
          setInviteStatus(
            `Usuario ya existe. Se envio correo de recuperacion a ${user.email}.`,
            "success"
          );
        } else {
          setInviteStatus(`Invitacion enviada a ${user.email}.`, "success");
        }
      }
      return;
    }

    if (action === "info") {
      listItem.classList.toggle("is-open");
      return;
    }

    if (action === "disable") {
      if (N.utils.normalizeUserStatus(user.status) === "disabled") {
        user.status = "active";
        user.disabledUntil = "";
      } else {
        const until = window.prompt(
          "Inhabilitar hasta (YYYY-MM-DD) o dejar vacio para indefinido:",
          ""
        );
        user.status = "disabled";
        user.disabledUntil = (until || "").trim();
      }
    }

    if (action === "delete") {
      const confirmDelete = window.confirm(
        `Eliminar al usuario ${N.utils.buildUserDisplayName(user)}?`
      );
      if (!confirmDelete) {
        return;
      }
      N.state.users = N.state.users.filter((item) => item.id !== user.id);
    }

    if (N.data?.saveState) {
      await N.data.saveState();
    }
    renderLists();
    if (N.ui?.updateStats) {
      N.ui.updateStats();
    }
  }

  function prepareInputs() {
    applyCompactFormat(firstNameInput);
    applySecondNameFormat();
    applyCompactFormat(lastNameInput);
    applyCompactFormat(lastName2Input);
    applyPhoneFormat();
    applyRutFormat();
  }

  function init() {
    if (userForm) {
      userForm.addEventListener("submit", handleUserSubmit);
    }
    if (userTypeSelect) {
      userTypeSelect.addEventListener("change", updateUserType);
    }
    if (userFilterSearch) {
      userFilterSearch.addEventListener("input", renderLists);
    }
    if (userFilterType) {
      userFilterType.addEventListener("change", renderLists);
    }
    if (userFilterStatus) {
      userFilterStatus.addEventListener("change", renderLists);
    }
    if (userFilterClear) {
      userFilterClear.addEventListener("click", () => {
        if (userFilterSearch) {
          userFilterSearch.value = "";
        }
        if (userFilterType) {
          userFilterType.value = "all";
        }
        if (userFilterStatus) {
          userFilterStatus.value = "all";
        }
        renderLists();
      });
    }
    if (userListAdmin) {
      userListAdmin.addEventListener("click", handleUserListAction);
    }
    if (userListClient) {
      userListClient.addEventListener("click", handleUserListAction);
    }
    if (firstNameInput) {
      firstNameInput.addEventListener("input", () => applyCompactFormat(firstNameInput));
    }
    if (secondNameInput) {
      secondNameInput.addEventListener("input", applySecondNameFormat);
    }
    if (lastNameInput) {
      lastNameInput.addEventListener("input", () => applyCompactFormat(lastNameInput));
    }
    if (lastName2Input) {
      lastName2Input.addEventListener("input", () => applyCompactFormat(lastName2Input));
    }
    if (phoneInput) {
      phoneInput.addEventListener("input", applyPhoneFormat);
    }
    if (userRutInput) {
      userRutInput.addEventListener("input", applyRutFormat);
    }
    if (inviteButton) {
      inviteButton.addEventListener("click", handleInvite);
    }
  }

  N.users = {
    renderLists,
    updateUserType,
    prepareInputs,
    init,
  };
})();
