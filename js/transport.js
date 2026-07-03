Views.transport = async function () {
  const [routesResult, assignmentsResult] = await Promise.all([
    Api.request('transport.list', { id_conferencia: App.state.conferenceId, pageSize: 500 }),
    Api.request('transport.assignments', { id_conferencia: App.state.conferenceId, pageSize: 500 })
  ]);
  App.state.transportRoutes = routesResult.items || [];
  App.state.transportAssignments = assignmentsResult.items || [];
  const summary = routesResult.summary || {};
  const canManage = Auth.can('transporte.gerir');

  App.container.innerHTML = `<div class="page-header">
    <div><span class="eyebrow">Rotas e passageiros</span><h1>Transporte</h1><p class="muted">Organize viaturas, motoristas, horários, pontos de embarque e participantes.</p></div>
    <div class="page-actions">${canManage ? '<button id="new-transport" class="btn btn-primary">Nova rota</button>' : ''}</div>
  </div>
  <div class="kpi-grid logistics-kpis">
    <div class="card kpi"><span>Rotas</span><strong>${Number(summary.rotas || 0)}</strong></div>
    <div class="card kpi"><span>Capacidade total</span><strong>${Number(summary.capacidade_total || 0)}</strong></div>
    <div class="card kpi"><span>Vagas disponíveis</span><strong>${Number(summary.vagas || 0)}</strong></div>
    <div class="card kpi"><span>Por atribuir</span><strong>${Number(summary.por_atribuir || 0)}</strong></div>
  </div>
  ${canManage ? `<div class="card panel logistics-quick-card">
    <div class="panel-header"><h3>Atribuição rápida</h3><span class="muted">Associe a participante a uma rota com vagas.</span></div>
    <div class="form-grid logistics-assign-grid">
      <label>Rota<select id="transport-route"><option value="">Seleccione</option>${App.state.transportRoutes.filter(x => Number(x.vagas || 0) > 0 && x.estado !== 'CANCELADO').map(x => UI.option(x.id_transporte, `${UI.date(x.data)} · ${x.hora} — ${x.rota} (${x.vagas} vagas)`)).join('')}</select></label>
      <label>Participante<input id="transport-query" autocomplete="off" placeholder="QR, inscrição, nome ou telefone"></label>
      <label>Ponto de embarque<input id="transport-boarding-point" placeholder="Por defeito, o ponto de partida da rota"></label>
      <label>Observações<input id="transport-notes" placeholder="Opcional"></label>
    </div>
    <div class="page-actions logistics-actions"><button id="transport-scan" class="btn btn-secondary">Ler QR</button><button id="transport-assign" class="btn btn-primary">Atribuir transporte</button></div>
    <div id="transport-feedback"></div>
  </div>` : ''}
  <div class="card panel"><div class="panel-header"><h3>Rotas e viaturas</h3><span class="muted">${App.state.transportRoutes.length} rotas</span></div><div>${transportRoutesTable(App.state.transportRoutes, canManage)}</div></div>
  <div class="card panel"><div class="panel-header"><h3>Participantes atribuídas</h3><button id="transport-refresh" class="btn btn-secondary btn-sm">Actualizar</button></div><div>${transportAssignmentsTable(App.state.transportAssignments, canManage)}</div></div>`;

  if (canManage) {
    document.getElementById('new-transport').onclick = () => transportModal();
    document.querySelectorAll('.edit-transport').forEach(button => {
      button.onclick = () => transportModal(App.state.transportRoutes.find(item => item.id_transporte === button.dataset.id));
    });
    document.querySelectorAll('.transport-assignment-status').forEach(button => {
      button.onclick = async () => {
        await Api.request('transport.setAssignmentStatus', { id_atribuicao: button.dataset.id, estado: button.dataset.status });
        UI.toast('Estado do transporte actualizado.');
        App.render('transport');
      };
    });
    document.getElementById('transport-assign').onclick = () => assignTransport().catch(error => UI.toast(error.message, 'error'));
    document.getElementById('transport-query').addEventListener('keydown', event => {
      if (event.key === 'Enter') { event.preventDefault(); assignTransport().catch(error => UI.toast(error.message, 'error')); }
    });
    document.getElementById('transport-scan').onclick = () => QRScanner.open({
      title: 'Ler QR para transporte',
      onResult: async code => {
        document.getElementById('transport-query').value = code;
        await assignTransport();
      }
    });
  }
  document.getElementById('transport-refresh').onclick = () => App.render('transport');
};

function transportRoutesTable(rows, canManage) {
  if (!rows.length) return UI.empty('Ainda não existem rotas de transporte registadas.');
  return `<div class="table-wrap"><table><thead><tr><th>Rota</th><th>Data / Hora</th><th>Partida / Destino</th><th>Viatura</th><th>Motorista</th><th>Passageiros</th><th>Vagas</th><th>Estado</th>${canManage ? '<th>Acções</th>' : ''}</tr></thead><tbody>${rows.map(row => `<tr>
    <td><strong>${UI.escape(row.rota || '')}</strong></td>
    <td>${UI.date(row.data)}<br><small>${UI.escape(row.hora || '—')}</small></td>
    <td>${UI.escape(row.ponto_partida || '—')}<br><small>→ ${UI.escape(row.destino || '—')}</small></td>
    <td>${UI.escape(row.viatura || '—')}<br><small>${UI.escape(row.matricula || '')}</small></td>
    <td>${UI.escape(row.motorista || '—')}<br><small>${UI.escape(row.telefone || '')}</small></td>
    <td>${Number(row.passageiros || 0)} / ${Number(row.capacidade || 0)}</td><td><strong>${Number(row.vagas || 0)}</strong></td>
    <td>${UI.status(row.estado || 'PROGRAMADO')}</td>
    ${canManage ? `<td><button class="btn btn-secondary btn-sm edit-transport" data-id="${row.id_transporte}">Editar</button></td>` : ''}
  </tr>`).join('')}</tbody></table></div>`;
}

