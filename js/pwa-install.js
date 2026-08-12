(function () {
  const SEEN_KEY = 'cmnm_pwa_entry_seen_v1';
  const FORCE_PARAM = 'install';
  let deferredPrompt = null;

  function qs(id) { return document.getElementById(id); }

  function isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
  }

  function isPublicEvaluation() {
    return new URLSearchParams(window.location.search).has('avaliacao');
  }

  function isMobileLike() {
    return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || '') || window.innerWidth <= 820;
  }

  function shouldShowGate() {
    const params = new URLSearchParams(window.location.search);
    if (params.get(FORCE_PARAM) === '1') return true;
    if (isStandalone() || isPublicEvaluation()) return false;
    if (!isMobileLike()) return false;
    return localStorage.getItem(SEEN_KEY) !== '1';
  }

  function hideGate(markSeen = true) {
    const gate = qs('pwa-entry-view');
    if (markSeen) localStorage.setItem(SEEN_KEY, '1');
    if (gate) gate.classList.add('hidden');
  }

  function showHelp() {
    const help = qs('pwa-install-help');
    if (help) help.classList.remove('hidden');
  }

  async function installApp() {
    const btn = qs('pwa-install-btn');
    if (btn) btn.disabled = true;

    try {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const result = await deferredPrompt.userChoice;
        deferredPrompt = null;

        if (result && result.outcome === 'accepted') {
          hideGate(true);
          return;
        }
      }

      showHelp();
      if (window.UI) UI.toast('Use as instruções apresentadas para instalar manualmente no telemóvel.', 'info');
    } catch (error) {
      showHelp();
      if (window.UI) UI.toast('Não foi possível abrir a instalação automática. Use a instalação manual.', 'error');
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  function init() {
    const gate = qs('pwa-entry-view');
    if (!gate) return;

    const openBtn = qs('pwa-open-btn');
    const installBtn = qs('pwa-install-btn');
    const helpBtn = qs('pwa-help-btn');

    if (openBtn) openBtn.addEventListener('click', () => hideGate(true));
    if (installBtn) installBtn.addEventListener('click', installApp);
    if (helpBtn) helpBtn.addEventListener('click', showHelp);

    if (shouldShowGate()) {
      gate.classList.remove('hidden');
    }
  }

  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    deferredPrompt = event;
    const btn = qs('pwa-install-btn');
    if (btn) btn.disabled = false;
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    hideGate(true);
    if (window.UI) UI.toast('Aplicação instalada com sucesso.', 'success');
  });

  window.PWAInstall = {
    show() {
      localStorage.removeItem(SEEN_KEY);
      const gate = qs('pwa-entry-view');
      if (gate) gate.classList.remove('hidden');
    },
    reset() {
      localStorage.removeItem(SEEN_KEY);
    }
  };

  document.addEventListener('DOMContentLoaded', init);
})();
