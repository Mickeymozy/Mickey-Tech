// 📦 Mickey-Tech GitHub Repo Command (no buttons, sequential replies)

const REPO_URL = "https://github.com/Mickeymozy/MICKEY-TECH";
const SUPPORT_PHONE = "+255612130873";

/**
 * Sends repo info, then replies with repo URL and support phone.
 * @param {object} sock - WhatsApp socket instance
 * @param {string} chatId - Recipient chat ID
 */
async function githubCommand(sock, chatId, message) {
  // Inform user to contact the owner and send vCard
  const infoText = 'ℹ️ Ili kupata taarifa zaidi, tafadhali wasiliana na mimi moja kwa moja kwa kupiga simu au kutuma ujumbe. Ninakutumia mawasiliano yangu sasa.';
  await sock.sendMessage(chatId, { text: infoText });
  // Send owner's vCard
  await sock.sendMessage(chatId, {
    contacts: {
      displayName: 'Mickey Owner',
      contacts: [
        {
          vcard: [
            'BEGIN:VCARD',
            'VERSION:3.0',
            'FN:Mickey Owner',
            'TEL;type=CELL;waid=255612130873:+255 612 130 873',
            'END:VCARD'
          ].join('\n')
        }
      ]
    }
  });
}

module.exports = { githubCommand };
