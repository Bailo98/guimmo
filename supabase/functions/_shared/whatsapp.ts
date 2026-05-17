const CALLMEBOT_BASE = "https://api.callmebot.com/whatsapp.php";

export function formatPhone(raw: string): string {
  // Strip everything except digits and leading +
  const cleaned = raw.replace(/[\s\-().]/g, "");
  if (cleaned.startsWith("+")) return cleaned;
  if (cleaned.startsWith("00")) return "+" + cleaned.slice(2);
  // Assume Guinea prefix if 9 digits starting with 6xx
  if (/^6\d{8}$/.test(cleaned)) return "+224" + cleaned;
  return "+" + cleaned;
}

export async function sendWhatsApp(
  phone: string,
  message: string,
  apiKey: string,
): Promise<boolean> {
  const url = `${CALLMEBOT_BASE}?phone=${encodeURIComponent(formatPhone(phone))}&text=${encodeURIComponent(message)}&apikey=${encodeURIComponent(apiKey)}`;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
      if (res.ok) return true;
      console.warn(`[whatsapp] attempt ${attempt} failed: HTTP ${res.status}`);
    } catch (err) {
      console.warn(`[whatsapp] attempt ${attempt} error:`, err);
    }
    if (attempt < 2) await new Promise((r) => setTimeout(r, 2_000));
  }
  return false;
}
