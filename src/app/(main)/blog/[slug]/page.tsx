import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Clock, Calendar, User, ChevronRight, Home } from "lucide-react";
import { ReadingProgress } from "@/components/ui/ReadingProgress";
import { ShareButton } from "./ShareButton";

interface PageProps {
  params: Promise<{ slug: string }>;
}

const ARTICLES = [
  {
    slug: "marche-immobilier-conakry-2026",
    title: "Le marché immobilier à Conakry en 2026 : tendances et perspectives",
    excerpt:
      "Analyse des prix, quartiers en hausse et conseils pour investir intelligemment.",
    category: "Marché",
    date: "2026-05-08",
    image:
      "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80",
    wordCount: 980,
  },
  {
    slug: "conseils-negocier-loyer-guinee",
    title: "5 conseils pour négocier votre loyer en Guinée",
    excerpt:
      "Techniques éprouvées pour obtenir le meilleur prix auprès d'un propriétaire guinéen.",
    category: "Conseils",
    date: "2026-05-05",
    image:
      "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80",
    wordCount: 750,
  },
  {
    slug: "quartiers-tendance-conakry",
    title: "Les quartiers tendance à Conakry en 2026",
    excerpt:
      "Kipé, Ratoma, Taouyah... Où investir pour les prochaines années ?",
    category: "Quartiers",
    date: "2026-05-01",
    image:
      "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&q=80",
    wordCount: 1150,
  },
  {
    slug: "documents-location-guinee",
    title: "Quels documents pour louer en Guinée ?",
    excerpt:
      "Guide complet des pièces à fournir pour un dossier de location solide.",
    category: "Juridique",
    date: "2026-04-28",
    image:
      "https://images.unsplash.com/photo-1568992688065-536aad8a12f6?w=800&q=80",
    wordCount: 560,
  },
  {
    slug: "investir-immobilier-conakry",
    title: "Investir dans l'immobilier à Conakry : guide 2026",
    excerpt:
      "Rentabilité, risques et opportunités pour les investisseurs locaux et de la diaspora.",
    category: "Marché",
    date: "2026-04-20",
    image:
      "https://images.unsplash.com/photo-1560520653-9e0e4c89eb11?w=800&q=80",
    wordCount: 1600,
  },
  {
    slug: "eviter-arnaques-location",
    title: "Comment éviter les arnaques à la location en Guinée",
    excerpt:
      "Les signes qui ne trompent pas et les précautions à prendre avant de payer.",
    category: "Conseils",
    date: "2026-04-15",
    image:
      "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&q=80",
    wordCount: 900,
  },
  {
    slug: "loi-bail-guinee-2025",
    title: "La loi sur le bail en Guinée : ce que dit la réglementation",
    excerpt:
      "Droits et obligations du locataire et du propriétaire selon la législation guinéenne.",
    category: "Juridique",
    date: "2026-04-10",
    image:
      "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&q=80",
    wordCount: 820,
  },
  {
    slug: "actualites-immobilier-mai-2026",
    title: "Actualités immobilières : mai 2026 en Guinée",
    excerpt:
      "Tour d'horizon des dernières nouvelles du marché immobilier guinéen ce mois-ci.",
    category: "Actualités",
    date: "2026-05-03",
    image:
      "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80",
    wordCount: 640,
  },
];

function readTime(wordCount: number): number {
  return Math.ceil(wordCount / 200);
}

const CATEGORY_COLORS: Record<string, string> = {
  Marché: "bg-blue-500/20 text-blue-400",
  Conseils: "bg-green-500/20 text-[#D4AF37]",
  Quartiers: "bg-purple-500/20 text-purple-400",
  Juridique: "bg-[#D4AF37]/20 text-[#D4AF37]",
  Actualités: "bg-rose-500/20 text-rose-400",
};

