Views.credentials = async function () {
  App.container.innerHTML = `<div class="page-header">
    <div><span class="eyebrow">QR, credenciais e recepção</span><h1>Credenciação</h1><p class="muted">Localize a participante, imprima a credencial, efectue o check-in e registe a entrega.</p></div>
    <div class="page-actions"><button id="credential-scan" class="btn btn-primary">Ler QR</button></div>
  </div>
  <div class="card panel">
    <div class="credential-search-row">
      <label>Pesquisar participante<input id="credential-query" autocomplete="off" placeholder="Nome, telefone, documento ou número de inscrição"></label>
      <button id="credential-search" class="btn btn-secondary">Pesquisar</button>
    </div>
    <div id="credential-results" class="credential-results">${UI.empty('Pesquise uma participante ou leia o código QR.')}</div>
  </div>`;

  const input = document.getElementById('credential-query');
  const search = () => credentialLookup(input.value).catch(error => UI.toast(error.message, 'error'));
  document.getElementById('credential-search').onclick = search;
  input.addEventListener('keydown', event => {
    if (event.key === 'Enter') { event.preventDefault(); search(); }
  });
  document.getElementById('credential-scan').onclick = () => QRScanner.open({
    title: 'Ler QR da participante',
    onResult: async code => {
      input.value = code;
      await credentialLookup(code);
    }
  });
};

async function credentialLookup(query) {
  const container = document.getElementById('credential-results');
  const value = String(query || '').trim();
  if (!value) { UI.toast('Indique um critério de pesquisa.', 'error'); return; }
  container.innerHTML = '<div class="empty">A pesquisar…</div>';
  const result = await Api.request('registrations.lookup', {
    id_conferencia: App.state.conferenceId,
    query: value
  });
  container.innerHTML = result.items?.length
    ? result.items.map(credentialResultCard).join('')
    : UI.empty('Nenhuma participante encontrada.');
  bindCredentialActions(result.items || []);
}

function credentialResultCard(participant) {
  const checkedIn = Boolean(participant.data_checkin) || participant.estado_inscricao === 'PRESENTE';
  const delivered = participant.credencial_entregue === true || String(participant.credencial_entregue).toUpperCase() === 'TRUE';
  return `<article class="credential-result-card">
    <div class="participant-avatar">${UI.escape(initialsCredential(participant.nome_completo))}</div>
    <div class="credential-result-main">
      <div class="credential-result-title"><strong>${UI.escape(participant.nome_completo)}</strong>${UI.status(participant.estado_inscricao)}</div>
      <div class="credential-meta">
        <span><b>Inscrição:</b> ${UI.escape(participant.numero_inscricao)}</span>
        <span><b>Categoria:</b> ${UI.escape(participant.categoria_nome || participant.id_categoria || '—')}</span>
        <span><b>Distrito:</b> ${UI.escape(participant.distrito_nome || '—')}</span>
        <span><b>Igreja:</b> ${UI.escape(participant.igreja_nome || '—')}</span>
        <span><b>Pagamento:</b> ${UI.escape(String(participant.estado_pagamento || '—').replaceAll('_', ' '))}</span>
      </div>
    </div>
    <div class="credential-result-actions">
      <button class="btn btn-secondary btn-sm preview-credential" data-id="${participant.id_inscricao}">Ver credencial</button>
      ${checkedIn ? '<span class="status ok">CHECK-IN FEITO</span>' : `<button class="btn btn-primary btn-sm checkin-credential" data-id="${participant.id_inscricao}">Fazer check-in</button>`}
      <button class="btn ${delivered ? 'btn-ghost' : 'btn-secondary'} btn-sm deliver-credential" data-id="${participant.id_inscricao}" data-delivered="${delivered}">${delivered ? 'Credencial entregue' : 'Marcar como entregue'}</button>
    </div>
  </article>`;
}

function bindCredentialActions(items) {
  const byId = Object.fromEntries(items.map(item => [item.id_inscricao, item]));
  document.querySelectorAll('.preview-credential').forEach(button => {
    button.onclick = () => showCredential(byId[button.dataset.id]);
  });
  document.querySelectorAll('.checkin-credential').forEach(button => {
    button.onclick = async () => {
      const participant = byId[button.dataset.id];
      await Api.request('credentials.checkin', {
        id_conferencia: App.state.conferenceId,
        query: participant.codigo_qr || participant.numero_inscricao,
        credencial_entregue: participant.credencial_entregue
      });
      UI.toast('Check-in registado com sucesso.');
      credentialLookup(participant.numero_inscricao);
    };
  });
  document.querySelectorAll('.deliver-credential').forEach(button => {
    button.onclick = async () => {
      const participant = byId[button.dataset.id];
      const next = button.dataset.delivered !== 'true';
      await Api.request('credentials.setDelivered', {
        id_inscricao: participant.id_inscricao,
        credencial_entregue: next
      });
      UI.toast(next ? 'Entrega da credencial registada.' : 'Entrega da credencial revertida.');
      credentialLookup(participant.numero_inscricao);
    };
  });
}

