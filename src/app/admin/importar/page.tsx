import { ActionButton, EntityForm } from "@/components/admin/forms";
import { Card } from "@/components/ui";

const EXAMPLE = JSON.stringify(
  [
    {
      barcode: "7890000000000",
      brand: "Marca",
      name: "Hidratante Facial",
      category: "hidratante-facial",
      ingredients: "Aqua, Glycerin, Niacinamide, Phenoxyethanol",
      attributes: { vegan: true, crueltyFree: null },
      sourceUrl: "https://…",
    },
  ],
  null,
  2,
);

export default function AdminImport() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <Card>
        <h1 className="text-lg font-bold">Importação em lote</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Cole um array JSON (até 500 itens). Produtos entram como <code>pending</code> com fonte “Importação em lote” e passam pelo mesmo
          pipeline de normalização. Códigos já existentes são atualizados.
        </p>
        <EntityForm action="/api/admin/import" submitLabel="Importar" className="mt-4">
          <textarea
            name="items:json"
            rows={20}
            spellCheck={false}
            defaultValue={EXAMPLE}
            className="w-full rounded-lg border border-line bg-white p-3 font-mono text-xs outline-none focus:border-accent"
          />
        </EntityForm>
      </Card>
      <Card className="h-fit">
        <h2 className="font-bold">Re-normalizar catálogo</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Depois de criar ingredientes ou aliases, reprocesse os produtos para atualizar a tabela de normalização do admin. (As análises já
          usam a base mais recente automaticamente.)
        </p>
        <div className="mt-3">
          <ActionButton url="/api/admin/renormalize" label="Re-normalizar todos" />
        </div>
      </Card>
    </div>
  );
}
