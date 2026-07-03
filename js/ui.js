window.UI = {
  money(value){return new Intl.NumberFormat('pt-MZ',{style:'currency',currency:'MZN',minimumFractionDigits:2}).format(Number(value||0));},
  date(value){if(!value)return '—';const d=new Date(String(value).length===10?value+'T00:00:00':value);return isNaN(d)?value:new Intl.DateTimeFormat('pt-PT',{day:'2-digit',month:'short',year:'numeric'}).format(d);},
  escape(value){return String(value??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c]));},
  status(value){const v=String(value||'').toUpperCase();const ok=['PAGO','CONFIRMADO','CONFIRMADA','PRESENTE','ACTIVO','CONCLUIDA','CONCLUIDO','HOSPEDADA','EMBARCADA','EMITIDO','SAIDA'];const warn=['SUBMETIDO','SUBMETIDA','PENDENTE','PARCIAL','PROGRAMADA','PROGRAMADO','PLANEADA','ATRIBUIDA','EM_VERIFICACAO','EM_SERVICO','EM_CURSO'];const danger=['REJEITADO','CANCELADA','CANCELADO','RECUSADA','INACTIVO','SUBSTITUIDO'];const cls=ok.includes(v)?'ok':warn.includes(v)?'warn':danger.includes(v)?'danger':'neutral';return `<span class="status ${cls}">${this.escape(String(value||'—').replaceAll('_',' '))}</span>`;},
  toast(message,type='success'){const el=document.createElement('div');el.className='toast '+type;el.textContent=message;document.getElementById('toast-container').appendChild(el);setTimeout(()=>el.remove(),3500);},
  modal({title,body,onSubmit,submitText='Guardar',wide=false}){const root=document.getElementById('modal-root');root.innerHTML=`<div class="modal-overlay"><div class="modal ${wide?'wide':''}"><div class="modal-header"><h2>${this.escape(title)}</h2><button class="close-btn" type="button">×</button></div><form><div class="modal-body">${body}</div><div class="modal-footer"><button class="btn btn-ghost close-action" type="button">Cancelar</button><button class="btn btn-primary" type="submit">${this.escape(submitText)}</button></div></form></div></div>`;const close=()=>root.innerHTML='';root.querySelector('.close-btn').onclick=close;root.querySelector('.close-action').onclick=close;root.querySelector('.modal-overlay').addEventListener('click',e=>{if(e.target.classList.contains('modal-overlay'))close();});root.querySelector('form').addEventListener('submit',async e=>{e.preventDefault();const btn=e.submitter;btn.disabled=true;try{const data=Object.fromEntries(new FormData(e.target).entries());e.target.querySelectorAll('input[type=checkbox]').forEach(x=>data[x.name]=x.checked);await onSubmit(data);close();}catch(err){UI.toast(err.message,'error');btn.disabled=false;}});return root;},
  bindRangeValidation(root,startName,endName,{strict=false,message='O valor de término não pode ser anterior ao valor de início.'}={}){
    const start=root.querySelector(`[name="${startName}"]`);
    const end=root.querySelector(`[name="${endName}"]`);
    if(!start||!end)return;
    const validate=()=>{
      if(start.value)end.min=start.value;else end.removeAttribute('min');
      const invalid=Boolean(start.value&&end.value&&(strict?end.value<=start.value:end.value<start.value));
      end.setCustomValidity(invalid?message:'');
    };
    start.addEventListener('input',validate);
    start.addEventListener('change',validate);
    end.addEventListener('input',validate);
    end.addEventListener('change',validate);
    validate();
  },
  option(value,label,selected){return `<option value="${this.escape(value)}" ${String(value)===String(selected)?'selected':''}>${this.escape(label)}</option>`;},
  empty(text='Nenhum registo encontrado.'){return `<div class="empty">${this.escape(text)}</div>`;}
};
