

const yts = require('yt-search');
const axios = require('axios');

async function fetchAudioFromApis(urlYt, apis) {
    for (const api of apis) {
        try {
            const response = await axios.get(api);
            const data = response.data;
            // Try to extract audio URL and title from different API response formats
            if (data) {
                if (data.result?.downloadUrl || data.result?.url) {
                    return {
                        audioUrl: data.result.downloadUrl || data.result.url,
                        title: data.result.title || data.result.judul || data.result.title_video || 'audio',
                    };
                }
                // Some APIs may return direct URL at data.url
                if (data.url) {
                    return {
                        audioUrl: data.url,
                        title: data.title || 'audio',
                    };
                }
            }
        } catch (e) {
            // Continue to next API if this one fails
        }
    }
    return null;
}

async function playCommand(sock, chatId, message) {
    try {
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text;
        const searchQuery = text.split(' ').slice(1).join(' ').trim();

        if (!searchQuery) {
            return await sock.sendMessage(chatId, {
                text: 'Please provide a song name or keywords to search.'
            });
        }

        // Search for the song on YouTube
        const { videos } = await yts(searchQuery);
        if (!videos || videos.length === 0) {
            return await sock.sendMessage(chatId, {
                text: 'No songs found for your query. Please try a different keyword.'
            });
        }

        // Pick the first result
        const video = videos[0];
        const urlYt = video.url;

        // Inform user that download is starting, with thumbnail
        await sock.sendMessage(chatId, {
            image: { url: video.thumbnail },
            caption: `*${video.title}*\nBy: ${video.author.name}\nDuration: ${video.timestamp}\n\nDownloading audio, please wait...`
        });

        // List of APIs to try (add more if needed)
        const apis = [
            `https://apis.davidcyriltech.my.id/song?url=${urlYt}`,
            `https://apis-keith.vercel.app/download/mp3?url=${urlYt}`,
            `https://apis-keith.vercel.app/download/soundcloud?url=${urlYt}`,
            `https://apis-keith.vercel.app/download/spotify?q=${urlYt}`
        ];

        // Try all APIs in order
        const audioData = await fetchAudioFromApis(urlYt, apis);

        if (!audioData || !audioData.audioUrl) {
            return await sock.sendMessage(chatId, {
                text: 'Failed to fetch audio from all available APIs. Please try again later.'
            });
        }

        // Send the audio file with thumbnail
        await sock.sendMessage(chatId, {
            audio: { url: audioData.audioUrl },
            mimetype: 'audio/mpeg',
            fileName: `${audioData.title}.mp3`,
            ptt: false,
            jpegThumbnail: video.thumbnail
        }, { quoted: message });

    } catch (error) {
        console.error('Error in song command:', error);
        await sock.sendMessage(chatId, {
            text: 'Download failed due to an error. Please try again later.'
        });
    }
}

module.exports = playCommand;

// Powered by Mickey
// Credits to Mickey-Tech-Bot
