import { Resend } from "npm:resend";

Deno.serve(async (req) => {
  const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
  const body = await req.json().catch(() => ({}));
  const to = body.email || "diallobailoca2025@gmail.com";

  const { data, error } = await resend.emails.send({
    from: "BienLoger <onboarding@resend.dev>",
    to,
    subject: "Test email BienLoger ✅",
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #1D9E75;">BienLoger fonctionne !</h2>
        <p>Cet email confirme que les notifications
        automatiques sont bien configurées.</p>
        <p style="color: #888; font-size: 12px;">
          Envoyé depuis les Edge Functions Supabase
        </p>
      </div>
    `,
  });

  return Response.json({ data, error });
});
