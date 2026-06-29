let proposals = {};

async function loadMarriages() {
  if (global.db.data && !global.db.data.marriages) {
    global.db.data.marriages = {};
  }
  return global.db?.getSection?.('marriages') || global.db?.data?.marriages || {};
}

function isUserMarried(marriages, user) {
  return Boolean(global.db.getUser?.(user)?.marry || marriages[user]?.partner);
}

function getPartner(marriages, user) {
  return global.db.getUser?.(user)?.marry || marriages[user]?.partner || '';
}

const handler = async (m, { conn, command, participants, usedPrefix }) => {
  const normalizeToJid = (rawJid) => {
    if (!rawJid || typeof rawJid !== 'string') return rawJid;
    if (!rawJid.endsWith('@lid')) return rawJid;
    const pInfo = participants?.find(p => p?.lid === rawJid);
    return pInfo?.id || rawJid;
  };

  const isPropose = /^marry$/i.test(command);
  const isDivorce = /^divorce$/i.test(command);
  const marriages = await loadMarriages();

  try {
    let proposerJid = normalizeToJid(m.sender);
    
    if (global.db.getUser) global.db.getUser(proposerJid);

    if (isPropose) {
      const rawProposee = m.quoted?.sender || m.mentionedJid?.[0];

      if (!rawProposee) {
        if (isUserMarried(marriages, proposerJid)) {
          let partner = getPartner(marriages, proposerJid);
          let partnerName = conn.getName(partner) || `@${partner.split('@')[0]}`;
          return await conn.reply(m.chat, `《✧》 Ya estás casado con *${partnerName}*\n> Puedes divorciarte con el comando: *${usedPrefix}divorce*`, m);
        } else {
          throw new Error(`Debes mencionar a alguien para proponer o aceptar matrimonio.\n> Ejemplo » *${usedPrefix + command} @Usuario*`);
        }
      }

      let proposeeJid = normalizeToJid(rawProposee);
      if (global.db.getUser) global.db.getUser(proposeeJid);

      if (isUserMarried(marriages, proposerJid)) {
        let partner = getPartner(marriages, proposerJid);
        throw new Error(`Ya estás casado con @${partner.split('@')[0]}.`);
      }
      if (isUserMarried(marriages, proposeeJid)) {
        throw new Error(`@${proposeeJid.split('@')[0]} ya está casado(a).`);
      }
      if (proposerJid === proposeeJid) throw new Error('¡No puedes proponerte matrimonio a ti mismo!');

      if (proposals[proposeeJid] === proposerJid) {
        delete proposals[proposeeJid];

        const fecha = Date.now();
        if (typeof global.db.setMarriagePair === 'function') {
          global.db.setMarriagePair(proposerJid, proposeeJid, fecha);
        } else {
          let user1 = global.db.getUser?.(proposerJid);
          let user2 = global.db.getUser?.(proposeeJid);
          if (user1) user1.marry = proposeeJid;
          if (user2) user2.marry = proposerJid;
          
          // Guardar explícitamente en la sección marriages de la BD local
          if (global.db.data) {
             if (!global.db.data.marriages) global.db.data.marriages = {};
             global.db.data.marriages[proposerJid] = { partner: proposeeJid, date: fecha };
             global.db.data.marriages[proposeeJid] = { partner: proposerJid, date: fecha };
          }
        }
        await global.db.write?.();

        let proposerName = conn.getName(proposerJid) || `@${proposerJid.split('@')[0]}`;
        let proposeeName = conn.getName(proposeeJid) || `@${proposeeJid.split('@')[0]}`;

        return await conn.sendMessage(m.chat, {
          text: `✩.･:｡≻───── ⋆♡⋆ ─────.•:｡✩\n\n¡Se han Casado! ฅ^•ﻌ•^ฅ*:･ﾟ✧\n\n*•.¸♡ Esposo(a):* ${proposeeName}\n*•.¸♡ Esposo(a):* ${proposerName}\n\n\`Disfruten de su luna de miel\`\n\n✩.･:｡≻───── ⋆♡⋆ ─────.•:｡✩`,
          mentions: [proposerJid, proposeeJid]
        }, { quoted: m });

      } else {
        proposals[proposerJid] = proposeeJid;

        let proposerName = conn.getName(proposerJid) || `@${proposerJid.split('@')[0]}`;
        let proposeeName = conn.getName(proposeeJid) || `@${proposeeJid.split('@')[0]}`;

        setTimeout(() => {
          if (proposals[proposerJid] === proposeeJid) {
            delete proposals[proposerJid];
            conn.sendMessage(m.chat, { text: `*《✧》Se acabó el tiempo. La propuesta de matrimonio de @${proposerJid.split('@')[0]} fue cancelada.*`, mentions: [proposerJid] });
          }
        }, 120000);

        return await conn.sendMessage(m.chat, {
          text: `♡ ${proposeeName}, el usuario ${proposerName} te ha enviado una propuesta de matrimonio. ¿Aceptas? •(=^●ω●^=)•\n\n⚘ *Responde con:*\n> ● *_${usedPrefix + command} @${proposerJid.split('@')[0]}_* para confirmar.\n> ● La propuesta expirará en 2 minutos.`,
          mentions: [proposerJid, proposeeJid]
        }, { quoted: m });
      }

    } else if (isDivorce) {
      if (!isUserMarried(marriages, proposerJid)) throw new Error('No estás casado con nadie.');
      let partner = getPartner(marriages, proposerJid);

      if (typeof global.db.divorcePair === 'function') {
        global.db.divorcePair(proposerJid);
      } else {
        let userDb = global.db.getUser?.(proposerJid);
        let partnerDb = global.db.getUser?.(partner);
        if (userDb) delete userDb.marry;
        if (partnerDb) delete partnerDb.marry;
        
        if (global.db.data?.marriages) {
            delete global.db.data.marriages[proposerJid];
            delete global.db.data.marriages[partner];
        }
      }
      await global.db.write?.();

      await conn.reply(m.chat, `✐ ${conn.getName(proposerJid)} y ${conn.getName(partner)} se han divorciado.`, m, { mentions: [proposerJid, partner] });
    }
  } catch (error) {
    await conn.reply(m.chat, `《✧》 ${error.message}`, m, { mentions: m.mentionedJid || [] });
    return false;
  }
};

handler.tags = ['fun'];
handler.help = ['marry *@usuario*', 'divorce'];
handler.command = ['marry', 'divorce'];
handler.group = true;

export default handler;