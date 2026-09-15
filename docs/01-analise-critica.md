# Passo 1 — Análise crítica da ideia

> Princípio-guia: não dizer se um cosmético é "bom" ou "ruim", e sim **estimar compatibilidade com uma pessoa**, explicar os motivos e deixar claro o nível de evidência e incerteza.

## 1. O maior risco não é técnico: é DADO

| Risco | Por que importa | Mitigação no MVP |
|---|---|---|
| **Cobertura de catálogo (barcode → INCI)** | No Brasil não existe base pública completa de INCI por EAN. Se 7 em cada 10 scans retornarem "não encontrado", o produto morre. | (a) Colar/digitar a lista de ingredientes como caminho de primeira classe; (b) adaptador Open Beauty Facts como fonte externa; (c) fila de "produto enviado pelo usuário" para revisão no admin. OCR fica para depois. |
| **INCI desatualizado** | Marcas reformulam sem mudar EAN. Mostrar composição antiga com confiança alta é enganoso. | Cada produto guarda `source`, `sourceUrl`, `verifiedAt`, `reviewStatus`. A tela mostra a origem e a data. Dados não verificados reduzem a confiança. |
| **Mesmo EAN, variações (tons de base)** | Tons diferentes podem ter pigmentos diferentes (CI 77491 etc.). | Aceitável no MVP: pigmentos raramente mudam a avaliação. Documentado como limitação. |
| **Base de ingredientes é trabalho editorial** | Existem ~30 mil INCIs. Cada ficha exige curadoria. | Começar com os ~80–150 ingredientes que respondem pela maior parte das decisões (hidratantes, ativos, fragrâncias/alérgenos, álcoois, óleos, conservantes, filtros). Ingrediente desconhecido **não é penalizado**: reduz a confiança. |
| **Licenciamento** | Copiar fichas do INCIDecoder/CosDNA/EWG é violação de direitos. | Base própria; fontes citáveis (CosIng/UE, Regulamento 1223/2009 Anexo III, CIR, literatura). Open Beauty Facts é ODbL (exige atribuição e share-alike da base derivada). |

## 2. Problemas científicos (onde a ideia original precisa ser questionada)

1. **Concentração não aparece no rótulo.** O INCI é ordenado por concentração decrescente só acima de 1%. Niacinamida na 25ª posição provavelmente não entrega benefício relevante. → O motor aplica **fator de posição**: ativos no fim da lista contam menos e a explicação diz "pode estar em baixa concentração".
2. **"Comedogênico" tem evidência fraca.** As escalas 0–5 vêm de testes em orelha de coelho dos anos 70–80, com ingredientes puros e em concentração alta. Não dá para afirmar "este produto vai causar acne". → Tratado como **ponto de atenção de baixa evidência**, nunca como bloqueio, e só para perfis com acne/cravos.
3. **Irritação é dependente de dose, veículo e pessoa.** Fragrância é um alérgeno de contato bem documentado, mas a maioria das pessoas tolera. → Linguagem probabilística ("pode", "em algumas pessoas") e peso maior apenas para perfil sensível.
4. **Fórmula ≠ soma dos ingredientes.** pH, veículo, encapsulamento e sinergias importam e não são observáveis. → Nível de **confiança** explícito em toda análise; o score é uma *estimativa de compatibilidade*, não uma medição de eficácia.
5. **"Natural", "clean", "sem químicos", "tóxico"** são categorias de marketing, não científicas. → O app não usa essas palavras como critério.
6. **Vegano / cruelty-free** são declarações da marca, raramente verificáveis pela composição. → Tratados como atributos do produto com origem, nunca inferidos de ingrediente. Quando não há informação: "não informado" (sem penalidade).
7. **Álcool ≠ álcool.** Cetyl/Cetearyl alcohol são álcoois graxos emolientes; *Alcohol Denat.* é o que pode ressecar. A preferência "sem álcool" precisa dessa distinção — ótimo momento educativo.

## 3. Problemas de produto / UX

- **Uma nota 0–100 induz precisão falsa.** 87 vs 84 não significa nada. → Mostrar a nota, mas a **faixa (veredito) é a mensagem principal**, sempre acompanhada da confiança. Abaixo de uma cobertura mínima, a nota vira "análise parcial".
- **Conflito precisa vencer a média.** Um produto 85/100 com fragrância para quem marcou "não quero fragrância" não pode aparecer verde. → *Hard blockers* limitam a nota e mudam o veredito, sempre visíveis no topo.
- **"Evitar" tem dois níveis.** "Não posso usar" (alergia diagnosticada) ≠ "prefiro evitar". → Cada preferência tem `strict` ou `soft`.
- **Onboarding longo mata conversão.** → 3 telas: tipo de pele (com "não sei"), preocupações, o que evitar. Tudo editável depois. Quem pula recebe análise genérica com aviso.
- **Scanner em web/PWA**: câmera exige HTTPS; iOS Safari não tem `BarcodeDetector`. → Detector nativo quando existir, fallback ZXing (JS), e digitação manual do código sempre disponível.
- **Alternativas dependem de catálogo denso** na mesma categoria. Com catálogo pequeno a feature parece quebrada. → Só exibir quando houver ≥1 alternativa com nota maior; nunca inventar.

## 4. Problemas de arquitetura

- **LLM no caminho crítico** = custo, latência, não determinismo e alucinação. → Score 100% determinístico e testado; LLM apenas reescreve/responde **a partir do JSON da análise**, sob demanda, com fallback sem IA.
- **Reprodutibilidade**: a mesma análise precisa dar o mesmo resultado. → Cada análise grava `engineVersion`, hash do perfil e versão das regras.
- **Regras hardcoded no código** impedem curadoria. → Regras e pesos em dados (JSON validado por schema), editáveis no admin, com testes cobrindo o conjunto padrão.
- **Microservices** não se justificam: um monólito modular em Next.js com domínio puro isolado (`src/domain`) é suficiente e barato.

## 5. Riscos regulatórios e de responsabilidade

- Não fazer alegações médicas (tratar/curar acne, prevenir câncer). A ANVISA regula cosméticos; recomendação de uso terapêutico é campo médico.
- Disclaimer fixo e contextual: "Informação educativa, não substitui avaliação dermatológica". Se o usuário marcar alergia/reação, orientar a procurar profissional de saúde.
- LGPD: tipo de pele e sensibilidades podem ser considerados **dados de saúde (sensíveis)**. → No MVP, perfil anônimo por dispositivo, sem e-mail; consentimento explícito antes de salvar; opção de apagar tudo.
- Conflito de interesse: se no futuro houver afiliados/marcas pagantes, a nota **não pode** ser influenciada. Registrar isso como regra de produto desde já.

## 6. Fora do MVP (e por quê)

| Funcionalidade | Motivo |
|---|---|
| OCR da lista de ingredientes | Alto esforço/erro; "colar texto" resolve 80% com 5% do custo. Fica em LATER. |
| Rede social, reviews, rotinas | Diluem o foco e trazem moderação. |
| Preço/disponibilidade em lojas | Exige integrações comerciais. |
| Análise de rotina (interação entre produtos, ex. retinoide + ácidos) | Valiosa, mas precisa de base madura. LATER. |
| Contas com login/senha | Perfil anônimo por dispositivo basta para validar. Contas entram quando houver sync entre dispositivos. |
| Recomendações por foto do rosto | Fora do conceito e com risco de viés/privacidade. |
