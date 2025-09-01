
const axios = require('axios');
const yts = require('yt-search');

module.exports = async function videoCommand(sock, chatId, message) {
  const sendError = async (msg) => {
    await sock.sendMessage(chatId, { text: msg }, { quoted: message });
  };
  try {
    // Get search query
    const rawText = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
    const searchQuery = rawText.split(' ').slice(1).join(' ').trim();
    if (!searchQuery) return sendError('Taja jina la video unayotaka kudownload.');

    // Search YouTube
    let videos;
    try {
      ({ videos } = await yts(searchQuery));
    } catch (err) {
      return sendError('Samahani, imeshindikana kutafuta video.');
    }
    if (!videos || videos.length === 0) return sendError('Samahani, hakuna video zilizopatikana kwa jina hilo.');

    const video = videos[0];
    const videoId = video.videoId;
    const videoTitle = video.title;
    const videoThumbnail = video.thumbnail;
    // Send thumbnail
    await sock.sendMessage(chatId, {
      image: { url: videoThumbnail },
      caption: `*${videoTitle}*\n\n⏳ Inapakua video yako...`
    }, { quoted: message });

    // Try APIs for download link (use videoId only)
    const apis = [
      `https://api.princetechn.com/api/download/ytdlv2?apikey=prince&url=${videoId}&format=mp4`,
      `https://bk9.fun/download/alldownload?url=${videoId}`,
      `https://yt-api-url.example.com/download?videoId=${videoId}`
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
        // If API returns a direct download URL, use it
        if (response.data?.result?.download?.url) {
          videoDownloadUrl = response.data.result.download.url;
          filename = response.data.result.download.filename || filename;
          break;
        }
        // If API returns a URL (not direct download), save it as a fallback
        if (response.data?.url && !videoDownloadUrl) {
          videoDownloadUrl = response.data.url;
        }
      } catch (err) {
        continue;
      }
    }

    if (!videoDownloadUrl) {
      // Fallback: use ytdl-core to get direct video link
      try {
        const ytdl = require('ytdl-core');
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        const videoFormats = await ytdl.getInfo(videoUrl);
        const format = ytdl.chooseFormat(videoFormats.formats, { quality: '18', filter: 'audioandvideo' });
        if (format && format.url) {
          videoDownloadUrl = format.url;
        } else {
          await sock.sendMessage(chatId, {
            text: `❌ Samahani, imeshindikana kupata link ya kudownload video. Jaribu tena baadaye au tumia jina tofauti la video.`
          }, { quoted: message });
          return;
        }
      } catch (err) {
        await sock.sendMessage(chatId, {
          text: `❌ Samahani, imeshindikana kudownload video moja kwa moja. (${err.message})`
        }, { quoted: message });
        return;
      }
    }

    // Send video
    await sock.sendMessage(chatId, {
      video: { url: videoDownloadUrl },
      mimetype: 'video/mp4',
      fileName: filename,
      caption: `*${videoTitle}*\n\n✅ Video yako iko tayari! Imedownloadiwa na Mickey-Tech 🤖`
    }, { quoted: message });
  } catch (error) {
    await sendError('Imeshindikana kudownload video: ' + error.message);
  }
};
