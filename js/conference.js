Views.conference = async function(){
  const list = await Api.request('conferences.list',{pageSize:100});
  const conferences = list.items || [];
  const current = conferences.find(x=>x.id_conferencia===App.state.conferenceId) || conferences[0] || null;
  const canManage = Auth.can('conferencias.gerir');

  if(current && current.id_conferencia !== App.state.conferenceId){
    App.state.conferenceId = current.id_conferencia;
    App.state.currentConference = current;
    localStorage.setItem(APP_SETTINGS.CONFERENCE_KEY,current.id_conferencia);
    const switcher = document.getElementById('conference-switcher');
    if(switcher) switcher.value = current.id_conferencia;
  }

  const actions = canManage
    ? `<button id="new-conference" class="btn btn-secondary">Nova conferência</button>${current?'<button id="edit-conference" class="btn btn-primary">Editar conferência</button>':''}`
    : '';

  const currentCard = current
    ? `<div class="card panel"><div class="form-grid"><div><span class="muted">Nome</span><h3>${UI.escape(current.nome)}</h3></div><div><span class="muted">Estado</span><p>${UI.status(current.estado)}</p></div><div><span class="muted">Tema</span><p>${UI.escape(current.tema||'—')}</p></div><div><span class="muted">Lema</span><p>${UI.escape(current.lema||'—')}</p></div><div><span class="muted">Local</span><p>${UI.escape(current.local||'—')}</p></div><div><span class="muted">Datas</span><p>${UI.date(current.data_inicio)} — ${UI.date(current.data_fim)}</p></div><div><span class="muted">Valor da inscrição</span><p>${UI.money(current.valor_inscricao)}</p></div><div><span class="muted">Capacidade</span><p>${UI.escape(current.capacidade||'—')}</p></div></div></div>`
    : UI.empty('Ainda não existe nenhuma conferência. Clique em «Nova conferência» para criar a primeira.');

  const rows = conferences.length
    ? conferences.map(conf=>{
        const selected = conf.id_conferencia === current?.id_conferencia;
        return `<tr><td><strong>${UI.escape(conf.nome)}</strong><small class="muted">${UI.escape(conf.codigo||'')}</small></td><td>${UI.status(conf.estado)}</td><td>${UI.date(conf.data_inicio)} — ${UI.date(conf.data_fim)}</td><td>${UI.escape(conf.local||'—')}</td><td class="actions">${selected?'<span class="status ok">SELECCIONADA</span>':`<button class="btn btn-secondary btn-sm select-conference" data-id="${UI.escape(conf.id_conferencia)}">Seleccionar</button>`}${canManage?`<button class="btn btn-ghost btn-sm edit-listed-conference" data-id="${UI.escape(conf.id_conferencia)}">Editar</button>`:''}</td></tr>`;
      }).join('')
    : `<tr><td colspan="5">${UI.empty('Nenhuma conferência registada.')}</td></tr>`;

  App.container.innerHTML = `
    <div class="page-header">
      <div><span class="eyebrow">Configuração</span><h1>Conferência</h1><p class="muted">Crie, seleccione e administre várias conferências no mesmo sistema.</p></div>
      <div class="page-actions">${actions}</div>
    </div>
    ${currentCard}
    <div class="card panel" style="margin-top:16px">
      <div class="panel-header"><div><h3>Conferências registadas</h3><p class="muted">A conferência seleccionada determina os dados apresentados nos outros módulos.</p></div><span class="status neutral">${conferences.length} ${conferences.length===1?'CONFERÊNCIA':'CONFERÊNCIAS'}</span></div>
      <div class="table-wrap"><table><thead><tr><th>Conferência</th><th>Estado</th><th>Datas</th><th>Local</th><th>Acções</th></tr></thead><tbody>${rows}</tbody></table></div>
    </div>`;

  if(canManage){
    const newButton = document.getElementById('new-conference');
    if(newButton) newButton.onclick = ()=>conferenceModal();

    const editButton = document.getElementById('edit-conference');
    if(editButton) editButton.onclick = ()=>conferenceModal(current);

    document.querySelectorAll('.edit-listed-conference').forEach(button=>{
      button.onclick = ()=>{
        const conference = conferences.find(x=>x.id_conferencia===button.dataset.id);
        if(conference) conferenceModal(conference);
      };
    });
  }

  document.querySelectorAll('.select-conference').forEach(button=>{
    button.onclick = async ()=>{
      await selectConference_(button.dataset.id);
    };
  });
};

