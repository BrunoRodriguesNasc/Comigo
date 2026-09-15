import Link from "next/link";
import { ButtonLink, Eyebrow, Logo, ScoreRing } from "@/components/ui";
import { HandwritingText } from "@/components/ui/handwriting-text";
import { ParallaxImage, Reveal } from "@/components/ui/parallax";
import { PHOTOS } from "@/lib/photos";

const VALUES = ["Personalizado", "Transparente", "Baseado em evidência", "Sem alarmismo"];

const STEPS = [
  { n: "01", title: "Conte sobre você", text: "Tipo de pele, sensibilidade, o que você quer cuidar e o que prefere evitar. Leva um minuto." },
  { n: "02", title: "Mostre o produto", text: "Escaneie o código de barras na loja, digite os números ou cole a lista de ingredientes." },
  { n: "03", title: "Decida com clareza", text: "Você recebe uma leitura feita para a sua pele, com os motivos e os pontos de atenção." },
];

const FAQ = [
  {
    q: "O comigo diz se um cosmético é seguro?",
    a: "Não. Mostramos o quanto um produto combina com o seu perfil e explicamos os motivos. É uma informação educativa e não substitui a orientação de um dermatologista.",
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

export default function LandingPage() {
  return (
    <div className="overflow-x-clip bg-surface text-ink">
      <header className="border-b border-powder">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-6 px-5 sm:px-8">
          <Logo />
          <nav className="hidden items-center gap-8 text-sm text-muted md:flex">
            <a href="#como-funciona" className="hover:text-ink">
              Como funciona
            </a>
            <a href="#por-que" className="hover:text-ink">
              Por que o comigo
            </a>
            <a href="#duvidas" className="hover:text-ink">
              Dúvidas
            </a>
          </nav>
          <div className="flex items-center gap-6">
            <Link href="/painel" className="hidden text-sm text-muted hover:text-ink sm:inline">
              Entrar
            </Link>
            <ButtonLink href="/perfil" className="px-5 py-2.5">
              Começar
            </ButtonLink>
          </div>
        </div>
      </header>

      <section className="relative">
        <ParallaxImage src={PHOTOS.hero.src} alt={PHOTOS.hero.alt} priority strength={0.12} className="h-[62vh] min-h-[420px] w-full sm:h-[78vh]" />
        <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
          <div className="relative -mt-40 max-w-2xl border border-ink bg-surface p-6 sm:-mt-56 sm:p-10">
            <Eyebrow>Cosméticos para a sua pele</Eyebrow>
            <h1 className="mt-5 text-[40px] sm:text-[54px]">
              Escolha o que combina com{" "}
              <HandwritingText words={["a sua pele.", "você.", "a sua rotina."]} className="text-ink" height="1.05em" />
            </h1>
            <p className="mt-6 max-w-lg text-base leading-[1.33] text-muted">
              Mostre um cosmético e descubra se ele combina com a sua pele e com o que você prefere evitar — com cada motivo explicado.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-6">
              <ButtonLink href="/perfil" className="px-8">
                Criar meu perfil
              </ButtonLink>
              <a href="#como-funciona" className="text-sm underline decoration-ink/30 underline-offset-4 hover:decoration-ink">
                Ver como funciona
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-16 bg-powder sm:mt-24">
        <ul className="mx-auto grid max-w-[1200px] grid-cols-2 gap-y-4 px-5 py-8 text-center text-sm sm:px-8 md:grid-cols-4">
          {VALUES.map((v) => (
            <li key={v}>{v}</li>
          ))}
        </ul>
      </section>

      <section id="como-funciona" className="mx-auto grid max-w-[1200px] scroll-mt-10 items-center gap-12 px-5 py-16 sm:px-8 lg:grid-cols-2 lg:gap-16 lg:py-24">
        <ParallaxImage src={PHOTOS.ritual.src} alt={PHOTOS.ritual.alt} strength={0.14} className="aspect-[4/5]" />
        <div>
          <Eyebrow>Como funciona</Eyebrow>
          <h2 className="mt-4 text-[36px] sm:text-[42px]">Três passos até uma escolha tranquila.</h2>
          <ol className="mt-10 border-t border-ink">
            {STEPS.map((s, i) => (
              <li key={s.n} className="border-b border-powder py-6">
                <Reveal delay={i * 120} className="grid grid-cols-[48px_1fr] gap-4">
                  <span className="text-sm text-muted">{s.n}</span>
                  <div>
                    <h3 className="text-[24px]">{s.title}</h3>
                    <p className="mt-2 text-sm leading-[1.33] text-muted">{s.text}</p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="por-que" className="scroll-mt-10 bg-powder">
        <div className="mx-auto max-w-[1200px] px-5 py-16 sm:px-8 lg:py-24">
          <Eyebrow>O mesmo produto, duas peles</Eyebrow>
          <h2 className="mt-4 max-w-2xl text-[36px] sm:text-[42px]">Não existe produto bom para todo mundo. Existe produto bom para você.</h2>
          <p className="mt-4 max-w-xl text-sm text-ink">Uma base de demonstração, com fragrância, avaliada para duas pessoas diferentes.</p>
          <Reveal className="mt-10 grid gap-4 md:grid-cols-2">
            <article className="flex items-center justify-between gap-6 border border-ink bg-surface p-6">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Oleosa e sensível · evita fragrância</p>
                <p className="mt-3 text-[28px] leading-[1.1]">Tem algo que ela prefere evitar</p>
              </div>
              <ScoreRing score={40} verdict="conflict" size={88} />
            </article>
            <article className="flex items-center justify-between gap-6 border border-ink bg-surface p-6">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Pele seca · sem restrições</p>
                <p className="mt-3 text-[28px] leading-[1.1]">Combina com ela</p>
              </div>
              <ScoreRing score={82} verdict="good" size={88} />
            </article>
          </Reveal>
        </div>
      </section>

      <section id="duvidas" className="mx-auto max-w-3xl scroll-mt-10 px-5 py-16 sm:px-8 lg:py-24">
        <h2 className="text-[36px] sm:text-[42px]">Dúvidas frequentes</h2>
        <div className="mt-8 border-t border-ink">
          {FAQ.map((f) => (
            <details key={f.q} className="group border-b border-powder py-5">
              <summary className="flex items-center justify-between gap-6 text-base">
                {f.q}
                <span className="shrink-0 text-xl font-light text-muted transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 max-w-2xl text-sm leading-[1.33] text-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="bg-ink text-white">
        <div className="mx-auto flex max-w-[1200px] flex-col items-start gap-8 px-5 py-16 sm:px-8 md:flex-row md:items-end md:justify-between lg:py-24">
          <h2 className="max-w-xl text-[36px] sm:text-[54px]">Sua pele merece escolhas feitas para ela.</h2>
          <ButtonLink href="/perfil" className="px-8">
            Começar agora
          </ButtonLink>
        </div>
      </section>

      <footer>
        <div className="mx-auto max-w-[1200px] px-5 pb-10 pt-12 sm:px-8">
          <Logo size="lg" />
          <div className="mt-8 flex flex-col gap-4 border-t border-powder pt-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-xl">
              Informação educativa sobre compatibilidade de cosméticos. Não é diagnóstico e não substitui a orientação de um dermatologista.
            </p>
            <div className="flex gap-6">
              <Link href="/painel" className="hover:text-ink">
                Entrar
              </Link>
              <a href="#duvidas" className="hover:text-ink">
                Dúvidas
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
