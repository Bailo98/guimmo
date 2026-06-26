import type { Metadata, Viewport } from "next";
import { DM_Sans, Fraunces, Inter, Manrope, Nunito, Playfair_Display, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { ZustandThemeSync } from "@/components/providers/ThemeProvider";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { Toaster } from "@/components/ui/Toaster";
import { AuthProvider } from "@/lib/auth-context";
import { PWAInstallBanner } from "@/components/ui/PWAInstallBanner";
import { ServiceWorkerRegister } from "@/components/ui/ServiceWorkerRegister";
import { StoreHydrator } from "@/components/providers/StoreHydrator";

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
  weight: ["700", "800"],
  variable: "--font-playfair",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  weight: ["700", "800"],
  variable: "--font-display",
});

const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-manrope",
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
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#11100d" },
    { media: "(prefers-color-scheme: light)", color: "#f7f3ea" },
  ],
  // Required for env(safe-area-inset-bottom) to return real values on iOS.
  // Without this the browser clips the viewport to the safe area and the
  // env() functions always return 0, making the bottom-nav padding useless.
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${manrope.variable} ${fraunces.variable} ${playfair.variable} ${spaceGrotesk.variable} light`}
      style={{ colorScheme: "light" }}
    >
      <head>
        <link rel="icon" href="/logo.png" type="image/png" />
        <link rel="preconnect" href="https://kqshknfrtlbjaufkdeeg.supabase.co" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  var chosen = localStorage.getItem('lb-theme-user-choice');
                  if (chosen !== 'dark' && chosen !== 'light') {
                    localStorage.removeItem('lb-theme-user-choice');
                    localStorage.removeItem('theme');
                    document.documentElement.classList.remove('dark');
                    document.documentElement.classList.add('light');
                    document.documentElement.style.colorScheme = 'light';
                  } else {
                    localStorage.removeItem('theme');
                    document.documentElement.classList.remove(chosen === 'dark' ? 'light' : 'dark');
                    document.documentElement.classList.add(chosen);
                    document.documentElement.style.colorScheme = chosen;
                  }
                } catch (e) {
                  document.documentElement.classList.remove('dark');
                  document.documentElement.classList.add('light');
                  document.documentElement.style.colorScheme = 'light';
                }
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.variable} ${nunito.variable} ${playfair.variable} ${dmSans.variable} ${spaceGrotesk.variable} ${manrope.variable} ${fraunces.variable} font-sans min-h-screen`}>
        <ThemeProvider attribute="class" storageKey="lb-theme-user-choice" defaultTheme="light" enableSystem={false} disableTransitionOnChange={false}>
          <QueryProvider>
            <AuthProvider>
              <StoreHydrator />
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