async function selectConference_(conferenceId){
  App.state.conferenceId = conferenceId;
  localStorage.setItem(APP_SETTINGS.CONFERENCE_KEY,conferenceId);
  await App.loadLookups();
  App.state.currentConference = App.state.lookups.conferences.find(x=>x.id_conferencia===conferenceId) || null;
  UI.toast('Conferência seleccionada.');
  await App.render('conference');
}

function conferenceModal(c={}){
  const isEdit = Boolean(c && c.id_conferencia);
  const modalRoot = UI.modal({
    title:isEdit?'Editar conferência':'Nova conferência',
    body:`<div class="form-grid"><label>Código<input name="codigo" value="${UI.escape(c?.codigo||'CMNM-'+new Date().getFullYear())}" required></label><label>Estado<select name="estado">${['EM_PREPARACAO','INSCRICOES_ABERTAS','INSCRICOES_ENCERRADAS','EM_CURSO','CONCLUIDA','CANCELADA'].map(x=>UI.option(x,x.replaceAll('_',' '),c?.estado||'EM_PREPARACAO')).join('')}</select></label><label class="span-2">Nome<input name="nome" value="${UI.escape(c?.nome||'')}" required></label><label>Tema<input name="tema" value="${UI.escape(c?.tema||'')}"></label><label>Lema<input name="lema" value="${UI.escape(c?.lema||'')}"></label><label>Texto bíblico<input name="texto_biblico" value="${UI.escape(c?.texto_biblico||'')}"></label><label>Local<input name="local" value="${UI.escape(c?.local||'')}"></label><label>Data de início<input type="date" name="data_inicio" value="${String(c?.data_inicio||'').slice(0,10)}"></label><label>Data de encerramento<input type="date" name="data_fim" value="${String(c?.data_fim||'').slice(0,10)}"></label><label>Início das inscrições<input type="date" name="inscricoes_inicio" value="${String(c?.inscricoes_inicio||'').slice(0,10)}"></label><label>Fim das inscrições<input type="date" name="inscricoes_fim" value="${String(c?.inscricoes_fim||'').slice(0,10)}"></label><label>Valor da inscrição<input type="number" min="0" step="0.01" name="valor_inscricao" value="${c?.valor_inscricao||0}"></label><label>Capacidade<input type="number" min="0" name="capacidade" value="${c?.capacidade||0}"></label><label>Contacto responsável<input name="contacto_nome" value="${UI.escape(c?.contacto_nome||'')}"></label><label>Telefone<input name="contacto_telefone" value="${UI.escape(c?.contacto_telefone||'')}"></label></div>`,
    submitText:isEdit?'Guardar alterações':'Criar conferência',
    onSubmit:async data=>{
      if(isEdit) data.id_conferencia = c.id_conferencia;
      const saved = await Api.request('conferences.save',data);
      App.state.conferenceId = saved.id_conferencia;
      localStorage.setItem(APP_SETTINGS.CONFERENCE_KEY,saved.id_conferencia);
      await App.loadLookups();
      UI.toast(isEdit?'Conferência actualizada.':'Nova conferência criada e seleccionada.');
      await App.render('conference');
    }
  });

  UI.bindRangeValidation(modalRoot,'data_inicio','data_fim',{
    message:'A data de encerramento não pode ser anterior à data de início da conferência.'
  });
  UI.bindRangeValidation(modalRoot,'inscricoes_inicio','inscricoes_fim',{
    message:'A data de fim das inscrições não pode ser anterior à data de início das inscrições.'
  });
}
