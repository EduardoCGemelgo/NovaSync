document.querySelectorAll(".nav-sectors").forEach((sectors) => {
  const trigger = sectors.querySelector("summary");
  sectors.addEventListener("pointerenter", (event) => {
    if (event.pointerType === "mouse") sectors.open = true;
  });
  sectors.addEventListener("pointerleave", (event) => {
    if (event.pointerType === "mouse" && !sectors.contains(document.activeElement)) sectors.open = false;
  });
  sectors.addEventListener("focusout", (event) => {
    if (!sectors.contains(event.relatedTarget)) sectors.open = false;
  });
  sectors.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && sectors.open) {
      event.stopPropagation();
      sectors.open = false;
      trigger.focus();
    }
  });
  document.addEventListener("click", (event) => {
    if (!sectors.contains(event.target)) sectors.open = false;
  });
});

const toggle = document.querySelector(".menu-toggle"),
  menu = document.querySelector(".mobile-menu");
toggle?.addEventListener("click", () => {
  const open = toggle.getAttribute("aria-expanded") !== "true";
  toggle.setAttribute("aria-expanded", String(open));
  toggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
  menu.hidden = !open;
});
menu?.addEventListener("click", (e) => {
  if (e.target.closest("a")) {
    menu.hidden = true;
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Abrir menu");
  }
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && menu && !menu.hidden) {
    menu.hidden = true;
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Abrir menu");
    toggle.focus();
  }
});
const state = document.querySelector("#state"),
  coverageLink = document.querySelector("#coverage-link");
state?.addEventListener("change", () => {
  coverageLink.href =
    "https://wa.me/5511993287070?text=" +
    encodeURIComponent(
      "Olá! Gostaria de consultar a cobertura de atendimento em " +
        state.options[state.selectedIndex].text +
        ".",
    );
});
const calc = document.querySelector("#calculator");
function calculate() {
  const hours = Number(document.querySelector("#hours").value),
    cost = Number(document.querySelector("#cost").value),
    weeks = Number(document.querySelector("#weeks").value);
  const output = document.querySelector("#estimate"),
    caption = document.querySelector("#estimate-caption");
  if (!calc.checkValidity()) {
    output.textContent = "Revise os valores";
    caption.textContent =
      "Use números dentro dos limites indicados nos campos.";
    return;
  }
  const cents = Math.round(cost * 100),
    totalCents = Math.round(hours * weeks * cents);
  output.textContent = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(totalCents / 100);
  caption.textContent = `${hours * weeks} horas de busca no período. Estimativa do tempo da sua equipe.`;
}
calc?.addEventListener("input", calculate);
if (calc) calculate();
const dialog = document.querySelector("#technician-dialog");
document
  .querySelectorAll("[data-technician]")
  .forEach((button) =>
    button.addEventListener("click", () => dialog.showModal()),
  );
document
  .querySelector("[data-close]")
  ?.addEventListener("click", () => dialog.close());

