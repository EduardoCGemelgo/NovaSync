(() => {
  const zip = document.getElementById('technical-zip');
  if (!zip) return;
  const button = document.getElementById('technical-zip-search');
  const status = document.getElementById('technical-zip-status');
  const fields = ['address', 'city', 'state'].map(name => document.getElementById('technical-' + name));
  let timer, controller, sequence = 0, lastSuccess = '', generated = ['', '', ''];
  const digits = value => value.replace(/\D/g, '');
  async function lookup() {
    clearTimeout(timer);
    controller?.abort();
    const cep = digits(zip.value), request = ++sequence;
    if (!/^\d{8}$/.test(cep) || cep === '00000000') { status.textContent = 'Digite os 8 dígitos do CEP para buscar o endereço.'; return; }
    const before = fields.map(field => field.value);
    status.textContent = 'Buscando endereço…'; button.disabled = true; button.setAttribute('aria-busy', 'true');
    controller = new AbortController();
    const activeController = controller;
    const timeout = setTimeout(() => activeController.abort(), 8000);
    try {
      const response = await fetch('https://viacep.com.br/ws/' + cep + '/json/', {signal: activeController.signal, credentials: 'omit', referrerPolicy: 'no-referrer'});
      if (!response.ok) throw new Error('unavailable');
      const result = await response.json();
      if (request !== sequence || digits(zip.value) !== cep) return;
      if (result.erro || typeof result.cep !== 'string' || digits(result.cep) !== cep) { status.textContent = 'CEP não encontrado. Confira os dígitos ou preencha o endereço manualmente.'; return; }
      const values = [result.logradouro, result.localidade, result.uf].map(value => typeof value === 'string' ? value.trim() : '');
      fields.forEach((field, i) => {
        // Não substitui informação digitada antes ou durante a consulta.
        if (!values[i] || field.value !== before[i] || (field.value && field.value !== generated[i])) return;
        if (field.tagName === 'SELECT' && ![...field.options].some(option => option.value === values[i])) return;
        field.value = values[i]; generated[i] = values[i]; field.dispatchEvent(new Event('change', {bubbles: true}));
      });
      lastSuccess = cep;
      status.textContent = values[0] ? 'Endereço localizado. Confira os campos e informe o número e o complemento.' : 'Localizamos a cidade e o estado. Complete a rua, o número e o complemento.';
    } catch {
      if (request === sequence) status.textContent = 'Não foi possível consultar o CEP agora. Preencha o endereço manualmente ou tente novamente.';
    } finally {
      clearTimeout(timeout);
      if (request === sequence) { button.disabled = false; button.removeAttribute('aria-busy'); }
    }
  }
  zip.addEventListener('input', () => {
    ++sequence; clearTimeout(timer); controller?.abort(); button.disabled = false; button.removeAttribute('aria-busy');
    status.textContent = ''; const cep = digits(zip.value);
    if (lastSuccess && cep !== lastSuccess) {
      fields.forEach((field, i) => { if (generated[i] && field.value === generated[i]) { field.value = ''; field.dispatchEvent(new Event('change', {bubbles: true})); } });
      generated = ['', '', '']; lastSuccess = '';
    }
    if (/^\d{8}$/.test(cep) && cep !== lastSuccess) timer = setTimeout(lookup, 600);
  });
  button.addEventListener('click', lookup);
})();
