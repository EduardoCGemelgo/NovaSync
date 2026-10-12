// Diagnóstico SPIN: 5 passos, tudo no navegador. Nada vai para servidor; o resultado segue na mensagem de contato.
(() => {
  const form = document.getElementById("diag");
  if (!form) return;

  const OPCOES = {
    ramo: ["Varejo", "Bancos e fintechs", "Saúde", "Indústria", "Telecom", "Transporte", "Eventos", "Outro"],
    unidades: ["1 a 5", "6 a 20", "21 a 100", "Mais de 100"],
    estados: ["Um estado", "Até 5 estados", "Mais de 5 estados"],
    problemas: [
      "Equipamento parado sem prazo para voltar",
      "Técnico que atrasa ou não aparece",
      "Relatório de atendimento que não é confiável",
      "Não sei o que foi feito em cada unidade",
      "Cada unidade com um fornecedor diferente",
      "Prazo estourado sem aviso",
    ],
    necessidades: [
      "Menos tempo de equipamento parado",
      "Relatório para mostrar ao meu cliente",
      "Uma só empresa responsável",
      "Prazo que eu possa cobrar",
    ],
  };
  const AVANCOS = {
    horus: "Ver o Horus com os chamados da minha operação",
    piloto: "Piloto em uma unidade",
    raiox: "Raio-X da minha operação no local",
  };
  const GRANDE = ["21 a 100", "Mais de 100"]; // conta grande: o piloto vem primeiro

  const $ = (s) => form.querySelector(s);
  const steps = [...form.querySelectorAll("fieldset[data-step]")];
  const bars = [...form.querySelectorAll(".diag-progress i")];
  const el = {
    count: $("#diag-count"), err: $("#d-err"), back: $("#d-back"), next: $("#d-next"), skip: $("#d-skip"),
    wa: $("#d-wa"), mail: $("#d-mail"), cost: $("#d-cost"), month: $("#d-month"), year: $("#d-year"), summary: $("#d-summary"),
  };
  const brl = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v).replace(/ /g, " ");
  const evento = (nome, dados) => { if (typeof window.gtag === "function") window.gtag("event", nome, dados || {}); };

  let atual = 0;
  let custo = null; // { calls, down, rate, mes } quando o passo 3 foi preenchido
  let uid = 0;

  function chips(box, nomes, multi) {
    const name = box.dataset.name;
    nomes.forEach((texto) => {
      const id = "d" + ++uid;
      const lab = document.createElement("label");
      lab.htmlFor = id;
      const inp = document.createElement("input");
      inp.type = multi ? "checkbox" : "radio";
      inp.name = name;
      inp.id = id;
      inp.value = texto;
      const sp = document.createElement("span");
      sp.textContent = texto;
      lab.append(inp, sp);
      box.append(lab);
    });
  }
  form.querySelectorAll(".chips[data-name]").forEach((box) => {
    const n = box.dataset.name;
    if (OPCOES[n]) chips(box, OPCOES[n], !!box.dataset.multi);
  });

  const marcados = (name) => [...form.querySelectorAll(`input[name="${name}"]:checked`)].map((i) => i.value);
  const um = (name) => marcados(name)[0] || "";
  const grande = () => GRANDE.includes(um("unidades"));

  // Avanço: a ordem muda com o porte. A primeira opção leva a etiqueta "Recomendado".
  function montarAvancos() {
    const box = $('.chips[data-name="avanco"]');
    const antes = um("avanco");
    box.textContent = "";
    const ordem = grande() ? ["piloto", "horus", "raiox"] : ["raiox", "horus", "piloto"];
    ordem.forEach((k, i) => {
      const id = "d" + ++uid;
      const lab = document.createElement("label");
      lab.htmlFor = id;
      const inp = document.createElement("input");
      inp.type = "radio";
      inp.name = "avanco";
      inp.id = id;
      inp.value = AVANCOS[k];
      inp.checked = AVANCOS[k] === antes;
      const sp = document.createElement("span");
      sp.textContent = AVANCOS[k];
      if (i === 0) {
        const tag = document.createElement("em");
        tag.className = "diag-tag";
        tag.style.fontStyle = "normal";
        tag.textContent = "Recomendado";
        sp.append(tag);
      }
      lab.append(inp, sp);
      box.append(lab);
    });
  }

  function lerCusto() {
    const v = (id) => $(id).value.trim();
    const [c, d, r] = [v("#d-calls"), v("#d-down"), v("#d-rate")];
    if (c === "" || d === "" || r === "") return null;
    const calls = Number(c), down = Number(d), rate = Number(r);
    if (![calls, down, rate].every(Number.isFinite) || !$("#d-calls").checkValidity() || !$("#d-down").checkValidity() || !$("#d-rate").checkValidity()) return null;
    const horas = calls * down;
    return { calls, down, rate, horas, mes: Math.round(horas * Math.round(rate * 100)) / 100 };
  }
  function mostrarCusto() {
    custo = lerCusto();
    el.cost.hidden = !custo;
    if (!custo) return;
    el.month.textContent = brl(custo.mes);
    el.year.textContent = `${custo.horas} horas paradas por mês, ${brl(custo.mes * 12)} por ano.`;
  }
  form.querySelectorAll("#d-calls, #d-down, #d-rate").forEach((i) => i.addEventListener("input", mostrarCusto));

  function mensagem() {
    const linhas = ["Olá! Fiz o diagnóstico no site da NovaSync."];
    linhas.push(`Operação: ${um("ramo")}, ${um("unidades")} unidades, ${um("estados").toLowerCase()}.`);
    linhas.push("O que mais acontece hoje: " + marcados("problemas").join("; ").toLowerCase() + ".");
    if (custo) linhas.push(`Custo da parada: ${custo.calls} chamados por mês, ${custo.down} h paradas por chamado e ${brl(custo.rate)} por hora parada, ou seja ${brl(custo.mes)} por mês.`);
    linhas.push("O que mudaria se fosse resolvido: " + marcados("necessidades").join("; ").toLowerCase() + ".");
    linhas.push("Próximo passo que eu quero: " + um("avanco") + ".");
    return linhas.join("\n");
  }
  function montarEnvio() {
    const msg = mensagem();
    el.summary.textContent = msg;
    el.summary.hidden = false;
    el.wa.href = "https://wa.me/5511993287070?text=" + encodeURIComponent(msg);
    el.mail.href = "mailto:comercial@nova-sync.net?subject=" + encodeURIComponent("Diagnóstico NovaSync: " + um("avanco")) + "&body=" + encodeURIComponent(msg);
  }

  const REGRAS = [
    () => (um("ramo") && um("unidades") && um("estados") ? "" : "Escolha uma opção em cada uma das três perguntas."),
    () => (marcados("problemas").length ? "" : "Marque pelo menos uma opção."),
    () => (custo ? "" : "Preencha os três números ou use “Pular este passo”."),
    () => (marcados("necessidades").length ? "" : "Marque pelo menos uma opção."),
    () => (um("avanco") ? "" : "Escolha o próximo passo."),
  ];

  function ir(i, foco) {
    atual = i;
    steps.forEach((s, k) => { s.hidden = k !== i; });
    bars.forEach((b, k) => b.classList.toggle("on", k <= i));
    el.count.textContent = `Passo ${i + 1} de ${steps.length}`;
    el.err.textContent = "";
    el.back.hidden = i === 0;
    const ultimo = i === steps.length - 1;
    el.next.hidden = ultimo;
    el.skip.hidden = i !== 2;
    el.wa.hidden = !ultimo;
    el.mail.hidden = !ultimo;
    if (ultimo) { montarAvancos(); el.summary.hidden = true; }
    evento("spin_passo_" + (i + 1), i === 0 ? {} : { ramo: um("ramo"), unidades: um("unidades") });
    if (foco !== false) {
      const alvo = steps[i].querySelector("legend");
      alvo.tabIndex = -1;
      alvo.focus({ preventScroll: false });
    }
  }

  el.next.addEventListener("click", () => {
    const erro = REGRAS[atual]();
    if (erro) { el.err.textContent = erro; return; }
    ir(atual + 1);
  });
  el.back.addEventListener("click", () => ir(atual - 1));
  el.skip.addEventListener("click", () => {
    ["#d-calls", "#d-down", "#d-rate"].forEach((s) => { $(s).value = ""; });
    mostrarCusto();
    ir(3);
  });
  // Ao escolher o próximo passo, a mensagem aparece pronta para conferir antes de enviar.
  form.addEventListener("change", (e) => {
    if (atual !== steps.length - 1 || e.target.name !== "avanco") return;
    el.err.textContent = "";
    montarEnvio();
  });
  [el.wa, el.mail].forEach((a) => a.addEventListener("click", (e) => {
    if (!um("avanco")) { e.preventDefault(); el.err.textContent = "Escolha o próximo passo."; return; }
    montarEnvio();
    evento("spin_avanco_escolhido", { avanco: um("avanco"), ramo: um("ramo"), unidades: um("unidades"), custo_informado: !!custo });
  }));

  document.getElementById("d-nojs")?.remove();
  form.hidden = false;
  ir(0, false);
})();
