window.PublicEvaluation = {
  async start(token) {
    document.getElementById('login-view').classList.add('hidden');
    document.getElementById('app-shell').classList.add('hidden');
    const view=document.getElementById('public-evaluation-view');
    const content=document.getElementById('public-evaluation-content');
    view.classList.remove('hidden');
    try{
      const data=await Api.request('evaluations.publicForm',{token});
      document.title=`${data.form.titulo} — ${data.conference.nome||'Conferência'}`;
      content.innerHTML=this.renderForm(data,token);
      const form=content.querySelector('form');
      form.addEventListener('submit',async event=>{
        event.preventDefault();
        const button=event.submitter;button.disabled=true;
        try{
          const raw=Object.fromEntries(new FormData(form).entries());
          const answers={};
          data.questions.forEach(q=>answers[q.id_pergunta]=raw[`q_${q.id_pergunta}`]??'');
          const result=await Api.request('evaluations.submit',{token,numero_inscricao:raw.numero_inscricao||'',respondente_nome:raw.respondente_nome||'',answers});
          content.innerHTML=`<div class="public-evaluation-success"><div class="success-mark">✓</div><h1>Avaliação submetida</h1><p>${UI.escape(result.mensagem_final||'Obrigado pela sua participação.')}</p></div>`;
          window.scrollTo({top:0,behavior:'smooth'});
        }catch(error){UI.toast(error.message,'error');button.disabled=false;}
      });
    }catch(error){content.innerHTML=`<div class="public-evaluation-success"><h1>Formulário indisponível</h1><p>${UI.escape(error.message)}</p></div>`;}
  },
  renderForm(data,token){
    const identity=[];
    if(data.form.exigir_inscricao)identity.push(`<label>Número de inscrição<input name="numero_inscricao" required placeholder="Ex.: CMNM-2026-0001"></label>`);
    if(!data.form.anonima)identity.push(`<label>Nome da participante<input name="respondente_nome" ${data.form.exigir_inscricao?'':'required'}></label>`);
    return `<header class="public-evaluation-header"><span class="eyebrow">${UI.escape(data.conference.nome||'Conferência')}</span><h1>${UI.escape(data.form.titulo)}</h1><p>${UI.escape(data.form.descricao||'Partilhe a sua opinião sobre a conferência.')}</p>${data.form.anonima?'<span class="evaluation-anonymous-badge">Respostas anónimas</span>':''}</header><form class="public-evaluation-form">${identity.length?`<section class="evaluation-identity">${identity.join('')}</section>`:''}<div class="evaluation-question-list">${data.questions.map((q,i)=>this.question(q,i)).join('')}</div><button class="btn btn-primary public-submit" type="submit">Submeter avaliação</button><p class="public-privacy-note">As respostas destinam-se exclusivamente à avaliação e melhoria das actividades da conferência.</p></form>`;
  },
  question(q,index){
    const name=`q_${q.id_pergunta}`,req=q.obrigatoria?'required':'';
    let input='';
    if(q.tipo==='ESCALA_1_5')input=`<div class="rating-scale">${[1,2,3,4,5].map(v=>`<label><input type="radio" name="${name}" value="${v}" ${req}><span>${v}</span><small>${v===1?'Muito fraco':v===5?'Excelente':''}</small></label>`).join('')}</div>`;
    else if(q.tipo==='SIM_NAO')input=`<div class="choice-grid"><label><input type="radio" name="${name}" value="Sim" ${req}> Sim</label><label><input type="radio" name="${name}" value="Não" ${req}> Não</label></div>`;
    else if(q.tipo==='ESCOLHA_UNICA')input=`<div class="choice-grid">${(q.opcoes||[]).map(v=>`<label><input type="radio" name="${name}" value="${UI.escape(v)}" ${req}> ${UI.escape(v)}</label>`).join('')}</div>`;
    else input=`<textarea name="${name}" ${req} placeholder="Escreva a sua resposta"></textarea>`;
    return `<section class="evaluation-question"><div class="evaluation-question-number">${index+1}</div><div><label class="evaluation-question-title">${UI.escape(q.texto)}${q.obrigatoria?' <em>*</em>':''}</label>${input}</div></section>`;
  }
};
