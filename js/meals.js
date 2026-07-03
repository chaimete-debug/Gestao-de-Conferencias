Views.meals = async function () {
  const [mealsResult, deliveriesResult, dietaryResult] = await Promise.all([
    Api.request('meals.list', { id_conferencia: App.state.conferenceId, pageSize: 500 }),
    Api.request('meals.deliveries', { id_conferencia: App.state.conferenceId, pageSize: 300 }),
    Api.request('meals.dietary', { id_conferencia: App.state.conferenceId, pageSize: 500 })
  ]);
  App.state.meals = mealsResult.items || [];
  App.state.mealDeliveries = deliveriesResult.items || [];
  App.state.dietaryParticipants = dietaryResult.items || [];
  const summary = mealsResult.summary || {};
  const canManage = Auth.can('alimentacao.gerir');

  App.container.innerHTML = `<div class="page-header">
    <div><span class="eyebrow">Refeições e necessidades especiais</span><h1>Alimentação</h1><p class="muted">Planeie refeições, controle quantidades servidas e consulte restrições alimentares.</p></div>
    <div class="page-actions">${canManage ? '<button id="new-meal" class="btn btn-primary">Nova refeição</button>' : ''}</div>
  </div>
  <div class="kpi-grid logistics-kpis">
    <div class="card kpi"><span>Refeições</span><strong>${Number(summary.refeicoes || 0)}</strong></div>
    <div class="card kpi"><span>Quantidade prevista</span><strong>${Number(summary.quantidade_prevista || 0)}</strong></div>
    <div class="card kpi"><span>Servidas</span><strong>${Number(summary.servidas || 0)}</strong></div>
    <div class="card kpi"><span>Necessidades especiais</span><strong>${App.state.dietaryParticipants.length}</strong></div>
  </div>
  ${canManage ? `<div class="card panel logistics-quick-card">
    <div class="panel-header"><h3>Registo rápido de refeição</h3><span class="muted">Cada participante só pode ser registada uma vez por refeição.</span></div>
    <div class="form-grid logistics-assign-grid">
      <label>Refeição<select id="meal-select"><option value="">Seleccione</option>${App.state.meals.filter(x => x.estado !== 'CANCELADA').map(x => UI.option(x.id_refeicao, `${UI.date(x.data)} · ${x.hora_inicio || ''} — ${x.nome} (${x.servidas}/${x.quantidade_prevista || '∞'})`)).join('')}</select></label>
      <label>Participante<input id="meal-query" autocomplete="off" placeholder="QR, inscrição, nome ou telefone"></label>
      <label class="span-2">Observações<input id="meal-notes" placeholder="Opcional"></label>
    </div>
    <div class="page-actions logistics-actions"><button id="meal-scan" class="btn btn-secondary">Ler QR</button><button id="meal-serve" class="btn btn-primary">Registar refeição</button></div>
    <div id="meal-feedback"></div>
  </div>` : ''}
  <div class="card panel"><div class="panel-header"><h3>Plano de refeições</h3><span class="muted">${App.state.meals.length} registos</span></div><div>${mealsTable(App.state.meals, canManage)}</div></div>
  <div class="content-grid logistics-content-grid">
    <div class="card panel"><div class="panel-header"><h3>Últimas refeições servidas</h3><button id="meals-refresh" class="btn btn-secondary btn-sm">Actualizar</button></div><div>${mealDeliveriesTable(App.state.mealDeliveries)}</div></div>
    <div class="card panel"><div class="panel-header"><h3>Restrições alimentares</h3><span class="muted">${App.state.dietaryParticipants.length}</span></div><div>${dietaryTable(App.state.dietaryParticipants)}</div></div>
  </div>`;

  if (canManage) {
    document.getElementById('new-meal').onclick = () => mealModal();
    document.querySelectorAll('.edit-meal').forEach(button => {
      button.onclick = () => mealModal(App.state.meals.find(item => item.id_refeicao === button.dataset.id));
    });
    document.getElementById('meal-serve').onclick = () => serveMeal().catch(error => UI.toast(error.message, 'error'));
    document.getElementById('meal-query').addEventListener('keydown', event => {
      if (event.key === 'Enter') { event.preventDefault(); serveMeal().catch(error => UI.toast(error.message, 'error')); }
    });
    document.getElementById('meal-scan').onclick = () => QRScanner.open({
      title: 'Ler QR para refeição',
      onResult: async code => {
        document.getElementById('meal-query').value = code;
        await serveMeal();
      }
    });
  }
  document.getElementById('meals-refresh').onclick = () => App.render('meals');
};

function mealsTable(rows, canManage) {
  if (!rows.length) return UI.empty('Ainda não foram planeadas refeições para esta conferência.');
  return `<div class="table-wrap"><table><thead><tr><th>Refeição</th><th>Data / Horário</th><th>Local</th><th>Fornecedor / Responsável</th><th>Previstas</th><th>Servidas</th><th>Estado</th>${canManage ? '<th>Acções</th>' : ''}</tr></thead><tbody>${rows.map(row => `<tr>
    <td><strong>${UI.escape(row.nome || '')}</strong><br><small>${UI.escape((row.tipo || '').replaceAll('_',' '))}</small></td>
    <td>${UI.date(row.data)}<br><small>${UI.escape(row.hora_inicio || '—')} — ${UI.escape(row.hora_fim || '—')}</small></td>
    <td>${UI.escape(row.local || '—')}</td>
    <td>${UI.escape(row.fornecedor || '—')}<br><small>${UI.escape(row.responsavel || '')}</small></td>
    <td>${Number(row.quantidade_prevista || 0) || '—'}</td><td><strong>${Number(row.servidas || 0)}</strong></td>
    <td>${UI.status(row.estado || 'PLANEADA')}</td>
    ${canManage ? `<td><button class="btn btn-secondary btn-sm edit-meal" data-id="${row.id_refeicao}">Editar</button></td>` : ''}
  </tr>`).join('')}</tbody></table></div>`;
}

