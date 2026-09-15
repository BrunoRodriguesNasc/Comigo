import Link from "next/link";

const TABS = [
  { href: "/admin", label: "Painel" },
  { href: "/admin/revisao", label: "Revisão" },
  { href: "/admin/produtos", label: "Produtos" },
  { href: "/admin/ingredientes", label: "Ingredientes" },
  { href: "/admin/regras", label: "Regras e pesos" },
  { href: "/admin/importar", label: "Importar" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-ground">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <Link href="/admin" className="font-bold text-accent">
            Admin · COMIGO
          </Link>
          <nav className="flex flex-wrap gap-1 text-sm">
            {TABS.map((t) => (
              <Link key={t.href} href={t.href} className="rounded-lg px-3 py-1.5 font-medium text-ink-soft hover:bg-ground hover:text-ink">
                {t.label}
              </Link>
            ))}
          </nav>
          <Link href="/" className="ml-auto text-sm text-muted">
            Ver app →
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
