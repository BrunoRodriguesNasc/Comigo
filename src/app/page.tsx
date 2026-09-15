import Link from "next/link";
import { IconArrowRight, IconCheck, IconClipboard, IconEye, IconScan, IconShield, IconUser } from "@/components/icons";
import { ButtonLink, Card, IconBubble, Logo, ScoreRing, VerdictBadge, type Tone } from "@/components/ui";

const STEPS: { icon: typeof IconUser; title: string; text: string; tone: Tone }[] = [
  { icon: IconUser, title: "Conte sobre você", text: "Tipo de pele, sensibilidade, objetivos e o que você prefere evitar. Leva cerca de 1 minuto.", tone: "lilac" },
  { icon: IconScan, title: "Analise o produto", text: "Escaneie o código de barras na loja, digite o código ou cole a lista de ingredientes.", tone: "peach" },
  { icon: IconEye, title: "Entenda com calma", text: "Uma avaliação para você, com os motivos, os pontos de atenção e o nível de confiança.", tone: "sage" },
];

const DIFFERENTIALS: { icon: typeof IconUser; title: string; text: string; tone: Tone }[] = [
  { icon: IconUser, title: "Feito para você, não para todo mundo", text: "O mesmo produto pode ser ótimo para uma pessoa e pouco indicado para outra. Tudo parte do seu perfil.", tone: "lilac" },
  { icon: IconClipboard, title: "Cada ponto tem um porquê", text: "Você vê de onde vem a nota: regras com evidência registrada, nada de caixa-preta.", tone: "butter" },
  { icon: IconShield, title: "Honesto quando não sabe", text: "Se reconhecemos poucos ingredientes, a gente conta — em vez de dar um veredito sem base.", tone: "sage" },
  { icon: IconCheck, title: "Sem terrorismo de rótulo", text: "Nada de “tóxico” ou “veneno”. Explicamos função, benefício e sensibilidade com carinho e contexto.", tone: "blush" },
];

const FAQ = [
  {
    q: "O COMIGO diz se um cosmético é seguro?",
    a: "Não. O COMIGO estima o quanto um produto é compatível com o seu perfil e explica os motivos. É uma informação educativa e não substitui a orientação de um dermatologista.",
  },
  {
    q: "Preciso criar uma conta?",
    a: "Não. Seu perfil fica associado ao seu dispositivo, sem nome ou e-mail, e você pode apagar tudo quando quiser.",
  },
  {
    q: "De onde vêm os dados dos produtos?",
    a: "De um catálogo próprio, de bases abertas como o Open Beauty Facts e de listas enviadas pela comunidade — sempre com a origem indicada no resultado.",
  },
  {
    q: "Vocês usam inteligência artificial?",
    a: "A nota é calculada por regras transparentes. A IA, quando ativada, só ajuda a explicar o resultado em linguagem simples e a responder dúvidas a partir da análise.",
  },
];

function Blob({ className }: { className: string }) {
  return <div aria-hidden className={`pointer-events-none absolute rounded-full blur-3xl ${className}`} />;
}

