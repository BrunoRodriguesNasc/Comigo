# Passo 2 — Concorrentes e espaço de diferenciação

Levantamento feito em set/2026 com base em conhecimento prévio e buscas públicas (links no final). Funcionalidades mudam com frequência; validar antes de decisões comerciais.

## Panorama

| Produto | O que faz bem | Personalização | Limitações / oportunidade |
|---|---|---|---|
| **Yuka** (FR, alimentos + cosméticos) | Scan rápido, nota 0–100, alternativas. Enorme base de usuários. | Nenhuma: nota universal. | Nota baseada em "risco" de ingredientes, com viés alarmista em cosméticos (ex.: penaliza conservantes/filtros de forma genérica). Não diz "para você". |
| **INCI Beauty** (FR, forte no BR) | Base grande (>1M produtos), nota 0–20, scanner. | Limitada. | Nota universal; foco em "saudável/ecológico", não em compatibilidade. |
| **INCIDecoder** | Referência em explicação de ingredientes, didático, cita pesquisa. Web-first. | Não tem perfil. | É uma enciclopédia: diz *o que é*, não *se serve para mim*. Scan fraco/inexistente. |
| **SkinSort** | O mais próximo do conceito: match por tipo de pele, flag de alérgenos, comparação. | Sim (tipo de pele, preocupações). | Catálogo muito centrado em EUA/K-beauty; lógica de score pouco explicada; baixa cobertura de produtos brasileiros. |
| **Think Dirty** / **EWG Skin Deep** | Popularizaram "clean beauty". | Baixa. | Base em hazard (perigo) e não em risk (exposição) — o tipo de discurso de medo que queremos evitar. |
| **OnSkin** | Scanner, foto e busca; questionário de pele; base curada por especialistas. | Sim, questionário. | Nota de "segurança" continua universal; personalização vira sugestão de rotina. |
| **Be Clean** (BR, 2026) | Foco no mercado brasileiro, EAN, INCI, nota por ingrediente 0–10. | Baixa. | Enquadramento em "riscos à saúde" / "ingredientes escondidos" — narrativa de medo. |
| **CosDNA / Skincarisma** | Tabelas técnicas (acne/irritação), checagem de listas. | Não. | UX técnica, escalas de comedogenicidade de baixa evidência apresentadas como fato. |
| **Hwahae / Glowpick** (KR) | Catálogo e reviews massivos, ranking por tipo de pele. | Filtros por tipo de pele via reviews. | Mercado coreano; baseado em opinião, não em composição. |

## Padrões observados

1. **Nota universal é a regra.** Quase todos dão uma nota ao *produto*; poucos a uma *combinação produto × pessoa*.
2. **"Seguro/tóxico" domina a narrativa.** Hazard-based scoring gera medo e desconfiança de dermatologistas.
3. **Explicabilidade é rasa.** "Ingrediente vermelho" sem dizer por quê, com qual evidência, e se isso importa para o perfil.
4. **Catálogo brasileiro é o calcanhar de Aquiles** dos estrangeiros.
5. **Incerteza nunca aparece.** Nenhum mostra "confiança da análise" nem trata ingredientes desconhecidos de forma honesta.

## Onde há espaço (posicionamento proposto)

> **"Não diga o que existe no produto. Diga o que isso significa para mim — e o quanto você tem certeza."**

| Diferencial | Como se materializa |
|---|---|
| **Compatibilidade pessoal, não segurança universal** | Mesmo produto, notas diferentes por perfil. Tela de resultado sempre diz "para você". |
| **Conflitos acima da média** | "Evitar" estrito vira bloqueio visível, independentemente da nota. |
| **Explicabilidade auditável** | Cada ponto da nota vem de uma regra com evidência; modo detalhado mostra a conta que fecha. |
| **Honestidade sobre incerteza** | Confiança (alta/média/baixa) baseada em cobertura de ingredientes, origem e verificação do dado. |
| **Linguagem anti-medo** | Nunca "tóxico"; distingue função, benefício, irritação, sensibilização e evidência. |
| **Educação contextual** | Ex.: "Cetyl alcohol não é o álcool que resseca." |
| **Brasil primeiro** | PT-BR, produtos de farmácia/supermercado nacionais, colar INCI quando o EAN não existe. |
| **IA como intérprete, não oráculo** | Perguntas respondidas a partir da análise estruturada, com fallback sem IA. |

## O que NÃO copiar

- Semáforo por ingrediente descontextualizado (Yuka/Think Dirty).
- Escala de comedogenicidade como verdade (CosDNA).
- Ranking por reviews (Hwahae) — outro produto, outro problema.

## Fontes

- [Best Skincare Scanner App in 2026 — HadaBuddy](https://www.hadabuddy.com/blog/best-skincare-scanner-apps-compared)
- [Apps Like INCIDecoder — HadaBuddy](https://www.hadabuddy.com/blog/apps-like-incidecoder)
- [Best Skincare Scanner Apps (2026) — MyCura](https://www.mycura-app.com/best-skincare-scanner-apps.html)
- [Yuka alternatives for skincare — HadaBuddy](https://www.hadabuddy.com/blog/yuka-alternatives-skincare)
- [Be Clean — TechTudo (jul/2026)](https://www.techtudo.com.br/guia/2026/07/be-clean-app-avalia-ingredientes-escondidos-em-cosmeticos-e-riscos-a-saude-edapps.ghtml)
- [OnSkin — App Store BR](https://apps.apple.com/br/app/onskin-scanner-cosm%C3%A9tico/id1630768985)
- [INCI Beauty — TechTudo](https://www.techtudo.com.br/dicas-e-tutoriais/2023/09/inci-beauty-app-analisa-composicao-de-cosmeticos-para-escolhas-mais-saudaveis-um-so-planeta-edqualcomprar.ghtml)

Observação: os artigos da HadaBuddy/MyCura são de concorrentes comparando a si mesmos — usados só para mapear funcionalidades, não como avaliação neutra.
