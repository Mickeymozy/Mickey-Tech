import express from 'express';
import fs from 'fs';
import pino from 'pino';
import { makeWASocket, useMultiFileAuthState, delay, makeCacheableSignalKeyStore, Browsers, jidNormalizedUser, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import pn from 'awesome-phonenumber';

const router = express.Router();

// Ensure the session directory exists
function removeFile(FilePath) {
    try {
        if (!fs.existsSync(FilePath)) return false;
        fs.rmSync(FilePath, { recursive: true, force: true });
    } catch (e) {
        console.error('Error removing file:', e);
    }
}

// Function to wait for session to be fully established
async function waitForSessionEstablished(KnightBot, timeout = 30000) {
    return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
            reject(new Error('Session establishment timeout'));
        }, timeout);

        const checkInterval = setInterval(() => {
            try {
                if (KnightBot.authState.creds.registered && 
                    Object.keys(KnightBot.authState.creds).length > 5) { // Ensure creds has substantial data
                    clearInterval(checkInterval);
                    clearTimeout(timeoutId);
                    resolve(true);
                }
            } catch (error) {
                // Continue checking
            }
        }, 1000);

        // Also listen for connection update
        KnightBot.ev.once('connection.update', (update) => {
            if (update.connection === 'open') {
                clearInterval(checkInterval);
                clearTimeout(timeoutId);
                resolve(true);
            }
        });
    });
}

