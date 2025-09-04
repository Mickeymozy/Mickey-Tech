const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Optional: Random Swahili error messages
const errorMessages = [
    "😓 Pole sana, video haijapatikana. Jaribu tena baadaye.",
    "📡 API imegoma kidogo leo. Subiri kidogo tafadhali.",
    "🚫 Link ya Facebook si sahihi au video imefutwa.",
    "⏳ Tuna matatizo ya mtandao. Jaribu tena baada ya muda."
];

function getRandomErrorMessage() {
    return errorMessages[Math.floor(Math.random() * errorMessages.length)];
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

        const response = await axios.get(`https://delirius-apiofc.vercel.app/download/facebook?url=${url}`);
        const data = response.data;

        if (response.status !== 200 || !data.facebook) {
            return await sock.sendMessage(chatId, {
                text: getRandomErrorMessage()
            });
        }

        const fbvid = data.facebook.sdVideo;

        if (!fbvid) {
            return await sock.sendMessage(chatId, {
                text: "📹 Video haipatikani kwa ubora wa kawaida (SD). Jaribu video nyingine au hakikisha ni ya hadharani."
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
        let apiErrorMsg = '';
        if (error.response && error.response.data) {
            apiErrorMsg = `\n📡 Majibu ya API: ${JSON.stringify(error.response.data)}`;
        }

        console.error('🚨 Error in Facebook command:', error);

        await sock.sendMessage(chatId, {
            text: `😢 Hitilafu imetokea wakati wa kuchakata ombi lako.\nInawezekana API iko chini au video haipo.\n\n🔍 Hitilafu: ${error.message}${apiErrorMsg}`
        });
    }
}

module.exports = facebookCommand;
