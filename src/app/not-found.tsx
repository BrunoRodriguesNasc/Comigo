import { ButtonLink, Logo } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 text-center">
      <Logo />
      <div>
        <p className="text-sm font-semibold text-accent">404</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Não encontramos esta página</h1>
        <p className="mt-2 text-sm text-ink-soft">Ela pode ter sido removida ou pertencer a outro dispositivo.</p>
      </div>
      <ButtonLink href="/painel">Ir para o painel</ButtonLink>
    </div>
  );
}