function mealDeliveriesTable(rows) {
  if (!rows.length) return UI.empty('Ainda não existem refeições servidas.');
  return `<div class="table-wrap"><table><thead><tr><th>Data</th><th>Participante</th><th>Refeição</th><th>Distrito / Igreja</th><th>Necessidade alimentar</th></tr></thead><tbody>${rows.map(row => `<tr>
    <td>${formatDateTimeAttendance(row.data_hora)}</td>
    <td><strong>${UI.escape(row.nome_completo || '')}</strong><br><small>${UI.escape(row.numero_inscricao || '')}</small></td>
    <td>${UI.escape(row.refeicao_nome || '')}<br><small>${UI.escape((row.refeicao_tipo || '').replaceAll('_',' '))}</small></td>
    <td>${UI.escape(row.distrito_nome || '—')}<br><small>${UI.escape(row.igreja_nome || '—')}</small></td>
    <td>${row.necessidades_alimentares ? `<span class="dietary-alert">${UI.escape(row.necessidades_alimentares)}</span>` : '—'}</td>
  </tr>`).join('')}</tbody></table></div>`;
}

function dietaryTable(rows) {
  if (!rows.length) return UI.empty('Não foram registadas necessidades alimentares especiais.');
  return `<div class="list-stack dietary-list">${rows.map(row => `<div class="list-item"><div><strong>${UI.escape(row.nome_completo || '')}</strong><small>${UI.escape(row.numero_inscricao || '')} · ${UI.escape(row.igreja_nome || '')}</small></div><span class="dietary-alert">${UI.escape(row.necessidades_alimentares || '')}</span></div>`).join('')}</div>`;
}

function mealModal(meal = {}) {
  const conference = App.state.currentConference || {};
  UI.modal({
    title: meal.id_refeicao ? 'Editar refeição' : 'Nova refeição',
    body: `<div class="form-grid">
      <label>Nome<input name="nome" value="${UI.escape(meal.nome || '')}" placeholder="Ex.: Almoço do primeiro dia" required></label>
      <label>Tipo<select name="tipo">${['PEQUENO_ALMOCO','LANCHE','ALMOCO','JANTAR','CEIA','OUTRO'].map(value => UI.option(value, value.replaceAll('_',' '), meal.tipo || 'ALMOCO')).join('')}</select></label>
      <label>Data<input name="data" type="date" value="${UI.escape(meal.data || conference.data_inicio || '')}" required></label>
      <label>Local<input name="local" value="${UI.escape(meal.local || '')}"></label>
      <label>Hora de início<input name="hora_inicio" type="time" value="${UI.escape(meal.hora_inicio || '')}"></label>
      <label>Hora de término<input name="hora_fim" type="time" value="${UI.escape(meal.hora_fim || '')}"></label>
      <label>Quantidade prevista<input name="quantidade_prevista" type="number" min="0" step="1" value="${Number(meal.quantidade_prevista || 0)}"></label>
      <label>Estado<select name="estado">${['PLANEADA','CONFIRMADA','EM_SERVICO','CONCLUIDA','CANCELADA'].map(value => UI.option(value, value.replaceAll('_',' '), meal.estado || 'PLANEADA')).join('')}</select></label>
      <label>Fornecedor<input name="fornecedor" value="${UI.escape(meal.fornecedor || '')}"></label>
      <label>Responsável<input name="responsavel" value="${UI.escape(meal.responsavel || '')}"></label>
      <label class="span-2">Observações<textarea name="observacoes">${UI.escape(meal.observacoes || '')}</textarea></label>
    </div>`,
    onSubmit: async data => {
      data.id_conferencia = App.state.conferenceId;
      if (meal.id_refeicao) data.id_refeicao = meal.id_refeicao;
      await Api.request('meals.save', data);
      UI.toast('Refeição guardada.');
      App.render('meals');
    }
  });
  const root = document.getElementById('modal-root');
  UI.bindRangeValidation(root, 'hora_inicio', 'hora_fim', { strict: true, message: 'A hora de término deve ser posterior à hora de início.' });
}

async function serveMeal() {
  const mealId = document.getElementById('meal-select').value;
  const query = document.getElementById('meal-query').value;
  if (!mealId) throw new Error('Seleccione a refeição.');
  const participant = await lookupSingleLogisticsParticipant(query);
  await Api.request('meals.serve', {
    id_conferencia: App.state.conferenceId,
    id_refeicao: mealId,
    id_inscricao: participant.id_inscricao,
    observacoes: document.getElementById('meal-notes').value
  });
  document.getElementById('meal-feedback').innerHTML = `<div class="attendance-success"><strong>${UI.escape(participant.nome_completo)}</strong><span>Refeição registada com sucesso.</span>${participant.necessidades_alimentares ? `<small>Atenção: ${UI.escape(participant.necessidades_alimentares)}</small>` : `<small>${UI.escape(participant.numero_inscricao || '')}</small>`}</div>`;
  UI.toast('Refeição registada.');
  document.getElementById('meal-query').value = '';
  setTimeout(() => App.render('meals'), 700);
}
