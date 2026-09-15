import { Jar } from "@/components/illustrations";
import { ButtonLink, Logo } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-5 text-center">
      <Logo />
      <Jar className="mt-14 h-28 w-28 text-ink" />
      <h1 className="mt-6 text-5xl">Ops, essa página sumiu</h1>
      <p className="mt-3 max-w-sm text-ink-soft">Ela pode ter sido removida ou pertencer a outro dispositivo.</p>
      <ButtonLink href="/painel" className="mt-8">
        Voltar ao início
      </ButtonLink>
    </div>
  );
}
