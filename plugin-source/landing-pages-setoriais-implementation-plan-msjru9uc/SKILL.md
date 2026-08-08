# Landing Pages Setoriais Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar cinco landing pages estaticas, especificas por setor, para ampliar a relevancia organica da NovaSync em buscas de Field Service no Brasil sem duplicar conteudo.

**Architecture:** Usar `novasync-field-service-2.html` como referencia visual e estrutural, criando cinco arquivos HTML autonomos com o mesmo sistema de tokens, componentes e interacoes. Cada pagina tera metadados, headings, dores, servicos, FAQ e CTA proprios; a pagina principal recebera apenas os links setoriais diretamente necessarios.

**Tech Stack:** HTML5 sem dependencias de backend, CSS existente embutido no template atual, JavaScript vanilla para interacoes locais, JSON-LD `FAQPage` quando houver FAQ visivel, assets locais existentes.

## Global Constraints

- Criar exatamente cinco paginas: `field-service-bancos.html`, `field-service-varejo.html`, `field-service-saude.html`, `field-service-telecom.html` e `field-service-industria.html`.
- Transporte e Eventos ficam fora do primeiro lote.
- Cada pagina deve ter `title`, meta description, canonical, Open Graph e idioma proprios.
- Cada pagina deve ter exatamente um `h1` e hierarquia semantica coerente.
- O conteudo deve ser especifico do setor, nao apenas uma troca de titulo.
- Reutilizar a identidade visual atual da NovaSync, com contraste acessivel e layout responsivo.
- Reutilizar somente assets locais existentes; nao criar imagens ou logos novos.
- Manter as cores originais dos logos dos parceiros e o fundo atual da prova social.
- Usar somente metricas autorizadas: SLA de ate 2 dias uteis e tempo medio de 1 dia util.
- Nao inventar clientes, depoimentos, resultados, numeros ou promessas garantidas.
- Preservar a pagina principal fora dos links e ajustes diretamente necessarios.
- Garantir navegacao por teclado, foco visivel, alt text e alvos de toque adequados.
- Nao criar backend, CMS ou sistema de roteamento.

---

### Task 1: Mapear o template e os pontos de integracao

**Files:**
- Read: `novasync-field-service-2.html`
- Read: `brand-spec.md`
- Read: `docs/superpowers/specs/2026-08-07-landing-pages-setoriais-design.md`

**Interfaces:**
- Consumes: secoes, tokens, navegacao, scripts e assets existentes na pagina principal.
- Produces: inventario dos blocos que serao copiados e lista dos links setoriais a atualizar.

- [ ] **Step 1: Identificar o template visual reutilizavel**

  Registrar no plano de execucao os seletores de topbar, hero, botoes, secoes, prova social, FAQ, CTA e footer que devem permanecer consistentes.

- [ ] **Step 2: Identificar os cards de setores**

  Localizar os sete setores atuais e mapear somente os cinco destinos do primeiro lote, sem alterar Transporte ou Eventos.

- [ ] **Step 3: Identificar os assets locais autorizados**

  Confirmar os caminhos do logo NovaSync, logos de Melhoretec e Novalogi e demais imagens usadas pela prova social.

- [ ] **Step 4: Registrar o inventario antes da implementacao**

  Confirmar que cada arquivo novo tera uma unica responsabilidade: uma landing page setorial completa, sem dependencias de outro HTML para renderizar seu conteudo.

### Task 2: Criar a landing page de Bancos e Fintechs

**Files:**
- Create: `field-service-bancos.html`

**Interfaces:**
- Consumes: template visual e assets mapeados na Task 1.
- Produces: pagina autonoma com copy de bancos e fintechs, metadados e FAQ correspondentes.

- [ ] **Step 1: Criar o documento base**

  Copiar a estrutura HTML e os tokens visuais da pagina principal, definindo `lang="pt-BR"`, title, description, canonical e Open Graph apontando para a URL da pagina de bancos.

- [ ] **Step 2: Escrever o hero setorial**

  Usar um `h1` unico sobre Field Service para bancos e fintechs, com proposta de valor centrada em disponibilidade de agencias, terminais, caixas eletronicos e rastreabilidade de chamados.

- [ ] **Step 3: Escrever dores e servicos especificos**

  Cobrir continuidade operacional, atendimento em unidades distribuida, ativos de autoatendimento, hardware, software e registro de evidencias sem inventar indicadores.

- [ ] **Step 4: Adicionar fluxo, prova social e CTA**

  Reutilizar o fluxo de quatro etapas, depoimentos e logos autorizados; exibir apenas SLA de ate 2 dias uteis e tempo medio de 1 dia util; apontar CTAs para contato e cadastro tecnico existentes.

- [ ] **Step 5: Adicionar FAQ visivel e JSON-LD correspondente**

  Criar perguntas realmente especificas sobre cobertura de agencias, terminais e rastreabilidade. O JSON-LD deve repetir exatamente as perguntas e respostas visiveis.

- [ ] **Step 6: Verificar a pagina isoladamente**

  Confirmar um `h1`, links internos validos, metadados completos, alt text e ausencia de overflow horizontal.

### Task 3: Criar as landing pages de Varejo e Saude

**Files:**
- Create: `field-service-varejo.html`
- Create: `field-service-saude.html`

**Interfaces:**
- Consumes: template de Task 2, com estrutura compartilhada e dados editoriais independentes.
- Produces: duas paginas com diferenciais de varejo e saude, sem copiar blocos especificos de um setor para o outro.

