"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Clock, Calendar, ChevronRight, BookOpen, Search } from "lucide-react";

const ARTICLES = [
  {
    slug: "marche-immobilier-conakry-2026",
    title: "Le marché immobilier à Conakry en 2026 : tendances et perspectives",
    excerpt:
      "Analyse des prix, quartiers en hausse et conseils pour investir intelligemment dans la capitale guinéenne.",
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

const CATEGORY_TABS = ["Tous", "Marché", "Conseils", "Quartiers", "Juridique", "Actualités"];

const CATEGORY_COLORS: Record<string, string> = {
  Marché: "bg-blue-500/20 text-blue-400",
  Conseils: "bg-green-500/20 text-[#D4AF37]",
  Quartiers: "bg-purple-500/20 text-purple-400",
  Juridique: "bg-[#D4AF37]/20 text-[#D4AF37]",
  Actualités: "bg-rose-500/20 text-rose-400",
};

function formatArticleDate(dateStr: string) {
  return new Intl.DateTimeFormat("fr-GN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(dateStr));
}

export default function BlogPage() {
  const [activeCategory, setActiveCategory] = useState("Tous");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let list = ARTICLES;
    if (activeCategory !== "Tous") {
      list = list.filter((a) => a.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.excerpt.toLowerCase().includes(q)
      );
    }
    return list;
  }, [activeCategory, search]);

  const [featured, ...rest] = filtered;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[var(--bg-primary)]">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#D4AF37] via-[#B8963A] to-[#c2540a] text-white">
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-20 text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm font-medium mb-5">
            <BookOpen className="w-4 h-4" />
            Ressources immobilières
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4">
            Blog &amp; Actualités
          </h1>
          <p className="text-white/80 text-lg max-w-2xl mx-auto mb-8">
            Conseils, analyses et guides pour réussir votre projet immobilier en
            Guinée. Restez informé des tendances du marché à Conakry.
          </p>

          {/* Search input */}
          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un article..."
              className="w-full bg-white/20 backdrop-blur-sm border border-white/30 rounded-full pl-10 pr-4 py-2.5 text-white placeholder-white/60 text-sm focus:outline-none focus:bg-white/30 transition-colors"
            />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Category filter tabs */}
        <div className="flex flex-wrap gap-2 mb-10">
          {CATEGORY_TABS.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={
                cat === activeCategory
                  ? "px-4 py-1.5 rounded-full text-sm font-semibold bg-[#D4AF37] text-white cursor-pointer"
                  : "px-4 py-1.5 rounded-full text-sm font-semibold bg-[var(--bg-card-light)] text-slate-600 dark:text-slate-300 border border-[var(--color-border)] hover:border-[#D4AF37] hover:text-[#D4AF37] cursor-pointer transition-colors"
              }
            >
              {cat}
            </button>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20 text-slate-400">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-semibold">Aucun article trouvé</p>
            <p className="text-sm mt-1">Essayez une autre catégorie ou un autre mot-clé.</p>
          </div>
        )}

        {featured && (
          <>
            {/* Featured article */}
            <div className="mb-12">
              <p className="text-xs font-bold text-[#D4AF37] uppercase tracking-widest mb-4">
                Article à la une
              </p>
              <Link href={`/blog/${featured.slug}`} className="group block">
                <div className="bg-[var(--bg-card-light)] rounded-3xl overflow-hidden border border-[var(--color-border)] hover:shadow-2xl transition-shadow duration-300 md:flex">
                  <div className="relative md:w-1/2 aspect-[16/9] md:aspect-auto md:min-h-[360px]">
                    <Image
                      src={featured.image}
                      alt={featured.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 768px) 100vw, 50vw"
                      priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                    {/* Reading time badge on image */}
                    <span className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {readTime(featured.wordCount)} min de lecture
                    </span>
                  </div>
                  <div className="p-8 md:w-1/2 flex flex-col justify-center">
                    <span
                      className={`inline-block text-xs font-bold px-3 py-1 rounded-full mb-4 w-fit ${CATEGORY_COLORS[featured.category] ?? "bg-slate-100 text-slate-600"}`}
                    >
                      {featured.category}
                    </span>
                    <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white leading-tight mb-3 group-hover:text-[#D4AF37] transition-colors">
                      {featured.title}
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                      {featured.excerpt}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-slate-400 mb-6">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        {readTime(featured.wordCount)} min de lecture
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        {formatArticleDate(featured.date)}
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-2 bg-[#D4AF37] hover:bg-[#B8963A] text-white font-bold px-6 py-3 rounded-xl transition-colors w-fit">
                      Lire l&apos;article
                      <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </Link>
            </div>

            {/* Other articles grid */}
            {rest.length > 0 && (
              <>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
                  {activeCategory === "Tous" ? "Tous les articles" : `Catégorie : ${activeCategory}`}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {rest.map((article) => (
                    <Link
                      key={article.slug}
                      href={`/blog/${article.slug}`}
                      className="group bg-[var(--bg-card-light)] rounded-2xl overflow-hidden border border-[var(--color-border)] hover:shadow-xl transition-shadow duration-200 flex flex-col"
                    >
                      <div className="relative aspect-[16/9] overflow-hidden">
                        <Image
                          src={article.image}
                          alt={article.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                        {/* Reading time badge */}
                        <span className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {readTime(article.wordCount)} min de lecture
                        </span>
                      </div>
                      <div className="p-5 flex flex-col flex-1">
                        <span
                          className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full mb-3 w-fit ${CATEGORY_COLORS[article.category] ?? "bg-slate-100 text-slate-600"}`}
                        >
                          {article.category}
                        </span>
                        <h3 className="font-bold text-slate-900 dark:text-white leading-snug mb-2 group-hover:text-[#D4AF37] transition-colors flex-1">
                          {article.title}
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-4 line-clamp-2">
                          {article.excerpt}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-slate-400 mt-auto">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {readTime(article.wordCount)} min
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatArticleDate(article.date)}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
