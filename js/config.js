window.APP_SETTINGS = {
  APP_NAME: 'Gestão da Conferência de Mulheres Nazarenas de Moçambique',
  API_URL: 'COLE_AQUI_A_URL_DO_APPS_SCRIPT',
  SANDBOX: new URLSearchParams(window.location.search).get('sandbox') === '1',
  TOKEN_KEY: 'cmnm_session_token',
  USER_KEY: 'cmnm_current_user',
  PERMISSIONS_KEY: 'cmnm_permissions',
  CONFERENCE_KEY: 'cmnm_selected_conference'
};
