window.Views = window.Views || {};

Views.communications = async function () {
  const conferenceId = App.state.conferenceId;
  if (!conferenceId) {
    App.container.innerHTML = '<div class="card panel"><h3>Seleccione uma conferência</h3><p class="muted">As comunicações são sempre associadas à conferência seleccionada.</p></div>';
    return;
  }
  const [campaigns, templates] = await Promise.all([
    Api.request('communications.list', { id_conferencia:conferenceId }),
    Api.request('communications.templates.list', {})
  ]);
  App.state.communicationCampaigns = campaigns.items || [];
  App.state.communicationTemplates = templates || [];
  const summary = campaigns.summary || {};
  const canManage = Auth.can('comunicacoes.gerir');
  const canSend = Auth.can('comunicacoes.enviar');
  const lookups = App.state.lookups || {};

  App.container.innerHTML = `
    <div class="page-header">
      <div><span class="eyebrow">Informação e acompanhamento</span><h1>Comunicações</h1><p class="muted">Prepare avisos segmentados por correio electrónico, WhatsApp ou SMS.</p></div>
      <div class="page-actions">${canManage ? '<button class="btn btn-secondary" id="communication-new-template">Guardar modelo</button><button class="btn btn-primary" id="communication-new">Nova comunicação</button>' : ''}</div>
    </div>
    <div class="kpi-grid communication-kpis">
      <div class="card kpi"><span>Comunicações</span><strong>${Number(summary.total || 0)}</strong></div>
      <div class="card kpi"><span>Rascunhos</span><strong>${Number(summary.rascunhos || 0)}</strong></div>
      <div class="card kpi"><span>Preparadas / em envio</span><strong>${Number(summary.preparadas || 0)}</strong></div>
      <div class="card kpi"><span>Concluídas</span><strong>${Number(summary.enviadas || 0)}</strong></div>
    </div>
    ${canManage ? communicationComposer_(lookups, templates) : ''}
    <section class="card panel communication-history">
      <div class="panel-header"><div><span class="eyebrow">Histórico</span><h3>Comunicações da conferência</h3></div><button class="btn btn-secondary btn-sm" id="communication-refresh">Actualizar</button></div>
      <div>${communicationCampaignTable_(App.state.communicationCampaigns, canManage, canSend)}</div>
    </section>`;

  document.getElementById('communication-refresh').onclick = () => App.render('communications');
  if (!canManage) return;
  communicationBindComposer_(templates);
  document.getElementById('communication-new').onclick = () => communicationResetComposer_();
  document.getElementById('communication-new-template').onclick = () => communicationSaveTemplateFromComposer_();
  document.querySelectorAll('.communication-edit').forEach(button => button.onclick = () => communicationLoadCampaign_(button.dataset.id));
  document.querySelectorAll('.communication-recipients').forEach(button => button.onclick = () => communicationRecipientsModal_(button.dataset.id));
  document.querySelectorAll('.communication-cancel').forEach(button => button.onclick = () => communicationCancel_(button.dataset.id));
  document.querySelectorAll('.communication-send').forEach(button => button.onclick = () => communicationSend_(button.dataset.id));
};

