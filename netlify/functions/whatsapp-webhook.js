// netlify/functions/whatsapp-webhook.js
// Receiving endpoint for Wati's webhook. Point Wati (Team Inbox > Webhook Settings)
// at: https://<your-site>.netlify.app/.netlify/functions/whatsapp-webhook?secret=WATI_WEBHOOK_SECRET
//
// This just proves the pipe works: any inbound text message gets echoed straight back.
// Swap the echo in `replyTo` for real bot logic once the round trip is confirmed.
import { sendSessionMessage } from "./_wati.js";

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "POST only" };
  }

  const secret = process.env.WATI_WEBHOOK_SECRET;
  if (secret && event.queryStringParameters?.secret !== secret) {
    return { statusCode: 401, body: "unauthorized" };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, body: "invalid JSON" };
  }

  // Wati's inbound-message payload carries the sender in waId/senderName and the text
  // in `text` (or `body` on some tenant versions). Status-update events (sent/delivered/
  // read receipts) don't carry `text`, so this naturally skips those.
  const from = payload.waId || payload.whatsappNumber;
  const text = payload.text || payload.body;

  if (from && text) {
    try {
      await sendSessionMessage(from, `Got it: ${text}`);
    } catch (e) {
      console.error("whatsapp-webhook: reply failed", e);
    }
  }

  return { statusCode: 200, body: "ok" };
};
