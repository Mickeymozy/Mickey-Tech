// 📦 Mickey-Tech GitHub Repo Command (no buttons, sequential replies)

const REPO_URL = "https://github.com/Mickeymozy/MICKEY-TECH";
const SUPPORT_PHONE = "+255612130873";

/**
 * Sends repo info, then replies with repo URL and support phone.
 * @param {object} sock - WhatsApp socket instance
 * @param {string} chatId - Recipient chat ID
 */
async function githubCommand(sock, chatId) {
  const infoText = [
    *📁 *Mickey-Tech-Bot Repo ya Kibinafsi*

Karibu kwenye makao rasmi ya **Mickey-Tech Bot** — suluhisho la haraka, kisasa, na la Kitanzania.

✅ **Nunua ufikiaji** kwa masasisho ya kipekee na msaada wa haraka.  
📢 **Jiunge na channel yetu ya Telegram** kwa taarifa mpya, matoleo, na mazungumzo ya ndani ya timu.

_Imewezeshwa na Mickey-Mozy — teknolojia kwa ujasiri._
  ].join("\n");

  await sock.sendMessage(chatId, { text: infoText });
  await sock.sendMessage(chatId, { text: `🔗 Repo: ${REPO_URL}\n📞 Support: ${SUPPORT_PHONE}` });
}

module.exports = { githubCommand };
