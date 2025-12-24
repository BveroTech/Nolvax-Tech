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
  const firstNameInput = document.getElementById("user-first-name");
  const secondNameInput = document.getElementById("user-second-name");
  const lastNameInput = document.getElementById("user-last-name");
  const lastName2Input = document.getElementById("user-last-name-2");
  const phoneInput = document.getElementById("user-phone");
  const companySelect = document.getElementById("user-company");

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

  function createActionButton(action, label) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "btn btn-ghost btn-xs";
    button.dataset.action = action;
    button.textContent = label;
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
        const metaPhone = document.createElement("p");
        metaPhone.className = "list-meta-line";
        metaPhone.textContent = `Telefono: ${user.phone || "-"}`;
        const metaStatus = document.createElement("p");
        metaStatus.className = "list-meta-line";
        metaStatus.textContent = `Estado: ${N.utils.getStatusLabel(user.status)}`;
        meta.appendChild(metaEmail);
        meta.appendChild(metaPhone);
        meta.appendChild(metaStatus);
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
  }

  async function handleUserSubmit(event) {
    event.preventDefault();
    if (!userForm) {
      return;
    }
    const data = new FormData(userForm);
    const userType = N.utils.normalizeUserType(data.get("user_type"));

    const role = userType === "cliente" ? N.config.OWNER_ROLE_VALUE : data.get("role");
    const firstName = N.utils.formatCompactInput(data.get("first_name"));
    const secondName = N.utils.formatSecondNameInput(data.get("second_name"));
    const lastName1 = N.utils.formatCompactInput(data.get("last_name"));
    const lastName2 = N.utils.formatCompactInput(data.get("last_name2"));
    const names = [firstName, secondName].filter(Boolean).join(" ").trim();
    const lastNames = [lastName1, lastName2].filter(Boolean).join(" ").trim();
    const phoneLocal = N.utils.formatChilePhoneInput(data.get("phone"));
    const phone = phoneLocal ? `+56 ${phoneLocal}` : "";
    const companyId = data.get("company_id");
    const company = N.state.companies.find((item) => item.id === companyId);
    const companyName = userType === "admin" ? "Nolvax" : company ? company.name : "Sin empresa";
    const email = String(data.get("email") || "").trim();

    const user = {
      id: `usr_${Date.now()}`,
      name: names || "Usuario",
      firstName,
      secondName,
      lastName1,
      lastName2,
      lastName: lastNames,
      email,
      role,
      company: companyName,
      userType,
      phone,
      status: "active",
    };

    N.state.users.unshift(user);
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
  }

  N.users = {
    renderLists,
    updateUserType,
    prepareInputs,
    init,
  };
})();