function getArticleContent(slug: string, article: (typeof ARTICLES)[0]): string {
  if (slug === "marche-immobilier-conakry-2026") {
    return `
<h2>Introduction</h2>
<p>Le marché immobilier de Conakry traverse une période de profonde transformation en 2026. Portée par une croissance démographique soutenue et un regain d'intérêt de la diaspora guinéenne, la demande de logements n'a jamais été aussi forte dans la capitale.</p>
<p>Les prix ont évolué de manière contrastée selon les quartiers : si Kaloum et Dixinn restent des valeurs sûres mais onéreuses, des zones comme Kipé et Taouyah émergent comme les nouveaux pôles d'attractivité résidentielle.</p>

<h2>Tendances des prix par quartier</h2>
<p>L'analyse des annonces publiées sur LogerBien révèle les dynamiques suivantes :</p>
<ul>
  <li><strong>Kaloum</strong> : prix moyen 3.000.000 GNF/mois pour un appartement. Demande stable, offre limitée.</li>
  <li><strong>Dixinn</strong> : 2.500.000 GNF/mois en moyenne. Quartier diplomatique très prisé des expatriés.</li>
  <li><strong>Kipé</strong> : 2.000.000 GNF/mois. Forte croissance (+18% en 2 ans), infrastructures en amélioration.</li>
  <li><strong>Taouyah</strong> : 2.200.000 GNF/mois. Nouveau quartier résidentiel en plein essor, calme et verdoyant.</li>
  <li><strong>Madina</strong> : 1.200.000 GNF/mois. Marché populaire très animé, idéal pour les petits budgets.</li>
</ul>

<h2>Facteurs d'évolution du marché</h2>
<p>Plusieurs éléments structurels expliquent la dynamique actuelle du marché :</p>
<ul>
  <li>L'urbanisation rapide de Conakry avec l'intégration de nouveaux quartiers périphériques</li>
  <li>Les investissements des Guinéens de la diaspora, notamment depuis l'Europe et les États-Unis</li>
  <li>La professionnalisation progressive du secteur immobilier avec l'émergence d'agences agréées</li>
  <li>L'essor des plateformes numériques comme LogerBien qui fluidifient le marché</li>
</ul>

<h2>Conseils pour investir intelligemment</h2>
<p>Face à ces tendances, voici nos recommandations pour tout investisseur souhaitant se positionner sur le marché conakryen :</p>
<ul>
  <li>Privilégiez les quartiers en développement (Kipé, Taouyah) pour un meilleur rapport qualité-prix</li>
  <li>Vérifiez systématiquement les titres fonciers avant tout achat</li>
  <li>Passez par des agents immobiliers vérifiés pour éviter les arnaques</li>
  <li>Anticipez les travaux d'aménagement qui augmenteront la valeur de votre bien</li>
</ul>

<h2>Conclusion</h2>
<p>Le marché immobilier de Conakry offre de réelles opportunités pour qui sait où regarder. Avec une analyse rigoureuse et un accompagnement professionnel, investir à Conakry en 2026 peut s'avérer très rentable. LogerBien vous accompagne dans chaque étape de votre projet immobilier en Guinée.</p>
    `.trim();
  }

  return `
<h2>Introduction</h2>
<p>${article.excerpt} Dans cet article, l'équipe LogerBien vous guide à travers les aspects essentiels de ce sujet pour vous aider à naviguer sereinement dans le marché immobilier guinéen.</p>
<p>Que vous soyez locataire, propriétaire ou investisseur, comprendre les spécificités du marché immobilier à Conakry est indispensable pour prendre les bonnes décisions. La capitale guinéenne présente des caractéristiques uniques qui méritent une attention particulière.</p>

<h2>Ce que vous devez savoir</h2>
<p>Le marché immobilier guinéen, et particulièrement celui de Conakry, est en pleine mutation. Les opportunités sont nombreuses pour ceux qui savent les identifier. Voici les points clés à retenir :</p>
<ul>
  <li>La demande de logements à Conakry dépasse largement l'offre disponible, ce qui crée des tensions sur les prix</li>
  <li>Les quartiers résidentiels comme Kipé, Taouyah et Ratoma sont les plus recherchés par les familles</li>
  <li>Le recours à des plateformes numériques fiables est devenu incontournable pour trouver un logement de qualité</li>
  <li>Les locations meublées représentent un segment en forte croissance, notamment grâce à la diaspora</li>
</ul>

<h2>Conseils pratiques</h2>
<p>Pour réussir votre projet immobilier en Guinée, quelques règles d'or s'imposent. La prudence et la vérification sont vos meilleurs alliés dans un marché où les arnaques existent, même si elles restent minoritaires face aux offres sérieuses.</p>
<ul>
  <li>Consultez toujours plusieurs annonces avant de prendre une décision</li>
  <li>Visitez physiquement le bien avant de signer quoi que ce soit</li>
  <li>Faites appel à un tiers de confiance pour les transactions importantes</li>
  <li>Utilisez des plateformes vérifiées comme LogerBien qui filtrent les annonces frauduleuses</li>
</ul>

<h2>Conclusion</h2>
<p>En suivant ces conseils, vous maximisez vos chances de trouver le logement idéal à Conakry ou de réussir votre investissement immobilier en Guinée. L'équipe LogerBien est là pour vous accompagner à chaque étape de votre projet.</p>
  `.trim();
}

