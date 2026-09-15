import Link from "next/link";
import type { Metadata } from "next";
import { IconCompare, IconScan } from "@/components/icons";
import { ButtonLink, Card, EmptyState, PageHeader, ScorePill, VerdictBadge, formatDateTime, table } from "@/components/ui";
import { listHistory } from "@/server/services/analysis";
import { getUserId } from "@/server/session";

export const metadata: Metadata = { title: "Histórico" };

export default async function HistoryPage() {
  const history = await listHistory(await getUserId());

  return (
    <>
      <PageHeader
        title="Histórico"
        description="A análise mais recente de cada produto, com o seu perfil da época."
        actions={
          history.length >= 2 && (
            <ButtonLink href="/comparar" variant="secondary">
              <IconCompare className="h-4 w-4" />
              Comparar produtos
            </ButtonLink>
          )
        }
      />
      <Card className="p-0">
        {history.length === 0 ? (
          <EmptyState title="Nenhum produto analisado ainda">
            <ButtonLink href="/escanear" className="mt-3">
              <IconScan className="h-4 w-4" />
              Analisar o primeiro
            </ButtonLink>
          </EmptyState>
        ) : (
          <div className={table.wrap}>
            <table className={table.table}>
              <thead className={table.head}>
                <tr>
                  <th className={table.th}>Produto</th>
                  <th className={`${table.th} hidden sm:table-cell`}>Resultado</th>
                  <th className={`${table.th} text-right`}>Nota</th>
                  <th className={`${table.th} hidden text-right md:table-cell`}>Analisado em</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.id} className={table.row}>
                    <td className={table.td}>
                      <Link href={`/analise/${h.id}`} className="font-medium text-ink hover:text-accent">
                        {h.productName}
                      </Link>
                      <p className="text-xs text-muted">
                        {[h.brand, !h.productId && "lista colada"].filter(Boolean).join(" · ") || "—"}
                      </p>
                      <div className="mt-1.5 sm:hidden">
                        <VerdictBadge verdict={h.verdict} />
                      </div>
                    </td>
                    <td className={`${table.td} hidden sm:table-cell`}>
                      <VerdictBadge verdict={h.verdict} />
                    </td>
                    <td className={`${table.td} text-right`}>
                      <ScorePill score={h.score} verdict={h.verdict} />
                    </td>
                    <td className={`${table.td} hidden whitespace-nowrap text-right text-muted md:table-cell`}>{formatDateTime(h.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
