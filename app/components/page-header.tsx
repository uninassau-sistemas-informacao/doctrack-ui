import Link from "next/link";
import { CaretLeftIcon } from "@phosphor-icons/react/dist/ssr";

/** Cabeçalho fixo das telas internas — mesma faixa branca do dashboard. */
export default function PageHeader({
  title,
  subtitle,
  backHref,
  children,
}: {
  title: string;
  subtitle?: string;
  backHref?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="sticky top-0 z-10 border-b border-line bg-surface px-6 py-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          {backHref && (
            <Link
              href={backHref}
              aria-label="Voltar"
              className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-line text-muted"
            >
              <CaretLeftIcon size={15} />
            </Link>
          )}
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold">{title}</h1>
            {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
          </div>
        </div>
        {children && <div className="flex shrink-0 items-center gap-3">{children}</div>}
      </div>
    </div>
  );
}
