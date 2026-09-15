import Link from "next/link";
import { AppShell, PageHeader } from "@/components/app-shell";
import { ButtonLink, Card, EmptyState, ScorePill, SectionTitle } from "@/components/ui";
import { listHistory } from "@/server/services/analysis";
import { getUserId } from "@/server/session";

export const dynamic = "force-dynamic";

const TZ = "America/Sao_Paulo";
const dayKey = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: TZ });

function dayLabel(key: string) {
  const now = new Date();
  const today = dayKey(now);
  const yesterday = dayKey(new Date(now.getTime() - 86_400_000));
  if (key === today) return "Hoje";
  if (key === yesterday) return "Ontem";
  return new Date(`${key}T12:00:00`).toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
}

export default async function HistoryPage() {
  const history = await listHistory(await getUserId());

  const groups = new Map<string, typeof history>();
  for (const h of history) {
    const key = dayKey(new Date(h.createdAt));
    groups.set(key, [...(groups.get(key) ?? []), h]);
  }

  return (
    <AppShell>
      <PageHeader title="Meu histórico" subtitle="Produtos que você já analisou." />
      {history.length === 0 ? (
        <EmptyState title="Nenhum produto analisado ainda">
          <ButtonLink href="/escanear" className="mt-3">
            Escanear o primeiro
          </ButtonLink>
        </EmptyState>
      ) : (
        <>
          {history.length >= 2 && (
            <ButtonLink href="/comparar" variant="secondary" className="w-full">
              ⇄ Comparar dois produtos
            </ButtonLink>
          )}
          {[...groups.entries()].map(([key, items]) => (
            <section key={key}>
              <SectionTitle>
                <span className="capitalize">{dayLabel(key)}</span>
              </SectionTitle>
              <Card className="p-0">
                <ul className="divide-y divide-line">
                  {items.map((h) => (
                    <li key={h.id}>
                      <Link href={`/analise/${h.id}`} className="flex items-center gap-3 p-4 hover:bg-ground">
                        <ScorePill score={h.score} verdict={h.verdict} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">{h.productName}</p>
                          <p className="truncate text-xs text-muted">
                            {[h.brand, h.partial && "análise parcial", new Date(h.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: TZ })]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        </div>
                        <span className="text-muted">›</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </Card>
            </section>
          ))}
        </>
      )}
    </AppShell>
  );
}