function transportAssignmentsTable(rows, canManage) {
  if (!rows.length) return UI.empty('Ainda não existem participantes atribuídas às rotas.');
  return `<div class="table-wrap"><table><thead><tr><th>Participante</th><th>Rota</th><th>Ponto de embarque</th><th>Data / Hora</th><th>Distrito / Igreja</th><th>Estado</th>${canManage ? '<th>Acções</th>' : ''}</tr></thead><tbody>${rows.map(row => `<tr>
    <td><strong>${UI.escape(row.nome_completo || '')}</strong><br><small>${UI.escape(row.numero_inscricao || '')}</small></td>
    <td>${UI.escape(row.rota || '')}<br><small>${UI.escape(row.ponto_partida || '')} → ${UI.escape(row.destino || '')}</small></td>
    <td>${UI.escape(row.ponto_embarque || '—')}</td>
    <td>${UI.date(row.data)}<br><small>${UI.escape(row.hora || '')}</small></td>
    <td>${UI.escape(row.distrito_nome || '—')}<br><small>${UI.escape(row.igreja_nome || '—')}</small></td>
    <td>${UI.status(row.estado || 'ATRIBUIDA')}</td>
    ${canManage ? `<td><div class="actions">${row.estado === 'ATRIBUIDA' ? `<button class="btn btn-secondary btn-sm transport-assignment-status" data-id="${row.id_atribuicao}" data-status="EMBARCADA">Embarcou</button>` : ''}${row.estado === 'EMBARCADA' ? `<button class="btn btn-secondary btn-sm transport-assignment-status" data-id="${row.id_atribuicao}" data-status="CONCLUIDA">Concluir</button>` : ''}${['ATRIBUIDA','EMBARCADA'].includes(row.estado) ? `<button class="btn btn-danger btn-sm transport-assignment-status" data-id="${row.id_atribuicao}" data-status="CANCELADA">Cancelar</button>` : ''}</div></td>` : ''}
  </tr>`).join('')}</tbody></table></div>`;
}

function transportModal(route = {}) {
  const conference = App.state.currentConference || {};
  UI.modal({
    title: route.id_transporte ? 'Editar rota de transporte' : 'Nova rota de transporte',
    body: `<div class="form-grid">
      <label class="span-2">Designação da rota<input name="rota" value="${UI.escape(route.rota || '')}" placeholder="Ex.: Matola — Local da conferência" required></label>
      <label>Ponto de partida<input name="ponto_partida" value="${UI.escape(route.ponto_partida || '')}" required></label>
      <label>Destino<input name="destino" value="${UI.escape(route.destino || conference.local || '')}" required></label>
      <label>Data<input name="data" type="date" value="${UI.escape(route.data || conference.data_inicio || '')}" required></label>
      <label>Hora<input name="hora" type="time" value="${UI.escape(route.hora || '')}" required></label>
      <label>Viatura<input name="viatura" value="${UI.escape(route.viatura || '')}" placeholder="Ex.: Autocarro 30 lugares"></label>
      <label>Matrícula<input name="matricula" value="${UI.escape(route.matricula || '')}"></label>
      <label>Motorista<input name="motorista" value="${UI.escape(route.motorista || '')}"></label>
      <label>Telefone do motorista<input name="telefone" value="${UI.escape(route.telefone || '')}"></label>
      <label>Capacidade<input name="capacidade" type="number" min="1" step="1" value="${Number(route.capacidade || 1)}" required></label>
      <label>Estado<select name="estado">${['PROGRAMADO','CONFIRMADO','EM_CURSO','CONCLUIDO','CANCELADO'].map(value => UI.option(value, value.replaceAll('_',' '), route.estado || 'PROGRAMADO')).join('')}</select></label>
      <label class="span-2">Observações<textarea name="observacoes">${UI.escape(route.observacoes || '')}</textarea></label>
    </div>`,
    onSubmit: async data => {
      data.id_conferencia = App.state.conferenceId;
      if (route.id_transporte) data.id_transporte = route.id_transporte;
      await Api.request('transport.save', data);
      UI.toast('Rota de transporte guardada.');
      App.render('transport');
    }
  });
}

async function assignTransport() {
  const routeId = document.getElementById('transport-route').value;
  const query = document.getElementById('transport-query').value;
  if (!routeId) throw new Error('Seleccione a rota de transporte.');
  const participant = await lookupSingleLogisticsParticipant(query);
  await Api.request('transport.assign', {
    id_conferencia: App.state.conferenceId,
    id_transporte: routeId,
    id_inscricao: participant.id_inscricao,
    ponto_embarque: document.getElementById('transport-boarding-point').value,
    observacoes: document.getElementById('transport-notes').value
  });
  document.getElementById('transport-feedback').innerHTML = `<div class="attendance-success"><strong>${UI.escape(participant.nome_completo)}</strong><span>Transporte atribuído com sucesso.</span><small>${UI.escape(participant.numero_inscricao || '')} · ${UI.escape(participant.igreja_nome || '')}</small></div>`;
  UI.toast('Transporte atribuído.');
  setTimeout(() => App.render('transport'), 700);
}