function communicationComposer_(lookups, templates) {
  const districts = lookups.districts || [];
  const categories = lookups.categories || [];
  return `<section class="card panel communication-composer" id="communication-composer">
    <div class="panel-header"><div><span class="eyebrow">Nova mensagem</span><h3 id="communication-form-title">Compor comunicação</h3></div><span class="communication-channel-note">WhatsApp e SMS são preparados para envio manual.</span></div>
    <form id="communication-form">
      <input type="hidden" name="id_comunicacao">
      <div class="form-grid communication-main-fields">
        <label>Canal<select name="canal" id="communication-channel" required>${['WHATSAPP','EMAIL','SMS'].map(x=>UI.option(x,x)).join('')}</select></label>
        <label>Tipo<select name="tipo">${['GERAL','INSCRICAO','PAGAMENTO','LEMBRETE','ALOJAMENTO','TRANSPORTE','PROGRAMA','CERTIFICADO'].map(x=>UI.option(x,x.replaceAll('_',' '))).join('')}</select></label>
        <label class="span-2">Modelo<select id="communication-template"><option value="">Sem modelo</option>${templates.map(x=>UI.option(x.id_modelo,x.nome)).join('')}</select></label>
        <label class="span-2 communication-subject-field">Assunto<input name="assunto" id="communication-subject" placeholder="Obrigatório para correio electrónico"></label>
        <label class="span-2">Agendar envio por e-mail<input name="agendada_para" type="datetime-local" id="communication-schedule"><small>Deixe em branco para envio imediato ou preparação manual.</small></label>
        <label class="span-4">Mensagem<textarea name="mensagem" id="communication-message" rows="7" required placeholder="Escreva a mensagem..."></textarea><small>Variáveis: {primeiro_nome}, {nome}, {numero_inscricao}, {conferencia}, {local}, {data_inicio}, {saldo_pendente}, {igreja}, {distrito}, {alojamento}, {rota}, {certificado_url}.</small></label>
      </div>
      <div class="communication-filter-heading"><span class="eyebrow">Destinatárias</span><h4>Filtros do público</h4></div>
      <div class="form-grid communication-filter-grid">
        <label>Distrito<select name="id_distrito" id="communication-district"><option value="">Todos</option>${districts.map(x=>UI.option(x.id_distrito,x.nome)).join('')}</select></label>
        <label>Igreja<select name="id_igreja" id="communication-church" disabled><option value="">Todas</option></select></label>
        <label>Categoria<select name="id_categoria"><option value="">Todas</option>${categories.map(x=>UI.option(x.id_categoria,x.nome)).join('')}</select></label>
        <label>Estado da inscrição<select name="estado_inscricao"><option value="">Todos</option>${['SUBMETIDA','EM_VERIFICACAO','CONFIRMADA','PENDENTE_PAGAMENTO','PAGA','CANCELADA','RECUSADA','PRESENTE'].map(x=>UI.option(x,x.replaceAll('_',' '))).join('')}</select></label>
        <label>Estado do pagamento<select name="estado_pagamento"><option value="">Todos</option>${['PENDENTE','PARCIAL','PAGO','ISENTO'].map(x=>UI.option(x,x)).join('')}</select></label>
        <label>Saldo pendente<select name="saldo_pendente"><option value="">Todos</option>${UI.option('SIM','Somente com saldo')}${UI.option('NAO','Somente sem saldo')}</select></label>
        <label>Presença<select name="checkin"><option value="">Todas</option>${UI.option('PRESENTE','Presentes')}${UI.option('AUSENTE','Ausentes')}</select></label>
        <label>Solicitou alojamento<select name="necessita_alojamento"><option value="">Todas</option>${UI.option('SIM','Sim')}${UI.option('NAO','Não')}</select></label>
        <label>Alojamento atribuído<select name="tem_alojamento"><option value="">Todas</option>${UI.option('SIM','Sim')}${UI.option('NAO','Não')}</select></label>
        <label>Solicitou transporte<select name="necessita_transporte"><option value="">Todas</option>${UI.option('SIM','Sim')}${UI.option('NAO','Não')}</select></label>
        <label>Transporte atribuído<select name="tem_transporte"><option value="">Todas</option>${UI.option('SIM','Sim')}${UI.option('NAO','Não')}</select></label>
        <label>Pesquisa<input name="search" placeholder="Nome, inscrição ou contacto"></label>
      </div>
      <div class="communication-form-actions"><button type="button" class="btn btn-secondary" id="communication-preview">Pré-visualizar destinatárias</button><button type="submit" class="btn btn-primary">Guardar comunicação</button></div>
    </form>
    <div id="communication-preview-output" class="communication-preview-output"></div>
  </section>`;
}

function communicationBindComposer_(templates) {
  const form = document.getElementById('communication-form');
  const channel = document.getElementById('communication-channel');
  const template = document.getElementById('communication-template');
  const district = document.getElementById('communication-district');
  const church = document.getElementById('communication-church');
  const schedule = document.getElementById('communication-schedule');
  schedule.min = new Date(Date.now()+60000).toISOString().slice(0,16);

  const updateChannel = () => {
    const email = channel.value === 'EMAIL';
    document.querySelector('.communication-subject-field').classList.toggle('communication-required', email);
    document.getElementById('communication-subject').required = email;
    schedule.disabled = !email;
    if (!email) schedule.value = '';
  };
  channel.addEventListener('change', updateChannel); updateChannel();

  template.addEventListener('change', () => {
    const item = templates.find(x => String(x.id_modelo) === String(template.value));
    if (!item) return;
    channel.value = item.canal || 'WHATSAPP';
    form.elements.tipo.value = item.tipo || 'GERAL';
    form.elements.assunto.value = item.assunto || '';
    form.elements.mensagem.value = item.mensagem || '';
    updateChannel();
  });

  const populateChurches = selected => {
    const districtId = district.value;
    const rows = (App.state.lookups?.churches || []).filter(x => String(x.id_distrito) === String(districtId));
    church.innerHTML = '<option value="">Todas</option>' + rows.map(x=>UI.option(x.id_igreja,x.nome,selected)).join('');
    church.disabled = !districtId;
    if (!districtId) church.value = '';
  };
  district.addEventListener('change', () => populateChurches(''));
  form._populateChurches = populateChurches;

  document.getElementById('communication-preview').onclick = async () => {
    const button = document.getElementById('communication-preview');
    button.disabled = true;
    try {
      const payload = communicationFormPayload_();
      const preview = await Api.request('communications.preview', payload);
      communicationRenderPreview_(preview);
    } catch (error) { UI.toast(error.message,'error'); }
    finally { button.disabled = false; }
  };

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const button = event.submitter;
    button.disabled = true;
    try {
      const payload = communicationFormPayload_();
      await Api.request('communications.save', payload);
      UI.toast(payload.agendada_para ? 'Comunicação guardada e agendada.' : 'Comunicação guardada como rascunho.');
      App.render('communications');
    } catch (error) { UI.toast(error.message,'error'); button.disabled = false; }
  });
}

