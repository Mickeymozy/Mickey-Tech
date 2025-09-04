const fs = require('fs');
const path = require('path');
const axios = require('axios');
const getFBInfo = require('@xaviabot/fb-downloader');

// Swahili error messages
const errorMessages = [
    "😓 Pole sana, video haijapatikana. Jaribu tena baadaye.",
    "📡 API imegoma kidogo leo. Subiri kidogo tafadhali.",
    "🚫 Link ya Facebook si sahihi au video imefutwa.",
    "⏳ Tuna matatizo ya mtandao. Jaribu tena baada ya muda."
];

// Swahili captions for thumbnail preview
const swahiliCaptions = [
    "🔥 Video kali kutoka Facebook!",
    "🎬 Angalia hii sasa hivi!",
    "📲 Pakua na ufurahie!",
    "😎 Hii hapa, usipitwe!",
    "💥 Bonge la video, angalia!"
];

function getRandomErrorMessage() {
    return errorMessages[Math.floor(Math.random() * errorMessages.length)];
}

function getRandomCaption() {
    return swahiliCaptions[Math.floor(Math.random() * swahiliCaptions.length)];
}

async function facebookCommand(sock, chatId, message) {
    try {
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text;
        const url = text.split(' ').slice(1).join(' ').trim();

        if (!url) {
            return await sock.sendMessage(chatId, {
                text: "Tafadhali tuma link ya video ya Facebook.\nMfano: .fb https://www.facebook.com/..."
            });
        }

        if (!url.includes('facebook.com')) {
            return await sock.sendMessage(chatId, {
                text: "Hiyo si link ya Facebook. Tafadhali angalia tena."
            });
        }

        await sock.sendMessage(chatId, {
            react: { text: '🔄', key: message.key }
        });

        // Send thumbnail-style preview
        await sock.sendMessage(chatId, {
            image: { url: 'https://i.imgur.com/0ZQZ0ZQ.jpg' }, // Replace with your own hosted thumbnail
            caption: `📥 ${getRandomCaption()}\n\n🔗 ${url}`,
            footer: "MICKEY-TECH-BOT",
            headerType: 4
        }, { quoted: message });

        // Get Facebook video info
        const fbData = await getFBInfo(url);
        const fbvid = fbData?.sd || fbData?.hd;

        if (!fbvid) {
            return await sock.sendMessage(chatId, {
                text: "📹 Video haipatikani kwa ubora wa kawaida (SD) au HD. Jaribu video nyingine au hakikisha ni ya hadharani."
            });
        }

        const tmpDir = path.join(process.cwd(), 'tmp');
        if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir, { recursive: true });
        }

        const tempFile = path.join(tmpDir, `fb_${Date.now()}.mp4`);

        const videoResponse = await axios({
            method: 'GET',
            url: fbvid,
            responseType: 'stream',
            headers: {
                'User-Agent': 'Mozilla/5.0',
                'Accept': 'video/mp4,video/*;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Range': 'bytes=0-',
                'Connection': 'keep-alive',
                'Referer': 'https://www.facebook.com/'
            }
        });

        const writer = fs.createWriteStream(tempFile);
        videoResponse.data.pipe(writer);

        await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });

        if (!fs.existsSync(tempFile) || fs.statSync(tempFile).size === 0) {
            throw new Error('Video haijapakuliwa vizuri.');
        }

        await sock.sendMessage(chatId, {
            video: { url: tempFile },
            mimetype: "video/mp4",
            caption: "📥 DOWNLOAD BY MICKEY-TECH-BOT"
        }, { quoted: message });

        try {
            fs.unlinkSync(tempFile);
        } catch (err) {
            console.error('Error cleaning up temp file:', err);
        }

    } catch (error) {
        console.error('🚨 Error in Facebook command:', error);

        await sock.sendMessage(chatId, {
            text: `😢 Hitilafu imetokea wakati wa kuchakata ombi lako.\nInawezekana video haipo au link si sahihi.\n\n🔍 Hitilafu: ${error.message}`
        });
    }
}

module.exports = facebookCommand;
