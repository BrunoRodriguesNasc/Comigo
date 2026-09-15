import Link from "next/link";
import { AppShell, ScanIcon } from "@/components/app-shell";
import { ButtonLink, Card, ScorePill, SectionTitle } from "@/components/ui";
import { db } from "@/server/db";
import { listHistory } from "@/server/services/analysis";
import { getProfileView } from "@/server/services/profile";
import { getUserId } from "@/server/session";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const userId = await getUserId();
  const [profile, history, demo] = await Promise.all([
    getProfileView(userId),
    listHistory(userId, 3),
    db.product.findMany({
      where: { source: { key: "demo" } },
      include: { brand: true, category: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <AppShell>
      <header className="flex items-center justify-between px-1 pt-2">
        <p className="text-sm font-bold tracking-tight text-accent">desrotulando · beleza</p>
        <Link href="/perfil" className="text-sm font-medium text-ink-soft">
          {profile.exists ? "Meu perfil" : "Criar perfil"}
        </Link>
      </header>

      <section className="mt-6 px-1">
        <h1 className="text-[28px] font-bold leading-[1.15] tracking-tight">
          Esse cosmético
          <br />
          combina com <span className="text-accent">você</span>?
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">
          Escaneie o código de barras. A gente cruza os ingredientes com a sua pele e as suas preferências — e explica
          o porquê.
        </p>
      </section>

      <Link
        href="/escanear"
        className="mt-6 flex items-center gap-4 rounded-3xl bg-accent p-5 text-white shadow-lg shadow-accent/25 transition active:scale-[.99]"
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
          <ScanIcon className="h-8 w-8" />
        </span>
        <span>
          <span className="block text-lg font-bold">Escanear produto</span>
          <span className="block text-sm text-white/80">Aponte a câmera para o código de barras</span>
        </span>
      </Link>
      <Link href="/colar" className="mt-3 block text-center text-sm font-semibold text-accent">
        Ou cole a lista de ingredientes
      </Link>

      {!profile.exists && (
        <Card className="mt-6 border-accent/25">
          <p className="font-bold">Crie seu perfil em 1 minuto</p>
          <p className="mt-1 text-sm text-ink-soft">
            Sem perfil, mostramos só uma análise geral. Com ele, a nota passa a ser <strong>para você</strong>.
          </p>
          <ButtonLink href="/perfil" className="mt-3 w-full">
            Começar
          </ButtonLink>
        </Card>
      )}

      {history.length > 0 && (
        <>
          <SectionTitle aside={<Link href="/historico" className="text-sm font-semibold text-accent">Ver tudo</Link>}>
            Analisados recentemente
          </SectionTitle>
          <Card className="p-0">
            <ul className="divide-y divide-line">
              {history.map((h) => (
                <li key={h.id}>
                  <Link href={`/analise/${h.id}`} className="flex items-center gap-3 p-4 hover:bg-ground">
                    <ScorePill score={h.score} verdict={h.verdict} />
                    <span className="min-w-0 flex-1 truncate font-medium">{h.productName}</span>
                    <span className="text-muted">›</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </>
      )}

      {demo.length > 0 && (
        <>
          <SectionTitle>Sem produto em mãos?</SectionTitle>
          <p className="-mt-1 mb-2 px-1 text-sm text-ink-soft">
            Teste com o catálogo de demonstração (produtos fictícios).
          </p>
          <Card className="p-0">
            <ul className="divide-y divide-line">
              {demo.map((p) => (
                <li key={p.id}>
                  <a href={`/p/${p.barcode}`} className="flex items-center gap-3 px-4 py-3 hover:bg-ground">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-medium">{p.name}</p>
                      <p className="truncate text-xs text-muted">
                        {p.category?.namePt} · {p.barcode}
                      </p>
                    </div>
                    <span className="text-muted">›</span>
                  </a>
                </li>
              ))}
            </ul>
          </Card>
        </>
      )}

      <p className="mt-8 px-1 text-center text-xs leading-relaxed text-muted">
        Informação educativa sobre compatibilidade de cosméticos. Não substitui a orientação de um dermatologista.
      </p>
    </AppShell>
  );
}
