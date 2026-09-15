# CLAUDE.md — COMIGO

SaaS web (landing + app com sidebar, responsivo, PWA) para consumidor final que escaneia um cosmético e estima **o quanto ele é compatível com uma pessoa** (tipo de pele, sensibilidade, preocupações, preferências, lista de exclusão), explicando os motivos, a evidência e a incerteza. Documentação de produto em `docs/01..05`.

## Princípio do produto (restrição, não sugestão)

> Não dizemos se um cosmético é simplesmente "bom" ou "ruim". Estimamos o quanto ele é compatível com aquela pessoa, explicamos os motivos e deixamos claro o nível de evidência e incerteza.

Se uma decisão técnica ou de produto conflitar com isso, questione antes de implementar.

## Rules

1. **Sempre verifique os plugins disponíveis e use os que forem relevantes para a tarefa atual.**
2. Responda, documente e escreva textos de interface em **português do Brasil**.
3. **Análise antes de código:** para mudanças relevantes, apresente análise/proposta (e atualize `docs/`) antes de implementar. Quando o usuário pedir auditoria, revisão ou proposta, **não implemente — aguarde aprovação**.
4. Questione a ideia quando necessário; não apenas concorde.
5. **A nota é determinística.** Nunca coloque LLM no cálculo de nota, veredito, confiança ou compatibilidade. A IA (`src/server/ai`) só explica o `AnalysisResult` e deve ter fallback sem IA.
6. **Linguagem responsável:** nunca "tóxico", "veneno", "cancerígeno", "cura", "trata". Use linguagem contextual e probabilística. Sem diagnóstico ou alegação médica; oriente procurar profissional de saúde em casos de alergia/reação.
7. **Incerteza visível:** pouca cobertura de ingredientes não pode gerar veredito colorido confiante. Ingrediente desconhecido reduz a confiança, nunca é tratado como "ausente".
8. **Fronteira de módulos:** `src/app → src/server → src/domain`. `src/domain` é TypeScript puro (sem Next, Prisma, fetch ou IA).
9. Mudou normalização, regras padrão ou lógica do motor? **Incremente `ENGINE_VERSION`** em `src/domain/analyze.ts` (invalida o cache de análises) e adicione/ajuste testes.
10. Regras e pesos são dados (`src/domain/config/default-config.ts` + versões no banco). Toda mudança de pontuação precisa de justificativa registrada (nota da versão ou doc).
11. Dados de demonstração devem ser **fictícios**. Nunca atribua composição inventada a produto/marca real.
12. Antes de dizer que terminou: `npm test` e `npx tsc --noEmit` passando; para mudanças de UI, verifique no navegador.
13. Commit/push só quando pedido. Nunca commitar `.env` ou `prisma/dev.db`.

## Comandos

```bash
npm run setup      # prisma db push + seed (134 ingredientes, 16 produtos fictícios)
npm run dev        # http://localhost:3000 — admin em /admin (usuário admin, senha ADMIN_PASSWORD)
npm test           # vitest (testes do domínio)
npx tsc --noEmit   # checagem de tipos
```

## Mapa rápido

- `src/domain/normalization` — INCI bruto → ingrediente canônico (aliases, nomes PT, fuzzy sem trocar números)
- `src/domain/analyze.ts` — regras, dimensões, conflitos, confiança, veredito, explicação
- `src/domain/config` — schema zod + configuração padrão de regras/pesos
- `src/data` — base inicial de ingredientes e catálogo de demonstração
- `src/server/services` — catálogo (pipeline único de ingestão), lookup, análise com cache, perfil
- `src/server/sources` — adaptadores de fontes externas (Open Beauty Facts)

## Armadilhas conhecidas do ambiente

- Windows + PowerShell 5.1: mensagens de commit com aspas quebram argumentos — use `git commit -F <arquivo>`. `Get-Content`/`Set-Content` usam ANSI; prefira as ferramentas de arquivo (UTF-8).
- Prisma + SQLite: **não** use `@default("[]")`/`@default("{}")` em campos `Json` (gera SQL inválido). Envie os valores pelo código.
- Não rode `next build` com o `next dev` ligado (compartilham `.next`); se aparecer `__webpack_require__.C is not a function`, pare o dev, apague `.next` e reinicie.
- Câmera do scanner exige HTTPS (`npx next dev --experimental-https` para testar no celular).
