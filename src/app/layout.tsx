import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { Toaster } from "@/components/ui/Toaster";

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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-white dark:bg-[#111418] text-slate-900 dark:text-white min-h-screen">
        <QueryProvider>
          <ThemeProvider>{children}</ThemeProvider>
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  );
}
