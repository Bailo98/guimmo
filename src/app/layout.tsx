import type { Metadata, Viewport } from "next";
import { Inter, Nunito, Playfair_Display, DM_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { Toaster } from "@/components/ui/Toaster";
import { AuthProvider } from "@/lib/auth-context";
import { PWAInstallBanner } from "@/components/ui/PWAInstallBanner";
import { ServiceWorkerRegister } from "@/components/ui/ServiceWorkerRegister";

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

const playfair = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  weight: ["700", "900"],
  variable: "--font-playfair",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500"],
  variable: "--font-dm-sans",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://BienLoger.gn";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "BienLoger — Trouvez votre logement en Guinée",
    template: "%s | BienLoger",
  },
  description:
    "BienLoger est la plateforme immobilière de confiance en Guinée. Trouvez rapidement un appartement, une maison ou un studio à Conakry.",
  keywords: ["immobilier Guinée", "appartement Conakry", "location Conakry", "maison Guinée", "BienLoger"],
  openGraph: {
    title: "BienLoger — Immobilier Guinée",
    description: "La plateforme immobilière de confiance en Guinée",
    type: "website",
    locale: "fr_GN",
    url: SITE_URL,
    siteName: "BienLoger",
  },
  twitter: {
    card: "summary_large_image",
    title: "BienLoger — Immobilier Guinée",
    description: "La plateforme immobilière de confiance en Guinée",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "BienLoger",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a1a0a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=JSON.parse(localStorage.getItem('BienLoger-store')||localStorage.getItem('logerbien-store')||'{}');var t=s&&s.state&&s.state.theme?s.state.theme:'dark';if(t!=='light')document.documentElement.classList.add('dark');}catch(e){document.documentElement.classList.add('dark');}})();`,
          }}
        />
        <link rel="icon" href="/logo.png" type="image/png" />
        <link rel="preconnect" href="https://kqshknfrtlbjaufkdeeg.supabase.co" />
      </head>
      <body className={`${inter.variable} ${nunito.variable} ${playfair.variable} ${dmSans.variable} font-sans min-h-screen`} style={{ backgroundColor: "var(--BienLoger-bg)", color: "var(--BienLoger-cream)" }}>
        <QueryProvider>
          <AuthProvider>
            <ThemeProvider>{children}</ThemeProvider>
            <Toaster />
            <PWAInstallBanner />
            <ServiceWorkerRegister />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
