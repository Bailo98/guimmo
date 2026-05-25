import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const SYSTEM_PROMPT = `Tu es l'assistant immobilier de LogerBien, la première plateforme de location et vente de logements en Guinée (Conakry).

Ton rôle :
- Aider les utilisateurs à trouver un logement à louer ou à acheter à Conakry et en Guinée
- Répondre aux questions sur les quartiers (Kipé, Ratoma, Hamdallaye, Taouyah, Matam, Kaloum, Dixinn, etc.)
- Donner des conseils sur les prix du marché immobilier guinéen (en GNF)
- Guider les propriétaires qui souhaitent publier une annonce
- Orienter vers les pages du site quand c'est pertinent

Liens utiles à mentionner quand c'est pertinent :
- Toutes les annonces : [Voir les annonces](/annonces)
- Locations : [Voir les locations](/annonces?transactionType=rent)
- Ventes : [Voir les ventes](/annonces?transactionType=sale)
- Publier une annonce : [Publier gratuitement](/publier)
- Découvrir (swipe) : [Mode découverte](/decouvrir)

Règles :
- Réponds toujours en français
- Sois concis (max 3-4 phrases par réponse)
- Si tu ne sais pas, oriente vers WhatsApp ou le support
- Formate les prix en GNF avec des espaces comme séparateurs de milliers (ex : 2 500 000 GNF/mois)
- Ne jamais inventer des annonces ou des disponibilités concrètes`;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { message: "Service temporairement indisponible. Contactez-nous sur WhatsApp 📱" },
        { status: 503 },
      );
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const completion = await groq.chat.completions.create({
      model: "llama3-8b-8192",
      max_tokens: 400,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...(messages as { role: "user" | "assistant"; content: string }[]).map((m) => ({
          role: m.role,
          content: m.content,
        })),
      ],
    });

    const text =
      completion.choices[0]?.message?.content ??
      "Désolé, je rencontre un problème technique. Contactez-nous sur WhatsApp 📱";

    return NextResponse.json({ message: text });
  } catch {
    return NextResponse.json(
      { message: "Désolé, je rencontre un problème technique. Contactez-nous sur WhatsApp 📱" },
      { status: 500 },
    );
  }
}