function formatArticleDate(dateStr: string) {
  return new Intl.DateTimeFormat("fr-GN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(dateStr));
}

export async function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = ARTICLES.find((a) => a.slug === slug);
  if (!article) return { title: "Article introuvable | LogerBien" };
  return {
    title: `${article.title} | LogerBien`,
    description: article.excerpt,
    openGraph: {
      title: article.title,
      description: article.excerpt,
      images: [{ url: article.image }],
      type: "article",
      publishedTime: article.date,
    },
  };
}

export default async function BlogArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = ARTICLES.find((a) => a.slug === slug);
  if (!article) notFound();

  const recentArticles = ARTICLES.filter((a) => a.slug !== slug).slice(0, 3);
  const relatedArticles = ARTICLES.filter(
    (a) => a.slug !== slug && a.category === article.category
  ).slice(0, 2);
  const fallbackRelated =
    relatedArticles.length > 0
      ? relatedArticles
      : ARTICLES.filter((a) => a.slug !== slug).slice(0, 2);

  const content = getArticleContent(slug, article);
  const mins = readTime(article.wordCount);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[var(--bg-primary)]">
      {/* Reading progress bar */}
      <ReadingProgress />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-8 flex-wrap">
          <Link href="/" className="flex items-center gap-1 hover:text-[#D4AF37] transition-colors">
            <Home className="w-3.5 h-3.5" />
            Accueil
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <Link href="/blog" className="hover:text-[#D4AF37] transition-colors">
            Blog
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-slate-700 dark:text-slate-200 line-clamp-1 max-w-xs">
            {article.title}
          </span>
        </nav>

        <div className="lg:grid lg:grid-cols-[1fr_320px] lg:gap-10">
          {/* Main content */}
          <article>
            {/* Header */}
            <header className="mb-8">
              <span
                className={`inline-block text-xs font-bold px-3 py-1 rounded-full mb-4 ${CATEGORY_COLORS[article.category] ?? "bg-slate-100 text-slate-600"}`}
              >
                {article.category}
              </span>
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white leading-tight mb-4">
                {article.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <User className="w-4 h-4" />
                  Équipe LogerBien
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {formatArticleDate(article.date)}
                </span>
                <span className="flex items-center gap-1.5 bg-[#D4AF37]/10 text-[#D4AF37] font-semibold px-2.5 py-0.5 rounded-full">
                  <Clock className="w-3.5 h-3.5" />
                  {mins} min de lecture
                </span>
                {/* Share button */}
                <ShareButton title={article.title} />
              </div>
            </header>

            {/* Cover image */}
            <div className="relative aspect-[16/9] rounded-2xl overflow-hidden mb-8">
              <Image
                src={article.image}
                alt={article.title}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 700px"
                priority
              />
            </div>

            {/* Article body */}
            <div
              className="
                prose prose-slate dark:prose-invert max-w-none
                prose-headings:font-bold prose-headings:text-slate-900 dark:prose-headings:text-white
                prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-3
                prose-p:text-slate-600 dark:prose-p:text-slate-300 prose-p:leading-relaxed
                prose-ul:text-slate-600 dark:prose-ul:text-slate-300
                prose-li:my-1
                prose-strong:text-slate-800 dark:prose-strong:text-white
                [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:text-slate-900 dark:[&_h2]:text-white
                [&_p]:text-slate-600 dark:[&_p]:text-slate-300 [&_p]:leading-relaxed [&_p]:mb-4
                [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_ul]:mb-4
                [&_li]:text-slate-600 dark:[&_li]:text-slate-300
                [&_strong]:text-slate-800 dark:[&_strong]:text-white [&_strong]:font-semibold
              "
              dangerouslySetInnerHTML={{ __html: content }}
            />

            {/* Bottom CTA */}
            <div className="mt-10 p-6 bg-gradient-to-br from-[#D4AF37]/10 to-[#B8963A]/5 border border-[#D4AF37]/20 rounded-2xl">
              <h3 className="font-bold text-slate-900 dark:text-white mb-2">
                Prêt à trouver votre logement ?
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
                Parcourez des centaines d&apos;annonces vérifiées à Conakry et partout en Guinée.
              </p>
              <Link
                href="/annonces"
                className="inline-flex items-center gap-2 bg-[#D4AF37] hover:bg-[#B8963A] text-white font-bold px-5 py-2.5 rounded-xl transition-colors text-sm"
              >
                Voir les annonces
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </article>

          {/* Sidebar */}
          <aside className="mt-10 lg:mt-0">
            <div className="lg:sticky lg:top-6 space-y-6">
              {/* Recent articles */}
              <div className="bg-[var(--bg-card-light)] rounded-2xl border border-[var(--border)] p-5">
                <h3 className="font-bold text-slate-900 dark:text-white mb-4 text-sm uppercase tracking-wider">
                  Articles récents
                </h3>
                <div className="space-y-4">
                  {recentArticles.map((a) => (
                    <Link
                      key={a.slug}
                      href={`/blog/${a.slug}`}
                      className="flex gap-3 group"
                    >
                      <div className="relative w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden">
                        <Image
                          src={a.image}
                          alt={a.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-200"
                          sizes="64px"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 dark:text-white line-clamp-2 group-hover:text-[#D4AF37] transition-colors">
                          {a.title}
                        </p>
                        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {readTime(a.wordCount)} min de lecture
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Newsletter teaser */}
              <div className="bg-gradient-to-br from-[#D4AF37] to-[#B8963A] rounded-2xl p-5 text-white">
                <h3 className="font-bold mb-2">Restez informé</h3>
                <p className="text-white/80 text-sm mb-4">
                  Recevez nos meilleurs conseils immobiliers directement sur WhatsApp.
                </p>
                <a
                  href="https://wa.me/224628222510"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-white text-[#D4AF37] font-bold px-4 py-2 rounded-xl text-sm hover:bg-white/90 transition-colors"
                >
                  Rejoindre
                </a>
              </div>
            </div>
          </aside>
        </div>

        {/* Articles liés */}
        <section className="mt-16">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
            Articles liés
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {fallbackRelated.map((a) => (
              <Link
                key={a.slug}
                href={`/blog/${a.slug}`}
                className="group bg-[var(--bg-card-light)] rounded-2xl overflow-hidden border border-[var(--border)] hover:shadow-lg transition-shadow flex gap-4"
              >
                <div className="relative w-28 flex-shrink-0 aspect-square overflow-hidden">
                  <Image
                    src={a.image}
                    alt={a.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="112px"
                  />
                </div>
                <div className="p-4 flex flex-col justify-center min-w-0">
                  <span
                    className={`inline-block text-xs font-bold px-2.5 py-0.5 rounded-full mb-2 w-fit ${CATEGORY_COLORS[a.category] ?? "bg-slate-100 text-slate-600"}`}
                  >
                    {a.category}
                  </span>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm leading-snug group-hover:text-[#D4AF37] transition-colors line-clamp-2">
                    {a.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {readTime(a.wordCount)} min de lecture
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
