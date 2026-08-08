# Especificacao: Landing pages setoriais de Field Service

## Status

Validada pelo usuario em 07/08/2026. Este documento registra a direcao aprovada; a implementacao sera feita em uma etapa posterior.

## Objetivo

Criar paginas dedicadas para setores com alta demanda de Field Service no Brasil, ampliando a relevancia organica para buscas relacionadas a "setor field service brasil" sem produzir paginas rasas ou duplicadas.

## Escopo inicial

Criar cinco paginas estaticas dedicadas:

- Bancos e Fintechs: `field-service-bancos.html`
- Varejo: `field-service-varejo.html`
- Saude: `field-service-saude.html`
- Telecom: `field-service-telecom.html`
- Industria: `field-service-industria.html`

Transporte e Eventos ficam fora do primeiro lote e permanecem como candidatos para uma segunda fase.

## Arquitetura

Usar um template visual e estrutural compartilhado, com conteudo editorial especifico em cada arquivo. Cada pagina deve ser autonomamente acessivel e possuir:

- `title`, meta description, canonical e metadados Open Graph proprios.
- Um unico `h1` alinhado a intencao de busca do setor.
- Hero com proposta de valor especifica, CTA principal e cobertura nacional.
- Secao de dores operacionais do setor.
- Servicos, ativos e cenarios de campo prioritarios para aquele segmento.
- Fluxo em quatro etapas: briefing da demanda, designacao de tecnico, execucao em campo, relatorio e fechamento.
- Prova social com depoimentos e logos ja autorizados, sem inventar novos clientes ou resultados.
- Metricas permitidas: SLA de ate 2 dias uteis e tempo medio de 1 dia util.
- FAQ setorial com dados estruturados `FAQPage`, quando as perguntas e respostas forem realmente especificas.
- CTA para abertura de demanda e/ou cadastro tecnico.

## Conteudo e SEO

O texto deve priorizar clareza comercial e especificidade operacional. A expressao-alvo e variacoes semanticas devem aparecer naturalmente no title, introducao, headings e corpo, sem repeticao artificial.

Cada pagina precisa diferenciar-se por:

- Problemas de operacao e conformidade proprios do setor.
- Tipos de equipamentos, unidades e chamados atendidos.
- Criterios de urgencia, disponibilidade e rastreabilidade relevantes.
- Exemplos de resultados apenas quando houver dado aprovado; caso contrario, usar linguagem descritiva sem numero inventado.

Os links da secao de setores em `novasync-field-service-2.html` devem apontar para as paginas correspondentes.

## Direcao visual

Preservar a identidade visual atual da NovaSync: fundo escuro, tipografia e componentes existentes, contraste acessivel, CTA destacado com parcimonia e layout responsivo. O template deve funcionar em desktop, tablet e celular sem depender de imagens novas.

As paginas devem reutilizar os assets locais existentes quando necessario, incluindo logo e logos de parceiros, mantendo as cores originais dos logos e o fundo atual da prova social.

## Acessibilidade e interacao

- Navegacao por teclado e foco visivel.
- Contraste auditado para texto, links, botoes e superficies.
- Alvos de toque adequados no mobile.
- Alt text nas imagens reais.
- Hierarquia semantica de headings.
- FAQ expansivel sem bloquear o restante da pagina.

## Criterios de verificacao

Verificar o conjunto e cada pagina individualmente:

1. Arquivo abre sem erros de HTML e sem scripts quebrados.
2. Links entre pagina principal e paginas setoriais funcionam.
3. Title, description, canonical, Open Graph e idioma estao presentes.
4. Existe apenas um `h1` por pagina e a hierarquia e coerente.
5. O conteudo setorial nao e uma simples copia com troca de titulo.
6. FAQ e JSON-LD, quando usados, correspondem ao conteudo visivel.
7. Contraste, foco, responsividade e ausencia de overflow horizontal estao adequados.
8. Nenhum numero, cliente, depoimento ou logo novo e fabricado.

## Fora de escopo

- Criar backend, CMS ou sistema de roteamento.
- Adicionar novos setores alem dos cinco do lote inicial.
- Produzir novas imagens ou logos.
- Prometer metricas nao fornecidas ou resultados garantidos.
- Refatorar a pagina principal fora dos links e ajustes diretamente necessarios para a nova navegacao.
