const handler = (m) => m;

export async function all(m) {
  for (const [JID, user] of Object.entries(global.db.listUsers())) {
    if (user.premiumTime != 0 && user.premium) {
      if (new Date() * 1 >= user.premiumTime) {
        global.db.updateUser(JID, { premiumTime: 0, premium: false });
        const usuarioJid = JID.split`@`[0];
        const textoo = `「✐」@${usuarioJid} Se agotó tu tiempo como usuario premium`;
        await this.sendMessage(JID, {text: textoo, mentions: [JID]}, {quoted: m });
      }
    }
  }
}
