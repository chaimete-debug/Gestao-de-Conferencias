(function () {
  const STORAGE_KEY = 'cmnm_language';
  const SUPPORTED = ['pt', 'en'];
  const localeMap = { pt: 'pt-PT', en: 'en-GB' };

  const dict = {
    pt: {
      'language.pt': 'Português', 'language.en': 'English',
      'app.subtitle': 'Inscrições, pagamentos, programa, moderadoras e relatórios num único sistema.',
      'login.access': 'Acesso ao sistema', 'login.title': 'Iniciar sessão', 'login.username': 'Utilizador ou correio electrónico',
      'login.password': 'Palavra-passe', 'login.submit': 'Entrar', 'login.sandbox': 'Modo de demonstração:', 'login.sandbox.credentials': 'use admin / admin.',
      'topbar.selectedConference': 'Conferência seleccionada', 'common.noConference': 'Sem conferência', 'mode.demo': 'DEMONSTRAÇÃO', 'mode.production': 'PRODUÇÃO',
      'nav.dashboard': 'Visão Geral', 'nav.conference': 'Conferência', 'nav.participants': 'Participantes', 'nav.credentials': 'Credenciação',
      'nav.attendance': 'Presenças', 'nav.materials': 'Materiais', 'nav.accommodations': 'Alojamento', 'nav.meals': 'Alimentação',
      'nav.transport': 'Transporte', 'nav.certificates': 'Certificados', 'nav.communications': 'Comunicações', 'nav.reports': 'Relatórios',
      'nav.evaluationClosure': 'Avaliação e encerramento', 'nav.payments': 'Finanças', 'nav.sessions': 'Programa e sessões',
      'nav.intervenients': 'Moderadoras e oradoras', 'nav.users': 'Utilizadores', 'nav.administration': 'Administração', 'logout': 'Terminar sessão',
      'actions.save': 'Guardar', 'actions.cancel': 'Cancelar', 'actions.edit': 'Editar', 'actions.new': 'Novo', 'actions.delete': 'Apagar',
      'actions.refresh': 'Actualizar', 'actions.search': 'Pesquisar', 'actions.print': 'Imprimir', 'actions.export': 'Exportar',
      'actions.close': 'Fechar', 'actions.open': 'Abrir', 'actions.confirm': 'Confirmar', 'actions.reject': 'Rejeitar',
      'common.loading': 'A carregar…', 'common.noRecords': 'Nenhum registo encontrado.', 'common.all': 'Todos', 'common.allFem': 'Todas',
      'common.select': 'Seleccione', 'common.yes': 'Sim', 'common.no': 'Não', 'common.status': 'Estado', 'common.actions': 'Acções',
      'common.date': 'Data', 'common.name': 'Nome', 'common.phone': 'Telefone', 'common.email': 'Correio electrónico', 'common.language': 'Idioma preferido',
      'common.portuguese': 'Português', 'common.english': 'Inglês', 'common.participant': 'Participante', 'common.participants': 'Participantes',
      'common.district': 'Distrito', 'common.church': 'Igreja', 'common.category': 'Categoria', 'common.payment': 'Pagamento', 'common.registration': 'Inscrição',
      'common.nationality': 'Nacionalidade', 'common.amount': 'Valor', 'common.balance': 'Saldo', 'common.observations': 'Observações',
      'error.viewNotFound': 'Vista não encontrada.', 'error.loadFailed': 'Não foi possível carregar', 'retry': 'Tentar novamente'
    },
    en: {
      'language.pt': 'Português', 'language.en': 'English',
      'app.subtitle': 'Registrations, payments, programme, moderators and reports in one system.',
      'login.access': 'System access', 'login.title': 'Sign in', 'login.username': 'Username or email',
      'login.password': 'Password', 'login.submit': 'Sign in', 'login.sandbox': 'Demo mode:', 'login.sandbox.credentials': 'use admin / admin.',
      'topbar.selectedConference': 'Selected conference', 'common.noConference': 'No conference', 'mode.demo': 'DEMO', 'mode.production': 'PRODUCTION',
      'nav.dashboard': 'Dashboard', 'nav.conference': 'Conference', 'nav.participants': 'Participants', 'nav.credentials': 'Accreditation',
      'nav.attendance': 'Attendance', 'nav.materials': 'Materials', 'nav.accommodations': 'Accommodation', 'nav.meals': 'Meals',
      'nav.transport': 'Transport', 'nav.certificates': 'Certificates', 'nav.communications': 'Communications', 'nav.reports': 'Reports',
      'nav.evaluationClosure': 'Evaluation and closure', 'nav.payments': 'Finance', 'nav.sessions': 'Programme and sessions',
      'nav.intervenients': 'Moderators and speakers', 'nav.users': 'Users', 'nav.administration': 'Administration', 'logout': 'Sign out',
      'actions.save': 'Save', 'actions.cancel': 'Cancel', 'actions.edit': 'Edit', 'actions.new': 'New', 'actions.delete': 'Delete',
      'actions.refresh': 'Refresh', 'actions.search': 'Search', 'actions.print': 'Print', 'actions.export': 'Export',
      'actions.close': 'Close', 'actions.open': 'Open', 'actions.confirm': 'Confirm', 'actions.reject': 'Reject',
      'common.loading': 'Loading…', 'common.noRecords': 'No records found.', 'common.all': 'All', 'common.allFem': 'All',
      'common.select': 'Select', 'common.yes': 'Yes', 'common.no': 'No', 'common.status': 'Status', 'common.actions': 'Actions',
      'common.date': 'Date', 'common.name': 'Name', 'common.phone': 'Phone', 'common.email': 'Email', 'common.language': 'Preferred language',
      'common.portuguese': 'Portuguese', 'common.english': 'English', 'common.participant': 'Participant', 'common.participants': 'Participants',
      'common.district': 'District', 'common.church': 'Church', 'common.category': 'Category', 'common.payment': 'Payment', 'common.registration': 'Registration',
      'common.nationality': 'Nationality', 'common.amount': 'Amount', 'common.balance': 'Balance', 'common.observations': 'Notes',
      'error.viewNotFound': 'View not found.', 'error.loadFailed': 'Unable to load', 'retry': 'Try again'
    }
  };

  const exact = {
    en: {
      'Gestão da Conferência': 'Conference Management', 'Avaliação da conferência': 'Conference evaluation',
      'Acesso ao sistema': 'System access', 'Iniciar sessão': 'Sign in', 'Utilizador ou correio electrónico': 'Username or email', 'Palavra-passe': 'Password', 'Entrar': 'Sign in',
      'Modo de demonstração:': 'Demo mode:', 'Visão Geral': 'Dashboard', 'Conferência': 'Conference', 'Participantes': 'Participants', 'Credenciação': 'Accreditation', 'Presenças': 'Attendance',
      'Materiais': 'Materials', 'Alojamento': 'Accommodation', 'Alimentação': 'Meals', 'Transporte': 'Transport', 'Certificados': 'Certificates', 'Comunicações': 'Communications',
      'Relatórios': 'Reports', 'Avaliação e encerramento': 'Evaluation and closure', 'Finanças': 'Finance', 'Programa e sessões': 'Programme and sessions',
      'Moderadoras e oradoras': 'Moderators and speakers', 'Utilizadores': 'Users', 'Administração': 'Administration', 'Terminar sessão': 'Sign out',
      'Conferência seleccionada': 'Selected conference', 'PRODUÇÃO': 'PRODUCTION', 'DEMONSTRAÇÃO': 'DEMO', 'Painel operacional': 'Operational dashboard',
      'Resumo operacional': 'Operational summary', 'Indicadores principais': 'Key indicators', 'Inscrições e finanças': 'Registrations and finance',
      'Execução financeira': 'Financial execution', 'Operações da conferência': 'Conference operations', 'Atenção necessária': 'Needs attention',
      'Agenda do dia': 'Today’s agenda', 'Participantes por distrito': 'Participants by district', 'Actividade recente': 'Recent activity',
      'Dados gerais e período de realização.': 'General data and conference dates.', 'Editar conferência': 'Edit conference', 'Nova conferência': 'New conference',
      'Criar conferência': 'Create conference', 'Guardar conferência': 'Save conference', 'Conferências registadas': 'Registered conferences',
      'Nome': 'Name', 'Tema': 'Theme', 'Lema': 'Motto', 'Local': 'Location', 'Datas': 'Dates', 'Capacidade': 'Capacity', 'Valor da inscrição': 'Registration fee',
      'Estado': 'Status', 'Acções': 'Actions', 'Pesquisar': 'Search', 'Todos': 'All', 'Todas': 'All', 'Seleccione': 'Select', 'Guardar': 'Save', 'Cancelar': 'Cancel',
      'Editar': 'Edit', 'Actualizar': 'Refresh', 'Confirmar': 'Confirm', 'Rejeitar': 'Reject', 'Abrir': 'Open', 'Abrir PDF': 'Open PDF', 'Imprimir': 'Print',
      'Exportar para Excel': 'Export to Excel', 'Participante': 'Participant', 'Distrito': 'District', 'Igreja': 'Church', 'Categoria': 'Category', 'Pagamento': 'Payment',
      'Inscrição': 'Registration', 'N.º inscrição': 'Registration No.', 'Distrito / Igreja': 'District / Church', 'Nova inscrição': 'New registration',
      'Inscrições e credenciação': 'Registrations and accreditation', 'Registo, validação, situação financeira e check-in.': 'Registration, validation, financial status and check-in.',
      'Nome completo': 'Full name', 'Telefone': 'Phone', 'Correio electrónico': 'Email', 'Data de nascimento': 'Date of birth', 'Nacionalidade': 'Nationality',
      'Indique a nacionalidade': 'Specify nationality', 'Tipo de documento': 'Document type', 'Número do documento': 'Document number', 'Igreja local': 'Local church',
      'Estado da inscrição': 'Registration status', 'Valor total devido': 'Total amount due', 'Cargo na igreja': 'Church role', 'Necessita de alojamento': 'Needs accommodation',
      'Necessita de transporte': 'Needs transport', 'Contacto de emergência': 'Emergency contact', 'Telefone de emergência': 'Emergency phone',
      'Necessidades alimentares': 'Dietary needs', 'Observações': 'Notes', 'Editar participante': 'Edit participant', 'Inscrição guardada.': 'Registration saved.',
      'Check-in registado.': 'Check-in recorded.', 'Administração': 'Administration', 'Contas, perfis e âmbito de acesso.': 'Accounts, roles and access scope.',
      'Novo utilizador': 'New user', 'Editar utilizador': 'Edit user', 'Nome de utilizador': 'Username', 'Perfil': 'Role', 'Âmbito de acesso': 'Access scope',
      'Contacto': 'Contact', 'Todos os distritos': 'All districts', 'Todas as igrejas': 'All churches', 'Todas as igrejas do distrito': 'All churches in the district',
      'Igreja': 'Church', 'Conta activa': 'Active account', 'Nova palavra-passe (deixar em branco para manter)': 'New password (leave blank to keep current)',
      'Palavra-passe inicial': 'Initial password', 'Utilizador guardado.': 'User saved.', 'A igreja seleccionada não pertence ao distrito indicado.': 'The selected church does not belong to the selected district.',
      'Documentos de encerramento': 'Closing documents', 'Emita certificados individuais ou em lote e guarde-os automaticamente no Google Drive.': 'Issue individual or batch certificates and save them automatically to Google Drive.',
      'Emitir certificado individual': 'Issue individual certificate', 'Por defeito, exige check-in na conferência.': 'By default, conference check-in is required.',
      'Tipo': 'Type', 'Exigir check-in na conferência': 'Require conference check-in', 'Ler QR': 'Scan QR', 'Gerar certificado': 'Generate certificate',
      'Certificados emitidos': 'Issued certificates', 'Emitir em lote': 'Issue in batch', 'Participação': 'Participation', 'Moderação': 'Moderation',
      'Prelecção / Oradora': 'Preaching / Speaker', 'Facilitação': 'Facilitation', 'Organização': 'Organisation', 'Voluntariado': 'Volunteering', 'Reconhecimento': 'Recognition',
      'Data de emissão': 'Issue date', 'Ficheiro': 'File', 'O certificado já existia.': 'The certificate already existed.', 'Certificado gerado com sucesso.': 'Certificate generated successfully.',
      'Abrir certificado': 'Open certificate', 'Emitir certificados em lote': 'Issue certificates in batch', 'Gerar certificados': 'Generate certificates', 'Quantidade máxima': 'Maximum quantity',
      'Gerar somente para participantes com check-in': 'Generate only for checked-in participants', 'Substituir certificados já emitidos do mesmo tipo': 'Replace certificates already issued for the same type',
      'Título personalizado': 'Custom title', 'Texto personalizado': 'Custom text', 'Deixe vazio para usar o título padrão': 'Leave empty to use the default title',
      'Deixe vazio para usar o texto padrão': 'Leave empty to use the default text', 'Comunicação': 'Communication', 'Canal': 'Channel', 'Segmento': 'Segment', 'Progresso': 'Progress',
      'Criação / Agendamento': 'Creation / Scheduling', 'Destinatárias': 'Recipients', 'Pré-visualizar destinatárias': 'Preview recipients', 'Guardar comunicação': 'Save communication',
      'destinatárias válidas': 'valid recipients', 'sem contacto do canal': 'without channel contact', 'Idioma preferido': 'Preferred language', 'Português': 'Portuguese', 'Inglês': 'English',
      'Moçambicana (Moçambique)': 'Mozambican (Mozambique)', 'Sul-africana (África do Sul)': 'South African (South Africa)', 'Suázi (Eswatini)': 'Swazi (Eswatini)',
      'Zimbabueana (Zimbabwe)': 'Zimbabwean (Zimbabwe)', 'Zambiana (Zâmbia)': 'Zambian (Zambia)', 'Malawiana (Malawi)': 'Malawian (Malawi)',
      'Tanzaniana (Tanzânia)': 'Tanzanian (Tanzania)', 'Outra nacionalidade': 'Other nationality', 'Nenhum registo encontrado.': 'No records found.',
      'A carregar…': 'Loading…', 'Não foi possível carregar': 'Unable to load', 'Vista não encontrada.': 'View not found.', 'Tentar novamente': 'Try again',
      'PENDENTE': 'PENDING', 'CONFIRMADO': 'CONFIRMED', 'CONFIRMADA': 'CONFIRMED', 'PRESENTE': 'PRESENT', 'ACTIVO': 'ACTIVE', 'INACTIVO': 'INACTIVE',
      'CANCELADA': 'CANCELLED', 'CANCELADO': 'CANCELLED', 'RASCUNHO': 'DRAFT', 'AGENDADA': 'SCHEDULED', 'ENVIADA': 'SENT', 'PREPARADA': 'PREPARED',
      'EM PREPARACAO': 'IN PREPARATION', 'EM VERIFICACAO': 'UNDER REVIEW', 'PAGA': 'PAID', 'PAGO': 'PAID', 'PARCIAL': 'PARTIAL', 'ISENTO': 'EXEMPT'
    }
  };

  function current() {
    const saved = localStorage.getItem(STORAGE_KEY) || '';
    return SUPPORTED.includes(saved) ? saved : 'pt';
  }

  function t(key, fallback) {
    const lang = current();
    return (dict[lang] && dict[lang][key]) || (dict.pt && dict.pt[key]) || fallback || key;
  }

  function translateExact(text) {
    const lang = current();
    if (lang === 'pt') return text;
    const map = exact[lang] || {};
    const trimmed = String(text || '').trim();
    return map[trimmed] || text;
  }

  function walkText(root) {
    if (current() === 'pt') return;
    const skip = new Set(['SCRIPT','STYLE','TEXTAREA','INPUT','OPTION','SELECT','CODE']);
    const walker = document.createTreeWalker(root || document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        if (node.parentElement && skip.has(node.parentElement.tagName)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => {
      const original = node.nodeValue;
      const leading = original.match(/^\s*/)[0];
      const trailing = original.match(/\s*$/)[0];
      const translated = translateExact(original);
      if (translated !== original) node.nodeValue = leading + translated + trailing;
    });
  }

  function translatePlaceholders(root) {
    if (current() === 'pt') return;
    const map = exact[current()] || {};
    (root || document).querySelectorAll('input[placeholder], textarea[placeholder]').forEach(el => {
      const val = String(el.getAttribute('placeholder') || '').trim();
      if (map[val]) el.setAttribute('placeholder', map[val]);
    });
    (root || document).querySelectorAll('option').forEach(el => {
      const val = String(el.textContent || '').trim();
      if (map[val]) el.textContent = map[val];
    });
    (root || document).querySelectorAll('button, a.btn, .status').forEach(el => {
      const val = String(el.textContent || '').trim();
      if (map[val]) el.textContent = map[val];
    });
  }

  function apply(root) {
    const base = root || document;
    document.documentElement.lang = current();
    base.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n, el.textContent); });
    base.querySelectorAll('[data-i18n-placeholder]').forEach(el => { el.setAttribute('placeholder', t(el.dataset.i18nPlaceholder, el.getAttribute('placeholder'))); });
    base.querySelectorAll('[data-i18n-title]').forEach(el => { el.setAttribute('title', t(el.dataset.i18nTitle, el.getAttribute('title'))); });
    translatePlaceholders(base);
    walkText(base);
    updateSwitchers();
  }

  function updateSwitchers() {
    document.querySelectorAll('[data-language-select]').forEach(select => { select.value = current(); });
  }

  function setLanguage(lang, options) {
    const next = SUPPORTED.includes(lang) ? lang : 'pt';
    localStorage.setItem(STORAGE_KEY, next);
    document.documentElement.lang = next;
    updateSwitchers();
    if (!options || !options.silent) apply(document);
  }

  function init() {
    setLanguage(current(), { silent: true });
    document.addEventListener('change', event => {
      const select = event.target.closest('[data-language-select]');
      if (select) {
        setLanguage(select.value);
        document.dispatchEvent(new CustomEvent('cmnm:language-changed', { detail: { language: current() } }));
      }
    });
  }

  function locale() { return localeMap[current()] || 'pt-PT'; }
  function currency(value) { return new Intl.NumberFormat(locale(), { style:'currency', currency:'MZN', minimumFractionDigits:2 }).format(Number(value||0)); }
  function date(value) { if(!value)return '—'; const d=new Date(String(value).length===10?value+'T00:00:00':value); return isNaN(d)?value:new Intl.DateTimeFormat(locale(),{day:'2-digit',month:'short',year:'numeric'}).format(d); }

  window.I18n = { supported: SUPPORTED, current, t, translateExact, setLanguage, init, apply, locale, currency, date };
})();
