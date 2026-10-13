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
    impactos: [
      "Venda ou atendimento parado",
      "Equipe improvisando para contornar",
      "Cliente final reclamando",
      "Contrato ou prazo com o meu cliente em risco",
      "Retrabalho e visita repetida",
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
  const trail = [...document.querySelectorAll("#diag-trail li")];
  // Coluna da esquerda: o que se pergunta em cada passo e por quê, no tom da home.
  const META = [
    { rotulo: "01 — Operação", titulo: "Como é a sua operação?", texto: "Três cliques para entendermos o porte. Nenhum dado seu é guardado.", img: "midia/home-campo.jpg" },
    { rotulo: "02 — O problema", titulo: "O que mais acontece hoje?", texto: "Marque o que você reconhece. É por aqui que o problema aparece.", img: "midia/drama-loja.jpg" },
    { rotulo: "03 — O impacto", titulo: "O que acontece quando isso para?", texto: "Equipamento parado não é só um conserto. Marque o que já chegou até você.", img: "midia/rack.jpg" },
    { rotulo: "04 — A mudança", titulo: "Se isso fosse resolvido, o que mudaria?", texto: "Diga o que mais pesa para você. É isso que orienta a conversa.", img: "midia/mao-celular.jpg" },
    { rotulo: "05 — O próximo passo", titulo: "Por onde começamos?", texto: "Escolha um passo concreto. A mensagem segue com tudo o que você respondeu.", img: "midia/servico-ativar.jpg" },
  ];
  const FOTO_RAMO = { Varejo: "drama-loja", "Bancos e fintechs": "drama-banco", Saúde: "drama-hospital", Indústria: "setor-industria", Telecom: "setor-telecom", Transporte: "setor-transporte", Eventos: "setor-eventos" };
  const el = {
    count: $("#diag-count"), err: $("#d-err"), back: $("#d-back"), next: $("#d-next"),
    wa: $("#d-wa"), mail: $("#d-mail"), summary: $("#d-summary"),
  };
  const evento = (nome, dados) => { if (typeof window.gtag === "function") window.gtag("event", nome, dados || {}); };

  let atual = 0;
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

  function mensagem() {
    const linhas = ["Olá! Fiz o diagnóstico no site da NovaSync."];
    linhas.push(`Operação: ${um("ramo")}, ${um("unidades")} unidades, ${um("estados").toLowerCase()}.`);
    linhas.push("O que mais acontece hoje: " + marcados("problemas").join("; ").toLowerCase() + ".");
    linhas.push("O que acontece quando para: " + marcados("impactos").join("; ").toLowerCase() + ".");
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
    () => (marcados("impactos").length ? "" : "Marque pelo menos uma opção."),
    () => (marcados("necessidades").length ? "" : "Marque pelo menos uma opção."),
    () => (um("avanco") ? "" : "Escolha o próximo passo."),
  ];

  // "Quadro" do que já foi respondido: o problema vai ficando visível a cada passo.
  function montarQuadro(i) {
    const itens = [];
    if (i > 0) itens.push(`${um("ramo")} · ${um("unidades")} unidades · ${um("estados").toLowerCase()}`);
    if (i > 1) itens.push(`${marcados("problemas").length} ${marcados("problemas").length === 1 ? "problema marcado" : "problemas marcados"}`);
    if (i > 2) itens.push(`${marcados("impactos").length} ${marcados("impactos").length === 1 ? "impacto marcado" : "impactos marcados"}`);
    if (i > 3) itens.push("Mudança: " + marcados("necessidades").join("; ").toLowerCase());
    const ul = $("#s-recap");
    ul.textContent = "";
    itens.forEach((t) => { const li = document.createElement("li"); li.textContent = t; ul.append(li); });
  }

  function ir(i, foco) {
    atual = i;
    steps.forEach((s, k) => { s.hidden = k !== i; });
    trail.forEach((t, k) => t.classList.toggle("on", k <= i));
    const m = META[i];
    $("#s-label").textContent = m.rotulo;
    $("#s-title").textContent = m.titulo;
    $("#s-text").textContent = m.texto;
    // Passo 2: a foto acompanha o ramo escolhido no passo 1.
    $("#s-img").src = i === 1 && FOTO_RAMO[um("ramo")] ? "midia/" + FOTO_RAMO[um("ramo")] + ".jpg" : m.img;
    montarQuadro(i);
    el.count.textContent = `Passo ${i + 1} de ${steps.length}`;
    el.err.textContent = "";
    el.back.hidden = i === 0;
    const ultimo = i === steps.length - 1;
    el.next.hidden = ultimo;
    el.wa.hidden = !ultimo;
    el.mail.hidden = !ultimo;
    if (ultimo) { montarAvancos(); el.summary.hidden = true; }
    evento("spin_passo_" + (i + 1), i === 0 ? {} : { ramo: um("ramo"), unidades: um("unidades") });
    if (foco !== false) {
      const alvo = $("#s-title");
      alvo.tabIndex = -1;
      alvo.focus({ preventScroll: true });
      scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  el.next.addEventListener("click", () => {
    const erro = REGRAS[atual]();
    if (erro) { el.err.textContent = erro; return; }
    ir(atual + 1);
  });
  el.back.addEventListener("click", () => ir(atual - 1));
  // Ao escolher o próximo passo, a mensagem aparece pronta para conferir antes de enviar.
  form.addEventListener("change", (e) => {
    if (atual !== steps.length - 1 || e.target.name !== "avanco") return;
    el.err.textContent = "";
    montarEnvio();
  });
  [el.wa, el.mail].forEach((a) => a.addEventListener("click", (e) => {
    if (!um("avanco")) { e.preventDefault(); el.err.textContent = "Escolha o próximo passo."; return; }
    montarEnvio();
    evento("spin_avanco_escolhido", { avanco: um("avanco"), ramo: um("ramo"), unidades: um("unidades") });
  }));

  document.getElementById("d-nojs")?.remove();
  form.hidden = false;
  ir(0, false);
})();
