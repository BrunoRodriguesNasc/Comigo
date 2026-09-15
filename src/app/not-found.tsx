import { AppShell } from "@/components/app-shell";
import { ButtonLink, EmptyState } from "@/components/ui";

export default function NotFound() {
  return (
    <AppShell>
      <div className="mt-10">
        <EmptyState title="Não encontramos esta página">
          <p>Ela pode ter sido removida ou pertencer a outro dispositivo.</p>
          <ButtonLink href="/" className="mt-4">
            Voltar ao início
          </ButtonLink>
        </EmptyState>
      </div>
    </AppShell>
  );
}
