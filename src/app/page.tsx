import Link from "next/link";
import { Bottle, Droplet, HeartMark, Jar, Sparkle, Sprig } from "@/components/illustrations";
import { ButtonLink, Eyebrow, Logo, ScoreRing } from "@/components/ui";

const STEPS = [
  { n: "01", title: "Conte sobre você", text: "Tipo de pele, sensibilidade, o que você quer cuidar e o que prefere evitar. Leva um minutinho.", art: Droplet },
  { n: "02", title: "Mostre o produto", text: "Escaneie o código de barras na loja, digite os números ou cole a lista de ingredientes.", art: Bottle },
  { n: "03", title: "Escolha com calma", text: "Você recebe uma leitura feita para a sua pele, com os motivos e os pontos de atenção.", art: Jar },
];

const PRINCIPLES = [
  { title: "Feito para você", text: "O mesmo produto pode ser perfeito para uma pessoa e pouco indicado para outra. Tudo começa pelo seu perfil." },
  { title: "Cada motivo à vista", text: "Você entende por que um produto combina — ou não — com você. Sem mistério." },
  { title: "Honesto quando não sabe", text: "Se não reconhecemos ingredientes suficientes, a gente diz. Preferimos clareza a certezas inventadas." },
  { title: "Sem terrorismo de rótulo", text: "Nada de “tóxico” ou “veneno”. Falamos de pele, de preferências e de evidência — com carinho." },
];

const FAQ = [
  {
    q: "O comigo diz se um cosmético é seguro?",
    a: "Não. A gente mostra o quanto um produto combina com o seu perfil e explica os motivos. É uma informação educativa e não substitui a orientação de um dermatologista.",
  },
  {
    q: "Preciso criar uma conta?",
    a: "Não. Seu perfil fica guardado no seu dispositivo, sem nome ou e-mail, e você pode apagar tudo quando quiser.",
  },
  {
    q: "Como a avaliação é feita?",
    a: "Cruzamos os ingredientes do produto com o seu perfil usando critérios transparentes e baseados em evidência. Em cada resultado, você vê os motivos e o quanto temos certeza.",
  },
  {
    q: "De onde vêm os dados dos produtos?",
    a: "De um catálogo próprio, de bases abertas como o Open Beauty Facts e de listas enviadas pela comunidade — sempre com a origem indicada.",
  },
];

const TAGS = ["pele sensível", "sem fragrância", "pele oleosa", "manchas", "hidratação", "cruelty-free", "pele seca"];

