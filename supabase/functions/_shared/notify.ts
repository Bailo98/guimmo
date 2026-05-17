import { Resend } from "npm:resend";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const FROM = "BienLoger <onboarding@resend.dev>";

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  try {
    const { error } = await resend.emails.send({ from: FROM, to, subject, html });
    if (error) {
      console.error("[email] send error:", error);
    } else {
      console.log(`[email] sent → ${to}: ${subject}`);
    }
  } catch (err) {
    console.error("[email] exception:", err);
  }
}

// ── Layout helpers ────────────────────────────────────────────────────────────

function btn(label: string, url: string): string {
  return `<a href="${url}" style="display:inline-block;background:#10b981;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-family:sans-serif">${label}</a>`;
}

function layout(body: string): string {
  return `<!DOCTYPE html><html lang="fr"><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1f2937;background:#fff">
${body}
<hr style="margin:32px 0;border:none;border-top:1px solid #e5e7eb">
<p style="color:#9ca3af;font-size:12px;line-height:1.6">
  BienLoger — La plateforme immobilière de confiance en Guinée<br>
  <a href="https://guimmo-orcin.vercel.app" style="color:#10b981">guimmo-orcin.vercel.app</a>
</p>
</body></html>`;
}

// ── Templates ─────────────────────────────────────────────────────────────────

export function emailExpired(ownerName: string, listingTitle: string, renewUrl: string) {
  return {
    subject: "Votre annonce a expiré — BienLoger",
    html: layout(`
      <h2 style="color:#f59e0b;margin-bottom:8px">⏰ Annonce expirée</h2>
      <p>Bonjour <strong>${ownerName}</strong>,</p>
      <p>Votre annonce <strong>« ${listingTitle} »</strong> a été mise en pause car elle a expiré après 30 jours.</p>
      <p style="margin:28px 0">${btn("Renouveler mon annonce", renewUrl)}</p>
      <p style="color:#6b7280;font-size:14px">Si vous ne souhaitez plus publier cette annonce, vous n'avez rien à faire.</p>
    `),
  };
}

export function emailReminder(ownerName: string, listingTitle: string, daysLeft: number, renewUrl: string) {
  return {
    subject: `Votre annonce expire dans ${daysLeft} jour${daysLeft > 1 ? "s" : ""} — BienLoger`,
    html: layout(`
      <h2 style="color:#f59e0b;margin-bottom:8px">⚠️ Rappel — Expiration proche</h2>
      <p>Bonjour <strong>${ownerName}</strong>,</p>
      <p>Votre annonce <strong>« ${listingTitle} »</strong> expire dans <strong>${daysLeft} jour${daysLeft > 1 ? "s" : ""}</strong>.</p>
      <p>Renouvelez-la maintenant pour qu'elle reste visible sur BienLoger.</p>
      <p style="margin:28px 0">${btn("Renouveler maintenant", renewUrl)}</p>
    `),
  };
}

export function emailSearchAlert(
  userName: string,
  alertLabel: string,
  listings: Array<{ id: string; title: string; commune?: string | null; wilaya?: string | null; price: number }>,
  appUrl: string,
) {
  const rows = listings.slice(0, 3).map((p) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #f3f4f6">
        <strong>${p.title}</strong><br>
        <span style="color:#6b7280;font-size:13px">${[p.commune, p.wilaya].filter(Boolean).join(", ")} — ${p.price.toLocaleString("fr-FR")} GNF</span>
      </td>
      <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;text-align:right;white-space:nowrap">
        <a href="${appUrl}/annonces/${p.id}" style="color:#10b981;text-decoration:none;font-size:14px">Voir →</a>
      </td>
    </tr>`).join("");

  const extra = listings.length > 3
    ? `<p style="color:#6b7280;font-size:14px">…et ${listings.length - 3} autre(s) annonce(s)</p>`
    : "";

  return {
    subject: "Nouvelle annonce correspondant à votre recherche — BienLoger",
    html: layout(`
      <h2 style="color:#10b981;margin-bottom:8px">🔔 Nouvelle annonce pour vous</h2>
      <p>Bonjour <strong>${userName}</strong>,</p>
      <p>Une nouvelle annonce correspond à votre alerte <strong>« ${alertLabel} »</strong> :</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">${rows}</table>
      ${extra}
      <p style="margin:28px 0">${btn("Voir toutes les annonces", `${appUrl}/annonces`)}</p>
    `),
  };
}

export function emailMonthlyReport(
  ownerName: string,
  month: string,
  stats: { views: number; contacts: number; active: number },
  dashboardUrl: string,
) {
  return {
    subject: `Votre bilan BienLoger de ${month}`,
    html: layout(`
      <h2 style="color:#10b981;margin-bottom:8px">📊 Bilan du mois — ${month}</h2>
      <p>Bonjour <strong>${ownerName}</strong>,</p>
      <p>Voici votre bilan du mois de <strong>${month}</strong> :</p>
      <table style="width:100%;border-collapse:collapse;margin:20px 0">
        <tr><td style="padding:12px 16px;background:#f9fafb;border-radius:8px;margin-bottom:4px">
          <span style="font-size:24px;font-weight:700;color:#1f2937">${stats.views}</span>
          <span style="color:#6b7280;margin-left:8px">vues sur vos annonces</span>
        </td></tr>
        <tr><td style="padding:4px"></td></tr>
        <tr><td style="padding:12px 16px;background:#f9fafb;border-radius:8px">
          <span style="font-size:24px;font-weight:700;color:#1f2937">${stats.contacts}</span>
          <span style="color:#6b7280;margin-left:8px">contacts reçus</span>
        </td></tr>
        <tr><td style="padding:4px"></td></tr>
        <tr><td style="padding:12px 16px;background:#f9fafb;border-radius:8px">
          <span style="font-size:24px;font-weight:700;color:#1f2937">${stats.active}</span>
          <span style="color:#6b7280;margin-left:8px">annonces actives</span>
        </td></tr>
      </table>
      <p style="margin:28px 0">${btn("Voir mon tableau de bord", dashboardUrl)}</p>
    `),
  };
}

export function emailAutoApproved(ownerName: string, listingTitle: string, listingUrl: string) {
  return {
    subject: "Votre annonce est maintenant en ligne — BienLoger",
    html: layout(`
      <h2 style="color:#10b981;margin-bottom:8px">✅ Annonce publiée !</h2>
      <p>Bonjour <strong>${ownerName}</strong>,</p>
      <p>Bonne nouvelle ! Votre annonce <strong>« ${listingTitle} »</strong> a été vérifiée et est maintenant visible sur BienLoger.</p>
      <p style="margin:28px 0">${btn("Voir mon annonce", listingUrl)}</p>
    `),
  };
}

export function emailRejected(ownerName: string, listingTitle: string, reason: string, newListingUrl: string) {
  return {
    subject: "Votre annonce n'a pas pu être publiée — BienLoger",
    html: layout(`
      <h2 style="color:#ef4444;margin-bottom:8px">❌ Annonce non publiée</h2>
      <p>Bonjour <strong>${ownerName}</strong>,</p>
      <p>Votre annonce <strong>« ${listingTitle} »</strong> n'a pas pu être publiée.</p>
      <p><strong>Raison :</strong> ${reason}</p>
      <p>Vous pouvez soumettre une nouvelle annonce en complétant toutes les informations requises.</p>
      <p style="margin:28px 0">${btn("Publier une nouvelle annonce", newListingUrl)}</p>
    `),
  };
}
