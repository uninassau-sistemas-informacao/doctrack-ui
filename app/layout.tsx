import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Uninassau — Gestão Documental",
  description:
    "Gestão documental acadêmica: fluxo de provas e atas de avaliação",
};

/**
 * Aplica o tema salvo (ou o do sistema) antes do primeiro paint — sem isso a página pisca
 * clara antes de o React hidratar. O ThemeToggle grava a mesma chave.
 */
const THEME_SCRIPT = `try{var t=localStorage.getItem("theme");if(t==="dark"||(!t&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark")}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: o script acima mexe na classe do <html> antes da hidratação.
    <html lang="pt-BR" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
