const settings = require("../settings");
const fs = require("fs");

async function aliveCommand(sock, chatId, message) {
  try {
    // 🌐 Image URL
    const imageUrl = "https://files.catbox.moe/kzlbjw.jpg"; // Replace with your actual image URL

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

    // 🖼️ Send image with random caption
    await sock.sendMessage(
      chatId,
      {
        image: { url: imageUrl },
        caption: randomCaption,
      },
      { quoted: message }
    );

    // 🔊 Load and send local audio file
    const audioBuffer = fs.readFileSync("assets/intro1.mp3");

    await sock.sendMessage(
      chatId,
      {
        audio: audioBuffer,
        mimetype: "audio/mpeg", // or "audio/mp4" depending on your file format
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
