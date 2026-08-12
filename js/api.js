window.Api = {
  async request(action, data = {}) {
    if (APP_SETTINGS.SANDBOX) return window.sandboxApi(action, data);
    if (!APP_SETTINGS.API_URL || APP_SETTINGS.API_URL.includes('COLE_AQUI')) throw new Error('Configure a URL do Apps Script em js/config.js.');
    const token = localStorage.getItem(APP_SETTINGS.TOKEN_KEY) || '';
    const response = await fetch(APP_SETTINGS.API_URL, {
      method: 'POST',
      redirect: 'follow',
      headers: {'Content-Type':'text/plain;charset=utf-8'},
      body: JSON.stringify({action, token, data})
    });
    if (!response.ok) throw new Error('Não foi possível contactar o servidor.');
    const payload = await response.json();
    if (!payload.ok) {
      if (['SESSION_EXPIRED','AUTH_REQUIRED'].includes(payload.error?.code)) Auth.clearSession();
      throw new Error(payload.error?.message || 'Ocorreu um erro.');
    }
    return payload.data;
  }
};
