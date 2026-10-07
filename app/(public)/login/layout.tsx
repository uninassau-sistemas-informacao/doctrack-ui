import type { Metadata } from "next";

// A página é client component e não pode exportar metadata; o título só do login mora aqui.
export const metadata: Metadata = { title: "DocTrack — Gestão Documental" };

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
