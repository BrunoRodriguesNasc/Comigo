import { ActionButton, EntityForm } from "@/components/admin/forms";
import { Card } from "@/components/ui";
import { db } from "@/server/db";
import { getActiveConfig } from "@/server/scoring-config";

export const dynamic = "force-dynamic";

export default async function AdminRules() {
  const [active, versions] = await Promise.all([
    getActiveConfig(),
    db.scoringConfig.findMany({ orderBy: { version: "desc" }, select: { version: true, active: true, note: true, createdAt: true } }),
  ]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
      <Card>
        <h1 className="text-lg font-bold">Regras, pesos e preferências</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Versão ativa: <strong>{active.version || "padrão do código"}</strong> · hash {active.hash}. Salvar cria uma nova versão
          (validada) e a ativa. Análises antigas continuam guardadas com a versão com que foram feitas.
        </p>
        <details className="mt-3 rounded-lg bg-ground p-3 text-sm">
          <summary className="font-semibold">Como funciona</summary>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-ink-soft">
            <li>
              <code>weights</code> e <code>bases</code>: peso e ponto de partida de cada dimensão (preferences, profile_fit, benefits, general).
            </li>
            <li>
              <code>rules[].when</code>: condições de perfil (<code>skinTypesAny</code>, <code>concernsAny</code>, <code>sensitive</code>), ingrediente (
              <code>flagsAny</code>, <code>benefitTagsAny</code>, <code>concernTagsAny</code>, <code>maxPosition</code>) e produto (
              <code>attributeEquals</code>).
            </li>
            <li>
              <code>rules[].effect</code>: <code>kind</code> positive|attention|info, <code>points</code> na escala da dimensão,{" "}
              <code>aggregate</code> max|sum, <code>positionScaling</code>. Mensagens aceitam <code>{"{ingredients}"}</code> e{" "}
              <code>{"{ingredient}"}</code>.
            </li>
            <li>
              <code>conflictCap</code>: nota máxima quando há conflito estrito.
            </li>
          </ul>
        </details>
        <EntityForm action="/api/admin/config" extra={{ action: "save" }} submitLabel="Validar e salvar nova versão" className="mt-4">
          <textarea
            name="config:json"
            rows={32}
            spellCheck={false}
            defaultValue={JSON.stringify(active.config, null, 2)}
            className="w-full rounded-lg border border-line bg-white p-3 font-mono text-xs leading-relaxed outline-none focus:border-accent"
          />
          <input name="note" placeholder="Nota da versão (o que mudou e por quê)" className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm" />
        </EntityForm>
      </Card>

      <Card className="h-fit">
        <h2 className="font-bold">Versões</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {versions.map((v) => (
            <li key={v.version} className="rounded-lg border border-line p-2">
              <div className="flex items-center justify-between">
                <strong>v{v.version}</strong>
                {v.active ? (
                  <span className="text-xs font-semibold text-good">ativa</span>
                ) : (
                  <ActionButton url="/api/admin/config" body={{ action: "activate", version: v.version }} label="Ativar" />
                )}
              </div>
              <p className="text-xs text-muted">{v.createdAt.toLocaleString("pt-BR")}</p>
              {v.note && <p className="text-xs text-ink-soft">{v.note}</p>}
            </li>
          ))}
        </ul>
        <div className="mt-4">
          <ActionButton
            url="/api/admin/config"
            body={{ action: "restore" }}
            label="Restaurar configuração padrão"
            confirmText="Criar uma nova versão com a configuração padrão do código?"
          />
        </div>
      </Card>
    </div>
  );
}
