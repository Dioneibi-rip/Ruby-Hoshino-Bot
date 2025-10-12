async function handler(m, { conn, args, usedPrefix, command }) {

  let who;
  if (m.isGroup) {
    who = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : false;
  } else {
    who = m.chat;
  }

  if (!who) {
    return m.reply(`${emoji} ᥱ𝗍і𝗊ᥙᥱ𝗍ᥲ ᥆ rᥱs⍴᥆ᥒძᥱ ᥲᥣ mᥱᥒsᥲȷᥱ ძᥱᥣ ᥙsᥙᥲrі᥆ ᥲᥣ 𝗊ᥙᥱ 𝗊ᥙіᥱrᥱs 𝗍rᥲᥒs𝖿ᥱrіr.`);
  }

  const amountText = args.find(arg => !arg.startsWith('@') && isNumber(arg));
  if (!amountText) {
      return m.reply(`(๑•̌ . •̑๑)ˀ̣ˀ̣  ძᥱᑲᥱs ᥱs⍴ᥱᥴі𝖿іᥴᥲr ᥣᥲ ᥴᥲᥒ𝗍іძᥲძ ძᥱ ${m.moneda} 𝗊ᥙᥱ 𝗊ᥙіᥱrᥱs transferir.\n> *ᥱȷᥱm⍴ᥣ᥆:* ${usedPrefix + command} 1000 @usuario`);
  }

  const count = Math.min(Number.MAX_SAFE_INTEGER, Math.max(1, parseInt(amountText)));
  const user = global.db.data.users[m.sender];
  const type = 'coin';
  const bankType = 'bank';

  if (user[bankType] < count) {
    return m.reply(`⚠️ ᥒ᥆ 𝗍іᥱᥒᥱs sᥙ𝖿іᥴіᥱᥒ𝗍ᥱs ${m.moneda} ᥱᥒ ᥱᥣ ᑲᥲᥒᥴ᥆ ⍴ᥲrᥲ rᥱᥲᥣіzᥲr ᥣᥲ transferenciᥲ.`);
  }
  
  if (!(who in global.db.data.users)) {
    return m.reply(`❌ ᥱᥣ ᥙsᥙᥲrі᥆ ᥒ᥆ sᥱ ᥱᥒᥴᥙᥱᥒ𝗍rᥲ ᥱᥒ mі ᑲᥲsᥱ ძᥱ datos.`);
  }

  if (who === m.sender) {
    return m.reply(`❌ ᥒ᥆ ⍴ᥙᥱძᥱs 𝗍rᥲᥒs𝖿ᥱrіr𝗍ᥱ ძіᥒᥱr᥆ ᥲ 𝗍і mіsm᥆.`);
  }

  user[bankType] -= count;
  global.db.data.users[who][type] += count;

  const mentionText = `@${who.split('@')[0]}`;
  
  m.reply(`✅ ¡𝗍rᥲᥒs𝖿ᥱrᥱᥒᥴіᥲ ᥱ᥊і𝗍᥆sᥲ!\n\n› һᥲs ᥱᥒ᥎іᥲძ᥆ *${count.toLocaleString()} ${m.moneda}* ᥲ ${mentionText}.\n› 𝗍ᥱ 𝗊ᥙᥱძᥲᥒ *${user[bankType].toLocaleString()} ${m.moneda}* en el banco.`, null, { mentions: [who] });
}

handler.help = ['pay <cantidad> @usuario'];
handler.tags = ['rpg'];
handler.command = ['pay', 'transfer'];
handler.group = true;
handler.register = true;

export default handler;

function isNumber(x) {
  if (typeof x === 'string') {
    x = x.trim();
  }
  return !isNaN(x) && x !== '';
}