import type { Metadata, Viewport } from "next";
import { Inter, Nunito, Playfair_Display, DM_Sans, Space_Grotesk, Barlow_Condensed } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { ZustandThemeSync } from "@/components/providers/ThemeProvider";
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

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-space-grotesk",
});

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-display",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://LogerBien.gn";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "LogerBien — Trouvez votre logement en Guinée",
    template: "%s | LogerBien",
  },
  description:
    "LogerBien est la plateforme immobilière de confiance en Guinée. Trouvez rapidement un appartement, une maison ou un studio à Conakry.",
  keywords: ["immobilier Guinée", "appartement Conakry", "location Conakry", "maison Guinée", "LogerBien"],
  openGraph: {
    title: "LogerBien — Immobilier Guinée",
    description: "La plateforme immobilière de confiance en Guinée",
    type: "website",
    locale: "fr_GN",
    url: SITE_URL,
    siteName: "LogerBien",
  },
  twitter: {
    card: "summary_large_image",
    title: "LogerBien — Immobilier Guinée",
    description: "La plateforme immobilière de confiance en Guinée",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "LogerBien",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0A1216",
  // Required for env(safe-area-inset-bottom) to return real values on iOS.
  // Without this the browser clips the viewport to the safe area and the
  // env() functions always return 0, making the bottom-nav padding useless.
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning className={`${spaceGrotesk.variable} ${barlowCondensed.variable}`}>
      <head>
        <link rel="icon" href="/logo.png" type="image/png" />
        <link rel="preconnect" href="https://kqshknfrtlbjaufkdeeg.supabase.co" />
      </head>
      <body className={`${inter.variable} ${nunito.variable} ${playfair.variable} ${dmSans.variable} ${spaceGrotesk.variable} ${barlowCondensed.variable} font-sans min-h-screen`} style={{ backgroundColor: "var(--bg-primary)", color: "var(--color-text-white)" }}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange={false}>
          <QueryProvider>
            <AuthProvider>
              <ZustandThemeSync />
              {children}
              <Toaster />
              <PWAInstallBanner />
              <ServiceWorkerRegister />
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
