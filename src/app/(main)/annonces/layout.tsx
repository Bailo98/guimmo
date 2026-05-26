import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Annonces immobilières à Conakry | LogerBien",
  description:
    "Toutes les annonces immobilières à Conakry. Filtrez par quartier, prix et type de bien sur LogerBien.",
  openGraph: {
    title: "Annonces immobilières à Conakry | LogerBien",
    description:
      "Toutes les annonces immobilières à Conakry. Filtrez par quartier, prix et type de bien sur LogerBien.",
    url: "https://logerbien.gn/annonces",
    siteName: "LogerBien",
  },
};

export default function AnnoncesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