export default function LandingPage() {
  return (
    <div className="overflow-hidden bg-ground">
      <header className="sticky top-0 z-30 bg-ground/80 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Logo />
          <nav className="hidden items-center gap-8 text-sm font-semibold text-ink-soft md:flex">
            <a href="#como-funciona" className="hover:text-accent">
              Como funciona
            </a>
            <a href="#diferenciais" className="hover:text-accent">
              Por que o COMIGO
            </a>
            <a href="#perguntas" className="hover:text-accent">
              Dúvidas
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <ButtonLink href="/painel" variant="ghost" className="hidden sm:inline-flex">
              Entrar no app
            </ButtonLink>
            <ButtonLink href="/perfil">Começar</ButtonLink>
          </div>
        </div>
      </header>

      <section className="relative">
        <Blob className="-left-32 top-10 h-80 w-80 bg-peach/80" />
        <Blob className="right-0 -top-20 h-96 w-96 bg-lilac/90" />
        <Blob className="bottom-0 left-1/3 h-72 w-72 bg-sage/80" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-4 pb-20 pt-10 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:pb-28 lg:pt-16">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-surface/80 px-4 py-1.5 text-sm font-bold text-accent-strong shadow-sm ring-1 ring-white">
              🌿 skincare com clareza e carinho
            </span>
            <h1 className="mt-6 text-5xl font-semibold leading-[1.05] text-ink sm:text-6xl">
              O cosmético que combina <em className="font-medium italic text-accent">com você</em>.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft">
              O COMIGO olha os ingredientes, a sua pele e as suas preferências — e te explica, de um jeito leve, o que vale a pena e o que merece
              atenção.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <ButtonLink href="/perfil" className="px-7 py-3.5 text-base">
                Criar meu perfil
                <IconArrowRight className="h-4 w-4" />
              </ButtonLink>
              <ButtonLink href="/painel" variant="secondary" className="px-7 py-3.5 text-base">
                Espiar o app
              </ButtonLink>
            </div>
            <p className="mt-5 text-sm font-semibold text-muted">✿ Sem cadastro com e-mail · funciona no computador e no celular</p>
          </div>

          <div className="relative mx-auto w-full max-w-md">
            <div aria-hidden className="absolute -right-4 -top-6 rotate-6 rounded-2xl bg-butter px-3 py-2 text-sm font-bold text-caution shadow-md">
              ✨ sem fragrância
            </div>
            <div aria-hidden className="absolute -bottom-5 -left-6 -rotate-6 rounded-2xl bg-sage px-3 py-2 text-sm font-bold text-good shadow-md">
              🌿 feito pra pele oleosa
            </div>
            <Card className="p-0 shadow-[0_30px_60px_-30px_rgba(124,90,147,0.45)]">
              <div className="flex items-center justify-between px-6 pb-3 pt-5">
                <div>
                  <p className="text-xs font-semibold text-muted">Pele Viva (demo)</p>
                  <p className="font-display text-lg font-semibold">Gel Hidratante Oil Control</p>
                </div>
                <span className="rounded-full bg-ground px-2.5 py-1 text-[11px] font-bold text-muted">exemplo</span>
              </div>
              <div className="mx-4 flex items-center gap-5 rounded-2xl bg-good-soft/70 p-4">
                <ScoreRing score={88} verdict="excellent" size={96} />
                <div>
                  <VerdictBadge verdict="excellent" />
                  <p className="mt-2 font-semibold leading-snug">Ótima compatibilidade com seu perfil.</p>
                </div>
              </div>
              <ul className="space-y-3 px-6 py-5 text-sm">
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-good-soft text-xs font-bold text-good">✓</span>
                  Niacinamida pode ajudar no controle da oleosidade
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-good-soft text-xs font-bold text-good">✓</span>
                  Sem fragrância, como você prefere
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-caution-soft text-xs font-bold text-caution">!</span>
                  Evidência moderada para acne — não substitui tratamento
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </section>

      <section id="como-funciona" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-20 sm:px-6">
        <div className="text-center">
          <p className="text-sm font-bold text-accent">como funciona</p>
          <h2 className="mt-2 text-4xl font-semibold">Do rótulo a uma escolha tranquila</h2>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <Card key={s.title} className="p-7 text-center">
              <IconBubble tone={s.tone} className="mx-auto h-14 w-14 rounded-3xl">
                <s.icon className="h-6 w-6" />
              </IconBubble>
              <p className="mt-4 text-xs font-bold text-muted">passo {i + 1}</p>
              <h3 className="mt-1 text-xl font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{s.text}</p>
            </Card>
          ))}
        </div>
      </section>

      <section id="diferenciais" className="relative scroll-mt-24">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="rounded-[2.5rem] bg-gradient-to-br from-lilac/70 via-blush/50 to-peach/70 px-6 py-14 sm:px-12">
            <p className="text-sm font-bold text-accent-strong">por que o COMIGO</p>
            <h2 className="mt-2 max-w-2xl text-4xl font-semibold leading-tight">Não só o que tem no produto. O que isso significa para você.</h2>
            <div className="mt-10 grid gap-5 sm:grid-cols-2">
              {DIFFERENTIALS.map((d) => (
                <div key={d.title} className="flex gap-4 rounded-3xl bg-surface/85 p-5 ring-1 ring-white">
                  <IconBubble tone={d.tone}>
                    <d.icon />
                  </IconBubble>
                  <div>
                    <h3 className="text-lg font-semibold">{d.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-ink-soft">{d.text}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 grid gap-6 rounded-3xl bg-surface p-6 md:grid-cols-[1fr_auto_auto] md:items-center">
              <div>
                <p className="font-display text-xl font-semibold">O mesmo produto, duas pessoas 💞</p>
                <p className="mt-1 text-sm text-ink-soft">Uma base de demonstração com fragrância, avaliada para perfis diferentes.</p>
              </div>
              <div className="flex items-center gap-3">
                <ScoreRing score={40} verdict="conflict" size={64} />
                <div className="text-sm">
                  <p className="font-bold">Pessoa A</p>
                  <p className="text-xs text-muted">oleosa, sensível, sem fragrância</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <ScoreRing score={82} verdict="good" size={64} />
                <div className="text-sm">
                  <p className="font-bold">Pessoa B</p>
                  <p className="text-xs text-muted">seca, sem restrições</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="perguntas" className="mx-auto max-w-3xl scroll-mt-24 px-4 py-16 sm:px-6">
        <h2 className="text-center text-4xl font-semibold">Dúvidas frequentes</h2>
        <div className="mt-10 space-y-3">
          {FAQ.map((f) => (
            <details key={f.q} className="group rounded-3xl border border-line/80 bg-surface px-6 py-5">
              <summary className="flex items-center justify-between gap-4 font-bold">
                {f.q}
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="relative px-4 pb-20 pt-6 sm:px-6">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] bg-accent px-8 py-14 text-center text-white">
          <Blob className="-left-10 -top-10 h-56 w-56 bg-blush/40" />
          <Blob className="-bottom-16 right-0 h-64 w-64 bg-peach/40" />
          <div className="relative">
            <p className="text-3xl" aria-hidden>
              🌸
            </p>
            <h2 className="mt-3 text-4xl font-semibold">Vamos cuidar da sua pele juntos?</h2>
            <p className="mt-3 text-white/80">Crie seu perfil e analise o primeiro produto em um minutinho.</p>
            <Link
              href="/perfil"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 font-bold text-accent-strong shadow-lg transition hover:bg-accent-soft"
            >
              Começar agora
              <IconArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-line/70">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 text-sm text-muted sm:px-6 md:flex-row md:items-center md:justify-between">
          <Logo />
          <p className="max-w-xl">
            Informação educativa sobre compatibilidade de cosméticos. Não é diagnóstico e não substitui a orientação de um dermatologista.
          </p>
        </div>
      </footer>
    </div>
  );
}