function communicationFormPayload_() {
  const form = document.getElementById('communication-form');
  const raw = Object.fromEntries(new FormData(form).entries());
  const filterKeys = ['id_distrito','id_igreja','id_categoria','estado_inscricao','estado_pagamento','saldo_pendente','checkin','necessita_alojamento','tem_alojamento','necessita_transporte','tem_transporte','search'];
  const filters = {};
  filterKeys.forEach(key => { if (raw[key]) filters[key] = raw[key]; delete raw[key]; });
  raw.id_conferencia = App.state.conferenceId;
  raw.filters = filters;
  return raw;
}

function communicationRenderPreview_(preview) {
  const output = document.getElementById('communication-preview-output');
  output.innerHTML = `<div class="communication-preview-summary"><div><strong>${Number(preview.total || 0)}</strong><span>destinatárias válidas</span></div><div><strong>${Number(preview.excluidas_sem_contacto || 0)}</strong><span>sem contacto do canal</span></div><div><strong>${UI.escape(preview.segmento || '')}</strong><span>segmento</span></div></div>
    ${(preview.samples||[]).length ? `<div class="communication-samples">${preview.samples.map(sample=>`<article><header><strong>${UI.escape(sample.nome)}</strong><span>${UI.escape(sample.contacto)}</span></header>${sample.assunto?`<b>${UI.escape(sample.assunto)}</b>`:''}<p>${UI.escape(sample.mensagem).replace(/\n/g,'<br>')}</p></article>`).join('')}</div>` : UI.empty('Nenhuma participante corresponde aos filtros e ao canal seleccionados.')}`;
}

function communicationCampaignTable_(rows, canManage, canSend) {
  if (!rows.length) return UI.empty('Ainda não existem comunicações registadas.');
  return `<div class="table-wrap"><table><thead><tr><th>Comunicação</th><th>Canal</th><th>Segmento</th><th>Progresso</th><th>Estado</th><th>Criação / Agendamento</th><th>Acções</th></tr></thead><tbody>${rows.map(row=>{
    const total=Number(row.total_destinatarios||row.destinatarios||0), sent=Number(row.enviados||0), failed=Number(row.falhados||0);
    const editable=canManage&&['RASCUNHO','AGENDADA'].includes(String(row.estado));
    const sendable=canSend&&!['ENVIADA','CANCELADA'].includes(String(row.estado));
    return `<tr><td><strong>${UI.escape(row.assunto||row.tipo||'Mensagem')}</strong><br><small>${UI.escape(String(row.mensagem||'').slice(0,90))}${String(row.mensagem||'').length>90?'…':''}</small></td><td><span class="communication-channel ${String(row.canal).toLowerCase()}">${UI.escape(row.canal)}</span></td><td>${UI.escape(row.segmento||'Todas as participantes')}</td><td><strong>${sent}/${total}</strong>${failed?`<br><small class="communication-error">${failed} com erro</small>`:''}</td><td>${UI.status(row.estado)}</td><td>${communicationDateTime_(row.criado_em)}${row.agendada_para?`<br><small>Agendada: ${communicationDateTime_(row.agendada_para)}</small>`:''}</td><td><div class="actions">${editable?`<button class="btn btn-secondary btn-sm communication-edit" data-id="${row.id_comunicacao}">Editar</button>`:''}<button class="btn btn-secondary btn-sm communication-recipients" data-id="${row.id_comunicacao}">Destinatárias</button>${sendable?`<button class="btn btn-primary btn-sm communication-send" data-id="${row.id_comunicacao}">${row.canal==='EMAIL'?'Enviar':'Preparar'}</button>`:''}${editable?`<button class="btn btn-danger btn-sm communication-cancel" data-id="${row.id_comunicacao}">Cancelar</button>`:''}</div></td></tr>`;
  }).join('')}</tbody></table></div>`;
}

