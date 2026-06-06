import type { Metadata } from "next";
import { ClipboardList, MapPin, MessageCircle, UserCheck } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { NEIGHBORHOODS } from "@/data/neighborhoods";
import { AgentApplicationForm } from "./AgentApplicationForm";

export const metadata: Metadata = {
  title: "Agents immobiliers à Conakry | LogerBien",
  description:
    "Agents immobiliers certifiés à Conakry. Trouvez un expert local par quartier sur LogerBien.",
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
  if (!isSupabaseConfigured || !supabase) return [];
  const { data } = await supabase
    .from("agents")
    .select("id, name, neighborhood, whatsapp, phone, photo_url, description, listings_count")
    .eq("is_active", true)
    .order("neighborhood");
  return (data as Agent[]) ?? [];
}

function nbLabel(id: string) {
  return NEIGHBORHOODS.find((n) => n.id === id)?.name ?? id;
}

function whatsappLink(phone: string, name: string) {
  const text = encodeURIComponent(`Bonjour ${name}, je vous contacte via LogerBien. Pouvez-vous m'aider à trouver un bien ?`);
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
    <div className="agents-page-light max-w-2xl mx-auto px-4 pt-6 pb-28">
      {/* Hero */}
      <div className="mb-8">
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-3"
          style={{ background: "rgba(212,175,55,0.15)", color: "var(--accent-gold-light)", border: "1px solid rgba(212,175,55,0.25)" }}
        >
          <UserCheck className="w-3.5 h-3.5" /> Agents certifiés
        </div>
        <h1 className="text-2xl font-black app-text mb-1">Agents LogerBien</h1>
        <p className="app-text-muted text-sm">Votre quartier, votre expert — contactez un agent local de confiance</p>
      </div>

      {neighborhoods.length === 0 && (
        <p className="app-text-muted text-center mt-20">Aucun agent disponible pour le moment.</p>
      )}

      <div className="space-y-8">
        {neighborhoods.map((nb) => (
          <div key={nb}>
            {/* Neighborhood heading */}
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-white/40 flex-shrink-0" />
              <h2 className="text-white font-bold text-base">{nbLabel(nb)}</h2>
              <div className="flex-1 h-px" style={{ background: "var(--border-subtle)" }} />
            </div>

            <div className="space-y-3">
              {byNeighborhood[nb].map((agent) => (
                <div
                  key={agent.id}
                  className="flex items-center gap-4 rounded-2xl p-4"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
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
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(212,175,55,0.15)", color: "var(--accent-gold)", border: "1px solid rgba(212,175,55,0.25)" }}>
                        ✓ Agent Officiel
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <div className="flex items-center gap-1 text-white/40 text-xs">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        <span>{nbLabel(agent.neighborhood)}</span>
                      </div>
                      {agent.listings_count > 0 && (
                        <span className="inline-flex items-center gap-1 text-white/40 text-xs">
                          <ClipboardList className="h-3 w-3" />
                          {agent.listings_count} annonce{agent.listings_count > 1 ? "s" : ""}
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
        style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.20)" }}
      >
        <h2 className="app-text font-black text-lg mb-1">Devenir agent LogerBien</h2>
        <p className="app-text-muted text-sm mb-5">Rejoignez notre réseau et touchez des milliers de clients à Conakry</p>
        <AgentApplicationForm />
      </div>
    </div>
  );
}
