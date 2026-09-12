/* Regras do cadastro. Mantém CPF/CEP como texto para preservar zeros iniciais. */
(function (root) {
  const digits = value => String(value).replace(/\D/g, '');
  const ddds = new Set('11 12 13 14 15 16 17 18 19 21 22 24 27 28 31 32 33 34 35 37 38 41 42 43 44 45 46 47 48 49 51 53 54 55 61 62 63 64 65 66 67 68 69 71 73 74 75 77 79 81 82 83 84 85 86 87 88 89 91 92 93 94 95 96 97 98 99'.split(' '));
  const ufs = new Set('AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' '));
  function validCPF(value) {
    const n = digits(value);
    if (!/^\d{11}$/.test(n) || /^(\d)\1{10}$/.test(n)) return false;
    for (const length of [9, 10]) {
      let sum = 0;
      for (let i = 0; i < length; i++) sum += Number(n[i]) * (length + 1 - i);
      const check = (sum * 10 % 11) % 10;
      if (check !== Number(n[length])) return false;
    }
    return true;
  }
  function format(kind, value) {
    const n = digits(value);
    if (kind === 'cpf') return n.replace(/^(\d{3})(\d)/, '$1.$2').replace(/^(\d{3}\.\d{3})(\d)/, '$1.$2').replace(/(\d{3}\.\d{3}\.\d{3})(\d)/, '$1-$2');
    if (kind === 'cep') return n.replace(/^(\d{5})(\d)/, '$1-$2');
    if (kind === 'phone') {
      if (n.length < 3) return n;
      const local = n.slice(2), split = n.length > 10 ? 5 : 4;
      return '(' + n.slice(0, 2) + ') ' + local.slice(0, split) + (local.length > split ? '-' + local.slice(split) : '');
    }
    return value;
  }
  function error(name, raw) {
    const value = String(raw).trim();
    if (!value) return name === 'complemento' ? '' : 'Preencha este campo.';
    switch (name) {
      case 'nome': return value.length >= 3 && value.length <= 150 ? '' : 'Informe seu nome completo, entre 3 e 150 caracteres.';
      case 'rg': return /^(?=.*\d)[A-Za-z0-9.\- /]{1,20}$/.test(value) ? '' : 'Use até 20 caracteres do documento: números, letras e pontuação.';
      case 'cpf': return /^[\d.\- ]+$/.test(value) && validCPF(value) ? '' : 'Informe um CPF válido com 11 dígitos.';
      case 'telefone': {
        const n = digits(value);
        return /^[\d()\- ]+$/.test(value) && ddds.has(n.slice(0, 2)) && (/^\d{2}9\d{8}$/.test(n) || /^\d{2}[2-5]\d{7}$/.test(n)) ? '' : 'Informe DDD e telefone: 10 dígitos para fixo ou 11 para celular, sem +55.';
      }
      case 'email': return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? '' : 'Informe um e-mail válido, como nome@dominio.com.';
      case 'endereco': return value.length >= 3 && value.length <= 250 ? '' : 'Informe rua e número, entre 3 e 250 caracteres.';
      case 'complemento': return value.length <= 150 ? '' : 'Use até 150 caracteres.';
      case 'estado': return ufs.has(value) ? '' : 'Selecione uma UF válida.';
      case 'cidade': return value.length <= 100 ? '' : 'Use até 100 caracteres para a cidade.';
      case 'cep': return /^\d{5}-?\d{3}$/.test(value) && digits(value) !== '00000000' ? '' : 'Informe um CEP com 8 dígitos.';
      default: return '';
    }
  }
  const api = { digits, validCPF, format, error };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.NovaSyncValidation = api;
})(globalThis);