function communicationLoadCampaign_(id) {
  const row = App.state.communicationCampaigns.find(x => String(x.id_comunicacao) === String(id));
  if (!row) return;
  const form = document.getElementById('communication-form');
  const filters = communicationParseJson_(row.filtros_json);
  form.elements.id_comunicacao.value = row.id_comunicacao;
  form.elements.canal.value = row.canal || 'WHATSAPP';
  form.elements.tipo.value = row.tipo || 'GERAL';
  form.elements.assunto.value = row.assunto || '';
  form.elements.mensagem.value = row.mensagem || '';
  form.elements.agendada_para.value = communicationDateTimeLocal_(row.agendada_para);
  Object.keys(filters).forEach(key => { if (form.elements[key]) form.elements[key].value = filters[key]; });
  form._populateChurches(filters.id_igreja || '');
  document.getElementById('communication-channel').dispatchEvent(new Event('change'));
  document.getElementById('communication-form-title').textContent = 'Editar comunicação';
  document.getElementById('communication-composer').scrollIntoView({behavior:'smooth',block:'start'});
}

function communicationResetComposer_() {
  const form=document.getElementById('communication-form');form.reset();form.elements.id_comunicacao.value='';form._populateChurches('');document.getElementById('communication-preview-output').innerHTML='';document.getElementById('communication-form-title').textContent='Compor comunicação';document.getElementById('communication-channel').dispatchEvent(new Event('change'));document.getElementById('communication-composer').scrollIntoView({behavior:'smooth'});
}

async function communicationSaveTemplateFromComposer_() {
  const form=document.getElementById('communication-form');
  UI.modal({title:'Guardar modelo de comunicação',body:`<div class="form-grid"><label>Nome do modelo<input name="nome" required></label><label>Canal<select name="canal">${['WHATSAPP','EMAIL','SMS'].map(x=>UI.option(x,x,form.elements.canal.value)).join('')}</select></label><label>Tipo<select name="tipo">${['GERAL','INSCRICAO','PAGAMENTO','LEMBRETE','ALOJAMENTO','TRANSPORTE','PROGRAMA','CERTIFICADO'].map(x=>UI.option(x,x,form.elements.tipo.value)).join('')}</select></label><label class="span-2">Assunto<input name="assunto" value="${UI.escape(form.elements.assunto.value)}"></label><label class="span-2">Mensagem<textarea name="mensagem" required>${UI.escape(form.elements.mensagem.value)}</textarea></label></div>`,onSubmit:async data=>{await Api.request('communications.templates.save',data);UI.toast('Modelo guardado.');App.render('communications');}});
}

async function communicationSend_(id) {
  const row=App.state.communicationCampaigns.find(x=>String(x.id_comunicacao)===String(id));
  if(!row)return;
  const verb=row.canal==='EMAIL'?'enviar':'preparar';
  if(!confirm(`Confirma que pretende ${verb} esta comunicação para ${Number(row.total_destinatarios||row.destinatarios||0)} destinatárias?`))return;
  try{
    const result=await Api.request('communications.send',{id_comunicacao:id,batch_size:40});
    if(result.agendada){UI.toast('A comunicação permanece agendada para a data definida.');App.render('communications');}
    else if(result.modo_manual){UI.toast('Lista preparada para envio manual.');await communicationRecipientsModal_(id);}
    else if(result.falhados>0){UI.toast(`Envio processado com ${result.falhados} erro(s). Pode tentar novamente.`,'error');App.render('communications');}
    else{UI.toast(result.pendentes>0?`Lote enviado. Restam ${result.pendentes} mensagens.`:'Envio concluído.');App.render('communications');}
  }catch(error){UI.toast(error.message,'error');}
}

async function communicationCancel_(id) {
  if(!confirm('Confirma o cancelamento desta comunicação?'))return;
  try{await Api.request('communications.cancel',{id_comunicacao:id});UI.toast('Comunicação cancelada.');App.render('communications');}catch(error){UI.toast(error.message,'error');}
}

