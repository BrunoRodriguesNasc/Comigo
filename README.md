# Desrotulando Beleza (MVP)

> Escaneie um cosmético e descubra **se ele combina com você** — com os motivos, a evidência e o nível de confiança explicados.

Não é um app de maquiagem virtual nem um "detector de tóxicos". É um motor **determinístico e explicável** de compatibilidade entre produto e pessoa, com IA opcional só para explicar.

## Documentação de produto e arquitetura

| Passo | Documento |
|---|---|
| 1. Análise crítica (riscos, ciência, UX, fora do MVP) | [docs/01-analise-critica.md](docs/01-analise-critica.md) |
| 2. Concorrentes e diferenciação | [docs/02-concorrentes.md](docs/02-concorrentes.md) |
| 3. MVP (MUST / SHOULD / LATER / OUT) | [docs/03-mvp.md](docs/03-mvp.md) |
| 4. Modelo de dados | [docs/04-modelo-de-dados.md](docs/04-modelo-de-dados.md) |
| 5. Arquitetura, regras e scoring | [docs/05-arquitetura.md](docs/05-arquitetura.md) |

## Rodando localmente

Requisitos: Node 20+.

```bash
npm install
```

```bash
cp .env.example .env
```

```bash
npm run setup
```

```bash
npm run dev
```

Abra http://localhost:3000. O seed cria 134 ingredientes e 16 produtos **fictícios** de demonstração (códigos `2000000000015` a `2000000000169`, listados na tela inicial).

- **Admin:** http://localhost:3000/admin — usuário `admin`, senha em `ADMIN_PASSWORD`.
- **IA (opcional):** defina `ANTHROPIC_API_KEY`. Sem chave, resumos e perguntas usam respostas determinísticas.
- **Câmera no celular:** exige HTTPS. Use `npx next dev --experimental-https` ou um túnel; sem HTTPS, digite o código.

```bash
npm test
```

## Como a nota é formada

```
Dados → Normalização → Regras → Análise → Score → (IA explica)
```

- 4 dimensões com peso e base configuráveis: preferências, tipo de pele, objetivos, pontos gerais.
- Cada parcela da nota vem de uma regra com evidência; a soma das parcelas **é** a nota (testado).
- "Não quero" (estrito) gera conflito e limita a nota; "prefiro evitar" só penaliza.
- Ingredientes desconhecidos não penalizam: reduzem a **confiança**.
- Regras e pesos são dados versionados, editáveis em `/admin/regras`.

## Estrutura

```
src/domain/     motor puro (normalização, regras, scoring, explicação) + testes
src/data/       base inicial de ingredientes e catálogo de demonstração
src/server/     Prisma, fontes (Open Beauty Facts), serviços, IA
src/app/        páginas (app + admin) e rotas /api
prisma/         schema e seed
```

## Limitações conhecidas

- A base de ingredientes é uma curadoria inicial e **precisa de revisão por especialista** antes de produção.
- Produtos de demonstração são fictícios. Produtos do Open Beauty Facts entram como "aguardando revisão".
- Concentração não aparece no rótulo: a posição na lista é usada como aproximação.
- Perfil anônimo por dispositivo (sem sync entre aparelhos).
