import type { Metadata } from "next";
import Image from "next/image";
import { MapPin, MessageCircle, UserCheck } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { NEIGHBORHOODS } from "@/data/neighborhoods";

export const metadata: Metadata = {
  title: "Agents immobiliers — GuImmo",
  description: "Trouvez un agent immobilier de confiance à Conakry par quartier.",
};

export const revalidate = 300;

interface Agent {
  id: string;
  name: string;
  neighborhood: string;
  whatsapp: string;
  photo_url: string | null;
  bio: string | null;
}

async function fetchAgents(): Promise<Agent[]> {
  if (!isSupabaseConfigured || !supabase) return DEMO_AGENTS;
  const { data } = await supabase
    .from("agents")
    .select("id, name, neighborhood, whatsapp, photo_url, bio")
    .eq("is_active", true)
    .order("neighborhood");
  return (data as Agent[]) ?? DEMO_AGENTS;
}

const DEMO_AGENTS: Agent[] = [
  { id: "1", name: "Mamadou Diallo", neighborhood: "kipe",       whatsapp: "+224628000001", photo_url: null, bio: "Spécialiste location Kipé & Ratoma depuis 5 ans." },
  { id: "2", name: "Fatoumata Bah",  neighborhood: "hamdallaye", whatsapp: "+224628000002", photo_url: null, bio: "Expert vente villa haut standing." },
  { id: "3", name: "Ibrahima Sow",   neighborhood: "matam",      whatsapp: "+224628000003", photo_url: null, bio: "Annonces vérifiées, réponse rapide." },
  { id: "4", name: "Aissatou Barry", neighborhood: "dixinn",     whatsapp: "+224628000004", photo_url: null, bio: "Locations meublées et non meublées Dixinn." },
];

function nbLabel(id: string) {
  return NEIGHBORHOODS.find((n) => n.id === id)?.name ?? id;
}

function whatsappUrl(phone: string, name: string) {
  const text = encodeURIComponent(`Bonjour ${name}, je vous contacte via GuImmo. Pouvez-vous m'aider à trouver un bien ?`);
  return `https://wa.me/${phone.replace(/\D/g, "")}?text=${text}`;
}

export default async function AgentsPage() {
  const agents = await fetchAgents();

  // Group by neighborhood
  const byNeighborhood = agents.reduce<Record<string, Agent[]>>((acc, a) => {
    (acc[a.neighborhood] ??= []).push(a);
    return acc;
  }, {});

  const neighborhoods = Object.keys(byNeighborhood).sort((a, b) =>
    nbLabel(a).localeCompare(nbLabel(b), "fr")
  );

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-28">
      {/* Header */}
      <div className="mb-8">
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-3"
          style={{ background: "rgba(200,144,30,0.15)", color: "var(--guimmo-amber-light)", border: "1px solid rgba(200,144,30,0.25)" }}
        >
          <UserCheck className="w-3.5 h-3.5" /> Agents vérifiés
        </div>
        <h1 className="text-2xl font-black text-white mb-1">Nos agents immobiliers</h1>
        <p className="text-white/50 text-sm">Trouvez un agent de confiance dans votre quartier</p>
      </div>

      {neighborhoods.length === 0 && (
        <p className="text-white/40 text-center mt-20">Aucun agent disponible pour le moment.</p>
      )}

      <div className="space-y-8">
        {neighborhoods.map((nb) => (
          <div key={nb}>
            {/* Neighborhood heading */}
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-white/40 flex-shrink-0" />
              <h2 className="text-white font-bold text-base">{nbLabel(nb)}</h2>
              <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
            </div>

            <div className="space-y-3">
              {byNeighborhood[nb].map((agent) => (
                <div
                  key={agent.id}
                  className="flex items-center gap-4 rounded-2xl p-4"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  {/* Avatar */}
                  <div className="w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0 flex items-center justify-center text-2xl font-black text-white/60"
                    style={{ background: "rgba(200,144,30,0.15)", border: "1px solid rgba(200,144,30,0.20)" }}>
                    {agent.photo_url ? (
                      <Image src={agent.photo_url} alt={agent.name} width={56} height={56} className="object-cover w-full h-full" />
                    ) : (
                      agent.name[0]
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white text-sm">{agent.name}</p>
                    <div className="flex items-center gap-1 text-white/40 text-xs mt-0.5">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span>{nbLabel(agent.neighborhood)}</span>
                    </div>
                    {agent.bio && (
                      <p className="text-white/50 text-xs mt-1 line-clamp-2">{agent.bio}</p>
                    )}
                  </div>

                  {/* WhatsApp CTA */}
                  <a
                    href={whatsappUrl(agent.whatsapp, agent.name)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 rounded-xl font-bold text-white text-xs flex-shrink-0"
                    style={{ minHeight: 40, background: "#25D366", whiteSpace: "nowrap" }}
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    Contacter
                  </a>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* CTA to become an agent */}
      <div
        className="mt-10 rounded-2xl p-5 text-center"
        style={{ background: "rgba(200,144,30,0.10)", border: "1px solid rgba(200,144,30,0.20)" }}
      >
        <p className="text-white font-bold text-sm mb-1">Vous êtes agent immobilier ?</p>
        <p className="text-white/50 text-xs mb-3">Rejoignez GuImmo et touchez des milliers de clients à Conakry</p>
        <a
          href={`https://wa.me/${(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "224000000000").replace(/\D/g, "")}?text=${encodeURIComponent("Bonjour, je souhaite devenir agent sur GuImmo.")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 rounded-xl font-bold text-white text-sm"
          style={{ minHeight: 44, background: "#25D366" }}
        >
          <MessageCircle className="w-4 h-4" /> Nous contacter
        </a>
      </div>
    </div>
  );
}
