(() => {
  const form = document.getElementById('technician-form');
  if (!form) return;
  const rules = window.NovaSyncValidation;
  const status = document.getElementById('technical-form-status');
  // O campo-armadilha "website" fica fora da validação: gente não preenche, robô preenche.
  const fields = [...form.querySelectorAll('input:not([type="hidden"]):not([name="website"]), select')];
  // Nome do campo no formulário -> nome esperado pelo sistema (app.nova-sync.net/api/inscricoes).
  const API = form.action;
  const PARA_API = {nome: 'full_name', rg: 'rg', cpf: 'cpf', telefone: 'phone', email: 'email', endereco: 'address', complemento: 'complement', estado: 'state', cidade: 'city', cep: 'cep'};
  const DA_API = Object.fromEntries(Object.entries(PARA_API).map(([pt, en]) => [en, pt]));
  const statusMessage = text => { status.textContent = text; status.classList.toggle('is-error', !!text); };
  function showError(field, message) {
    field.setCustomValidity(message);
    field.setAttribute('aria-invalid', String(!!message));
    document.getElementById(field.id + '-error').textContent = message;
  }
  function validate(field) { const message = rules.error(field.name, field.value); showError(field, message); return !message; }
  function mask(field) {
    const kind = field.dataset.mask;
    if (!kind || !/^[\d().\- ]*$/.test(field.value)) return;
    const before = field.value, cursor = field.selectionStart;
    const count = rules.digits(before.slice(0, cursor)).length;
    field.value = rules.format(kind, before);
    let position = 0, seen = 0;
    while (position < field.value.length && seen < count) { if (/\d/.test(field.value[position])) seen++; position++; }
    if (document.activeElement === field) field.setSelectionRange(position, position);
  }
  fields.forEach(field => {
    const message = document.createElement('small');
    message.id = field.id + '-error'; message.className = 'technical-field-error';
    field.insertAdjacentElement('afterend', message);
    field.setAttribute('aria-describedby', [field.getAttribute('aria-describedby'), message.id].filter(Boolean).join(' '));
    field.addEventListener('input', () => { mask(field); validate(field); statusMessage(''); });
    field.addEventListener('blur', () => { field.value = field.value.trim(); validate(field); });
    field.addEventListener('change', () => validate(field));
    field.addEventListener('paste', event => {
      const text = event.clipboardData?.getData('text');
      if (text == null || !field.dataset.mask) return;
      event.preventDefault();
      const next = field.value.slice(0, field.selectionStart) + text + field.value.slice(field.selectionEnd);
      const max = field.dataset.mask === 'cep' ? 8 : 11;
      if (!/^[\d().\-\s]*$/.test(next) || rules.digits(next).length > max) {
        showError(field, `Cole até ${max} dígitos, sem letras${field.name === 'telefone' ? ' e sem +55' : ''}.`);
        statusMessage('O conteúdo colado não foi aceito. Revise o campo indicado.');
        return;
      }
      field.value = rules.format(field.dataset.mask, next);
      field.dispatchEvent(new Event('input', {bubbles: true}));
    });
    field.addEventListener('beforeinput', event => {
      if (!field.dataset.mask || event.inputType !== 'deleteContentBackward' || field.selectionStart !== field.selectionEnd) return;
      const cursor = field.selectionStart;
      if (!cursor || /\d/.test(field.value[cursor - 1])) return;
      event.preventDefault();
      let from = cursor - 1;
      while (from > 0 && !/\d/.test(field.value[from])) from--;
      field.value = field.value.slice(0, from) + field.value.slice(cursor);
      field.setSelectionRange(from, from);
      field.dispatchEvent(new Event('input', {bubbles: true}));
    });
  });
  // JS controla as mensagens; required/pattern continuam ativos sem JavaScript.
  form.noValidate = true;
  form.addEventListener('submit', event => {
    for (const field of fields) { field.value = field.value.trim(); if (field.name === 'email') field.value = field.value.toLowerCase(); mask(field); }
    const valid = fields.map(validate).every(Boolean);
    if (!valid || !form.checkValidity()) {
      event.preventDefault(); statusMessage('Revise os campos destacados antes de enviar.');
      form.querySelector(':invalid')?.focus(); form.reportValidity(); return;
    }
    event.preventDefault();
    const submit = form.querySelector('[type="submit"]');
    form.setAttribute('aria-busy', 'true'); submit.disabled = true;
    status.classList.remove('is-error'); status.textContent = 'Enviando cadastro…';
    const body = {consentimento: true, website: form.elements.namedItem('website')?.value || ''};
    for (const [pt, en] of Object.entries(PARA_API)) body[en] = form.elements.namedItem(pt).value;
    const turnstile = form.elements.namedItem('cf-turnstile-response');
    if (turnstile) body['cf-turnstile-response'] = turnstile.value;
    const liberar = () => { form.removeAttribute('aria-busy'); submit.disabled = false; };
    fetch(API, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body), credentials: 'omit'})
      .then(response => response.json().catch(() => ({ok: false, message: 'Não foi possível enviar agora. Tente novamente em instantes.'})))
      .then(result => {
        if (result.ok) { location.href = new URL('cadastro-enviado.html', location.href).href; return; }
        liberar();
        let primeiro = null;
        for (const [en, message] of Object.entries(result.errors || {})) {
          const field = form.elements.namedItem(DA_API[en] || en);
          if (field && fields.includes(field)) { showError(field, message); primeiro = primeiro || field; }
        }
        statusMessage(result.message || 'Não foi possível enviar agora. Tente novamente em instantes.');
        primeiro?.focus();
        window.turnstile?.reset();
      })
      .catch(() => { liberar(); statusMessage('Sem conexão com o servidor. Confira sua internet e tente novamente.'); });
  });
  window.addEventListener('pageshow', () => { form.removeAttribute('aria-busy'); form.querySelector('[type="submit"]').disabled = false; statusMessage(''); });
})();
