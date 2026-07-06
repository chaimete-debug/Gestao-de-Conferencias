window.Views = window.Views || {};

Views.reports = async function () {
  const conferenceId = App.state.conferenceId;
  if (!conferenceId) {
    App.container.innerHTML = '<div class="card panel"><h3>Seleccione uma conferência</h3><p class="muted">Os relatórios são gerados para a conferência seleccionada.</p></div>';
    return;
  }

  const [catalog, options] = await Promise.all([
    Api.request('reports.catalog', { id_conferencia: conferenceId }),
    Api.request('reports.options', { id_conferencia: conferenceId })
  ]);
  App.state.reportCatalog = catalog;
  App.state.reportOptions = options;
  App.state.currentReport = null;

  if (!catalog.length) {
    App.container.innerHTML = '<div class="card panel"><h3>Sem relatórios disponíveis</h3><p class="muted">O seu perfil não possui acesso a nenhum relatório.</p></div>';
    return;
  }

  const groupedOptions = reportCatalogOptions_(catalog);
  const lookups = App.state.lookups || {};
  const districts = lookups.districts || [];
  const churches = lookups.churches || [];
  const categories = lookups.categories || [];
  const chargeTypes = lookups.chargeTypes || [];

  App.container.innerHTML = `
    <div class="page-header">
      <div>
        <span class="eyebrow">Análise e prestação de contas</span>
        <h1>Centro de Relatórios</h1>
        <p class="muted">Visualize, filtre, imprima e exporte os dados da conferência.</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-ghost" id="report-print" disabled>Imprimir / PDF</button>
        <button class="btn btn-ghost" id="report-excel" disabled>Exportar para Excel</button>
      </div>
    </div>

    <section class="card panel report-filter-panel">
      <div class="panel-header">
        <div><span class="eyebrow">Configuração</span><h3>Seleccione o relatório e os filtros</h3></div>
      </div>
      <form id="report-form" class="report-filter-form">
        <label class="report-type-field">Relatório
          <select name="tipo" id="report-type" required>${groupedOptions}</select>
        </label>
        <label data-report-filter="distrito">Distrito
          <select name="id_distrito" id="report-district"><option value="">Todos</option>${districts.map(x=>UI.option(x.id_distrito,x.nome)).join('')}</select>
        </label>
        <label data-report-filter="igreja">Igreja
          <select name="id_igreja" id="report-church"><option value="">Todas</option></select>
        </label>
        <label data-report-filter="categoria">Categoria
          <select name="id_categoria"><option value="">Todas</option>${categories.map(x=>UI.option(x.id_categoria,x.nome)).join('')}</select>
        </label>
        <label data-report-filter="estado_inscricao">Estado da inscrição
          <select name="estado_inscricao"><option value="">Todos</option>${['SUBMETIDA','EM_VERIFICACAO','CONFIRMADA','PENDENTE_PAGAMENTO','PAGA','CANCELADA','RECUSADA','PRESENTE'].map(x=>UI.option(x,x.replaceAll('_',' '))).join('')}</select>
        </label>
        <label data-report-filter="estado_pagamento">Estado do pagamento
          <select name="estado_pagamento"><option value="">Todos</option>${['PENDENTE','PARCIAL','PAGO','ISENTO'].map(x=>UI.option(x,x)).join('')}</select>
        </label>
        <label data-report-filter="estado">Estado
          <select name="estado"><option value="">Todos</option>${['SUBMETIDO','CONFIRMADO','REJEITADO','ANULADO','PROGRAMADA','CONFIRMADA','EM_CURSO','CONCLUIDA','CANCELADA','ATRIBUIDA','HOSPEDADA','SAIDA','EMBARCADA','EMITIDO','SUBSTITUIDO'].map(x=>UI.option(x,x.replaceAll('_',' '))).join('')}</select>
        </label>
        <label data-report-filter="estado_presenca">Presença
          <select name="estado_presenca"><option value="">Todas</option>${['PRESENTE','AUSENTE'].map(x=>UI.option(x,x)).join('')}</select>
        </label>
        <label data-report-filter="metodo">Método de pagamento
          <select name="metodo_pagamento"><option value="">Todos</option>${['NUMERARIO','M-PESA','E-MOLA','MKESH','TRANSFERENCIA_BANCARIA','DEPOSITO_BANCARIO','ISENCAO','OUTRO'].map(x=>UI.option(x,x.replaceAll('_',' '))).join('')}</select>
        </label>
        <label data-report-filter="tipo_cobranca">Tipo de cobrança
          <select name="id_tipo_cobranca"><option value="">Todos</option>${chargeTypes.map(x=>UI.option(x.id_tipo_cobranca,x.nome)).join('')}</select>
        </label>
        <label data-report-filter="sessao">Sessão
          <select name="id_sessao"><option value="">Todas</option>${(options.sessions||[]).map(x=>UI.option(x.id,`${x.data||''} — ${x.nome}`)).join('')}</select>
        </label>
        <label data-report-filter="alojamento">Alojamento
          <select name="id_alojamento"><option value="">Todos</option>${(options.accommodations||[]).map(x=>UI.option(x.id,x.nome)).join('')}</select>
        </label>
        <label data-report-filter="refeicao">Refeição
          <select name="id_refeicao"><option value="">Todas</option>${(options.meals||[]).map(x=>UI.option(x.id,`${x.data||''} — ${x.nome}`)).join('')}</select>
        </label>
        <label data-report-filter="transporte">Transporte
          <select name="id_transporte"><option value="">Todos</option>${(options.transports||[]).map(x=>UI.option(x.id,`${x.data||''} — ${x.nome}`)).join('')}</select>
        </label>
        <label data-report-filter="material">Material
          <select name="id_material"><option value="">Todos</option>${(options.materials||[]).map(x=>UI.option(x.id,x.nome)).join('')}</select>
        </label>
        <label data-report-filter="tipo_certificado">Tipo de certificado
          <select name="tipo_certificado"><option value="">Todos</option>${['PARTICIPACAO','MODERACAO','PRELECCAO','FACILITACAO','ORGANIZACAO','VOLUNTARIADO','RECONHECIMENTO'].map(x=>UI.option(x,x.replaceAll('_',' '))).join('')}</select>
        </label>
        <label data-report-filter="periodo">Data inicial
          <input type="date" name="data_de">
        </label>
        <label data-report-filter="periodo">Data final
          <input type="date" name="data_ate">
        </label>
        <label data-report-filter="pesquisa" class="report-search-field">Pesquisa
          <input name="search" placeholder="Nome, inscrição, telefone, referência…">
        </label>
        <div class="report-filter-actions">
          <button class="btn btn-ghost" type="reset" id="report-reset">Limpar</button>
          <button class="btn btn-primary" type="submit">Gerar relatório</button>
        </div>
      </form>
      <p id="report-description" class="muted report-description"></p>
    </section>

    <section id="report-output" class="report-output">
      <div class="card panel report-welcome">
        <h3>Relatório pronto para configurar</h3>
        <p class="muted">Seleccione o relatório, aplique os filtros necessários e clique em “Gerar relatório”.</p>
      </div>
    </section>`;

  const form = document.getElementById('report-form');
  const typeSelect = document.getElementById('report-type');
  const districtSelect = document.getElementById('report-district');
  const churchSelect = document.getElementById('report-church');
  const printButton = document.getElementById('report-print');
  const excelButton = document.getElementById('report-excel');

  const renderChurches = (districtId, selected='') => {
    const filtered = districtId ? churches.filter(x=>String(x.id_distrito)===String(districtId)) : churches;
    churchSelect.innerHTML = '<option value="">Todas</option>' + filtered.map(x=>UI.option(x.id_igreja,x.nome,selected)).join('');
  };
  renderChurches('');
  districtSelect.onchange = () => renderChurches(districtSelect.value,'');

  const updateFilterVisibility = () => {
    const selected = catalog.find(x=>x.id===typeSelect.value) || catalog[0];
    const activeFilters = new Set(selected.filtros || []);
    document.querySelectorAll('[data-report-filter]').forEach(el=>{
      el.classList.toggle('hidden',!activeFilters.has(el.dataset.reportFilter));
    });
    document.getElementById('report-description').textContent = selected.descricao || '';
  };
  typeSelect.onchange = updateFilterVisibility;
  updateFilterVisibility();

  form.addEventListener('reset',()=>setTimeout(()=>{
    renderChurches('');
    updateFilterVisibility();
    App.state.currentReport=null;
    printButton.disabled=true;
    excelButton.disabled=true;
    document.getElementById('report-output').innerHTML='<div class="card panel report-welcome"><h3>Filtros limpos</h3><p class="muted">Configure novamente o relatório e clique em “Gerar relatório”.</p></div>';
  },0));

  form.addEventListener('submit',async event=>{
    event.preventDefault();
    const button=event.submitter;
    button.disabled=true;
    const output=document.getElementById('report-output');
    output.innerHTML='<div class="card panel"><div class="report-loading"><span class="report-spinner"></span><div><strong>A gerar relatório…</strong><p class="muted">A consolidar os dados da conferência.</p></div></div></div>';
    try{
      const payload=Object.fromEntries(new FormData(form).entries());
      payload.id_conferencia=App.state.conferenceId;
      Object.keys(payload).forEach(key=>{if(payload[key]==='')delete payload[key];});
      const report=await Api.request('reports.generate',payload);
      App.state.currentReport=report;
      output.innerHTML=reportRender_(report);
      printButton.disabled=false;
      excelButton.disabled=false;
      reportBindLinks_();
      UI.toast('Relatório gerado com sucesso.');
    }catch(error){
      output.innerHTML=`<div class="card panel"><h3>Não foi possível gerar o relatório</h3><p class="muted">${UI.escape(error.message)}</p></div>`;
      UI.toast(error.message,'error');
    }finally{button.disabled=false;}
  });

  printButton.onclick=()=>reportPrint_(App.state.currentReport);
  excelButton.onclick=()=>reportExportExcel_(App.state.currentReport);

  form.requestSubmit();
};

