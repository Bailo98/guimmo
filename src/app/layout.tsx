import type { Metadata, Viewport } from "next";
import { Inter, Nunito } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { Toaster } from "@/components/ui/Toaster";
import { AuthProvider } from "@/lib/auth-context";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const nunito = Nunito({
  subsets: ["latin"],
  display: "swap",
  weight: ["800"],
  variable: "--font-nunito",
});

export const metadata: Metadata = {
  title: {
    default: "GuImmo — Trouvez votre logement en Guinée",
    template: "%s | GuImmo",
  },
  description:
    "GuImmo est la plateforme immobilière de confiance en Guinée. Trouvez rapidement un appartement, une maison ou un studio à Conakry.",
  keywords: ["immobilier Guinée", "appartement Conakry", "location Conakry", "maison Guinée", "GuImmo"],
  openGraph: {
    title: "GuImmo — Immobilier Guinée",
    description: "La plateforme immobilière de confiance en Guinée",
    type: "website",
    locale: "fr_GN",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "GuImmo",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#111418" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=JSON.parse(localStorage.getItem('guimmo-store')||localStorage.getItem('logerbien-store')||'{}');var t=s&&s.state&&s.state.theme?s.state.theme:'dark';if(t==='dark')document.documentElement.classList.add('dark');}catch(e){document.documentElement.classList.add('dark');}})();`,
          }}
        />
        <link rel="icon" href="/logo.png" type="image/png" />
        <link rel="preconnect" href="https://kqshknfrtlbjaufkdeeg.supabase.co" />
      </head>
      <body className={`${inter.variable} ${nunito.variable} font-sans bg-white dark:bg-[#111418] text-slate-900 dark:text-white min-h-screen`}>
        <QueryProvider>
          <AuthProvider>
            <ThemeProvider>{children}</ThemeProvider>
            <Toaster />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
