const settings = require('../settings');
const fs = require('fs');
const path = require('path');

async function helpCommand(sock, chatId, message) {
    const helpMessage = `
┏━━━[💀 ${settings.botName || '⛓️ Mickey-Tech-Bot'} ]━━━┓ 
┃ 👑 Master : ${global.ytch}
┃ ⚙️ Version: v${settings.version || '2.0.0'} | 👤 Owner: ${settings.botOwner || 'Mickey'}
┃ 🧠 Base   : Node from Mickey™
┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛

🧬 *COMMAND MODULES* 🧬

🛰️ GENERAL OPS:
┌─[ .help / .menu ]──────┐
│ .ping | .alive | .tts <txt> │
│ .owner | .joke | .quote │
│ .fact | .weather <city> │
│ .news | .attp <txt> │
│ .lyrics <song> │
│ .8ball <question> │
│ .groupinfo | .staff │
│ .vv | .trt <txt> <lang> │
│ .ss <link> | .jid │
└────────────────────────┘

🛡️ ADMIN OPS:
┌─[ .ban @user ]─────────┐
│ .promote | .demote │
│ .mute <min> | .unmute │
│ .del | .kick @user │
│ .warn @user | .warnings │
│ .antilink | .antibadword │
│ .clear | .tag <msg> │
│ .tagall | .chatbot │
│ .resetlink | .welcome │
│ .goodbye │
└────────────────────────┘

🔐 OWNER OPS:
┌─[ .mode ]──────────────┐
│ .autostatus | .clearsession │
│ .antidelete | .cleartmp │
│ .setpp <img> | .autoreact │
└────────────────────────┘

🖼️ IMAGE/STICKER OPS:
┌─[ .blur <img> ]────────┐
│ .simage | .sticker │
│ .tgsticker <link> │
│ .meme | .take <pack> │
│ .emojimix <emj1>+<emj2> │
└────────────────────────┘

🎮 GAME OPS:
┌─[ .tictactoe @user ]───┐
│ .hangman | .guess │
│ .trivia | .answer │
│ .truth | .dare │
└────────────────────────┘

🤖 AI OPS:
┌─[ .gpt <q> ]────────────┐
│ .gemini | .imagine │
│ .flux │
└────────────────────────┘

🎯 FUN OPS:
┌─[ .compliment @user ]──┐
│ .insult | .flirt │
│ .shayari | .goodnight │
│ .roseday | .character │
│ .wasted | .ship │
│ .simp | .stupid [txt] │
└────────────────────────┘

🧵 TEXTMAKER OPS:
┌─[ .metallic <txt> ]────┐
│ .ice | .snow | .matrix │
│ .light | .neon | .devil │
│ .purple | .thunder │
│ .leaves | .1917 │
│ .arena | .hacker │
│ .sand | .blackpink │
│ .glitch | .fire │
└────────────────────────┘

📥 DOWNLOAD OPS:
┌─[ .play <song> ]───────┐
│ .song | .instagram │
│ .facebook | .tiktok │
│ .video | .ytmp4 │
└────────────────────────┘

📡 Join our channel for updates...
`;

    try {
        const imagePath = path.join(__dirname, '../assets/bot_image.jpg');

        if (fs.existsSync(imagePath)) {
            const imageBuffer = fs.readFileSync(imagePath);

            await sock.sendMessage(chatId, {
                image: imageBuffer,
                caption: helpMessage,
                contextInfo: {
                    forwardingScore: 1,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363422552152940@newsletter',
                        newsletterName: 'Mickey-Tech-Bot',
                        serverMessageId: -1
                    }
                }
            }, { quoted: message });
        } else {
            console.error('⚠️ Bot image not found at:', imagePath);
            await sock.sendMessage(chatId, {
                text: helpMessage,
                contextInfo: {
                    forwardingScore: 1,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363422552152940@newsletter',
                        newsletterName: 'Mickey-Tech-Bot',
                        serverMessageId: -1
                    }
                }
            });
        }
    } catch (error) {
        console.error('💥 Error in help command:', error);
        await sock.sendMessage(chatId, { text: helpMessage });
    }
}

module.exports = helpCommand;
