const settings = require("../settings");

async function aliveCommand(sock, chatId, message) {
  try {
    // 🎉 Fun WhatsApp Bot Features
    const funFeatures = [
      "🎮 Type *.truth* or *.dare* for a quick game",
      "😂 Use *.joke* to get a random laugh",
      "🎵 Try *.voice* to hear a random audio clip",
      "🧠 Type *.quiz* for a brain teaser",
      "📸 Use *.sticker* to turn images into stickers",
      "🎲 Type *.roll* to roll a virtual dice",
      "👀 Try *.meme* for a random meme",
      "💬 Use *.quote* for daily inspiration",
      "🎤 Type *.sing* to get a random song lyric",
      "🕹️ Try *.riddle* to challenge your mind"
    ];

    // 🎲 Pick one randomly
    const randomFeature = funFeatures[Math.floor(Math.random() * funFeatures.length)];

    // 📨 Send the message
    await sock.sendMessage(chatId, {
      text: `*Mickey-Tech Bot is Online!*\n\n${randomFeature}`
    }, { quoted: message });

  } catch (error) {
    console.error("Error in alive command:", error);
    await sock.sendMessage(chatId, {
      text: "✅ Bot is alive and running!"
    }, { quoted: message });
  }
}

module.exports = aliveCommand;