- [ ] **Step 1: Criar a pagina de Varejo**

  Escrever title, hero, dores, servicos e FAQ sobre lojas, PDV, impressoras, coletores, quiosques, unidades distribuidas e impacto de indisponibilidade no atendimento.

- [ ] **Step 2: Criar a pagina de Saude**

  Escrever title, hero, dores, servicos e FAQ sobre hospitais, clinicas, laboratorios, equipamentos de atendimento, criticidade, rastreabilidade e controle de acesso operacional.

- [ ] **Step 3: Aplicar o mesmo contrato tecnico**

  Garantir em ambas as paginas `lang="pt-BR"`, um `h1`, canonical proprio, OG proprio, FAQ visivel sincronizado com JSON-LD e os mesmos criterios de acessibilidade do template.

- [ ] **Step 4: Verificar diferenciacao editorial**

  Comparar headings, paragrafos de dores, ativos, cenarios e perguntas para confirmar que cada pagina comunica uma intencao setorial distinta.

### Task 4: Criar as landing pages de Telecom e Industria

**Files:**
- Create: `field-service-telecom.html`
- Create: `field-service-industria.html`

**Interfaces:**
- Consumes: template de Task 2 e os contratos editoriais definidos na especificacao.
- Produces: duas paginas especificas para operacoes de telecom e industria.

- [ ] **Step 1: Criar a pagina de Telecom**

  Escrever title, hero, dores, servicos e FAQ sobre infraestrutura distribuida, rede, conectividade, sites tecnicos, instalacao, manutencao e evidencias de execucao.

- [ ] **Step 2: Criar a pagina de Industria**

  Escrever title, hero, dores, servicos e FAQ sobre plantas, linhas de producao, automacao, ativos industriais, janelas de manutencao e seguranca operacional.

- [ ] **Step 3: Aplicar metadados e acessibilidade**

  Usar canonical e OG unicos, um `h1`, foco visivel, textos alternativos, controles de FAQ acessiveis e layout responsivo em ambas as paginas.

- [ ] **Step 4: Verificar a diferenciacao**

  Confirmar que Telecom e Industria nao reutilizam indevidamente exemplos, ativos ou FAQs de outros setores.

### Task 5: Conectar a navegacao da pagina principal

**Files:**
- Modify: `novasync-field-service-2.html` na secao de setores e nos destinos equivalentes da navegacao lateral, se existirem.

**Interfaces:**
- Consumes: os cinco nomes de arquivo criados nas Tasks 2-4.
- Produces: links navegaveis da pagina principal para cada landing page do primeiro lote.

- [ ] **Step 1: Atualizar os cinco cards de setores**

  Alterar somente os hrefs de Bancos, Varejo, Saude, Telecom e Industria para os arquivos correspondentes; manter Transporte e Eventos sem destino novo.

- [ ] **Step 2: Preservar os atributos existentes**

  Manter `data-od-id`, classes, copy nao relacionada e comportamento visual dos cards.

- [ ] **Step 3: Verificar os links estaticamente**

  Confirmar que cada href aponta para um arquivo existente e que nenhum link do primeiro lote usa URL remota ou ancora inexistente.

### Task 6: Executar a verificacao SEO, acessibilidade e responsividade

**Files:**
- Read: `novasync-field-service-2.html`
- Read: `field-service-bancos.html`
- Read: `field-service-varejo.html`
- Read: `field-service-saude.html`
- Read: `field-service-telecom.html`
- Read: `field-service-industria.html`

**Interfaces:**
- Consumes: conjunto final de seis paginas.
- Produces: checklist de release com falhas corrigidas antes da entrega.

- [ ] **Step 1: Verificar estrutura HTML**

  Conferir tags abertas e fechadas, scripts sem referencias quebradas, cinco arquivos acessiveis e apenas um `h1` por pagina setorial.

- [ ] **Step 2: Verificar metadados**

  Conferir em cada pagina setorial title, description, canonical, `og:title`, `og:description`, `og:url`, `og:type`, idioma e URLs coerentes com o nome do arquivo.

- [ ] **Step 3: Verificar conteudo e dados estruturados**

  Conferir que cada FAQ JSON-LD corresponde ao FAQ visivel e que nao existem numeros, clientes, logos ou depoimentos nao autorizados.

- [ ] **Step 4: Verificar acessibilidade**

  Conferir labels associados, alt text, foco visivel, botoes/links acionaveis por teclado, contraste de texto e alvos de toque em larguras pequenas.

- [ ] **Step 5: Verificar responsividade**

  Testar as larguras 360, 390, 430, 600, 768, 820, 1024 e 1366px; confirmar ausencia de scroll horizontal, clipping, sobreposicao e FAQ inacessivel.

- [ ] **Step 6: Corrigir falhas e repetir a checagem final**

  Corrigir somente problemas encontrados no conjunto de landing pages e nos links da pagina principal; repetir cada verificacao afetada e registrar o resultado.

## Verification Commands

Use the project directory as the working directory. The commands below are static checks and do not require a backend:

```powershell
Test-Path -LiteralPath "field-service-bancos.html"
Test-Path -LiteralPath "field-service-varejo.html"
Test-Path -LiteralPath "field-service-saude.html"
Test-Path -LiteralPath "field-service-telecom.html"
Test-Path -LiteralPath "field-service-industria.html"
```

Then inspect all six files for:

```text
lang="pt-BR"
<title>
name="description"
property="og:
rel="canonical"
<h1>
application/ld+json
```

The release is acceptable only when every global constraint and every checklist item in Task 6 passes.

## Provenance

Formalized by Open Design from candidate 43a6d3f7-beb9-48c4-a24f-39f62ef17359.
