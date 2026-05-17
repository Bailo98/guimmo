import type { Metadata } from "next";
import { MapPin, MessageCircle, UserCheck } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { NEIGHBORHOODS } from "@/data/neighborhoods";
import { AgentApplicationForm } from "./AgentApplicationForm";

export const metadata: Metadata = {
  title: "Agents immobiliers — BienLoger",
  description: "Trouvez un agent immobilier de confiance à Conakry par quartier.",
};

export const revalidate = 300;

interface Agent {
  id: string;
  name: string;
  neighborhood: string;
  whatsapp: string;
  phone?: string | null;
  photo_url: string | null;
  description: string | null;
  listings_count: number;
}

async function fetchAgents(): Promise<Agent[]> {
  if (!isSupabaseConfigured || !supabase) return DEMO_AGENTS;
  const { data } = await supabase
    .from("agents")
    .select("id, name, neighborhood, whatsapp, phone, photo_url, description, listings_count")
    .eq("is_active", true)
    .order("neighborhood");
  return (data as Agent[]) ?? DEMO_AGENTS;
}

const DEMO_AGENTS: Agent[] = [
  { id: "1", name: "Mamadou Diallo",  neighborhood: "kipe",       whatsapp: "+224628000001", photo_url: null, description: "Spécialiste location Kipé & Ratoma depuis 5 ans.", listings_count: 12 },
  { id: "2", name: "Fatoumata Bah",   neighborhood: "hamdallaye", whatsapp: "+224628000002", photo_url: null, description: "Expert vente villa haut standing.", listings_count: 8 },
  { id: "3", name: "Ibrahima Sow",    neighborhood: "matam",      whatsapp: "+224628000003", photo_url: null, description: "Annonces vérifiées, réponse rapide.", listings_count: 15 },
  { id: "4", name: "Aissatou Barry",  neighborhood: "dixinn",     whatsapp: "+224628000004", photo_url: null, description: "Locations meublées et non meublées Dixinn.", listings_count: 6 },
];

function nbLabel(id: string) {
  return NEIGHBORHOODS.find((n) => n.id === id)?.name ?? id;
}

function whatsappLink(phone: string, name: string) {
  const text = encodeURIComponent(`Bonjour ${name}, je vous contacte via BienLoger. Pouvez-vous m'aider à trouver un bien ?`);
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
      {/* Hero */}
      <div className="mb-8">
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-3"
          style={{ background: "rgba(233,233,0,0.15)", color: "var(--BienLoger-amber-light)", border: "1px solid rgba(233,233,0,0.25)" }}
        >
          <UserCheck className="w-3.5 h-3.5" /> Agents certifiés
        </div>
        <h1 className="text-2xl font-black text-white mb-1">Agents BienLoger</h1>
        <p className="text-white/50 text-sm">Votre quartier, votre expert — contactez un agent local de confiance</p>
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
                  <Avatar
                    url={agent.photo_url}
                    name={agent.name}
                    size="md"
                    style={{ width: 56, height: 56, borderRadius: 12, flexShrink: 0 }}
                  />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-white text-sm">{agent.name}</p>
                      {/* Agent Officiel badge */}
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(233,233,0,0.15)", color: "#E9E900", border: "1px solid rgba(233,233,0,0.25)" }}>
                        ✓ Agent Officiel
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <div className="flex items-center gap-1 text-white/40 text-xs">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        <span>{nbLabel(agent.neighborhood)}</span>
                      </div>
                      {agent.listings_count > 0 && (
                        <span className="text-white/40 text-xs">
                          📋 {agent.listings_count} annonce{agent.listings_count > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    {agent.description && (
                      <p className="text-white/50 text-xs mt-1 line-clamp-2">{agent.description}</p>
                    )}
                  </div>

                  {/* WhatsApp CTA */}
                  <a
                    href={whatsappLink(agent.whatsapp, agent.name)}
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

      {/* Devenir agent — form section */}
      <div
        className="mt-12 rounded-2xl p-6"
        style={{ background: "rgba(200,144,30,0.08)", border: "1px solid rgba(200,144,30,0.20)" }}
      >
        <h2 className="text-white font-black text-lg mb-1">Devenir agent BienLoger</h2>
        <p className="text-white/50 text-sm mb-5">Rejoignez notre réseau et touchez des milliers de clients à Conakry</p>
        <AgentApplicationForm />
      </div>
    </div>
  );
}
