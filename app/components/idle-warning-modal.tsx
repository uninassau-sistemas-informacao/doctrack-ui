"use client";

import { useEffect, useRef } from "react";

/** Aviso antes do logout por inatividade (E9.4). Some quando `secondsLeft` volta a `null`. */
export default function IdleWarningModal({
  secondsLeft,
  onStay,
}: {
  secondsLeft: number | null;
  onStay: () => void;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (secondsLeft !== null) {
      buttonRef.current?.focus();
    }
  }, [secondsLeft]);

  if (secondsLeft === null) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-6">
      <div
        role="alertdialog"
        aria-live="assertive"
        aria-labelledby="idle-warning-title"
        aria-describedby="idle-warning-description"
        className="w-full max-w-sm rounded-2xl border border-line bg-white p-5 shadow-lg"
      >
        <h2 id="idle-warning-title" className="mb-1 text-base font-semibold">
          Sua sessão vai expirar
        </h2>
        <p id="idle-warning-description" className="text-sm text-muted">
          Por inatividade, você sairá em {secondsLeft} s.
        </p>

        <div className="mt-4 flex justify-end">
          <button
            ref={buttonRef}
            type="button"
            onClick={onStay}
            className="cursor-pointer rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white"
          >
            Continuar conectado
          </button>
        </div>
      </div>
    </div>
  );
}