// Jornada interativa + reveal progressivo (respeita reduced-motion).
(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const details = [
    "Alinhamos o escopo, o local, o Prazo e os critérios que vão orientar o atendimento.",
    "O Técnico designado considera região, disponibilidade e necessidade técnica da visita.",
    "Status, evidências e Vai precisar voltar ficam registrados durante a execução.",
    "O Relatório do atendimento reúne o que foi feito, o resultado e os próximos passos.",
  ];
  const btns = [...document.querySelectorAll("[data-journey]")];
  const out = document.querySelector("#journey-detail");
  const steps = [...document.querySelectorAll(".step[data-step]")];
  function select(i) {
    btns.forEach((b, j) => b.setAttribute("aria-pressed", String(j === i)));
    steps.forEach((s, j) => s.classList.toggle("active", j === i));
    if (out) out.textContent = details[i] || details[0];
  }
  btns.forEach((b) => b.addEventListener("click", () => select(Number(b.dataset.journey || 0))));
  document.addEventListener('novasync:journey',e=>select(e.detail));
  select(0);
  const targets = document.querySelectorAll(".reveal");
  if (reduce || !("IntersectionObserver" in window)) {
    targets.forEach((t) => t.classList.add("on"));
    return;
  }
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("on"); io.unobserve(e.target); } }), { threshold: 0.12 });
  targets.forEach((t) => io.observe(t));
})();
// Exemplo ilustrativo: seleção explícita de etapas, sem dados de produção.
const scenes = [
 ['Escopo recebido','A operação começa com uma demanda clara.','Unidade, equipamento e janela de atendimento. As informações certas acompanham o técnico desde o início.','Próximo passo: designação técnica'],
 ['Técnico designado','A execução tem acompanhamento.','O técnico recebe o escopo e registra o que encontra no local. Você acompanha o atendimento e a necessidade de retorno.','Próximo passo: registrar a execução'],
 ['Atendimento registrado','O serviço termina com informação.','A atividade realizada, as evidências e o resultado compõem o relatório do atendimento. Um histórico para consultar depois.','Relatório do atendimento disponível'],
];
function selectScene(i) {
 const data=scenes[i]; if(!data)return;
 ['scene-status','scene-title','scene-copy','scene-next'].forEach((id,j)=>{document.getElementById(id).textContent=data[j];});
 document.querySelectorAll('[data-scene]').forEach((b,j)=>b.setAttribute('aria-pressed',String(i===j)));
 document.querySelectorAll('.console-route i').forEach((el,j)=>el.classList.toggle('active',j<=i));
}
document.querySelectorAll('[data-scene]').forEach(button=>button.addEventListener('click',()=>{
 selectScene(Number(button.dataset.scene));
 document.dispatchEvent(new CustomEvent('novasync:scene-manual',{detail:Number(button.dataset.scene)}));
}));
const motionButton=document.getElementById('motion-toggle');
if(motionButton){
 if(matchMedia('(prefers-reduced-motion: reduce)').matches){motionButton.hidden=true;}
 motionButton.addEventListener('click',()=>{const paused=document.documentElement.dataset.motion!=='paused';document.documentElement.dataset.motion=paused?'paused':'running';motionButton.setAttribute('aria-pressed',String(paused));motionButton.textContent=paused?'Retomar animações':'Pausar animações';});
}
const coverageMap=document.getElementById('coverage-map');
function connectCoverageMap(){
 const svg=coverageMap?.contentDocument?.querySelector('svg'); if(!svg||!state) return; svg.style.background='#0e0e1a';
 const regions=[...svg.querySelectorAll('[id^="BR"]')];
 // Fit the existing state geometry without changing geographic shapes.
 if(document.body.classList.contains('landing-art') && regions.length){
  const boxes=regions.map(region=>region.getBBox());
  const x=Math.min(...boxes.map(b=>b.x)),y=Math.min(...boxes.map(b=>b.y));
  const right=Math.max(...boxes.map(b=>b.x+b.width)),bottom=Math.max(...boxes.map(b=>b.y+b.height));
  const padding=900;
  svg.setAttribute('viewBox',[x-padding,y-padding,right-x+padding*2,bottom-y+padding*2].join(' '));
 }
 const names=new Map([...state.options].map(o=>[o.value,o.text]));
 const update=()=>regions.forEach(region=>{region.style.fill=region.id==='BR'+state.value?'#a9c3ff':'#353e59';region.style.stroke='#8898b4';region.style.strokeWidth='24';});
 regions.forEach(region=>{region.style.cursor='pointer';const title=svg.ownerDocument.createElementNS('http://www.w3.org/2000/svg','title');title.textContent=names.get(region.id.slice(2))||region.id.slice(2);region.append(title);region.addEventListener('click',()=>{if(names.has(region.id.slice(2))){state.value=region.id.slice(2);state.dispatchEvent(new Event('change'));}});});
 state.addEventListener('change',update);update();
}
coverageMap?.addEventListener('load',connectCoverageMap);
if(coverageMap?.contentDocument?.querySelector('svg'))connectCoverageMap();

// Rede cadastrada: valores preservados do index.html original fornecido pelo usuário.
const referenceCapacity={"AC":7,"AL":9,"AM":6,"AP":5,"BA":17,"CE":15,"DF":9,"ES":8,"GO":10,"MA":12,"MG":28,"MS":9,"MT":15,"PA":16,"PB":13,"PE":18,"PI":7,"PR":13,"RJ":13,"RN":7,"RO":8,"RR":6,"RS":26,"SC":14,"SE":7,"SP":47,"TO":5};
function updateCoverageCard(){if(!state)return;document.getElementById("coverage-state-name").textContent=state.options[state.selectedIndex].text;const target=referenceCapacity[state.value]??0;const count=document.getElementById("coverage-count");count.dataset.target=String(target);count.textContent=String(target);const readable=document.getElementById("coverage-count-readable");if(readable)readable.textContent=String(target);document.dispatchEvent(new CustomEvent("novasync:coverage",{detail:target}));}
state?.addEventListener("change",updateCoverageCard);if(document.getElementById("coverage-count"))updateCoverageCard();
