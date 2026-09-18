// netlify/functions/whatsapp-send.js
// POST { "to": "15551234567", "message": "hello" } -> sends via Wati session message API.
import { sendSessionMessage } from "./_wati.js";

export const handler = async (event) => {
  const CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: CORS, body: "" };
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ ok: false, error: "POST only" }) };
  }

  try {
    const { to, message } = JSON.parse(event.body || "{}");
    if (!to || !message) {
      return { statusCode: 400, headers: CORS, body: JSON.stringify({ ok: false, error: "to and message required" }) };
    }

    const result = await sendSessionMessage(to, message);
    return { statusCode: 200, headers: { ...CORS, "Content-Type": "application/json" }, body: JSON.stringify({ ok: true, result }) };
  } catch (e) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ ok: false, error: String(e.message || e) }) };
  }
};
