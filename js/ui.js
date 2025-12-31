(() => {
  const N = window.Nolvax;
  if (!N) {
    return;
  }

  const moduleToggles = Array.from(document.querySelectorAll("[data-module]"));
  const moduleOffCount = document.getElementById("module-off-count");
  const statCompanies = document.getElementById("stat-companies");
  const statSubs = document.getElementById("stat-subs");
  const statModules = document.getElementById("stat-modules");
  const statUsers = document.getElementById("stat-users");
  const killSwitch = document.getElementById("kill-switch");
  const subStatus = document.getElementById("sub-status");
  const killLabel = document.getElementById("kill-label");

  function countModulesOff() {
    return moduleToggles.filter((toggle) => !toggle.checked).length;
  }

  function updateStats() {
    const activeSubs = N.state.companies.filter((company) => company.status === "active").length;
    if (statCompanies) {
      statCompanies.textContent = N.state.companies.length;
    }
    if (statSubs) {
      statSubs.textContent = activeSubs;
    }
    if (statUsers) {
      statUsers.textContent = N.state.users.length;
    }
    if (statModules) {
      statModules.textContent = countModulesOff();
    }
  }

  function updateModuleSummary() {
    const off = countModulesOff();
    if (moduleOffCount) {
      moduleOffCount.textContent = off;
    }
    if (statModules) {
      statModules.textContent = off;
    }
  }

  function updateKillSwitch() {
    if (!killSwitch) {
      return;
    }
    const blocked = killSwitch.checked;
    if (subStatus) {
      subStatus.textContent = blocked ? "Bloqueado" : "Al dia";
      subStatus.classList.toggle("chip-alert", blocked);
      subStatus.classList.toggle("chip-live", !blocked);
    }
    if (killLabel) {
      killLabel.textContent = blocked ? "POS bloqueado" : "POS activo";
    }
  }

  function init() {
    moduleToggles.forEach((toggle) => {
      toggle.addEventListener("change", updateModuleSummary);
    });
    if (killSwitch) {
      killSwitch.addEventListener("change", updateKillSwitch);
    }
  }

  N.ui = {
    updateStats,
    updateModuleSummary,
    updateKillSwitch,
    init,
  };
})();
