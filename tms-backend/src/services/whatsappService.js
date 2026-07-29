// WhatsApp Cloud API (Meta) integration.
//
// READ BEFORE YOU PLUG IN THE REAL TOKEN:
// 1) WHATSAPP_TOKEN / WHATSAPP_PHONE_NUMBER_ID in .env are placeholders.
//    Once you have the real permanent access token + phone number ID
//    from Meta Business Manager, just drop them into .env — nothing
//    else needs to change.
// 2) Meta only allows freeform "text" messages (what this sends today)
//    to a user who has messaged your WhatsApp business number in the
//    last 24 hours. Task-assigned / deadline / progress reminders are
//    business-initiated and will usually be OUTSIDE that window, so
//    Meta will reject plain text sends for most users in production.
//    You'll need to create + get approved a message TEMPLATE in
//    WhatsApp Manager (e.g. "tms_notification" with one {{1}} body
//    variable), then switch the `type`/body below to the commented
//    "template" version. I left both in so it's a one-line swap.

const GRAPH_VERSION = process.env.WHATSAPP_API_VERSION || "v20.0";

function normalizePhone(phone) {
  if (!phone) return null;
  const cleaned = String(phone).replace(/[^\d+]/g, "");
  return cleaned.replace(/^\+/, ""); // Graph API wants digits only, no leading +
}

async function sendWhatsAppMessage({ to, message }) {
  const phone = normalizePhone(to);
  if (!phone) {
    console.warn(
      "sendWhatsAppMessage skipped — no phone number on file for this user",
    );
    return false;
  }

  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (
    !token ||
    token === "PLACEHOLDER_WHATSAPP_TOKEN" ||
    !phoneNumberId ||
    phoneNumberId === "PLACEHOLDER_PHONE_NUMBER_ID"
  ) {
    console.warn(
      "sendWhatsAppMessage skipped — WHATSAPP_TOKEN/WHATSAPP_PHONE_NUMBER_ID not set yet",
    );
    return false;
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: phone,
          type: "text",
          text: { body: message, preview_url: false },

          // --- once you have an approved template, replace the two
          // lines above with:
          // type: "template",
          // template: {
          //   name: "tms_notification",
          //   language: { code: "en_US" },
          //   components: [
          //     { type: "body", parameters: [{ type: "text", text: message }] },
          //   ],
          // },
        }),
      },
    );

    const data = await response.json();
    if (!response.ok) {
      console.error("WhatsApp send failed:", JSON.stringify(data));
      return false;
    }
    return true;
  } catch (err) {
    console.error(`sendWhatsAppMessage failed for ${phone}:`, err.message);
    return false;
  }
}

module.exports = { sendWhatsAppMessage };
