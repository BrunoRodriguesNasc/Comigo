import { ButtonLink, Logo } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <header className="border-b border-powder">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center px-5 sm:px-8">
          <Logo />
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col justify-center px-5 py-24 sm:px-8">
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted">404</p>
        <h1 className="mt-4 max-w-2xl text-[42px] sm:text-[54px]">Não encontramos esta página.</h1>
        <p className="mt-5 max-w-md text-base text-muted">Ela pode ter sido removida ou pertencer a outro dispositivo.</p>
        <div className="mt-10">
          <ButtonLink href="/painel">Voltar ao início</ButtonLink>
        </div>
      </main>
    </div>
  );
}
