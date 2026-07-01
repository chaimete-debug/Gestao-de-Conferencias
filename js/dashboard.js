window.Views = window.Views || {};
Views.dashboard = async function(){
  const c=App.state.conferenceId;const d=await Api.request('dashboard.get',{id_conferencia:c});const k=d.kpis;
  App.container.innerHTML=`<div class="page-header"><div><span class="eyebrow">Resumo operacional</span><h1>Visão Geral</h1><p class="muted">Estado actual das inscrições, receitas e programa.</p></div></div>
  <div class="kpi-grid">
    ${kpi('Participantes',k.participantes)}${kpi('Inscrições confirmadas',k.confirmadas)}${kpi('Presentes',k.presentes)}${kpi('Sessões',k.sessoes)}
    ${kpi('Total devido',UI.money(k.totalDevido))}${kpi('Total arrecadado',UI.money(k.totalArrecadado))}${kpi('Saldo pendente',UI.money(k.totalPendente))}${kpi('Inscrições pendentes',k.pendentes)}
  </div>
  <div class="content-grid"><div class="card panel"><h3>Próximas sessões</h3><div class="list-stack">${d.upcomingSessions.length?d.upcomingSessions.map(s=>`<div class="list-item"><div><strong>${UI.escape(s.titulo)}</strong><small>${UI.date(s.data)} · ${UI.escape(s.hora_inicio)}–${UI.escape(s.hora_fim)} · ${UI.escape(s.local||'Local por definir')}</small></div>${UI.status(s.estado)}</div>`).join(''):UI.empty('Ainda não existem sessões programadas.')}</div></div>
  <div class="card panel"><h3>Participantes por distrito</h3><div class="list-stack">${districtBars(d.byDistrict)}</div></div></div>`;
};
function kpi(label,value){return `<div class="card kpi"><span>${UI.escape(label)}</span><strong>${UI.escape(value)}</strong></div>`;}
function districtBars(rows){if(!rows.length)return UI.empty('Sem dados por distrito.');const max=Math.max(...rows.map(x=>x.total),1);return rows.map(x=>`<div class="bar-row"><span>${UI.escape(x.nome)}</span><div class="bar"><i style="width:${Math.round(x.total/max*100)}%"></i></div><strong>${x.total}</strong></div>`).join('');}
