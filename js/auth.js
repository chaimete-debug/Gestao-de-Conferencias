window.Auth = {
  get user(){try{return JSON.parse(localStorage.getItem(APP_SETTINGS.USER_KEY)||'null');}catch{return null;}},
  get permissions(){try{return JSON.parse(localStorage.getItem(APP_SETTINGS.PERMISSIONS_KEY)||'[]');}catch{return [];}},
  async login(username,password){const result=await Api.request('auth.login',{username,password});localStorage.setItem(APP_SETTINGS.TOKEN_KEY,result.token);localStorage.setItem(APP_SETTINGS.USER_KEY,JSON.stringify(result.user));localStorage.setItem(APP_SETTINGS.PERMISSIONS_KEY,JSON.stringify(result.permissions||[]));return result;},
  async refresh(){const result=await Api.request('auth.me');localStorage.setItem(APP_SETTINGS.USER_KEY,JSON.stringify(result.user));localStorage.setItem(APP_SETTINGS.PERMISSIONS_KEY,JSON.stringify(result.permissions||[]));return result;},
  can(permission){return this.user?.perfil_id==='ADMIN_GERAL'||this.permissions.includes('*')||this.permissions.includes(permission);},
  async logout(){try{await Api.request('auth.logout');}catch{}this.clearSession();location.reload();},
  clearSession(){localStorage.removeItem(APP_SETTINGS.TOKEN_KEY);localStorage.removeItem(APP_SETTINGS.USER_KEY);localStorage.removeItem(APP_SETTINGS.PERMISSIONS_KEY);},
  hasSession(){return !!localStorage.getItem(APP_SETTINGS.TOKEN_KEY) && !!this.user;}
};
