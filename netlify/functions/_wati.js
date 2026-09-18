// Shared Wati.io API client used by whatsapp-send.js and whatsapp-webhook.js
//
// Required env vars (set in Netlify site settings, not committed):
//   WATI_API_ENDPOINT  e.g. https://live-mt-server.wati.io/123456   (your tenant base URL, no trailing slash)
//   WATI_API_KEY       the Bearer token from Wati > API Docs
//   WATI_WEBHOOK_SECRET  shared secret you also paste into Wati's webhook config as a query param (?secret=...)

export async function sendSessionMessage(to, text) {
  const base = process.env.WATI_API_ENDPOINT;
  const key = process.env.WATI_API_KEY;
  if (!base || !key) throw new Error("WATI_API_ENDPOINT / WATI_API_KEY not configured");

  const url = `${base}/api/v1/sendSessionMessage/${encodeURIComponent(to)}?messageText=${encodeURIComponent(text)}`;
  const r = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}` },
  });

  const body = await r.text();
  if (!r.ok) throw new Error(`Wati send failed (${r.status}): ${body}`);
  return body;
}
