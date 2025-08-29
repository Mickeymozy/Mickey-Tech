const axios = require('axios');
const yts = require('yt-search');

async function videoCommand(sock, chatId, message) {
  try {
    const text = message.message?.conversation || message.message?.extendedTextMessage?.text;
    const searchQuery = text.split(' ').slice(1).join(' ').trim();

    if (!searchQuery) {
      await sock.sendMessage(chatId, { text: 'Taja jina la video unayotaka kudownload.' }, { quoted: message });
      return;
    }

    // 🔍 Tafuta video kwa jina
    const { videos } = await yts(searchQuery);
    if (!videos || videos.length === 0) {
      await sock.sendMessage(chatId, { text: 'Samahani, hakuna video zilizopatikana kwa jina hilo.' }, { quoted: message });
      return;
    }

    const video = videos[0];
    const videoId = video.videoId;
    const videoTitle = video.title;
    const videoThumbnail = video.thumbnail;

    // 🖼️ Tuma picha ya video na ujumbe wa kupakua
    await sock.sendMessage(chatId, {
      image: { url: videoThumbnail },
      caption: `*${videoTitle}*\n\n⏳ Inapakua video yako...`
    }, { quoted: message });

    // 🔁 Jaribu API mbalimbali
    const apis = [
      `https://api.princetechn.com/api/download/ytdlv2?apikey=prince&url=${videoId}&format=mp4`,
      `https://bk9.fun/download/alldownload?url=${videoId}`,
      `https://yt-api-url.example.com/download?videoId=${videoId}` // Add more if needed
    ];

    let videoDownloadUrl = null;
    let filename = `${videoTitle}.mp4`;

    for (const apiUrl of apis) {
      try {
        const response = await axios.get(apiUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0',
            'Accept': 'application/json'
          }
        });

        // 🧠 Parse based on known structure
        if (response.data?.result?.download?.url) {
          videoDownloadUrl = response.data.result.download.url;
          filename = response.data.result.download.filename || filename;
          break;
        }

        // Example fallback structure
        if (response.data?.url) {
          videoDownloadUrl = response.data.url;
          break;
        }

      } catch (err) {
        console.log(`API failed: ${apiUrl}`, err.message);
        continue;
      }
    }

    if (!videoDownloadUrl) {
      await sock.sendMessage(chatId, { text: 'Imeshindikana kupata link ya kudownload video kutoka API yoyote.' }, { quoted: message });
      return;
    }

    // 🎬 Tuma video kwa mtumiaji
    await sock.sendMessage(chatId, {
      video: { url: videoDownloadUrl },
      mimetype: 'video/mp4',
      fileName: filename,
      caption: `*${videoTitle}*\n\n✅ Video yako iko tayari! Imedownloadiwa na Mickey-Tech 🤖`
    }, { quoted: message });

  } catch (error) {
    console.error('📹 Video Command Error:', error.message);
    await sock.sendMessage(chatId, { text: 'Imeshindikana kudownload video: ' + error.message }, { quoted: message });
  }
}

module.exports = videoCommand;
