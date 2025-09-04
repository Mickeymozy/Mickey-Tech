const settings = require("../settings");
const fs = require("fs");

async function aliveCommand(sock, chatId, message) {
  try {
    // 🌐 Custom banner and redirect
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

    // 🖼️ Send banner image with caption
    await sock.sendMessage(
      chatId,
      {
        image: { url: banner },
        caption: `${randomCaption}\n\n${textbot}`,
      },
      { quoted: message }
    );

    // 🔊 Load and send local audio file
    const audioBuffer = fs.readFileSync("assets/intro1.mp3");

    await sock.sendMessage(
      chatId,
      {
        audio: audioBuffer,
        mimetype: "audio/mpeg",
      },
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