async function communicationRecipientsModal_(id) {
  try{
    const data=await Api.request('communications.recipients',{id_comunicacao:id,pageSize:500});
    const root=document.getElementById('modal-root');
    root.innerHTML=`<div class="modal-overlay"><div class="modal wide communication-recipient-modal"><div class="modal-header"><div><span class="eyebrow">${UI.escape(data.campaign?.canal||'')}</span><h2>Destinatárias da comunicação</h2></div><button class="close-btn" type="button">×</button></div><div class="modal-body"><div class="communication-recipient-toolbar"><span><strong>${Number(data.progress?.enviados||0)}</strong> enviadas · <strong>${Number(data.progress?.pendentes||0)}</strong> pendentes · <strong>${Number(data.progress?.falhados||0)}</strong> com erro</span><div><button class="btn btn-secondary btn-sm" id="communication-copy-contacts">Copiar contactos</button><button class="btn btn-secondary btn-sm" id="communication-export-contacts">Exportar CSV</button></div></div>${communicationRecipientTable_(data.items||[],data.campaign)}</div></div></div>`;
    const close=()=>root.innerHTML='';root.querySelector('.close-btn').onclick=close;root.querySelector('.modal-overlay').addEventListener('click',e=>{if(e.target.classList.contains('modal-overlay'))close();});
    root.querySelector('#communication-copy-contacts').onclick=async()=>{await navigator.clipboard.writeText((data.items||[]).map(x=>x.contacto).filter(Boolean).join('\n'));UI.toast('Contactos copiados.');};
    root.querySelector('#communication-export-contacts').onclick=()=>communicationExportRecipients_(data.items||[],data.campaign);
    root.querySelectorAll('.communication-mark-sent').forEach(button=>button.onclick=async()=>{await Api.request('communications.markRecipient',{id_destinatario:button.dataset.id,estado:'ENVIADO'});UI.toast('Destinatária marcada como enviada.');communicationRecipientsModal_(id);});
  }catch(error){UI.toast(error.message,'error');}
}

function communicationRecipientTable_(rows,campaign) {
  if(!rows.length)return UI.empty('A lista ainda não foi preparada. Use o botão Enviar/Preparar na comunicação.');
  return `<div class="table-wrap communication-recipient-table"><table><thead><tr><th>Destinatária</th><th>Contacto</th><th>Mensagem</th><th>Estado</th><th>Acção</th></tr></thead><tbody>${rows.map(row=>`<tr><td><strong>${UI.escape(row.nome||'')}</strong></td><td>${UI.escape(row.contacto||'')}</td><td><small>${UI.escape(String(row.mensagem_personalizada||'').slice(0,120))}${String(row.mensagem_personalizada||'').length>120?'…':''}</small></td><td>${UI.status(row.estado)}</td><td>${campaign?.canal==='WHATSAPP'&&row.whatsapp_url?`<a class="btn btn-primary btn-sm" href="${UI.escape(row.whatsapp_url)}" target="_blank" rel="noopener">Abrir WhatsApp</a>`:''}${campaign?.canal==='SMS'&&row.sms_url?`<a class="btn btn-primary btn-sm" href="${UI.escape(row.sms_url)}">Abrir SMS</a>`:''}${['WHATSAPP','SMS'].includes(campaign?.canal)&&row.estado!=='ENVIADO'?` <button class="btn btn-secondary btn-sm communication-mark-sent" data-id="${row.id_destinatario}">Marcar enviada</button>`:''}</td></tr>`).join('')}</tbody></table></div>`;
}

function communicationExportRecipients_(rows,campaign) {
  const csv=['Nome,Canal,Contacto,Estado,Mensagem'].concat(rows.map(row=>[row.nome,row.canal,row.contacto,row.estado,row.mensagem_personalizada].map(communicationCsvCell_).join(','))).join('\r\n');
  const blob=new Blob(['\ufeff',csv],{type:'text/csv;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`destinatarias_${String(campaign?.canal||'comunicacao').toLowerCase()}_${new Date().toISOString().slice(0,10)}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
function communicationCsvCell_(v){return `"${String(v??'').replace(/"/g,'""')}"`;}
function communicationParseJson_(value){try{return typeof value==='object'&&value?value:JSON.parse(value||'{}');}catch{return{};}}
function communicationDateTime_(value){if(!value)return'—';const d=new Date(value);return Number.isNaN(d.getTime())?UI.escape(value):new Intl.DateTimeFormat('pt-PT',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(d);}
function communicationDateTimeLocal_(value){if(!value)return'';const d=new Date(value);if(Number.isNaN(d.getTime()))return String(value).slice(0,16);const local=new Date(d.getTime()-d.getTimezoneOffset()*60000);return local.toISOString().slice(0,16);}
