const axios = require('axios');
const yts = require('yt-search');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function videoCommand(sock, chatId, message) {
    try {
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text;
        const searchQuery = text.split(' ').slice(1).join(' ').trim();
        
        
        if (!searchQuery) {
            await sock.sendMessage(chatId, { text: 'What video do you want to download?' }, { quoted: message });
            return;
        }

        // Determine if input is a YouTube link
        let videoUrl = '';
        let videoTitle = '';
        let videoThumbnail = '';
        if (searchQuery.startsWith('http://') || searchQuery.startsWith('https://')) {
            videoUrl = searchQuery;
        } else {
            // Search YouTube for the video
            const { videos } = await yts(searchQuery);
            if (!videos || videos.length === 0) {
                await sock.sendMessage(chatId, { text: 'No videos found!' }, { quoted: message });
                return;
            }
            videoUrl = videos[0].url;
            videoTitle = videos[0].title;
            videoThumbnail = videos[0].thumbnail;
            // Immediately send a message with the video thumbnail, title, and downloading message
            await sock.sendMessage(chatId, {
                image: { url: videoThumbnail },
                caption: `*${videoTitle}*\n\n> _Downloading your video..._`
            }, { quoted: message });
        }

        // Validate YouTube URL
        let urls = videoUrl.match(/(?:https?:\/\/)?(?:youtu\.be\/|(?:www\.|m\.)?youtube\.com\/(?:watch\?v=|v\/|embed\/|shorts\/|playlist\?list=)?)([a-zA-Z0-9_-]{11})/gi);
        if (!urls) {
            await sock.sendMessage(chatId, { text: 'This is not a valid YouTube link!' }, { quoted: message });
            return;
        }

        const apiUrl = `https://noobs-api.top/dipto/ytDl3?link=${encodeURIComponent(video.videoId)}&format=mp4`;
        
        const response = await axios.get(apiUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json'
            }
        });

        if (response.status !== 200) {
            await sock.sendMessage(chatId, { text: 'Failed to fetch video from the API.' }, { quoted: message });
            return;
        }

        const data = response.data;

        if (!data || !data.result || !data.result.download || !data.result.download.url) {
            await sock.sendMessage(chatId, { text: 'Failed to get a valid download link from the API.' }, { quoted: message });
            return;
        }

        const videoDownloadUrl = data.result.download.url;
        const title = data.result.download.filename || 'video.mp4';
        const filename = title;

        // Try sending the video directly from the remote URL (like play.js)
        try {
            await sock.sendMessage(chatId, {
                video: { url: videoDownloadUrl },
                mimetype: 'video/mp4',
                fileName: filename,
                caption: `*${title}*\n\n> *_Downloaded by Knight Bot MD_*`
            }, { quoted: message });
            return;
        } catch (directSendErr) {
            console.log('[video.js] Direct send from URL failed:', directSendErr.message);
        }

        // If direct send fails, fallback to downloading and converting
        // Download the video file first
        const tempDir = path.join(__dirname, '../temp');
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
        const tempFile = path.join(tempDir, `${Date.now()}.mp4`);
        const convertedFile = path.join(tempDir, `converted_${Date.now()}.mp4`);
        
        let buffer;
        let download403 = false;
        try {
            const videoRes = await axios.get(videoDownloadUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                    'Referer': 'https://youtube.com/'
                },
                responseType: 'arraybuffer'
            });
            buffer = Buffer.from(videoRes.data);
        } catch (err) {
            if (err.response && err.response.status === 403) {
                console.log('[video.js] Got 403, trying alternate CDN...');
                download403 = true;
            } else {
                await sock.sendMessage(chatId, { text: 'Failed to download the video file.' }, { quoted: message });
                return;
            }
        }
        // Fallback: try another CDN if 403
        if (download403) {
            let altUrl = videoDownloadUrl.replace(/cdn\d+/, 'cdn404');
            try {
                const videoRes = await axios.get(altUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                        'Referer': 'https://youtube.com/'
                    },
                    responseType: 'arraybuffer'
                });
                buffer = Buffer.from(videoRes.data);
            } catch (err2) {
                await sock.sendMessage(chatId, { text: 'Failed to download the video file from alternate CDN.' }, { quoted: message });
                return;
            }
        }
        if (!buffer || buffer.length < 1024) {
            await sock.sendMessage(chatId, { text: 'Downloaded file is empty or too small.' }, { quoted: message });
            return;
        }
        
        fs.writeFileSync(tempFile, buffer);

        try {
            // Run ffmpeg and log output
            try {
                const { stdout, stderr } = await execPromise(`ffmpeg -i "${tempFile}" -c:v libx264 -c:a aac -preset fast -crf 23 -movflags +faststart "${convertedFile}"`);
            } catch (ffmpegErr) {
                throw ffmpegErr;
            }
            // Check if conversion was successful
            if (!fs.existsSync(convertedFile)) {
                await sock.sendMessage(chatId, { text: 'Converted file missing.' }, { quoted: message });
                return;
            }
            const stats = fs.statSync(convertedFile);
            const maxSize = 62 * 1024 * 1024; // 62MB
            if (stats.size > maxSize) {
                await sock.sendMessage(chatId, { text: 'Video is too large to send on WhatsApp.' }, { quoted: message });
                return;
            }
            // Try sending the converted video
            try {
                await sock.sendMessage(chatId, {
                    video: { url: convertedFile },
                    mimetype: 'video/mp4',
                    fileName: filename,
                    caption: `*${title}*\n\n> *_Downloaded by Knight Bot MD_*`
                }, { quoted: message });
            } catch (sendErr) {
                console.log('[video.js] Send by url failed, trying buffer:', sendErr.message);
                const videoBuffer = fs.readFileSync(convertedFile);
                await sock.sendMessage(chatId, {
                    video: videoBuffer,
                    mimetype: 'video/mp4',
                    fileName: filename,
                    caption: `*${title}*\n\n> *_Downloaded by Knight Bot MD_*`
                }, { quoted: message });
            }
            
        } catch (conversionError) {
            console.log('📹 Conversion failed, trying original file:', conversionError.message);
            try {
                if (!fs.existsSync(tempFile)) {
                    await sock.sendMessage(chatId, { text: 'Temp file missing.' }, { quoted: message });
                    return;
                }
                const origStats = fs.statSync(tempFile);
                const maxSize = 62 * 1024 * 1024; // 62MB
                if (origStats.size > maxSize) {
                    await sock.sendMessage(chatId, { text: 'Video is too large to send on WhatsApp.' }, { quoted: message });
                    return;
                }
            } catch {}
            // Try sending the original file
            try {
                await sock.sendMessage(chatId, {
                    video: { url: tempFile },
                    mimetype: 'video/mp4',
                    fileName: filename,
                    caption: `*${title}*\n\n> *_Downloaded by Knight Bot MD_*`
                }, { quoted: message });
            } catch (sendErr2) {
                console.log('[video.js] Send original by url failed, trying buffer:', sendErr2.message);
                const videoBuffer = fs.readFileSync(tempFile);
                await sock.sendMessage(chatId, {
                    video: videoBuffer,
                    mimetype: 'video/mp4',
                    fileName: filename,
                    caption: `*${title}*\n\n> *_Downloaded by Knight Bot MD_*`
                }, { quoted: message });
            }
        }

        // Clean up temp files
        setTimeout(() => {
            try {
                if (fs.existsSync(tempFile)) {
                    fs.unlinkSync(tempFile);
                }
                if (fs.existsSync(convertedFile)) {
                    fs.unlinkSync(convertedFile);
                }
            } catch (cleanupErr) {
                console.log('[video.js] Cleanup error:', cleanupErr.message);
            }
        }, 5000);


    } catch (error) {
        console.log('📹 Video Command Error:', error.message, error.stack);
        await sock.sendMessage(chatId, { text: 'Download failed: ' + error.message }, { quoted: message });
    }
}

module.exports = videoCommand; 
