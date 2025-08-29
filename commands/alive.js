const settings = require("../settings");
const fs = require("fs");

async function aliveCommand(sock, chatId, message) {
  try {
    // 🌐 Image URL
    const imageUrl = "https://ibb.co/B2HDkY1d.jpg"; // Replace with your actual image URL

    // 📝 Caption options
    const captions = [
      "*Mickey-Tech Bot is Online!*\n\n🚀 Ready to serve with instant actions!",
      "*Mickey-Tech iko hewani!*\n\n💰 Bofya *PAY NOW* au *NIME LIPA* kwa haraka!",
      "*Bot iko macho kama tai!*\n\n🎯 Tuma amri yoyote sasa hivi!",
      "*Mickey-Tech is vibing!*\n\n🎉 Let’s make tech fun and fast!",
      "*Bot iko tayari!*\n\n📲 WhatsApp actions? Just say the word!"
    ];
    const randomCaption = captions[Math.floor(Math.random() * captions.length)];

    // 🖼️ Send image with random caption
    await sock.sendMessage(chatId, {
      image: { url: imageUrl },
      caption: randomCaption
    }, { quoted: message });

    // 🔊 Load and send local audio file
    const audioBuffer = fs.readFileSync("assets/intro1.mp3");

    await sock.sendMessage(chatId, {
      audio: audioBuffer,
      mimetype: "audio/mpeg" // or "audio/mp4" depending on your file format
    }, { quoted: message });

  } catch (error) {
    console.error("Error in alive command:", error);

    // 🛠️ Fallback text message
    await sock.sendMessage(chatId, {
      text: "✅ Bot is alive and running!"
    }, { quoted: message });
  }
}

module.exports = aliveCommand;
