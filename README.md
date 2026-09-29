# Site institucional NovaSync

Site estático em HTML, CSS e JavaScript. Versão validada em setembro de 2026.

- Publicação: GitHub Pages, branch `Site`, diretório raiz.
- Domínio: https://nova-sync.net (CNAME preservado).
- Entrada: `index.html`; sete páginas setoriais, política, confirmação e 404.
- Cadastro técnico: envio em JSON para o sistema (`https://app.nova-sync.net/api/inscricoes`, contrato em `docs/inscricoes-formulario-site.md` do novasync-app). A inscrição espera aprovação em Técnicos → Inscrições; aprovado, o técnico recebe o e-mail com o código de primeiro acesso. Endereço consultado por CEP no ViaCEP, com preenchimento manual disponível.
- Não armazenar credenciais ou cadastros reais neste repositório.

## Validação da entrega

Revisão desktop/mobile, links internos, formulário obrigatório, consulta real de CEP, FAQs por teclado e 404 em URL aninhada. Doze testes locais de validação/CEP aprovados. Os exemplos setoriais são ilustrativos. Quantidades do mapa são de referência, sem atualização em tempo real.

O envio real até a plataforma deve ser conferido em Técnicos → Inscrições; os testes locais usam a API simulada.

Materiais antigos de design, capturas, planilhas, vídeos e rascunhos foram retirados da árvore publicada e permanecem no histórico do Git.
