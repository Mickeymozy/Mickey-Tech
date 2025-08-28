// 📌 All-in-one Invoice Command for Repo Access
const axios = require("axios");

// ====== SETTINGS ======
const settings = {
  version: "1.0.0",
  brandName: "Mickey-Tech",
  repoName: "Mickey-MD Private Repo",
  currency: "TZS",
  price: 3000, // total price in TZS
  supportPhone: "+255612130873",
  payment: {
    url: "https://pay.mickey-tech.com/repo/mickey-md", // Stripe/Paylink/etc.
    Yas: { number: "0711765335", name: "Mickdady" },
    Haoltel: { number: "0615944741", name: "Mickdady" },
    bank: {
      accountName: "Mickey Tech Ltd",
      accountNumber: "123456789",
      bankName: "NMB Bank",
      swift: "CORUTZTZ"
    },
    qrImageUrl: "https://ibb.co/JwgKmjTD" // Invoice/QR image
  }
};

// ====== HELPERS ======
const formatAmount = (num) => {
  try { return Number(num).toLocaleString("en-TZ"); }
  catch { return String(num); }
};

const generateInvoiceMeta = () => {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const id = `INV-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${Math.floor(1000 + Math.random() * 9000)}`;
  const issued = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

  const dueDate = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  const due = `${dueDate.getFullYear()}-${pad(dueDate.getMonth() + 1)}-${pad(dueDate.getDate())}`;
  return { id, issued, due };
};

// ====== COMMAND ======
async function aliveCommand(sock, chatId, message) {
  try {
    const { id, issued, due } = generateInvoiceMeta();
    const buyer =
      (message && message.pushName) ||
      (message?.key?.participant) ||
      "Client";

    const itemLine = `• Access: ${settings.repoName} (private GitHub repo)`;
    const includes = [
      "Lifetime updates",
      "1 license (single deployment)",
      "Basic support (7 days after purchase)"
    ].map((x) => `  - ${x}`).join("\n");

    const amount = formatAmount(settings.price);
    const currency = settings.currency;

    const header = `*INVOICE — ${settings.brandName}*`;
    const meta = [
      `*Invoice ID:* ${id}`,
      `*Issued:* ${issued}`,
      `*Due:* ${due}`,
      `*Billed To:* ${buyer}`
    ].join("\n");

    const items = [
      `*Item:*`,
      itemLine,
      includes,
      ``,
      `*Subtotal:* ${currency} ${amount}`,
      `*Fees:* ${currency} 0`,
      `*Total Due:* ${currency} ${amount}`
    ].join("\n");

    const payMethods = [
      settings.payment.url ? `• Pay Link: ${settings.payment.url}` : null,
      settings.payment.mpesa.number
        ? `• M-Pesa: ${settings.payment.Yas.number} (${settings.payment.Yas.name})`
        : null,
      settings.payment.tigopesa.number
        ? `• Tigo Pesa: ${settings.payment.Halopesa.number} (${settings.payment.Halopesa.name})`
        : null,
      settings.payment.bank.accountNumber
        ? `• Bank: ${settings.payment.bank.bankName}\n  - Name: ${settings.payment.bank.accountName}\n  - Acc: ${settings.payment.bank.accountNumber}\n  - SWIFT: ${settings.payment.bank.swift}`
        : null
    ].filter(Boolean).join("\n");

    const afterPay = [
      `*After Payment:*`,
      `1) Send proof (screenshot/transaction ID).`,
      `2) Include your GitHub username.`,
      `3) Repo access within 1–6 hours.`
    ].join("\n");

    const footer = `*Support:* ${settings.supportPhone}  •  *Ref:* ${id}`;

    const caption = `${header}\n\n${meta}\n\n${items}\n\n*Payment Methods:*\n${payMethods}\n\n${afterPay}\n\n${footer}`;

    // Try sending QR/brand image with invoice
    let messagePayload;
    try {
      const response = await axios.get(settings.payment.qrImageUrl, { responseType: "arraybuffer" });
      const imageBuffer = Buffer.from(response.data, "binary");
      messagePayload = {
        image: imageBuffer,
        caption,
        contextInfo: {
          forwardingScore: 999,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: "120363422552152940@newsletter",
            newsletterName: settings.repoName,
            serverMessageId: -1
          }
        }
      };
    } catch {
      // Fallback: send just text
      messagePayload = { text: caption };
    }

    await sock.sendMessage(chatId, messagePayload, { quoted: message });

    // Optional quick-pay buttons
    if (settings.payment.url) {
      await sock.sendMessage(chatId, {
        text: "Quick actions:",
        footer: `${settings.brandName} • ${id}`,
        templateButtons: [
          { index: 1, urlButton: { displayText: "Pay Now", url: settings.payment.url } },
          { index: 2, callButton: { displayText: "Call Support", phoneNumber: settings.supportPhone } },
          { index: 3, quickReplyButton: { displayText: "I Paid ✅", id: `PAID_CONFIRM_${id}` } }
        ]
      }, { quoted: message });
    }

  } catch (err) {
    console.error("Error in invoice command:", err);
    await sock.sendMessage(chatId, { text: "⚠️ Could not generate invoice. Contact support." }, { quoted: message });
  }
}

// ====== EXPORT ======
module.exports = aliveCommand;