router.get('/', async (req, res) => {
    let num = req.query.number;
    let dirs = './' + (num || `session`);

    // Remove existing session if present
    await removeFile(dirs);

    // Ensure the session directory exists before proceeding
    if (!fs.existsSync(dirs)) {
        fs.mkdirSync(dirs, { recursive: true });
    }

    // Clean the phone number - remove any non-digit characters
    num = num.replace(/[^0-9]/g, '');

    // Validate the phone number using awesome-phonenumber
    const phone = pn('+' + num);
    if (!phone.isValid()) {
        if (!res.headersSent) {
            return res.status(400).send({ code: 'Invalid phone number. Please enter your full international number (e.g., 15551234567 for US, 447911123456 for UK, 84987654321 for Vietnam, etc.) without + or spaces.' });
        }
        return;
    }
    // Use the international number format (E.164, without '+')
    num = phone.getNumber('e164').replace('+', '');

    async function initiateSession() {
        const { state, saveCreds } = await useMultiFileAuthState(dirs);

        try {
            const { version, isLatest } = await fetchLatestBaileysVersion();
            let KnightBot = makeWASocket({
                version,
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
                },
                printQRInTerminal: false,
                logger: pino({ level: "fatal" }).child({ level: "fatal" }),
                browser: Browsers.windows('Chrome'),
                markOnlineOnConnect: false,
                generateHighQualityLinkPreview: false,
                defaultQueryTimeoutMs: 60000,
                connectTimeoutMs: 60000,
                keepAliveIntervalMs: 30000,
                retryRequestDelayMs: 250,
                maxRetries: 5,
            });

            KnightBot.ev.on('connection.update', async (update) => {
                const { connection, lastDisconnect, isNewLogin, isOnline } = update;

                if (connection === 'open') {
                    console.log("✅ Connected successfully!");
                    console.log("📱 Sending session files to user...");

                    try {
                        // Wait for session to be fully established before sending files
                        console.log("⏳ Waiting for full session establishment...");
                        await waitForSessionEstablished(KnightBot);
                        console.log("✅ Session fully established!");

                        // Verify creds file exists and has content
                        const credsPath = dirs + '/creds.json';
                        if (!fs.existsSync(credsPath)) {
                            throw new Error('creds.json file not found');
                        }

                        const sessionKnight = fs.readFileSync(credsPath, 'utf8');
                        if (!sessionKnight || sessionKnight.trim().length < 10) {
                            throw new Error('creds.json is empty or too small');
                        }

                        console.log("✅ creds.json verified - contains session data");

                        // Send picture with connected caption FIRST (at the top)
                        const userJid = jidNormalizedUser(num + '@s.whatsapp.net');
                        await KnightBot.sendMessage(userJid, {
                            image: { 
                                url: 'https://files.catbox.moe/mqtfum.jpg' // Replace with your Catbox image link
                            },
                            caption: `✅ *CONNECTED SUCCESSFULLY!*\n\n🎉 Your LOFT QUANTUM X1.0 session is now active and ready to use!\n\n🔐 Secure connection established\n🚀 Ready for unlimited WhatsApp automation`
                        });
                        console.log("🖼️ Connected image with caption sent successfully");

                        // Wait a moment before sending the creds file
                        await delay(1500);

                        // Send creds.json file SECOND (in the middle)
                        await KnightBot.sendMessage(userJid, {
                            document: {
                                url: 'data:application/json;base64,' + Buffer.from(sessionKnight).toString('base64')
                            },
                            mimetype: 'application/json',
                            fileName: 'creds.json'
                        });
                        console.log("📄 Session file (creds.json) sent successfully");

                        // Wait a moment before sending the song
                        await delay(1500);

                        // Send song as PTT mode THIRD (in the bottom) - FIXED AUDIO FORMAT
                        await KnightBot.sendMessage(userJid, {
                            audio: { 
                                url: 'https://files.catbox.moe/1ilyhr.mp3' // Replace with your Catbox audio link
                            },
                            mimetype: 'audio/ogg; codecs=opus', // FIXED: Correct MIME type for WhatsApp voice notes
                            ptt: true, // This makes it play as push-to-talk (voice note)
                            seconds: 30 // Optional: specify duration if known
                        });
                        console.log("🎵 Welcome song sent as voice note successfully");

                        // Wait a moment before sending the video guide
                        await delay(1000);

                        // Send video thumbnail with caption
                        await KnightBot.sendMessage(userJid, {
                            image: { url: 'https://img.youtube.com/vi/loft_xmd23/maxresdefault.jpg' },
                            caption: `🎬 *LOFT QUANTUM X1.0 Full Setup Guide!*\n\n🚀 Bug Fixes + New Commands + Fast AI Chat\n📺 Watch Now: https://youtu.be/LOFT_XMD23`
                        });
                        console.log("🎬 Video guide sent successfully");

                        // Send warning message LAST
                        await KnightBot.sendMessage(userJid, {
                            text: `⚠️ *SECURITY NOTICE* ⚠️\n\n🔒 Do not share this file with anybody\n\n┌┤✑  Thanks for using LOFT QUANTUM X1\n│└────────────┈ ⳹        \n│©2026 version\n└─────────────────┈ ⳹\n\n💡 *Pro Tip:* Keep your session secure and backup your creds.json file safely!`
                        });
                        console.log("⚠️ Warning message sent successfully");

                        // Clean up session after use
                        console.log("🧹 Cleaning up session...");
                        await delay(2000);
                        removeFile(dirs);
                        console.log("✅ Session cleaned up successfully");
                        console.log("🎉 Process completed successfully!");
                        
                    } catch (error) {
                        console.error("❌ Error sending messages:", error);
                        // Still clean up session even if sending fails
                        removeFile(dirs);
                    }
                }

                if (isNewLogin) {
                    console.log("🔐 New login via pair code");
                }

                if (isOnline) {
                    console.log("📶 Client is online");
                }

                if (connection === 'close') {
                    const statusCode = lastDisconnect?.error?.output?.statusCode;

                    if (statusCode === 401) {
                        console.log("❌ Logged out from WhatsApp. Need to generate new pair code.");
                    } else {
                        console.log("🔁 Connection closed — restarting...");
                        initiateSession();
                    }
                }
            });

            if (!KnightBot.authState.creds.registered) {
                await delay(3000); // Wait 3 seconds before requesting pairing code
                num = num.replace(/[^\d+]/g, '');
                if (num.startsWith('+')) num = num.substring(1);

                try {
                    let code = await KnightBot.requestPairingCode(num);
                    code = code?.match(/.{1,4}/g)?.join('-') || code;
                    if (!res.headersSent) {
                        console.log({ num, code });
                        await res.send({ code });
                    }
                } catch (error) {
                    console.error('Error requesting pairing code:', error);
                    if (!res.headersSent) {
                        res.status(503).send({ code: 'Failed to get pairing code. Please check your phone number and try again.' });
                    }
                }
            }

            KnightBot.ev.on('creds.update', saveCreds);
        } catch (err) {
            console.error('Error initializing session:', err);
            if (!res.headersSent) {
                res.status(503).send({ code: 'Service Unavailable' });
            }
        }
    }

    await initiateSession();
});

// Global uncaught exception handler
process.on('uncaughtException', (err) => {
    let e = String(err);
    if (e.includes("conflict")) return;
    if (e.includes("not-authorized")) return;
    if (e.includes("Socket connection timeout")) return;
    if (e.includes("rate-overlimit")) return;
    if (e.includes("Connection Closed")) return;
    if (e.includes("Timed Out")) return;
    if (e.includes("Value not found")) return;
    if (e.includes("Stream Errored")) return;
    if (e.includes("Stream Errored (restart required)")) return;
    if (e.includes("statusCode: 515")) return;
    if (e.includes("statusCode: 503")) return;
    console.log('Caught exception: ', err);
});

export default router;