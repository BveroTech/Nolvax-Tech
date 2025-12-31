(() => {
  const N = window.Nolvax;
  if (!N) {
    return;
  }

  // Per-company module toggles (feature flags).

  const companySelect = document.getElementById("module-company");
  const applyButton = document.getElementById("module-apply");
  const resetButton = document.getElementById("module-reset");
  const moduleToggles = Array.from(document.querySelectorAll("[data-module]"));

  const defaultModules = {
    pos: true,
    inventory: true,
    loyalty: true,
    sync: true,
    hardware: true,
    reports: true,
  };

  function ensureModules(company) {
    if (!company.modules) {
      company.modules = { ...defaultModules };
    }
    return company.modules;
  }

  function getSelectedCompany() {
    const id = companySelect?.value || "";
    if (!id) {
      return null;
    }
    return N.state.companies.find((company) => company.id === id) || null;
  }

  function buildModuleState() {
    const state = { ...defaultModules };
    moduleToggles.forEach((toggle) => {
      const key = toggle.dataset.module;
      if (key) {
        state[key] = toggle.checked;
      }
    });
    return state;
  }

  function applyModuleState(state) {
    moduleToggles.forEach((toggle) => {
      const key = toggle.dataset.module;
      if (!key) {
        return;
      }
      toggle.checked = state[key] !== false;
    });
    if (N.ui?.updateModuleSummary) {
      N.ui.updateModuleSummary();
    }
  }

  function renderCompanySelect() {
    if (!companySelect) {
      return;
    }
    companySelect.innerHTML = "";
    if (!N.state.companies.length) {
      const option = document.createElement("option");
      option.value = "";
      option.textContent = "Sin empresas";
      companySelect.appendChild(option);
      return;
    }
    N.state.companies.forEach((company) => {
      const option = document.createElement("option");
      option.value = company.id;
      const storeId = company.storeId || company.id;
      option.textContent = storeId ? `${company.name} - ${storeId}` : company.name;
      companySelect.appendChild(option);
    });
  }

  function handleCompanyChange() {
    const company = getSelectedCompany();
    if (!company) {
      applyModuleState(defaultModules);
      return;
    }
    const modules = ensureModules(company);
    applyModuleState(modules);
  }

  async function handleApply() {
    const company = getSelectedCompany();
    if (!company) {
      return;
    }
    company.modules = buildModuleState();
    company.modulesUpdatedAt = new Date().toISOString();
    N.audit?.log({
      type: "modules",
      title: "Modulos actualizados",
      detail: `Modulos aplicados a ${company.name}.`,
      companyId: company.id,
      actor: N.session?.user?.email || "",
    });
    if (N.data?.saveState) {
      await N.data.saveState();
    }
  }

  function handleReset() {
    applyModuleState(defaultModules);
  }

  function render() {
    renderCompanySelect();
    handleCompanyChange();
  }

  function init() {
    if (!companySelect || !moduleToggles.length) {
      return;
    }
    renderCompanySelect();
    handleCompanyChange();
    companySelect.addEventListener("change", handleCompanyChange);
    if (applyButton) {
      applyButton.addEventListener("click", handleApply);
    }
    if (resetButton) {
      resetButton.addEventListener("click", handleReset);
    }
  }

  N.modules = {
    render,
    init,
  };
})();

