const settings = require("../settings");

async function aliveCommand(sock, chatId, message) {
  try {
    // 🌐 Redirect and bot info
    const redes = 'https://whatsapp.com/channel/0029VbAcgfWDOQIUP4y8PN0P';
    const botname = settings.botname || "Mickey-Tech";
    const name = message.pushName || "mtumiaji";

    const textbot = `🌸 Thank you for using *${botname}*, ${name}!\n🔔 Follow our official channel: ${redes} and support on GitHub.`;

    // 📝 Caption options
    const captions = [
      "*Mickey-Tech iko hewani!*\n\n🚀 Tayari kukuhudumia papo hapo—sema tu!",
      "*Bot iko mbioni kama pikipiki ya bodaboda!*\n\n💰 Bofya *LIPA SASA* au *NIMELIPA* bila stress!",
      "*Macho ya bot ni kama tai!*\n\n🎯 Tuma amri yoyote—iko tayari kuchukua hatua!",
      "*Mickey-Tech inatingisha!*\n\n🎉 Teknolojia ya kibabe, haraka na bila longolongo!",
      "*Bot iko fiti kabisa!*\n\n📲 WhatsApp commands zako? Leta tu, twende kazi!"
    ];

    // 🎲 Pick random caption
    const randomCaption = captions[Math.floor(Math.random() * captions.length)];

    // 📨 Send text-only message
    await sock.sendMessage(
      chatId,
      { text: `${randomCaption}\n\n${textbot}` },
      { quoted: message }
    );

  } catch (error) {
    console.error("Error in alive command:", error);

    // 🛠️ Fallback text message
    await sock.sendMessage(
      chatId,
      { text: "✅ Bot is alive and running!" },
      { quoted: message }
    );
  }
}

module.exports = aliveCommand;
