
// WhatsApp Auto Status Viewer Command
// This command enables or disables automatic viewing of WhatsApp statuses
const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../data/autoStatus.json');
if (!fs.existsSync(configPath)) {
    fs.writeFileSync(configPath, JSON.stringify({ enabled: false }));
}

async function autoStatusCommand(sock, chatId, msg, args) {
    try {
        if (!msg.key.fromMe) {
            await sock.sendMessage(chatId, { text: '❌ This command can only be used by the owner!' });
            return;
        }

        let config = JSON.parse(fs.readFileSync(configPath));

        if (!args || args.length === 0) {
            const status = config.enabled ? 'enabled' : 'disabled';
            await sock.sendMessage(chatId, {
                text: `🔄 *Auto Status View*\n\nCurrent status: ${status}\n\nUse:\n.autostatus on - Enable auto status view\n.autostatus off - Disable auto status view`
            });
            return;
        }

        const command = args[0].toLowerCase();
        if (command === 'on') {
            config.enabled = true;
            fs.writeFileSync(configPath, JSON.stringify(config));
            await sock.sendMessage(chatId, {
                text: '✅ Auto status view has been enabled!\nBot will now automatically view all contact statuses.'
            });
        } else if (command === 'off') {
            config.enabled = false;
            fs.writeFileSync(configPath, JSON.stringify(config));
            await sock.sendMessage(chatId, {
                text: '❌ Auto status view has been disabled!\nBot will no longer automatically view statuses.'
            });
        } else {
            await sock.sendMessage(chatId, {
                text: '❌ Invalid command! Use:\n.autostatus on - Enable auto status view\n.autostatus off - Disable auto status view'
            });
        }
    } catch (error) {
        console.error('Error in autostatus command:', error);
        await sock.sendMessage(chatId, {
            text: '❌ Error occurred while managing auto status!\n' + error.message
        });
    }
}

function isAutoStatusEnabled() {
    try {
        const config = JSON.parse(fs.readFileSync(configPath));
        return config.enabled;
    } catch (error) {
        console.error('Error checking auto status config:', error);
        return false;
    }
}

async function handleStatusUpdate(sock, status) {
    try {
        if (!isAutoStatusEnabled()) return;
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Helper to view and like a status
        async function viewAndLike(key) {
            try {
                await sock.readMessages([key]);
                // Send a like reaction (💚) to the status
                await sock.sendMessage(key.remoteJid, {
                    react: { text: '💚', key }
                });
            } catch (err) {
                if (err.message?.includes('rate-overlimit')) {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    await sock.readMessages([key]);
                } else {
                    throw err;
                }
            }
        }

        if (status.messages && status.messages.length > 0) {
            const msg = status.messages[0];
            if (msg.key && msg.key.remoteJid === 'status@broadcast') {
                await viewAndLike(msg.key);
                return;
            }
        }

        if (status.key && status.key.remoteJid === 'status@broadcast') {
            await viewAndLike(status.key);
            return;
        }

        if (status.reaction && status.reaction.key.remoteJid === 'status@broadcast') {
            await viewAndLike(status.reaction.key);
            return;
        }
    } catch (error) {
        console.error('❌ Error in auto status view:', error.message);
    }
}

module.exports = {
    autoStatusCommand,
    handleStatusUpdate
};
