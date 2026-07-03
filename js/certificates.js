Views.certificates = async function () {
  const result = await Api.request('certificates.list', { id_conferencia: App.state.conferenceId, pageSize: 500 });
  App.state.certificates = result.items || [];
  const canManage = Auth.can('certificados.gerir');

  App.container.innerHTML = `<div class="page-header">
    <div><span class="eyebrow">Documentos de encerramento</span><h1>Certificados</h1><p class="muted">Emita certificados individuais ou em lote e guarde-os automaticamente no Google Drive.</p></div>
    <div class="page-actions">${canManage ? '<button id="certificate-batch" class="btn btn-secondary">Emitir em lote</button>' : ''}</div>
  </div>
  ${canManage ? `<div class="card panel logistics-quick-card">
    <div class="panel-header"><h3>Emitir certificado individual</h3><span class="muted">Por defeito, exige check-in na conferência.</span></div>
    <div class="form-grid certificate-generate-grid">
      <label>Participante<input id="certificate-query" autocomplete="off" placeholder="QR, inscrição, nome ou telefone"></label>
      <label>Tipo<select id="certificate-type">${certificateTypeOptions('PARTICIPACAO')}</select></label>
      <label class="check-inline span-2"><input id="certificate-require-attendance" type="checkbox" checked> Exigir check-in na conferência</label>
    </div>
    <div class="page-actions logistics-actions"><button id="certificate-scan" class="btn btn-secondary">Ler QR</button><button id="certificate-generate" class="btn btn-primary">Gerar certificado</button></div>
    <div id="certificate-feedback"></div>
  </div>` : ''}
  <div class="card panel"><div class="panel-header"><h3>Certificados emitidos</h3><button id="certificates-refresh" class="btn btn-secondary btn-sm">Actualizar</button></div><div>${certificatesTable(App.state.certificates)}</div></div>`;

  if (canManage) {
    document.getElementById('certificate-generate').onclick = () => generateCertificate().catch(error => UI.toast(error.message, 'error'));
    document.getElementById('certificate-query').addEventListener('keydown', event => {
      if (event.key === 'Enter') { event.preventDefault(); generateCertificate().catch(error => UI.toast(error.message, 'error')); }
    });
    document.getElementById('certificate-scan').onclick = () => QRScanner.open({
      title: 'Ler QR para certificado',
      onResult: async code => {
        document.getElementById('certificate-query').value = code;
        await generateCertificate();
      }
    });
    document.getElementById('certificate-batch').onclick = () => certificateBatchModal();
  }
  document.getElementById('certificates-refresh').onclick = () => App.render('certificates');
};

function certificateTypeOptions(selected) {
  const types = [
    ['PARTICIPACAO','Participação'],['MODERACAO','Moderação'],['ORATORIA','Prelecção / Oradora'],
    ['FACILITACAO','Facilitação'],['ORGANIZACAO','Organização'],['VOLUNTARIADO','Voluntariado'],['RECONHECIMENTO','Reconhecimento']
  ];
  return types.map(item => UI.option(item[0], item[1], selected)).join('');
}

function certificatesTable(rows) {
  if (!rows.length) return UI.empty('Ainda não foram emitidos certificados para esta conferência.');
  return `<div class="table-wrap"><table><thead><tr><th>Participante</th><th>Tipo</th><th>Código</th><th>Data de emissão</th><th>Distrito / Igreja</th><th>Estado</th><th>Ficheiro</th></tr></thead><tbody>${rows.map(row => `<tr>
    <td><strong>${UI.escape(row.nome_completo || '')}</strong><br><small>${UI.escape(row.numero_inscricao || '')}</small></td>
    <td>${UI.escape((row.tipo || '').replaceAll('_',' '))}</td>
    <td><code>${UI.escape(row.codigo || '')}</code></td>
    <td>${formatDateTimeAttendance(row.data_emissao)}</td>
    <td>${UI.escape(row.distrito_nome || '—')}<br><small>${UI.escape(row.igreja_nome || '—')}</small></td>
    <td>${UI.status(row.estado || 'EMITIDO')}</td>
    <td>${row.ficheiro_url ? `<a class="btn btn-secondary btn-sm" href="${UI.escape(row.ficheiro_url)}" target="_blank" rel="noopener">Abrir PDF</a>` : '—'}</td>
  </tr>`).join('')}</tbody></table></div>`;
}

async function generateCertificate() {
  const query = document.getElementById('certificate-query').value;
  const participant = await lookupSingleLogisticsParticipant(query);
  const button = document.getElementById('certificate-generate');
  button.disabled = true;
  button.textContent = 'A gerar…';
  try {
    const result = await Api.request('certificates.generate', {
      id_conferencia: App.state.conferenceId,
      id_inscricao: participant.id_inscricao,
      tipo: document.getElementById('certificate-type').value,
      exigir_presenca: document.getElementById('certificate-require-attendance').checked
    });
    const existingText = result.alreadyExists ? 'O certificado já existia.' : 'Certificado gerado com sucesso.';
    document.getElementById('certificate-feedback').innerHTML = `<div class="attendance-success"><strong>${UI.escape(participant.nome_completo)}</strong><span>${existingText}</span><small>${UI.escape(result.codigo || '')}</small>${result.ficheiro_url ? `<a class="btn btn-secondary btn-sm certificate-open-link" href="${UI.escape(result.ficheiro_url)}" target="_blank" rel="noopener">Abrir certificado</a>` : ''}</div>`;
    UI.toast(existingText);
    document.getElementById('certificate-query').value = '';
    setTimeout(() => App.render('certificates'), 1000);
  } finally {
    button.disabled = false;
    button.textContent = 'Gerar certificado';
  }
}

function certificateBatchModal() {
  UI.modal({
    title: 'Emitir certificados em lote',
    submitText: 'Gerar certificados',
    body: `<div class="form-grid">
      <label>Tipo<select name="tipo">${certificateTypeOptions('PARTICIPACAO')}</select></label>
      <label>Quantidade máxima<select name="limite">${[5,10,15,20,25].map(value => UI.option(String(value), `${value} certificados`, '10')).join('')}</select></label>
      <label class="check-inline span-2"><input name="exigir_presenca" type="checkbox" checked> Gerar somente para participantes com check-in</label>
      <label class="check-inline span-2"><input name="regenerar" type="checkbox"> Substituir certificados já emitidos do mesmo tipo</label>
      <label class="span-2">Título personalizado<input name="titulo" placeholder="Deixe vazio para usar o título padrão"></label>
      <label class="span-2">Texto personalizado<textarea name="texto" placeholder="Deixe vazio para usar o texto padrão"></textarea></label>
      <div class="span-2 certificate-note">Por segurança contra o limite de execução do Apps Script, cada operação gera no máximo 25 certificados. Repita a operação para os restantes.</div>
    </div>`,
    onSubmit: async data => {
      data.id_conferencia = App.state.conferenceId;
      const result = await Api.request('certificates.generateBatch', data);
      const errors = result.erros?.length || 0;
      UI.toast(`${result.emitidos} certificados emitidos${errors ? `; ${errors} erros` : ''}.`, errors ? 'error' : 'success');
      App.render('certificates');
    }
  });
}