function reportCatalogOptions_(catalog){
  const groups={};
  catalog.forEach(item=>{groups[item.grupo]=groups[item.grupo]||[];groups[item.grupo].push(item);});
  return Object.keys(groups).map(group=>`<optgroup label="${UI.escape(group)}">${groups[group].map(item=>UI.option(item.id,item.nome)).join('')}</optgroup>`).join('');
}

function reportRender_(report){
  const rows=report.rows||[];
  const columns=report.columns||[];
  const displayed=rows.slice(0,500);
  return `
    <section class="card panel report-result-header">
      <div class="report-title-block">
        <span class="eyebrow">${UI.escape(report.conferencia?.codigo||'Relatório')}</span>
        <h2>${UI.escape(report.titulo||'Relatório')}</h2>
        <p class="muted">${UI.escape(report.conferencia?.nome||'')}</p>
      </div>
      <div class="report-meta">
        <span><strong>Gerado por:</strong> ${UI.escape(report.gerado_por||'')}</span>
        <span><strong>Data:</strong> ${UI.escape(reportDateTime_(report.gerado_em))}</span>
        <span><strong>Registos:</strong> ${UI.escape(report.total_linhas??rows.length)}</span>
      </div>
    </section>
    ${report.truncado?`<div class="report-warning">O relatório possui ${UI.escape(report.total_linhas)} linhas. A exportação foi limitada às primeiras ${UI.escape(report.limite)} linhas. Aplique filtros para reduzir o volume.</div>`:''}
    ${reportSummaryCards_(report.summary||[])}
    ${reportChart_(report.chart||[])}
    <section class="card panel report-table-card">
      <div class="panel-header"><div><span class="eyebrow">Detalhe</span><h3>Dados do relatório</h3></div><span class="muted">${displayed.length<rows.length?`A mostrar ${displayed.length} de ${rows.length}`:`${rows.length} registos`}</span></div>
      ${rows.length?`<div class="table-wrap report-table-wrap"><table class="report-table"><thead><tr>${columns.map(c=>`<th>${UI.escape(c.label)}</th>`).join('')}</tr></thead><tbody>${displayed.map(row=>`<tr>${columns.map(column=>`<td>${reportCell_(row,column)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`:UI.empty('Nenhum registo corresponde aos filtros aplicados.')}
    </section>`;
}

function reportSummaryCards_(summary){
  if(!summary.length)return'';
  return `<div class="report-summary-grid">${summary.map(item=>`<div class="card report-summary-card"><span>${UI.escape(item.label)}</span><strong>${reportSummaryValue_(item)}</strong></div>`).join('')}</div>`;
}

function reportSummaryValue_(item){
  if(item.type==='money')return UI.money(item.value);
  if(item.type==='number')return new Intl.NumberFormat('pt-PT').format(Number(item.value||0));
  return UI.escape(item.value??'—');
}

function reportChart_(chart){
  if(!chart.length)return'';
  const max=Math.max(...chart.map(x=>Number(x.value||0)),1);
  return `<section class="card panel report-chart-card"><div class="panel-header"><div><span class="eyebrow">Distribuição</span><h3>Resumo gráfico</h3></div></div><div class="report-bars">${chart.map(item=>`<div class="report-bar-row"><span title="${UI.escape(item.label)}">${UI.escape(item.label)}</span><div class="report-bar-track"><i style="width:${Math.max(2,Math.round(Number(item.value||0)/max*100))}%"></i></div><strong>${reportChartValue_(item.value)}</strong></div>`).join('')}</div></section>`;
}

function reportChartValue_(value){
  const number=Number(value||0);
  return Number.isInteger(number)?new Intl.NumberFormat('pt-PT').format(number):new Intl.NumberFormat('pt-PT',{maximumFractionDigits:2}).format(number);
}

function reportCell_(row,column){
  const value=row[column.key];
  if(column.type==='money')return `<span class="report-number">${UI.money(value)}</span>`;
  if(column.type==='number')return `<span class="report-number">${new Intl.NumberFormat('pt-PT').format(Number(value||0))}</span>`;
  if(column.type==='date')return UI.escape(UI.date(value));
  if(column.type==='datetime')return UI.escape(reportDateTime_(value));
  if(column.type==='status')return UI.status(value);
  if(column.type==='boolean')return value?'<span class="status ok">SIM</span>':'<span class="status neutral">NÃO</span>';
  if(column.type==='url')return value?`<a class="report-file-link" href="${UI.escape(value)}" target="_blank" rel="noopener">Abrir</a>`:'—';
  if(column.type==='mixed')return row.tipo_valor==='money'?UI.money(value):UI.escape(value??'—');
  return UI.escape(value??'—');
}

function reportDateTime_(value){
  if(!value)return'—';
  const date=new Date(value);
  if(Number.isNaN(date.getTime()))return String(value);
  return new Intl.DateTimeFormat('pt-PT',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(date);
}

function reportBindLinks_(){
  document.querySelectorAll('.report-file-link').forEach(link=>link.addEventListener('click',event=>event.stopPropagation()));
}

function reportExportExcel_(report){
  if(!report)return;
  const columns=report.columns||[];
  const rows=report.rows||[];
  const header=`<table><tr><th colspan="${Math.max(1,columns.length)}" style="font-size:18px;background:#4b164c;color:#fff">${reportEscapeExport_(report.titulo)}</th></tr><tr><td colspan="${Math.max(1,columns.length)}">${reportEscapeExport_(report.conferencia?.nome||'')}</td></tr><tr><td colspan="${Math.max(1,columns.length)}">Gerado por: ${reportEscapeExport_(report.gerado_por||'')} | ${reportEscapeExport_(reportDateTime_(report.gerado_em))}</td></tr></table>`;
  const table=`<table border="1"><thead><tr>${columns.map(c=>`<th style="background:#eaddec">${reportEscapeExport_(c.label)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${columns.map(c=>`<td>${reportEscapeExport_(reportExportValue_(row,c))}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  const html=`<!doctype html><html><head><meta charset="utf-8"></head><body>${header}<br>${table}</body></html>`;
  const blob=new Blob(['\ufeff',html],{type:'application/vnd.ms-excel;charset=utf-8'});
  reportDownload_(blob,reportFilename_(report,'xls'));
}

function reportPrint_(report){
  if(!report)return;
  const columns=report.columns||[];
  const rows=report.rows||[];
  const summary=(report.summary||[]).map(item=>`<div><span>${reportEscapeExport_(item.label)}</span><strong>${reportEscapeExport_(reportSummaryValue_(item))}</strong></div>`).join('');
  const table=rows.length?`<table><thead><tr>${columns.map(c=>`<th>${reportEscapeExport_(c.label)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${columns.map(c=>`<td>${reportEscapeExport_(reportExportValue_(row,c))}</td>`).join('')}</tr>`).join('')}</tbody></table>`:'<p>Nenhum registo encontrado.</p>';
  const win=window.open('','_blank');
  if(!win){UI.toast('O navegador bloqueou a janela de impressão. Permita janelas pop-up.','error');return;}
  win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${reportEscapeExport_(report.titulo)}</title><style>@page{size:landscape;margin:12mm}body{font-family:Arial,sans-serif;color:#221126;font-size:10px}h1{margin:0;color:#4b164c}h2{font-size:14px;margin:4px 0}.meta{margin:10px 0 14px}.summary{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:12px 0}.summary div{border:1px solid #ddd;padding:8px;border-radius:6px}.summary span{display:block;color:#666}.summary strong{font-size:14px}table{width:100%;border-collapse:collapse;font-size:8px}th{background:#4b164c;color:#fff;text-align:left}th,td{border:1px solid #d9d0db;padding:4px;vertical-align:top}tr:nth-child(even){background:#f7f3f8}.footer{margin-top:12px;color:#666}</style></head><body><h1>${reportEscapeExport_(report.titulo)}</h1><h2>${reportEscapeExport_(report.conferencia?.nome||'')}</h2><div class="meta">${reportEscapeExport_(report.conferencia?.local||'')} | ${reportEscapeExport_(reportDateTime_(report.gerado_em))} | Gerado por: ${reportEscapeExport_(report.gerado_por||'')}</div><div class="summary">${summary}</div>${table}<div class="footer">Sistema de Gestão da Conferência de Mulheres Nazarenas de Moçambique</div><script>window.onload=()=>{window.print();}</script></body></html>`);
  win.document.close();
}

function reportExportValue_(row,column){
  const value=row[column.key];
  if(column.type==='money')return Number(value||0).toFixed(2);
  if(column.type==='number')return Number(value||0);
  if(column.type==='date')return UI.date(value);
  if(column.type==='datetime')return reportDateTime_(value);
  if(column.type==='boolean')return value?'Sim':'Não';
  if(column.type==='mixed')return row.tipo_valor==='money'?Number(value||0).toFixed(2):value;
  return value??'';
}

function reportEscapeExport_(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}
function reportFilename_(report,extension){const base=String(report.titulo||'relatorio').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9]+/g,'_').replace(/^_|_$/g,'').toLowerCase();return `${base}_${new Date().toISOString().slice(0,10)}.${extension}`;}
function reportDownload_(blob,filename){const link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download=filename;document.body.appendChild(link);link.click();setTimeout(()=>{URL.revokeObjectURL(link.href);link.remove();},1000);}
