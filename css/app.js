window.App = {
  container: document.getElementById('view-container'),
  state: {
    conferenceId: localStorage.getItem(APP_SETTINGS.CONFERENCE_KEY) || '',
    lookups: null,
    currentConference: null,
    view: 'dashboard',
    publicSettings: null,
    loadingLookups: false
  },
  cachePrefix: 'cmnm-v271',
  cacheTtl: {
    publicSettings: 24 * 60 * 60 * 1000,
    lookups: 30 * 60 * 1000
  },
  async init() {
    if (window.I18n) I18n.init();
    await this.loadPublicSettings();
    const evaluationToken = new URLSearchParams(location.search).get('avaliacao');
    if (evaluationToken) { await PublicEvaluation.start(evaluationToken); return; }

    document.getElementById('sandbox-hint').classList.toggle('hidden', !APP_SETTINGS.SANDBOX);
    this.updateModeBadge();

    document.getElementById('login-form').addEventListener('submit', async e => {
      e.preventDefault();
      const b = e.submitter;
      b.disabled = true;
      try {
        const d = Object.fromEntries(new FormData(e.target));
        await Auth.login(d.username, d.password);
        if (Auth.user?.idioma_preferido) I18n.setLanguage(Auth.user.idioma_preferido, { silent: true });
        await this.start();
      } catch (err) {
        UI.toast(err.message, 'error');
        b.disabled = false;
      }
    });

    document.addEventListener('cmnm:language-changed', () => {
      this.updateModeBadge();
      this.render(this.state.view);
    });

    if (Auth.hasSession()) {
      try {
        if (Auth.user?.idioma_preferido) I18n.setLanguage(Auth.user.idioma_preferido, { silent: true });
        await this.start();
      } catch (err) {
        Auth.clearSession();
        UI.toast('A sessão expirou. Inicie sessão novamente.', 'error');
      }
    }
    I18n.apply(document);
  },
  updateModeBadge() {
    const badge = document.getElementById('mode-badge');
    if (badge) badge.textContent = APP_SETTINGS.SANDBOX ? I18n.t('mode.demo', 'DEMONSTRAÇÃO') : I18n.t('mode.production', 'PRODUÇÃO');
  },
  cacheKey(name) {
    const user = Auth.user || {};
    const scope = [user.id_utilizador || 'public', user.perfil_id || '', user.id_distrito || '', user.id_igreja || ''].join('_');
    return `${this.cachePrefix}_${name}_${scope}`;
  },
  readCache(name, ttl) {
    try {
      const raw = localStorage.getItem(this.cacheKey(name));
      if (!raw) return null;
      const item = JSON.parse(raw);
      if (!item || !item.savedAt || (Date.now() - item.savedAt) > ttl) return null;
      return item.value;
    } catch (e) { return null; }
  },
  writeCache(name, value) {
    try { localStorage.setItem(this.cacheKey(name), JSON.stringify({ savedAt: Date.now(), value })); } catch (e) {}
  },
  clearCache(name) {
    const prefix = name ? `${this.cachePrefix}_${name}_` : `${this.cachePrefix}_`;
    Object.keys(localStorage).forEach(key => { if (key.startsWith(prefix)) localStorage.removeItem(key); });
  },
  async loadPublicSettings(force = false) {
    const cached = !force ? this.readCache('publicSettings', this.cacheTtl.publicSettings) : null;
    if (cached) {
      this.applyBranding(cached);
      Api.request('system.publicSettings', {}).then(settings => {
        this.writeCache('publicSettings', settings);
        this.applyBranding(settings);
      }).catch(() => {});
      return;
    }
    try {
      const settings = await Api.request('system.publicSettings', {});
      this.writeCache('publicSettings', settings);
      this.applyBranding(settings);
    } catch (error) {
      console.warn('Não foi possível carregar a identidade visual.', error);
    }
  },
  applyBranding(settings) {
    if (!settings) return;
    this.state.publicSettings = settings;
    document.documentElement.style.setProperty('--primary', settings.primary_color || '#4c1d5f');
    document.documentElement.style.setProperty('--primary-2', settings.primary_color || '#6b2a7d');
    document.documentElement.style.setProperty('--accent', settings.accent_color || '#c0266d');
    document.querySelectorAll('[data-app-name]').forEach(x => x.textContent = settings.app_name || 'Gestão da Conferência de Mulheres Nazarenas de Moçambique');
    document.querySelectorAll('[data-short-name]').forEach(x => x.textContent = settings.short_name || 'Mulheres Nazarenas');
    document.querySelectorAll('[data-organization]').forEach(x => x.textContent = settings.organization || 'Igreja do Nazareno');
    document.querySelectorAll('.brand-mark').forEach(mark => {
      if (settings.logo_url) {
        mark.textContent = '';
        const img = document.createElement('img');
        img.src = settings.logo_url;
        img.alt = 'Logótipo';
        mark.appendChild(img);
        mark.classList.add('has-logo');
      } else if (!mark.classList.contains('admin-preview-mark')) {
        mark.textContent = 'MN';
        mark.classList.remove('has-logo');
      }
    });
    document.title = settings.short_name ? `${settings.short_name} — Gestão de Conferências` : 'Conferência de Mulheres Nazarenas';
    if (window.I18n) I18n.apply(document);
  },
  async start() {
    if (!Auth.permissions.length) await Auth.refresh();
    if (Auth.user?.idioma_preferido) I18n.setLanguage(Auth.user.idioma_preferido, { silent: true });
    document.getElementById('login-view').classList.add('hidden');
    document.getElementById('app-shell').classList.remove('hidden');
    document.getElementById('current-user-name').textContent = Auth.user?.nome || '';
    document.getElementById('current-user-role').textContent = Auth.user?.perfil_nome || Auth.user?.perfil_id || '';
    document.getElementById('logout-btn').onclick = () => Auth.logout();
    document.getElementById('refresh-btn').onclick = async () => {
      this.clearCache('lookups');
      this.clearCache('publicSettings');
      await this.loadPublicSettings(true);
      await this.loadLookups({ force: true });
      this.render(this.state.view, { forceRefresh: true });
    };
    document.getElementById('menu-btn').onclick = () => document.getElementById('sidebar').classList.toggle('open');
    document.querySelectorAll('.nav-item').forEach(b => b.onclick = () => {
      this.render(b.dataset.view);
      document.getElementById('sidebar').classList.remove('open');
    });
    this.applyNavigationPermissions();
    await this.loadLookups();
    this.render(document.querySelector('.nav-item:not(.hidden)')?.dataset.view || 'dashboard');
    I18n.apply(document);
  },
  applyNavigationPermissions() {
    const required = { dashboard: 'dashboard.ver', conference: 'conferencias.ver', participants: 'participantes.ver', credentials: 'credenciais.ver', attendance: 'presencas.ver', materials: 'materiais.ver', accommodations: 'alojamento.ver', meals: 'alimentacao.ver', transport: 'transporte.ver', certificates: 'certificados.ver', communications: 'comunicacoes.ver', reports: 'relatorios.ver', evaluationClosure: 'avaliacoes.ver', payments: 'pagamentos.ver', sessions: 'sessoes.ver', intervenients: 'sessoes.ver', users: 'utilizadores.gerir', administration: 'administracao.ver' };
    document.querySelectorAll('.nav-item').forEach(item => item.classList.toggle('hidden', !Auth.can(required[item.dataset.view])));
  },
  async loadLookups(options = {}) {
    if (this.state.loadingLookups) return this.state.lookups;
    const force = Boolean(options.force);
    const cached = !force ? this.readCache('lookups', this.cacheTtl.lookups) : null;
    if (cached) {
      this.applyLookups(cached);
      this.refreshLookupsInBackground();
      return cached;
    }
    this.state.loadingLookups = true;
    try {
      const lookups = await Api.request('lookups.get', {});
      this.writeCache('lookups', lookups);
      this.applyLookups(lookups);
      return lookups;
    } finally {
      this.state.loadingLookups = false;
    }
  },
  refreshLookupsInBackground() {
    if (this.state.loadingLookups || APP_SETTINGS.SANDBOX) return;
    this.state.loadingLookups = true;
    Api.request('lookups.get', {}).then(lookups => {
      this.writeCache('lookups', lookups);
      this.applyLookups(lookups);
    }).catch(() => {}).finally(() => { this.state.loadingLookups = false; });
  },
  applyLookups(lookups) {
    this.state.lookups = lookups || { conferences: [] };
    if (!this.state.conferenceId || !this.state.lookups.conferences.some(x => x.id_conferencia === this.state.conferenceId)) {
      this.state.conferenceId = this.state.lookups.selectedConferenceId || this.state.lookups.conferences[0]?.id_conferencia || '';
    }
    this.state.currentConference = this.state.lookups.conferences.find(x => x.id_conferencia === this.state.conferenceId) || null;
    localStorage.setItem(APP_SETTINGS.CONFERENCE_KEY, this.state.conferenceId);
    this.renderConferenceSwitcher();
  },
  renderConferenceSwitcher() {
    const s = document.getElementById('conference-switcher');
    if (!s || !this.state.lookups) return;
    const conferences = this.state.lookups.conferences || [];
    s.innerHTML = conferences.length ? conferences.map(x => UI.option(x.id_conferencia, x.nome, this.state.conferenceId)).join('') : `<option value="">${I18n.t('common.noConference', 'Sem conferência')}</option>`;
    s.onchange = e => {
      this.state.conferenceId = e.target.value;
      this.state.currentConference = conferences.find(x => x.id_conferencia === e.target.value) || null;
      localStorage.setItem(APP_SETTINGS.CONFERENCE_KEY, e.target.value);
      this.render(this.state.view, { forceRefresh: true });
    };
  },
  async render(view, options = {}) {
    this.state.view = view;
    this.state.renderOptions = options || {};
    document.querySelectorAll('.nav-item').forEach(x => x.classList.toggle('active', x.dataset.view === view));
    this.container.innerHTML = `<div class="empty">${I18n.t('common.loading', 'A carregar…')}</div>`;
    try {
      if (!Views[view]) throw new Error(I18n.t('error.viewNotFound', 'Vista não encontrada.'));
      await Views[view](options || {});
      if (window.I18n) I18n.apply(this.container);
    } catch (err) {
      this.container.innerHTML = `<div class="card panel"><h3>${I18n.t('error.loadFailed', 'Não foi possível carregar')}</h3><p class="muted">${UI.escape(err.message)}</p><button class="btn btn-primary" onclick="App.render('${view}', { forceRefresh: true })">${I18n.t('retry', 'Tentar novamente')}</button></div>`;
      UI.toast(err.message, 'error');
    }
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('service-worker.js').catch(() => {}));
