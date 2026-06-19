const handler = (m) => m;

export async function all(m) {
  for (const user of Object.values(global.db.listUsers())) {
    if (user.premiumTime != 0 && user.premium) {
      if (new Date() * 1 >= user.premiumTime) {
        user.premiumTime = 0;
        user.premium = false;
        const JID = Object.keys(global.db.listUsers()).find((key) => global.db.getUser(key) === user);
        const usuarioJid = JID.split`@`[0];
        const textoo = `「✐」@${usuarioJid} Se agotó tu tiempo como usuario premium`;
        await this.sendMessage(JID, {text: textoo, mentions: [JID]}, {quoted: m });
      }
    }
  }
}
