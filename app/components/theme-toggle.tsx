"use client";

import { MoonIcon, SunIcon } from "@phosphor-icons/react";
import { useSyncExternalStore } from "react";

/** Fonte da verdade é a classe `dark` no <html>, que o script de layout.tsx já aplicou. */
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}

const isDarkNow = () => document.documentElement.classList.contains("dark");

function toggle() {
  const dark = !isDarkNow();
  document.documentElement.classList.toggle("dark", dark);
  try {
    localStorage.setItem("theme", dark ? "dark" : "light");
  } catch {
    // Storage bloqueado (aba privada): o tema vale só até recarregar.
  }
}

/** Alternância Modo Claro/Escuro do protótipo; `compact` é a versão da sidebar recolhida. */
export default function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const dark = useSyncExternalStore(subscribe, isDarkNow, () => false);
  const Icon = dark ? MoonIcon : SunIcon;
  const label = dark ? "Modo Escuro" : "Modo Claro";

  if (compact) {
    return (
      <button
        type="button"
        onClick={toggle}
        title={label}
        aria-label="Alternar tema"
        className="flex cursor-pointer items-center justify-center rounded-xl p-2 text-muted hover:bg-surface-2 hover:text-ink"
      >
        <Icon size={18} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      role="switch"
      aria-checked={dark}
      aria-label="Modo escuro"
      className="flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-muted hover:bg-surface-2 hover:text-ink"
    >
      <Icon size={18} className="shrink-0" />
      <span className="flex-1 whitespace-nowrap text-left text-sm">{label}</span>
      <span
        className={`relative h-[22px] w-10 shrink-0 rounded-full transition-colors ${
          dark ? "bg-primary" : "bg-[#D1D5DB]"
        }`}
      >
        <span
          className={`absolute top-1 size-3.5 rounded-full bg-white transition-all ${
            dark ? "left-[23px]" : "left-[3px]"
          }`}
        />
      </span>
    </button>
  );
}
