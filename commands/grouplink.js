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
        const isAdmin = metadata.participants.some(p => p.id === sender && (p.admin === 'admin' || p.admin === 'superadmin'));
        if (!isAdmin) {
            await sock.sendMessage(chatId, { text: '❌ Only group admins can use this command.' }, { quoted: message });
            return;
        }

        // Get the group invite link
        const code = await sock.groupInviteCode(chatId);
        const link = `https://chat.whatsapp.com/${code}`;
        await sock.sendMessage(chatId, { text: `🔗 *Group Invite Link:*
${link}` }, { quoted: message });
    } catch (error) {
        console.error('Error in groupLinkCommand:', error);
        await sock.sendMessage(chatId, { text: '❌ Failed to get group link. Make sure the bot is an admin.' }, { quoted: message });
    }
}

module.exports = groupLinkCommand;
