# Passo 3 — Especificação do MVP

**Hipótese a validar:** "Escaneei → o app entendeu meu perfil → agora sei se vale a pena comprar" é útil e confiável o suficiente para a pessoa voltar a usar.

**Métricas:** % de scans com produto encontrado; % de análises com confiança ≥ média; retorno em 7 dias; cliques em "ver análise completa"; uso de "colar ingredientes".

## MUST HAVE

**Usuário**
- Perfil anônimo por dispositivo (cookie), com consentimento para salvar dados de pele e botão "apagar meus dados".
- Onboarding em 3 passos: tipo de pele (inclui "sensível" como eixo separado e "não sei"), preocupações, preferências/o que evitar (com estrito × prefiro evitar). Pulável. Editável.
- Busca e adição de ingredientes à lista pessoal de exclusão (por ingrediente ou por grupo: fragrância, óleos essenciais, álcool secante).
- Scanner de código de barras (BarcodeDetector → fallback ZXing) + digitação manual.
- Lookup: catálogo local → Open Beauty Facts → "não encontrado".
- **Colar lista de ingredientes** quando não encontrado (análise avulsa) + envio para revisão.
- Normalização de ingredientes (aliases, acentos, parênteses, OCR/typos com fuzzy match e confiança).
- Motor de regras + score determinístico e configurável, com hard blockers e confiança.
- Resultado: nota "para você", veredito, contagem ✓/⚠/✕, motivos, ingredientes explicados em linguagem simples, origem dos dados, disclaimer.
- Modo detalhado: contribuição de cada regra, por dimensão, fechando a conta.
- Histórico de análises.

**Admin (protegido por senha)**
- CRUD simples de produtos, ingredientes, aliases.
- Editor de regras e pesos (JSON validado).
- Fila de revisão (envios de usuários e produtos importados não verificados) com aprovar/rejeitar.
- Lista de ingredientes não reconhecidos mais frequentes (o backlog editorial).

## SHOULD HAVE (entra no MVP se couber — neste repositório: sim)
- Favoritos.
- Comparação de 2 produtos com recomendação determinística.
- Alternativas na mesma categoria com nota maior para o perfil.
- Explicação em linguagem natural e perguntas ao produto via LLM (opcional, fallback sem IA).
- PWA instalável (manifest + service worker simples).
- Importação em lote (JSON) no admin.

## LATER
- OCR da lista de ingredientes (foto do rótulo).
- Contas com login e sync entre dispositivos.
- Análise de rotina (interações entre produtos).
- Filtros de alternativas por preço/marca/acabamento; disponibilidade em lojas.
- Mais fontes de dados (parcerias com marcas/varejo, CSV de fabricantes).
- Base de ingredientes ampla (500+) com processo editorial e revisão por especialista.
- i18n (ES/EN).
- Observabilidade avançada (tracing), testes E2E.

## OUT OF SCOPE
- Maquiagem virtual, filtros, análise por foto do rosto.
- Rede social, reviews, influenciadores.
- Diagnóstico, recomendação terapêutica, alegações médicas.
- Nota universal "segurança/toxicidade" do produto.
- Qualquer influência comercial sobre a nota.

## Critérios de aceite do fluxo principal
1. Com perfil "oleosa + acne + sensível + evitar fragrância (estrito)", um produto com `Parfum` aparece com veredito de conflito e o motivo no topo, mesmo que o resto da fórmula seja bom.
2. O mesmo produto para "seca, sem sensibilidade, sem restrições" recebe nota maior.
3. `Nicotinamide` e `Niacinamide` resolvem para o mesmo ingrediente.
4. `Cetearyl Alcohol` não dispara a preferência "sem álcool".
5. Uma lista com metade dos ingredientes desconhecidos exibe confiança baixa.
6. A soma das contribuições do modo detalhado é igual à nota exibida.
7. O app funciona sem `ANTHROPIC_API_KEY`.