export default function LandingPage() {
  return (
    <div className="bg-ground text-ink">
      <p className="bg-blush px-4 py-2.5 text-center text-xs tracking-wide text-ink">
        Cosméticos avaliados para a sua pele — não para todo mundo.
      </p>

      <header className="border-b border-line">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between gap-6 px-5 sm:px-8">
          <Logo />
          <nav className="hidden items-center gap-9 text-sm text-ink-soft md:flex">
            <a href="#como-funciona" className="hover:text-ink">
              Como funciona
            </a>
            <a href="#filosofia" className="hover:text-ink">
              Nossa filosofia
            </a>
            <a href="#duvidas" className="hover:text-ink">
              Dúvidas
            </a>
          </nav>
          <div className="flex items-center gap-5">
            <Link href="/painel" className="hidden text-sm text-ink-soft hover:text-ink sm:inline">
              Entrar
            </Link>
            <ButtonLink href="/perfil" className="px-5 py-2.5">
              Começar
            </ButtonLink>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-16 px-5 pb-24 pt-16 sm:px-8 lg:grid-cols-[1.1fr_1fr] lg:pb-32 lg:pt-24">
        <div>
          <Eyebrow>Beleza que te entende</Eyebrow>
          <h1 className="mt-5 text-6xl leading-[0.98] sm:text-7xl lg:text-[88px]">
            Feito <em className="text-rose">para você</em>, do rótulo à sua pele.
          </h1>
          <p className="mt-8 max-w-lg text-lg leading-relaxed text-ink-soft">
            Mostre um cosmético e descubra, com calma e clareza, se ele combina com a sua pele e com o que você prefere evitar.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-6">
            <ButtonLink href="/perfil" className="px-8 py-4 text-[15px]">
              Criar meu perfil
            </ButtonLink>
            <a href="#como-funciona" className="text-[15px] text-ink underline decoration-line underline-offset-4 hover:decoration-ink">
              Ver como funciona
            </a>
          </div>
          <p className="mt-6 text-sm text-muted">Sem cadastro com e-mail. No celular, na loja, na hora da escolha.</p>
        </div>

        <div className="relative mx-auto h-[460px] w-full max-w-md" aria-hidden>
          <div className="absolute inset-x-10 bottom-0 top-0 rounded-t-full bg-blush" />
          <div className="absolute -right-2 top-16 h-32 w-32 rounded-full bg-peach" />
          <div className="absolute -left-4 bottom-16 h-44 w-44 rounded-full bg-sage" />
          <Bottle className="absolute bottom-0 left-1/2 h-80 -translate-x-1/2 text-ink" />
          <Sprig className="absolute bottom-10 left-0 h-52 text-ink" />
          <Sparkle className="absolute right-12 top-8 h-6 w-6 text-rose" />
          <Sparkle className="absolute left-16 top-28 h-3.5 w-3.5 text-ink/60" />

          <div className="absolute -right-3 bottom-14 w-60 -rotate-3 rounded-[22px] bg-surface p-4 ring-1 ring-line sm:-right-8">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted">Para você</p>
            <p className="mt-1 font-display text-2xl leading-tight">Combina com você</p>
            <p className="mt-2 flex items-center gap-2 text-xs text-ink-soft">
              <span className="h-1.5 w-1.5 rounded-full bg-good" /> sem fragrância, como você prefere
            </p>
            <p className="mt-1 flex items-center gap-2 text-xs text-ink-soft">
              <span className="h-1.5 w-1.5 rounded-full bg-good" /> ajuda na hidratação
            </p>
          </div>
        </div>
      </section>

      <div className="border-y border-line py-5">
        <p className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-5 gap-y-2 px-5 font-display text-2xl italic text-ink-soft">
          {TAGS.map((t, i) => (
            <span key={t} className="inline-flex items-center gap-5">
              {t}
              {i < TAGS.length - 1 && <Sparkle className="h-3 w-3 text-rose" />}
            </span>
          ))}
        </p>
      </div>

      <section id="como-funciona" className="mx-auto max-w-6xl scroll-mt-10 px-5 py-28 sm:px-8">
        <div className="max-w-2xl">
          <Eyebrow>Como funciona</Eyebrow>
          <h2 className="mt-4 text-5xl leading-[1.05] sm:text-6xl">Três passos até uma escolha tranquila.</h2>
        </div>
        <ol className="mt-16 grid gap-14 md:grid-cols-3 md:gap-10">
          {STEPS.map((s) => (
            <li key={s.n} className="border-t border-ink/15 pt-8">
              <div className="flex items-start justify-between">
                <span className="font-display text-6xl leading-none text-rose">{s.n}</span>
                <s.art className="h-20 w-20 text-ink" />
              </div>
              <h3 className="mt-8 text-3xl">{s.title}</h3>
              <p className="mt-3 leading-relaxed text-ink-soft">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section id="filosofia" className="scroll-mt-10 bg-sand/60">
        <div className="mx-auto grid max-w-6xl gap-16 px-5 py-28 sm:px-8 lg:grid-cols-[1fr_1fr]">
          <div>
            <Eyebrow>Nossa filosofia</Eyebrow>
            <p className="mt-6 font-display text-5xl leading-[1.08] sm:text-6xl">
              “Não existe produto bom para todo mundo. Existe produto bom <em className="text-rose">para você</em>.”
            </p>
            <Sprig className="mt-10 h-28 text-ink" />
          </div>
          <ul className="divide-y divide-ink/10 self-end border-y border-ink/10">
            {PRINCIPLES.map((p) => (
              <li key={p.title} className="py-7">
                <h3 className="flex items-center gap-3 text-2xl">
                  <HeartMark className="h-3 w-3 text-rose" />
                  {p.title}
                </h3>
                <p className="mt-2 pl-6 leading-relaxed text-ink-soft">{p.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-28 sm:px-8">
        <div className="max-w-2xl">
          <Eyebrow>O mesmo produto, duas peles</Eyebrow>
          <h2 className="mt-4 text-5xl leading-[1.05]">Por isso a gente pergunta sobre você.</h2>
          <p className="mt-4 text-ink-soft">Uma base de demonstração, com fragrância, avaliada para duas pessoas diferentes.</p>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-2">
          <article className="rounded-[32px] bg-bad-soft px-8 py-10">
            <div className="flex items-center justify-between gap-6">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted">Pele oleosa e sensível · evita fragrância</p>
                <p className="mt-3 font-display text-4xl leading-tight">Tem algo que ela prefere evitar</p>
              </div>
              <ScoreRing score={40} verdict="conflict" size={88} />
            </div>
          </article>
          <article className="rounded-[32px] bg-good-soft px-8 py-10">
            <div className="flex items-center justify-between gap-6">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted">Pele seca · sem restrições</p>
                <p className="mt-3 font-display text-4xl leading-tight">Combina com ela</p>
              </div>
              <ScoreRing score={82} verdict="good" size={88} />
            </div>
          </article>
        </div>
      </section>

      <section id="duvidas" className="mx-auto max-w-3xl scroll-mt-10 px-5 pb-28 sm:px-8">
        <h2 className="text-center text-5xl">Dúvidas frequentes</h2>
        <div className="mt-12 divide-y divide-line border-y border-line">
          {FAQ.map((f) => (
            <details key={f.q} className="group py-6">
              <summary className="flex items-center justify-between gap-6 text-lg">
                {f.q}
                <span className="shrink-0 font-display text-3xl leading-none text-rose transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-4 max-w-2xl leading-relaxed text-ink-soft">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="px-5 pb-24 sm:px-8">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[44px] bg-blush px-8 py-20 text-center">
          <Sprig className="absolute -left-2 bottom-0 hidden h-48 text-ink sm:block" />
          <Jar className="absolute -right-2 bottom-4 hidden h-32 w-32 text-ink sm:block" />
          <h2 className="mx-auto max-w-2xl text-5xl leading-[1.05] sm:text-6xl">Sua pele merece escolhas feitas com carinho.</h2>
          <p className="mt-5 text-ink-soft">Crie seu perfil e descubra o primeiro produto que combina com você.</p>
          <ButtonLink href="/perfil" className="mt-10 px-8 py-4 text-[15px]">
            Começar agora
          </ButtonLink>
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-14 sm:px-8 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <Logo size="lg" />
            <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
              Informação educativa sobre compatibilidade de cosméticos. Não é diagnóstico e não substitui a orientação de um dermatologista.
            </p>
          </div>
          <nav className="flex gap-6 text-sm text-ink-soft">
            <Link href="/painel" className="hover:text-ink">
              Entrar
            </Link>
            <a href="#duvidas" className="hover:text-ink">
              Dúvidas
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
