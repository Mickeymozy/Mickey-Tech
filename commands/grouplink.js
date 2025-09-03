// Command to get and display the WhatsApp group invite link
// Usage: .grouplink

async function groupLinkCommand(sock, chatId, message) {
    try {
        // Only allow in group chats
        if (!chatId.endsWith('@g.us')) {
            await sock.sendMessage(chatId, { text: '❌ This command can only be used in groups.' }, { quoted: message });
            return;
        }

        // Only allow group admins to use this command
        const metadata = await sock.groupMetadata(chatId);
        const sender = message.key.participant || message.key.remoteJid;
        const isSenderAdmin = metadata.participants.some(p => p.id === sender && (p.admin === 'admin' || p.admin === 'superadmin'));
        const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        const isBotAdmin = metadata.participants.some(p => p.id === botId && (p.admin === 'admin' || p.admin === 'superadmin'));
        if (!isSenderAdmin) {
            await sock.sendMessage(chatId, { text: '❌ Only group admins can use this command.' }, { quoted: message });
            return;
        }
        if (!isBotAdmin) {
            await sock.sendMessage(chatId, { text: '❌ Bot must be admin to get the group invite link.' }, { quoted: message });
            return;
        }

        // Get the group invite link
        let code;
        try {
            code = await sock.groupInviteCode(chatId);
        } catch (err) {
            console.error('Error getting group invite code:', err);
            await sock.sendMessage(chatId, { text: '❌ Failed to get group invite code. Make sure the bot is an admin.' }, { quoted: message });
            return;
        }
        const link = `https://chat.whatsapp.com/${code}`;
        console.log('Group Invite Link:', link);
        await sock.sendMessage(chatId, { text: `🔗 *Group Invite Link:*\n${link}` }, { quoted: message });
    } catch (error) {
        console.error('Error in groupLinkCommand:', error);
        await sock.sendMessage(chatId, { text: '❌ Failed to get group link. Make sure the bot is an admin.' }, { quoted: message });
    }
}

module.exports = groupLinkCommand;
