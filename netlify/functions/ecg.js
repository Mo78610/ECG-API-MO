// netlify/functions/ecg.js
export const handler = async (event) => {
  const CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: CORS, body: "" };

  try {
    const { image_base64, paper_speed = "25", paper_gain = "10", reference_notes = "" } =
      JSON.parse(event.body || "{}");
    if (!image_base64) {
      return { statusCode: 400, headers: CORS, body: JSON.stringify({ ok:false, error:"image_base64 required" }) };
    }

    const system =
      "You are an ECG assistant for clinicians. Return STRICT JSON with {interpretation:{summary, structured:{rate_bpm,rhythm,axis,intervals:{PR_ms,QRS_ms,QTc_ms},st_changes,t_wave,blocks,hypertrophy}, red_flags:[]}}. Be clear about uncertainty. Not a diagnosis.";

    const userText = [
      "Read the ECG systematically:",
      "1) Rate & rhythm. 2) Axis. 3) PR/QRS/QTc.",
      "4) P/QRS/T morphology & R-wave progression.",
      "5) ST elevation/depression & reciprocal changes.",
      "6) Blocks. 7) Hypertrophy/strain. 8) Acute ischemia patterns.",
      `Paper speed: ${paper_speed} mm/s; Gain: ${paper_gain} mm/mV.`,
      reference_notes ? `Reference notes: ${reference_notes}` : ""
    ].join(" ");

    const r = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // vision-capable model
        input: [
          { role: "system", content: [{ type: "input_text", text: system }] },
          { role: "user",   content: [
              { type: "input_text", text: userText },
              { type: "input_image", image_url: image_base64 }
            ] }
        ],
        response_format: { type: "json_object" },
        max_output_tokens: 700
      })
    });

    if (!r.ok) {
      return { statusCode: r.status, headers: CORS, body: JSON.stringify({ ok:false, error: await r.text() }) };
    }
    const data = await r.json();
    const text = data.output_text || JSON.stringify(data);

    let parsed, interpretation;
    try { parsed = JSON.parse(text); } catch {}
    interpretation = parsed?.interpretation || parsed || { summary: text, structured:{}, red_flags:[] };

    return { statusCode: 200, headers: { ...CORS, "Content-Type":"application/json" }, body: JSON.stringify({ ok:true, interpretation }) };
  } catch (e) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ ok:false, error:String(e) }) };
  }
};
