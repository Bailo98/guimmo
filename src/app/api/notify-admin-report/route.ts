import { Resend } from "resend";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { propertyTitle, reason, details, reporterPhone } = await req.json() as {
      propertyTitle?: string;
      reason?: string;
      details?: string | null;
      reporterPhone?: string | null;
    };

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return NextResponse.json({ ok: false, error: "RESEND_API_KEY not set" }, { status: 500 });

    const resend = new Resend(apiKey);
    const adminEmail = process.env.ADMIN_EMAIL || "diallobailoca2025@gmail.com";

    const reasonLabels: Record<string, string> = {
      fraud:         "Annonce frauduleuse / arnaque",
      already_taken: "Logement déjà loué / vendu",
      fake_photos:   "Photos fausses ou volées",
      wrong_price:   "Prix incorrect",
      other:         "Autre",
    };

    await resend.emails.send({
      from: "GuImmo <onboarding@resend.dev>",
      to: adminEmail,
      subject: `🚨 Nouveau signalement — ${propertyTitle ?? "Annonce inconnue"}`,
      html: `
        <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:24px;background:#0A1216;color:#fff;border-radius:12px;">
          <h2 style="color:#E9E900;margin-top:0;">🚨 Nouveau signalement reçu</h2>
          <p><strong>Annonce :</strong> ${propertyTitle ?? "—"}</p>
          <p><strong>Raison :</strong> ${reasonLabels[reason ?? ""] ?? reason ?? "—"}</p>
          <p><strong>Détails :</strong> ${details ?? "Aucun"}</p>
          <p><strong>Signalé par :</strong> ${reporterPhone ?? "Anonyme"}</p>
          <a href="https://guimmo-orcin.vercel.app/admin/signalements"
             style="display:inline-block;margin-top:16px;padding:12px 24px;
                    background:#E9E900;color:#0A1216;border-radius:8px;
                    font-weight:700;text-decoration:none;">
            Voir les signalements
          </a>
        </div>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[notify-admin-report]", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
