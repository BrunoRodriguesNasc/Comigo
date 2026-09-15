import Link from "next/link";
import type { Metadata } from "next";
import { ButtonLink, EmptyState, PageHeader, ScorePill, VerdictBadge, formatDateTime } from "@/components/ui";
import { listHistory } from "@/server/services/analysis";
import { getUserId } from "@/server/session";

export const metadata: Metadata = { title: "Meus produtos" };

export default async function HistoryPage() {
  const history = await listHistory(await getUserId());

  return (
    <>
      <PageHeader
        eyebrow="Meus produtos"
        title="Tudo o que você já analisou"
        description="A análise mais recente de cada produto, feita com o seu perfil daquele momento."
        actions={
          history.length >= 2 && (
            <ButtonLink href="/comparar" variant="secondary">
              Comparar dois produtos
            </ButtonLink>
          )
        }
      />
      {history.length === 0 ? (
        <EmptyState title="Nenhum produto analisado ainda">
          <ButtonLink href="/escanear" className="mt-5">
            Analisar o primeiro produto
          </ButtonLink>
        </EmptyState>
      ) : (
        <ul className="divide-y divide-powder border-t border-ink">
          {history.map((h) => (
            <li key={h.id}>
              <Link href={`/analise/${h.id}`} className="group flex items-center gap-5 py-5">
                <ScorePill score={h.score} verdict={h.verdict} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[20px] font-light leading-[1.11] group-hover:underline group-hover:underline-offset-4 sm:text-[24px]">
                    {h.productName}
                  </p>
                  <p className="mt-1 truncate text-xs text-muted">
                    {[h.brand ?? (!h.productId ? "lista colada" : null), formatDateTime(h.createdAt)].filter(Boolean).join(" · ")}
                  </p>
                  <div className="mt-2 sm:hidden">
                    <VerdictBadge verdict={h.verdict} />
                  </div>
                </div>
                <span className="hidden sm:inline">
                  <VerdictBadge verdict={h.verdict} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
