Views.attendance = async function () {
  const sessionsResult = await Api.request('sessions.list', { id_conferencia: App.state.conferenceId, pageSize: 500 });
  const sessions = (sessionsResult.items || []).sort((a, b) => `${a.data} ${a.hora_inicio}`.localeCompare(`${b.data} ${b.hora_inicio}`));
  App.state.attendanceSessions = sessions;

  App.container.innerHTML = `<div class="page-header">
    <div><span class="eyebrow">Controlo por sessão</span><h1>Presenças</h1><p class="muted">Registe entradas e saídas por leitura de QR ou número de inscrição.</p></div>
    <div class="page-actions"><button id="attendance-scan" class="btn btn-primary" ${sessions.length ? '' : 'disabled'}>Ler QR</button></div>
  </div>
  <div class="card panel attendance-control">
    <div class="form-grid attendance-grid">
      <label class="span-2">Sessão<select id="attendance-session"><option value="">Seleccione a sessão</option>${sessions.map(s => UI.option(s.id_sessao, `${UI.date(s.data)} · ${s.hora_inicio} — ${s.titulo}`)).join('')}</select></label>
      <label>Movimento<select id="attendance-movement"><option value="ENTRADA">Entrada</option><option value="SAIDA">Saída</option></select></label>
      <label>Código / número de inscrição<input id="attendance-code" autocomplete="off" placeholder="Digitalize ou introduza o código"></label>
    </div>
    <div class="attendance-actions"><button id="attendance-submit" class="btn btn-primary" ${sessions.length ? '' : 'disabled'}>Registar movimento</button></div>
    <div id="attendance-feedback"></div>
  </div>
  <div class="kpi-grid attendance-kpis">
    <div class="card kpi"><span>Registos da sessão</span><strong id="attendance-total">0</strong></div>
    <div class="card kpi"><span>Presentes agora</span><strong id="attendance-open">0</strong></div>
    <div class="card kpi"><span>Saídas registadas</span><strong id="attendance-closed">0</strong></div>
  </div>
  <div class="card panel"><div class="panel-header"><h3>Lista de presenças</h3><button id="attendance-refresh" class="btn btn-secondary btn-sm">Actualizar</button></div><div id="attendance-table">${UI.empty('Seleccione uma sessão para consultar as presenças.')}</div></div>`;

  const sessionSelect = document.getElementById('attendance-session');
  const codeInput = document.getElementById('attendance-code');
  const record = () => recordAttendance(codeInput.value).catch(error => UI.toast(error.message, 'error'));
  sessionSelect.onchange = () => loadAttendanceList().catch(error => UI.toast(error.message, 'error'));
  document.getElementById('attendance-submit').onclick = record;
  document.getElementById('attendance-refresh').onclick = () => loadAttendanceList().catch(error => UI.toast(error.message, 'error'));
  codeInput.addEventListener('keydown', event => {
    if (event.key === 'Enter') { event.preventDefault(); record(); }
  });
  document.getElementById('attendance-scan').onclick = () => {
    if (!sessionSelect.value) { UI.toast('Seleccione primeiro a sessão.', 'error'); return; }
    QRScanner.open({
      title: 'Ler QR para presença',
      onResult: async code => {
        codeInput.value = code;
        await recordAttendance(code);
      }
    });
  };
};

async function recordAttendance(code) {
  const sessionId = document.getElementById('attendance-session').value;
  const movement = document.getElementById('attendance-movement').value;
  const value = String(code || '').trim();
  if (!sessionId) throw new Error('Seleccione a sessão.');
  if (!value) throw new Error('Indique o código QR ou número de inscrição.');

  const result = await Api.request('attendance.record', {
    id_conferencia: App.state.conferenceId,
    id_sessao: sessionId,
    query: value,
    movimento: movement
  });
  const participant = result.registration || {};
  const feedback = document.getElementById('attendance-feedback');
  feedback.innerHTML = `<div class="attendance-success ${result.status === 'JA_REGISTADA' ? 'warning' : ''}">
    <strong>${UI.escape(participant.nome_completo)}</strong>
    <span>${result.status === 'JA_REGISTADA' ? 'A entrada desta participante já estava registada.' : `${movement === 'ENTRADA' ? 'Entrada' : 'Saída'} registada com sucesso.`}</span>
    <small>${UI.escape(participant.numero_inscricao || '')} · ${UI.escape(participant.igreja_nome || '')}</small>
  </div>`;
  document.getElementById('attendance-code').value = '';
  document.getElementById('attendance-code').focus();
  UI.toast(result.status === 'JA_REGISTADA' ? 'A presença já estava registada.' : 'Movimento registado.');
  await loadAttendanceList();
}

async function loadAttendanceList() {
  const sessionId = document.getElementById('attendance-session')?.value;
  const table = document.getElementById('attendance-table');
  if (!sessionId) {
    table.innerHTML = UI.empty('Seleccione uma sessão para consultar as presenças.');
    setAttendanceKpis({});
    return;
  }
  table.innerHTML = '<div class="empty">A carregar…</div>';
  const result = await Api.request('attendance.list', {
    id_conferencia: App.state.conferenceId,
    id_sessao: sessionId,
    pageSize: 500
  });
  setAttendanceKpis(result.summary || {});
  table.innerHTML = attendanceTable(result.items || []);
}

function setAttendanceKpis(summary) {
  document.getElementById('attendance-total').textContent = Number(summary.total_registos || 0);
  document.getElementById('attendance-open').textContent = Number(summary.presentes_agora || 0);
  document.getElementById('attendance-closed').textContent = Number(summary.saidas_registadas || 0);
}

function attendanceTable(rows) {
  if (!rows.length) return UI.empty('Ainda não existem presenças registadas nesta sessão.');
  return `<div class="table-wrap"><table><thead><tr><th>Participante</th><th>Inscrição</th><th>Distrito / Igreja</th><th>Entrada</th><th>Saída</th><th>Estado</th></tr></thead><tbody>${rows.map(row => `<tr>
    <td><strong>${UI.escape(row.nome_completo)}</strong><br><small>${UI.escape(row.telefone || '')}</small></td>
    <td>${UI.escape(row.numero_inscricao || '')}</td>
    <td>${UI.escape(row.distrito_nome || '—')}<br><small>${UI.escape(row.igreja_nome || '—')}</small></td>
    <td>${formatDateTimeAttendance(row.data_hora_entrada)}</td>
    <td>${row.data_hora_saida ? formatDateTimeAttendance(row.data_hora_saida) : '—'}</td>
    <td>${row.data_hora_saida ? '<span class="status neutral">SAIU</span>' : '<span class="status ok">PRESENTE</span>'}</td>
  </tr>`).join('')}</tbody></table></div>`;
}

function formatDateTimeAttendance(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return UI.escape(value);
  return new Intl.DateTimeFormat('pt-PT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(date);
}
