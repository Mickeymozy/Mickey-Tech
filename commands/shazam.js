const acrcloud = require('acrcloud');

// Initialize ACRCloud with your credentials
const acr = new acrcloud({
    host: 'identify-eu-west-1.acrcloud.com',
    access_key: 'c33c767d683f78bd17d4bd4991955d81',
    access_secret: 'bvgaIAEtADBTbLwiPGYlxupWqkNGIjT7J9Ag2vIu'
});

/**
 * Shazam command handler
 * Usage: .shazam <audio/video>
 */
async function shazamCommand(sock, chatId, message) {
    try {
        // Use quoted message if available, otherwise current message
        const q = message.quotedMessage || message;
        const mime = q.mimetype || q.mediaType || '';

        // Only proceed if it's an audio or video
        if (/video|audio/.test(mime)) {
            // Download the media
            const buffer = await sock.downloadMediaMessage(q);
            // Identify the music
            const result = await acr.identify(buffer);
            const { status, metadata } = result;

            if (status.code !== 0) throw new Error(status.msg);

            // Extract music info
            const music = metadata.music[0];
            const title = music.title || '-';
            const artists = music.artists ? music.artists.map(v => v.name).join(', ') : '-';
            const album = music.album ? music.album.name : '-';
            const genres = music.genres ? music.genres.map(v => v.name).join(', ') : '-';
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
