(() => {
  const form = document.getElementById('technician-form');
  if (!form) return;
  const rules = window.NovaSyncValidation;
  const status = document.getElementById('technical-form-status');
  // O campo-armadilha "website" e o "Mostrar senha" ficam fora da validação.
  const fields = [...form.querySelectorAll('input:not([type="hidden"]):not([type="checkbox"]):not([name="website"]), select')];
  // Nome do campo no formulário -> nome esperado pelo sistema (app.nova-sync.net/api/inscricoes).
  const API = form.action;
  const PARA_API = {nome: 'full_name', rg: 'rg', cpf: 'cpf', telefone: 'phone', email: 'email', endereco: 'address', numero: 'number', complemento: 'complement', estado: 'state', cidade: 'city', cep: 'cep', senha: 'password', confirmar_senha: 'password_confirm'};
  const DA_API = Object.fromEntries(Object.entries(PARA_API).map(([pt, en]) => [en, pt]));
  const SENHAS = new Set(['senha', 'confirmar_senha']);
  const password = form.elements.namedItem('senha');
  const confirmPassword = form.elements.namedItem('confirmar_senha');

  // Duas etapas: 1) dados e endereço, 2) senha. Sem JavaScript as duas aparecem juntas.
  const steps = [...form.querySelectorAll('.technical-step')];
  const STEP_NAMES = ['Seus dados', 'Senha de acesso'];
  const stepLabel = document.getElementById('technical-step-label');
  const back = form.querySelector('[data-step-back]');
  const next = form.querySelector('[data-step-next]');
  const submit = form.querySelector('[type="submit"]');
  let step = 0;
  const stepOf = field => Math.max(0, steps.findIndex(s => s.contains(field)));
  function showStep(index, focus = true) {
    step = index;
    steps.forEach((s, i) => { s.hidden = i !== index; });
    stepLabel.hidden = false;
    stepLabel.textContent = `Etapa ${index + 1} de ${steps.length} · ${STEP_NAMES[index]}`;
    back.hidden = index === 0;
    next.hidden = index === steps.length - 1;
    submit.hidden = index !== steps.length - 1;
    if (!focus) return;
    form.closest('dialog')?.scrollTo({top: 0});
    steps[index].querySelector('input:not([type="checkbox"]), select')?.focus();
  }

  const statusMessage = text => { status.textContent = text; status.classList.toggle('is-error', !!text); };
  function showError(field, message) {
    field.setCustomValidity(message);
    field.setAttribute('aria-invalid', String(!!message));
    document.getElementById(field.id + '-error').textContent = message;
  }
  const otherValue = field => field.name === 'confirmar_senha' ? password.value : undefined;
  function validate(field) { const message = rules.error(field.name, field.value, otherValue(field)); showError(field, message); return !message; }
  function normalize(field) {
    if (SENHAS.has(field.name)) return;
    field.value = field.value.trim();
    if (field.name === 'email') field.value = field.value.toLowerCase();
    mask(field);
  }
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

  // Lista da regra da senha: cada item fica marcado quando cumprido.
  const hints = [...document.querySelectorAll('#technical-password-hints [data-rule]')];
  function updateHints() {
    const checks = rules.passwordChecks(password.value);
    hints.forEach(li => li.toggleAttribute('data-ok', !!checks[li.dataset.rule]));
  }
  document.getElementById('technical-show-password')?.addEventListener('change', event => {
    const type = event.target.checked ? 'text' : 'password';
    password.type = type; confirmPassword.type = type;
  });

  fields.forEach(field => {
    const message = document.createElement('small');
    message.id = field.id + '-error'; message.className = 'technical-field-error';
    field.insertAdjacentElement('afterend', message);
    field.setAttribute('aria-describedby', [field.getAttribute('aria-describedby'), message.id].filter(Boolean).join(' '));
    field.addEventListener('input', () => {
      mask(field); validate(field); statusMessage('');
      if (field === password) { updateHints(); if (confirmPassword.value) validate(confirmPassword); }
    });
    field.addEventListener('blur', () => { normalize(field); validate(field); });
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

  // Valida uma lista; se falhar, mostra a etapa do primeiro campo errado e põe o foco nele.
  function validAll(list) {
    list.forEach(normalize);
    const invalid = list.filter(field => !validate(field));
    if (!invalid.length) return true;
    if (stepOf(invalid[0]) !== step) showStep(stepOf(invalid[0]), false);
    statusMessage('Revise os campos destacados antes de continuar.');
    invalid[0].focus();
    return false;
  }
  next.addEventListener('click', () => {
    if (!validAll(fields.filter(field => stepOf(field) === step))) return;
    statusMessage(''); showStep(step + 1);
  });
  back.addEventListener('click', () => { statusMessage(''); showStep(step - 1); });

  // JS controla as mensagens; required/pattern continuam ativos sem JavaScript.
  form.noValidate = true;
  form.addEventListener('submit', event => {
    event.preventDefault();
    // Enter na etapa 1 avança em vez de enviar.
    if (step < steps.length - 1) { next.click(); return; }
    if (!validAll(fields)) return;
    form.setAttribute('aria-busy', 'true'); submit.disabled = true; back.disabled = true;
    status.classList.remove('is-error'); status.textContent = 'Enviando cadastro…';
    const body = {consentimento: true, website: form.elements.namedItem('website')?.value || ''};
    for (const [pt, en] of Object.entries(PARA_API)) body[en] = form.elements.namedItem(pt).value;
    const turnstile = form.elements.namedItem('cf-turnstile-response');
    if (turnstile) body['cf-turnstile-response'] = turnstile.value;
    const liberar = () => { form.removeAttribute('aria-busy'); submit.disabled = false; back.disabled = false; };
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
        if (primeiro) { if (stepOf(primeiro) !== step) showStep(stepOf(primeiro), false); primeiro.focus(); }
        window.turnstile?.reset();
      })
      .catch(() => { liberar(); statusMessage('Sem conexão com o servidor. Confira sua internet e tente novamente.'); });
  });
  window.addEventListener('pageshow', () => { form.removeAttribute('aria-busy'); submit.disabled = false; back.disabled = false; statusMessage(''); });
  // Ao abrir o cadastro de novo, começa pela etapa 1.
  form.closest('dialog')?.addEventListener('close', () => { if (!form.hasAttribute('aria-busy')) showStep(0, false); });
  updateHints();
  showStep(0, false);
})();
