window.Api = {
  async request(action, data = {}) {
    if (window.APP_SETTINGS?.SANDBOX) {
      if (typeof window.sandboxApi !== 'function') {
        throw new Error('O modo de demonstração não foi carregado correctamente.');
      }
      return window.sandboxApi(action, data);
    }

    if (!window.APP_SETTINGS?.API_URL || window.APP_SETTINGS.API_URL.includes('COLE_AQUI')) {
      throw new Error('Configure a URL do Apps Script em js/config.js.');
    }

    const token = localStorage.getItem(window.APP_SETTINGS.TOKEN_KEY) || '';
    const response = await fetch(window.APP_SETTINGS.API_URL, {
      method: 'POST',
      redirect: 'follow',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, token, data })
    });

    if (!response.ok) {
      throw new Error('Não foi possível contactar o servidor.');
    }

    let payload;
    try {
      payload = await response.json();
    } catch (error) {
      throw new Error('O servidor devolveu uma resposta inválida.');
    }

    if (!payload.ok) {
      if (['SESSION_EXPIRED', 'AUTH_REQUIRED'].includes(payload.error?.code)) {
        window.Auth?.clearSession?.();
      }
      throw new Error(payload.error?.message || 'Ocorreu um erro.');
    }

    return payload.data;
  }
};
