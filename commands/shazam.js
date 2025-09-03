
const axios = require('axios');
const FormData = require('form-data');

// Replace with your actual API endpoint
const API_URL = 'https://apis-keith.vercel.app/search/yts?query=';

/**
 * Shazam command handler
 * Usage: .shazam <audio/video>
 */
async function shazamCommand(sock, chatId, message) {
    try {
        // Use quoted message if available, otherwise current message
        let q = message.message?.extendedTextMessage?.contextInfo?.quotedMessage ?
            message.message.extendedTextMessage.contextInfo.quotedMessage : message;
        let mime = q.mimetype || q.mediaType || '';

        // Try to fallback to direct message media type
        if (!mime && message.message?.audioMessage) mime = 'audio';
        if (!mime && message.message?.videoMessage) mime = 'video';

        // Only proceed if it's an audio or video
        if (/video|audio/.test(mime)) {
            // Download the media
            const buffer = await sock.downloadMediaMessage(q);
            if (!buffer) throw new Error('Could not download media. Please try again.');

            // Build form data for API
            const form = new FormData();
            form.append('file', buffer, { filename: 'audio.mp3' });

            // Send request to API URL
            const response = await axios.post(API_URL, form, {
                headers: form.getHeaders()
            });
            const result = response.data;

            // Parse response (update this according to your API's response format)
            if (!result || !result.success || !result.music || !result.music.length) throw new Error('No music info found.');
            const music = result.music[0];
            const title = music.title || '-';
            const artists = music.artists ? music.artists.join(', ') : '-';
            const album = music.album || '-';
            const genres = music.genres ? music.genres.join(', ') : '-';
            const releaseDate = music.release_date || '-';

            // Build the reply message
            let txt = '╭─⬣「 *Whatmusic Tools* 」⬣\n';
            txt += `│  ≡◦ *🍭 Title:* ${title}\n`;
            txt += `│  ≡◦ *👤 Artist:* ${artists}\n`;
            txt += `│  ≡◦ *📚 Album:* ${album}\n`;
            txt += `│  ≡◦ *🪴 Genre:* ${genres}\n`;
            txt += `│  ≡◦ *🕜 Release Date:* ${releaseDate}\n`;
            txt += '╰─⬣';

            await sock.sendMessage(chatId, { text: txt }, { quoted: message });
        } else {
            await sock.sendMessage(chatId, {
                text: '❌ Please tag a short audio or video with the command *.shazam* to identify the music.',
                quoted: message
            });
        }
    } catch (error) {
        await sock.sendMessage(chatId, {
            text: `❌ Failed to identify music. ${error.message}`,
            quoted: message
        });
    }
}

module.exports = shazamCommand;
