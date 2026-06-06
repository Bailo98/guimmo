import type { Metadata } from "next";
import Link from "next/link";
import { Banknote, Star, MapPin, Users, Building2, BarChart3 } from "lucide-react";

export const metadata: Metadata = {
  title: "TÃ©moignages | LogerBien",
  description:
    "DÃ©couvrez les avis et tÃ©moignages de locataires et propriÃ©taires qui ont trouvÃ© leur logement grÃ¢ce Ã  LogerBien en GuinÃ©e.",
};

const TESTIMONIALS = [
  {
    name: "Mamadou KouyatÃ©",
    role: "Locataire â€¢ KipÃ©",
    rating: 5,
    text: "J'ai trouvÃ© mon appartement en 3 jours grÃ¢ce Ã  LogerBien. Les photos correspondaient exactement Ã  la rÃ©alitÃ©, et le propriÃ©taire Ã©tait trÃ¨s rÃ©actif sur WhatsApp.",
    neighborhood: "KipÃ©",
    saved: "500.000 GNF/mois",
  },
  {
    name: "Fatoumata Bah",
    role: "PropriÃ©taire â€¢ Ratoma",
    rating: 5,
    text: "J'ai publiÃ© mon studio meublÃ© et j'ai reÃ§u 12 contacts en 48h. Le boost a vraiment fait la diffÃ©rence. Je recommande Ã  tous les propriÃ©taires.",
    neighborhood: "Ratoma",
    saved: null,
  },
  {
    name: "Ibrahim Diallo",
    role: "Locataire â€¢ Hamdallaye",
    rating: 4,
    text: "Super plateforme ! La carte interactive m'a permis de trouver exactement le quartier que je voulais. J'aurais aimÃ© encore plus de photos.",
    neighborhood: "Hamdallaye",
    saved: "1.200.000 GNF",
  },
  {
    name: "Aissatou Camara",
    role: "Agent immobilier",
    rating: 5,
    text: "En tant qu'agent, LogerBien m'a permis de multiplier mes annonces et mes clients. L'interface est simple et mes clients trouvent facilement.",
    neighborhood: "Conakry",
    saved: null,
  },
  {
    name: "SÃ©kou CondÃ©",
    role: "Locataire â€¢ Taouyah",
    rating: 5,
    text: "J'Ã©tais dans la diaspora et je cherchais un logement avant mon retour en GuinÃ©e. Les visites virtuelles 360Â° m'ont convaincu sans avoir Ã  me dÃ©placer !",
    neighborhood: "Taouyah",
    saved: null,
  },
  {
    name: "Mariama Sylla",
    role: "PropriÃ©taire â€¢ Lambanyi",
    rating: 4,
    text: "Ma villa Ã©tait vide depuis 6 mois. AprÃ¨s publication sur LogerBien, j'ai trouvÃ© des locataires sÃ©rieux en moins de 2 semaines.",
    neighborhood: "Lambanyi",
    saved: null,
  },
  {
    name: "Oumar Barry",
    role: "Locataire â€¢ Dixinn",
    rating: 5,
    text: "Le calculateur de budget est vraiment pratique. Ã‡a m'a aidÃ© Ã  dÃ©finir clairement ce que je pouvais me permettre avant de chercher.",
    neighborhood: "Dixinn",
    saved: "800.000 GNF",
  },
  {
    name: "Kadiatou KonatÃ©",
    role: "Agence immobiliÃ¨re",
    rating: 5,
    text: "Notre agence gÃ¨re 30+ annonces sur LogerBien. La plateforme est fiable, les annonceurs sÃ©rieux et le support rÃ©actif.",
    neighborhood: "Conakry",
    saved: null,
  },
  {
    name: "Abdoulaye Keita",
    role: "Locataire â€¢ Kaloum",
    rating: 4,
    text: "TrÃ¨s bonne expÃ©rience. Le processus de rÃ©servation de visite est simple et j'ai pu visiter 4 appartements en une journÃ©e grÃ¢ce Ã  la carte.",
    neighborhood: "Kaloum",
    saved: "300.000 GNF",
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${i < rating ? "fill-[var(--accent-gold)] text-[var(--accent-gold)]" : "text-slate-300 dark:text-slate-600"}`}
        />
      ))}
    </div>
  );
}

export default function TemoignagesPage() {
  // Split into 3 columns for masonry effect
  const col1 = TESTIMONIALS.filter((_, i) => i % 3 === 0);
  const col2 = TESTIMONIALS.filter((_, i) => i % 3 === 1);
  const col3 = TESTIMONIALS.filter((_, i) => i % 3 === 2);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[var(--bg-primary)]">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[var(--accent-gold)] via-[#B8963A] to-[#c2540a] text-[var(--text-primary)]">
        <div className="max-w-4xl mx-auto px-4 py-16 md:py-20 text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm font-medium mb-5">
            <Star className="w-4 h-4 fill-white" />
            Ils nous font confiance
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4 leading-tight">
            Ils ont trouvÃ© leur logement<br className="hidden md:block" /> grÃ¢ce Ã  LogerBien
          </h1>
          <p className="text-white/80 text-lg">
            Des milliers de GuinÃ©ens nous font confiance pour leur projet immobilier.
          </p>
        </div>
      </div>

      {/* Stats bar */}
      <div className="bg-[var(--bg-card-light)] border-b border-[var(--border)]">
        <div className="max-w-4xl mx-auto px-4 py-5">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="flex flex-col items-center gap-1">
              <Users className="w-5 h-5 text-[var(--accent-gold)]" />
              <span className="text-xl md:text-2xl font-black text-slate-900 dark:text-[var(--text-primary)]">2 400+</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">locataires satisfaits</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Building2 className="w-5 h-5 text-[var(--accent-gold)]" />
              <span className="text-xl md:text-2xl font-black text-slate-900 dark:text-[var(--text-primary)]">890+</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">propriÃ©taires actifs</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <BarChart3 className="w-5 h-5 text-[var(--accent-gold)]" />
              <span className="text-xl md:text-2xl font-black text-slate-900 dark:text-[var(--text-primary)]">4.8/5</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">note moyenne</span>
            </div>
          </div>
        </div>
      </div>

      {/* Masonry grid */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Desktop: 3 cols masonry */}
        <div className="hidden lg:grid lg:grid-cols-3 lg:gap-5 items-start">
          {[col1, col2, col3].map((col, colIdx) => (
            <div key={colIdx} className="flex flex-col gap-5">
              {col.map((t) => (
                <TestimonialCard key={t.name} testimonial={t} />
              ))}
            </div>
          ))}
        </div>

        {/* Tablet: 2 cols */}
        <div className="hidden md:grid md:grid-cols-2 md:gap-5 lg:hidden items-start">
          {[
            TESTIMONIALS.filter((_, i) => i % 2 === 0),
            TESTIMONIALS.filter((_, i) => i % 2 === 1),
          ].map((col, colIdx) => (
            <div key={colIdx} className="flex flex-col gap-5">
              {col.map((t) => (
                <TestimonialCard key={t.name} testimonial={t} />
              ))}
            </div>
          ))}
        </div>

        {/* Mobile: 1 col */}
        <div className="md:hidden flex flex-col gap-5">
          {TESTIMONIALS.map((t) => (
            <TestimonialCard key={t.name} testimonial={t} />
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="bg-[var(--bg-card-light)] border-t border-slate-100 dark:border-[var(--border)]">
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-[var(--text-primary)] mb-3">
            Rejoignez la communautÃ© LogerBien
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8">
            Des milliers de GuinÃ©ens ont dÃ©jÃ  trouvÃ© leur logement idÃ©al. Ã€ votre tour !
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/annonces"
              className="inline-flex items-center justify-center gap-2 bg-[var(--accent-gold)] hover:bg-[#B8963A] text-[var(--text-primary)] font-bold px-7 py-3.5 rounded-xl transition-colors"
            >
              Chercher un logement
            </Link>
            <Link
              href="/inscription"
              className="inline-flex items-center justify-center gap-2 bg-[var(--bg-card-light)] border border-[var(--border)] text-[var(--text-primary)] font-bold px-7 py-3.5 rounded-xl hover:border-[var(--accent-gold)] transition-colors"
            >
              CrÃ©er un compte
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function TestimonialCard({
  testimonial,
}: {
  testimonial: (typeof TESTIMONIALS)[0];
}) {
  return (
    <div className="bg-[var(--bg-card-light)] rounded-2xl border border-[var(--border)] p-5 flex flex-col gap-3">
      {/* Stars */}
      <StarRating rating={testimonial.rating} />

      {/* Quote */}
      <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
        &ldquo;{testimonial.text}&rdquo;
      </p>

      {/* Saved badge */}
      {testimonial.saved && (
        <div className="inline-flex items-center gap-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-[var(--accent-gold)] text-xs font-semibold px-3 py-1.5 rounded-full w-fit">
          <Banknote className="h-3.5 w-3.5" />
          Economisé {testimonial.saved}
        </div>
      )}

      {/* Author */}
      <div className="flex items-center gap-3 pt-1 border-t border-slate-100 dark:border-[var(--border)] mt-auto">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--accent-gold)] to-[#B8963A] flex items-center justify-center text-[var(--text-primary)] font-bold text-sm flex-shrink-0">
          {testimonial.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900 dark:text-[var(--text-primary)] text-sm truncate">
            {testimonial.name}
          </p>
          <p className="text-slate-400 text-xs truncate">{testimonial.role}</p>
        </div>
        <span className="inline-flex items-center gap-1 text-xs text-slate-400 flex-shrink-0">
          <MapPin className="w-3 h-3" />
          {testimonial.neighborhood}
        </span>
      </div>
    </div>
  );
}
