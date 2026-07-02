Views.participants = async function(){
  const result=await Api.request('participants.list',{id_conferencia:App.state.conferenceId,pageSize:500});
  App.state.participants=result.items;
  App.container.innerHTML=`<div class="page-header"><div><span class="eyebrow">Inscrições e credenciação</span><h1>Participantes</h1><p class="muted">Registo, validação, situação financeira e check-in.</p></div><div class="page-actions"><button id="new-participant" class="btn btn-primary">Nova inscrição</button></div></div>
  <div class="toolbar"><label>Pesquisar<input id="participant-search" placeholder="Nome, telefone ou número de inscrição"></label><label class="compact">Estado<select id="participant-status"><option value="">Todos</option>${['SUBMETIDA','EM_VERIFICACAO','CONFIRMADA','PENDENTE_PAGAMENTO','CANCELADA','PRESENTE'].map(x=>UI.option(x,x.replaceAll('_',' '))).join('')}</select></label></div><div id="participants-table">${participantsTable(result.items)}</div>`;
  document.getElementById('new-participant').onclick=()=>participantModal();
  let timer;
  document.getElementById('participant-search').oninput=e=>{clearTimeout(timer);timer=setTimeout(()=>reloadParticipants(e.target.value,document.getElementById('participant-status').value),250)};
  document.getElementById('participant-status').onchange=e=>reloadParticipants(document.getElementById('participant-search').value,e.target.value);
  bindParticipantActions();
};

async function reloadParticipants(search,status){
  const r=await Api.request('participants.list',{id_conferencia:App.state.conferenceId,search,estado_inscricao:status,pageSize:500});
  App.state.participants=r.items;
  document.getElementById('participants-table').innerHTML=participantsTable(r.items);
  bindParticipantActions();
}

function participantsTable(rows){
  if(!rows.length)return UI.empty();
  return `<div class="table-wrap"><table><thead><tr><th>N.º inscrição</th><th>Participante</th><th>Distrito / Igreja</th><th>Categoria</th><th>Pagamento</th><th>Inscrição</th><th>Acções</th></tr></thead><tbody>${rows.map(r=>`<tr><td><strong>${UI.escape(r.numero_inscricao)}</strong></td><td><strong>${UI.escape(r.nome_completo)}</strong><br><small>${UI.escape(r.telefone||'')}</small></td><td>${UI.escape(r.distrito_nome||'—')}<br><small>${UI.escape(r.igreja_nome||'—')}</small></td><td>${UI.escape(r.categoria_nome||r.id_categoria||'—')}</td><td>${UI.status(r.estado_pagamento)}<br><small>${UI.money(r.total_pago)} / ${UI.money(r.total_devido)}</small></td><td>${UI.status(r.estado_inscricao)}</td><td><div class="actions"><button class="btn btn-secondary btn-sm edit-participant" data-id="${r.id_inscricao}">Editar</button>${r.estado_inscricao!=='PRESENTE'?`<button class="btn btn-primary btn-sm checkin-participant" data-id="${r.id_inscricao}">Check-in</button>`:''}</div></td></tr>`).join('')}</tbody></table></div>`;
}

function bindParticipantActions(){
  document.querySelectorAll('.edit-participant').forEach(b=>b.onclick=()=>participantModal(App.state.participants.find(x=>x.id_inscricao===b.dataset.id)));
  document.querySelectorAll('.checkin-participant').forEach(b=>b.onclick=async()=>{await Api.request('participants.checkin',{id_inscricao:b.dataset.id});UI.toast('Check-in registado.');App.render('participants');});
}

