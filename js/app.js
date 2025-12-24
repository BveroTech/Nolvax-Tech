(() => {
  const N = window.Nolvax;
  if (!N) {
    return;
  }

  let appBooted = false;

  async function bootApp() {
    if (appBooted) {
      return;
    }
    appBooted = true;

    if (N.data?.bootstrapState) {
      await N.data.bootstrapState();
    } else if (N.data?.seedData) {
      N.data.seedData();
    }
    if (N.companies?.renderSelects) {
      N.companies.renderSelects();
    }
    if (N.companies?.renderLists) {
      N.companies.renderLists();
    }
    if (N.users?.renderLists) {
      N.users.renderLists();
    }
    if (N.users?.updateUserType) {
      N.users.updateUserType();
    }
    if (N.users?.prepareInputs) {
      N.users.prepareInputs();
    }
    if (N.ui?.updateModuleSummary) {
      N.ui.updateModuleSummary();
    }
    if (N.ui?.updateStats) {
      N.ui.updateStats();
    }
    if (N.ui?.updateKillSwitch) {
      N.ui.updateKillSwitch();
    }

    if (N.companies?.init) {
      N.companies.init();
    }
    if (N.users?.init) {
      N.users.init();
    }
    if (N.ui?.init) {
      N.ui.init();
    }

    requestAnimationFrame(() => document.body.classList.add("is-ready"));
  }

  if (N.auth?.init) {
    N.auth.init(bootApp);
    return;
  }

  bootApp();
})();