function showCredential(participant) {
  const conference = App.state.currentConference || {};
  const qrCode = participant.codigo_qr || participant.numero_inscricao;
  const qrUrl = qrImageUrl(qrCode, 230);
  const root = UI.modal({
    title: 'Credencial da participante',
    submitText: 'Fechar',
    body: `<div class="credential-preview" id="credential-preview">
      <div class="credential-banner"><span>Igreja do Nazareno</span><strong>${UI.escape(conference.nome || 'Conferência de Mulheres Nazarenas')}</strong></div>
      <div class="credential-body">
        <div class="credential-details">
          <span class="eyebrow">Participante</span>
          <h2>${UI.escape(participant.nome_completo)}</h2>
          <p>${UI.escape(participant.categoria_nome || participant.id_categoria || '')}</p>
          <dl>
            <div><dt>Inscrição</dt><dd>${UI.escape(participant.numero_inscricao)}</dd></div>
            <div><dt>Distrito</dt><dd>${UI.escape(participant.distrito_nome || '—')}</dd></div>
            <div><dt>Igreja</dt><dd>${UI.escape(participant.igreja_nome || '—')}</dd></div>
          </dl>
        </div>
        <div class="credential-qr"><img src="${qrUrl}" alt="Código QR"><small>${UI.escape(qrCode)}</small></div>
      </div>
      <div class="credential-footer">${UI.escape(conference.local || '')}${conference.data_inicio ? ` · ${UI.date(conference.data_inicio)} a ${UI.date(conference.data_fim)}` : ''}</div>
    </div>
    <div class="credential-modal-actions"><button id="print-credential" type="button" class="btn btn-primary">Imprimir credencial</button></div>`,
    onSubmit: async () => {}
  });
  root.querySelector('#print-credential').onclick = () => printCredential(participant);
}

function printCredential(participant) {
  const conference = App.state.currentConference || {};
  const qrCode = participant.codigo_qr || participant.numero_inscricao;
  const popup = window.open('', '_blank', 'width=700,height=820');
  if (!popup) { UI.toast('O navegador bloqueou a janela de impressão.', 'error'); return; }
  popup.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Credencial - ${UI.escape(participant.nome_completo)}</title>
    <style>
      @page{size:A6 portrait;margin:8mm}*{box-sizing:border-box}body{margin:0;font-family:Arial,sans-serif;color:#241629}.card{width:100%;min-height:135mm;border:2px solid #4c1d5f;border-radius:16px;overflow:hidden;display:flex;flex-direction:column}.banner{padding:18px;background:linear-gradient(135deg,#4c1d5f,#c0266d);color:#fff;text-align:center}.banner span{display:block;font-size:11px;text-transform:uppercase;letter-spacing:.12em}.banner strong{display:block;font-size:18px;margin-top:6px}.body{padding:20px;text-align:center;flex:1}.body h1{font-size:24px;margin:8px 0}.category{font-weight:bold;color:#c0266d}.qr{width:190px;height:190px;margin:14px auto}.qr img{width:100%;height:100%}.number{font-family:monospace;font-weight:bold}.meta{font-size:12px;line-height:1.5;margin-top:12px}.footer{padding:12px;background:#f3eaf4;text-align:center;font-size:11px}@media print{button{display:none}}
    </style></head><body><div class="card"><div class="banner"><span>Igreja do Nazareno</span><strong>${UI.escape(conference.nome || 'Conferência de Mulheres Nazarenas')}</strong></div><div class="body"><div>PARTICIPANTE</div><h1>${UI.escape(participant.nome_completo)}</h1><div class="category">${UI.escape(participant.categoria_nome || participant.id_categoria || '')}</div><div class="qr"><img id="qr" src="${qrImageUrl(qrCode, 300)}" alt="QR"></div><div class="number">${UI.escape(participant.numero_inscricao)}</div><div class="meta">${UI.escape(participant.distrito_nome || '')}<br>${UI.escape(participant.igreja_nome || '')}</div></div><div class="footer">${UI.escape(conference.local || '')}${conference.data_inicio ? ` · ${UI.date(conference.data_inicio)} a ${UI.date(conference.data_fim)}` : ''}</div></div><script>document.getElementById('qr').addEventListener('load',()=>setTimeout(()=>window.print(),250));<\/script></body></html>`);
  popup.document.close();
}

function qrImageUrl(value, size=220) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=10&data=${encodeURIComponent(String(value || ''))}`;
}

function initialsCredential(name) {
  return String(name || '').trim().split(/\s+/).slice(0, 2).map(part => part[0] || '').join('').toUpperCase() || 'MN';
}