function participantModal(p={}){
  const l=App.state.lookups;
  const districts=[...(l.districts||[])].sort((a,b)=>String(a.nome||'').localeCompare(String(b.nome||''),'pt'));
  const churches=[...(l.churches||[])].sort((a,b)=>String(a.nome||'').localeCompare(String(b.nome||''),'pt'));
  const categories=[...(l.categories||[])].sort((a,b)=>String(a.nome||'').localeCompare(String(b.nome||''),'pt'));

  const selectedChurch=churches.find(x=>String(x.id_igreja)===String(p.id_igreja||''));
  const initialDistrict=p.id_distrito||selectedChurch?.id_distrito||(districts.length===1?districts[0].id_distrito:'');
  const initialChurch=p.id_igreja||(churches.filter(x=>String(x.id_distrito)===String(initialDistrict)).length===1?churches.find(x=>String(x.id_distrito)===String(initialDistrict))?.id_igreja:'');

  const nationalityOptions=[
    ['Moçambicana','Moçambicana (Moçambique)'],
    ['Sul-africana','Sul-africana (África do Sul)'],
    ['Suázi','Suázi (Eswatini)'],
    ['Zimbabueana','Zimbabueana (Zimbabwe)'],
    ['Zambiana','Zambiana (Zâmbia)'],
    ['Malawiana','Malawiana (Malawi)'],
    ['Tanzaniana','Tanzaniana (Tanzânia)'],
    ['OUTRA','Outra nacionalidade']
  ];
  const currentNationality=p.nacionalidade||'Moçambicana';
  const knownNationality=nationalityOptions.some(([value])=>value===currentNationality);
  const selectedNationality=knownNationality?currentNationality:'OUTRA';
  const otherNationality=knownNationality?'':currentNationality;

  const modalRoot=UI.modal({
    title:p.id_inscricao?'Editar participante':'Nova inscrição',
    wide:true,
    body:`<div class="form-grid"><label class="span-2">Nome completo<input name="nome_completo" value="${UI.escape(p.nome_completo||'')}" required></label><label>Telefone<input name="telefone" value="${UI.escape(p.telefone||'')}" required></label><label>Correio electrónico<input type="email" name="email" value="${UI.escape(p.email||'')}"></label><label>Data de nascimento<input type="date" name="data_nascimento" value="${String(p.data_nascimento||'').slice(0,10)}"></label><label>Nacionalidade<select name="nacionalidade" required>${nationalityOptions.map(([value,label])=>UI.option(value,label,selectedNationality)).join('')}</select></label><label id="other-nationality-field" class="${selectedNationality==='OUTRA'?'':'hidden'}">Indique a nacionalidade<input name="nacionalidade_outra" value="${UI.escape(otherNationality)}"></label><label>Tipo de documento<select name="tipo_documento">${['','BI','PASSAPORTE','DIRE','OUTRO'].map(x=>UI.option(x,x||'Seleccione',p.tipo_documento)).join('')}</select></label><label>Número do documento<input name="numero_documento" value="${UI.escape(p.numero_documento||'')}"></label><label>Distrito<select name="id_distrito"><option value="">Seleccione</option>${districts.map(x=>UI.option(x.id_distrito,x.nome,initialDistrict)).join('')}</select></label><label>Igreja local<select name="id_igreja"></select></label><label>Categoria<select name="id_categoria" required>${categories.map(x=>UI.option(x.id_categoria,x.nome,p.id_categoria)).join('')}</select></label><label>Estado da inscrição<select name="estado_inscricao">${['SUBMETIDA','EM_VERIFICACAO','CONFIRMADA','PENDENTE_PAGAMENTO','PAGA','CANCELADA','PRESENTE'].map(x=>UI.option(x,x.replaceAll('_',' '),p.estado_inscricao)).join('')}</select></label><label>Valor total devido<input type="number" min="0" step="0.01" name="total_devido" value="${p.total_devido??App.state.currentConference?.valor_inscricao??0}"></label><label>Cargo na igreja<input name="cargo_igreja" value="${UI.escape(p.cargo_igreja||'')}"></label><div class="span-2 check-row"><label><input type="checkbox" name="necessita_alojamento" ${p.necessita_alojamento?'checked':''}> Necessita de alojamento</label><label><input type="checkbox" name="necessita_transporte" ${p.necessita_transporte?'checked':''}> Necessita de transporte</label></div><label>Contacto de emergência<input name="contacto_emergencia_nome" value="${UI.escape(p.contacto_emergencia_nome||'')}"></label><label>Telefone de emergência<input name="contacto_emergencia_telefone" value="${UI.escape(p.contacto_emergencia_telefone||'')}"></label><label class="span-2">Necessidades alimentares<textarea name="necessidades_alimentares">${UI.escape(p.necessidades_alimentares||'')}</textarea></label><label class="span-2">Observações<textarea name="observacoes_inscricao">${UI.escape(p.observacoes||'')}</textarea></label></div>`,
    onSubmit:async data=>{
      if(data.nacionalidade==='OUTRA'){
        if(!String(data.nacionalidade_outra||'').trim())throw new Error('Indique a nacionalidade da participante.');
        data.nacionalidade=String(data.nacionalidade_outra).trim();
      }
      delete data.nacionalidade_outra;
      data.id_conferencia=App.state.conferenceId;
      if(p.id_inscricao){
        data.id_inscricao=p.id_inscricao;
        data.id_participante=p.id_participante;
        await Api.request('participants.update',data);
      }else{
        await Api.request('participants.create',data);
      }
      UI.toast('Inscrição guardada.');
      App.render('participants');
    }
  });

  const districtSelect=modalRoot.querySelector('[name="id_distrito"]');
  const churchSelect=modalRoot.querySelector('[name="id_igreja"]');
  const nationalitySelect=modalRoot.querySelector('[name="nacionalidade"]');
  const otherNationalityField=modalRoot.querySelector('#other-nationality-field');
  const otherNationalityInput=modalRoot.querySelector('[name="nacionalidade_outra"]');

  const renderChurches=(districtId,selectedId='')=>{
    const filtered=churches.filter(x=>String(x.id_distrito)===String(districtId||''));
    if(!districtId){
      churchSelect.innerHTML='<option value="">Seleccione primeiro o distrito</option>';
      churchSelect.disabled=true;
      return;
    }
    churchSelect.disabled=false;
    churchSelect.innerHTML='<option value="">Seleccione</option>'+filtered.map(x=>UI.option(x.id_igreja,x.nome,selectedId)).join('');
  };

  const toggleOtherNationality=()=>{
    const isOther=nationalitySelect.value==='OUTRA';
    otherNationalityField.classList.toggle('hidden',!isOther);
    otherNationalityInput.required=isOther;
    if(!isOther)otherNationalityInput.setCustomValidity('');
  };

  renderChurches(initialDistrict,initialChurch);
  districtSelect.addEventListener('change',()=>renderChurches(districtSelect.value,''));
  nationalitySelect.addEventListener('change',toggleOtherNationality);
  toggleOtherNationality();
}
